# Phase 9 đợt 49, luồng E3 — Đuôi flush của settle-drop (đường asset:): toggle sớm + resolve sớm — LIMITS

Ngày: 06/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG tự stage batch push (parent gộp).
Mọi số timing đều under-load nếu có luồng đợt 49 khác chạy song song —
cấm dùng làm baseline quiet hay claim fps.

## 0. Kết luận ngắn (số thật)

1. **Hướng (a) toggle sớm — BỊ BÁC BẰNG SỐ ĐO.** Race slack 30 (6 attempt,
   code chưa sửa (b)): gap 202,7–794,4 ms, tb 422,8 ms — LỚN HƠN baseline
   slack 3 (111,6–415,5 ms, tb 254,9 ms) ở mọi thống kê (min +91 ms,
   tb +168 ms, max +379 ms). 0 SUCCESS cả hai pha. Đúng như số học dự
   đoán: toggle sớm dời W2end sớm hơn mà W2dur KHÔNG dài ra bù (W2dur
   slack 30 chỉ 20,9–166,7 ms, thậm chí nhanh hơn baseline 91,4–187,4 ms
   vì pha load gop-range ít tranh CPU với flush). Hướng (a) KHÔNG giữ.
   Thêm nữa: slack 30 thì prefetch mới output 65–79/136 frame lúc W2end
   (chưa đủ 90 frame mới) — ngay cả hướng (b) cũng không cứu được mốc
   toggle sớm này; (b) chỉ có ý nghĩa với aim chặt slack 3.
2. **Hướng (b) resolve sớm khi đủ frame — THẮNG 6/6, SUCCESS ĐẦU TIÊN
   CỦA ĐƯỜNG asset:.** Race lượt 4 (code đã sửa (b) + drop-fix, slack 3,
   gop-range): **6/6 `SUCCESS-early-settle`**. Settle (mốc output thứ 90
   của frame mới, đo bằng trace trong page) ở −3,1 / −2,2 / −0,4 / −2,9 /
   −2,3 / −1,1 ms so với toggle; cuối W2 ở +18,1 / +11,5 / +57,7 / +27,0 /
   +13,4 / +10,3 ms → gap (settle − W2end) = **−21,2 / −13,7 / −58,1 /
   −29,9 / −15,7 / −11,4 ms** (settle TRƯỚC W2end 11,4–58,1 ms; baseline
   cũ là +111,6–415,5 ms — đảo dấu, cải thiện ~123–473 ms/attempt). Mốc
   kiểm chứng drop: mẫu cuối sau chờ 600 ms: cache **121** (= đúng cửa
   sổ 412), settled **90** (= đủ frame mới), ui off, prefetch 0 — 6/6.
   Đổi production duy nhất: `decodeGop` resolve `done` khi `decoded >=
   expectedNew` (số frame mới, chưa có trong cache lúc bắt đầu) thay vì
   `>= range.length`. Test khóa `settle49E3.test.ts` 6/6 (test chính ĐỎ
   trước sửa: trả về sau flush; XANH sau sửa: trả về trước flush; 3
   test khóa hành vi cũ vẫn xanh; 2 test drop-fix đỏ→xanh). Hồi quy đủ
   bộ xanh, tsc 0 lỗi, vite build pass. **Tác dụng phụ (b) đã vá:** khi
   prefetch settle TRƯỚC toggle, `.then(drop)` chạy lúc còn bật nên
   no-op, frame prefetch nằm lại cache (lượt 3: cache giữ 211, không
   drop) — vá bằng 1 câu trong `disableDecodeAhead()` (dọn khi
   `inFlightCount === 0`; prefetch đang bay vẫn do `.then(drop)` sau
   settle dọn), test khóa 6/6 + headed 6/6 chứng minh drop đã chạy.
   **Mù harness (đã vá trong lượt này):** `classifyDecoderInstance`
   của D2 tính liveness từ `max(feed.end, flush.done ?? flush.call)`
   mà BỎ QUA output — snapshot sớm (flush chưa resolve) thì nhận nhầm
   prefetch thành "other". Harness E3 nay tự tìm prefetch (tạo trước
   t0 + feed chunk ts < cửa sổ 412) và tự tính t90; KHÔNG sửa file D2.
   Quirk nhỏ: partial JSON ghi trước khi tăng successCount nên trong
   lượt nó lệch −1 (successCount=5 sau attempt 6); `e3-result.json`
   cuối lượt đúng (=6).
