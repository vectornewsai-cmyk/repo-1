# Phase 9 — Đợt 59, luồng P6: trial-decode sample > 8 MiB ở stream-mode (đóng nợ đợt 58 §6.6 + đợt 57 N10)

Ngày: 07/11/2026 (lượt cron 21:35 +07). Đóng nợ 2 của đợt 58
(LIMITS đợt 58 §6, mục O6): trial-decode sample > 8 MiB ở stream-mode
vẫn bị bỏ qua. KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào
batch. Mọi số dưới đây đều đo/chạy thật; chỗ chưa đo được thì ghi rõ,
không mạo nhận. Giờ trong file này là +07 (log máy ghi UTC, đã cộng
7 giờ).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Cap trial-decode stream-mode NAY LÀ 32 MiB** (nâng từ 8 MiB,
   `MAX_TRIAL_DECODE_SAMPLE_BYTES`): sample 0 trong (8 MiB, 32 MiB]
   nay được fetch phần còn lại theo chunk 512 KiB (tối đa 64 chunk)
   rồi trial-decode đủ sample; sample > 32 MiB vẫn bỏ qua (fail-open).
   **KHÔNG tải toàn bộ file vào RAM một lần**: T3 chỉ fetch đúng range
   sample 0 (tiền tố + chunk remainder), đỉnh heap transient ≈ sample
   (≤ 32 MiB) + 1 chunk 512 KiB — file (có thể hàng trăm MiB) không
   bao giờ được tải trọn.
2. **KHÔNG decode streaming theo từng đoạn** — đã cân nhắc và loại
   (xem §1.2): VideoDecoder chỉ nhận `EncodedVideoChunk` TRỌN 1
   access unit; "theo từng đoạn" ở đây là CHUNKED FETCH, rồi decode
   1 lần trên sample đã ráp đủ (N10 §1.2 đã chứng minh không có API
   đưa từng mảnh của 1 sample vào rồi decode dần).
3. **Timeout theo kích thước KHÔNG đổi** (O6: 0,3 ms/KiB trên 256 KiB,
   trần 2500 ms — sample ≥ ~7,7 MiB đều chạm trần). Hệ quả trung thực,
   đo thật (§2): keyframe thật 9,7 MiB decode-ok 1837–2035 ms
   (nay có verdict thay vì bị bỏ qua); keyframe thật 19,7 MiB
   (decode ~2,85 s) và 30,7 MiB (decode ~5,09 s) đều timeout 2500 ms
   → fail-open (hướng an toàn). **Rác 12 MiB ngẫu nhiên fail trong
   ~7 ms → false 3/3**: rác lớn nay có verdict thật thay vì bị bỏ qua
   — đó là phần chặn được thêm thật sự của đợt này.
4. **Test Node mới 16/16** (đỏ-trước 9/16 — đúng 7 test hành vi mới
   fail). **Hồi quy GOP: 30/31 suite xanh ở lượt chạy đầu** (O6 17/18
   do 1 test thời gian flake dưới tải — chạy lại 2 lượt đều 18/18,
   xem §4); L8 23/23, M10 28/28, N10 17/17, T3 10/10, I6 25/25.
   **tsc web + desktop: 0 lỗi. vite build pass** 8,62 s (chỉ cảnh báo
   chunk > 500 kB có sẵn).

## 1. Thiết kế

### 1.1 Cap 32 MiB — căn cứ đo thật

Keyframe thật đo được (headed, §2; N10/O6 đo trước):

| File | Codec | s0 (byte) | Decode median |
|---|---|---|---|
| trailing-real37.mp4 (720p) | avc1.64001F | 29.245 | 30,0 ms (máy tải) |
| bigkey-4k.mp4 (4K crf 12) | avc1.640033 | 300.148 | 111,4 ms (máy tải) |
| bigkey-4k-noisy.mp4 (4K nhiễu) | avc1.640033 | 4.107.475 | 1213,6 ms (máy tải) |
| bigkey-4k-noisy60-crf12.mp4 (4K nhiễu mạnh) | avc1.640033 | 9.683.047 | 1905,0 ms |
| bigkey-8k-noisy.mp4 (8K nhiễu) | avc1.64003C | 19.720.025 | 2853,8 ms |
| bigkey-8k-noisy60-crf12.mp4 (8K nhiễu mạnh) | avc1.64003C | 30.727.296 | 5090,5 ms |

