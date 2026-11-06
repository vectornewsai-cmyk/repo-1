# Phase 9 đợt 41, luồng W1 — Bằng chứng browser cho nhánh settle-drop hoãn-dọn — LIMITS

Ngày: 03/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG tự stage batch push (parent lo), KHÔNG sửa file của luồng khác
ngoài phần mình được giao. Luồng này đóng nợ đợt 40 §5.5
(`docs/PHASE9_ROUND40_LIMITS.md` §5.5, V4 §5.1): nhánh hoãn-dọn của
settle-drop — khi prefetch settle đúng lúc decode cửa sổ đang bay,
`dropSettledPrefetchIfOff` chain thử lại vào `decodePromise` thay vì
evict ngay — trước đây chỉ có test thuần predicate
`shouldDropSettledPrefetch` với `decodeInFlight = true`.

## 0. Kết luận ngắn (không vượt số đo)

1. **Nhánh hoãn-dọn ĐÃ CÓ bằng chứng browser, bắt được ngay lượt 1.**
   Click-test mới bắt được khoảnh khắc hiếm: prefetch settle trong
   lúc decode cửa sổ W2 đang bay, và tại đúng mẫu settle đó frame
   KHÔNG bị dọn — `settledPrefetchDroppedFrames` giữ nguyên 0,
   `cacheFrames` tăng 232 → 241 (không sụt), `decodeWindowInFlight`
   vẫn true. Frame prefetch tiếp tục nằm trong cache cùng frame W2
   đang decode dở (cache tăng tiếp 241 → 335) và chỉ biến mất khi W2
   kết thúc (+1805 ms: cache 335 → 158, `uiStatus = off`,
   `prefetchFrames = 0`). Đây chính là hành vi "không dọn ngay, chỉ
   dọn sau khi decode xong" của nhánh hoãn.
2. **Đính chính quan trọng về quy đổi (đọc kỹ trước khi trích số):**
   lần dọn cuối trong phép đo này KHÔNG được ghi vào counter
   `settledPrefetchDroppedFrames` — delta cuối = **0**. Lý do nằm ở
   thứ tự code, đã kiểm chứng bằng trace (xem §3): W2 tự nó chạy
   `evictExcept(keep = cửa sổ W2)` trước khi trả về, nên frame
   prefetch đã bị chính evict của W2 dọn trước khi lần thử lại
   hoãn-dọn chạy — lần thử lại sau đó tìm thấy 0 frame để dọn.
   Vì vậy **không được claim "lần thử lại hoãn-dọn đã dọn N frame"**
   từ phép đo này; claim đúng là claim về THỜI ĐIỂM (không dọn tại
   settle, chỉ mất sau khi decode xong), không phải về TÁC NHÂN
   dọn cuối. Muốn counter của lần thử lại tăng cần một W2 kết thúc
   mà không evict (vd decode trả 0 frame) — đó là fixture suy biến,
   không phải đường phát ngược bình thường, nên luồng này không ép
   bằng mọi giá (xem §5.3).
3. **Để bắt được nhánh này phải thêm 2 trường mirror chỉ-đọc**
   (`decodeWindowInFlight`, `cacheFrames`): mirror cũ không thể phân
   biệt "settle mà chưa dọn" với "settle rồi dọn ngay", vì
   `prefetchFrames` là số đo `aheadRange` — về null ngay khi tắt
   toggle, không phải số frame thật trong cache. Hai trường mới
   không đổi hành vi decode nào (xem §1).

## 1. Thay đổi code (nhỏ, chỉ-đọc + test + harness)

- Sửa `apps/web/src/lib/reverseWebcodecs.ts` (chỉ thêm, không sửa
  logic cũ):
  - Getter `decodeWindowInFlight` = `decodePromise !== null` và
    `cacheFrameCount` = `cache.size` trên `ReversePreviewController`.
  - Hai trường gộp `decodeWindowInFlight` (OR mọi controller) và
    `cacheFrames` (tổng `cache.size`) trên
    `ReverseDecodeAheadStatus` + hàm `reverseDecodeAheadStatus()`.
    UI không dùng hai trường này; không có test nào dựng literal
    status nên không vỡ test cũ (hồi quy §4 xác nhận).