3. **Q1 (vì sao chunk delta thứ 2 ném "key frame required") — ĐÃ CÓ
   BẰNG CHỨNG PHÂN BIỆT.** Gốc rễ: IDR zero (sample 900, 14007 byte
   toàn 0) làm bước convert AVCC→AnnexB của decoder thất bại —
   error callback "Decoder error. (Unable to convert NALU to byte
   stream.)" bắn sau decode 5–106 ms; keyframe không bao giờ được
   ghi nhận nên chunk delta sau đó đòi keyframe mới. Hai message
   throw là HAI TRẠNG THÁI của cùng một lỗi gốc, lật theo race
   main-thread/decoder-thread (xem §3): "key frame required" khi
   decode#2 tới trước khi codec bị đóng (W2 thật 18/18: D2 12/12 +
   C1 6/6 — lúc đó decoder thread đang bận flush prefetch), "closed
   codec" khi codec đã bị đóng trước (probe thô 6/7, V1 là 1 ngoại lệ
   ngược). V1 chứng minh data 2 đường byte-identical
   (gopSampleData == Range fetch, 14007 byte, toàn 0) mà message vẫn
   khác — loại trừ giả thuyết data khác nhau. T5 chứng minh decoder
   kiểm tra keyframe ĐỒNG BỘ trong decode(): chunk đánh dấu key nhưng
   không chứa NAL IDR (SPS bị zero) thì decode#1 tự nó ném ngay.
   **V5 đã chạy 3 lượt (run2, run3, run4): giả thuyết tải BỊ BÁC.** Chạy
   T2 trong lúc 1 decoder khác đang decode/flush 90 chunk khỏe
   (busyOutputs 82–90, không lỗi) vẫn ném "closed codec" 3/3 lượt (lần
   gần nhất errorAtMs 61,5 ms). Tải decode nền không lật message.
   **Bổ sung run4:** T2 lật sang "key frame required" 1 lần (tổng T2
   1/4 "key frame required", 3/4 "closed codec") — message trong probe
   thô đúng là race, không phải đặc trưng đường đi xác định; chỉ còn
   đường W2 thật là ổn định tuyệt đối (30/30 "key frame required":
   D2 12/12 + C1 6/6 + run3 6/6 + run4 6/6). Yếu tố chính xác phân
   biệt V1 (3/3 "key frame required") với T2 (1/4) vẫn CHƯA CÔ LẬP
   (giả thuyết còn lại, chưa test: chunk data là subarray view từ
   `gopSampleData` ở V1 vs buffer mới từ Range fetch ở T2) — không
   truy thêm vì không ảnh hưởng quyết định sản phẩm nào: W2 thật
   30/30, (b) không phụ thuộc message này.
4. **Q2 (vì sao prefetch setup không tạo decoder) — ĐÃ CHỨNG MINH
   BẰNG CODE + SỐ ĐO.** Lúc `blobNew()` (setup) thì `decodeAheadWanted`
   vẫn false → `shouldAutoApplyDecodeAhead(false, false) = false` →
   `decodeAheadEnabled` giữ false → `ensureWindowViaGop` không tính
   `aheadRange`, không gọi `prefetchWindow`. Probe đo trực tiếp sau
   blobNew, TRƯỚC reset: `decodeAheadActive=false`, `aheadRange=null`,
   trace đúng 1 instance (setup decode 91 chunk, ts 414,07–417,07 s).
   Prefetch setup [12330,12435] không phải "bị reset xóa khỏi trace"
   mà KHÔNG BAO GIỜ được lên lịch — D2 §0.5 đính chính.
5. **Baseline mới E3 (gop-range, tải thấp):** 6/6 PARTIAL, gap
   111,6–415,5 ms, flush 94–99% gap, feed 0, drain 1,3–6,8 ms;
   W2 decode trực tiếp 0 frame, feed OK 1/2, 6/6. SUCCESS đường
   asset: vẫn mở — 0/35 cộng dồn (E3-baseline 0/6 + E3-early 0/6 +
   D2 0/12 + C2 0/9 + B1 0/2 — tính cả pha (a) vì cùng code chưa sửa).
   **Sau race (b) lượt 4: SUCCESS đường asset: ĐÃ ĐÓNG — 6/6
   `SUCCESS-early-settle`, gap −11,4…−58,1 ms (xem kết luận 2).**
   LƯU Ý CHẾ ĐỘ: E3 chạy `gopMode=gop-range` (W2 chỉ fetch 1–2 GOP,
   durMs 91–187 ms) trong khi D2 chạy `full-file-fallback` (W2 fetch
   lại 69 MB, durMs 326–1714 ms) — cùng fixture, cùng harness, khác
   quyết định cổng GOP (xem §5.4). So sánh (b) chỉ dùng baseline E3
   cùng chế độ, không dùng số D2.

## 1. Hướng (b): resolve sớm khi đủ frame — phân tích + đổi production

### 1.1 Vì sao điều kiện cũ không bao giờ chạm (đọc code, khóa bằng test)

