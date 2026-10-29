# PARITY_V10_LIMITS.md — V6 (Phase 9 đợt 10): đối chiếu preview–render + click-test + benchmark

Luồng đo lường/kiểm chứng độc lập. KHÔNG sửa logic của luồng khác; chỉ
viết harness/test của chính luồng này. KHÔNG push, KHÔNG tag/release,
KHÔNG binary mới, KHÔNG code giả.

## 1. File của luồng V6 (3 file, toàn text)

- `server/render/src/test_v10_parity.js` — harness đối chiếu Node zero-deps.
  Chạy từ `server/render/`: `node src/test_v10_parity.js`.
- `apps/web/scripts/v10-parity-clicktest.cjs` — click-test CDP Chromium
  headless, tái dùng mẫu M6 (Node + WebSocket có sẵn, không Playwright).
  Chạy từ `apps/web/`: `node scripts/v10-parity-clicktest.cjs`.
- `docs/PARITY_V10_LIMITS.md` — file này.

Mẫu click-test cũ tái dùng được: `apps/web/scripts/m6-motion-clicktest.cjs`
(CDP + Chromium trong `~/.cache/ms-playwright/chromium-1248/`). Một điểm
khác mẫu cũ: vite binary nằm ở root `node_modules/.bin/vite` (npm
workspaces hoist), không phải `apps/web/node_modules/.bin/vite` — harness
đã thử root trước, nếu chỉ thử apps/web sẽ báo lỗi giả.

## 2. Phương pháp đo (đọc kỹ trước khi tin bảng)

- Nguồn tổng hợp bằng Node (raw RGB, không ảnh thật): transition dùng
  A = đỏ thuần, B = xanh dương thuần; effect dùng nguồn bất đối xứng
  trái/phải (mirror) và pattern theo tọa độ (pixelate/sharpen).
- Kích thước 72x45 @30fps, frame giữa transition t = 1.5s (offset 1s,
  duration 1s, input 2s mỗi bên → output 3s, frame index 45).
- Render bằng FFmpeg 8.1.2 thật qua đúng hàm của render worker
  (`buildXfadeFilter`, `buildEffectFilter`, `buildTextAnimExpr`), không
  tự chế filter tay (trừ drawtext dùng đúng expr do `buildTextAnimExpr`
  trả về).
- Preview: import hàm thuần của luồng khác NẾU ĐÃ CÓ trên đĩa, không
  thì ghi PENDING — không bịa số preview:
  - V2 `effectCanvas.ts` ĐÃ CÓ → transpile bằng tsc của root sang /tmp
    rồi require, chạy thật trên cùng nguồn.
  - V1 `transitionPreview` CHƯA CÓ trên đĩa lúc chạy (preview.tsx chỉ
    mô phỏng fade qua alpha; các xfade khác chỉ là minh họa CSS) → mọi
    case transition trừ fade đều PENDING phía preview.
  - V4 text animation parity (ASS/PNG) CHƯA CÓ module thuần trên đĩa
    (TextAnimPicker chỉ là preview CSS) → phía preview PENDING; harness
    chỉ đo phía render.
  - V3 transition custom-expr mới ĐÃ CÓ trên đĩa lúc chạy (14 type mới
    trong catalog, xem §5) → benchmark lấy type mới đầu tiên.
  - V5 badge: badge transition đã có trong TransitionPanel
    (`previewStatus.ts`); EffectPanel KHÔNG có badge nào trong code nên
    click-test không kiểm tra badge effect (ghi rõ, không bịa).
- Ngưỡng phân loại: KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8/kênh;
  XẤP XỈ = MAD ≤ 20 và ≥ 90% pixel lệch ≤ 32/kênh; còn lại là LỆCH.
  "KHỚP pixel" ở đây chỉ đúng nguồn tổng hợp đã nêu, không phải claim
  khớp mọi video thật.

## 3. Bảng đối chiếu (số đo thật, chạy cuối 26/10)

