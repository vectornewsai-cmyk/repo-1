# Phase 9 đợt 35, luồng R3 — Buffer file của ReversePreviewController — LIMITS

Ngày: 02/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo.
Luồng này KHÔNG sửa `preview.tsx`, KHÔNG sửa cdp-snapshot, KHÔNG sửa
script đo của luồng khác, KHÔNG ghi paths-loop hay build-loop-log
(parent gộp). Đọc trước khi làm:
`docs/PHASE9_ROUND34_LIMITS.md` §3 mục 3 và
`docs/PHASE9_ROUND34_Q2_REVERSE_WIRING_LIMITS.md` §5 (controller giữ
nguyên ArrayBuffer file trong lúc decode/giữ, file 420MB → JS heap
401MB; ngân sách cache 192MiB chỉ tính frame, chưa tính buffer file).

## 0. Kết luận ngắn (không vượt số đo)

1. **Đã chọn hướng (b) — nhả ArrayBuffer sau decode, KHÔNG chọn
   hướng (a) fetch theo khoảng GOP.** Lý do chọn, ghi đủ ở §1.
2. **Sau sửa, trạng thái ổn định của controller chỉ còn frame:**
   `retainedFileBytes = 0` sau mỗi cửa sổ decode xong (chứng minh
   bằng test 10/10 trên fixture nhỏ, fake fetch + fake VideoDecoder —
   KHÔNG đo trên file 420MB thật, KHÔNG claim tiết kiệm bộ nhớ trên
   file lớn thật).
3. **File lớn hơn 128 MiB không vào đường WebCodecs ngay từ đầu:**
   chặn ở HEAD, hoặc header GET (kèm hủy body), hoặc sau tải khi
   không có header nào báo kích thước — mọi trường hợp đều khóa
   `unsupported` và preview rơi về đường element cũ nguyên vẹn.
4. **Ngân sách nay tính cả buffer file:** tổng 320 MiB = 192 MiB
   frame + 128 MiB file tối đa; cửa sổ hiệu dụng thu hẹp theo byte
   file còn giữ trong lúc decode.
5. **Đánh đổi của hướng (b) được ghi rõ, không giấu:** đổi cửa sổ
   phải fetch lại toàn file (file ≤ 128 MiB). Đây là chi phí đổi
   lấy việc không cần server hỗ trợ Range và không viết lại demux.

## 1. Vì sao chọn (b) mà không chọn (a)

Hướng (a) fetch theo khoảng GOP nghe thì tiết kiệm hơn, nhưng sau
khi đọc code thì nó đòi 3 điều mà codebase hiện tại không có và
không đảm bảo được:

1. **Phải phát hiện moov trước khi biết GOP nào cần tải.**
   `parseMp4VideoTrack` hiện parse từ 1 ArrayBuffer hoàn chỉnh và
   không giả định vị trí moov (moov-cuối vẫn parse được vì đã có cả
   file). Muốn fetch theo khoảng thì phải probe đầu file (ftyp +
   box top-level), rồi nếu moov ở cuối thì probe đuôi file với kích
   thước moov chưa biết (cần nhiều lượt Range thăm dò, hoặc đọc
   header `Content-Range`/`Accept-Ranges` rồi đoán). Đó là một demux
   hai giai đoạn mới, không phải một sửa nhỏ.
2. **Nguồn preview không đảm bảo Range.** Điểm nối dùng
   `item.proxyUrl ?? item.url` — có thể là URL proxy nội bộ, blob
   URL, hoặc file serve tĩnh; không có hợp đồng nào bảo đảm server
   trả `206 Partial Content` và `Accept-Ranges: bytes` cho mọi nguồn
   đó. Range thất bại âm thầm (trả 200 toàn file) sẽ làm giải pháp
   "tiết kiệm" trở thành tải toàn file nhưng mang thêm code phức
   tạp — tệ hơn hướng (b) mà không tiết kiệm được gì.
