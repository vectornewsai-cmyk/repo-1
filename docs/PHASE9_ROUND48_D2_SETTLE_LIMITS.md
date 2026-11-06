# Phase 9 đợt 48, luồng D2 — Settle-drop: instrumentation tầng harness tách đuôi feed/flush/drain + đo decoded trực tiếp của W2 — LIMITS

Ngày: 05/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa production code nào, KHÔNG tự stage batch push (parent gộp).
Mọi số timing đều under-load nếu có luồng đợt 48 khác chạy song song —
cấm dùng làm baseline quiet hay claim fps.

## 0. Kết luận ngắn (số thật, 12 attempt / 2 lượt headed)

1. **Pha chiếm đa số gap là FLUSH — đã chứng minh bằng timestamp,
   12/12 attempt.** Gap settle−W2end (lượt 1: 113–291 ms, tb
   193,9; lượt 2: 80–186 ms, tb 154,1) tách thành: **feedTail =
   0,0 ms trong cả 12 attempt** (feed 136 chunk xong trước toggle
   368–1128 ms, chỉ tốn 1,3–5,3 ms để enqueue), **flushTail =
   71–281 ms (90–99% gap, tb ~95%)**, **drainTail = 1,0–10,8 ms
   (tb ~5,6 ms)**. Tổng 3 pha = gap (sai số ≤ 0,1 ms). Cái trễ
   KHÔNG phải vòng feed chunk — mà là `await decoder.flush()`
   của prefetch: decoder phải decode xong 136 chunk đã enqueue
   (flush dài 803–2676 ms) rồi mới resolve; W2 kết thúc trước,
   prefetch resolve sau 71–281 ms.
2. **Decoded TRỰC TIẾP của W2 = 0 frame — 12/12 attempt.** Đếm
   output callback của chính decoder W2: 0 output trong cả 12 lần.
   Feed thành công đúng 1/2 chunk (chunk key ts 30,066,667 µs);
   chunk delta thứ 2 (ts 30,166,667 µs) làm `decode()` ném đồng bộ
   `Failed to execute 'decode' on 'VideoDecoder': A key frame is
   required after configure() or flush.` — feed loop bắt lỗi này
   rồi resolve `done`, KHÔNG gọi flush, KHÔNG có error callback
   nào. **Đính chính C2 §4.1:** short-circuit của W2 KHÔNG phải
   "callback error resolve done ngay" — đo trực tiếp cho thấy
   error callback KHÔNG BAO GIỜ bắn (0/12); đường thoát là
   decode() throw đồng bộ trong vòng feed.
3. **Decoder W2 chỉ sống 0,3–4,0 ms ở CUỐI W2.** Decoder được tạo
   lúc t0 + (durMs − 0,6..4,0 ms), tức > 99% thời gian W2
   (326–1714 ms) là load() fetch lại blob 69 MB + demux + dò GOP
   TRƯỚC khi decodeGop tạo decoder. "W2 chậm" không phải decode
   chậm — mà là load chậm (đo được: lượt 1 tải cao W2 486–1714 ms,
   lượt 2 tải thấp hơn W2 326–609 ms).
4. **SUCCESS đường asset: vẫn mở — 0/12 attempt D2** (cộng C2
   0/9 + B1 0/2 = 0/23). D2 chỉ đo, không đổi biến race nên không
   kỳ vọng bắt SUCCESS — nhưng giờ đã biết đích xác cái cần
   thắng: đuôi flush của prefetch (71–281 ms), không phải feed
   hay aim.
5. **Quan sát phụ (chưa khóa cơ chế): prefetch của cửa sổ setup
   KHÔNG BAO GIỜ tạo decoder.** Mỗi attempt chỉ có đúng 3
   instance: decode cửa sổ 412 (121 chunk), prefetch 412
   (136 chunk), W2. Prefetch setup [12330,12435] không xuất hiện
   trong trace 12/12 lần — khớp với log C2 ("keys đầu" đã chỉ có
   `12150:12285`). Cơ chế vì sao (scheduler decode-ahead chỉ
   chạy sau khi cửa sổ đã đổi sang 412?) chưa xác minh — nợ cho
   đợt sau, không claim.
