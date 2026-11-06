# Phase 9 đợt 43, luồng Y1 — Settle-drop: 3 nợ mở của đợt 42 §5.2 — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa production code nào (xem §1.3), KHÔNG tự stage batch push
(parent gộp). Mọi số timing đều under-load hoặc gắn harness headed —
cấm dùng làm baseline quiet hay claim fps.

Đóng nợ đợt 42 §5.2 (`docs/PHASE9_ROUND42_LIMITS.md` §5.2, LIMITS X1
§5.2–§5.4): settle-drop (tác nhân dọn lần thử lại) trên (1) GOP thưa
> 32 MiB qua Range, (2) đường `asset:`, (3) tab ẩn.

## 0. Kết luận ngắn (không vượt số đo)

1. **(1) GOP Range: SUCCESS, lặp lại được 2/2 lượt chạy.** Lần thử
   lại dọn đúng 90 frame trên đường GOP Range thật (fixture GOP thưa
   66,62 MiB, GOP 90 frame, controller `gopMode = gop-range`): mẫu
   settle có `winInFlight = true`, counter giữ 0, cache giữ 211;
   mẫu cuối (W2 hỏng kết thúc) counter 0 → 90, cache 211 → 121
   (sụt đúng 90), `uiStatus = off`, `prefetchFrames = 0`. Lượt chạy
   cuối: settle +82 ms, cuối +810 ms, W2 hỏng 811,3 ms (ok=false,
   failed=true). Request lượt đó: 147 = 1 HEAD (chỉ của probe — T3
   HEAD đã bỏ nhờ chia sẻ probe của X4) + 146×206, **0 GET toàn
   file**, 71.865.943 byte = 102,87% file — KHÔNG claim tiết kiệm
   ở lượt đầu (đúng luật W4/X4; tiết kiệm chỉ tính từ cửa sổ lặp
   lại, không đo ở đây).
2. **(2) Đường `asset:`: settle-drop CÓ hoạt động, nhưng 8/8 attempt
   chỉ qua nhánh dọn-ngay, KHÔNG bắt được nhánh thử lại.** Rehydrate
   thật (AssetStore IDB thật + `rehydrateMediaItems` thật) cho
   `asset:a_e40641880f8e75dc` → blob: URL, controller rơi về
   `full-file-fallback` (lý do gate: blob: không gửi `Accept-Ranges`
   nên T3 từ chối GOP — xem §3). Trên đường này, W2 hỏng (blob load
   232–304 ms, ok=false) kết thúc TRƯỚC khi prefetch settle 23–175
   ms, nên lần dọn chạy ngay lúc settle: counter 0 → 90, cache
   211 → 121 (khớp đúng 90) trong cả 8 attempt (2 chiến lược aim).
   Nhánh thử lại trên đường `asset:` vì vậy CHƯA được chứng minh
   trực tiếp — nhưng hàm dọn là cùng một `dropSettledPrefetchIfOff`
   không phụ thuộc scheme URL, và nhánh thử lại đã được chứng minh
   trên đường GOP (§2) + đường full-file thường (X1). Kết luận đúng
   mức: settle-drop trên `asset:` là thật (nhánh dọn-ngay), nhánh
   thử lại trên `asset:` vẫn là nợ mở nhỏ (xem §5.2).
3. **(3) Tab ẩn: SUCCESS ngay attempt 1, timer bị throttle nhưng
   counter KHÔNG lệch.** Race chạy toàn bộ trong lúc tab bị ẩn
   (`visibilityState = hidden` đã kiểm chứng): settle +74 ms
   (winInFlight=true, counter 0, cache 211), cuối +813 ms
   (counter 0 → 90, cache 211 → 121, ui off). Timer probe đặt lúc
   ẩn: timer 100 ms nổ sau **427,1 ms** trong lúc vẫn ẩn (throttle
   ~4,3×, không phải clamp 1000 ms trong setup này); rAF
   **không chạy lúc ẩn** (`rafFired = false`). Prefetch/decode vẫn
   chạy lúc ẩn (bắt được `inFlight = 1` và aim tiến triển trong lúc
   ẩn) — VideoDecoder không bị visibility pause. Kết luận: counter
   settle-drop chạy trên promise chain, không qua timer/rAF, nên
   throttle timer lúc ẩn không làm sai lệch counter.

