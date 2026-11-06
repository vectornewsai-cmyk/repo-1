# Phase 9 đợt 22, luồng C — LIMITS: preview ngủ + tab ẩn/hiện + truy nguyên scrub chuột

> Luồng C đợt 22. Repo làm việc: `~/workspace/repo-1`, KHÔNG push
> GitHub, KHÔNG release/tag, KHÔNG code giả. Trả 2 nợ của đợt 21 T5:
> (1) chưa đo tab ẩn rồi hiện lại trong lúc preview ngủ; (2) scrub
> chuột qua automation thất bại cả trước và sau T5, chỉ mới kiểm
> chứng scrub qua phím L/ArrowRight.
> **Mọi số dưới đây đều đo trên VM này (2 vCPU, Xvfb, raster phần mềm,
> không GPU thật) và CẤM trích thành FPS trên máy user** — xem §6.

## 0. Kết luận ngắn (không vượt số đo)

1. **Scrub chuột KHÔNG bị bug app — thủ phạm là modal chào lần đầu:**
   click ruler đầu tiên trên profile mới bị `WelcomeModal` nuốt
   (backdrop `position:fixed; inset:0; z-index:100` phủ toàn màn hình,
   click backdrop = đóng modal theo thiết kế), ruler nhận 0 event,
   playhead không đổi. Đây là hành vi ĐÚNG của app, không phải bug
   — và là lý do mọi click-test automation trước đây (kể cả T5) đều
   "scrub chuột thất bại": script nào cũng chạy trên profile mới nên
   click đầu tiên luôn rơi vào modal, không bao giờ tới ruler.
   Sau khi modal đóng, scrub chuột hoạt động bình thường, đo được
   cả click đơn lẫn kéo (§2).
2. **Tab ẩn/hiện lúc ngủ — baseline đã đúng nhưng do may mắn:**
   trước sửa, ẩn tab 3 s rồi hiện lại: ticks đóng băng lúc ẩn (143),
   hiện lại tỉnh +7 ticks, vẽ lại đúng frame cũ (px hash không đổi),
   ngủ lại ngay (ticks đóng băng ở 150 suốt 3 s sau). Nhưng trong
   code cũ KHÔNG có listener visibility nào — vòng tỉnh nhờ trigger
   ngoài chưa xác định (lúc restore tab đo được resize=2, focus=1;
   riêng resize → wake chỉ giải thích được 1 tick/0 draw, không giải
   thích được chuỗi ~7–9 ticks + vẽ lại, nên chắc chắn còn trigger
   khác chưa khoanh được — xem §4). Bản sửa đợt này gắn
   `visibilitychange` + `pageshow` → ép vẽ lại frame cũ rồi ngủ lại
   một cách xác định, không dựa vào may mắn (§1, §3).
3. **Sau sửa, mọi đường vẫn đúng:** click đơn ruler 0 → 7,0 s; kéo
   ruler 0 → 7,0 → 8,0 s (clamp đúng duration); Space phát/dừng;
   ArrowRight đúng +1 frame (lastDrawn 2,1667 → 2,2000 ở 30 fps);
   phím L +5 s đúng (2,2 → 7,2 s); sau mỗi thao tác vòng ngủ lại
   (ticks đóng băng, `sleeping = true`).

## 1. Thay đổi (chỉ 1 file sản phẩm + 1 script đo)

### `apps/web/src/preview.tsx` — tỉnh lại khi tab hiện (đợt 22 C)

- Trong effect vòng lặp preview (cùng effect của T5), thêm handler
  `onVisible`: khi `document.visibilityState === "visible"` và vòng
  đang ngủ (`sleeping === true`) thì đặt `redrawFlag = true` rồi
  gọi `wake()`. `redrawFlag` buộc tick tiếp theo đi qua đường
  seek+vẽ ở cùng playhead (cancel seek cũ, reset lastDrawn +
  lastRequested — đúng cơ chế đã vá ở T5 §3), nên frame cũ được vẽ
  lại thật rồi vòng ngủ lại khi đủ điều kiện ngủ.