32 MiB ≈ 70× keyframe 4K lossless lớn nhất đo được (460.756 byte)
và bao phủ cả keyframe 8K nhiễu/bitrate rất cao lớn nhất tự encode
được (30,7 MiB). Cap chặn kẻ giả khai sample đầu khổng lồ để ép
fetch: tối đa 32 MiB qua ≤ 64 request 512 KiB. Timeout trần 2500 ms
chặn cứng chi phí decode bất kể cap.

### 1.2 Vì sao chunked fetch, vì sao KHÔNG decode streaming

- **(A) Chunked fetch + ráp lại (ĐÃ CHỌN, nối tiếp N10).** Fetch phần
  còn lại của sample 0 theo chunk 512 KiB (mỗi chunk qua đúng kiểm
  chứng 206 + Content-Range, kind `"sample"`), `set` vào đúng vị trí
  trong buffer đích đã cấp trước (size = sample đầy đủ), rồi đưa
  nguyên sample vào probe như cũ. Ưu: không đổi gì ở probe/decode
  (decoder vẫn nhận 1 access unit trọn vẹn); đỉnh heap transient ≈
  sample + 1 chunk; file không bao giờ tải trọn. Nhược: sample 32 MiB
  cần tới 65 request (1 tiền tố + 64 chunk) — đo headed §2.3: T3
  stream trên file 9,7 MiB hết 2964,3 ms (fetch + decode ~1,9 s),
  chấp nhận được, 1 lần khi mở file.
- **(B) Decode streaming theo từng đoạn — LOẠI (lý do như N10 §1.2,
  nhắc lại để đợt sau khỏi thử lại).** WebCodecs không có API đưa
  từng mảnh của 1 sample vào rồi decode dần: `EncodedVideoChunk` là
  1 access unit hoàn chỉnh; đưa chunk cắt dở vào decoder sẽ lỗi
  ("Unable to determine size of bitstream buffer" hoặc tương tự) và
  bị tính là decode-failed → chặn oan file thật. Nhiệm vụ đợt này
  ghi "trial decode theo từng đoạn" được hiểu đúng là (A): CHUNKED
  FETCH theo từng đoạn + decode 1 lần trên sample đã ráp đủ. Không
  có cách streaming nào đúng với API hiện có.

### 1.3 Timeout giữ nguyên — hệ quả phải đọc kèm

- Công thức O6 không đổi: sample ≤ 256 KiB giữ timeout gốc 200 ms;
  phần vượt cộng 0,3 ms/KiB; trần 2500 ms. Sample ≥ ~7,7 MiB đều
  chạm trần (tính lại: trần cắn từ 8.109.398 byte).
- Tốc độ decode đo được ở đợt này ≈ **0,15 ms/KiB** (từ 4,1 MiB lên
  30,7 MiB: (5090,5 − 1213,6) / (30006 − 4012) KiB ≈ 0,149 ms/KiB)
  — khớp O6 (0,15 ms/KiB) dù máy đợt này tải nặng hơn, vì cả hai
  đầu đều chậm lại cùng tỉ lệ. Trần 2500 ms / 0,15 ms/KiB ≈ 16,3 MiB:
  **keyframe thật ≳16 MiB decode không kịp trần → fail-open**.
  Đây là giới hạn có chủ đích của thiết kế (không tăng trần — tăng
  trần nghĩa là đường mở file có thể kẹt main thread tới ~5 s, xem
  §6.3), không phải bug: file thật vẫn qua (gop-range, fail-open),
  chỉ moov giả có sample 0 là keyframe thật-khổng-lồ mới không bị
  chặn chắc — cùng lớp nợ như O6 §6.1 (keyframe bị đục lỗ giữa).
- Phần chặn được thêm thật sự: **rác lớn** (fail trong ~5–10 ms,
  không phụ thuộc kích thước) và **keyframe thật 8–16 MiB**
  (decode-ok trong trần) — cả hai trước đây đều bị bỏ qua hẳn ở
  stream-mode vì trên cap 8 MiB.

