# Phase 9 — Đợt 57, luồng N10: trial-decode sample 0 lớn bằng chunked fetch (đóng nợ M10 §8.2)

Ngày: 07/11/2026 (lượt cron 15:35 +07). Đóng nợ (b) của M10: sample 0
> 2 MiB ở stream-mode vẫn bị bỏ qua (không trial-decode). KHÔNG push,
KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới đây đều
đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Cap nâng 2 MiB → 8 MiB, phần còn lại fetch theo chunk 512 KiB
   rồi ráp lại (tối đa 16 chunk).** Sample 3 MiB và đúng 8 MiB đều
   trial-decode được qua chunked fetch (probe nhận đủ byte, đúng từng
   byte, range chunk nối tiếp không trùng/không hở); sample > 8 MiB
   vẫn bỏ qua (fail-open). Test Node mới **17/17** (đỏ-trước 6/10,
   đúng 4 test hành vi mới fail).
2. **KHÔNG decode streaming — đã cân nhắc và loại (xem §1.2).**
   VideoDecoder chỉ nhận `EncodedVideoChunk` TRỌN 1 access unit,
   không có API đưa từng mảnh của 1 sample vào rồi decode dần; đưa
   chunk cắt dở vào sẽ lỗi oan file thật. Chunked fetch + ráp lại là
   cách duy nhất đúng với API hiện có.
3. **Keyframe 4K nhiễu thật 4.107.475 byte decode KHÔNG kịp trong
   timeout 200 ms (5/5 lần đều timeout → fail-open).** Phát hiện trung
   thực quan trọng: cap 8 MiB cho phép T3 FETCH sample lớn, nhưng
   timeout 200 ms vẫn là chặn cứng thật sự với keyframe nhiều chi
   tiết — trial-decode không chặn được moov giả có sample 0 là
   keyframe thật-lớn-nhiễu (decode không xong nên cho qua, hướng an
   toàn). Keyframe 4K thường (300.148 byte) decode OK 5/5 qua đường
   chunked end-to-end (T3 stream gop-range, 2 request sample).
4. **Đường sample nhỏ KHÔNG chậm hơn.** Decode trực tiếp sample 0
   720p thật 7 lần: median **7,7 ms** (M10: 14,2 ms — số M10 đo lúc
   máy yên hơn; máy đợt này tải nặng do các luồng đợt 57 chạy song
   song nên chỉ kết luận "không chậm hơn", không claim cải thiện).
   Chênh T3 stream có/không probe median **22,1 ms** (M10: 16,1 ms)
   — cao hơn trong nhiễu tải, không quy cho code mới vì đường sample
   nhỏ không đổi 1 byte logic.
5. **Hồi quy GOP: 28/28 suite xanh** (M10 28/28, L8 23/23, T3 10/10,
   I6 25/25, N10 17/17). **vite build pass** 7,99 s. **tsc: 2 lỗi
   duy nhất ở file của luồng N10 khác (`gopTrialDecode57N6.test.ts`,
   đang làm song song — KHÔNG đụng, ghi rõ ở §4).**

## 1. Thiết kế

### 1.1 Cap 8 MiB — căn cứ đo thật

Keyframe thật đo được (demux production + đọc trực tiếp, xem §2.1):

| File | Codec | s0 (byte) | Keyframe lớn nhất |
|---|---|---|---|
| trailing-real37.mp4 (720p thật) | avc1.64001F | 29.245 | 38.909 |
| bigkey-1080p (M10) | — | ~100.000 | — |
| bigkey-4k.mp4 (4K crf 12) | avc1.640033 | 300.148 | 342.408 |
| bigkey-4k-lossless.mp4 (4K crf 0) | avc1.F40033 | 460.756 | 460.756 |
| bigkey-4k-noisy.mp4 (4K + nhiễu, crf 18) | avc1.640033 | **4.107.475** | 4.107.475 |