- Nghe 2 sự kiện: `document.visibilitychange` (tab ẩn/hiện) và
  `window.pageshow` (khôi phục từ bfcache — trường hợp tab quay lại
  mà không qua visibilitychange thông thường). Cả 2 đều dọn ở
  cleanup của effect.
- Các trường hợp no-op có chủ ý, đã suy luận (không đo hết, xem §5):
  - Đang phát khi hiện tab: `sleeping = false` → handler không làm
    gì; rAF bị kẹp lúc ẩn sẽ tự nổ lại khi hiện, vòng vốn đã chạy.
  - `pageshow` lúc tải trang lần đầu (`persisted = false`): vòng
    mới chạy, `sleeping = false` → no-op.
  - `visibilitychange` lúc tab bị ẩn: handler return sớm vì state
    khác `"visible"`; `pagehide` không cần xử lý gì thêm (rAF tự
    dừng, không có state nào phải dọn; playhead lúc ẩn không tự
    chạy vì chính vòng lặp là thứ đẩy playhead khi phát).
- KHÔNG sửa handler scrub, store, seek, i18n, hay bất kỳ file nào
  của luồng A/B/E. Đặc biệt: KHÔNG sửa app để "chiều automation"
  (ví dụ: không tắt WelcomeModal, không đổi z-index backdrop) vì
  modal là hành vi đúng với user thật.

### `apps/web/scripts/measure-v22-sleep-scrub-pipe.mjs` (MỚI)

- Kế thừa harness pipe của T5 (Playwright Chromium 156 headed dưới
  Xvfb 1920×1080×24, `--remote-debugging-pipe`, `vite preview`,
  project mẫu tự load). Cổng mặc định 4186, display :96–:99 (tránh
  đụng :94/:93 của script T5 khi các luồng chạy song song).
- 3 pha trên cùng 1 trang: A (click ruler + probe event + hit-test),
  A2 (click đơn sau khi modal đóng), B (kéo scrub + đối chứng
  PointerEvent JS), C (tab ẩn/hiện thật bằng Target.activateTarget
  sang tab trắng rồi về), kèm hồi quy Space/ArrowRight/phím L.
- Probe event gắn trực tiếp lên `.tl-ruler` (pointerdown/mousedown/
  click/pointermove/pointerup) + capture trên window + đếm thêm
  resize/focus/pageshow trong lúc ẩn/hiện (để truy nguyên trigger
  tỉnh ở baseline).
- Sửa 2 lỗi harness gặp giữa đường (không phải lỗi app): (a) logic
  tái dùng display cũ kiểm tra `pgrep Xvfb` chung nên dùng nhầm
  display đã chết khi Xvfb của luồng khác còn chạy → Chrome chết
  sớm, pipe ECONNRESET, node crash unhandled và để lại vite preview
  mồ côi (đã kill + dọn socket mồ côi); bản cuối chỉ tin socket khi
  có Xvfb chạy, socket mồ côi thì dọn, và gắn error handler cho
  pipe stdio để Chrome chết sớm báo BLOCKER sạch thay vì crash.

## 2. Truy nguyên scrub chuột — bằng chứng đo (bundle trước sửa `index-DV5xuT9v.js`)

- Ruler lúc đo: rect 840×27 tại (152, 692), `pointer-events: auto`,
  `touch-action: none`, cursor `ew-resize`, không có ancestor nào
  `pointer-events: none`, không có element nào phủ lên ruler theo CSS.