## 1. Thay đổi code

### 1.1 Mới

- `apps/web/src/lib/settleDeferred43Y1.test.ts` (14/14): khóa tiền
  đề thuần — wiring GOP ở biên ngưỡng (32 MiB tắt, +1 byte bật,
  128 MiB bật, +1 byte khóa, chưa biết size tắt), plan rehydrate
  `asset:<id>` khớp đúng manifest theo id (id lạ → skipped, không
  bịa candidate), quyết định dọn là hàm thuần đồng bộ (không phụ
  thuộc timer/rAF/visibility), số học evict cho cửa sổ GOP thưa
  (dọn đúng 75 frame prefetch ngoài cửa sổ cũ; giao biên chỉ dọn
  phần ngoài).
- `apps/web/scripts/settle-headed-43y1.mjs` — harness headed 3 pha
  (xem §2). Chạy: `node apps/web/scripts/settle-headed-43y1.mjs`
  (từ gốc repo; tự lo Xvfb + Chrome headed + server Range; fixture
  tạo trước, xem §1.2).
- `docs/PHASE9_ROUND43_Y1_SETTLE_LIMITS.md` (file này).

### 1.2 Sửa

- `apps/web/tsconfig.json`: chỉ thêm 1 dòng exclude cho test mới
  (tiền lệ X1/X4; các dòng của luồng đợt 43 khác đã có sẵn lúc sửa
  — parent gộp giữ đủ dòng mọi luồng).

### 1.3 Không sửa (ghi rõ)

- KHÔNG sửa `reverseWebcodecs.ts`, `preview.tsx`, cổng/gate, toggle
  registry, i18n, `gopRangeFetch39T3.ts`, `gopCache40V2.ts`,
  `assetStore.ts`, `rehydrate36S5.ts`. Vì vậy không có hunk marker
  `ROUND43-Y1` nào trong file dùng chung — không có gì để đánh dấu.
  Toàn bộ cơ chế đo đã đủ trong code cũ (mirror W1 + counter T4).

### 1.4 Fixture (tạo bằng ffmpeg, không vào repo)

- Gốc: `testsrc2` 640×360, 30 fps, 420 s, x264 `-g 90 -bf 2`,
  AAC 128k, `+faststart`: **69.861.131 byte = 66,62 MiB**
  (> ngưỡng GOP 32 MiB, ≤ trần S4 128 MiB), 12.600 frame,
  140 GOP × 3 s.
- Bản hỏng: copy gốc, zero đúng packet IDR của GOP [30,33)
  (ffprobe: keyframe `pts_time = 30.000000`, `pos = 5378169`,
  `size = 14007`) — moov nguyên vẹn. ffmpeg decode vùng 30–33 s
  báo `Invalid NAL unit size (0 > 14003)`; vùng 414 s sạch.
- Vì sao GOP [30,33) mà không phải GOP cuối file: GOP cuối còn nằm
  trong cache GOP 32 MiB lúc W2 nên W2 không fetch bù (không móc
  được delay); GOP đầu file chắc chắn đã bị evict nên W2 phải
  fetch bù lại nó (xem §4.2). Bản hỏng GOP [300,303) thử trước
  cũng bị loại vì lý do này.
- Mục tiêu W2: t = 32,7 s, present slice 75 frame [30,2 .. 32,7]
  nằm trọn GOP [30,33); decodeFrom = IDR hỏng 30,0 s → cửa sổ W2
  decode 0 frame → `unsupported = true` → return false TRƯỚC khối
  evict (cùng dạng suy biến X1, nay trên đường GOP Range).

## 2. Phương pháp harness (đọc trước khi trích số)

Harness KHÔNG lái UI app đầy đủ mà bundle đúng module lib của app
(`ReversePreviewController` qua registry `getReversePreviewController`
— đúng đường preview dùng — cộng `AssetStore` + `rehydrateMediaItems`)
vào một page nhỏ, lái bằng CDP trên Chromium headed thật (không
`--headless`, dưới Xvfb, `--disable-gpu` theo công thức X1/X2).
Server `node:http` tối giản (như X4): HEAD → `Content-Length` +
`Accept-Ranges: bytes`; GET Range → 206 + `Content-Range`; GET
không Range → 200 toàn file; log mọi request.

