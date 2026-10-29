# TEXT_ANIM_PARITY_LIMITS.md — Giới hạn trung thực của text animation parity (rotate/skew/clip)

Tài liệu này thuộc Phase 9 đợt 10, luồng V4 (gap C5): các CSS preset dùng
`rotate` / `skew` / `clip-path` trước đây chỉ đẹp ở preview mà render
(drawtext) thì mất hiệu ứng. Ngày: 2026-10-26.

## Audit (so sánh preview CSS vs đường render cũ)

| Nhóm CSS preset | Ví dụ | Lệch trước đợt này | Sau đợt này |
|---|---|---|---|
| Xoay (rotate) | `vcut-tilt-in` (−12°→0), `animate-css-rotateIn`, `vcut-spin-in`, `vcut-swirl-in`, `vcut-roll-in` | ❌ drawtext không xoay → render ra chữ thẳng đứng, mất hẳn hiệu ứng | ✅ `tiltIn` render thật qua ASS `\fr` + `\t` (đo pixel: top−bottom −40.5px lúc xoay vs −6.7px lúc đứng yên) |
| Nghiêng (skew) | `vcut-skew-in` (−25°→+8°→0), `vcut-skew-pop` | ❌ drawtext không skew → render ra chữ thẳng | ✅ `skewIn` render thật qua ASS `\fax = tan(góc CSS)` + `\t` (đo pixel: top−bottom +5.4px lúc nghiêng vs −0.1px lúc thẳng) |
| Cắt lộ dần (clip reveal) | `vcut-slide-reveal`, `vcut-curtain-in` | ❌ drawtext không clip → render ra chữ hiện đủ ngay | ✅ `slideReveal` / `curtainIn` render thật qua ASS `\clip` + `\t` (đo pixel: mép cắt đúng vị trí quét, chữ ngoài clip = 0 pixel) |
| Phóng to/thu nhỏ (scale) | `popIn` (drawtext), `vcut-zoom-in`, `animate-css-zoomIn` | ⚠️ `popIn` drawtext chỉ giả lập bằng nảy y (không scale thật); scale keyframes thì đã có đường PNG SR (K1) | Không đổi trong đợt này — scale cho animation (không phải keyframes) vẫn chưa có |
| Lật 3D (flip/rotateX/rotateY) | `animate-css-flipInX/Y`, `vcut-flip-in`, `vcut-flip-up` | ❌ Không có đường render | ❌ VẪN preview-only (xem §3) |
| Co giãn 1 trục (scaleX/scaleY riêng) | `vcut-stretch-in`, `vcut-grow-in`, `animate-css-rubberBand` | ❌ drawtext không scale trục riêng | ❌ VẪN preview-only (xem §3) |
| Giãn cách ký tự / gradient / text-stroke | `vcut-tracking-expand`, `vcut-gradient`, `vcut-outline` | ❌ drawtext 1 màu, không letter-spacing | ❌ VẪN preview-only (xem §3) |

## Làm được (đã kiểm chứng bằng MP4 thật + đo pixel)

| Animation | Cơ chế render (ASS, libass) | Kiểm chứng |
|---|---|---|
| `tiltIn` | `\fr-12` + `\move(y+20→y, 0–700ms)` + `\fad(700,0)` + `\t(0,700,\fr0)` | `test_text_anim_parity.js` T1: 17/17 pass |
| `skewIn` | `\fax-0.466` (= tan −25°) + `\move(x−30→x, 0–360ms)` + `\fad(600,0)` + `\t(0,360,\fax0.1405)` + `\t(360,600,\fax0)` | `test_text_anim_parity.js` T2: 17/17 pass |
| `slideReveal` | `\clip(0,0,0,H)` + `\t(0,1000,\clip(0,0,W,H))`, không mờ | `test_text_anim_parity.js` T3: 17/17 pass |
| `curtainIn` | `\clip(giữa,0,giữa,H)` + `\fad(800,0)` + `\t(0,800,\clip(0,0,W,H))` | `test_text_anim_parity.js` T4: 17/17 pass |

Preview mirror: `textClipVisual` (nhánh 0b) + canvas `preview.tsx`
(xoay/nghiêng quanh tâm, cắt theo `clipRect`) — test
`apps/web/src/lib/textAnimParity.test.ts`: 8/8 pass; `tsc --noEmit` sạch.

## 1. Clip quét theo KHUNG HÌNH, không theo hộp chữ (lệch còn lại, đã công khai)

File ASS không biết bề rộng chữ đã render (libass tự đo khi vẽ), nên
`\clip` dùng tọa độ khung hình: `slideReveal` quét mép từ x=0 tới x=W
trong 1.0s, `curtainIn` mở từ giữa khung ra hai mép trong 0.8s. Hệ quả:

- Chữ bắt đầu lộ khi mép quét chạm mép trái chữ, và lộ đủ khi mép quét
  qua mép phải chữ — thời gian lộ *nhìn thấy* ngắn hơn thời lượng CSS
  (vd chữ REVEAL 208px ở giữa khung 640px: lộ trong khoảng 0.34s–0.67s
  của hiệu ứng 1.0s, thay vì trọn 1.0s như CSS `clip-path` theo hộp chữ).
- Preview mirror ĐÚNG công thức này (`clipRect` tính từ khung hình) nên
  preview khớp render — nhưng cả hai đều khác CSS gốc ở điểm trên.
- Cách làm đúng hoàn toàn (để dành đợt sau): đo bề rộng chữ trước khi
  dựng ASS (vd qua PNG của `render_text_png.py`) rồi đặt `\clip` theo
  hộp chữ — tốn 1 lần vẽ PNG cho mỗi clip parity, chưa làm.

