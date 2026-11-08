# Phase 9 — Đợt 60, luồng Q5: GOP trial-decode sample > 32 MiB + T3 không fetch remainder khi probe null (đóng nợ đợt 59 §6.6 + đợt 57 N10 §6.2)

Ngày: 08/11/2026 (lượt cron 00:35 +07). Đóng nợ 2 của đợt 59
(LIMITS P6 §6): (a) sample > 32 MiB ở stream-mode vẫn bỏ qua,
(b) T3 vẫn fetch remainder cả khi probe null (N10 §6.2). KHÔNG push,
KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới đây đều
đo/chạy thật; chỗ chưa đo được hoặc chưa giải thích được thì ghi rõ,
không mạo nhận. Giờ trong file này là +07 (log máy ghi UTC, đã cộng
7 giờ).

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Cap trial-decode stream-mode NAY LÀ 64 MiB** (nâng từ 32 MiB,
   `MAX_TRIAL_DECODE_SAMPLE_BYTES`): sample 0 trong (32 MiB, 64 MiB]
   nay được fetch phần còn lại theo chunk 512 KiB (tối đa 128 chunk)
   rồi trial-decode đủ sample; sample > 64 MiB vẫn bỏ qua (fail-open).
   **KHÔNG tải toàn bộ file vào RAM một lần**: T3 chỉ fetch đúng range
   sample 0 (tiền tố + chunk remainder), đỉnh heap transient của T3
   ≈ sample (≤ 64 MiB) + 1 chunk 512 KiB — file (có thể hàng trăm MiB)
   không bao giờ được tải trọn.
2. **Nói thẳng phần chặn được THÊM là hẹp:** keyframe thật trong
   (32, 64] MiB vẫn timeout 2500 ms → fail-open (decode ~0,15 ms/KiB
   theo P6, hoặc ~0,5–0,8 ms/KiB theo lần đo này — cả hai đều ≫ trần
   cho 37–42 MB). Phần chặn được thêm thật sự chỉ là **rác lớn trong
   (32, 64] MiB**: rác 40 MiB ngẫu nhiên fail trong **85,6–92,1 ms**
   → false 2/2 (đo headed thật, §2). Đổi lại, file thật có keyframe
   37–42 MB nay tốn thêm phí mở: T3 stream hết **4,4–8,2 s**
   (fetch chunked + timeout 2,5 s) thay vì fail-open ngay như trước
   — đánh đổi đã cân nhắc, ghi rõ ở §1.3.
3. **(b) Probe null thì KHÔNG fetch remainder nữa** (đóng nợ N10
   §6.2): `runTrialDecode(null)` trả pass ngay không decode nên fetch
   remainder trước đây là phí thuần. Đo thật: sample 12 MiB + probe
   null: **24 → 1 request sample, 12.000.000 → 262.144 byte**
   (tiết kiệm 23 request / 11.737.856 byte); sample 40 MiB + probe
   null: 1 request / 262.144 byte (dưới cap mới mà không có fix này
   sẽ fetch 76 chunk = 39.737.856 byte). Headed sạch trên file
   42,5 MB: null **474,6 ms** (lần đầu) và **23,1 ms** (lần sau),
   đều 1 request / 262.144 byte. **Kiểm AVCC trên tiền tố KHÔNG bị
   ảnh hưởng**: sample AVCC-rác + probe null vẫn fallback /AVCC/
   (test Q5 khóa).
4. **(c) Keyframe đục lỗ — KHÔNG đóng được bằng cách rẻ, nhưng đã đo
   rõ hơn:** zero 1 MiB giữa keyframe 9,7 MB → decode **FALSE 2/2**,
   37,2 MB → **FALSE 1/1** (lần này trial-decode BẮT được); nhưng O6
   đo zero 1 MiB giữa keyframe 4,1 MB → decode OK 5/5. Walk NAL
   chứng minh cả 3 file đều có đúng 2 NAL (SPS/PPS + 1 slice NAL
   duy nhất), chain length-prefix **khớp chính xác cả sau khi đục
   lỗ** — lỗ nằm trong payload slice, không chạm prefix. Kết luận:
   trial-decode bắt lỗ hay không là **phụ thuộc nội dung** (CABAC
   desync lúc được conceal lúc lỗi cứng), KHÔNG có quy luật chắc;
   kiểm chain NAL cũng VÔ DỤNG với lớp này (chain vẫn exact) nên
   KHÔNG làm thêm kiểm đó. Bắt chắc lớp này cần so pixel với mẫu
   tham chiếu hoặc checksum lúc import — ngoài phạm vi T3 (xem §6.3).
