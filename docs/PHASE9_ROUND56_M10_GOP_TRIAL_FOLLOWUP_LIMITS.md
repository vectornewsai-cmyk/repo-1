# Phase 9 — Đợt 56, luồng M10: đóng 3 nợ L8 của trial-decode GOP

Ngày: 07/11/2026 (lượt cron 12:35 +07). Đóng 3 nợ ở
`docs/PHASE9_ROUND55_L8_GOP_TRIAL_DECODE_LIMITS.md` §6 (1–3) +
đo lại chi phí trial-decode trên máy yên (nợ §6.4).
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới
đây đều đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **(a) Moov giả sửa timestamp (stts) — ĐÃ BẮT ĐƯỢC PHẦN LỚN, CÓ ĐO
   THẬT.** Lớp kiểm mới `validateSampleTimestamps` (mp4Demux.ts) đối
   chiếu stts với mdhd/mvhd + hình dạng delta, T3 fallback full-file
   lý do `timestamp stts bất thường (...)` (chỉ fallback, không ném
   lỗi — giữ fail-open). File stts-giả dựng từ fixture thật (chỉ sửa
   delta stts 512 → 256, moov còn lại nguyên 100%): T3 stream headed
   fallback đúng, file thật vẫn gop-range. Ngưỡng hiệu chuẩn từ 13
   file thật (mdhd lệch tối đa 1 frame, mvhd lệch tối đa 0,012s,
   max/median delta = 1,00). **Còn lọt (ghi rõ):** đổi tỉ lệ đều toàn
   bộ stts + sửa khớp cả mdhd lẫn mvhd; hoán đổi delta giữ nguyên
   tổng. Trial-decode thêm sample giữa/cuối KHÔNG bắt được lớp này
   (byte thật nên decode vẫn OK — có test chứng minh) nên KHÔNG nối
   thêm trial-decode cho (a).
2. **(b) Sample 0 > 256 KiB ở stream-mode — ĐÃ XỬ LÝ BẰNG FETCH THÊM.**
   T3 fetch thêm đúng phần còn lại của sample 0 (1 request Range kind
   `"sample"`) khi 256 KiB < s0.size ≤ cap mới **2 MiB**, rồi
   trial-decode đủ sample; > 2 MiB vẫn bỏ qua (fail-open). Đo headed:
   keyframe 4K thật 300.148 byte decode OK median **68,1 ms**
   (5 lần 64,6–79,4 ms), keyframe lớn nhất 342.408 byte median
   **72,6 ms** — trong timeout 200 ms nhưng vượt ngân sách ~50 ms,
   nên sample ~2 MiB có thể chạm timeout và fail-open (hướng an toàn).
   Test Node chứng minh probe nhận đủ 300.000 byte, 2 request
   `"sample"`, probe-false chặn được; fetch phần còn lại lỗi (416) →
   bỏ qua trial-decode, gop-range.
3. **(c) False-positive profile lạ — KHÔNG CÓ FALSE-POSITIVE NÀO TRÊN
   CHROMIUM, GUARD ĐÃ NỐI + KIỂM CHỨNG HEADED.** Headed trên Chromium
   này: High 4:4:4 Predictive (avc1.F40028), High 10 (avc1.6E0028),
   High 4:2:2 (avc1.7A0028) đều `isConfigSupported = true` và decode
   sample 0 OK (8,0–8,7 ms) — decoder Chromium hỗ trợ cả ba, không
   chặn oan. Guard mới vẫn nối: probe trả thêm kết quả
   `"unsupported-config"` khi isConfigSupported báo không hỗ trợ hoặc
   lỗi configure/decode mang thông điệp unsupported → runTrialDecode
   fail-open (pass + skipped), T3 không chặn. Kiểm chứng headed bằng
   config chắc chắn không hỗ trợ (HEVC hvc1, avcC hỏng 4 byte 0):
   isConfigSupported=false → trial-decode fail-open đúng (1,1 ms /
   0,2 ms). Chưa đo Safari/Firefox (không có trên VM).