6. **Hai bug đo đã bắt + sửa trong lượt (xem §5):** (a) lệch đồng
   hồ tuyệt đối/tương đối làm split lượt 1 báo feed 100% SAI —
   đã sửa bằng `prefetchTailSpans` + tính lại từ raw đã lưu;
   (b) so timestamp làm tròn mili-giây đếm nhầm chunk feed thành
   công 0 thay vì 1 ở 2 attempt — đã sửa bằng xếp theo thứ tự ghi
   events. Số trong LIMITS này là số SAU khi sửa, đã chạy lại
   live lượt 2 xác nhận.

## 1. Thiết kế đo (instrumentation tầng harness, không sửa production)

### 1.1 Vì sao bọc `VideoDecoder` mà không sửa production

`decodeGop` (`reverseWebcodecs.ts`, dòng ~309–440) tạo một
`VideoDecoder` mới mỗi lần gọi; mọi pha feed/flush/drain đều xảy
ra bên trong đó nên harness không nhìn thấy từ bên ngoài (chỉ thấy
cache tăng + khóa inFlight biến mất). Sửa production để thêm getter
hay log là thay đổi hành vi thật, cần lý do riêng — đợt 47 §4.2 chỉ
cho instrumentation. Cách làm của D2: page do harness serve bọc
`window.VideoDecoder` bằng subclass TRƯỚC khi bundle module load
(script classic chạy trước `<script type="module">`), ghi lại mọi
sự kiện trên cùng đồng hồ `performance.now()` của page:

- `configure` — lúc `decoder.configure()` gọi.
- `decode` — từng `decoder.decode(chunk)`: mốc + `chunk.timestamp`
  (µs) + `chunk.type` (key/delta). Feed loop của `decodeGop` await
  `getData` từng chunk rồi `decode()` nên mốc này đo trực tiếp nhịp
  feed, kể cả thời gian fetch Range từng chunk.
- `decode-throw` — `decode()` ném (decoder đã lỗi, feed dừng).
- `flush-call` / `flush-done` — lúc `flush()` gọi và lúc promise
  flush resolve (cả khi reject — ghi rõ là resolve hay reject).
- `output` — từng lần output callback bắn: mốc + `frame.timestamp`
  (µs). Đây là drain thật của decoder.
- `error` — error callback bắn (short-circuit): mốc + message.
- `close` — lúc `decoder.close()` gọi.

Wrapper chỉ ghi + chuyển tiếp y nguyên (output/error gốc vẫn chạy,
`isConfigSupported` static được thừa kế qua `extends`, không đổi
hành vi decode). Mọi instance được ghi vào `window.__vdTrace`
(`snapshot()` deep-copy, `reset()` xóa) để harness đọc qua CDP.

### 1.2 Số học tách pha (module thuần `settle48D2.ts`, khóa test 24/24)

- `classifyDecoderInstance`: phân loại instance thành `w2` /
  `prefetch` / `other` bằng (a) thời điểm tạo so với t0 toggle và
  (b) khoảng timestamp chunk đã feed. W2: tạo sau t0 (±1 ms) + chunk
  trong [30,000,000, 32,466,667] µs (sample 900–974). Prefetch 412:
  tạo TRƯỚC t0 + còn sống lúc t0 (feed chưa xong hoặc flush chưa
  resolve) + chunk trong [405,000,000, 409,500,000] µs (sample
  12150–12285). Điều kiện tạo-trước-t0 là cần thiết (sau toggle
  wanted đã tắt, không còn prefetch mới). Decoder cửa sổ 412 bị
  loại vì feed xong trước t0 dù chunk của nó chồng khoảng prefetch
  ở [408, 409,5] s.
- `splitSettleGap`: phân hoạch đoạn [w2end, settle] thành
  feedTail + flushTail + drainTail theo đúng thứ tự code
  `decodeGop` (feed → flush → drain/resolve). Tổng 3 pha = gap
  (sai số làm tròn 0,1 ms) khi thứ tự pha bình thường; nếu flush
  chưa resolve lúc settle hoặc thứ tự đảo thì ghi `anomaly` rõ ràng
  thay vì bịa số. **Chỉ nhận mốc t0-tương đối** — mốc tuyệt đối
  phải qua `prefetchTailSpans` trước (chốt chặn, xem dưới).
- `prefetchTailSpans`: đổi mốc đuôi feed/flush tuyệt đối sang
  tương đối t0. Bắt buộc trước `splitSettleGap` (bug lượt 1, §5).