5. **Test Node mới 15/15** (đỏ-trước 8/15 — đúng 7 test hành vi mới
   fail). **Hồi quy GOP: 30/31 suite xanh ở lượt chạy chính** (O6
   15/18 dưới tải nặng — flake thời gian đã biết, xem §4); chạy lẻ
   sau đó O6 18/18 hai lần. **tsc web + desktop: 0 lỗi. vite build
   pass** 18,90 s (chỉ cảnh báo chunk > 500 kB có sẵn).

## 1. Thiết kế

### 1.1 Cap 64 MiB — căn cứ đo thật

Keyframe thật đo được (headed, §2; P6 đo trước):

| File | Codec | s0 (byte) | Decode trực tiếp |
|---|---|---|---|
| bigkey-4k-noisy60-crf12.mp4 (4K nhiễu mạnh) | avc1.640033 | 9.683.047 | ~6,9 s (lần này, tải nặng — P6: 1,9 s) |
| bigkey-8k-noisy60-crf12.mp4 (8K nhiễu mạnh) | avc1.64003C | 30.727.296 | ~12,9 s (lần này — P6: 5,1 s) |
| bigkey-8k-noisy80-crf8.mp4 (8K, MỚI đợt này) | avc1.64003C | 37.168.458 | ~20,7 s |
| bigkey-8k-noisy100-crf6.mp4 (8K, MỚI đợt này) | avc1.64003C | 42.493.646 | ~27,9–34,6 s |

64 MiB ≈ 2× keyframe thật lớn nhất đo được (42,5 MB) và gấp ~1,5×
keyframe 8K nhiễu mạnh nhất của P6 (30,7 MB). Cap chặn kẻ giả khai
sample đầu khổng lồ để ép fetch: tối đa 64 MiB qua ≤ 128 request
512 KiB. Timeout trần 2500 ms chặn cứng chi phí decode bất kể cap.

### 1.2 Vì sao KHÔNG decode streaming, vì sao KHÔNG kiểm chain NAL

- **Không decode streaming** — lý do như P6 §1.2, nhắc lại để đợt
  sau khỏi thử lại: VideoDecoder chỉ nhận `EncodedVideoChunk` TRỌN
  1 access unit; "theo từng đoạn" ở đây là CHUNKED FETCH, rồi decode
  1 lần trên sample đã ráp đủ.
- **Không kiểm chain NAL** (đã cân nhắc cho (c) rồi LOẠI bằng đo
  thật, xem §3): walk length-prefix trên cả 3 file đục lỗ cho thấy
  chain **khớp chính xác cả sau khi đục lỗ** (2 NAL/file, lỗ nằm
  trong payload slice duy nhất, không chạm prefix). Kiểm chain chỉ
  bắt được lỗ rơi đúng vào 4 byte length-prefix — trường hợp hiếm,
  và chính trường hợp đó decoder cũng đã lỗi (trial-decode bắt được
  rồi). Thêm kiểm chain không bắt thêm ca nào mà trial-decode bỏ
  lọt, chỉ thêm code + rủi ro false-positive trên file lạ (vd sample
  có trailing byte không chuẩn) — không làm.

### 1.3 Timeout giữ nguyên — hệ quả phải đọc kèm (đánh đổi của đợt này)

- Công thức O6 không đổi: sample ≤ 256 KiB giữ timeout gốc 200 ms;
  phần vượt cộng 0,3 ms/KiB; trần 2500 ms. Sample ≥ ~7,7 MiB đều
  chạm trần.
- **Chi phí mới cho file thật keyframe lớn:** file 42,5 MB nay mở
  bằng T3 stream hết 4,4–8,2 s (fetch 82 request + timeout 2,5 s)
  thay vì fail-open gần như ngay như trước (khi 42,5 MB còn trên
  cap 32 MiB). Đây là phí thật, trả 1 lần khi mở file, để đổi lấy
  verdict thật cho rác lớn trong (32, 64] MiB. File thật có keyframe
  ≤ 32 MiB không đổi gì; file có keyframe trong (32, 64] MiB thực tế
  chỉ gặp ở 8K bitrate rất cao/lossless.