4. **Chi phí trial-decode đo lại trên máy yên — ĐẠT NGÂN SÁCH ~50 ms
   (trái với median 82,9 ms lúc máy tải nặng của L8).** Decode trực
   tiếp sample 0 thật 720p 7 lần: 62,3 / 21,2 / **14,2** / 8,6 / 9,1 /
   15,7 / 10,0 ms — **median 14,2 ms, p95 62,3 ms** (lần đầu 62,3 ms
   là warmup), khớp K8 máy yên 15,5 ms. Chênh T3 stream median có/không
   probe: **16,1 ms** (96,8 vs 80,7 ms) — lần này đo sạch, không bị
   nhiễu fetch áp đảo như L8. isConfigSupported chỉ tốn 0,1–0,2 ms.
5. **Test Node mới 28/28 (đỏ-trước: bản tạm 7/12 + vô hiệu nhánh
   18/28).** Hồi quy GOP: **27/27 suite xanh** (K8 18/18, L8 23/23,
   T3 10/10, I6 25/25, M10 28/28, …); demux Q2 8/8. tsc 0 lỗi; vite
   build pass 5,62 s.
6. **1 test L8 cũ đổi kỳ vọng theo hợp đồng mới (ghi rõ):** test
   "sample 0 lớn stream-mode: probe KHÔNG gọi" được viết lại thành
   "300 KiB ≤ cap 2 MiB → probe gọi 1 lần, probe-false chặn được"
   (xem §4). Hành vi bỏ qua vẫn giữ cho sample > 2 MiB (test mới M10).

## 1. (a) Moov giả sửa timestamp (stts)

### 1.1 Vì sao trial-decode thêm sample không bắt được lớp này

Kẻ giả sao chép y nguyên bảng sample thật, chỉ sửa stts: byte sample
là byte thật nên **mọi sample đều decode OK** — decode sample giữa hay
cuối cũng vậy. Test M10 `(a-t3) trial-decode sample giữa...` chứng minh:
sample 30 thật qua AVCC, `runTrialDecode` với probe-true trả pass.
Vì vậy KHÔNG nối thêm trial-decode cho (a); cách bắt đúng là đối chiếu
timestamp với các nguồn độc lập trong moov (mdhd/mvhd).

### 1.2 Hiệu chuẩn ngưỡng trên 13 file thật (đo thật, Node)

Script `measureDurations56M10.ts` (bundle esbuild + node, dùng demux
production + đọc trực tiếp mdhd/mvhd duration): 9 file render/demo
trong repo + fixture `trailing-real37.mp4` (72s, 2160 sample) +
3 file footage có audio (DoD/NASA, 60–76s).

| File | mdhd − stts | mvhd − video | delta max/median | zero delta |
|---|---|---|---|---|
| 7 file render/demo (5–10s) | 0 | 0,000s | 1,00 | 0 |
| keyframe-text/video.mp4 | **+512 unit (1 frame)** | 0,000s | 1,00 | 0 |
| trailing-real37.mp4 | 0 | 0,000s | 1,00 | 0 |
| clip-j/k/l (có audio) | 0 | **−0,008 / −0,012 / 0,000s** | 1,00 | 0 |

Từ đó chọn dung sai (ghi trong code + test khóa bằng đúng các số này):
- mdhd: `|durationUnits − mdhd| ≤ max(2 × medianDelta, 1% × durationUnits)`
  — bao phủ lệch 1 frame đo được (512 unit) với headroom 2×; kẻ giả
  sửa một nửa stts lệch 50% (30000/60000) vẫn lộ.
- mvhd: `|durationSec − mvhdSec| ≤ max(0,5s, 5% × durationSec)` —
  bao phủ audio dài hơn video 0,012s đo được với headroom ~40×; chỉ
  bắt lệch thô.