| Case | Render đo được | Preview | Kết luận |
|---|---|---|---|
| fade (P=0.5) | mean RGB (127.0, 0, 127.0) | công thức preview.tsx alpha=localT/duration → (127.5, 0, 127.5) | KHỚP, sai số max 0.5 |
| wipeleft (P=0.5) | split-x hàng giữa 37 (lý tưởng ~36, W=72); B nửa trái 0.0%, nửa phải 97.2% | PENDING (V1 chưa có) | Chỉ đo render, chưa đối chiếu |
| circlecrop (P=0.5) | tâm (255,0,0); đỏ 1/3240 pixel, xanh 0, đen 3239 | PENDING (V1 chưa có) | Chỉ đo render — xem §4, hành vi này khác suy đoán thông thường |
| dissolve (P=0.5) | giống B 50.8%, giống A 49.2%, còn lại 0.0% | PENDING (V1 chưa có) | Chỉ đo render; dissolve theo hạt nên không kỳ vọng tỉ lệ cố định |
| custom-expr diamondclose (V3 mới) | B 50.7%, A 49.3%, pattern xen kẽ | PENDING (V1 chưa có) | Chỉ đo render + bench (§5) |
| mirror (hflip, int. 0.5) | render vs effectCanvas applyMirror | applyMirror chạy thật | KHỚP: MAD 0.00, ≤8: 100.0% |
| pixelate (int. 0.5, k=9) | render vs effectCanvas applyPixelate | applyPixelate chạy thật | LỆCH: MAD 26.75, ≤8: 0.0%, ≤32: 87.5% — xem §4 |
| sharpen (int. 0.5, amount 1.1) | render vs effectCanvas applySharpen | applySharpen chạy thật | XẤP XỈ: MAD 1.04, ≤8: 97.2%, ≤32: 100.0% |
| text fadeUp | công thức alpha t=2.0→0.00, 2.3→0.50, 2.6→1.00; frame drawtext thật 320x180 chữ trắng/nền đen (ngưỡng >100): t=2.0: 0 pixel (max 0), t=2.3: 276 pixel (max 127, đúng alpha 0.5), t=2.6: 346 pixel (max 255) | PENDING (V4 chưa có module thuần) | Render đúng hướng; chưa đối chiếu preview |

Số lặp lại ổn định giữa các lần chạy: pixelate MAD 26.75, sharpen MAD
1.04, text 276/346 pixel, circlecrop đúng 1 pixel đỏ — không phải nhiễu
ngẫu nhiên (trừ dissolve theo hạt).

## 4. Phát hiện trung thực (không phải bug chắc chắn, cần luồng liên quan xem)

1. **Pixelate LỆCH là có cơ sở, không phải lỗi harness.** Preview lấy màu
   pixel góc trái-trên của khối; FFmpeg scale neighbor khi thu nhỏ lấy
   mẫu tại điểm khác trong khối nên màu khối lệch hệ thống (MAD 26.75
   trên nguồn pattern). Trên nguồn phẳng 1 màu thì hai bên sẽ trùng —
   LỆCH này chỉ đúng với nguồn có chi tiết trong khối. Cần V2/V3 quyết
   định: đổi điểm lấy mẫu của preview về đúng điểm FFmpeg dùng, hoặc
   chấp nhận nhãn "xấp xỉ" cho pixelate.
2. **Pixelate của render co khung khi kích thước không chia hết cho k.**
   Đo thật: nguồn 64x48, k=9 → output 63x45 (8505 byte thay vì 9216),
   vì scale `iw/9` làm tròn xuống (7) rồi nhân ngược (63). Video thật
   có kích thước không chia hết cho k sẽ bị lệch 1 khung hình so với
   spec nếu pipeline không pad/scale lại. Harness tránh bằng cách dùng
   72x45 (chia hết cho 9); harness có guard báo LỆCH kèm kích thước
   thay vì để NaN nếu trường hợp này tái diễn.
3. **Circlecrop giữa transition gần như toàn đen.** Không phải "tâm A /
   ngoài B": đĩa A co về ~1 điểm ở tâm rồi đĩa B mới nở ra từ tâm (cuối
   transition tâm mới sang B, ngoài vẫn đen). Catalog mô tả "cảnh cũ co
   dần thành vòng tròn rồi biến mất" không sai, nhưng ai đọc lướt sẽ
   tưởng ngoài đĩa là B — không phải. Preview của V1 (khi làm
   circlecrop) phải mô phỏng nền đen, không phải nền B.