8 MiB ≈ 17× keyframe 4K lossless lớn nhất đo được (460.756 byte),
bao phủ cả keyframe 8K (~4× pixel 4K → ~1,2–1,4 MiB ở cùng chất
lượng) lẫn keyframe 4K nhiễu/bitrate rất cao (4,1 MiB đo thật).
Cap chặn kẻ giả khai sample đầu khổng lồ để ép fetch: tối đa 8 MiB
qua ≤ 16 request. Timeout 200 ms chặn cứng chi phí decode bất kể
cap, nên cap lớn hơn không làm kẹt đường mở file.

### 1.2 Vì sao chunked fetch, vì sao KHÔNG decode streaming

Hai phương án đã cân nhắc:

- **(A) Chunked fetch + ráp lại (ĐÃ CHỌN).** Fetch phần còn lại
  của sample 0 theo chunk 512 KiB (mỗi chunk qua đúng kiểm chứng
  206 + Content-Range như mọi range khác, kind `"sample"`), `set`
  vào đúng vị trí trong buffer đích đã cấp trước (size = sample đầy
  đủ), rồi đưa nguyên sample vào probe như cũ. Ưu: không đổi gì ở
  probe/decode (decoder vẫn nhận 1 access unit trọn vẹn); mỗi request
  nhỏ nên qua được server/proxy kẹp độ dài Range (1 request 8 MiB
  duy nhất có thể bị clamp → 416/trả thiếu → `fetchRangeChecked`
  ném lỗi); đỉnh heap transient ≈ size + 1 chunk (không nối buffer
  tạm như M10: size + remainder-copy). Nhược: thêm tối đa 15 request
  so với M10 (đo headed §2.3: fetch 4,1 MiB chunked hết ~169 ms
  dưới tải — chấp nhận được, 1 lần khi mở file).
- **(B) Decode streaming — LOẠI.** WebCodecs không có API đưa từng
  mảnh của 1 sample vào rồi decode dần: `EncodedVideoChunk` là 1
  access unit hoàn chỉnh; đưa chunk cắt dở vào decoder sẽ lỗi
  ("Unable to determine size of bitstream buffer" hoặc tương tự) và
  bị tính là decode-failed → chặn oan file thật. Nối nhiều chunk
  thành nhiều `EncodedVideoChunk` riêng cũng sai (mỗi chunk bị coi là
  1 access unit riêng). Không có cách streaming nào đúng với API
  hiện có — ghi rõ để đợt sau khỏi thử lại.

### 1.3 Hằng số (đặt tên rõ ràng, có comment lý do trong code)

- `MAX_TRIAL_DECODE_SAMPLE_BYTES = 8 MiB` (nâng từ 2 MiB).
- `TRIAL_DECODE_SAMPLE_CHUNK_BYTES = 512 KiB` — bằng đúng tiền tố
  mặc định của T3 nên cùng bậc với mọi fetch khác; đủ nhỏ để nằm
  dưới giới hạn độ dài Range của hầu hết server/proxy, đủ lớn để
  sample tối đa chỉ cần ≤ 16 request.
- `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES = 16` — KHÔNG hard-code số
  rời mà suy ra: `ceil((8 MiB − 256 KiB) / 512 KiB) = ceil(15,5)`.
  Đổi cap/chunk là giới hạn tự khớp. Vòng fetch dừng bằng giới hạn
  này (phòng thủ chống lặp vô hạn nếu logic tính chunk sai); T3
  không bao giờ chạm tới vì cap đã chặn trước.
- Timeout trial-decode giữ nguyên **200 ms** (không đổi — M10 §8.4
  đã nêu việc tăng timeout riêng cho sample lớn là việc đợt sau).

### 1.4 Hành vi (gopRangeFetch39T3.ts, stream-mode)

- `s0.size ≤ 256 KiB`: như cũ (1 request tiền tố, không chunk).
- `256 KiB < s0.size ≤ 8 MiB`: helper mới `fetchSampleRemainderChunked`
  (export để test trực tiếp) fetch phần còn lại theo chunk 512 KiB,
  ráp vào buffer đích đã cấp trước, trả đủ sample cho probe.
  Chunk nào lỗi (416/200/mạng) → throw ngay, caller bỏ qua
  trial-decode (fail-open) như M10; quá 16 chunk → throw
  `sample-chunk-limit` (phòng thủ, không bao giờ chạm tới).