### 1.4 Hằng số (đặt tên rõ ràng, có comment lý do trong code)

- `MAX_TRIAL_DECODE_SAMPLE_BYTES = 32 MiB` (nâng từ 8 MiB).
- `TRIAL_DECODE_SAMPLE_CHUNK_BYTES = 512 KiB` (không đổi).
- `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES = 64` — suy ra từ công thức
  `ceil((32 MiB − 256 KiB) / 512 KiB) = ceil(63,5)` (không hard-code
  số rời); vòng fetch dừng bằng giới hạn này (phòng thủ).
- Timeout trial-decode giữ nguyên **200 ms gốc / trần 2500 ms** (O6).

## 2. Đo headed thật (Xvfb :187, Chromium headed, cổng 8919/9415, TMPDIR riêng)

Máy KHÔNG yên lúc đo: loadavg lúc bắt đầu **6,73** (probe chạy lần 3,
lần thành công), lúc kết thúc 4,21 — các luồng đợt 59 khác chạy song
song (P1–P10). Mọi số thời gian dưới đây phải đọc kèm bối cảnh tải
đó; so với O6 (loadavg ~2): decode 4,1 MiB median 1213,6 ms (O6:
622,6 ms), 300 KiB median 111,4 ms (O6: 69,5 ms) — chậm hơn ~1,6–2×
do tải, KHÔNG phải do code (đường decode không đổi). Tỉ lệ theo kích
thước (§1.3) vẫn khớp O6 nên kết luận về trần timeout đứng vững.
Log: `headed-p6.log` (lần 1, NOT-MEASURED), `headed-p6b.log` (lần 2,
lỗi getRandomValues — xem §4), `headed-p6c.log` (lần 3, thành công).

### 2.1 Sample tổng hợp (FFmpeg, chỉ dùng làm fixture đo, KHÔNG đưa binary vào batch)

- `bigkey-4k-noisy60-crf12.mp4` (testsrc2 3840×2160, 1 s, noise
  alls=60, crf 12, faststart; encode 33 s): s0 = **9.683.047** byte.
- `bigkey-8k-noisy.mp4` (testsrc2 7680×4320, 3 frame, noise alls=30,
  crf 18, threads 2, faststart; encode 17 s): s0 = **19.720.025**
  byte. Lần encode 8K đầu (30 frame, 4 thread) bị kernel OOM-kill
  sau 62 s — bản 3 frame + 2 thread mới encode được trên VM 8 GB
  (x264 lookahead giữ nhiều frame 8K trong RAM).
- `bigkey-8k-noisy60-crf12.mp4` (8K, 3 frame, noise alls=60, crf 12,
  threads 2; encode 15 s): s0 = **30.727.296** byte.
- Script gen (text, không stage binary): `gen-samples.sh`,
  `gen-samples2.sh` ở `~/scratch-round59-p6/`.

### 2.2 Decode trực tiếp sample 0 thật (probe production, 3 lần/mẫu)

| File | s0 (byte) | Decode 3 lần (ms) | Median | Verdict |
|---|---|---|---|---|
| trailing-real37.mp4 (720p) | 29.245 | 35,7 / 30,0 / 12,4 | **30,0** | 3/3 true |
| bigkey-4k.mp4 (4K) | 300.148 | 109,5 / 186,8 / 111,4 | **111,4** | 3/3 true |
| bigkey-4k-noisy.mp4 (4K nhiễu) | 4.107.475 | 1213,6 / 1208,1 / 1312,8 | **1213,6** | 3/3 true |
| bigkey-4k-noisy60 (4K nhiễu mạnh) | 9.683.047 | 1997,1 / 1905,0 / 1886,9 | **1905,0** | 3/3 true |
| bigkey-8k-noisy.mp4 (8K nhiễu) | 19.720.025 | 2853,8 / 2806,2 / 3671,7 | **2853,8** | 3/3 true |
| bigkey-8k-noisy60 (8K nhiễu mạnh) | 30.727.296 | 5431,4 / 5042,1 / 5090,5 | **5090,5** | 3/3 true |