- `analyzeVdTrace`: phân tích trọn vẹn một attempt (phân loại
  instance + decoded trực tiếp W2 + tách gap) — harness và
  replay dùng chung một nguồn, không tính lại bằng tay.
- `w2DecodedDirect`: đếm output callback của chính decoder W2
  TRƯỚC khi error callback bắn = số frame decoder thật sự nhả ra
  trước khi chạm GOP hỏng. Giới hạn đo (ghi rõ): production chỉ
  tăng `decoded` khi frame CHƯA có trong cache và timestamp map
  được sang sample index. Với cửa sổ W2 [900,974] không chồng cache
  lúc đó (cache giữ cửa sổ 412 + prefetch) và timestamp sample duy
  nhất (30 fps, không trùng presentation timestamp) nên
  outputsBeforeError == decoded thật của `decodeGop` trong fixture
  này — nếu 2 điều kiện đó vỡ thì số này là giới hạn trên của
  decoded, không phải decoded chính xác.

### 1.3 Harness headed (`settle-headed-48d2.mjs`)

Sao chép driver race của C2 (aim slack 3, cổng 412, cổng prefetch
đang chạy, toggle+W2 trong 1 eval, trace lấy mẫu bằng
`performance.now()` trong page), KHÔNG chạy pha D1 probe W2 và
KHÔNG chạy sóng 2 slack=1 (đợt 47 §4.2 cấm siết aim/dời mốc W2 —
D2 chỉ đo, không đổi biến race). Khác C2 ở:

- Page bọc `VideoDecoder` (xem §1.1) trước khi load bundle.
- `Y.vdTrace()` / `Y.vdReset()` / `Y.t0Perf()` /
  `Y.w2startOffset()` trong entry; reset trace sau `blobNew()` mỗi
  attempt để trace mỗi attempt độc lập.
- Sau mỗi attempt: classify instance, tách gap bằng
  `splitSettleGap` (bundle `settle48D2.ts` sang scratch rồi
  `import` động trong harness — một nguồn số học duy nhất), đếm
  decoded trực tiếp của W2, ghi `d2-result-partial.json` ngay sau
  mỗi attempt (bài học C2: daemon restart giết giữa chừng mất
  trắng kết quả cuối).
- Cổng riêng D2: debug 9488 / HTTP 9040, scratch
  `~/workspace/tmp-round48-d2` (tránh đụng luồng đợt 48 khác).

## 2. Thay đổi code (chỉ file hậu tố 48D2 + LIMITS này)

- Mới: `apps/web/src/lib/settle48D2.ts` — module thuần, KHÔNG được
  import bởi production code: `VdTraceEvent` / `VdDecoderInstance`,
  `feedSpan` / `flushSpan` / `outputsBefore` / `outputsTotal` /
  `errorEvent` / `lastOutputAt`, `classifyDecoderInstance`,
  `splitSettleGap`, `w2DecodedDirect`, `prefetchTailSpans`
  (chốt chặn đổi đồng hồ), `analyzeVdTrace` (phân tích một attempt
  trọn vẹn, harness + replay dùng chung).
- Mới: `apps/web/src/lib/settle48D2.test.ts` (**31/31 pass**, §5).
- Mới: `apps/web/scripts/settle-headed-48d2.mjs` — harness headed
  (sao chép driver race C2 + instrumentation §1.1 + phân tích D2
  từng attempt; lượt 2 chạy bằng bản đã sửa, dùng `analyzeVdTrace`
  từ module thuần).
- Mới: `docs/PHASE9_ROUND48_D2_SETTLE_LIMITS.md` (file này).
- KHÔNG sửa: mọi production code (`reverseWebcodecs.ts`,
  `reverseDecodeAhead.ts`, `store.ts`, `preview.tsx`, bridge),
  tsconfig.json, mọi file luồng khác (đặc biệt mọi file 47C2).

## 3. Số đo headed thật (2 lượt, 12 attempt)

Fixture chung: `y1-corrupt-gop30-360p-gop90-420s.mp4` (69.861.131
byte = 66,62 MiB; GOP hỏng [30,33), IDR pos 5378169; fps 30,
12600 sample). Probe asset PASS ở cả 2 lượt (assetId
`a_e40641880f8e75dc`, blob size == manifest size == 69.861.131,
restored 1, failed 0, `gopMode = full-file-fallback`). Aim C2 giữ
nguyên slack 3, remaining lúc tắt 0–2, cache tắt 208–211, cổng
prefetch `only-operative` cả 12 attempt; mọi attempt đều
PARTIAL-immediate-drop (settle 0→90, cache 211→121, ui off,
prefetch 0).