- `s0.size > 8 MiB`: bỏ qua trial-decode (fail-open) như hành vi cũ.
- All-mode không đổi: GOP 0 đã fetch đủ range nên probe luôn nhận đủ
  sample 0, không cap, không chunk (test N10 khóa: 0 request kind
  `"sample"` ở all-mode).
- Lưu ý giữ lại từ M10 (không phải mới): T3 vẫn fetch phần còn lại
  cả khi probe là null (caller tắt trial-decode) — đo headed §2.3:
  probe-null vẫn 9 request sample, 169,1 ms. Đó là phí fetch khi
  không decode; để đợt sau cân nhắc bỏ qua fetch khi
  `trialProbe === null` (nợ §6.2, không sửa trong luồng này vì ngoài
  phạm vi nợ M10 (b)).

## 2. Đo headed thật (Xvfb :181/:182, Chromium headed, cổng 8913/8914/9409/9410)

Máy KHÔNG yên lúc đo: loadavg lúc bắt đầu **3,37** (probe a) và
**2,48** (probe b) — các luồng đợt 57 chạy song song (M10 đo lúc
1,91–2,00). Mọi số thời gian dưới đây phải đọc kèm bối cảnh tải đó;
kết luận "không chậm hơn" dựa trên median decode trực tiếp, không
dựa trên chênh T3 tuyệt đối. Log: `headed-n10.log`, `headed-n10b.log`.

### 2.1 Keyframe thật đo được (làm căn cứ cap §1.1)

File tự encode ffmpeg (testsrc2 3840×2160, 2s, faststart):
- `bigkey-4k-lossless.mp4` (crf 0, 23.798.131 byte): s0 = **460.756**,
  codec avc1.F40033 (High 4:4:4 Predictive — x264 lossless).
- `bigkey-4k-noisy.mp4` (noise alls=30 + crf 18, 247.290.308 byte):
  s0 = **4.107.475**, maxKey = 4.107.475, codec avc1.640033 (High).
  Encode mất 225 s (nhiễu làm x264 chậm) — file chỉ dùng làm
  fixture đo, KHÔNG đưa vào batch (binary).
- Đối chiếu: bigkey-4k (M10) s0 = 300.148; trailing-real37 s0 = 29.245.

### 2.2 Đường sample nhỏ không chậm hơn (đối chiếu M10 §4)

File `trailing-real37.mp4` (38.996.431 byte, s0 = 29.245 byte):
- Decode trực tiếp sample 0 thật 7 lần (probe production, decoder
  mới mỗi lần): 16,2 / 8,0 / 7,6 / 7,4 / 7,3 / 7,7 / 7,7 ms —
  **median 7,7 ms, p95 16,2 ms, 7/7 decode-ok**. So với M10 median
  14,2 ms (máy yên hơn): **KHÔNG chậm hơn**. Lần đầu 16,2 ms là
  warmup. Đường này không đổi 1 byte logic (cùng 1 request tiền tố,
  không chunk) nên kết quả này là kỳ vọng — đo để khóa, không phải
  để phát hiện cải thiện.
- T3 stream xen kẽ có/không probe, 5 vòng: có probe 283,5 (warmup) /
  96,6 / 70,6 / 83,5 / 64,0 — median **83,5 ms**; không probe 91,7 /
  78,4 / 61,4 / 57,3 / 60,0 — median **61,4 ms**; chênh median
  **22,1 ms** (M10: 16,1 ms). Cả 10 lần đều gop-range. Chênh cao hơn
  M10 nằm trong nhiễu tải (loadavg 3,4–5,0 so với 1,9–2,0) + fetch
  39 MB lúc đầu mất 504 ms; decode trực tiếp chỉ 7,7 ms nên phần
  chênh còn lại là fetch/demux + nhiễu — không quy cho code mới.

### 2.3 Keyframe lớn thật qua chunked fetch