3. **Rủi ro vỡ đường decode đang chạy.** (a) đổi cả cách demux lấy
   byte (từ subarray trên buffer hoàn chỉnh sang fetch từng đoạn +
   ghép), trong khi đường decode + ctts/elst + B-frame reorder vừa
   mới chốt ở đợt 34 Q2. Lợi ích duy nhất của (a) so với (b) là
   tránh fetch lại khi đổi cửa sổ — một chi phí chấp nhận được với
   file ≤ 128 MiB trên máy local/proxy nội bộ.

Hướng (b) không cần server hỗ trợ gì, không đổi demux, không đổi
thứ tự decode hay bất biến an toàn của controller (frameAt vẫn chỉ
trả frame đúng mốc, còn lại null → fallback element). Nhược điểm
duy nhất là fetch lại khi đổi cửa sổ — và chính vì nhược điểm đó
mà cổng file lớn 128 MiB là bắt buộc: file càng lớn thì fetch lại
càng đắt, nên file lớn không được vào đường này ngay từ đầu.

## 2. Đã làm (file đổi/thêm — danh sách chính xác)

### 2.1 Sửa

- `apps/web/src/lib/reverseWebcodecs.ts` — toàn bộ sửa của luồng:
  - Hằng + hàm ngân sách mới: `REVERSE_MEASURED_BYTES_PER_FRAME_720P`
    (~2,40 MiB, số đo thật đợt 34 Q2), `estimatedBytesPerFrame()`
    (scale pixel từ số đo 720p, cận trên thận trọng),
    `REVERSE_LARGE_FILE_FALLBACK_BYTES` (128 MiB),
    `REVERSE_TOTAL_MEMORY_BUDGET_BYTES` (320 MiB = 192 + 128),
    `windowFramesForTotalBudget()` (trừ byte file còn giữ khỏi ngân
    sách tổng trước khi chia cho byte/frame, luôn ≥ 1),
    `reverseMemoryUsageBytes()` (tách frame + buffer file + tổng).
  - Controller: `retainedFileBytes`, `largeFileFallback`,
    `knownFileSizeBytes`, `memoryUsage()` (frame + buffer còn giữ);
    `load()` thêm 3 cổng file lớn (HEAD → header GET kèm hủy body →
    sau tải khi không có header); `ensureWindowForTime()` tính cửa
    sổ hiệu dụng theo ngân sách tổng, nhả buffer trong `finally`
    sau decode (kể cả decode lỗi), có đường nhanh không fetch khi
    frame đích đã nằm trong cache; decode được 0 frame thì coi là
    lỗi decode (fail-soft về `unsupported`, xem §4.2); `dispose()`
    nhả buffer + reset cờ file lớn.
  - Controller nhận thêm `options: { largeFileBytes?,
    totalBudgetBytes? }` — chỉ để test chứng minh cổng mà không cần
    file lớn thật; giá trị mặc định trong production không đổi.
- `apps/web/tsconfig.json` — chỉ thêm 1 test mới vào exclude (theo
  tiền lệ Q2: test dùng import `.ts` cho Node/esbuild nên không qua
  được TS5097 nếu nằm trong include).

### 2.2 Mới

- `apps/web/src/lib/reverseFileBuffer35R3.test.ts` — 10 test (xem §3).
- `docs/PHASE9_ROUND35_R3_FILE_BUFFER_LIMITS.md` — file này.

### 2.3 Không đụng (ghi rõ để parent khỏi nghi ngờ)

`preview.tsx` (điểm nối + cờ opt-in giữ nguyên — đường WebCodecs
vẫn mặc định TẮT như đợt 34 Q2), `mp4Demux.ts` (không viết lại
demux), `reverseDecodeAhead.ts`, mọi harness/probe `scripts/*`,
cdp-snapshot, paths-loop, build-loop-log. Dist trên đĩa bị build
lại để kiểm chứng (tài nguyên chia sẻ, không stage dist).