- **8K decode được thật** trên Chromium VM này (codec avc1.64003C,
  7680×4320): không gặp `unsupported-config` — probe trả true 3/3
  ở cả hai file 8K. Lần đầu 720p 35,7 ms là warmup.
- **Rác 12 MiB ngẫu nhiên** (cùng config avc1.640033 4K): 10,5 /
  6,9 / 5,9 ms — median **6,9 ms, 3/3 false**. Rác lớn fail nhanh
  như rác 4,1 MiB ở O6 (median 5,1 ms): timeout dài không làm rác
  lọt.

### 2.3 runTrialDecode với timeout helper + T3 stream end-to-end (probe production)

- runTrialDecode (timeout helper = 2500 ms cho cả 3 mẫu lớn, 2 lần/mẫu):
  - 9.683.047 B → **decode-ok 2035,2 / 1837,6 ms** (2/2). Keyframe
    thật 9,7 MiB nay có verdict thật thay vì bị bỏ qua.
  - 19.720.025 B → **timeout-2500ms, fail-open 2/2** (2500,5 /
    2500,3 ms — đúng trần, không vượt).
  - 30.727.296 B → **timeout-2500ms, fail-open 2/2** (2500,3 /
    2502,1 ms).
- T3 stream-mode (`fetchVideoTrackByGopRange`, `streamGops: true`,
  probe production mặc định):
  - File 9,7 MiB → **gop-range trong 2964,3 ms, 19 request sample**
    (1 tiền tố + 18 chunk): tiền tố `[1304, 263447]`, chunk đầu
    `[263448, 787735]`, chunk cuối `[9176344, 9684350]` — kết thúc
    đúng ở cuối sample 0 (1304 + 9.683.047 − 1). Decode-ok trong
    trần nên verdict là thật, không phải fail-open mù.
  - File 19,7 MiB → **gop-range trong 3614,8 ms, 39 request sample**
    (1 + 38 chunk): chunk cuối `[19661722, 19720946]` — kết thúc
    đúng ở cuối sample 0 (922 + 19.720.025 − 1). Qua được nhờ timeout
    fail-open sau 2500 ms (fetch ~1,1 s + timeout 2,5 s).

## 3. Test Node mới `gopTrialDecode59P6.test.ts` — 16/16

### 3.1 Hằng số (3 test — khóa hợp đồng, đổi lén là đỏ)

- Cap = 32 MiB; chunk = 512 KiB; số lần fetch tối đa = 64 =
  ceil((32 MiB − 256 KiB) / 512 KiB) (assert cả giá trị lẫn công thức
  suy ra); timeout vẫn 200 ms.

### 3.2 Timeout ở vùng lớn (3 test)

- 7 MiB → 2274 ms (dưới trần — khóa công thức: 200 +
  ceil(6912 KiB × 0,3)); 8 / 9 / 12 / 32 MiB → 2500 ms (trần).
- runTrialDecode + probe treo + sample 12 MiB → fail-open
  `timeout-2500ms`, chờ ~2500 ms (đo: nằm trong cửa sổ [2000, 4000)).

### 3.3 Unit `fetchSampleRemainderChunked` (1 test)

- Sample cần 65 chunk → throw `sample-chunk-limit` sau đúng 64
  request (giới hạn mới; N10 khóa 16 chunk ở cap cũ).

### 3.4 T3 thật qua server Range (8 test, builder MP4 sao từ N10)

Mẫu sample vẫn phụ thuộc vị trí (deepEqual với mẫu kỳ vọng bắt ráp
sai offset). Builder P6 khác N10 ở 1 điểm: đuôi 1–4 byte không dựng
được NAL (cần tối thiểu 5 byte) nên điền byte marker phụ thuộc vị
trí thay vì throw — cần cho mẫu đúng cap 32 MiB (33.554.432 % 10 = 2)
và cap+1 (33.554.433 % 10 = 3); chỉ tiền tố mới được validateAvccSample
kiểm nên đuôi marker không ảnh hưởng tính hợp lệ AVCC.

- 12 MiB + probe-false → full-file /trial-decode/, probe nhận đủ
  12.000.000 byte đúng từng byte, **24 request sample** (1 + 23
  chunk), chunk cuối `[11796512, 12000031]` kết thúc đúng cuối sample 0.