- delta: `delta ≤ 0` → fail; `max > 50 × median VÀ max > 2s` → fail —
  đo thật max/median = 1,00 trên mọi file nên ngưỡng 50× rất an toàn
  với footage VFR thật; dùng **median** (không phải mean) vì 1 delta
  khổng lồ sẽ kéo mean lên và làm tỉ lệ max/mean tụt (vd 1 delta
  100s giữa 59 frame 1s: max/mean = 37,7× nhưng max/median = 100×).
- maxPresEnd vượt durationUnits đúng 2 frame (1024 unit) trên mọi
  file có B-frame — là reorder delay bình thường nên KHÔNG dùng làm
  kiểm tra (đo được, ghi để đợt sau khỏi thử lại).
- Phát hiện phụ (không thuộc phạm vi luồng, chỉ ghi nhận): 3 file
  footage có audio cho `maxPresEnd ≈ 2^32` — ctts v1 offset âm được
  cộng thành presentation timestamp rất lớn (demux Q2); không đụng
  trong luồng này vì kiểm timestamp không dùng presentationTimestamp.

### 1.3 Thiết kế (mp4Demux.ts + T3)

- Demux parse thêm `mdhdDuration` (v0 +16 u32, v1 +24 u64) và
  `mvhdDuration` (cùng layout), expose trên `Mp4VideoTrack` dạng
  optional `number | null` (theo tiền lệ K8 `cttsTotal`/`stssOutOfRange`
  — không phá code khác dựng track). Không đủ byte → null → lớp kiểm
  bỏ qua phần đó (fail-open).
- `validateSampleTimestamps(track)` — hàm thuần, chạy được ở Node:
  3 đối chiếu §1.2, trả `{ok, reason}`; track rỗng → ok (T3 tự xử lý
  rỗng ở nơi khác). Sắp xếp bản sao durations để lấy median: file
  ≤ vài nghìn sample thì không đáng kể; file 1M sample tốn ~100 ms
  một lần khi mở — chấp nhận được trên đường mở file vốn 400–2000 ms,
  ghi rõ để đợt sau cân nhắc tối ưu nếu cần.
- T3 nối SAU lớp K8 (ctts/stss) và TRƯỚC khi chia mode — áp cả 2
  mode, không cần fetch thêm byte nào, không cần VideoDecoder:
  `demux-moov: timestamp stts bất thường (<reason> — moov giả?)`.
  Chỉ fallback, không ném lỗi.

### 1.4 Đo headed thật (Xvfb :171, Chromium headed, cổng 8903/9399)

File `fake-stts-56m10.mp4`: dựng từ fixture thật bằng patch byte
(stts entry duy nhất [2160, 512] → [2160, 256]; mdhd/mvhd và mọi byte
khác nguyên vẹn; sha `2376649d…` → `1f1e245e…`). T3 stream-mode probe
mặc định (VideoDecoder thật):
- File stts-giả: **full-file** `demux-moov: timestamp stts bất thường
  (stts tổng 552960 lệch mdhd 1105920 quá dung sai 5530 — moov giả?)`
  trong 131,5 ms — **CHẶN ĐÚNG**.
- File thật: **gop-range** trong 75,7 ms — không chặn oan.
Log: `headed-m10.log`.

### 1.5 Còn lọt (trung thực, không mạo nhận)

- Đổi tỉ lệ đều TOÀN BỘ stts rồi sửa khớp cả mdhd lẫn mvhd: mọi đối
  chiếu nội bộ đều khớp → vẫn lọt (test M10 ghi rõ là "NỢ CÒN LẠI",
  assert gop-range để khóa hành vi hiện tại, không giả vờ chặn được).
  Bắt được lớp này cần ground-truth fps độc lập (vd timing VUI trong
  SPS: `time_scale / (2 × num_units_in_tick)`) — parse SPS VUI là
  việc của đợt sau.