### 3.1 Lượt 1 — loadavg đầu 14,94 → cuối 8,24 (tải cao, các luồng đợt 48 khác chạy song song)

| Attempt | W2 durMs | Gap | feedTail | flushTail | drainTail | Pha chiếm đa số | W2 decoded trực tiếp |
|---|---|---|---|---|---|---|---|
| 1 | 1714,2 | 280,4 | 0,0 | 279,0 | 1,3 | flush (99%) | 0 frame (feed OK 1/2 chunk) |
| 2 | 804,2 | 220,9 | 0,0 | 215,1 | 5,8 | flush (97%) | 0 frame (feed OK 1/2 chunk) |
| 3 | 707,5 | 113,2 | 0,0 | 109,7 | 3,4 | flush (97%) | 0 frame (feed OK 1/2 chunk) |
| 4 | 485,9 | 119,8 | 0,0 | 109,0 | 10,8 | flush (91%) | 0 frame (feed OK 1/2 chunk) |
| 5 | 1102,8 | 290,9 | 0,0 | 281,3 | 9,6 | flush (97%) | 0 frame (feed OK 1/2 chunk) |
| 6 | 696,6 | 138,0 | 0,0 | 130,4 | 7,5 | flush (94%) | 0 frame (feed OK 1/2 chunk) |
| **TB** | **918,5** | **193,9** | **0,0** | **187,4** | **6,4** | **flush ~97%** | **0/6 lần > 0** |

Chi tiết lượt 1 (từ raw trace, đã tính lại bằng code sửa — xem
§5): feed 136 chunk chỉ tốn 1,5–5,3 ms và xong trước toggle
507–1128 ms (feedEndRel −507..−1128); flush của prefetch dài
1324–2676 ms; output của prefetch trước cuối W2: 97–112/136
frame (còn 24–39 frame xả sau W2, trong flushTail); decoder W2
sống 0,6–4,0 ms, tạo lúc t0 + (durMs − 0,6..4,0 ms).

### 3.2 Lượt 2 — live bằng harness ĐÃ SỬA, loadavg đầu 5,78 → cuối 4,50 (tải thấp hơn)

| Attempt | W2 durMs | Gap | feedTail | flushTail | drainTail | Pha chiếm đa số | W2 decoded trực tiếp |
|---|---|---|---|---|---|---|---|
| 1 | 480,1 | 100,0 | 0,0 | 95,8 | 4,2 | flush (96%) | 0 frame (feed OK 1/2 chunk) |
| 2 | 326,2 | 94,3 | 0,0 | 93,3 | 1,0 | flush (99%) | 0 frame (feed OK 1/2 chunk) |
| 3 | 608,8 | 179,9 | 0,0 | 172,9 | 6,9 | flush (96%) | 0 frame (feed OK 1/2 chunk) |
| 4 | 336,2 | 79,6 | 0,0 | 71,2 | 8,3 | flush (90%) | 0 frame (feed OK 1/2 chunk) |
| 5 | 524,3 | 185,2 | 0,0 | 179,5 | 5,7 | flush (97%) | 0 frame (feed OK 1/2 chunk) |
| 6 | 521,2 | 185,7 | 0,0 | 182,9 | 2,8 | flush (98%) | 0 frame (feed OK 1/2 chunk) |
| **TB** | **466,1** | **154,1** | **0,0** | **140,9** | **4,8** | **flush ~96%** | **0/6 lần > 0** |

Chi tiết lượt 2: feed 136 chunk tốn 1,3–2,8 ms, xong trước
toggle 368–663 ms; flush prefetch dài 803–1445 ms; output
prefetch trước cuối W2: 105–118/136; decoder W2 sống 0,3–1,8 ms,
tạo lúc t0 + (durMs − 0,6..2,1 ms).

### 3.3 W2 decoded trực tiếp — cơ chế short-circuit đo được (12/12 attempt giống hệt nhau)

Mỗi attempt decoder W2 ghi đúng 4 sự kiện (không hơn):

1. `configure` lúc t0 + (durMs − ~1..4 ms) — decoder tạo ở CUỐI
   thời gian W2, sau khi load() + demux xong.
2. `decode` chunk key ts 30,066,667 µs (sample 900, IDR) — thành
   công, được enqueue.