- Mới `apps/web/src/lib/settleDeferred41W1.test.ts` (6/6): khóa
  predicate — chỉ tổ hợp (tắt, chưa dispose, không decode bay) mới
  dọn; (tắt, chưa dispose, decode bay) = hoãn, không dọn; bật lại
  hay dispose đều không dọn; ma trận đầy đủ 8 tổ hợp; tập keep của
  lần dọn thử lại là đúng cửa sổ hiện tại. Test thuần chỉ khóa
  predicate, không mạo nhận bằng chứng browser (bằng chứng ở §2).
- Sửa `apps/web/tsconfig.json`: chỉ thêm 1 dòng exclude test mới
  (`settleDeferred41W1.test.ts`). File này các luồng đợt 41 khác
  cũng đang sửa (lúc luồng này chạy đã thấy dòng `pauseDraw41W2`
  và `importProgress41W3` của luồng khác) — parent gộp cần giữ đủ
  dòng của mọi luồng, hunk W1 chỉ là dòng trên.
- Mới `apps/web/scripts/clicktest-round41-w1-settle-deferred-pipe.mjs`
  (click-test app thật 5/5, xem §2). Không sửa `preview.tsx`,
  `Timeline.tsx`, cổng/gate, toggle registry, i18n (không thêm key).

## 2. Bằng chứng browser (phương pháp + số đo)

### 2.1 Vì sao V4 không bắt được, và script mới khác gì

V4 tắt toggle rồi pause ngay: sau khi tắt không còn decode cửa sổ
nào bay nữa nên prefetch settle sau đó rơi vào nhánh dọn-ngay
(delta 60, V4 §2.2). Script W1 đảo ngược: **không pause**, mà mở
thêm một decode cửa sổ W2 ngay sau khi tắt:

- Setup như V4 S1 nhưng chỉ 1 clip: fixture 640×360, GOP 90, 90 s
  (tạo bằng ffmpeg, xem §5.1), seek gần cuối, phát ngược tới
  `running + prefetch > 0`. Cổng chỉ mở khi decode phần mềm
  >= 2× fps phát (60 fps): fixture phải vừa đủ dễ decode để qua
  cổng, vừa đủ nặng (GOP 90 → cửa sổ decode GOP-aligned tới
  ~165 frame) để cửa sổ decode kéo dài hàng trăm ms, đủ cho race.
  Số đo cửa sổ mở cổng ở setup: **68,27 fps** (chỉ hơn ngưỡng 60
  một biên hẹp, under-load — xem §5.2).
- Mỗi lượt: poll nhanh mirror (mỗi vòng 1 eval, sleep 5 ms); khi
  `inFlightPrefetchWindows >= 1` thì tắt toggle NGAY bằng clickFast,
  rồi clickFast seek tới thời gian cách playhead 20 s (xa hơn 2 cửa
  sổ, chắc chắn chưa cache, không trùng đoạn prefetch) để mở W2.
  Điểm seek được cuộn vào viewport TRƯỚC khi poll (cuộn trong cửa
  sổ race sẽ làm prefetch kịp settle); sau khi bắt chỉ đo lại tọa
  độ bằng 2 eval rồi click ngay — lượt bắt được đo
  **toggle → seek trong 172 ms**.
- Trace từng mẫu mirror sau seek (50 mẫu trong lượt bắt được) và
  phân loại: lượt chỉ tính là DEFERRED khi mẫu settle đầu tiên có
  `winInFlight = true` + `settled` chưa tăng + `cache` không sụt;
  lượt mà prefetch settle trước khi seek kịp mở W2, hoặc W2 kết
  thúc trước khi prefetch settle, bị loại là nhánh dọn-ngay của V4
  (script thử lại tối đa 8 lượt — lượt 1 đã đạt nên dừng ở lượt 1).

### 2.2 Số đo lượt bắt được (lượt 1, 5/5 pass)