- Tốc độ decode đo được lần này ≈ **0,5–0,8 ms/KiB** (từ 30,7 MB lên
  42,5 MB, máy tải — xem §2.1), chậm hơn nhiều so với 0,15 ms/KiB
  của P6/O6; nguyên nhân chưa xác định được chắc (xem §6.5). Dù lấy
  tốc độ nào, keyframe 37 MB cũng decode ≫ 2,5 s (P6: ~5,4 s; lần
  này: ~20 s) nên kết luận "keyframe thật ≳16 MiB timeout →
  fail-open" đứng vững cả hai chiều.

### 1.4 (b) Bỏ fetch remainder khi probe null — cơ chế + giới hạn

- `trialProbe === null` (caller tắt hẳn trial-decode, opt-out) thì
  T3 bỏ qua cả khối fetch remainder: `trialSample` giữ null, không
  gọi `runTrialDecode`. `runTrialDecode(null)` vốn trả pass ngay
  (`{passed:true, skipped:true, reason:"no-decoder"}` — xem
  gopTrialDecode55L8.ts) nên fetch trước đây là phí thuần, không
  ảnh hưởng verdict nào.
- **Không đụng kiểm AVCC:** tiền tố 256 KiB vẫn fetch và vẫn kiểm
  như cũ trước khi tới khối này — moov giả trỏ lệch vẫn bị chặn ở
  AVCC dù probe null (test Q5 khóa: sample toàn byte 0 + probe null
  → full-file /AVCC/).
- **Không đụng all-mode:** all-mode không dùng đường remainder (GOP 0
  đã fetch đủ range); probe null ở all-mode chỉ khiến
  `runTrialDecode(null)` trả pass ngay như cũ (test Q5 khóa:
  all-mode + probe null + 12 MiB → gop-range, 0 request sample).
- Lưu ý: `trialDecodeProbe === undefined` (mặc định) ở Node cũng
  phân giải thành null (không có VideoDecoder) nên cũng được hưởng
  tiết kiệm này — đúng, vì Node vốn không trial-decode được.

### 1.5 Hằng số (đặt tên rõ ràng, có comment lý do trong code)

- `MAX_TRIAL_DECODE_SAMPLE_BYTES = 64 MiB` (nâng từ 32 MiB).
- `TRIAL_DECODE_SAMPLE_CHUNK_BYTES = 512 KiB` (không đổi).
- `MAX_TRIAL_DECODE_SAMPLE_CHUNK_FETCHES = 128` — suy ra từ công thức
  `ceil((64 MiB − 256 KiB) / 512 KiB) = ceil(127,5)` (không hard-code
  số rời); vòng fetch dừng bằng giới hạn này (phòng thủ).
- Timeout trial-decode giữ nguyên **200 ms gốc / trần 2500 ms** (O6).

## 2. Đo headed thật (Xvfb :189, Chromium headed, cổng 8921/9417, TMPDIR riêng)

Máy KHÔNG yên lúc đo: loadavg lúc bắt đầu lần 2 là **5,34**, lúc kết
thúc 5,50 — các luồng đợt 60 khác chạy song song. Mọi số thời gian
dưới đây phải đọc kèm bối cảnh tải đó. Lần 1 NOT-MEASURED sau 300 s
(loadavg 12,05 lúc bắt đầu — probe cũ quá nhiều lần lặp; lần 2 đã
giảm lần lặp + publish từng phần để timeout vẫn cứu được số đã đo).
Log: `headed-q5.log` (lần 1, NOT-MEASURED), `headed-q5b.log` (lần 2,
thành công), `headed-q5c.log` (probe tập trung Q5b, §2.4).

### 2.1 Sample tổng hợp (FFmpeg, chỉ dùng làm fixture đo, KHÔNG đưa binary vào batch)

- `bigkey-8k-noisy80-crf8.mp4` (testsrc2 7680×4320, 3 frame, noise
  alls=80, crf 8, threads 2, faststart; encode 26 s): s0 =
  **37.168.458** byte (~35,4 MiB).
- `bigkey-8k-noisy100-crf6.mp4` (testsrc2 8K, 3 frame, noise
  alls=100, crf 6, threads 2, faststart; encode ~40 s): s0 =
  **42.493.646** byte (~40,5 MiB).
- Script gen (text, không stage binary): `gen-bigkey.sh`,
  `gen-bigkey2.sh` ở `~/scratch-round60-q5/`.

### 2.2 Decode trực tiếp sample 0 thật (probe production, 2 lần/mẫu)