4. **Sharpen XẤP XỈ, không KHỚP.** Render unsharp 5x5 vs preview box-blur
   3x3: MAD 1.04, 97.2% pixel trong ±8 — gần nhưng không khớp hẳn. Đây
   là mức xấp xỉ tốt, không nên nâng thành "khớp" và cũng chưa đủ căn
   cứ gọi là bug.
5. **Text fadeUp: ngưỡng đo quan trọng.** Alpha 0.5 blend chữ trắng trên
   nền đen chỉ cho giá trị ~127, nên ngưỡng >200 đếm thiếu (lần chạy đầu
   báo 0 pixel ở t=2.3 là sai do ngưỡng, đã sửa thành >100 và kiểm chứng
   lại: 276 pixel, max đúng 127).

## 5. Benchmark (1 lần chạy mỗi case, chỉ đúng máy đo)

Máy đo: VM 2 CPU, Linux x64, FFmpeg 8.1.2. Thời gian render dao động
theo tải máy giữa các lần chạy nên dưới đây ghi cả lần chạy cuối và
khoảng quan sát được (4 lần chạy harness):

| Case | Lần cuối | Khoảng quan sát |
|---|---|---|
| transition fade (72x45, 3s) | 156 ms | 119–205 ms |
| transition custom-expr diamondclose (V3 mới, 72x45, 3s) | 166 ms | 166–384 ms |
| effect pixelate (72x45, 1 frame) | 108 ms | 99–263 ms |

Thời gian hàm preview (cùng nguồn, trong tiến trình Node): mirror 2 ms,
pixelate 1 ms, sharpen 7 ms — nhanh hơn render 1–2 bậc nhưng đây là hàm
thuần trên 1 frame nhỏ, không so được trực tiếp với thời gian render
FFmpeg cả pipeline.

14 transition custom-expr mới của V3 phát hiện trên đĩa lúc chạy (harness
tự liệt kê từ catalog, không hardcode): diamondclose, squareopen,
squareclose, checker-alt, blinds-diag, split-h, split-v, barn-h, barn-v,
rings, corners, star, clock-ccw, spiral. Benchmark lấy diamondclose (type
mới đầu tiên); 13 type còn lại chưa benchmark riêng.

## 6. Click-test browser thật — PASS 6/6, không SKIP

Môi trường: vite dev riêng cổng 5190, Chromium headless
`~/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome` qua CDP,
profile `/tmp/v10-cdprof`. Kết quả:

- V0 load sample: PASS (project mẫu ≥ 3 clip).
- V0b welcome modal: PASS (không có modal tự mở / đã đóng nếu có).
- V1 chọn clip video: PASS — TransitionPanel (.tr-panel) + EffectPanel
  (.effects-panel) cùng hiện, section "Chuyển cảnh" và "Hiệu ứng" đều có.
- V2 click card transition fade: PASS — card selected=true, badge
  data-preview='matched', nhãn '✓ preview khớp', app còn sống.
- V3 click toggle effect "Lật ngang": PASS — off → on, app còn sống.
- V4 click lại để tắt: PASS — on → off, app còn sống (trả state sạch).

Không có case BLOCKED: browser chạy được trên VM này. Badge effect
không được kiểm tra vì EffectPanel không có badge trong code (xem §2) —
đó là thiếu sót của UI (nếu V5 định làm badge effect) chứ không phải
lỗi click-test.

## 7. PENDING / chưa làm (không giấu)

- Đối chiếu preview cho wipeleft, circlecrop, dissolve, custom-expr:
  PENDING vì V1 chưa có module transitionPreview trên đĩa.
- Đối chiếu preview cho text animation (fadeUp và nhóm V4): PENDING vì
  V4 chưa có module thuần trên đĩa.
- Benchmark riêng cho 13/14 custom-expr V3 còn lại: chưa làm (chỉ
  benchmark diamondclose).
- Đối chiếu các effect canvas còn lại (noise, glitch, rgb-shift, shake,
  edgedetect): chưa làm — noise/glitch theo seed/thời gian nên cần
  thiết kế case riêng, không gộp bừa vào bảng này.
- Harness chạy lại được: `node src/test_v10_parity.js` sẽ tự phát hiện
  module V1/V4 khi chúng xuất hiện trên đĩa và chuyển PENDING thành số
  đo (trừ fade đã có công thức); không cần sửa harness.