`decodeGop` (`reverseWebcodecs.ts`, output callback) resolve `done`
khi `decoded >= range.length`. `decoded` chỉ tăng khi frame CHƯA có
trong cache (`!this.cache.has(idx)`). Prefetch 412 [12150,12285]
(136 chunk) chồng cửa sổ 412 [12240,12360] 46 frame → `decoded` tối
đa 90 < 136 → điều kiện cũ KHÔNG BAO GIỜ chạm → `done` chỉ resolve
sau `await decoder.flush()` trong IIFE. Đuôi flush sau cuối W2 là
71–281 ms (D2) / 104,7–410,1 ms (E3-baseline). Đây là toàn bộ gap.

### 1.2 Đổi production (duy nhất 2 chỗ trong `decodeGop`)

- Tính `expectedNew = range.filter((s) => !this.cache.has(s.index)).length`
  (số frame mới lúc bắt đầu, chụp trước vòng feed).
- Điều kiện output callback thành `if (expectedNew > 0 && decoded >= expectedNew) resolve();`
  (thay `decoded + (decoderError ? 0 : 0) >= range.length` — vế cộng
  là dead code, luôn +0).
- Không đổi gì khác: vòng feed, `flush()`, `close()`, fallback IIFE,
  error callback, `decoderSetupFailed` giữ nguyên. `done` resolve sớm
  chỉ làm `decodeGop` trả về sớm; IIFE vẫn chạy nền tới cùng (feed hết
  chunk còn lại → flush → close) — decoder không bị bỏ rơi.

### 1.3 Vì sao an toàn (luận cứ vòng đời, không phải cảm tính)

- **Không thêm trạng thái mới:** điều kiện resolve-sớm-trước-flush
  ĐÃ tồn tại cho range không chồng (decoded chạm range.length ở output
  cuối trong vòng feed — test khóa E3(b)-lock §6). Đổi này chỉ dời
  ngưỡng từ `range.length` xuống `expectedNew`; decoder vẫn flush +
  close nền như trước.
- **Không resolve sớm sai:** `decoded` chỉ tăng khi 1 index MỚI được
  set vào cache (callback kiểm tra `!cache.has(idx)`); `decoded ==
  expectedNew` kéo theo đúng `expectedNew` index mới đã có frame.
  Trường hợp timestamp trùng (2 sample cùng presentation timestamp):
  output thứ 2 cho cùng ts bị close (đã có trong cache) nên decoded
  không chạm ngưỡng → rơi về fallback IIFE như cũ, không resolve
  sớm sai (xem test khóa (3) + (4)).
- **Frame hỏng / decode dở:** decoded không chạm ngưỡng → fallback
  IIFE sau flush, y hệt cũ (W2 hỏng vẫn trả 0 sau short-circuit).
- **`expectedNew = 0` (toàn bộ đã cache):** guard `> 0` giữ hành vi cũ
  (không resolve sớm trên output đầu) — test khóa (4).
- **Buffer file:** `releaseFileBuffer()` chỉ null `this.bytes`; closure
  `getData` của IIFE vẫn giữ `Uint8Array` nên feed nền tiếp tục an
  toàn. Frame đã output là VideoFrame độc lập, không phụ thuộc buffer.
- **Đo fps cổng (`lastDecodeMeasurement`):** `decodeMs` đo quanh
  `await decodeGop` nên với range chồng, fps đọc cao hơn trước (trả về
  khi đủ frame mới thay vì sau flush). Với decode CỬA SỔ (nơi đo này
  dùng để re-gate) thì range thường không chồng cache → `expectedNew
  == range.length` → số đo KHÔNG đổi. Với prefetch thì giá trị trả về
  không dùng làm measurement (chỉ `.then(drop...)`). Tác động: không
  đáng kể, ghi rõ để đợt sau không đọc nhầm fps cổng tăng là footage
  nhanh lên.

### 1.4 Dự đoán định lượng trước race (từ số C1, sẽ kiểm chứng)

Prefetch output trước W2end: 91–109/136 (C1 6/6). 90 frame mới là
[12150,12239] — toàn bộ GOP 12150, present trước 46 frame trùng
[12240,12285] (present theo GOP, không bị B-frame reorder vượt biên
GOP quá 2–3 frame; số này là dự đoán có cơ sở, race sẽ kiểm chứng
trực tiếp bằng settle <= W2end). Nếu đúng, (b) dời settle từ
flushDone+~5 ms về mốc output thứ 90 — trước W2end 6/6 → SUCCESS.
Nếu race cho thấy settle vẫn sau W2end thì dự đoán SAI ở khâu nào
đó (vd output không theo thứ tự present như giả định) — sẽ đo lại
bằng trace, không sửa số.

## 2. Hướng (a): toggle sớm hơn — số học + số đo bác bỏ

### 2.1 Số học trước khi đo

Gap = flushDone − W2end = flushDone − (t0 + W2dur). Toggle sớm hơn Δ
(t0 −= Δ) thì W2end sớm hơn Δ; chỉ thắng nếu W2dur dài ra hơn Δ do
tranh CPU với flush (W2 load chồng lên flush). W2 load ở chế độ
gop-range chủ yếu là fetch GOP + demux trên main thread, flush là
software decode trên decoder thread — tranh nhau ít, nên kỳ vọng
W2dur không dài ra đủ. Đo để kiểm chứng, không tin số học mù.