**bigkey-4k (s0 = 300.148 byte) — decode OK end-to-end:**
- Decode trực tiếp 5 lần: 124,8 / 149,8 / 96,9 / 113,0 / 66,2 ms —
  **median 113 ms** (M10: 68,1 ms — chậm hơn do máy tải, không phải
  do code vì decode không đổi), **5/5 decode-ok**.
- T3 stream probe mặc định: **gop-range trong 124 ms**, đúng **2
  request sample**: tiền tố `[1640, 263783]` + 1 chunk
  `[263784, 301787]` (38.004 byte; kết thúc đúng ở cuối sample 0).
  Kết hợp 2 phép đo: đường chunked-fetch + decode đã chạy thật
  end-to-end cho keyframe 300 KiB.

**bigkey-4k-noisy (s0 = 4.107.475 byte) — fetch đúng, decode timeout:**
- Decode trực tiếp sample đầy đủ 5 lần: 200,4 / 212,2 / 200,3 /
  201,4 / 202,3 ms — **median 201,4 ms, 5/5 đều
  `timeout-200ms` → fail-open** (passed + skipped). Decoder trên VM
  này không decode kịp keyframe 4K nhiễu trong 200 ms.
- T3 stream probe mặc định (probe a): **gop-range trong 1330,7 ms**,
  đúng **9 request sample** (1 tiền tố + 8 chunk 512 KiB, range nối
  tiếp không trùng/không hở, chunk cuối `[3933560, 4108874]` kết thúc
  đúng ở cuối sample 0 = 1400 + 4.107.475 − 1).
- Tách chi phí (probe b, máy bớt tải hơn): probe-null (chỉ fetch +
  demux, không decode) **169,1 ms, 9 request**; probe mặc định lặp
  lại **294,4 ms, 9 request** (≈ fetch 169 ms + timeout 200 ms,
  trong nhiễu tải). Con số 1330,7 ms ở probe (a) là outlier lúc máy
  tải nặng nhất (lần T3 đầu tiên trên file này trong page vừa fetch
  39 MB + 7 decode + 10 T3) — số lặp lại 294,4 ms mới đại diện.
- Kết luận trung thực: chunked fetch làm đúng phần của nó (đủ byte,
  đúng range, đúng thứ tự); **timeout 200 ms mới là chặn cứng khiến
  keyframe nhiễu 4K không trial-decode được** — file thật vẫn qua
  (gop-range, fail-open) nhưng moov giả có sample 0 là keyframe
  thật-lớn-nhiễu cũng lọt ở stream-mode (vì decode không xong).
  All-mode chặn được mẫu RÁC lớn (decode lỗi nhanh trong 0,5 ms,
  không phải timeout) — nhưng keyframe thật quá lớn thì timeout ở cả
  2 mode. Muốn chặn chắc lớp này cần timeout riêng theo kích thước
  hoặc decode ở worker nền — việc đợt sau (M10 §8.4, giữ nguyên).

## 3. Test Node mới `gopTrialDecode57N10.test.ts` — 17/17

### 3.1 Hằng số (4 test — khóa hợp đồng, đổi lén là đỏ)

- Cap = 8 MiB; chunk = 512 KiB; số lần fetch tối đa = 16 =
  ceil((8 MiB − 256 KiB) / 512 KiB) (assert cả giá trị lẫn công thức
  suy ra); timeout vẫn 200 ms.

### 3.2 Unit `fetchSampleRemainderChunked` (5 test, mock fetch Range)

- Sample 3 MiB → 6 chunk đúng range, ráp lại đúng từng byte (buffer
  nguồn phụ thuộc vị trí); remainder vừa đúng bội số chunk (2 chunk,
  không fetch thừa); remainder 524.289 byte → 2 chunk (524.288 + 1);
  chunk giữa lỗi 416 → throw sau đúng 2 request; vượt giới hạn 16
  chunk → throw `sample-chunk-limit` sau đúng 16 request.

### 3.3 T3 thật qua server Range (8 test, file MP4 dựng từ builder M10)