- Click CDP vào giữa ruler (572, 705.5):
  `document.elementFromPoint` trả về `DIV.modal-backdrop`
  (0, 0, 1919×936) — tức click rơi vào backdrop của `WelcomeModal`
  (mở vì profile Chrome mới chưa có localStorage `vcut-welcomed`;
  xem `App.tsx:248` + `components/onboarding/WelcomeModal.tsx`:
  backdrop `onClick={close}` — click ngoài dialog là đóng modal).
  Probe: ruler nhận 0 event mọi loại; window capture nhận đúng
  1 pointerdown / 1 pointermove / 1 pointerup (tức CDP mouse CÓ
  sinh PointerEvent bình thường — giả thuyết "CDP không tạo đủ
  PointerEvent" của T5 §5.1 là SAI). Playhead 00:00.0 → 00:00.0,
  px hash không đổi. Click này đồng thời ĐÓNG modal (đúng thiết kế).
- Click đơn lần 2 vào cùng điểm (modal đã đóng): ruler nhận đủ
  pointerdown (target `tl-ruler`, pointerType `mouse`) + mousedown
  + click; playhead 00:00.0 → 00:07.0 (đúng công thức
  (572−152)/pxPerSec với pxPerSec = 60); px hash đổi.
- Kéo scrub 30% → 70% ruler (404 → 740): pointerdown tại 404 trên
  ruler, 11 pointermove, pointerup; playhead giữa đường 00:07.0 rồi
  00:08.0 (clamp đúng duration 8 s); px hash đổi.
- Đối chứng dispatch `PointerEvent` JS trực tiếp lên ruler:
  pointerdown/up nổ, playhead 00:08.0 → 00:07.0 — handler React tự
  nó chạy đúng; vấn đề trước đây nằm ở hit-test (modal chắn),
  không nằm ở handler, pointer capture, hay vùng hit.
- Vì sao click nút FPS ở T5 vẫn mở được panel trong khi click ruler
  thì không: CHƯA giải thích được chắc chắn (TopBar z-index 30 <
  backdrop 100 nên về lý thuyết nút FPS cũng bị chắn; có thể ở các
  run T5 modal chưa kịp mở lúc click FPS vì `ready` lên muộn, hoặc
  thứ tự tương tác khác — không đủ dữ liệu để kết luận, và không
  ảnh hưởng tới kết luận chính vì cơ chế modal-nuốt-click đã đo
  trực tiếp ở đây). Ghi nhận là câu hỏi mở, không bịa đáp án.
- Hệ quả cho harness sau này: mọi click-test automation PHẢI đóng
  WelcomeModal trước (click 1 lần vào backdrop, hoặc set
  localStorage `vcut-welcomed=1` trước khi load) rồi mới đo scrub.
  Với user thật, modal chỉ hiện 1 lần duy nhất lần đầu mở app nên
  không ảnh hưởng gì tới scrub hằng ngày.

## 3. Đo tab ẩn/hiện — trước/sau sửa (cùng phương pháp, 1 run mỗi bản)

| | Trước sửa (`index-DV5xuT9v.js`) | Sau sửa (`index-B6D3m0qx.js`) |
|---|---|---|
| Trước ẩn | ticks 101, sleeping=true, px 12848628, draws 4 | ticks 143, sleeping=true, px 12851050, draws 8 |
| Lúc ẩn 3 s | vis=hidden, ticks 101 (đóng băng), px không đổi | vis=hidden, ticks 143 (đóng băng), px không đổi |
| Sau hiện 1 s | vis=visible, ticks 110 (+9), sleeping=true, px không đổi | vis=visible, ticks 150 (+7), sleeping=true, px không đổi |
| Sau hiện 4 s | ticks 110 (đóng băng), draws 4→5, visChanges [hidden, visible] | ticks 150 (đóng băng), draws 8→10, visChanges [hidden, visible] |

- Đọc bảng: cả 2 bản đều tỉnh lại, vẽ lại đúng frame cũ (px hash
  trước/sau hiện giống hệt nhau trong từng run), rồi ngủ lại
  (ticks đóng băng, `sleeping = true` ở cả 1 s và 4 s sau hiện).
  Khác biệt duy nhất có ý nghĩa: bản sau có đường tỉnh xác định
  (`visibilitychange`/`pageshow` → redrawFlag + wake), bản trước
  tỉnh nhờ trigger ngoài chưa xác định (§4).
- Lưu ý về draws: bộ đếm draws (số lần `setTransform` identity / 2,
  theo phương pháp T5) cho +1 ở bản trước và +2 ở bản sau — con số
  này là xấp xỉ (một frame có thể gọi setTransform identity nhiều
  lần tùy đường vẽ), KHÔNG dùng để kết luận "bản sau vẽ thừa 1
  frame". Bất biến được claim là: px hash không đổi + ngủ lại.
- Tải máy run cuối: loadavg đầu 4,61 / cuối 5,95 (VM đang chạy nhiều
  luồng song song của đợt 22 — số tick tuyệt đối vì thế không so
  được ngang hàng với T5, chỉ so được bất biến trong-run).

## 4. Dị thường + giới hạn đo (khai trung thực, không giấu)

1. **Trigger tỉnh ở baseline chưa khoanh được hết:** trong lúc
   ẩn/hiện, probe đếm được resize=2, focus=1, pageshow=0. Riêng
   listener `resize` → wake chỉ tạo 1 tick/0 draw (vì playhead đã
   bằng lastDrawn, không có redrawFlag), trong khi baseline đo
   được +9 ticks + 1 draw — tức phải có thêm trigger đặt redrawFlag
   hoặc đổi identity spec/media/selection (subscribe → redrawFlag)
   lúc restore tab. Ứng viên chưa kiểm chứng: store thay đổi do
   media element load lại / autosave / audio engine khi tab hiện.
   Bản sửa không phụ thuộc vào việc này nữa (visibilitychange tự
   đặt redrawFlag), nhưng nguyên nhân gốc của lần tỉnh baseline
   vẫn là câu hỏi mở — không claim đã hiểu hết.
2. **Chưa đo:** tab ẩn LÂU (hàng phút/giờ, trình duyệt discard
   canvas hoặc throttle sâu hơn); tab ẩn trong lúc ĐANG PHÁT
   (playhead có tiếp tục đúng khi hiện lại không — vòng phát bị
   kẹp rAF lúc ẩn, video element có thể tự chạy lệch, chưa đo);
   bfcache restore thật (mới chỉ gắn listener `pageshow`, chưa có
   run nào đi qua bfcache thật — pageshow=0 trong cả 2 run đo);
   nhiều tab/màn hình; dpr > 1; máy thật (không Xvfb).
3. **Scrub chuột thật bằng tay chưa đo:** mọi số scrub ở đây đều
   qua CDP mouse (đã chứng minh sinh PointerEvent đầy đủ) và
   dispatch JS; chưa có người thật cầm chuột kéo trên máy thật —
   nhưng vì handler đã nhận đúng event và đổi playhead đúng công
   thức, rủi ro còn lại chỉ là khác biệt thiết bị (touch, pen).
4. **Hồi quy ArrowRight:** display thời gian của app chỉ hiện 1 số
   thập phân giây nên bước 1 frame (0,033 s) không đổi text hiển
   thị; kiểm chứng bằng hook `lastDrawn` 2,1667 → 2,2000 (đúng
   +1/30 s) và ticks 199 → 238 rồi ngủ lại — không claim bằng
   text thời gian.
5. **T5 §5.1 đã được đính chính:** giả thuyết "CDP mouse có thể
   không tạo đủ PointerEvent" là sai — probe cho thấy CDP mouse
   sinh đủ pointerdown/mousedown/click (pha A2/B). Nguyên nhân
   thật là modal chắn hit-test (§2).

## 5. Suy luận chưa đo (ghi rõ là suy luận, không phải kết luận)

- `pagehide` không cần handler: rAF tự dừng khi tab ẩn; playhead
  chỉ được đẩy bởi chính vòng lặp nên không tự chạy lúc ẩn; không
  có state nào của vòng lặp cần dọn khi ẩn. Nếu sau này phát hiện
  video element tự chạy lệch lúc ẩn trong khi đang phát thì mới
  cần xử lý thêm ở đây.
- Vẽ lại frame cũ khi hiện tab tốn 1 lần seek + 1 lần vẽ (rẻ, 1 lần
  duy nhất rồi ngủ lại) — đánh đổi chấp nhận được để chắc chắn
  không trắng canvas nếu bitmap bị hủy lúc ẩn.

## 6. Cấm trích (nhắc lại)

- Cấm trích "0 tick/s", "ticks +7 khi hiện tab", hay px hash thành
  FPS/hiệu năng trên máy user: đây là VM 2 vCPU, raster phần mềm,
  Xvfb, dpr = 1, canvas 1351×512, project mẫu nhẹ — không GPU thật,
  không footage thật, không timeline nặng.
- Cấm trích "scrub chuột đã test xong mọi trường hợp": mới chỉ đo
  click đơn + kéo qua CDP trên desktop viewport 1920×1080 sau khi
  modal đóng; chưa đo touch/pen, chưa đo tay người thật, chưa đo
  khi modal khác (Export/Caption/Template) đang mở.
- Cấm trích số draws +1/+2 thành số frame vẽ: bộ đếm là xấp xỉ
  theo phương pháp T5, chỉ dùng để so bất biến trong-run.

## 7. Kiểm chứng đã chạy (lệnh + kết quả số)

- `node --check` script đo mới: pass.
- `npx tsc --noEmit` (apps/web) ở trạng thái cuối: **2 lỗi, cả 2 đều
  ở file của luồng khác đang sửa dở** (`src/lib/probe22.tmp.ts`
  TS5097, `src/lib/probe22spec.tmp.ts` TS5097 — file `.tmp` xuất
  hiện lúc 13:10, sau lần tsc 0 lỗi đầu lượt của luồng này; KHÔNG
  thuộc file của luồng này, KHÔNG sửa). File `preview.tsx` và mọi
  file khác: 0 lỗi. Lần tsc đầu lượt (trước khi file `.tmp` xuất
  hiện): 0 lỗi.
- `npx vite build` (apps/web): pass, bundle cuối `index-B6D3m0qx.js`
  (đã grep thấy `visibilitychange` + `pageshow` trong bundle).
- `node apps/web/scripts/measure-v22-sleep-scrub-pipe.mjs` bản trước
  sửa: pha A tái hiện đúng modal-nuốt-click, pha B kéo scrub đúng,
  pha C ẩn/hiện đúng nhưng do trigger ngoài (§4.1).
- Cùng script sau sửa (bundle `index-B6D3m0qx.js`): A tái hiện,
  A2 click đơn 0 → 7,0 s, B kéo 0 → 7,0 → 8,0 s, C ẩn/hiện px không
  đổi + ngủ lại, hồi quy Space phát (sleeping=false) / dừng
  (sleeping=true) / ArrowRight +1 frame (lastDrawn 2,1667 → 2,2000)
  / phím L +5 s (2,2 → 7,2 s) rồi ngủ lại (ticks 278 → 278).
- KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG stage (parent
  sẽ stage). Dist và các tiến trình đo (vite/Xvfb/Chrome) đã dọn
  sau mỗi script (finally kill + rm profile + dọn socket Xvfb mồ
  côi :96–:98).

## 8. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `apps/web/src/preview.tsx` (SỬA — listener `visibilitychange` +
  `pageshow` ép vẽ lại frame cũ khi tab hiện lại trong lúc ngủ).
- `apps/web/scripts/measure-v22-sleep-scrub-pipe.mjs` (MỚI — đo
  scrub chuột + tab ẩn/hiện qua pipe; cổng 4186, display :96–:99).
- `docs/PHASE9_ROUND22_C_SLEEP_SCRUB_LIMITS.md` (MỚI — file này).
- KHÔNG sửa file nào khác. Đặc biệt: không sửa store.ts,
  nestedRejection, i18n, Timeline.tsx (không cần sửa — handler
  scrub vốn đã đúng), nestUtils, packages/video-spec, WelcomeModal.
  Không push, không ghi qua GitHub connector, không stage.