## 3. Kiểm chứng (test mới + hồi quy)

### 3.1 Test mới — 10/10 pass

Chạy bằng esbuild bundle (không chạy trực tiếp bằng Node
strip-types vì `reverseWebcodecs.ts` import `"./mp4Demux"` không
đuôi theo chuẩn bundler của repo — cùng lý do Q2 đã ghi):

```
./node_modules/.bin/esbuild apps/web/src/lib/reverseFileBuffer35R3.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r35r3.test.cjs \
  && node /tmp/r35r3.test.cjs
```

Fixture MP4 dựng tay: 12 sample, keyframe ở 0 và 6, mỗi sample
10 byte; VideoDecoder + EncodedVideoChunk được FAKE (chỉ trả frame
mang đúng timestamp của chunk để kiểm chứng luồng controller).
Vì vậy các test chứng minh ĐÚNG logic nhả buffer / cổng file lớn /
ngân sách, KHÔNG chứng minh decode thật hay bộ nhớ thật trên
footage lớn — hai việc đó vẫn thuộc probe browser (xem §5).

| Test | Chứng minh gì |
|---|---|
| Hằng ngân sách | frame 192MiB, file lớn 128MiB, tổng 320MiB (chống đổi cảm tính) |
| Ngân sách tổng trừ buffer | 0 byte file → 133 frame; 128MiB file → 80 frame (ở 2,40MiB/frame); đầu vào lệch → 1 |
| reverseMemoryUsageBytes | tách frame + buffer + tổng đúng số học |
| estimatedBytesPerFrame | 720p = hằng đo; 1080p > 720p; res 0 → fallback 720p |
| Decode xong nhả buffer | sau `ensureWindowForTime(0.1)` cache 2 frame, `retainedFileBytes = 0`, `memoryUsage.total = frame`, `frameAt` vẫn hit không fetch lại, `presentCachedReverse` vẽ [1,0] (present giảm dần, hồi quy đường cũ) |
| Đổi cửa sổ fetch lại | cửa sổ 1.0s (GOP 6..10) làm GET tăng 1 → 2, sau đó lại `retainedFileBytes = 0`, `frameAt(1.0)` hit |
| Cổng HEAD | HEAD báo 200KiB > ngưỡng test 1024B → `failed`, `largeFileFallback`, GET = 0 lần (chưa tải body) |
| Cổng header GET | HEAD không báo, GET báo 5000B > ngưỡng → `arrayBuffer` = 0 lần, body đã hủy 1 lần |
| Cổng sau tải (không header) | body 2048B không header → vứt, khóa `unsupported`, lần `ensure` sau không tải lại (GET vẫn = 1) |
| Lỗi decode fail-soft | fake decoder ném lỗi → decode 0 frame → `ensure` trả false, `failed`, `retainedFileBytes = 0`, `frameAt` null, không ném ra caller |

Lưu ý harness: các test async dùng chung global fetch/VideoDecoder
nên harness chạy TUẦN TỰ; bản đầu chạy đồng thời đã cho kết quả
sai (stub bị đè lẫn nhau) và đã sửa thành queue tuần tự trước khi
lấy số cuối — số 10/10 là số sau khi sửa harness.

### 3.2 Hồi quy đường WebCodecs cũ — vẫn xanh

- `tsc --noEmit -p apps/web/tsconfig.json`: exit 0.
- `npm --prefix apps/web run build` (tsc + vite build): pass, 5,87s.
- `mp4Demux34Q2`: 8/8; `reversePlayback34Q2`: 4/4;
  `reversePlayback`: 10/10; `reversePlaybackRound28L2`: 17/17;
  `reverseDecodeAhead`: 12/12 (đường decode-ahead của Q3 không bị
  ảnh hưởng vì nó không dùng controller này).