3. `decode-throw` chunk delta ts 30,166,667 µs — `decode()` ném
   đồng bộ: `Failed to execute 'decode' on 'VideoDecoder': A key
   frame is required after configure() or flush.` Feed loop của
   `decodeGop` bắt lỗi này (catch) rồi resolve `done` → trả
   `decoded = 0`, `ok = false`.
4. `close` sau đó 0,1–4 ms. Không có `error` callback, không có
   `flush`, không có `output` nào.

Hệ quả: W2 decode được TRỰC TIẾP **0 frame** (12/12), feed thành
công **1/2 chunk** (12/12). Con số 0 này KHỚP với `decoded` suy ra
0 của B1/C2 (luật production khi ok=false) — nhưng giờ đã có số
đo trực tiếp thay cho suy luận, và cơ chế thoát đã đính chính
(xem §0.2 + §4).

Vì sao chunk delta thứ 2 ném "key frame required" dù chunk key
đầu đã được enqueue — CHƯA giải thích được từ trace này: có thể
decoder Chromium coi keyframe zeroed là chưa từng nhận keyframe
hợp lệ (chunk key hỏng bị loại đồng bộ lúc parse, trước khi error
callback kịp bắn), nhưng đó là SUY ĐOÁN về nội bộ Chromium, chưa
có bằng chứng phân biệt (cần test với IDR hỏng ở mức độ khác —
nợ, xem §6.5). Điều đo được và khóa được là: throw đồng bộ ở
chunk thứ 2, không error callback, 0 output.

### 3.4 Đọc gộp (n = 12)

- **feedTail = 0,0 ms trong 12/12 attempt.** Feed loop (await
  getData + decode() enqueue) xong trước toggle hàng trăm ms —
  C2 §4 nói "đuôi feed+flush" là chưa tách; tách ra thì feed
  đóng góp 0. Mọi can thiệp nhắm vào feed (prefetch sớm hơn,
  fetch nhanh hơn) đều vô ích với gap này.
- **flushTail chiếm 90–99% gap trong 12/12 attempt** (tb ~95%).
  Flush của prefetch dài 803–2676 ms (decode thật 136 frame
  software dưới tải); phần đuôi của nó sau cuối W2 chính là gap.
  Gap co lại khi tải giảm (lượt 2 tb 154 ms vs lượt 1 tb 194 ms;
  W2 durMs cũng co 918 → 466 ms) — cả hai đều do tải, nhưng thứ
  tự short-circuit (W2 xong trước, prefetch resolve sau) không
  đổi trong 12/12 lần.
- **drainTail chỉ 1,0–10,8 ms** — resolve promise + xóa khóa
  inFlight + poll harness (2–5 ms) là phần nhỏ, không phải nghẽn.
- **Tổng 3 pha = gap (sai số ≤ 0,1 ms)** trong cả 12 attempt —
  phân hoạch khép kín, không còn phần trễ chưa giải thích.

## 4. Cơ chế nào đã chứng minh, cái nào vẫn suy luận

- **Đã chứng minh bằng timestamp trực tiếp (12 attempt, 2 lượt):**
  (a) gap settle−W2end là đuôi **flush** của prefetch (90–99%),
  feed = 0, drain = 1–11 ms; (b) W2 decode trực tiếp **0 frame**,
  feed thành công 1/2 chunk, short-circuit bằng decode() throw
  đồng bộ ở chunk thứ 2, **không có error callback** (đính chính
  C2 §4.1); (c) decoder W2 sống 0,3–4,0 ms ở cuối W2, > 99% thời
  gian W2 là load + demux trước khi tạo decoder; (d) wrapper
  `VideoDecoder` không đổi hành vi decode — setup decode PASS,
  race vẫn ra đúng dạng PARTIAL-immediate-drop như C2 (settle
  0→90, cache 211→121), instance phân loại đúng 3/3 mỗi attempt
  (w2=1, prefetch=1, other=1), tổng 3 pha = gap ≤ 0,1 ms.
- **Đã chứng minh bằng test thuần (31/31, §5):** số học tách pha,
  phân loại instance, đếm decoded trực tiếp, chốt chặn đổi đồng
  hồ, xếp thứ tự events khi cùng mili-giây.