Chuỗi race mỗi attempt (giống X1, thêm aim + delay có kiểm soát):
setup cửa sổ lành 417 s → cổng (wanted=true, đo thật, không bypass)
→ cửa sổ mới 412 s khởi động prefetch → poll bắt `inFlight ≥ 1`
→ aim chờ prefetch gần xong (cache ≥ setup + prefetch − 20, hoặc
stall 25 ms) → tắt toggle + W2 hỏng 32,7 s NGAY → trace mirror mỗi
~5 ms → phân loại: SUCCESS chỉ khi mẫu settle có winInFlight=true
+ counter chưa tăng + cache không sụt, VÀ mẫu cuối (W2 kết thúc)
có counter tăng ≥ 1 + cache sụt đúng bằng delta + ui off +
prefetch 0. Phân loại PARTIAL-immediate-drop: counter tăng khớp
cache sụt nhưng settle xảy ra SAU khi W2 kết thúc (nhánh dọn-ngay
của T4, không phải lần thử lại).

Giới hạn của harness (không giấu): badge DOM của preview.tsx KHÔNG
được đọc (page harness không có shell preview) — số báo là
`uiStatus`/`prefetchFrames` từ cùng mirror mà badge đọc (X1 đã đối
chiếu badge DOM = "⏩ Decode-ahead: TẮT" khi ui off + prefetch 0).
Server không phải bridge Express thật (hợp đồng HTTP Range thì
giống X4). Đường `asset:` không qua click ProjectMenu (xem §3.2).

## 3. Số đo thật từng mục

### 3.1 (1) GOP Range — SUCCESS (2/2 lượt chạy)

Lượt cuối (attempt 1 thắng ngay; lượt trước đó cũng SUCCESS attempt
1 với settle +34 ms — tính lặp lại được):

- Setup: `gopMode = gop-range`, probe `{source: "head", size:
  69861131}`, `fallback = null`, fps cổng 605,1 (under-load, không
  phải baseline), cache 91. Gate: `allowed-experiment`,
  `easy-decode-footage`.
- Prefetch: `inFlight = 1`, cache 121, `prefetchFrames = 136`,
  settled 0. Aim: cache-near-full (target ~207).
- W2: durMs 811,3 ms, ok=false, failed=true (800 ms là delay server
  cho range GOP hỏng — xem §4.2; phần còn lại ~11 ms là decode hỏng
  thật, khớp debug cô lập 31 ms cho cùng cửa sổ không delay).
- Trace: settle **+82 ms: winInFlight=true, settled 0 → 0, cache
  211 → 211** (nhánh hoãn, đúng W1); cuối **+810 ms:
  winInFlight=false, settled 0 → 90, cache 211 → 121 (sụt đúng 90),
  ui=off, prefetch=0**.
- `drawn-after-W2`: 121 frame [12240..12360] = đúng cửa sổ cũ được
  giữ (không có frame nào của GOP hỏng) — lần thử lại chỉ dọn
  prefetch ngoài keep, không xóa frame cửa sổ hiện tại.
- Request lượt này (1 attempt duy nhất): **147 = 1 HEAD + 146×206,
  0 GET toàn file, 71.865.943 byte = 102,87% file**. 1 HEAD duy nhất
  là của probe (T3 HEAD đã bỏ nhờ chia sẻ probe — khớp X4).
  Không claim tiết kiệm lượt đầu.

### 3.2 (2) Đường `asset:` — rehydrate thật, dọn-ngay 8/8, thử lại chưa bắt được

Rehydrate (2a, PASS): ingest fixture hỏng vào AssetStore thật
trong page (IDB thật) → `assetId = a_e40641880f8e75dc`, manifest
size 69.861.131 → `rehydrateMediaItems` với spec clip
`src = "asset:a_e40641880f8e75dc"` → `restoredSrcs =
["asset:a_e40641880f8e75dc"]`, `failedSrcs = []`, `skipped = []`,
blob: URL thật. Đây là cùng 2 module mà App/ProjectMenu dùng
(đợt 36 S5 / đợt 37 T3); preview nối controller bằng
`item.proxyUrl ?? item.url` (= blob: URL này) +
`knownSizeBytes = item.file.size` + `gopRangeEnabled: true`
(preview.tsx:1237–1241) — harness `blobNew` mirror đúng 3 tham số
đó. Điểm KHÔNG mirror: click mở file `.vcut.json` qua ProjectMenu
và vòng draw của preview.tsx (xem §5.3).