- Trình tự decode trong test mới (GOP-align, present giảm dần,
  evict giữ đúng cửa sổ) giữ nguyên ngữ nghĩa đợt 34 Q2; chỉ thêm
  việc nhả buffer và cổng file lớn xung quanh nó.

## 4. Hành vi mới — đọc kỹ trước khi dùng

### 4.1 Khi nào buffer còn giữ, khi nào đã nhả

- Trong lúc `ensureWindowForTime` đang decode 1 cửa sổ:
  `retainedFileBytes` = kích thước file (≤ 128 MiB nếu qua cổng).
- Ngay sau khi `decodeGop` trả về (bên trong đã `flush` nên frame
  đã độc lập với buffer): `bytes = null`, `loadPromise = null`,
  `retainedFileBytes = 0`. Track đã parse (metadata nhỏ) vẫn giữ
  để tra mốc thời gian mà không cần tải lại.
- Gọi `frameAt` cho frame đã có trong cache: không fetch lại
  (đường nhanh kiểm tra cache trước khi load).
- Gọi `frameAt`/`ensureWindowForTime` cho cửa sổ khác: fetch lại
  toàn file (qua 3 cổng), decode cửa sổ mới, nhả tiếp. Đây là chi
  phí cố định của hướng (b); với file ≤ 128 MiB qua proxy/file
  local thì 1 lượt fetch lại là rẻ hơn rủi ro của hướng (a).
- `dispose()` nhả buffer + reset cờ file lớn (instance bỏ đi).

### 4.2 Hai thay đổi hành vi nhỏ (có chủ ý, ghi rõ)

1. **Decode được 0 frame nay là lỗi.** Trước đây `decodeGop` nuốt
   lỗi từng chunk và trả số frame decode được; controller không
   kiểm tra số này nên decode hỏng toàn bộ vẫn trả `true` với cache
   rỗng (caller chỉ thấy `frameAt` null, không biết là lỗi). Nay
   0 frame → `unsupported = true`, `ensure` trả false. Decode một
   phần (> 0 frame) vẫn giữ hành vi cũ: frame thiếu rơi về đường
   element qua `frameAt` null / `missing`.