- Setup: `uiStatus = running`, **prefetch = 105 frame**,
  fps cửa sổ mở cổng **68,27**, độ phân giải đo **640×360**,
  badge "ĐANG CHẠY — prefetch 105 frame". Bắt prefetch bay sau
  **15 ms** poll; mục tiêu seek 59,2 s, `pps = 60` (hiệu chuẩn như V4).
- Trace sau seek (thời gian tính từ click seek):
  - **+2 ms:** `inFlight = 1`, `winInFlight = false`, cache 127 —
    W2 chưa bắt đầu (seek → frameAt là bất đồng bộ), chưa kết luận.
  - **+798 / +809 ms:** `inFlight = 1`, `winInFlight = true`,
    cache 232, `settled = 0` — W2 đang bay, prefetch vẫn chưa settle.
  - **+819 ms (mẫu settle — bằng chứng chính):**
    `inFlight 1 → 0` (prefetch đã settle), `winInFlight = true`,
    **`settled 0 → 0` (chưa tăng)**, **`cache 232 → 241` (tăng,
    không sụt)**. Nếu nhánh dọn-ngay chạy thì tại mẫu này settled
    đã tăng và cache đã sụt — cả hai đều không xảy ra: lần gọi
    `dropSettledPrefetchIfOff` tại settle đã đi nhánh hoãn (chain
    vào `decodePromise`) đúng như code.
  - **+819 → +1790 ms:** cache tăng tiếp **241 → 335** trong lúc
    W2 vẫn bay — frame prefetch vẫn nằm trong cache cùng frame W2
    đang decode dở, không bị evict giữa chừng.
  - **+1805 ms (mẫu cuối):** `winInFlight = false`, cache
    **335 → 158** (sụt 177 frame = evict cuối W2),
    `settled` vẫn **0**, `uiStatus = off`, `prefetchFrames = 0`.
- Đọc đúng: frame prefetch mất khỏi cache CHỈ SAU khi W2 kết thúc
  (+1805 ms), không phải tại thời điểm settle (+819 ms) — khoảng
  hoãn quan sát được là **~986 ms** (từ settle tới khi W2 kết thúc).
  Tác nhân dọn cuối là evict của W2, không phải lần thử lại (xem
  §0.2 và §3): settled delta cuối = 0, và đó là kết quả đúng của
  thứ tự code chứ không phải lỗi đo.

## 3. Thứ tự code giải thích vì sao settled delta cuối = 0 (đã đọc code, không đoán)

Trong `ensureWindowForTime` (cả nhánh full-file lẫn nhánh GOP):
decodeGop → đo → tính aheadRange (đã tắt nên null) →
`cache.evictExcept(keep = cửa sổ W2)` → gán `lastDecodeRange` →
trả về; `decodePromise` chỉ resolve SAU bước evict này, và lần thử
lại hoãn-dọn được chain bằng `p.then(...)` lên chính `decodePromise`
đó nên chạy SAU evict của W2. Vì vậy trong đường phát ngược bình
thường, lần thử lại luôn tìm thấy 0 frame prefetch còn lại để dọn:
nó là lưới an toàn cho trường hợp W2 kết thúc mà không evict (vd
decode 0 frame, tải hỏng), không phải tác nhân dọn chính. Nhánh
hoãn vẫn có giá trị thật: nó ngăn lần dọn tại settle evict nhầm
frame của cửa sổ đang decode dở (keep lúc settle vẫn là cửa sổ cũ)
và ngăn khe "prefetch đáp sau evict của cửa sổ mà không còn lần
decode nào sau nữa để dọn" — nhưng trong race tự nhiên, evict của
W2 đã dọn thay. Bất kỳ báo cáo nào viết "lần thử lại đã dọn N
frame" từ một phép đo race tự nhiên đều là sai với thứ tự code này.

## 4. Kiểm chứng (số thật, chạy lại độc lập trong luồng)

- **Mới** `settleDeferred41W1.test.ts`: **6/6 pass** (esbuild bundle
  ra scratch ngoài repo, như mẫu V4).
- **Hồi quy** (cùng runner esbuild): T4 settle/toggle **11/11**,
  V4 ruler **6/6**, U1 toggle **12/12** — fail 0.
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi** (sau khi thêm
  dòng exclude test mới; trước đó test mới báo TS5097 đúng như các
  test `.ts`-import trước đây — đó là lý do exclude tồn tại).