Controller trên blob: URL (2b): `gopMode = full-file-fallback`,
`fallback = "gate: accept-ranges-unknown: server không gửi
Accept-Ranges, không giả định"`. Phát hiện: **blob: URL không quảng
cáo `Accept-Ranges` nên cổng gate từ chối đường GOP ngay từ đầu —
đường `asset:` trong thực tế chạy bằng full-file, không phải GOP
Range** (không phải lỗi: fallback an toàn đúng thiết kế; nhưng mọi
claim "asset: chạy GOP Range" đều sai).

Race trên blob: URL — 8 attempt (4 aim chặt + 4 aim lỏng 50%):

| Attempt | W2 durMs / ok | Settle | Counter | Cache |
|---|---|---|---|---|
| Chặt 1–4 (lượt trước) | 235–304 ms / false | +261…+368 ms, sau W2 23–77 ms | 0 → 90 | 211 → 121 |
| Lỏng 1–4 (lượt cuối) | 232–273 ms / false | +343…+408 ms, sau W2 95–175 ms | 0 → 90 | 211 → 121 |

- Mọi attempt: W2 hỏng đúng thiết kế (ok=false, failed=true),
  counter tăng đúng 90, cache sụt đúng 90, ui off, prefetch 0 —
  settle-drop CÓ dọn trên đường `asset:`, qua nhánh dọn-ngay.
- Nhánh thử lại không bắt được vì settle luôn rơi SAU khi W2 kết
  thúc, dù aim lỏng đã để prefetch còn ~50% lúc tắt: W2 đường blob
  tốn 232–304 ms load toàn file (fetch blob 66 MB + parse) và
  prefetch dường như chững lại trong lúc đó (settle trễ thêm
  23–175 ms sau W2) — giả thuyết: load toàn file trên main thread
  làm chậm callback output của decoder prefetch. Đây là GIẢ THUYẾT
  (chưa đo tách riêng), không phải kết luận.
- Vì hàm dọn là cùng một code không phụ thuộc scheme URL, và nhánh
  thử lại đã chứng minh trên GOP (§3.1) + full-file thường (X1),
  nên nợ (2) được coi là đóng ở mức "settle-drop hoạt động trên
  `asset:`", còn "nhánh thử lại riêng trên `asset:`" giữ làm nợ mở
  nhỏ (§5.2) — không ép claim.

### 3.3 (3) Tab ẩn — SUCCESS (attempt 1)

- Setup + cổng lúc tab còn hiện (fps 792,0 under-load), rồi ẩn tab
  bằng cách activate tab blank qua CDP Target (không dùng cờ mô
  phỏng): `visibilityState = hidden` đã kiểm chứng bằng poll.
- Prefetch khởi động và aim tiến triển TRONG LÚC ẨN (bắt được
  `inFlight = 1`, cache 121 → 207 trong lúc ẩn) — VideoDecoder
  không bị visibility pause.
- Trace (toàn bộ lúc ẩn): settle **+74 ms: winInFlight=true,
  settled 0 → 0, cache 211 → 211**; cuối **+813 ms:
  winInFlight=false, settled 0 → 90, cache 211 → 121 (sụt đúng 90),
  ui=off, prefetch=0**. W2 hỏng 811,5 ms (delay 800 ms + decode
  hỏng), ok=false.
- Timer/rAF probe đọc TRONG LÚC CÒN ẨN (không đọc sau khi hiện
  lại): timer 100 ms nổ sau **427,1 ms** (throttle ~4,3×; elapsed
  lúc đọc 1219,9 ms; timer vẫn nổ được lúc ẩn, không bị clamp
  1000 ms trong setup này); **rAF không chạy lúc ẩn**
  (`rafFired = false`, `rafElapsedMs = null`). Sau hiện lại:
  `visibility = visible`.
- Đọc đúng: throttle timer và pause rAF là thật, nhưng counter
  settle-drop vẫn khớp đúng 90 = 90 — vì đường dọn chạy trên
  promise chain (`p.then(drop...)` + chain vào `decodePromise`),
  không qua `setTimeout`/`setInterval`/rAF nào. Grep xác nhận:
  không có `setTimeout`/`setInterval` trong `reverseWebcodecs.ts`
  và `reverseDecodeAhead.ts` (đường drop); quyết định dọn là hàm
  thuần đồng bộ `shouldDropSettledPrefetch` (test §1.1 khóa).