### 2.2 Số đo (pha C2, slack 30, code chưa sửa (b), 6 attempt)

| Attempt | Gap | remaining lúc tắt | cache lúc tắt | W2 durMs | feed | flush | drain | pf out trước W2end |
|---|---|---|---|---|---|---|---|---|
| 1 | 301,2 | 30 | 181 | 90,4 | 0 | 295,4 | 5,7 | 79/136 |
| 2 | 794,4 | 27 | 182 | 166,7 | 0 | 739,2 | 55,1* | 69/136 |
| 3 | 424,0 | 26 | 185 | 98,2 | 0 | 421,4 | 2,6 | 69/136 |
| 4 | 202,7 | 29 | 181 | 24,6 | 0 | 197,2 | 5,4 | 72/136 |
| 5 | 402,5 | 29 | 182 | 76,0 | 0 | 400,4 | 2,1 | 65/136 |
| 6 | 412,3 | 30 | 181 | 20,9 | 0 | 409,3 | 3,0 | 65/136 |
| **TB** | **422,8** | — | — | **79,5** | **0** | **410,5** | — | **70** |

\* attempt 2 drain 55,1 ms là ngoại lệ (các attempt khác 2,1–5,7 ms)
— có thể poll harness trượt 1 chu kỳ lúc main thread bận; flush vẫn
chiếm 93% gap nên không đổi kết luận.

So với baseline slack 3 (gap 111,6–415,5 ms, tb 254,9 ms): gap slack 30
LỚN HƠN ở mọi thống kê (min 202,7 vs 111,6; tb 422,8 vs 254,9; max
794,4 vs 415,5). W2dur không dài ra (tb 79,5 ms vs baseline 116,5 ms,
thậm chí attempt 4/6 chỉ 20,9–24,6 ms). **Hướng (a) BỊ BÁC, không giữ.**
Hệ quả phụ: slack 30 thì prefetch mới output 65–79/136 lúc W2end
(< 90 frame mới) nên (b) cũng không cứu được mốc toggle này.

## 3. Điều tra Q1: vì sao chunk delta thứ 2 ném "key frame required"

### 3.1 Gốc rễ (đã chứng minh): IDR zero làm convert AVCC→AnnexB thất bại

- Sample 900 (IDR GOP [30,33)): 14007 byte, toàn 0 (V1 đo trực tiếp:
  `gopAllZero900=true`, `rangeAllZero900=true`, `equal900=true` —
  data đường GOP và đường Range byte-identical).
- Error callback (probe thô, KHÔNG close sớm): "Decoder error.
  (Unable to convert NALU to byte stream.)" bắn 5–106 ms sau decode
  (T2: 23,4 / 105,8 ms hai lượt; T3: 6,9 ms; T7: 8,5 ms; V1: 5,2 ms).
  NAL length prefix toàn 0 → zero-length NALU → convert thất bại.
- Keyframe không bao giờ được ghi nhận: chunk key đã enqueue nhưng
  decoder không có keyframe hợp lệ nào → chunk delta sau đó đòi
  keyframe mới. Đây là hành vi decoder, không phải bug feed loop
  (feed loop đưa đúng chunk, đúng thứ tự, đúng type `key`).

### 3.2 Hai message throw là hai trạng thái của cùng lỗi gốc (bảng)

| Đường đo | decode#2 ném | error callback | Điều kiện |
|---|---|---|---|
| W2 thật (decodeGop, D2 12/12 + C1 6/6) | "A key frame is required after configure() or flush." | KHÔNG BAO GIỜ (0/18; close() 0,1–4 ms sau throw chặn trước khi error task chạy) | decoder thread đang bận flush prefetch → codec còn mở lúc decode#2 |
| Probe thô T2/T4/V2/V4 (6/7 lần, 2 lượt) | "Cannot call 'decode' on a closed codec." | CÓ, 7–106 ms sau decode#1 | không có decoder nào khác chạy → decoder thread xử lý lỗi ngay, đóng codec trước decode#2 |
| Probe thô V1 (1/7 lần) | "A key frame is required..." | CÓ, 5,2 ms | ngoại lệ ngược — main thread thắng race 1 lần dù không có tải nền |
| T8 (flush sau IDR zero rồi feed key lành) | flush ném "closed codec"; feed sau cũng "closed codec" | CÓ, 58–70 ms | decoder đã đóng vĩnh viễn sau lỗi IDR — flush KHÔNG hồi phục |