| File | s0 (byte) | Decode 2 lần (ms) | Verdict |
|---|---|---|---|
| bigkey-4k-noisy60 (4K nhiễu mạnh) | 9.683.047 | 7114,7 / 6777,6 | 2/2 true |
| bigkey-8k-noisy60 (8K nhiễu mạnh) | 30.727.296 | 13515,4 / 12279,9 | 2/2 true |
| bigkey-8k-noisy80 (8K, MỚI) | 37.168.458 | 20534,2 / 20770,0 | 2/2 true |
| bigkey-8k-noisy100 (8K, MỚI) | 42.493.646 | 34600,9 / 27913,0 | 2/2 true |

- **8K decode được thật** trên Chromium VM này (codec avc1.64003C,
  7680×4320): không gặp `unsupported-config` — probe trả true ở cả
  hai file mới.
- **Chậm hơn nhiều so với P6** (cùng file: 9,7 MB P6 median 1905 ms
  → lần này ~6,9 s; 30,7 MB P6 5090 ms → lần này ~12,9 s). Nguyên
  nhân chưa xác định chắc — có thể do host contention + probe lần
  này giữ ~120 MB sample trong RAM cùng lúc (xem §2.5 heap) + tải
  các luồng đợt 60 khác. Ghi rõ để đợt sau khỏi trích số này như
  tốc độ chuẩn; kết luận timeout (§2.3) không phụ thuộc vào chênh
  này (xem §1.3).
- **Rác 40 MiB ngẫu nhiên** (config avc1.64003C 8K): 92,1 / 85,6 ms
  — median **~89 ms, 2/2 false**. Chậm hơn rác 12 MiB của P6
  (6,9 ms) nhưng vẫn ≪ trần 2500 ms: rác lớn trong (32, 64] MiB nay
  có verdict thật thay vì bị bỏ qua — đó là phần chặn được thêm
  thật sự của đợt này.

### 2.3 runTrialDecode với timeout helper + T3 stream end-to-end (probe production)

- runTrialDecode (timeout helper = 2500 ms, 1 lần/mẫu):
  - 37.168.458 B → **timeout-2500ms, fail-open** (2501,1 ms — đúng
    trần, không vượt).
  - 42.493.646 B → **timeout-2500ms, fail-open** (2501,8 ms).
- T3 stream-mode (`fetchVideoTrackByGopRange`, `streamGops: true`,
  probe production mặc định):
  - File 42,5 MB → **gop-range trong 4396,8 ms, 82 request sample**
    (1 tiền tố + 81 chunk): chunk cuối `[42206106, 42494567]` —
    kết thúc đúng ở cuối sample 0 (922 + 42.493.646 − 1). Qua được
    nhờ timeout fail-open sau 2500 ms (fetch ~1,9 s + timeout 2,5 s).
  - File 42,5 MB + probe null (lần probe chính) → **gop-range trong
    19.818,3 ms (!), 1 request sample, 262.144 byte** — xem §2.4:
    đây là outlier chưa giải thích được, KHÔNG phải chi phí của
    đường null (đo sạch ở Q5b chỉ 23–475 ms).
  - File 9,7 MB + probe null → **gop-range trong 102 ms, 1 request
    sample, 262.144 byte**.

### 2.4 Probe tập trung Q5b — đo sạch đường probe-null (file 42,5 MB)