- 12 MiB + probe-true → gop-range, probe 1 lần, 12.000.000 byte.
- Đúng cap 32 MiB (33.554.432) + probe-false → full-file, probe nhận
  đủ, **65 request sample** (1 + 64 chunk), chunk cuối
  `[33292320, 33554463]`.
- Cap + 1 (33.554.433) → gop-range, probe 0 lần, chỉ 1 request sample
  (tiền tố AVCC).
- 40 MiB → gop-range, probe 0 lần.
- Chunk giữa remainder lỗi 416 (12 MiB) → gop-range, probe 0 lần
  (fail-open). Lưu ý trung thực: test này xanh cả trên code cũ (12 MiB
  bị bỏ qua hẳn nên cũng probe 0 + gop-range) — nó khóa hành vi
  fail-open của đường chunked mới, không phải đỏ-trước.
- 12 MiB + probe treo → gop-range sau ~2500 ms (đo: 3099 ms tổng,
  trong cửa sổ [2000, 6000) — gồm fetch chunked + timeout trần).
- All-mode 12 MiB + probe-false → full-file, probe 1 lần,
  0 request kind `"sample"` (GOP 0 đã đủ range, không dùng đường chunk).

### 3.5 Đỏ-trước đã verify

Chạy suite mới TRƯỚC khi sửa production (chỉ có test + cập nhật
hợp đồng N10/M10): **P6 9/16** — đúng 7 test hành vi mới fail
(hằng cap, hằng 64 chunk, unit 64-chunk, 12 MiB ×2, đúng cap 32 MiB,
probe treo 12 MiB chờ 501 ms thay vì ~2500 ms); **N10 13/17** —
đúng 4 test fail (hằng cap, hằng 64 chunk, unit 64-chunk, đúng cap
32 MiB); M10 28/28 (test 40 MiB xanh cả trên code cũ vì cả 2 cap
đều bỏ qua — khóa biên mới, không phải đỏ-trước). Sau khi sửa:
**P6 16/16, N10 17/17, M10 28/28**.

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round59-p6/run-regression-p6.sh`,
  sao từ O6 + thêm dòng P6): U2 20/20, T3 10/10, V2 16/16, W4 15/15,
  X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10,
  E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8 18/18,
  reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6
  11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
  structuredNotes32 12/12, errorDetail34Q4 35/35, L8 23/23, M10
  28/28, N10 17/17, N6 32/32, **O6 17/18 ở lượt hồi quy đầu**,
  **P6 16/16**. Log `regression-p6.log`.
- **O6 17/18 là flake thời gian dưới tải, KHÔNG phải hồi quy do
  đợt này (xem §4.1).** Chạy lại cùng bundle 2 lượt liên tiếp:
  **18/18, 18/18**. Test O6 không đụng (chỉ sửa 1 dòng comment
  header); sample 3 MiB của test đó đi đúng nhánh cũ (cap mới không
  đổi gì ở 3 MiB: cùng chunk, cùng timeout 1003 ms) nên không có
  cơ chế nào khiến đợt này làm nó đỏ.
- Headed (Xvfb :187, TMPDIR riêng): §2. Log `headed-p6.log`,
  `headed-p6b.log`, `headed-p6c.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**;
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
- `vite build` (chạy từ `apps/web`, outDir scratch
  `~/scratch-round59-p6/build`): **pass** trong 8,62 s; chỉ cảnh báo
  chunk > 500 kB có sẵn.
- Lưu ý: các luồng đợt 59 khác (P1–P5, P7–P10) đang làm song song —
  file `tsconfig.json` có thể được họ thêm dòng exclude của họ sau
  thời điểm luồng này kiểm tra; luồng này chỉ thêm đúng 1 dòng của
  mình (`gopTrialDecode59P6.test.ts`), không đụng file của họ.
  `vi.json`/`en.json` KHÔNG đụng (luồng này không thêm chuỗi UI nào
  nên không cần fragment i18n).

### 4.1 O6 flake — chi tiết trung thực