2. **Lỗi decode ném ra ngoài nay fail-soft.** Trước đây lỗi ném từ
   `decodeGop` (ví dụ browser không có VideoDecoder) sẽ thoát khỏi
   `ensureWindowForTime` dưới dạng promise rejection — trái với bất
   biến đã ghi ở đầu file ("mọi lỗi đều khóa về unsupported, không
   ném ra draw"). Nay `ensureWindowForTime` bắt lỗi đó, khóa
   `unsupported`, trả false, vẫn nhả buffer ở `finally`.

### 4.3 Cổng file lớn — thứ tự và giới hạn từng cổng

1. **HEAD:** `fetch(url, {method: "HEAD"})` trong try/catch; chỉ
   dùng khi trả `ok` và có `content-length` hợp lệ. HEAD thất bại
   (405, blob URL không hỗ trợ, lỗi mạng) thì BỎ QUA, không chặn —
   vì vậy cổng này là tối ưu sớm, không phải cổng bắt buộc.
2. **Header GET:** trước khi `arrayBuffer()`, nếu `content-length`
   > ngưỡng thì hủy body (`resp.body?.cancel()`, lỗi hủy được nuốt)
   và khóa fallback. Cổng này chặn được mọi server báo đúng
   `content-length` mà không cần HEAD.
3. **Sau tải (không header):** nếu không header nào báo kích thước
   (chunked, blob không báo, proxy lạ) thì buộc phải tải xong mới
   biết file lớn → vứt ngay, không parse/decode, khóa `unsupported`
   để không tải lại. **Đỉnh heap thoáng qua trong lúc tải là giới
   hạn còn lại của hướng (b)** — với file 420MB không header, heap
   vẫn vọt lên trong lúc tải rồi mới hạ; hướng (b) chỉ bảo đảm
   trạng thái ỔN ĐỊNH sau đó là 0 byte file, không bảo đảm đỉnh
   thoáng qua. Muốn chặn cả đỉnh này thì phải làm hướng (a) Range
   (xem §5.3) hoặc chặn bằng kích thước file từ File API trước khi
   vào controller (xem §5.2).
4. **Fallback là đường element cũ nguyên vẹn:** controller trả
   null / false, `drawVideoClip` rơi về nhánh element như khi cờ
   tắt — không skip frame, không đen hình. Cờ opt-in
   `window.__vcutReverseWebcodecs` vẫn mặc định TẮT (đợt 34 Q2);
   luồng này KHÔNG bật cờ cho file lớn hay file nào khác.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA ĐO trên file lớn thật.** Mọi claim về "đã nhả buffer"
   chỉ chứng minh trên fixture nhỏ + fake decoder. Chưa có số đo
   heap/RSS trên file 420MB thật sau sửa (cần probe browser với
   fixture lớn + cờ bật): phải thấy `retainedFileBytes = 0` và heap
   hạ sau decode thì mới claim tiết kiệm bộ nhớ thật. Cho tới lúc
   đó, KHÔNG được viết "đã sửa xong vấn đề 420MB" mà chỉ viết "đã
   sửa logic, chờ đo thật".
2. **Chưa chặn bằng File API trước khi fetch.** Nếu nguồn là File
   local thì `file.size` biết trước mà không cần HEAD/GET; nối cổng
   này (khi caller có sẵn File) sẽ chặn cả đỉnh heap thoáng qua ở
   §4.3 mục 3 cho nguồn local. Hiện controller chỉ nhận URL nên
   chưa làm được — cần luồng sở hữu preview/store truyền thêm size
   (hoặc File) vào controller, không làm lén ở đây vì chạm store.
3. **Hướng (a) Range vẫn là nợ mở, không phải đã bác vĩnh viễn.**
   Nếu sau này cần phát ngược file > 128 MiB bằng WebCodecs (thay
   vì fallback element), thì phải làm: probe moov (đầu + đuôi file),
   demux từ mảnh byte, kiểm tra `Accept-Ranges`/206 và fallback về
   tải toàn file khi server không hỗ trợ. Khi đó ngân sách tổng ở
   đây vẫn dùng được (retained = kích thước đoạn GOP đang giữ thay
   vì cả file).
4. **Số byte/frame theo độ phân giải vẫn là ước lượng scale pixel,**
   chưa phải số đo từng res (1080p đo đợt 34 Q2 bị nhiễm buffer
   file nên chỉ mang tính chỉ dẫn). Cửa sổ hiệu dụng vì vậy mang
   tính thận trọng (có thể thu hẹp hơn cần thiết ở 1080p+), không
   claim tối ưu.
5. **Chưa đo lại fps ngược sau sửa.** Việc fetch lại khi đổi cửa sổ
   thêm độ trễ vào lần present đầu của cửa sổ mới (chưa ấm cache);
   fps paced/unpaced sau sửa cần đo lại trên browser thật trước khi
   claim "không chậm đi". Đường nhanh cache ấm (§4.1) giảm thiểu
   nhưng không xóa được chi phí này ở lần đổi cửa sổ đầu tiên.
6. **HEAD thêm 1 request mỗi lần tải lại.** Với file qua proxy chậm
   hoặc server tính phí theo request, đây là chi phí nhỏ nhưng thật;
   HEAD thất bại được nuốt nên không vỡ, nhưng cũng không log —
   harness muốn thấy cổng nào đã chặn thì đọc `knownFileSizeBytes`
   + `largeFileFallback` sau khi `failed` (không có log riêng).
7. **Nợ đứng từ đợt 34 Q2 vẫn mở, không thuộc luồng này:** đo quiet
   đối chứng + đo GPU cho đường WebCodecs; toggle UI cho cờ opt-in;
   bỏ seek element thừa khi cờ bật; Safari / máy thật / dpr > 1.