- **Vẫn suy luận (không đo ở D2):** (a) vì sao chunk delta thứ 2
  ném "key frame required" dù chunk key đã enqueue — suy đoán
  nội bộ Chromium, chưa có bằng chứng phân biệt (xem §3.3);
  (b) vì sao prefetch setup không tạo decoder — quan sát 12/12
  lần nhưng cơ chế chưa xác minh (xem §0.5); (c) flush dài
  803–2676 ms là do CPU/tải hay bản chất WebCodecs — chỉ thấy
  tương quan với loadavg (lượt 2 tải thấp hơn thì flush ngắn
  hơn), chưa có lượt máy quiet đối chứng (nợ từ C2 §6.1(b)).
- **Không đo ở D2:** lượt máy quiet, 720p/1080p, GOP khác, file
  khác, tab ẩn, UI app thật.

## 5. Kiểm chứng + 2 bug đo đã bắt trong lượt

- Mới `settle48D2.test.ts`: **31/31 pass** (esbuild bundle
  `--format=esm` ra scratch, chạy bằng node — đúng mẫu A1/B1/C2).
- Hồi quy cùng runner (`run-tests.mjs`, scratch
  `~/workspace/tmp-round48-d2/`): A1 **20/20**, Z1 **19/19**,
  B1 **19/19**, Y1 **14/14**, C2 **24/24**, D2 **31/31** — fail 0.
- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0, 0 lỗi**.
- `vite build` không chạy (không đụng UI/build code — như C2).
- Headed lượt 1: 6 attempt, exit 0, `d2Complete=6/6` (nhưng split
  SAI do bug đồng hồ — xem dưới; đã tính lại từ raw + chạy lại
  live lượt 2). Headed lượt 2 (harness đã sửa): 6 attempt,
  exit 0, `d2Complete=6/6`, split đúng ngay trong log.

**Bug 1 — lệch đồng hồ tuyệt đối/tương đối (nghiêm trọng, đã sửa
và đã chạy lại live).** Lượt 1 `analyzeVd` (bản local trong
harness) đưa `feedEnd`/`flushCall`/`flushDone` tuyệt đối
(performance.now từ lúc page load, ~19000 ms) thẳng vào
`splitSettleGap` cùng `settleAtMs`/`w2endMs` tương đối t0
(~2000 ms) → feedTail nuốt trọn gap, 6/6 attempt báo feed 100%
SAI. Phát hiện khi đọc raw trace: feedEnd tuyệt đối 18417 > settle
tương đối 1994 là vô lý. Sửa: (a) thêm `prefetchTailSpans`
(đổi mốc tuyệt đối → tương đối t0) + đưa `analyzeVdTrace` vào
module thuần `settle48D2.ts` để harness và replay dùng chung một
nguồn; (b) xóa `analyzeVd` local trong harness; (c) thêm test khóa
bằng đúng số attempt 1 (feed 0 / flush 279,0 / drain 1,3) + test
khóa hình dạng bug (đưa mốc tuyệt đối vào split thì feedTail =
  toàn gap); (d) tính lại lượt 1 từ `vdRaw` đã lưu bằng
  `replay-d2-run1.mjs` (không cần chạy lại browser cho lượt 1);
  (e) chạy lại live lượt 2 bằng harness đã sửa — 6/6 split đúng
  ngay trong log, khớp mẫu lượt 1 đã sửa. Số trong LIMITS này là
  số sau sửa; mọi số split "feed 100%" ở log lượt 1 (`d2-headed.log`
  bản đầu) đều HỦY, cấm trích — chỉ dùng `d2-result-run1-corrected.json`
  và log lượt 2.

**Bug 2 — đếm bằng timestamp khi hai sự kiện cùng mili-giây
(nhẹ, đã sửa).** `w2DecodedDirect` ban đầu so `t < errorT`:
lượt 1 attempt 2/3 có decode và decode-throw cùng @803.8 ms nên
đếm nhầm 0 chunk feed thành công (thực tế decode() đầu đã thành
công). Sửa: xếp theo thứ tự ghi trong mảng events (thêm test khóa
cùng-mili-giây). Sau sửa: 12/12 attempt đều feed thành công 1/2.

**Sửa nhỏ khác trong lượt:** classifier ban đầu nhận nhầm
instance tạo SAU toggle nhưng feed chunk prefetch thành `prefetch`
— đã siết thêm điều kiện tạo-trước-t0 (test khóa); `splitSettleGap`
thêm dung sai 0,5 ms cho cảnh báo "flush trước feed" vì mốc
decode cuối và flush() gọi kề nhau có thể đảo thứ tự 0,1 ms do
độ phân giải đồng hồ.