- Hoán đổi delta giữa các sample mà giữ nguyên tổng (vd VFR
  [[30,500],[30,1500]] → [[30,1500],[30,500]]): tổng, max, median
  đều không đổi → vẫn lọt (test M10 ghi rõ tương tự).
- Sửa 1 delta trong dung sai (~1 frame): tổng lệch ≤ dung sai mdhd
  nên lọt — chấp nhận được vì sai lệch 1 frame không đổi hành vi
  phát/tìm kiếm đáng kể; dung sai hẹp hơn sẽ chặn oan file thật
  (keyframe-video đã lệch 1 frame).

## 2. (b) Sample 0 lớn ở stream-mode

### 2.1 Thiết kế (gopRangeFetch39T3.ts)

- Hằng mới `MAX_TRIAL_DECODE_SAMPLE_BYTES = 2 MiB`.
- Stream-mode: `s0.size ≤ 256 KiB` → dùng `firstSample` như cũ;
  `256 KiB < s0.size ≤ 2 MiB` → fetch thêm đúng phần còn lại
  `[s0.offset+262144, s0.offset+s0.size-1]` (1 request Range kind
  `"sample"`), nối thành đủ sample rồi trial-decode; `s0.size > 2 MiB`
  → bỏ qua như cũ (fail-open). Fetch phần còn lại lỗi → bỏ qua
  trial-decode (fail-open): AVCC trên tiền tố đã qua, phần còn lại
  chỉ phục vụ probe — khác với fetch sample đầu của J6 (lỗi → fallback
  vì chưa có gì để kiểm AVCC).
- All-mode không đổi (GOP 0 đã fetch đủ range nên luôn đủ sample).
- Lý do chọn 2 MiB: keyframe thật đo được 720p ~30 KiB, 1080p
  ~100 KiB, 4K ~300–350 KiB (xem §2.2) — 2 MiB gấp ~6× keyframe 4K
  lớn nhất; timeout 200 ms chặn cứng chi phí decode bất kể cap; cap
  chặn kẻ giả khai sample đầu khổng lồ để ép fetch.

### 2.2 Đo headed thật — chi phí decode sample lớn

File `bigkey-4k.mp4` (tự encode ffmpeg: testsrc2 3840×2160, crf 12,
2s): s0 = **300.148 byte** (> cap cũ 262.144), keyframe lớn nhất
342.408 byte. Probe production (VideoDecoder thật), 5 lần / 3 lần:
- s0 300.148 byte: 79,4 / 75,8 / 68,1 / 65,6 / 64,6 ms — **median
  68,1 ms**, cả 5 đều decode-ok.
- keyframe lớn nhất 342.408 byte: 72,5 / 84,9 / 72,6 ms — **median
  72,6 ms**, cả 3 đều decode-ok.
Nhận xét trung thực: decode 300 KiB tốn ~68 ms — gấp ~5× sample
29 KiB 720p (14,2 ms), trong timeout 200 ms nhưng vượt ngân sách
~50 ms. Chi phí decode tăng theo số pixel khung hình (4K ≈ 9× pixel
720p) nên sample ~2 MiB (vd 8K) có thể chạm timeout 200 ms và
fail-open — đó là hướng an toàn (cho qua thay vì kẹt/chặn oan),
không phải lỗi; bảo vệ với sample khổng lồ khi đó thực chất là
timeout, không phải cap.

### 2.3 Test Node (M10, §3)

- 300.000 byte stream-mode + probe-false → full-file /trial-decode/,
  probe gọi đúng 1 lần và nhận đủ 300.000 byte; requests có đúng 2
  entry kind `"sample"`: `[32,262175]` (tiền tố) + `[262176,300031]`
  (phần còn lại).
- 300.000 byte + probe-true → gop-range, probe 1 lần, đủ 300.000 byte.
- 3.000.000 byte (> 2 MiB) + probe-false → gop-range, probe 0 lần
  (giữ hành vi bỏ qua).