- `vite build`: **pass** (20,83 s; cảnh báo chunk > 500 kB cũ, không
  phải lỗi mới). Dist này (không vào batch) là bản click-test chạy
  bằng `vite preview` cổng 5182 — server đã kill sau khi đo xong.
- Click-test mới: **5/5 pass** (T0, CALIB, MIRROR, S-setup, W1) —
  lượt bắt nhánh hoãn-dọn là lượt 1, không cần lượt thử lại.
- Trace thô 50 mẫu lưu ở scratch ngoài repo
  (`/tmp/round41-w1/w1-trace.json`) — không vào batch.

## 5. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **Tác nhân dọn của lần thử lại chưa có bằng chứng browser:**
   như §0.2/§3, trong race tự nhiên lần thử lại tìm thấy 0 frame.
   Muốn counter tăng cần W2 suy biến (kết thúc không evict) — chưa
   làm, vì đó không còn là đường phát ngược bình thường và ép nó
   sẽ chứng minh một trường hợp biên chứ không phải hành vi thật.
2. **Chỉ chứng minh trên một đường đo:** fixture testsrc2 640×360
   GOP 90, 90 s, 5.029.827 byte, `has_b_frames = 2` (B-frame CÓ,
   mặc định x264, không dùng `-bf 0`); decode phần mềm;
   **Chrome headless mới (`--headless=new`) qua CDP** — KHÔNG phải
   headed thật (lệnh giao nói "headed/CDP" nhưng tiền lệ V4 và
   script này đều dùng headless-new; headed thật vẫn chưa chạy);
   máy **under-load** (các luồng đợt 41 khác chạy song song — bằng
   chứng: dòng exclude của luồng W2/W3 xuất hiện trong tsconfig
   trong lúc luồng này chạy). Số fps 68,27 chỉ là số đo cửa sổ mở
   cổng, KHÔNG phải fps hiển thị ngược — cấm trích làm benchmark.
3. **Chưa đo:** Safari / máy thật / GPU thật / footage GOP thưa hơn
   / file > 32 MiB qua đường GOP Range / đường `asset:` / tab ẩn /
   máy quiet (số quiet có thể làm cửa sổ decode ngắn lại, race hẹp
   hơn — lượt 1 bắt được ở đây một phần nhờ under-load làm decode
   chậm lại).
4. **Hợp nhất tsconfig cần parent đối chiếu:** hunk W1 chỉ là dòng
   `settleDeferred41W1.test.ts`; giữ đủ dòng của mọi luồng đợt 41.
5. **Server đo đã dừng sau khi đo xong** (vite preview 5182 đã kill;
   cổng trống). Script giả định preview đang chạy (xem header) —
   chạy lại cần build + preview lại theo header.
6. **Không claim gì thêm:** không đổi ngưỡng cổng, không đổi luật
   T2/T4, không sửa handler ruler hay preview; hai trường mirror mới
   là chỉ-đọc, không nối vào UI.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Sửa: `apps/web/src/lib/reverseWebcodecs.ts` (thêm 2 getter chỉ-đọc
  + 2 trường status gộp; không sửa logic decode/evict/gate nào).
- Mới: `apps/web/src/lib/settleDeferred41W1.test.ts` (6/6).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới;
  xem lưu ý gộp ở §5.4).
- Mới: `apps/web/scripts/clicktest-round41-w1-settle-deferred-pipe.mjs`
  (click-test app thật 5/5).
- Mới: `docs/PHASE9_ROUND41_W1_SETTLE_DEFERRED_LIMITS.md` (file này).
- Không sửa: `preview.tsx`, `Timeline.tsx`, cổng/gate, toggle
  registry, i18n (không thêm key), `apps/web/dist/` (không vào batch
  theo tiền lệ), paths-loop, build-loop-log. Scratch đo nằm ngoài
  repo (`/tmp/round41-w1/`: fixture 90 s, log vite, bundle test,
  trace 50 mẫu) — KHÔNG vào batch.