## 2. Thứ tự thắng và những gì bị bỏ qua (đã cảnh báo bằng validator)

- Parity ASS thắng keyframes x/y/opacity/scale/rotation: clip parity bị
  bỏ qua hoàn toàn ở nhánh drawtext và nhánh PNG SR, chỉ vẽ bằng ASS.
  Validator cảnh báo khi clip parity có keyframes scale/rotation, và
  cảnh báo khi clip parity có track (track bị bỏ qua, chữ giữ vị trí
  tĩnh — giống typewriter/karaoke).
- Karaoke thắng parity: clip vừa có `karaoke` vừa có animation parity
  thì chỉ vẽ karaoke (tránh 2 lớp ASS chồng nhau); validator cảnh báo.
- Vị trí chữ parity theo TÂM (Alignment 5 của ASS, `\pos` = tâm) — khác
  drawtext (mép trái `(W−textW)*x`) nhưng khớp typewriter. Preview dùng
  cùng ngữ nghĩa tâm cho nhóm này.
- Clip ngắn hơn thời lượng hiệu ứng (tiltIn 0.7s / skewIn 0.6s /
  slideReveal 1.0s / curtainIn 0.8s) thì hiệu ứng bị cắt ngang ở cuối
  clip (dialogue ASS kết thúc cùng clip) — giống các animation drawtext
  khác, không kéo dài clip.

## 3. ASS tag nào libass KHÔNG hỗ trợ / preset nào vẫn preview-only

Đã thử hoặc đã đối chiếu với khả năng của libass (không đoán mò):

- `\frx` / `\fry` (xoay 3D quanh trục X/Y): libass có hỗ trợ một phần
  nhưng phối cảnh không khớp CSS `rotateX/rotateY` + `perspective`, và
  chưa kiểm chứng bằng pixel — nên flipInX/flipInY/flip-up KHÔNG làm
  trong đợt này, vẫn preview-only.
- `\fscx` / `\fscy` độc lập (scaleX/scaleY riêng): tag tồn tại nhưng
  nội suy `\t` với `\fscx` cho animation entrance chưa kiểm chứng, và
  scale đều đã có đường PNG SR cho keyframes — stretch-in/grow-in/
  rubberBand vẫn preview-only.
- Không có tag ASS cho letter-spacing động, gradient chữ, text-stroke
  hay vệt sáng quét (shine/shimmer): tracking-expand, gradient, outline,
  outline-glow, fire/ice/gold, shine, shimmer vẫn preview-only.
- `animate-css-rotateIn` / `rotateInDownLeft` / `spin-in` / `swirl-in` /
  `roll-in` / `swing` / `spin-slow` / `tada-soft` / `jiggle`: xoay liên tục
  hoặc xoay + scale kết hợp — chưa port (chỉ `tiltIn` là xoay entrance
  đơn giản đã port). Xoay 360° liên tục bằng ASS (`\fr` + `\t` lặp) là
  khả thi về mặt kỹ thuật nhưng chưa kiểm chứng, để dành đợt sau.
- `vcut-skew-pop` (skew + scale kết hợp): phần skew đã có (`skewIn`),
  phần scale chưa — vẫn preview-only ở dạng đầy đủ.

## 4. Xấp xỉ còn lại giữa preview và render (nhỏ, đã ghi)

- `\fad` của ASS mờ tuyến tính theo thời gian, trong khi CSS dùng
  `ease-out` — preview mirror bằng mờ tuyến tính (`alpha = localT/D`)
  nên preview khớp render, nhưng cả hai đều hơi khác đường cong CSS gốc
  (sai số lớn nhất giữa đường tuyến tính và ease-out, dưới ngưỡng nhận
  biết thông thường ở 0.6–0.8s).
- `\move` của ASS nội suy tuyến tính; CSS `ease-out` cũng tương tự như
  trên (preview mirror tuyến tính).
- Canvas preview vẽ hộp nền (`backgroundColor`) cũng bị cắt theo
  `clipRect` — khớp render (hộp nền là một phần của dialogue ASS nên
  cũng bị `\clip` cắt).
- Outline chọn (selection outline) trong editor vẫn vẽ hình chữ nhật
  trục song song, không xoay/nghiêng theo chữ — đó là chrome của
  editor, không phải nội dung render, nên không tính là lệch render.
- Clip vừa có animation parity vừa có karaoke: render vẽ karaoke,
  nhưng preview vẫn áp transform parity lên chữ karaoke (trường hợp
  biên; validator đã cảnh báo, xem §2).

## 5. Phạm vi kiểm chứng (trung thực)

- Vẽ canvas thật của preview (`preview.tsx`) KHÔNG được kiểm chứng bằng
  pixel (cần DOM/browser) — chỉ kiểm chứng bằng `tsc` + test hàm thuần
  `textClipVisual` + đọc code, giống quy ước của các đợt trước với
  đường vẽ canvas (xem MOTION_PREVIEW_LIMITS.md §7).
- Font đo pixel là DejaVu Sans (fontconfig của máy kiểm chứng); font
  khác có thể cho bề rộng chữ khác nhưng công thức góc/clip không đổi.
- TextAnimPicker (UI chọn animation) vẫn chỉ liệt kê 18 animation cũ
  (mirror local, chưa gồm 4 animation parity) + chưa có key i18n cho
  nhóm mới — người dùng vẫn dùng được 4 animation mới qua spec/API,
  nhưng chưa chọn được từ picker. Việc nối picker + i18n là việc UI
  riêng, để dành đợt sau (không thuộc phạm vi render/preview parity).