- Fetch phần còn lại trả 416 → gop-range, probe 0 lần (fail-open).

## 3. (c) False-positive profile lạ

### 3.1 Đo headed thật — Chromium KHÔNG từ chối profile nào

File tự encode ffmpeg (testsrc2 1280×720, 2s, faststart), decode
sample 0 bằng VideoDecoder thật:

| File | Codec | isConfigSupported | Decode thử | Probe production |
|---|---|---|---|---|
| baseline-high | avc1.640028 | true (0,2 ms) | OK 9,2 ms | decode-ok 6,9 ms |
| high444p | avc1.F40028 | true (0,1 ms) | OK 8,7 ms | decode-ok 12,6 ms |
| high10 | avc1.6E0028 | true (0,2 ms) | OK 8,3 ms | decode-ok 9,7 ms |
| high422p | avc1.7A0028 | true (0,1 ms) | OK 8,0 ms | decode-ok 8,5 ms |

Kết luận: trên Chromium này (Playwright chromium-1248) **không có
false-positive nào** — decoder hỗ trợ cả High 4:4:4 Predictive,
High 10 (10-bit) và High 4:2:2. Nợ "profile lạ" của L8 §6.1 vì vậy
không tái hiện được trên Chromium; guard dưới đây vẫn nối để bảo vệ
trên decoder khác (Safari/Firefox/hardware decoder có thể từ chối),
và đã kiểm chứng headed bằng config chắc chắn không hỗ trợ (§3.2).
Chưa đo Safari/Firefox thật — không có trên VM này.

### 3.2 Thiết kế guard (gopTrialDecode55L8.ts)

- Probe trả thêm kết quả `"unsupported-config"` (type mới
  `GopTrialDecodeProbeOutcome = boolean | "unsupported-config"` —
  probe boolean cũ vẫn tương thích).