Thứ tự có chủ đích: null TRƯỚC (sạch), rồi probe, rồi null LẠI
(để kiểm tra giả thuyết "decoder nền sau timeout làm chậm lần gọi
sau"). Loadavg 6,74 lúc bắt đầu, 9,12 lúc kết thúc.

| Lần gọi | Kết quả | Thời gian | Sample requests | Sample bytes |
|---|---|---|---|---|
| null lần 1 (sạch) | gop-range | 474,6 ms | 1 | 262.144 |
| probe production | gop-range | 8198,1 ms | 82 | 42.493.646 |
| null lần 2 (sau probe) | gop-range | **23,1 ms** | 1 | 262.144 |

- Đường null sạch: **23–475 ms, 1 request, 262.144 byte** — tiết
  kiệm so với đường probe: 81 request / 42.231.502 byte không fetch
  trên file 42,5 MB; so với code cũ (cap 32 MiB, probe null vẫn
  fetch): trên file 12 MiB tiết kiệm 23 request / 11.737.856 byte
  (đo bằng test Node, §3).
- **Giả thuyết decoder-nền bị BÁC cho trường hợp này:** null lần 2
  chạy ngay sau lần probe timeout (decoder nền của lần đó vẫn đang
  decode dở 42 MB, ~28 s) mà vẫn chỉ mất 23,1 ms — một decoder nền
  không làm chậm đường null. Vậy outlier 19,8 s ở §2.3 xảy ra trong
  bối cảnh khác (trang probe chính khi đó giữ ~240 MB heap + 3 lần
  trial timeout 37–42 MB dồn lại + tải máy); nguyên nhân chính xác
  chưa xác định được — ghi rõ là outlier, không dùng làm số đại
  diện cho đường null. Bằng chứng đường null nhanh là 3 lần đo sạch
  (102 ms / 474,6 ms / 23,1 ms), không phải lần outlier đó.

### 2.5 Heap (performance.memory, chỉ số tham khảo — Chrome làm tròn)

- Đầu trang: 0,7 MB; sau khi fetch sample 42,5 MB: 155,3 MB; sau T3
  probe trên 42,5 MB: 213,6 MB; cuối probe: 242,2 MB.
- **Đọc đúng:** heap cuối bị chi phối bởi fixture probe giữ lại
  (4 sample 9,7+30,7+37,2+42,5 MB ≈ 120 MB + rác 40 MB + bản copy
  đục lỗ), KHÔNG phải transient của T3. Transient của riêng T3
  stream trên file 42,5 MB bị chặn bởi thiết kế: sample 42,5 MB + 1
  chunk 512 KiB + tiền tố/moov — không đo tách riêng được trong
  probe này vì heap chung trang; con số 213,6 MB KHÔNG được trích
  dẫn làm "heap của T3".

### 2.6 Keyframe đục lỗ (mục (c) — đo, không fix)

- Zero 1 MiB giữa sample (giữa ± 512 KiB) rồi decode trực tiếp:
  - 9,7 MB → **false 2/2** (10295,5 / 8736,2 ms — decode lâu hơn
    cả sample nguyên 6,9 s rồi mới lỗi).
  - 37,2 MB → **false 1/1** (6936,7 ms — lỗi nhanh hơn decode
    nguyên 20,7 s).
- Đối chiếu O6 §1.2: zero 1 MiB giữa (byte 1.000.000–1.999.999)
  keyframe 4,1 MB → decode **OK 5/5** (median 1381,4 ms).
- Walk NAL (script `nal-walk.py`, chạy thật trên cả 3 file): cả 3
  đều có đúng **2 NAL** (đầu ~685 byte SPS/PPS + 1 slice NAL duy
  nhất chiếm gần hết sample), chain length-prefix **khớp chính xác**
  cả sau khi đục lỗ; lỗ nằm trong payload slice, không chạm prefix
  nào. Kết luận: trial-decode bắt lỗ hay không là **phụ thuộc nội
  dung** (dòng CABAC desync lúc được conceal thành frame lỗi ẩn,
  lúc lỗi cứng) — không có quy luật chắc theo kích thước hay vị trí
  lỗ; kiểm chain NAL không giúp gì thêm (chain vẫn exact). Xem §6.3.

## 3. Test Node mới `gopTrialDecode60Q5.test.ts` — 15/15

### 3.1 Hằng số (4 test — khóa hợp đồng, đổi lén là đỏ)

- Cap = 64 MiB; chunk = 512 KiB; số lần fetch tối đa = 128 =
  ceil((64 MiB − 256 KiB) / 512 KiB) (assert cả giá trị lẫn công thức
  suy ra); timeout vẫn 200 ms.
- Timeout helper: 64 MiB → 2500 ms (trần, khóa thêm).

### 3.2 Unit `fetchSampleRemainderChunked` (1 test)

- Sample cần 129 chunk → throw `sample-chunk-limit` sau đúng 128
  request (giới hạn mới; P6 khóa 64 chunk ở cap cũ).

### 3.3 T3 thật qua server Range (7 test, builder MP4 sao từ P6)

- 40 MiB + probe-false → full-file /trial-decode/, probe nhận đủ
  40.000.000 byte đúng từng byte, **77 request sample** (1 + 76
  chunk), chunk cuối `[39583776, 40000031]` kết thúc đúng cuối
  sample 0.
- 40 MiB + probe-true → gop-range, probe 1 lần.
- **Probe null + 12 MiB → gop-range, CHỈ 1 request sample**
  (tiền tố `[32, 262175]`), 262.144 byte — tiết kiệm 23 request /
  11.737.856 byte so với code cũ (code cũ fetch 24 request).
- Probe null + 40 MiB → gop-range, 1 request sample (khóa: dưới
  cap mới cũng không fetch remainder khi probe null).
- Probe null + 300 KiB → gop-range, 1 request sample (tiền tố AVCC
  vẫn fetch — fix chỉ bỏ remainder, không tắt kiểm AVCC; code cũ
  fetch 2 request ở ca này nên test này cũng đỏ-trước).
- Probe null + sample AVCC-rác (toàn byte 0) → full-file /AVCC/
  (khóa: probe null KHÔNG tắt kiểm AVCC).
- All-mode probe null + 12 MiB → gop-range, 0 request sample
  (all-mode không đổi).

### 3.4 Đỏ-trước đã verify

Chạy suite mới TRƯỚC khi sửa production (chỉ có test + cập nhật
hợp đồng N10/P6/M10): **Q5 8/15** — đúng 7 test hành vi mới fail
(hằng cap, hằng 128 chunk, unit 128-chunk, 40 MiB ×2, probe-null
12 MiB, probe-null 300 KiB); **N10 13/17** — đúng 4 test fail
(hằng cap, hằng 128 chunk, unit 128-chunk, đúng cap 64 MiB);
**P6 12/16** — đúng 4 test fail (như N10); M10 28/28 (test 80 MiB
xanh cả trên code cũ vì cả 2 cap đều bỏ qua — khóa biên mới, không
phải đỏ-trước); L8 23/23 (chỉ đổi ghi chú). Sau khi sửa:
**Q5 15/15, N10 17/17, P6 16/16, M10 28/28, L8 23/23**.

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round60-q5/run-regression-q5.sh`,
  sao từ P6 + thêm dòng Q5): U2 20/20, T3 10/10, V2 16/16, W4 15/15,
  X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4 10/10,
  E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8 18/18,
  reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6
  11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
  structuredNotes32 12/12, errorDetail34Q4 35/35, L8 23/23, M10
  28/28, N10 17/17, N6 32/32, **O6 15/18 ở lượt hồi quy chính**,
  **P6 16/16, Q5 15/15**. Log `regression-q5.log`.
- **O6 15/18 là flake thời gian dưới tải, KHÔNG phải hồi quy do
  đợt này (xem §4.1).** Chạy lẻ sau đó: **18/18, 18/18, 17/18,
  17/18, 16/18** — các test đỏ đều là 2 test trừ-baseline đã biết
  (O6 §6.5, P6 §4.1). Đường code đợt này không chạm tới 2 test đó:
  sample 1000 B không fetch remainder (cả trước lẫn sau), probe
  treo là function (không phải null nên không vào nhánh mới),
  all-mode không đổi. Giá trị timeout 200 ms / 1003 ms được khóa
  chắc bằng unit test helper + test probe-treo P6 (xanh), không chỉ
  bằng 2 test O6 này.
- Headed (Xvfb :189, TMPDIR riêng): §2. Log `headed-q5.log`,
  `headed-q5b.log`, `headed-q5c.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**;
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
- `vite build` (chạy từ `apps/web`, outDir scratch
  `~/scratch-round60-q5/build`): **pass** trong 18,90 s; chỉ cảnh báo
  chunk > 500 kB có sẵn.
- Lưu ý: các luồng đợt 60 khác chạy song song — file `tsconfig.json`
  có thể được họ thêm dòng exclude của họ sau thời điểm luồng này
  kiểm tra; luồng này chỉ thêm đúng 1 dòng của mình
  (`gopTrialDecode60Q5.test.ts`), không đụng file của họ.
  `vi.json`/`en.json` KHÔNG đụng (luồng này không thêm chuỗi UI nào
  nên không cần fragment i18n).

### 4.1 O6 flake — chi tiết trung thực

- Lượt hồi quy chính (loadavg ~13): O6 15/18 — 3 test thời gian đỏ.
- Chạy lẻ sau đó (loadavg 4–6): 18/18, 18/18, 17/18, 17/18, 16/18.
  Lần đo chi tiết 1 test: sample nhỏ + probe treo "chờ thêm −7 ms
  (tổng 392 ms, baseline 399 ms)" — lượt baseline chạy chậm hơn cả
  lượt probe-treo; lần khác: 3 MiB + probe treo "chờ thêm 732 ms
  (tổng 1814 ms, baseline 1082 ms)" — baseline 1082 ms (bình thường
  ~300–600 ms) làm phép trừ hụt ~270 ms so với sàn 850 ms. Cả hai
  đều là nhiễu trừ-baseline 2 lượt chạy dưới tải, đúng mẫu P6 §4.1
  ghi (829 ms so với sàn 850 ms). Không sửa test O6 (không phải file
  của luồng này, và cửa sổ lỏng là có chủ đích); đợt sau nếu thấy
  flake này lặp lại thì xem lại cách đo (vd đo timeout trực tiếp
  thay vì trừ baseline), không siết cửa sổ một cách ngây thơ.