## 6. Cái gì chưa làm / chưa chứng minh + nợ còn lại

1. **SUCCESS đường asset: vẫn mở** (0/12 D2; 0/23 tính cả C2+B1).
   D2 chỉ đo, không đổi biến race. Hướng cho đợt sau (từ số D2):
   cái cần thắng là đuôi **flush** của prefetch (71–281 ms),
   không phải feed hay aim — ví dụ thiết kế race khác để đuôi
   flush chồng lên pha load của W2 (toggle sớm hơn), hoặc can
   thiệp production (resolve sớm khi đủ frame mới — thay đổi hành
   vi thật, cần test đỏ-trước/xanh-sau như C2 §6.1 đã dặn). D2
   không quyết định hướng nào, chỉ khóa số.
2. **Vì sao chunk delta thứ 2 ném "key frame required":** chưa
   giải thích được (xem §3.3) — cần test với IDR hỏng ở mức độ
   khác (ví dụ chỉ hỏng vài byte đầu vs zero toàn packet) để xem
   throw có còn ở chunk 2 không.
3. **Vì sao prefetch setup không tạo decoder:** quan sát 12/12
   lần, cơ chế chưa xác minh (xem §0.5) — cần đọc code
   decode-ahead scheduler / thêm trace mốc wantedOn (harness).
4. **Lượt máy quiet** (loadavg ~0,1) để xem gap có co về ~40 ms
   như B1 hay giữ nguyên vài trăm ms — nợ từ C2 §6.1(b), D2
   không làm (chỉ ghi nhận: lượt 2 tải thấp hơn thì gap + W2
   durMs + flush đều ngắn hơn lượt 1, nhưng không phải đối chứng
   có kiểm soát).
5. **`decoded` trực tiếp của W2:** ĐÃ CÓ — 0 frame (12/12).
   Điều kiện "outputs == decoded" (cửa sổ W2 không chồng cache,
   timestamp sample duy nhất) thỏa trong fixture này; fixture
   khác (B-frame trùng timestamp, cửa sổ chồng cache) thì số này
   chỉ còn là giới hạn trên — ghi rõ để đợt sau không áp dụng
   mù.
6. **Vòng draw/toggle cho clip `asset:` trên UI app thật:** vẫn
   chưa chứng minh (nợ từ B1 §6.4).
7. **Bug race `loadSample` (B1 §6.2):** vẫn mở, D2 không đụng tới.
   (Lưu ý: W2 chết ở decode() throw, không phải ở getData —
   không liên quan trực tiếp tới loadSample.)
8. **Chỉ chứng minh trên một fixture:** 360p GOP 90, GOP hỏng
   [900,990); chưa mô hình/đo 720p/1080p, GOP khác, file khác.
9. **Không claim gì thêm:** không đổi luật dọn T2/T4, không đổi
   ngưỡng cổng, không đổi ngưỡng GOP 32/128 MiB, không đổi mặc
   định TẮT của GOP, không sửa production code, không nới tiêu chí
   SUCCESS của Y1, không chạy sóng 2 slack=1, không siết aim.

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/src/lib/settle48D2.ts`
- Mới: `apps/web/src/lib/settle48D2.test.ts` (24/24)
- Mới: `apps/web/scripts/settle-headed-48d2.mjs`
- Mới: `docs/PHASE9_ROUND48_D2_SETTLE_LIMITS.md` (file này)
- Không sửa: mọi file khác (đặc biệt mọi production code,
  tsconfig.json, file luồng khác).
  Scratch đo nằm ngoài repo (không vào batch):
  `~/workspace/tmp-round48-d2/` (`d2-result.json` lượt 2 +
  `d2-result-run1.json` lượt 1 + `d2-result-run1-corrected.json`
  lượt 1 tính lại bằng code sửa + `d2-result-partial*.json` +
  `d2-headed-run1.log` + `d2-headed-run2.log` +
  `replay-d2-run1.mjs` + `run-tests.mjs` + các bundle `.test.mjs`).
  Lưu ý: `d2-headed.log` bản đầu (lượt 1) chứa split SAI (feed
  100%) do bug đồng hồ — đã sao lưu nguyên tên
  `d2-headed-run1.log` để đối chiếu, CẤM trích số split từ đó.