- `createBrowserTrialDecodeProbe()`:
  - Hỏi `VideoDecoder.isConfigSupported(config)` TRƯỚC khi decode;
    `supported === false` → trả `"unsupported-config"` ngay.
    isConfigSupported vắng/lỗi → thử decode như cũ (không đoán).
  - Lỗi `configure()` hoặc lỗi decode mang thông điệp unsupported
    (hàm mới `isUnsupportedDecoderMessage`: khớp
    `/unsupported|not supported/i`) → `"unsupported-config"`;
    lỗi bitstream ("wasn't a key frame", "Unable to determine size
    of bitstream buffer", …) → `false` như cũ.
- `runTrialDecode`: `"unsupported-config"` → `{passed:true,
  skipped:true, reason:"unsupported-config: ..."}` (fail-open).
  T3 không đổi gì thêm — kết quả này chảy qua đường fail-open có sẵn.

### 3.3 Kiểm chứng headed nhánh "unsupported-config"

Probe lần 2 (Xvfb :172, cổng 8904/9400), config cố ý không hỗ trợ:

| Case | isConfigSupported | Trial-decode |
|---|---|---|
| HEVC `hvc1.1.6.L120.90` | **false** (1,0 ms) | **pass + skipped /unsupported-config/** (1,1 ms) |
| avc1 + avcC hỏng (4 byte 0) | **false** (0,0 ms) | **pass + skipped /unsupported-config/** (0,2 ms) |
| avc1 + avcC rỗng | true (0,1 ms) | decode-failed (3,2 ms) — đúng: config hỏng, không phải profile không hỗ trợ |
| VP9 `vp09.00.10.08` + sample H.264 | true (0,0 ms) | decode-failed (1,8 ms) — đúng: codec/sample lệch nhau |

Nhánh mới chạy thật trong trình duyệt, không chỉ ở Node mock.
Log: `headed-m10b.log`.

## 4. Đo lại chi phí trial-decode trên máy yên (đối chiếu L8 §2.4)

Giàn như L8 (Xvfb :171, Chromium headed, server Range riêng cổng
8903, fixture `trailing-real37.mp4` 38.996.431 byte) nhưng máy yên
hơn: loadavg lúc bắt đầu 1,91 (L8: ~3–7), lúc kết thúc 2,00. Fetch
39 MB mất 627 ms (L8 tải nặng: 3507–5120 ms; K8 máy yên: ~545 ms).

- Decode trực tiếp sample 0 thật 720p (29.245 byte), 7 lần, decoder
  mới mỗi lần: **62,3 / 21,2 / 14,2 / 8,6 / 9,1 / 15,7 / 10,0 ms —
  median 14,2 ms, p95 62,3 ms, cả 7 đều ok=true.** Lần đầu 62,3 ms là
  warmup. So với L8 median 82,9 ms (máy tải nặng) và K8 15,5 ms (máy
  yên): **số 82,9 ms của L8 là nhiễu tải, không phải chi phí thật.**
  Trên máy yên chi phí ≈ 14 ms — **ĐẠT ngân sách ~50 ms**.
- T3 stream xen kẽ có/không probe, 5 vòng: có probe 530,3 (warmup) /
  93,5 / 99,6 / 96,8 / 94,2 — median **96,8 ms**; không probe 110,5 /
  72,0 / 80,7 / 61,0 / 91,6 — median **80,7 ms**; chênh median
  **16,1 ms**. Cả 10 lần đều gop-range. Chênh này khớp trực tiếp
  decode median 14,2 ms + isConfigSupported 0,1–0,2 ms — lần này đo
  sạch, không bị nhiễu fetch/tail-scan áp đảo như L8 (chênh từng vòng
  L8 dao động ±200–1200 ms). Claim chi phí cập nhật: **~14–16 ms
  thêm vào đường mở file trên máy yên** (1 lần khi mở file, chặn bởi
  timeout 200 ms).
- isConfigSupported: 0,1–0,2 ms mỗi lần gọi (đo ở cả 4 profile) —
  overhead của guard (c) không đáng kể.

## 5. Test Node mới `gopTrialDecode56M10.test.ts` — 28/28

### 5.1 Unit `validateSampleTimestamps` (11 test)

- Nhất quán (stts==mdhd==mvhd, delta đều) → ok; mdhd dài hơn stts
  đúng 1 frame (512 unit, như file keyframe-video thật) → ok (trong
  dung sai); mdhd bằng một nửa stts → FAIL /mdhd/; mdhd null → ok.
- mvhd lệch 0,01s (audio dài hơn video, như file thật có audio) → ok;
  mvhd bằng một nửa video → FAIL /mvhd/; mvhd null → ok.
- 1 delta khổng lồ (100s giữa frame 1s, mdhd đã sửa khớp) → FAIL
  /delta/; delta 0 → FAIL /delta/; VFR thật (30×500ms + 30×1500ms)
  → ok (không chặn oan); track rỗng → ok.

### 5.2 Unit `runTrialDecode` + phân loại (c) (5 test)

- probe trả `"unsupported-config"` → pass + skipped
  /unsupported-config/; probe false vẫn FAIL /decode-failed/
  (không nhầm thành unsupported); `isUnsupportedDecoderMessage`
  phân loại đúng 6 thông điệp (3 unsupported → true, 3 bitstream →
  false, rỗng → false); `createBrowserTrialDecodeProbe()` trong Node
  vẫn null; timeout mặc định vẫn 200.

### 5.3 T3 thật qua server Range (12 test)

- (a): stts sửa một nửa + probe-true → full-file /timestamp/ cả 2
  mode; + probe null → vẫn full-file /timestamp/ (không cần decoder);
  1 delta khổng lồ + mdhd/mvhd sửa khớp → full-file /timestamp/;
  control nhất quán → gop-range cả 2 mode; 2 test "NỢ CÒN LẠI"
  (đổi tỉ lệ đều + sửa khớp mdhd/mvhd; hoán đổi delta VFR) assert
  gop-range để khóa giới hạn hiện tại; trial-decode sample giữa của
  file stts-giả vẫn PASS (chứng minh decode không bắt được lớp này).
- (b): 300.000 byte + probe-false → full-file /trial-decode/, probe
  nhận đủ 300.000 byte, 2 request `"sample"`; + probe-true →
  gop-range; 3.000.000 byte → gop-range, probe 0 lần; fetch phần còn
  lại lỗi 416 → gop-range, probe 0 lần.
- (c): probe `"unsupported-config"` → gop-range cả 2 mode.

### 5.4 Đỏ-trước đã verify (2 lớp)

1. **Trước khi sửa** (bản tạm chỉ gồm 12 test T3 dùng API hiện có,
   chạy trên code chưa sửa): **7/12** — đúng 5 test chặn fail
   (2 stts-giả, 1 delta khổng lồ, 2 sample-300KB), còn lại xanh
   (control, nợ-còn-lại, 3 MiB skip, 416 fail-open, unsupported).
2. **Sau khi sửa xong, tạm vô hiệu 4 nhánh chặn** (validateSampleTimestamps
   luôn ok; `if (!tsCheck.ok)` → false; `if (trialSample !== null)` →
   false; map `"unsupported-config"` → false), chạy lại M10 + L8 + K8:
   **M10 18/28** (đúng 10 test phụ thuộc hành vi mới fail: 4 unit-a,
   1 unit-c, 3 t3-a, 2 t3-b), **L8 19/23** (đúng 4 test trial-decode
   stream-mode fail), **K8 18/18** (không đụng). Khôi phục 3 file từ
   backup (diff khớp 100%, 0 marker REDCHECK còn lại), chạy lại:
   **M10 28/28, L8 23/23**.

## 6. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round56-m10/run-regression-m10.sh`,
  esbuild bundle + node, sao từ L8 + thêm dòng M10): U2 20/20, T3
  10/10, V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4 13/13, C5 11/11,
  Z4 19/19, Y4 10/10, E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8,
  I6 25/25, **K8 18/18**, reversePlayback 10/10,
  reversePreviewGate 12/12, A6 12/12, Y6 11/11, D4 3/3, B6 8/8,
  Z6 10/10, saveToast31 15/15, structuredNotes32 12/12,
  errorDetail34Q4 35/35, **L8 23/23**, **M10 28/28**. Log
  `regression-m10-final.log`. (27/27 suite xanh — khác L8: 2 suite
  i18n đã được parent sửa snapshot 987 → 1011 ở cuối đợt 55 nên giờ
  xanh hoàn toàn.)
- Demux Q2 (`mp4Demux34Q2.test.ts`): **8/8** (mdhd/mvhd mới không
  đổi hành vi demux).
- Headed (Xvfb :171/:172, TMPDIR riêng): cost lần 2 + profile 4 file
  + keyframe 4K + stts-giả end-to-end + nhánh unsupported-config —
  xem §1.4/§2.2/§3/§4. Log `headed-m10.log`, `headed-m10b.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**.
- `vite build` (outDir scratch `~/scratch-round56-m10/build`): **pass**
  trong 5,62 s; chỉ cảnh báo chunk > 500 kB có sẵn.

## 7. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/mp4Demux.ts` — parse `mdhdDuration` +
  `mvhdDuration` (optional, null khi không đọc được), hàm mới
  `validateSampleTimestamps` (§1.3). Không đổi logic demux cũ.
- `apps/web/src/lib/gopTrialDecode55L8.ts` — type mới
  `GopTrialDecodeProbeOutcome`, hàm mới `isUnsupportedDecoderMessage`,
  browser probe thêm isConfigSupported pre-check + phân loại lỗi
  configure/decode, `runTrialDecode` map `"unsupported-config"` →
  fail-open. Không đổi hành vi probe boolean cũ.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — hằng mới
  `MAX_TRIAL_DECODE_SAMPLE_BYTES` (2 MiB), kiểm timestamp stts sau
  lớp K8 (cả 2 mode), stream-mode fetch thêm phần còn lại của sample 0
  khi ≤ 2 MiB. Không đổi logic lớp K8, gate, probe, prefix, tail-scan,
  AVCC, mdat, all-mode.
- `apps/web/src/lib/gopTrialDecode55L8.test.ts` — **1 test đổi kỳ
  vọng theo hợp đồng mới (b)**: "sample 0 lớn stream-mode: probe
  KHÔNG gọi" → "300 KiB ≤ cap 2 MiB → fetch phần còn lại, probe gọi
  1 lần, probe-false chặn được" (giữ nguyên 23 test, 23/23).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền
  lệ J6/K8/L8).

MỚI:

- `apps/web/src/lib/gopTrialDecode56M10.test.ts` — 28 test (§5).
- `docs/PHASE9_ROUND56_M10_GOP_TRIAL_FOLLOWUP_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: file test của K8 (`gopFakeMoov54K8.test.ts`), mọi file
production khác, `preview.tsx`, `store.ts`, `reverseWebcodecs.ts`
(caller không cần sửa — probe mặc định đã dùng browser probe mới).
Scratch + log ở `~/scratch-round56-m10/` (probe headed ×2 + runner,
fake-stts file, profile/bigkey mp4, regression, red-before, backup
3 file production) và bản sao log ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round56-m10/`.

## 8. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **(a) còn lọt:** đổi tỉ lệ đều toàn bộ stts + sửa khớp mdhd/mvhd;
   hoán đổi delta giữ nguyên tổng; sửa 1 delta trong dung sai (~1
   frame). Cần ground-truth fps độc lập (SPS VUI timing) mới bắt được
   lớp đổi tỉ lệ đều — việc đợt sau.
2. **(b) sample > 2 MiB ở stream-mode vẫn bỏ qua** (thiết kế): file
   giả có keyframe đầu > 2 MiB lọt ở stream-mode (all-mode vẫn chặn).
   Keyframe > 2 MiB thực tế chỉ gặp ở 8K/bitrate rất cao; nới cap
   thêm sẽ tốn fetch + decode (300 KiB đã 68 ms, 2 MiB có thể chạm
   timeout 200 ms).
3. **(c) chưa đo Safari/Firefox thật:** guard `"unsupported-config"`
   chỉ mới kiểm chứng headed trên Chromium (HEVC + avcC hỏng) và unit
   Node. Safari cũ không có WebCodecs → probe null → bỏ qua (đã có
   từ L8).
4. **Chi phí decode sample lớn vượt ngân sách ~50 ms** (§2.2): 300 KiB
   ~68 ms, 342 KiB ~73 ms — vẫn trong timeout 200 ms và chỉ trả 1 lần
   khi mở file; sample ~2 MiB có thể chạm timeout và fail-open (hướng
   an toàn). Nếu muốn chặn chắc sample lớn thì cần tăng timeout riêng
   cho sample lớn hoặc decode ở worker nền — việc đợt sau (không làm
   trong luồng này vì đổi timeout ảnh hưởng đường mở file chung).
5. **Phát hiện phụ ngoài phạm vi:** 3 file footage có audio cho
   `maxPresEnd ≈ 2^32` (ctts v1 offset âm) — demux Q2, không đụng;
   ghi để luồng demux xem xét.
6. **Nợ cũ giữ nguyên (không đụng trong luồng này):** `.github/
   workflows/ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có
   CI chạy thật); cơ chế gốc lần đóng băng chạy 1 K8; "155 + http
   chunked" NOT_MEASURED (I8 §4); cutoff `buffered [[0,2.367]]` chưa
   giải thích (J6 §4); guard seekable chưa có đo headed trên app thật
   (J6 §7.6); file nhiều mdat mà mdat thứ hai nằm ngoài tiền tố 512 KiB
   vẫn fallback oan (J6 §7.2).