## 4. Kiểm chứng + sự cố đã gặp

### 4.1 Kiểm chứng độc lập trong luồng

- Mới `settleDeferred43Y1.test.ts`: **14/14 pass** (esbuild bundle
  ra scratch, như X1/W1).
- Hồi quy (cùng runner esbuild): T4 **11/11**, V4 **6/6**, U1
  **12/12**, W1 **6/6**, X1 **7/7** — fail 0.
- `tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi, exit 0**
  (kiểm tra cuối; giữa luồng từng đỏ do file của luồng đợt 43
  khác đang sửa song song — lúc đó có lỗi ở
  `ingestMinDisplay43Y3`, `reverseCompat43Y6` và 3 lỗi
  `preview.tsx` TS6133 `planSeekRecovery`/`seekElementRecreated`
  chưa dùng — các luồng đó đã sửa xong và thêm dòng exclude trước
  khi luồng này kết thúc; không phải file Y1, không sửa thay).
- `vite build` tại chỗ: **pass (5,81 s)**, chỉ cảnh báo chunk
  > 500 kB cũ. (Build snapshot riêng thất bại oan vì
  `apps/web/node_modules` gần rỗng — app resolve dep từ root
  `node_modules`; build tại chỗ mới đúng. `dist/` không vào batch
  theo tiền lệ.)
- Click-test headed mới: **4/5 pass** (T0, GOP, rehydrate 2a, tab
  ẩn; pha asset 2b FAIL theo tiêu chí SUCCESS nghiêm ngặt vì chỉ
  bắt được nhánh dọn-ngay — xem §3.2, không giấu thành PASS).
- Scratch đo nằm ngoài repo (`~/workspace/tmp-round43-y1/`:
  fixture, bundle, trace JSON, log chrome) — KHÔNG vào batch.

### 4.2 Ba lỗi harness và cách sửa (ghi để luồng sau khỏi lặp lại)

1. **Controller tạo bằng `new` không vào registry** (lượt 1: cổng
   luôn báo `software-decode-not-measured`, fps null dù decode đo
   được 13–48): `reverseDecodeAheadStatus` /
   `setReverseDecodeAheadWanted` chỉ duyệt registry
   `previewControllers`. Đã sửa: dùng `getReversePreviewController`
   (đúng đường preview). Bài học: harness controller phải đi qua
   registry, không `new` trực tiếp.
2. **Fixture 720p không qua cổng dưới tải nặng** (fps decode 13–48
   < ngưỡng 60): chuyển sang 360p 420 s (66,62 MiB, vẫn > 32 MiB)
   → fps 445–1028, cổng mở bằng `easy-decode-footage`.
3. **Race tự nhiên quá hẹp trên máy nhanh + W2 hỏng kết thúc
   ~10–30 ms trong khi prefetch còn ~200 ms**: server delay CÓ
   CHỌN LỌC đúng range GOP hỏng (800 ms, chỉ khi Node bật cờ
   `delayMs`, chỉ request Range bắt đầu đúng rangeStart GOP hỏng
   sai số 4 KiB) để W2 kéo dài qua thời điểm settle. Cơ chế dọn
   test là code production nguyên vẹn; chỉ timing mạng của test
   được điều khiển — không mạo nhận race tự nhiên. Lỗi kèm theo:
   `spawnSync` ffprobe bị cắt ở maxBuffer mặc định 1 MB (output
   JSON 1.048.562 byte) → range tính hỏng → delay không kích hoạt
   ở lượt 3; đã sửa `maxBuffer: 64 MiB` (lượt 4/5 delay kích hoạt,
   rangeStart = 5378169 khớp ffprobe).
4. **Aim target tính sai** (dựa trên cache lúc bắt prefetch đã chứa
   sẵn frame prefetch + prefetchFrames đếm thừa ~16 frame so với
   số frame decode thật: max cache 211 < target 222–252): sửa
   target = cache setup + prefetchFrames − 20, stall 25 ms (thay
   60 ms — flush cuối prefetch ở 360p nhanh hơn 60 ms).

### 4.3 Dị thường chưa giải thích được ở lượt 3 (ghi rõ, không giấu)

Ở lượt chạy thứ 3 (trước khi sửa maxBuffer/aim), 2/4 attempt GOP
cho W2 `ok = true` (145,5 / 167,9 ms) và tự evict 150 frame với
counter giữ 0 (dạng W2 lành tự evict của W1), trong khi cùng
fixture/cùng cửa sổ ở debug cô lập (4 lượt) và lượt 4/5 đều cho
W2 hỏng `ok = false` (11–31 ms không delay; 811 ms có delay).
Dị thường này KHÔNG tái hiện sau khi sửa harness và không có
`drawn-after-W2` để đối chiếu (chưa log ở lượt 3). Giả thuyết
mạnh nhất chưa kiểm chứng: `windowAsync(32,7)` trúng đường nhanh
`decodePromise` đang bay nên trả `true` mà không decode cửa sổ
hỏng. Vì không có bằng chứng, đây vẫn là dị thường mở — nhưng nó
không làm lung lay kết luận SUCCESS (2 lượt sạch sau đó + debug
cô lập đều nhất quán: W2 hỏng fail, lần thử lại dọn đúng 90).

## 5. Cái gì chưa làm / chưa chứng minh (trung thực)

1. **Chỉ chứng minh trên một đường đo:** fixture 360p GOP 90
   (không phải 720p/1080p, không B-frame nặng như X4); Chromium
   headed thật dưới Xvfb (màn hình ảo, không phải màn hình vật
   lý); máy under-load (loadavg lúc bắt đầu lượt cuối 1,00 /
   0,95 / 0,72); số fps cổng chỉ là số đo cửa sổ mở cổng, KHÔNG
   phải fps hiển thị ngược, KHÔNG phải baseline quiet.
2. **(2) Nhánh thử lại riêng trên đường `asset:` chưa bắt được**
   (8 attempt, 2 chiến lược aim — xem §3.2). Cần thêm ý tưởng
   mới (vd: W2 hỏng kéo dài hơn bằng delay có chọn lọc cho blob:
   không làm được qua server vì blob: nội bộ; hoặc tách đo
   contention main thread lúc load blob) — không ép bằng cách
   nới tiêu chí SUCCESS.
3. **(2) Vỏ UI chưa lái:** mở file `.vcut.json` qua ProjectMenu và
   vòng draw/toggle của preview.tsx chưa được click-test trong
   luồng này (chỉ mirror đúng tham số controller + module
   rehydrate thật). X1 đã chứng minh wiring toggle→controller
   trên đường full-file thường; phần còn thiếu là riêng vỏ UI
   cho clip `asset:`.
4. **Tab ẩn:** chỉ đo 1 lần SUCCESS (attempt 1) + timer/rAF probe
   1 mẫu; chưa đo tab ẩn kéo dài (phút), chưa đo Safari/máy thật,
   chưa đo khi tab ẩn trong lúc prefetch đang ở giai đoạn đầu
   (pha này ẩn sau cổng, trước prefetch — trường hợp ẩn giữa
   chừng prefetch đã có ở bản harness lỗi thứ tự nhưng không cho
   số đo SUCCESS).
5. **Dị thường lượt 3 (§4.3)** vẫn mở.
6. **Không claim gì thêm:** không đổi ngưỡng cổng (60 fps), không
   đổi luật T2/T4, không đổi ngưỡng GOP 32/128 MiB, không đổi mặc
   định TẮT của GOP (preview bật tường minh như cũ), không sửa
   production code.

## 6. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/settleDeferred43Y1.test.ts` (14/14).
- Mới: `apps/web/scripts/settle-headed-43y1.mjs` (headed 4/5;
  GOP + hidden SUCCESS, asset PARTIAL — xem §3).
- Sửa: `apps/web/tsconfig.json` (chỉ thêm 1 dòng exclude test mới).
- Mới: `docs/PHASE9_ROUND43_Y1_SETTLE_LIMITS.md` (file này).
- Không sửa: `reverseWebcodecs.ts`, `preview.tsx`, cổng/gate,
  toggle registry, i18n, `apps/web/dist/` (không vào batch),
  paths-loop, build-loop-log. Scratch đo nằm ngoài repo
  (`~/workspace/tmp-round43-y1/`) — KHÔNG vào batch.