Test `(o6-t3) sample 0 = 3 MiB + probe treo → gop-range sau ~1003 ms`
đo thời gian CHỜ timeout bằng hiệu (lượt probe treo − lượt probe-true
tức thì trên cùng file) và assert trong cửa sổ [850, 2500) ms. Ở lượt
hồi quy đầu (máy tải nặng, loadavg ~6–8 do các luồng đợt 59 chạy song
song), lượt đo cho chờ thêm **829 ms** — thấp hơn sàn 850 ms đúng
21 ms (tổng 1202 ms, baseline 373 ms) → đỏ 1 test. O6 LIMITS §6.5
đã ghi rõ cửa sổ này có nhiễu ±100 ms do trừ baseline 2 lượt chạy.
Không sửa test O6 (không phải file của luồng này, và cửa sổ lỏng là
có chủ đích); chạy lại 2 lượt đều 18/18. Đợt sau nếu thấy flake này
lặp lại thì xem lại sàn 850 ms, không siết cửa sổ một cách ngây thơ.

### 4.2 Hai lần probe headed hỏng trước khi đo được (ghi rõ quy trình)

- Lần 1: probe không trả kết quả sau 180 s (NOT-MEASURED) — 5 lần
  decode/mẫu quá chậm dưới tải (loadavg 8,79 lúc bắt đầu; renderer
  vẫn đang decode 8K khi runner hết giờ, không phải treo). Sửa: giảm
  xuống 3 lần/mẫu (trực tiếp) + 2 lần/mẫu (trial), nới poll lên 300 s.
- Lần 2: lỗi ngay `crypto.getRandomValues` giới hạn 65536 byte/lần
  gọi — code probe cũ gọi 1 lần cho 12 MiB rác. Sửa: điền theo lát
  65536 byte. Lần 3 thành công (§2).

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/gopRangeFetch39T3.ts` — hằng cap 8 MiB → 32 MiB
  + `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES` tự suy ra 16 → 64; cập
  nhật comment header (đợt 57 N10 + đợt 59 P6), comment cap/chunk/
  giới hạn fetch/stream-mode (lý do chọn 32 MiB, đỉnh heap, không
  tải toàn bộ file, timeout trần giữ nguyên). Không đổi
  `fetchSampleRemainderChunked`, `runTrialDecode`, probe, fail-open,
  logic gate, prefix, tail-scan, AVCC, mdat, chunk, all-mode,
  validateSampleTimestamps.
- `apps/web/src/lib/gopTrialDecode55L8.ts` — chỉ đổi comment header
  + comment timeout (cap 8 MiB → 32 MiB; trần chạm từ ~7,7 MiB;
  keyframe thật ≳16 MiB vẫn có thể timeout → fail-open). Không đổi
  code (probe/timeout/công thức giữ nguyên).

ĐỔI (test, theo hợp đồng mới — tiền lệ N10 đổi 1 test M10):

- `apps/web/src/lib/gopTrialDecode57N10.test.ts` — hợp đồng cap mới:
  hằng cap 32 MiB, hằng 64 chunk, unit vượt giới hạn 64 chunk, test
  biên đúng cap 32 MiB (65 request), cap+1 (33.554.433), 40 MiB;
  `avccPatternBytes` thêm nhánh đuôi 1–4 byte (marker phụ thuộc vị
  trí) để dựng được đúng cap; cập nhật ghi chú header + tên test.
  Không đổi hành vi test nào khác; N10 vẫn 17/17.
- `apps/web/src/lib/gopTrialDecode56M10.test.ts` — **1 test đổi mẫu
  theo hợp đồng mới**: "(b-t3) sample 0 = 9 MiB (> cap 8 MiB)" →
  40 MiB (> cap 32 MiB) để giữ đúng ý nghĩa "trên cap → bỏ qua"
  (9 MiB giờ nằm TRONG cap, đã có test P6 riêng); + ghi chú header.
  Không đổi hành vi test nào khác; M10 vẫn 28/28.
- `apps/web/src/lib/gopTrialDecode55L8.test.ts` — chỉ đổi số cap
  trong tên/ghi chú/log của 1 test 300 KiB ("≤ cap 8 MiB" → "≤ cap
  32 MiB"); L8 vẫn 23/23.
- `apps/web/src/lib/gopTrialDecode58O6.test.ts` — chỉ đổi 1 dòng ghi
  chú header ("sample > 8 MiB vẫn bỏ qua" → "> 32 MiB"); O6 vẫn
  18/18 (sau 2 lượt chạy lại, xem §4.1).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền
  lệ J6/K8/L8/M10/N10/O6).

MỚI:

- `apps/web/src/lib/gopTrialDecode59P6.test.ts` — 16 test (§3).
- `docs/PHASE9_ROUND59_P6_LARGE_SAMPLE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file production khác, `mp4Demux.ts`, `preview.tsx`,
`store.ts`, `reverseWebcodecs.ts`, `vi.json`/`en.json` (không có
chuỗi UI mới — không cần fragment i18n). Scratch + log ở
`~/scratch-round59-p6/` (probe headed ×3 + runner, regression,
red-before, build; file MP4 lớn chỉ làm fixture đo, KHÔNG đưa vào
batch).

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Keyframe thật ≳16 MiB vẫn timeout → fail-open** (§1.3, §2.3):
   trần 2500 ms là chặn cứng có chủ đích; keyframe 19,7 MiB decode
   ~2,85 s, 30,7 MiB ~5,09 s (đo thật, máy tải) nên không bao giờ
   có verdict decode-ok trong trần này. Muốn chặn chắc lớp này cần
   decode ở worker nền (M10 §8.4 — chưa làm) hoặc tăng trần (đổi
   hành vi đường mở file: kẹt main thread tới ~5 s — cần quyết của
   parent, không tự ý đổi trong luồng này).