### 4.2 Hai lần probe headed hỏng/chậm trước khi đo được (ghi rõ quy trình)

- Lần 1: probe không trả kết quả sau 300 s (NOT-MEASURED) — quá
  nhiều lần decode/mẫu lớn dưới tải (loadavg 12,05 lúc bắt đầu).
  Sửa: giảm lần lặp (direct 2 lần/mẫu, trial 1 lần/mẫu, đục lỗ
  2+1 lần), publish kết quả từng phần (`window.__q5Partial`) để
  timeout vẫn cứu được số đã đo, nới poll lên 450 s.
- Lần 2 thành công (§2). Probe tập trung Q5b (§2.4) chạy riêng sau
  đó, 19 s.

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/gopRangeFetch39T3.ts` — hằng cap 32 MiB → 64 MiB
  (giới hạn chunk tự suy ra 64 → 128); stream-mode: KHÔNG fetch
  remainder khi `trialProbe === null` (đóng nợ N10 §6.2); cập nhật
  comment header bước 5, comment cap/chunk/giới hạn fetch, comment
  khối trial-decode stream-mode (lý do chọn 64 MiB, đánh đổi phí mở
  file thật, probe-null). Không đổi `fetchSampleRemainderChunked`,
  `runTrialDecode`, probe, fail-open, logic gate, prefix, tail-scan,
  AVCC, mdat, chunk, all-mode, validateSampleTimestamps.
- `apps/web/src/lib/gopTrialDecode55L8.ts` — chỉ đổi comment header +
  comment timeout (cap 32 MiB → 64 MiB; probe null thì T3 không fetch
  remainder). Không đổi code (probe/timeout/công thức giữ nguyên).

ĐỔI (test, theo hợp đồng mới — tiền lệ P6 đổi test N10/M10):

- `apps/web/src/lib/gopTrialDecode57N10.test.ts` — hợp đồng cap mới:
  hằng cap 64 MiB, hằng 128 chunk, unit vượt giới hạn 128 chunk,
  test biên đúng cap 64 MiB (129 request, sampleCount=1 để nhẹ RAM),
  cap+1 (67.108.865), 80 MiB; cập nhật ghi chú header. Không đổi hành
  vi test nào khác; N10 vẫn 17/17.
- `apps/web/src/lib/gopTrialDecode59P6.test.ts` — như N10 (hằng cap/
  chunk, unit 128-chunk, timeout thêm 64 MiB, biên đúng cap 64 MiB,
  cap+1, 80 MiB, sampleCount=1 ở 2 test biên để nhẹ RAM); P6 vẫn
  16/16.
- `apps/web/src/lib/gopTrialDecode56M10.test.ts` — **1 test đổi mẫu
  theo hợp đồng mới**: "(b-t3) sample 0 = 40 MiB (> cap 32 MiB)" →
  80 MiB (> cap 64 MiB), sampleCount 2 → 1 để nhẹ RAM; + ghi chú
  header. Không đổi hành vi test nào khác; M10 vẫn 28/28.
- `apps/web/src/lib/gopTrialDecode55L8.test.ts` — chỉ đổi số cap
  trong tên/ghi chú/log của 1 test 300 KiB ("≤ cap 32 MiB" →
  "≤ cap 64 MiB"); L8 vẫn 23/23.
- `apps/web/src/lib/gopTrialDecode58O6.test.ts` — chỉ đổi ghi chú
  header (thêm đợt 60 Q5 nâng cap lên 64 MiB); O6 18/18 ở 2 lượt
  chạy lẻ (flake thời gian ở các lượt khác, xem §4.1).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền
  lệ J6/K8/L8/M10/N10/O6/P6).

MỚI:

- `apps/web/src/lib/gopTrialDecode60Q5.test.ts` — 15 test (§3).
- `docs/PHASE9_ROUND60_Q5_GOP_LARGE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file production khác, `mp4Demux.ts`, `preview.tsx`,
`store.ts`, `reverseWebcodecs.ts`, `vi.json`/`en.json` (không có
chuỗi UI mới — không cần fragment i18n). Scratch + log ở
`~/scratch-round60-q5/` (probe headed ×3 + runner, regression,
red-before, build; file MP4 lớn chỉ làm fixture đo, KHÔNG đưa vào
batch).

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Keyframe thật ≳16 MiB vẫn timeout → fail-open** (§1.3, §2.3):
   trần 2500 ms là chặn cứng có chủ đích; keyframe 37,2 MB decode
   ~20 s (lần này) nên không bao giờ có verdict decode-ok trong
   trần này. Muốn chặn chắc lớp này cần decode ở worker nền (M10
   §8.4 — chưa làm) hoặc tăng trần (đổi hành vi đường mở file: kẹt
   main thread tới ~5–30 s — cần quyết của parent, không tự ý đổi
   trong luồng này).