Mẫu sample đổi thành **phụ thuộc vị trí** (mỗi NAL 10 byte mang byte
cuối = chỉ số đơn vị & 0xff, cấu trúc NAL vẫn hợp lệ cho
`validateAvccSample`) để chunk ráp sai offset là lộ khi deepEqual
với mẫu kỳ vọng — cộng với assert đúng từng range chunk.

- 3 MiB + probe-false → full-file /trial-decode/, probe nhận đủ
  3.000.000 byte đúng từng byte, **7 request sample** (1 tiền tố +
  6 chunk, range đã assert đủ 7 cặp).
- 3 MiB + probe-true → gop-range, probe 1 lần, 3.000.000 byte.
- Đúng cap 8.388.608 byte + probe-false → full-file, probe nhận đủ,
  **17 request sample** (1 + 16 chunk), chunk cuối kết thúc đúng ở
  cuối sample 0.
- Cap + 1 (8.388.609) → gop-range, probe 0 lần, chỉ 1 request sample
  (tiền tố AVCC).
- 9 MiB → gop-range, probe 0 lần.
- Chunk giữa remainder lỗi 416 → gop-range, probe 0 lần (fail-open).
- Sample nhỏ 1.000 byte → gop-range, đúng 1 request sample, probe
  nhận đủ 1.000 byte (đường nhỏ không thêm request).
- All-mode 3 MiB → probe 1 lần, probe-false chặn được, 0 request
  kind `"sample"` (GOP 0 đã đủ range, không dùng đường chunk).

### 3.4 Đỏ-trước đã verify (2 lớp)

1. **Trước khi sửa**, bản tạm chỉ gồm 10 test dùng API hiện có (đã bỏ
   2 test hằng chunk + 5 test unit helper chưa tồn tại) chạy trên
   code chưa sửa: **6/10** — đúng 4 test hành vi mới fail (hằng cap
   8 MiB, 3 MiB ×2, biên 8 MiB); các test còn lại xanh (trên cap,
   416, sample nhỏ, all-mode). File mới nguyên bản bundle lỗi
   "No matching export" cho 3 symbol mới — bằng chứng test cần code
   mới.
2. **Sau khi sửa xong**, chạy lại đầy đủ: **N10 17/17**.

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round57-n10/run-regression-n10.sh`,
  sao từ M10 + thêm dòng N10): U2 20/20, T3 10/10, V2 16/16, W4
  15/15, X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4
  10/10, E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8 18/18,
  reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6
  11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
  structuredNotes32 12/12, errorDetail34Q4 35/35, L8 23/23, M10
  28/28, **N10 17/17**. Log `regression-n10.log`. (28/28 suite xanh.)
- Headed (Xvfb :181/:182, TMPDIR riêng): §2.2–§2.3. Log
  `headed-n10.log`, `headed-n10b.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **2 lỗi, cả 2 đều ở
  file của luồng khác** — `apps/web/src/lib/gopTrialDecode57N6.test.ts`
  (luồng N6 đợt 57, đang làm song song) báo TS5097 ở 2 dòng import
  `.ts` (thiếu `allowImportingTsExtensions`). **Không có lỗi nào ở
  file của luồng này** (grep toàn bộ output tsc, chỉ 2 dòng đó).
  Không đụng file N6 — ghi rõ để parent/luồng N6 xử lý.