2. **Sample > 32 MiB ở stream-mode vẫn bỏ qua** (thiết kế, fail-open):
   biên mới; all-mode vẫn chặn được vì GOP 0 đã fetch đủ range.
   Keyframe > 32 MiB thực tế chỉ gặp ở 8K lossless/bitrate cực cao.
3. **Keyframe thật bị đục lỗ giữa vẫn decode OK** (O6 §6.1, nợ của
   luồng khác — KHÔNG đụng): trial-decode không bắt được lớp này;
   cần kiểm khác (hash/checksum sample hoặc decode + so pixel).
4. **Chưa đo Safari/Firefox thật** (không có trên VM); decoder
   Chromium là căn cứ duy nhất cho §2. Tốc độ decode trên máy yếu
   hơn / decoder phần cứng khác có thể chậm hơn — hệ số 2× của O6
   là headroom, không phải bảo đảm tuyệt đối; dưới tải nặng (loadavg
   ~6–8) decode chậm ~2× so với máy yên, keyframe 9,7 MiB đã sát
   trần (decode-ok 1837–2035 ms so với trần 2500 ms).
5. **Decode ở worker nền chưa làm** (M10 §8.4, O6 §6.4): trial-decode
   vẫn chạy trên main thread của đường mở file; timeout 2,5 s là
   chặn cứng nhưng 2,5 s kẹt UI khi mở file có keyframe khổng lồ vẫn
   là chi phí thật với người dùng.
6. **T3 vẫn fetch remainder cả khi probe null** (N10 §6.2, không đụng
   trong luồng này): caller tắt trial-decode vẫn trả phí fetch
   chunked (tới 32 MiB ở cap mới — phí lớn hơn trước, cần đợt sau
   cân nhắc bỏ qua fetch khi `trialProbe === null`).
7. **Cửa sổ assert thời gian của test O6 sample 3 MiB khá sát sàn**
   ([850, 2500) ms cho thời gian chờ): đã flake 1 lần dưới tải (§4.1).
   Giá trị timeout 1003 ms được khóa chắc bằng unit test helper +
   test P6 (probe treo 12 MiB chờ ~2500 ms), không chỉ bằng test O6
   này.
8. **Nợ cũ giữ nguyên (không đụng trong luồng này):** `.github/
   workflows/ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có
   CI chạy thật); các nợ M10 §8, N10 §6.2–§6.6 (trừ §6.3 đã đóng ở
   đây), O6 §6.1–§6.6 (trừ §6.2 đã đóng ở đây) giữ nguyên.