2. **Sample > 64 MiB ở stream-mode vẫn bỏ qua** (thiết kế, fail-open):
   biên mới; all-mode vẫn chặn được vì GOP 0 đã fetch đủ range.
   Keyframe > 64 MiB thực tế chỉ gặp ở 8K lossless/bitrate cực cao.
3. **Keyframe thật bị đục lỗ giữa KHÔNG bắt chắc được** (§2.6, O6
   §6.1 — nợ này KHÔNG đóng, chỉ đo rõ hơn): trial-decode bắt được
   3/3 ca lần này nhưng bỏ lọt 5/5 ca của O6 — phụ thuộc nội dung
   (CABAC desync), không có quy luật chắc; kiểm chain NAL đã chứng
   minh vô dụng (chain vẫn exact sau khi đục lỗ). Bắt chắc cần so
   pixel với mẫu tham chiếu hoặc checksum lưu lúc import/encode —
   T3 không có nguồn tham chiếu nào nên ngoài phạm vi luồng này.
4. **Decode timeout vẫn chạy nền sau khi timeout thắng race**
   (ghi trong `runTrialDecode` từ trước, lần này đo được độ lớn):
   probe của sample 42 MB vẫn decode dở ~28 s sau khi timeout
   2500 ms đã trả fail-open; decoder chỉ close khi flush xong
   (đóng muộn). Dưới trạng thái trang nặng (heap ~240 MB + 3 lần
   trial timeout dồn lại), một lần gọi T3 null sau đó đo được
   19,8 s (outlier §2.3–§2.4, nguyên nhân chưa xác định chắc) —
   cần đợt sau theo dõi xem có lặp lại không; các lần đo sạch đều
   23–475 ms.