Giải thích thống nhất (có bằng chứng, xem §3.3): decode#1 (IDR zero)
được enqueue OK; decoder thread convert thất bại → đóng codec +
post error callback về main thread. decode#2 chạy trên main thread
ngay sau đó (1 microtask): nếu codec chưa bị đóng → kiểm tra keyframe
flag (false, vì IDR chưa bao giờ được ghi nhận) → ném "key frame
required"; nếu codec đã bị đóng → ném "closed codec". Message nào
xuất hiện là RACE giữa main thread và decoder thread — không phải
hai cơ chế khác nhau.

### 3.3 Bằng chứng phân biệt (không đoán)

- **V1 loại trừ data khác nhau:** bytes đường GOP == bytes đường
  Range (14007 byte, toàn 0) mà message vẫn khác nhau (V1 "key frame
  required" vs T2 "closed codec") → yếu tố lật không nằm ở data.
- **V2 loại trừ isConfigSupported:** gọi probe trước khi tạo decoder
  vẫn "closed codec" (21,3 ms) → không phải do decodeGop await probe.
- **V4 loại trừ hình dạng feed loop:** await getData thật (async fetch)
  vẫn "closed codec" (12,7 ms) → không phải do `await Promise.resolve()`.
- **V3 (decodeGop thật trên [900,901]) — KHÔNG KẾT LUẬN ĐƯỢC về
  message:** `decoded=0, cacheSize=0` đúng như W2, nhưng `throwEvents=[]`
  vì probe đọc vdTrace NGAY sau khi decodeGop trả về — lúc đó error
  callback đã resolve `done` trong khi IIFE còn đang fetch chunk 901
  nên decode#2 chưa xảy ra lúc snapshot. Đây là lỗi đo của probe
  (đọc trace quá sớm), không phải bằng chứng "không ném". Bằng chứng
  cho đường decodeGop vẫn là race W2 thật (D2 12/12 + C1 6/6, message
  "key frame required" trong trace đầy đủ).
- **T5 chứng minh kiểm tra keyframe ĐỒNG BỘ:** IDR lành 990 nhưng zero
  byte 4..19 (SPS hỏng, length prefix còn nguyên) → decode#1 TỰ NÓ
  ném ngay: "An EncodedVideoChunk was marked as type `key` but wasn't
  a key frame. A key frame is required after configure() or flush()."
  — decoder parse NAL đồng bộ trong decode() và biết chunk không chứa
  IDR. Với IDR toàn-zero (không parse được NAL nào) thì decode#1
  KHÔNG ném (chunk được enqueue rồi mới lỗi ở bước convert bất đồng
  bộ) — khác biệt này khớp với hai message ở §3.2.
- **T6 chứng minh không phải "mọi hỏng byte đều gây lỗi":** IDR 990
  lật 1 byte giữa slice (byte 100 ^= 0xFF) → decode#1 và #2 đều OK,
  không ném; error callback "Decoding error." bắn sau (13,1 / 90,9 ms)
  nhưng decoder vẫn nhận chunk tiếp theo. Chỉ IDR hoàn toàn không
  decode được (convert thất bại) mới làm mất keyframe.
- **T1 control:** IDR lành 990 + delta 991 → cả 2 decode OK, không
  ném, không error. (Lưu ý đo: outputs=0 sau 200 ms không chờ flush —
  decoder H.264 có B-frame reorder delay nên giữ frame chờ thêm input;
  con số 0 này KHÔNG có nghĩa "decode lành ra 0 frame", chỉ là probe
  không flush trước khi đếm. Không dùng outputs của T1 làm kết luận.)
- **T3/T7 chứng minh error callback CÓ bắn nếu không close sớm:** chờ
  400 ms (T3) / 1000 ms không close (T7) → error bắn sau 6,9–8,5 ms.
  D2/C1 thấy 0 error callback vì decodeGop close() decoder 0,1–4 ms
  sau throw — trước khi error task kịp chạy. Đính chính C2 §4.1 giữ
  nguyên (D2 đã đính chính); nay có thêm cơ chế: error task bị close
  chặn, không phải "decoder không lỗi".
- **V5 (đã chạy 3 lượt run2/run3/run4):** chạy T2 trong lúc 1 decoder
  khác đang decode/flush 90 chunk lành (busyOutputs 82–90, không lỗi)
  vẫn ném "closed codec" 3/3 lượt (lần gần nhất errorAtMs 61,5 ms) —
  giả thuyết tải **BỊ BÁC**: tải decode nền không lật message. (Xem
  thêm §0.3: T2 lật sang "key frame required" 1 lần ở run4 — message
  trong probe thô là race; yếu tố phân biệt V1 vs T2 vẫn chưa cô lập.)

### 3.4 Kết luận Q1 (tới thời điểm này)

Gốc rễ đã rõ: IDR zero → convert NALU thất bại → không có keyframe
hợp lệ → chunk delta ném. Message cụ thể ("key frame required" vs
"closed codec") là race thời gian, không phải hai lỗi khác nhau — với
W2 thật luôn là "key frame required" (18/18) vì decoder thread đang
bận flush prefetch. Không có cách nào "sửa" W2 bằng timing: GOP hỏng
thì W2 luôn decode 0 frame; hướng thắng duy nhất là (b) — cho prefetch
settle trước, không phải cứu W2.

## 4. Điều tra Q2: vì sao prefetch setup không tạo decoder — ĐÃ CHỨNG MINH

- **Code:** `shouldAutoApplyDecodeAhead(wanted, enabled) = wanted && !enabled`
  (`reverseDecodeAheadToggle.ts`). Lúc `blobNew()` (setup) thì
  `decodeAheadWanted` (module-level, khởi đầu false, sau toggleAndW2
  của attempt trước vẫn false) → `shouldAutoApplyDecodeAhead(false,
  false) = false` → `enableDecodeAheadFromGate` KHÔNG chạy →
  `decodeAheadEnabled` giữ false → `ensureWindowViaGop` bỏ qua khối
  tính `aheadRange` + `prefetchWindow`. Prefetch setup [12330,12435]
  không được lên lịch ở bất kỳ đâu (chỉ có 2 điểm gọi `prefetchWindow`,
  cả hai đều sau `if (this.decodeAheadEnabled)`).
- **Số đo (probe, TRƯỚC vdReset):** sau `blobNew()`: `decodeAheadActive
  = false`, `aheadRange = null`, trace đúng 1 instance (setup decode,
  91 chunk, ts 414066667–417066667 µs = sample 12420–12510, 91 output).
  Không có instance nào feed ts 411–414,5 s (cửa sổ prefetch setup).
- **Đính chính D2 §0.5:** prefetch setup KHÔNG PHẢI "bị reset xóa khỏi
  trace" — nó không bao giờ được tạo. D2 quan sát đúng (0 instance)
  nhưng cơ chế lúc đó chưa xác minh; nay đã xác minh bằng cả code
  (3 điều kiện độc lập) lẫn số đo trực tiếp.

## 5. Số đo headed thật

Fixture chung: `y1-corrupt-gop30-360p-gop90-420s.mp4` (69.861.131 byte;
GOP hỏng [30,33), IDR pos 5378169; fps 30, 12600 sample). Probe asset
PASS ở mọi lượt (assetId `a_e40641880f8e75dc`, blob size == manifest
size, restored 1, failed 0).

### 5.1 Pha C1 — baseline slack 3, code chưa sửa (b) (lượt 1, loadavg ~1,7)

| Attempt | W2 durMs | Gap | feed | flush | drain | pf out trước W2end | W2 decoded trực tiếp |
|---|---|---|---|---|---|---|---|
| 1 | 107,4 | 111,6 | 0 | 104,7 | 6,8 | 109/136 | 0 (feed 1/2) |
| 2 | 113,1 | 187,3 | 0 | 182,5 | 4,7 | 103/136 | 0 (feed 1/2) |
| 3 | 91,4 | 307,9 | 0 | 303,6 | 4,3 | 97/136 | 0 (feed 1/2) |
| 4 | 96,5 | 283,3 | 0 | 282,0 | 1,3 | 91/136 | 0 (feed 1/2) |
| 5 | 97,6 | 224,0 | 0 | 219,3 | 4,7 | 94/136 | 0 (feed 1/2) |
| 6 | 187,4 | 415,5 | 0 | 410,1 | 5,4 | 99/136 | 0 (feed 1/2) |
| **TB** | **115,6** | **254,9** | **0** | **250,4** | **4,5** | **99** | **0/6** |

6/6 PARTIAL-immediate-drop, 0 SUCCESS. Flush chiếm 94–99% gap. Aim
đúng mốc (remaining 0–3, cache tắt 208–211, cổng only-operative).

### 5.2 Pha C2 — hướng (a) slack 30 (xem §2.2): gap tb 422,8 ms, 0/6 SUCCESS.

### 5.3 Pha P — probe Q1/Q2 (2 lượt, xem §3–§4 + log run1/run2).

### 5.4 Lưu ý chế độ GOP: E3 gop-range vs D2 full-file-fallback

E3 chạy `gopMode=gop-range` (setup log: `gopMode=gop-range fallback=null`),
D2 chạy `full-file-fallback` (setup log: `fallback=gate: accept-ranges-unknown:
server không gửi Accept-Ranges, không giả định`). Cùng fixture, cùng
server Range (HEAD có `Accept-Ranges: bytes`) — vì sao cổng GOP quyết
khác nhau giữa hai lượt vẫn CHƯA RÕ (có thể probe HEAD race lúc server
mới lên ở lượt D2, hoặc fetch probe khác nhau; không truy vết thêm vì
không ảnh hưởng kết luận E3 — baseline (b) dùng cùng chế độ E3).
Hệ quả đo được: W2 gop-range chỉ fetch 1–2 GOP nên durMs 91–187 ms
(vs D2 326–1714 ms); gap vẫn flush-dominated ở cả hai chế độ. Ghi rõ
để đợt sau không so gap E3 với gap D2 như cùng baseline.

### 5.5 Pha C3 — race hướng (b) sau sửa (lượt 4, code đã sửa (b) + drop-fix, slack 3)

- 6/6 `SUCCESS-early-settle` (`e3-headed-run4.log`, `e3-result.json`
  cuối lượt: baseSuccess=6; partial JSON `e3-result-partial-ASSET-E3-BASE.json`).
- Settle (mốc t90, output thứ 90 của frame mới trong trace, đồng hồ
  trong page) so với toggle / cuối W2 (ms):
  - att1: tResolve −3,1 / W2end +18,1 → gap **−21,2**
  - att2: tResolve −2,2 / W2end +11,5 → gap **−13,7**
  - att3: tResolve −0,4 / W2end +57,7 → gap **−58,1**
  - att4: tResolve −2,9 / W2end +27,0 → gap **−29,9**
  - att5: tResolve −2,3 / W2end +13,4 → gap **−15,7**
  - att6: tResolve −1,1 / W2end +10,3 → gap **−11,4**
- Mẫu cuối sau chờ 600 ms: cache **121** (= đúng cửa sổ 412), settled
  **90**, ui off, prefetch 0 — 6/6 (drop đã chạy, xem §8 / LIMITS
  kết luận 2). Đối chiếu baseline cũ (lượt 1, cùng slack 3, code chưa
  sửa): gap +111,6–415,5 ms, tb +254,9 ms → (b) đảo dấu gap, cải
  thiện ~123–473 ms/attempt (so theo từng attempt thì att tốt nhất
  −58,1 ms so với baseline tb +254,9 ms là −313 ms).
- Phân loại E3 mới: prefetch instance tìm bằng ts (id 18/22/…), không
  dùng role "prefetch" của D2 (D2 nhận nhầm thành "other" khi snapshot
  sớm — xem kết luận 2); `d2Complete=0/6` trong summary là hệ quả của
  việc không có settleAtMs theo nghĩa cũ, KHÔNG phải lỗi đo.
- W2 lượt 4 vẫn 6/6 "key frame required" (feed dừng sau 1 chunk, 0
  frame, không flush) — (b) không đổi đường W2, chỉ đổi thời điểm
  prefetch resolve.
- Probe lượt 4: V1 3/3 "key frame required" (gopSampleData);
  T2 lật 1 lần sang "key frame required" (tổng 1/4); V5 lần 3 vẫn
  "closed codec" dưới tải decode nền (busyOutputs=82) — xem §3.

## 6. Kiểm chứng

- Mới `settle49E3.test.ts`: **6/6 pass** — test chính ĐỎ trước sửa
  (`flushResolved=true` lúc trả về) và XANH sau sửa; 3 test khóa hành
  vi cũ (không chồng / không output / toàn bộ đã cache) xanh cả trước
  lẫn sau; 2 test drop-fix (đỏ→xanh sau khi sửa `disableDecodeAhead`,
  1 test khóa guard prefetch-đang-bay). Chạy bằng esbuild bundle
  `--format=esm` ra scratch, node — đúng mẫu A1/B1/C2/D2.
- Mới `settle49E3Early.test.ts`: **11/11 pass** — findPrefetch (3 test,
  gồm dạng snapshot sớm mà D2 liveness nhận nhầm), earlyResolveTime
  (3 test, gồm distinct-ts và thiếu frame → null), classifyEarlySettle
  (5 test, đủ 5 lớp).
- Hồi quy cùng runner (`run-tests.mjs`, scratch `~/workspace/tmp-round49-e3/`):
  A1 **20/20**, Z1 **19/19**, B1 **19/19**, Y1 **14/14**, C2 **24/24**,
  D2 **31/31**, E3 **6/6**, E3Early **11/11** — fail 0.
- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0, 0 lỗi** (chạy lại
  sau mọi sửa cuối).
- `vite build` (từ `apps/web`): **pass, built in 6,95 s** (chỉ warning
  chunk > 500 kB có sẵn từ trước, không phải do E3).
- Headed lượt 1 (run1, bị service restart giết giữa C2): probe Q1/Q2
  xong + C1 baseline 6/6 (partial JSON đã lưu).
- Headed lượt 2 (run2, detached, probe+V1–V4 + C2 slack 30): 6/6
  attempt C2, exit 0, `probeDone=true ultraW2Obs=6 d2Complete=6/6`.
- Headed lượt 3 (run3, probe V5 + race (b) slack 3, code đã sửa (b)
  chưa có drop-fix): 6/6 `INVALID-no-settle` (mù harness — prefetch
  settle trước mẫu đầu) nhưng tính lại từ `vdRaw` cho t90
  −0,5…−4,5 ms so với toggle, W2end +10,7…+22,0 ms; cache cuối giữ
  211 (chưa drop) — chính là phát hiện dẫn tới drop-fix.
- Headed lượt 4 (run4, probe + C1 (b) slack 3, code đã sửa (b) +
  drop-fix): **6/6 `SUCCESS-early-settle`**, exit 0,
  `probe=true probeDone=true baseSuccess=6 earlySuccess=0
  ultraW2Obs=6 d2Complete=0/6` (d2Complete=0/6 là hệ quả phân loại
  mới, không phải lỗi — xem §5.5).

## 7. Cái gì chưa làm / chưa chứng minh + nợ còn lại

1. **SUCCESS đường asset: ĐÃ ĐÓNG (6/6 `SUCCESS-early-settle`, §5.5).**
   Phạm vi hẹp: 1 fixture 360p GOP 90, chế độ gop-range, slack 3, 6
   attempt, loadavg thấp. Chưa đo lại trên 720p/1080p, GOP khác,
   file khác, máy tải cao, hay slack khác.
2. **V5 (giả thuyết tải/race cho message throw): ĐÃ CHỐT — tải bị bác
   (3 lượt, xem §3).** Còn mở: yếu tố chính xác phân biệt V1 (3/3
   "key frame required") với T2 (1/4) — giả thuyết chưa test: chunk
   data là subarray view từ `gopSampleData` ở V1 vs buffer mới từ
   Range fetch ở T2. Không truy thêm (không ảnh hưởng quyết định sản
   phẩm; W2 thật ổn định 30/30).
3. **V3 không kết luận được về message** (đọc trace quá sớm, §3.3) —
   không dùng V3 làm bằng chứng; bằng chứng đường decodeGop vẫn là
   race W2 thật 30/30.
4. **Chế độ GOP lật giữa D2 và E3 (§5.4):** chưa rõ nguyên nhân gốc —
   chỉ ghi nhận, không truy vết thêm trong luồng này.
5. **Chỉ chứng minh trên một fixture:** 360p GOP 90, GOP hỏng [900,990);
   chưa mô hình/đo 720p/1080p, GOP khác, file khác.
6. **Vòng draw/toggle cho clip `asset:` trên UI app thật:** vẫn chưa
   chứng minh (nợ từ B1 §6.4).
7. **Bug race `loadSample` (B1 §6.2):** vẫn mở, E3 không đụng tới.
8. **Không claim gì thêm:** không đổi luật dọn T2/T4, không đổi ngưỡng
   cổng, không đổi ngưỡng GOP 32/128 MiB, không đổi mặc định TẮT của
   GOP, không nới tiêu chí SUCCESS của Y1, không chạy sóng 2 slack=1,
   không siết aim. Hướng (a) đã bác — không chạy lại slack khác.
9. **Quirk partial JSON lệch −1 successCount trong lượt** (ghi trước
   khi tăng counter; `e3-result.json` cuối lượt đúng) — cosmetic,
   không sửa vì cùng mẫu với harness D2.

## 8. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Sửa: `apps/web/src/lib/reverseWebcodecs.ts` (chỉ `decodeGop`: thêm
  `expectedNew` + đổi điều kiện resolve sớm trong output callback;
  và `disableDecodeAhead()`: dọn prefetch đã settle trước toggle khi
  `inFlightCount === 0` — vá tác dụng phụ của (b); không đụng hàm
  nào khác).
