# Phase 9 đợt 11 P4 — Text: \clip theo hộp chữ + 4 animation vào picker (LIMITS)

Ngày: 2026-10-27. Luồng P4 trong đợt lớn Phase 9 đợt 11. KHÔNG push,
KHÔNG tag/release, KHÔNG binary vào batch (chỉ file text; script đo hộp
là code, không phải asset).

Nợ mở đã đóng (từ `docs/PHASE9_ROUND10_PREVIEW_PARITY_LIMITS.md` §3–§4):
1. "\clip quét theo khung hình, không theo hộp chữ" — ĐÃ SỬA ở render.
2. "Đưa 4 animation mới vào TextAnimPicker + i18n" — ĐÃ XONG.

## 1. Đã làm gì

### Render: \clip quét theo hộp chữ thật
- Mới `server/render/src/measure_text.py`: đo hộp chữ bằng PIL —
  cùng font file (resolve qua fontconfig như `render_text_png.py`), cùng
  size làm tròn, cùng metrics (`getbbox` từng dòng + `getmetrics`).
  Trả JSON `{width, height}`; lỗi → exit != 0 để caller fallback.
- `server/render/src/textAnimParity.js`:
  - `parityOverride()` nhận thêm `box {x0,x1,y0,y1}`: slideReveal quét
    từ mép trái hộp tới mép phải hộp trong 1.0s; curtainIn mở từ tâm
    hộp ra hai mép hộp trong 0.8s. Không box → fallback quét khung
    hình như đợt 10 (tương thích ngược, self-test cũ giữ nguyên).
  - `textBoxRect()` đổi hộp PIL → hình chữ nhật khung: tâm hộp = tâm
    `\pos` của clip, clamp mép khung, Y mở ±2px chống cắt descender.
  - tiltIn/skewIn không dùng `\clip` nên không đổi.
- `server/render/src/render.js` (nhánh parity): trước khi dựng ASS, đo
  hộp từng clip parity bằng `measure_text.py`; clip đo thất bại → log
  cảnh báo rõ + fallback quét khung hình cho clip đó, không fail render.

### Phát hiện quan trọng: libass vẽ hẹp hơn PIL ~0.84 lần
Đo trực tiếp bằng probe ASS + frame thật (không đoán): cùng font file,
cùng size, libass qua filter `subtitles` (PlayRes = kích thước khung)
vẽ chữ hẹp hơn PIL/FreeType một hệ số gần như hằng số:
- DejaVu Sans 48/64/76/96: tỉ lệ 0.837 / 0.841 / 0.840 / 0.837.
- DejaVu Serif 720p: 0.846. DejaVu Sans Bold "XIN CHÀO": 0.849.
- Chiều dọc (caps): 0.851.
Hệ số `LIBASS_SCALE = 0.84` áp đều cho w và h trong `textBoxRect()`.
Nguyên nhân gốc chưa xác định (nghi scale nội bộ của libass/subtitles)
nên đây là hiệu chuẩn thực nghiệm cho đúng pipeline này, không phải
hằng số phổ quát — test render pixel cuối đợt sẽ bắt nó nếu FFmpeg/
libass đổi hành vi.

### Preview mirror: quét theo hộp chữ của chính preview
- `apps/web/src/lib/previewEngine.ts`: slideReveal/curtainIn dùng hộp đo
  bằng canvas (`m.textW/textH`, nguồn đo của `preview.tsx`) thay vì
  khung hình; clamp mép khung; cập nhật comment + doc của `clipRect`.
- Hành vi khớp render (quét trọn hộp trong đúng thời lượng), nhưng
  tọa độ tuyệt đối khác render — xem §2.

### Picker + i18n
- `apps/web/src/components/textfx/TextAnimPicker.tsx`: thêm 4 animation
  vào union `TextAnimation`, danh sách `TEXT_ANIMATIONS` (18 → 22 ô)
  và `PREVIEW_CLASS`.
- `apps/web/src/components/textfx/textfx.css`: 4 class preview loop
  (`tx-prev-tiltIn/skewIn/slideReveal/curtainIn`) theo đúng keyframes
  gốc của preset (xoay -12°, skew -25°→+8°→0°, clip-path inset).
- `apps/web/src/i18n/vi.json` + `en.json`: thêm 8 key
  `textanim.opt.{tiltIn,skewIn,slideReveal,curtainIn}.{label,desc}`.
- `packages/video-spec/src/textfx.ts`: mô tả slideReveal/curtainIn đổi
  từ "quét khung hình" sang "theo hộp chữ".

### Test cập nhật theo hành vi mới
- `server/render/src/test_text_anim_parity.js` T3/T4: kỳ vọng hộp chữ
  (xem §3). `test_text_anim_parity_measure.py`: chỉ sửa docstring.