- `vite build` (chạy từ `apps/web`, outDir scratch
  `~/scratch-round57-n10/build`): **pass** trong 7,99 s; chỉ cảnh báo
  chunk > 500 kB có sẵn. (Lưu ý: chạy từ gốc repo với
  `--config apps/web/vite.config.ts` sẽ lỗi "Could not resolve entry
  module index.html" vì vite tìm index.html theo cwd — phải chạy từ
  `apps/web`, không phải lỗi code.)

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/gopRangeFetch39T3.ts` — hằng cap 2 MiB → 8 MiB
  + 2 hằng mới `TRIAL_DECODE_SAMPLE_CHUNK_BYTES` (512 KiB),
  `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES` (16, suy ra từ công thức);
  helper mới `fetchSampleRemainderChunked` (export); nhánh stream-mode
  dùng helper thay cho 1 request remainder duy nhất của M10. Không
  đổi logic gate, probe, prefix, tail-scan, AVCC, mdat, all-mode,
  validateSampleTimestamps.
- `apps/web/src/lib/gopTrialDecode55L8.ts` — chỉ đổi comment header
  (cap 2 MiB → 8 MiB chunked); không đổi code (probe/timeout giữ
  nguyên).

ĐỔI (test, theo hợp đồng mới — tiền lệ M10 đổi 1 test L8):

- `apps/web/src/lib/gopTrialDecode56M10.test.ts` — **1 test đổi mẫu
  theo hợp đồng mới**: "(b-t3) sample 0 = 3 MiB (> cap 2 MiB)" →
  9 MiB (> cap 8 MiB) để giữ đúng ý nghĩa "trên cap → bỏ qua"
  (3 MiB giờ nằm TRONG cap, đã có test N10 riêng); + ghi chú header.
  Không đổi hành vi test nào khác; M10 vẫn 28/28.
- `apps/web/src/lib/gopTrialDecode55L8.test.ts` — chỉ đổi ghi chú
  "≤ cap 2 MiB" → "≤ cap 8 MiB đợt 57 N10" ở 1 test 300 KiB (hành vi
  không đổi, test vẫn xanh); L8 vẫn 23/23.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền
  lệ J6/K8/L8/M10).

MỚI:

- `apps/web/src/lib/gopTrialDecode57N10.test.ts` — 17 test (§3).
- `docs/PHASE9_ROUND57_N10_LARGE_SAMPLE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `mp4Demux.ts` (validateSampleTimestamps là file của luồng
N6 — không đụng), mọi file production khác, `preview.tsx`,
`store.ts`, `reverseWebcodecs.ts`. Scratch + log ở
`~/scratch-round57-n10/` (probe headed ×2 + runner, file
bigkey-4k-lossless/noisy, regression, red-before).

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Timeout 200 ms là chặn cứng thật sự cho sample lớn nhiễu**
   (§2.3): keyframe 4K nhiễu 4,1 MiB decode không kịp → fail-open ở
   cả 2 mode. Muốn chặn chắc sample lớn thì cần timeout riêng theo
   kích thước (vd scale theo byte/pixel) hoặc decode ở worker nền —
   việc đợt sau; đổi timeout chung sẽ ảnh hưởng đường mở file.
2. **T3 vẫn fetch remainder cả khi probe null** (§1.4): caller tắt
   trial-decode vẫn trả phí fetch chunked (đo headed: 169,1 ms cho
   4,1 MiB). Đợt sau có thể bỏ qua fetch khi `trialProbe === null`.
3. **Sample > 8 MiB ở stream-mode vẫn bỏ qua** (thiết kế, fail-open):
   all-mode chặn được mẫu rác lớn (decode lỗi nhanh), nhưng keyframe
   thật quá lớn thì timeout ở cả 2 mode (nợ 1). Keyframe > 8 MiB
   thực tế chỉ gặp ở 8K bitrate rất cao/lossless.
4. **Số đo headed chịu nhiễu tải** (§2): loadavg 2,5–5,0 do các luồng
   đợt 57 chạy song song — median 720p 7,7 ms, chênh T3 22,1 ms,
   decode 300 KiB 113 ms đều phải đọc kèm bối cảnh tải, không phải
   số máy yên tuyệt đối. So sánh trước/sau tin cậy nhất là median
   decode trực tiếp (7,7 vs 14,2 ms) vì cùng phương pháp đo.
5. **Chưa đo Safari/Firefox thật** (không có trên VM); decoder
   Chromium là căn cứ duy nhất cho §2.3.
6. **Nợ cũ giữ nguyên (không đụng trong luồng này):** `.github/
   workflows/ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có
   CI chạy thật); file `gopTrialDecode57N6.test.ts` của luồng N6 đang
   lỗi tsc (TS5097, §4) — cần luồng N6 sửa/xong mới xanh toàn cây;
   các nợ M10 §8 (SPS VUI ground-truth fps, ctts v1 maxPresEnd ≈
   2^32, cutoff `buffered [[0,2.367]]`, …) giữ nguyên.