- Mới: `apps/web/src/lib/settle49E3.test.ts` (6/6, đỏ-trước/xanh-sau
  cả 2 đổi production: (b) + drop-fix).
- Mới: `apps/web/src/lib/settle49E3Early.ts` (số học settle-sớm:
  `findPrefetchInstance` / `earlyResolveTimeMs` /
  `classifyEarlySettle` — không sửa `settle48D2.ts`) +
  `apps/web/src/lib/settle49E3Early.test.ts` (11/11).
- Mới: `apps/web/scripts/settle-headed-49e3.mjs` (harness E3: probe
  Q1/Q2 T1–T8 + V1–V5, race baseline slack 3, race (a) slack 30,
  race (b) slack 3 + nhánh settle-sớm; tái dùng `analyzeVdTrace`
  từ `settle48D2.ts`, không sửa module đó).
- Mới: `docs/PHASE9_ROUND49_E3_SETTLE_LIMITS.md` (file này).
- Không sửa: mọi file khác (đặc biệt tsconfig.json, file luồng khác,
  mọi file 47C2/48D2).
  Scratch đo nằm ngoài repo (không vào batch):
  `~/workspace/tmp-round49-e3/` (`e3-headed-run1.log` + partial C1,
  `e3-headed-run2.log` + partial C2 + `e3-result.json` lượt 2,
  `run-tests.mjs`, các bundle `.test.mjs`).
