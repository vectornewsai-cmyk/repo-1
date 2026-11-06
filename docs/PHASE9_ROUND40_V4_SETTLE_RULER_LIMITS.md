# Phase 9 đợt 40, luồng V4 — Settle-drop prefetch + seekRuler — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG ghi paths-loop hay build-loop-log (parent gộp), KHÔNG sửa file
của luồng khác ngoài phần mình được giao. Luồng này đóng nợ §5.4 của
`docs/PHASE9_ROUND39_LIMITS.md` ("Settle-drop cần bằng chứng browser;
`seekRuler` click ruler không tác dụng — sửa hoặc ghi rõ là hành vi
có chủ đích").

## 0. Kết luận ngắn (không vượt số đo)

1. **Settle-drop ĐÃ CÓ bằng chứng browser (nợ T4 nay đóng).**
   Click-test mới bắt được prefetch đang bay đúng lúc tắt: poll nhanh
   thấy `inFlightPrefetchWindows = 1` sau 3.097 ms, tắt toggle ngay
   bằng click thô + pause ngay, sau khi settle và refresh mirror:
   `settledPrefetchDroppedFrames 0 → 60` (delta **60 frame**),
   `uiStatus = off`, `prefetchFrames = 0`, badge "TẮT". Luật dọn của
   T4 (`dropSettledPrefetchIfOff`) nay có bằng chứng app-thật, không
   chỉ test thuần. Xem §2.
2. **seekRuler KHÔNG hỏng — không sửa handler, vì không có bug để
   sửa.** Handler ruler đã seek đúng ngay từ đầu; báo cáo "0 → 0"
   của T4 là lỗi harness, đã tái hiện đúng cơ chế (§1.2): timeline
   dài làm ruler rộng 4.200 px, click ở x = 2.132 ngoài viewport
   1.440 px nên trình duyệt không giao sự kiện cho ruler. Sau khi
   cuộn `.tl-scroll` cho mục tiêu vào viewport, cùng một handler
   seek đúng 33 s. Việc duy nhất làm ở ruler là tách phép ánh xạ
   click → thời gian ra hàm thuần để test khóa được, giữ nguyên
   hành vi (không đổi công thức, không thêm clamp/snap — clamp +
   snap vẫn nằm ở `store.setPlayhead` như cũ). Sửa bừa handler khi
   handler đang đúng sẽ chỉ tạo bug mới.
3. **Giữ luật T2 nguyên vẹn:** cổng S3 chỉ xét lúc BẬT, không re-gate
   liên tục. Luồng này không đụng cổng, không đụng toggle registry,
   không đụng vòng lặp t=0, không đụng GOP wiring; predicate
   `shouldAutoApplyDecodeAhead` được khẳng định lại trong test mới.

## 1. seekRuler — chẩn đoán và bằng chứng

### 1.1 Handler nằm ở đâu và làm gì (đọc code, không đoán)

- Handler ruler nằm ở `apps/web/src/Timeline.tsx` (component `Ruler`),
  KHÔNG phải `preview.tsx` — vì vậy luồng này không sửa `preview.tsx`
  (marker `ROUND40-V4-*` cho `preview.tsx` trong lệnh giao không áp
  dụng vì không có hunk nào ở đó; không tạo marker giả).
- `onPointerDown` trên `.tl-ruler` gọi `scrubTo` ngay (không chờ
  pointermove/drag): `setPlayhead((clientX - rect.left) / pxPerSec)`.
  `setPlayhead` (store) clamp về `[0, duration]` + snap về frame
  (R1-055). Vạch marker trên ruler `stopPropagation` ở pointerdown
  để không trigger scrub — đó là hành vi có chủ đích riêng của
  marker, không liên quan click vùng trống.
- Công thức đúng nhưng dễ hiểu nhầm: ruler rộng =
  `max(duration * pxPerSec, 600) + 240` px đệm, nên **frac của chiều
  rộng ruler KHÔNG bằng frac của thời gian**. Harness nào ép
  "click ở frac f của ruler = seek tới f * duration" đều sai số
  (ví dụ timeline 10 s, 60 px/s: giữa ruler cho 7,0 s chứ không phải
  5,0 s). T4 dùng đúng kiểu frac này, nhưng lỗi quyết định của T4
  còn nặng hơn (xem §1.2).

### 1.2 Tái hiện đúng lỗi T4, rồi seek đúng bằng cùng handler

Click-test mới (`clicktest-round40-v4-settle-ruler-pipe.mjs`, chạy
trên app thật qua `vite preview` phục vụ dist đóng băng, Chrome
headless qua CDP, click chuột thật):

- **R1 (timeline ngắn, ruler gọn trong viewport):** hiệu chuẩn
  pxPerSec từ playhead-handle sau 1 click: click x = 452 →
  cur = 5 s, handleLeft = 300 px → **pps = 60 chính xác**. Click
  theo thời gian mục tiêu 6 s (x = 512) → **cur = 6** (tổng 10 s).
- **R2 (điều kiện T4: thêm fixture dài 60 s → tổng 66 s):**
  ruler rộng **4.200 px**, viewport **1.440 px**, mục tiêu 33 s có
  tọa độ thô **x = 2.132 (ngoài viewport)**. Click thô đúng kiểu T4
  tại đó → **cur 6 → 6, không đổi** — tái hiện chính xác "0 → 0"
  của T4, và đây là kỳ vọng đúng của trình duyệt (sự kiện ngoài
  viewport không tới được element), không phải handler bỏ qua click.
  Cuộn `.tl-scroll` cho mục tiêu vào viewport rồi click lại (cùng
  handler, cùng công thức) → **cur = 33**, x = 720, `scrolled=true`.
- Kết luận: không có bug ruler để sửa. Ai muốn dùng seekRuler trong
  harness sau này phải cuộn `.tl-scroll` trước (hàm
  `rulerClickAtTimeScrolled` trong script mới làm đúng việc này),
  và phải tính tọa độ theo thời gian (`rect.left + t * pxPerSec`),
  không theo frac chiều rộng.

### 1.3 Thay đổi code duy nhất ở ruler (giữ nguyên hành vi)

- Mới `apps/web/src/lib/timelineRulerSeek40V4.ts`:
  `rulerTimeFromClientX(clientX, rectLeft, pxPerSec) = (clientX -
  rectLeft) / pxPerSec` — đúng phép chia cũ, kèm chú thích ghi rõ
  bẫy frac-đệm-240-px và bẫy click-ngoài-viewport để luồng sau
  không tái phạm.
- `Timeline.tsx`: 2 điểm gọi cũ (`scrubTo` và nhánh scrub trong
  `onMove`) nay gọi helper; không đổi thứ tự sự kiện, không đổi
  pinch-zoom, không đổi marker. `tsc --noEmit` 0 lỗi, `vite build`
  pass — tức refactor không đổi hành vi ở mức type + build.
- Test mới khóa công thức bằng đúng số probe browser (left 152,
  60 px/s: x = 512 → 6; x = 572 → 7; x = 362 → 3,5) + trường hợp
  frac-đệm (giữa ruler 840 px cho 7, không phải 5) + ngoài biên trả
  giá trị thô (clamp là việc của `setPlayhead`, không phải helper).

## 2. Settle-drop — bằng chứng browser (phương pháp + số đo)

### 2.1 Vì sao T4 không bắt được, và script mới khác gì

T4 tắt toggle theo lịch cố định rồi đọc trạng thái 3 s sau — lúc
đó prefetch đã settle từ lâu (`inFlight = 0`, `settledDropped = 0`).
Script mới đảo ngược thứ tự: **poll nhanh rồi mới tắt**:

- Trong lúc đang phát ngược, poll `window.__vcutReverseDecodeAheadStatus`
  mỗi ~10 ms (mỗi vòng đúng 1 lần eval, không sleep dài).
- Khi `inFlightPrefetchWindows >= 1` thì tắt NGAY bằng click thô
  tại tọa độ toggle đã đo trước (`clickFast`: mousePressed +
  mouseReleased, không ngủ) — click qua `clickEl` (ngủ 300 ms +
  400 ms) đủ để prefetch settle trước khi toggle kịp tắt.
- Tắt xong bấm "Phát ngược" lần nữa để pause ngay, tránh lần
  decode cửa sổ sau evict prefetch trước khi settle-drop kịp chạy.
- **Bẫy mirror stale (phát hiện ở lượt chạy đầu, xem §4.2):**
  mirror chỉ tươi khi vòng lặp preview tick (lúc đang phát) hoặc
  ngay sau click toggle. Đọc trực tiếp sau 3 s chờ sẽ thấy số cũ.
  Script phát ngược lại 1,5 s rồi pause để tick refresh mirror,
  rồi mới đọc `settledPrefetchDroppedFrames`.

### 2.2 Số đo lượt chạy cuối (7/7 pass, lượt 1 đã bắt được)

- Setup (theo đúng điều kiện T4 Q1: fixture dễ decode 360p, seek
  gần cuối, phát ngược): `uiStatus = running`, **prefetch = 91
  frame**, fps cửa sổ mở cổng **201,36**, badge "ĐANG CHẠY —
  prefetch 91 frame".
- Vòng bắt lượt 1: poll thấy **`inFlight = 1` sau 3.097 ms** →
  tắt + pause ngay → sau settle + refresh mirror:
  **`settledPrefetchDroppedFrames 0 → 60` (delta 60 frame)**,
  `uiStatus = off`, `prefetchFrames = 0`, badge "TẮT".
- Đọc đúng: 60 frame prefetch đã bị dọn khỏi cache khi settle sau
  khi tắt (luật T4), không phải "hủy prefetch đang bay" — VideoDecoder
  không có cancel, dọn-khi-settle vẫn là xử lý mạnh nhất có thể
  (ghi rõ như T4 §1.2, không claim hơn).
- Không cần lượt thử lại 2–3: lượt 1 đã delta > 0 + đúng trạng thái
  cuối nên vòng lặp dừng ở lượt 1 (script vẫn giữ tối đa 3 lượt cho
  lần chạy sau nếu lượt 1 trượt).

## 3. Kiểm chứng (số thật, chạy lại độc lập trong luồng)

- **Mới** `timelineRulerSeek40V4.test.ts`: **6/6 pass** (esbuild
  bundle ra scratch ngoài repo).
- **Hồi quy** (cùng runner esbuild): U1 toggle **12/12**,
  T4 settle/toggle **11/11**.
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**.
- `vite build`: **pass** (cảnh báo chunk > 500 kB cũ, không phải
  lỗi mới). Dist này (không vào batch) là bản click-test chạy bằng
  `vite preview` cổng 5181 — server đã kill sau khi đo xong.
- `node apps/web/scripts/r6-i18n-check.cjs`: **PASS,
  vi = 962, en = 962** (luồng này không thêm/bớt key nào; 962 khác
  959 thời T4 vì các luồng đợt 40 khác đã thêm key — cân bằng
  vi=en vẫn giữ).
- Click-test mới: **7/7 pass** (T0, R1-calib, R1, R2-raw, R2-scrolled,
  S1-setup, S1) — xem §1.2 + §2.2.

## 4. Hai lỗi harness của chính lượt chạy này (ghi đủ, không giấu)

1. **Lượt chạy đầu S1-setup fail vì thiếu cờ opt-in đường reverse.**
   Script V4 lượt đầu không đặt `window.__vcutReverseWebcodecs =
   true` (cờ T4 đã đặt trước khi bật toggle): preview vẽ bằng
   đường `<video>` fallback, **không tạo controller nào**
   (`controllers: []`), mirror mãi `blocked` với lý do
   `hardware-not-measured` + `software-decode-not-measured` dù phát
   ngược vẫn chạy tốt (8,5 → 0 s trong ~8 s ở probe chẩn đoán).
   Đây là lỗi harness, không phải lỗi sản phẩm: đường reverse
   WebCodecs mặc định TẮT theo thiết kế (`reversePlayback.ts`
   §opt-in). Sửa: script đặt cờ ở đầu phần S1 (ghi rõ trong header
   script). Probe chẩn đoán `probe-s1.mjs` nằm ở scratch ngoài repo,
   không vào batch.
2. **Đọc mirror sau khi tắt mà không refresh sẽ thấy số cũ.**
   Xem §2.1: phải phát lại ngắn để tick refresh rồi mới đọc. Số
   `settledDropped = 0` của T4 lượt 3 vì vậy là "không kết luận"
   chứ không phải "không có settle-drop" — và số `0 → 60` ở §2.2
   chỉ có giá trị vì đã qua bước refresh này.

## 5. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **Nhánh hoãn-dọn chưa có bằng chứng browser:** khi prefetch
   settle đúng lúc đang có decode cửa sổ bay, luật T4 hoãn dọn tới
   khi decode đó xong (chain vào `decodePromise`). Bằng chứng §2.2
   là nhánh dọn-ngay; nhánh hoãn vẫn chỉ có test thuần (predicate
   `shouldDropSettledPrefetch` với `decodeInFlight = true`) — muốn
   bắt nhánh này cần căn settle trùng decode cửa sổ, cửa sổ thời
   gian còn hẹp hơn.
2. **Chỉ chứng minh trên một đường đo:** fixture testsrc2 360p,
   decode phần mềm, Chrome headless, máy under-load (các luồng đợt
   40 khác chạy song song). Chưa đo: Safari / máy thật / GPU thật /
   footage B-frame / file GOP thưa / đường `asset:` / tab ẩn.
   Số fps 201,36 chỉ là số đo cửa sổ mở cổng, KHÔNG phải fps hiển
   thị ngược — cấm trích làm benchmark.
3. **Không claim settle-drop cho mọi prefetch:** delta 60 frame là
   của cửa sổ prefetch bắt được ở lượt đó (setup báo prefetch 91
   frame — hai con số khác nhau vì cửa sổ prefetch tại lúc bắt
   không nhất thiết là cửa sổ lúc setup; script chỉ khẳng định
   delta > 0 + trạng thái cuối đúng, không khẳng định "dọn toàn bộ
   91 frame").
4. **Hợp nhất tsconfig cần parent đối chiếu:** luồng này thêm 1 dòng
   exclude test mới vào `apps/web/tsconfig.json`; file này các
   luồng đợt 40 khác cũng đang sửa (đã thấy dòng exclude
   `relink40V5.test.ts` của luồng V5 trong file) — parent gộp cần
   giữ đủ dòng của mọi luồng, hunk V4 chỉ là dòng
   `timelineRulerSeek40V4.test.ts`.
5. **Server đo đã dừng sau khi đo xong** (vite preview 5181 đã kill;
   cổng trống). Script giả định preview đang chạy (xem header) —
   chạy lại cần build + preview lại theo header.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Sửa: `apps/web/src/Timeline.tsx` (nối 2 điểm gọi ruler vào helper
  V4; không sửa logic draw, pinch, marker hay clip nào khác).
- Mới: `apps/web/src/lib/timelineRulerSeek40V4.ts` (hàm thuần ánh xạ
  click ruler → thời gian + chú thích bẫy T4).
- Mới: `apps/web/src/lib/timelineRulerSeek40V4.test.ts` (6/6).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới;
  xem lưu ý gộp ở §5.4).
- Mới: `apps/web/scripts/clicktest-round40-v4-settle-ruler-pipe.mjs`
  (click-test app thật 7/7: ruler + settle-drop).
- Mới: `docs/PHASE9_ROUND40_V4_SETTLE_RULER_LIMITS.md` (file này).
- Không sửa: `preview.tsx` (không có hunk nào của luồng này — handler
  ruler nằm ở Timeline, xem §1.1), `reverseWebcodecs.ts`,
  `reverseDecodeAhead*.ts`, cổng/gate, toggle registry, i18n
  (không thêm key), `apps/web/dist/` (không vào batch theo tiền lệ),
  paths-loop, build-loop-log. Scratch đo nằm ngoài repo
  (`~/workspace/tmp-round40-v4/`: fixture easy/long, log vite,
  bundle test, probe chẩn đoán) — KHÔNG vào batch.