- `apps/web/src/lib/textAnimParity.test.ts`: kỳ vọng clipRect hộp chữ
  với `M = {textW: 200, textH: 64}`.

## 2. Giới hạn trung thực — đọc trước khi claim "khớp"

- **Hộp đo của preview và render khác nhau, có chủ ý.** Preview đo bằng
  canvas của trình duyệt (≈ PIL, không nhân 0.84); render đo bằng PIL
  rồi nhân 0.84 cho khớp libass. Cả hai quét trọn hộp của chính mình
  trong đúng thời lượng, nhưng tọa độ clip tuyệt đối lệch nhau tới
  ~20% bề rộng chữ. Không thể dùng chung một hộp: nếu preview dùng hộp
  render (×0.84) thì chữ preview (vẽ rộng hơn) sẽ bị cắt cụt ở trạng
  thái cuối. Đây là lệch đo canvas-vs-libass có từ trước (ảnh hưởng mọi
  vị trí text, không riêng clip), nay lộ rõ hơn vì clip bám theo hộp.
- **LIBASS_SCALE 0.84 là hiệu chuẩn thực nghiệm**, đo trên DejaVu/
  Liberation họ sans/serif + chuỗi ASCII/tiếng Việt có dấu, chưa đo
  trên mọi font (đặc biệt font display, font có kerning mạnh, emoji).
  Font lạ có thể lệch vài % — test pixel sẽ thấy, nhưng không có cơ
  chế tự hiệu chuẩn theo font trong đợt này.
- **\t nội suy \clip tuyến tính**, khác CSS ease (cubic-bezier) của
  preset gốc — thời gian lộ ở giữa hiệu ứng lệch nhẹ so với CSS.
- **\fad tuyến tính thay cho CSS ease-out** (nợ cũ từ đợt 10, chưa sửa).
- **Hộp nền `backgroundColor`**: libass vẽ nền với padding riêng nên mép
  nền có thể lệch khỏi mép hộp chữ vài px trong lúc đang quét.
- **Mirror `.js` chưa đồng bộ**: `packages/video-spec/src/textfx.js`
  vẫn ghi mô tả cũ "quét khung hình" (cùng họ lệch mirror đã ghi ở
  đợt 10: web dùng export `.ts` qua Vite nên picker không ảnh hưởng;
  đừng dùng file `.js` làm căn cứ, cần regenerate bằng tsc ở đợt sau).
- **Không đụng** `effectCanvas.ts`, `previewStatus.ts`, `nestedPreview`
  (theo phân luồng); badge preview cho 4 animation mới chưa làm —
  picker demo CSS không phải badge trạng thái của V5.

## 3. Kiểm chứng thật (không mock)

| Kiểm tra | Kết quả |
|---|---|
| `textAnimParity.js --self-test` (gồm assertion hộp chữ mới + fallback khung cũ) | PASS |
| `test_text_anim_parity.js` render FFmpeg thật + đo pixel PIL | 18/18 PASS |
| T3 slideReveal t=0.3: hộp lộ [218,277] (dự đoán mép 278) | ✅ điểm phân biệt: quét khung cũ ở 0.3s cho count=0 |
| T3 t=0.45: [218,311] (dự đoán mép 310); t=1.5: maxX 424 (đủ chữ) | ✅ |
| T4 curtainIn t=0.4: khe [262,377] (dự đoán [262,378]); t=1.5: [204,435] (hộp dự đoán [204,436]) | ✅ |
| T1 tiltIn / T2 skewIn / R1 fadeUp regression | ✅ không đổi |
| `textAnimParity.test.ts` (preview mirror, strip-types) | 8/8 PASS |
| i18n parity vi/en (script flatten JSON) | 720/720 key, thiếu 0 cả hai chiều |
| `tsc --noEmit` (apps/web) | 0 lỗi |
| `vite build` | PASS (cảnh báo chunk > 500kB có từ trước) |

## 4. File đổi/thêm (tương đối từ repo root)

- `server/render/src/measure_text.py` (mới)
- `server/render/src/textAnimParity.js`
- `server/render/src/render.js`
- `server/render/src/test_text_anim_parity.js`
- `server/render/src/test_text_anim_parity_measure.py` (docstring)
- `apps/web/src/lib/previewEngine.ts`
- `apps/web/src/lib/textAnimParity.test.ts`
- `apps/web/src/components/textfx/TextAnimPicker.tsx`
- `apps/web/src/components/textfx/textfx.css`
- `apps/web/src/i18n/vi.json`
- `apps/web/src/i18n/en.json`
- `packages/video-spec/src/textfx.ts`
- `docs/PHASE9_ROUND11_P4_TEXTCLIP_LIMITS.md` (mới, file này)