5. **Tốc độ decode lần này chậm hơn nhiều so với P6** (§2.2): cùng
   file 9,7 MB: ~6,9 s so với median 1905 ms của P6; 30,7 MB:
   ~12,9 s so với 5090 ms. Nguyên nhân chưa xác định chắc (host
   contention và/hoặc probe giữ ~120 MB sample trong RAM). Mọi kết
   luận về timeout đều đứng vững ở cả hai tốc độ, nhưng đừng trích
   số decode tuyệt đối lần này như tốc độ chuẩn của máy.
6. **Chưa đo Safari/Firefox thật** (không có trên VM); decoder
   Chromium là căn cứ duy nhất cho §2. Tốc độ decode trên máy yếu
   hơn / decoder phần cứng khác có thể chậm hơn — hệ số 2× của O6
   là headroom, không phải bảo đảm tuyệt đối.
7. **Decode ở worker nền chưa làm** (M10 §8.4, O6 §6.4): trial-decode
   vẫn chạy trên main thread của đường mở file; timeout 2,5 s là
   chặn cứng nhưng 2,5 s kẹt UI khi mở file có keyframe khổng lồ vẫn
   là chi phí thật với người dùng — và §6.4 cho thấy decoder nền
   còn chạy tiếp sau timeout.
8. **Cửa sổ assert thời gian của test O6 sample 3 MiB khá sát sàn**
   ([850, 2500) ms cho thời gian chờ): đã flake nhiều lần dưới tải
   (§4.1). Giá trị timeout 1003 ms được khóa chắc bằng unit test
   helper + test P6 (probe treo 12 MiB chờ ~2500 ms), không chỉ bằng
   test O6 này.
9. **Nợ cũ giữ nguyên (không đụng trong luồng này):** `.github/
   workflows/ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có
   CI chạy thật); các nợ M10 §8, N10 §6 (trừ §6.2 đã đóng ở đây),
   O6 §6.1–§6.6 (trừ §6.2 đã đóng ở P6), P6 §6 (trừ §6.6 đã đóng
   ở đây) giữ nguyên.
