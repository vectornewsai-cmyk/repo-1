# Phase 9 — Đợt 58, luồng O6: timeout trial-decode theo kích thước sample (đóng nợ đợt 57 §6.4)

Ngày: 07/11/2026 (lượt cron 18:35 +07). Đóng nợ 4 của đợt 57
(LIMITS đợt 57 §6.4 = LIMITS N10 §6.1): keyframe 4K nhiễu 4.107.475 byte
decode không kịp timeout 200 ms → fail-open (an toàn nhưng moov giả có
sample 0 là keyframe không bị chặn chắc); cần timeout riêng theo kích
thước nếu muốn chặn chắc. KHÔNG push, KHÔNG release/tag, KHÔNG
binary/dist vào batch. Mọi số dưới đây đều đo/chạy thật; chỗ chưa đo
được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Timeout trial-decode NAY THEO KÍCH THƯỚC SAMPLE**
   (`trialDecodeTimeoutForSampleSize`, `gopTrialDecode55L8.ts`):
   sample ≤ 256 KiB giữ nguyên timeout gốc 200 ms; phần vượt 256 KiB
   cộng **0,3 ms/KiB** (≈ 2× tốc độ decode đo được 0,15 ms/KiB); trần
   **2500 ms**. T3 áp ở CẢ 2 điểm gọi trial-decode (stream-mode +
   all-mode). Ví dụ (base 200): 300.148 B → 212 ms; 460.756 B →
   259 ms; 4.107.475 B → 1327 ms; 8 MiB → 2500 ms (trần).
2. **Keyframe 4K nhiễu thật nay decode KỊP verdict** (kiểm chứng
   headed, §1.3): sample 4.107.475 B với timeout mới 1327 ms →
   **decode-ok sau 662,7 ms** (đợt 57: timeout-200ms → fail-open).
   Sample 300 KiB → decode-ok sau 77,4 ms (timeout 212 ms);
   720p 29 KiB → decode-ok sau 25 ms (timeout 200 ms, không đổi).
3. **Rác lớn vẫn fail NHANH nên không lọt vì timeout dài hơn:**
   4,1 MiB ngẫu nhiên median **5,1 ms** → false; cắt đuôi 1 MiB
   median **2,5 ms** → false — verdict ra trước khi hết timeout dù
   timeout đã scale. Timeout dài chỉ giúp keyframe thật-lớn decode
   kịp để CÓ verdict, không làm rác lọt.
4. **Test Node mới 18/18** (đỏ-trước 15/18 — đúng 3 test sample lớn
   fail trên code chưa nối T3). **Hồi quy GOP: 31/31 suite xanh**
   (L8 23/23, M10 28/28, N10 17/17, N6 32/32, T3 10/10, K8 18/18,
   I6 25/25, …). **tsc web + desktop: 0 lỗi. vite build pass**
   5,54 s (chỉ cảnh báo chunk > 500 kB có sẵn).

## 1. Hiệu chuẩn bằng số đo thật (headed Chromium, máy này)

Giàn như N10 (Xvfb :183, Chromium headed, cổng 8915/9411, TMPDIR
riêng). Probe (a) `vdHeaded58O6.ts` gọi probe production TRỰC TIẾP
(không qua `runTrialDecode` nên không bị cắt ở 200 ms), 7 lần/size;
probe (b) `vdHeaded58O6b.ts` chạy `runTrialDecode` với timeout tính
bằng helper mới. Log: `headed-o6.log`, `headed-o6b.log`.

### 1.1 Decode trực tiếp sample 0 thật (probe (a), loadavg 2,02 lúc bắt đầu)

| File | s0 (byte) | Decode 7 lần (ms) | Median | p95 | Verdict |
|---|---|---|---|---|---|
| trailing-real37.mp4 (720p) | 29.245 | 58,7 / 9,9 / 9,9 / 14,1 / 10,8 / 10,2 / 8,2 | **10,2** | 58,7 | 7/7 true |
| bigkey-4k.mp4 (4K crf 12) | 300.148 | 69,5 / 67,9 / 89,5 / 70,4 / 68,3 / 78,3 / 68,0 | **69,5** | 89,5 | 7/7 true |
| bigkey-4k-lossless.mp4 (4K crf 0) | 460.756 | 105,4 / 108,4 / 99,6 / 103,2 / 104,9 / 111,5 / 125,1 | **105,4** | 125,1 | 7/7 true |
| bigkey-4k-noisy.mp4 (4K nhiễu) | 4.107.475 | 632,0 / 622,6 / 593,4 / 587,5 / 609,1 / 875,0 / 1158,2 | **622,6** | 1158,2 | 7/7 true |

Tốc độ decode suy ra: từ 300 KiB (69,5 ms) lên 4,1 MiB (622,6 ms):
(622,6 − 69,5) / (4012 − 293) KiB ≈ **0,15 ms/KiB**. Lần đầu 720p
58,7 ms là warmup (6 lần sau 8,2–14,1 ms). So với N10 (máy tải nặng):
median 4K 69,5 ms (N10: 113 ms), noisy 622,6 ms (N10 chỉ biết > 200 ms)
— máy đợt này yên hơn (loadavg ~2 so với 2,5–5,0), số tuyệt đối đọc
kèm bối cảnh tải, nhưng TỈ LỆ theo kích thước là căn cứ chọn hệ số.

### 1.2 Rác lớn fail nhanh hay chậm? (probe (a), cùng config avc1.640033, 5 lần)

| Mẫu | ms từng lần | Median | Verdict |
|---|---|---|---|
| 4.107.475 byte ngẫu nhiên | 4,6 / 15,2 / 64,2 / 5,1 / 3,4 | **5,1** | 5/5 false |
| Sample nhiễu thật bị zero 1 MiB giữa (byte 1.000.000–1.999.999) | 1524,9 / 1785,1 / 1381,4 / 1209,6 / 1305,2 | **1381,4** | 5/5 **true** |
| Sample nhiễu thật bị cắt đuôi 1 MiB (còn 3.058.899 B) | 2,4 / 1,9 / 2,7 / 2,6 / 2,5 | **2,5** | 5/5 false |

Hai kết luận quan trọng:
- **Rác "sạch" (ngẫu nhiên / cắt đuôi) fail trong ~5 ms** — timeout
  scale lên 1327 ms không làm rác lọt vì verdict đã ra từ lâu.
  Đây là cơ sở để tăng timeout mà không mở lỗ hổng: kẻ giả muốn
  lọt phải đưa sample decode ĐƯỢC (keyframe thật) hoặc sample
  decode-được-nhưng-chậm (§1.2 dòng 2).
- **Phát hiện phụ trung thực:** sample thật bị zero 1 MiB giữa vẫn
  decode ra frame (**true**, median 1381,4 ms) — decoder Chromium
  tự phục hồi/resync qua vùng zero (error concealment), không fail.
  Trial-decode vì vậy KHÔNG bắt được lớp "keyframe thật bị đục lỗ
  giữa" — và với timeout mới 1327 ms, mẫu này còn có thể timeout
  (median 1381 > 1327) → fail-open. Ghi rõ làm nợ dư (§6.1), không
  mạo nhận timeout mới chặn được mọi biến thể.

### 1.3 Đối chiếu runTrialDecode với timeout cũ/mới (probe (a) §3 + probe (b))

- Probe (a): noisy + timeout 200 → **timeout sau 200,8 ms**
  (fail-open, tái xác nhận N10); noisy + timeout 10000 →
  **decode-ok sau 1020,7 ms**.
- Probe (b) — timeout tính bằng helper mới, loadavg 2,12 lúc bắt
  đầu (5-phút 4,90 do các luồng đợt 58 chạy song song):
  29.245 B → timeout 200 ms → **decode-ok 25,0 ms**;
  300.148 B → timeout 212 ms → **decode-ok 77,4 ms**;
  4.107.475 B → timeout 1327 ms → **decode-ok 662,7 ms**.
  Keyframe nhiễu thật nay có verdict thật thay vì fail-open mù.

## 2. Thiết kế

### 2.1 Quy tắc (gopTrialDecode55L8.ts)

```ts
trialDecodeTimeoutForSampleSize(sampleBytes, baseTimeoutMs = 200):
  base = baseTimeoutMs hợp lệ (> 0, finite) ? baseTimeoutMs : 200
  if (sampleBytes ≤ 256 KiB hoặc không hợp lệ) return base
  return min(base + ceil((sampleBytes − 256 KiB) / 1024 × 0,3), 2500)
```

- **Ngưỡng 256 KiB** = `MAX_FIRST_SAMPLE_PROBE_BYTES` (tiền tố T3 đã
  fetch sẵn): sample vừa trong tiền tố giữ đúng timeout gốc — đường
  nhỏ (720p/1080p, mọi file thường) KHÔNG đổi 1 ms hành vi.
- **Hệ số 0,3 ms/KiB = 2× tốc độ decode đo được (0,15 ms/KiB, §1.1):**
  timeout ≈ base + 2× thời gian decode kỳ vọng của phần vượt ngưỡng.
  Kiểm tra trên số đo: 300 KiB → 212 ms (≈ 2,4× p95 89,5 ms);
  461 KiB → 259 ms (≈ 2,1× p95 125,1 ms); 4,1 MiB → 1327 ms
  (≈ 2,1× median 622,6 ms; 1,15× p95 1158,2 ms — p95 này gồm nhiễu
  tải, xem §6.3).
- **Trần 2500 ms:** chặn cứng chi phí mở file dù sample chạm cap
  8 MiB (không trần thì 8 MiB ra 2581 ms). 2,5 s là mức tối đa chấp
  nhận cho 1 lần mở file, chỉ trả khi decoder thật sự còn đang
  decode sample khổng lồ; rác fail trong ~5 ms nên không bao giờ
  chạm trần vì rác.
- `trialDecodeTimeoutMs` của T3 nay là timeout GỐC cho sample nhỏ;
  T3 tính timeout đã scale ở CẢ 2 điểm gọi (stream-mode dùng
  `trialSample.length`, all-mode dùng `chunks[0].data.length`).
  `runTrialDecode` không đổi: quá timeout vẫn fail-open như cũ.

### 2.2 Vì sao không chọn phương án khác

- **Tăng timeout chung (vd 200 → 1500 ms cho mọi sample):** làm
  đường mở file thường (720p) cũng có thể kẹt tới 1,5 s khi decoder
  treo — đổi hành vi đường nhỏ, trái nguyên tắc "đổi timeout chung
  ảnh hưởng đường mở file" (M10 §8.4). Quy tắc theo cỡ chỉ tăng
  timeout đúng chỗ cần (sample lớn).
- **Decode ở worker nền / không timeout:** ngoài phạm vi nợ này
  (worker nền là việc lớn, xem §6.4); bỏ timeout thì decoder treo
  kẹt luôn đường mở file.
- **Scale theo pixel (width×height) thay vì byte:** decode phụ thuộc
  cả entropy (nhiễu) chứ không chỉ pixel — keyframe 4K nhiễu 4,1 MiB
  decode 623 ms trong khi keyframe 4K lossless 461 KiB chỉ 105 ms
  (cùng 3840×2160). Byte là proxy tốt hơn cho công việc decode thực
  tế và có sẵn ngay tại điểm gọi (không cần parse thêm).

## 3. Test Node mới `gopTrialDecode58O6.test.ts` — 18/18

### 3.1 Hằng số (4 test — khóa hợp đồng, đổi lén là đỏ)

- Ngưỡng = 256 KiB; hệ số = 0,3 ms/KiB; trần = 2500 ms; gốc vẫn 200 ms.

### 3.2 Unit `trialDecodeTimeoutForSampleSize` (8 test)

- Sample nhỏ (0 / 1 / 1000 / 29.245 / đúng 256 KiB) → đúng 200 ms;
  256 KiB + 1 byte → 201 ms (ceil, không nhảy vọt).
- Giá trị hiệu chuẩn từ số đo thật: 300.148 → 212; 460.756 → 259;
  4.107.475 → 1327; 3.000.000 → 1003 (dùng ở test T3).
- Trần: 8 MiB → 2500 (không phải 2581); 16 MiB → 2500.
- Base override: base 30 → nhỏ 30 ms; 300.148 B → 42 ms;
  4.107.475 B → 1157 ms.
- Base không hợp lệ (0 / −5 / NaN / Infinity) → về gốc 200 rồi mới
  scale; size không hợp lệ (NaN / âm) → gốc, không throw.

### 3.3 T3 thật qua server Range (6 test, builder MP4 sao từ N10)

Đo thời gian CHỜ timeout bằng hiệu (lượt probe treo − lượt
probe-true tức thì trên cùng file, có warm-up trước) để trừ phí
fetch/demux (~200–400 ms trên file 6 MB) — đo tổng tuyệt đối sẽ bị
phí fetch làm nhiễu (bài học đỏ-trước: lượt đầu đo tổng cho 873 ms
dù timeout vẫn 200 ms).

- Sample nhỏ (1000 B) + probe treo → gop-range, chờ ~200 ms
  (đo: tổng 305 ms, baseline 202 ms, chờ 103 ms — trong cửa sổ
  [80, 900) đã nới cho nhiễu baseline, xem §6.5).
- Sample 3 MiB + probe treo → gop-range, chờ ~1003 ms
  (đo: tổng 1201 ms, baseline 311 ms, chờ 890 ms).
- Sample 3 MiB + probe trả false sau 500 ms → **full-file
  /trial-decode/** (verdict chậm nay kịp về trước timeout 1003 ms;
  đo: chờ verdict 431 ms < 1003 ms).
- ĐỐI CHỨNG sample nhỏ + probe-false sau 500 ms → gop-range
  (timeout 200 ms cắt verdict — fail-open như cũ; đo: tổng 320 ms).
- All-mode sample 3 MiB + probe treo → gop-range, chờ ~1003 ms
  (đo: tổng 1176 ms, baseline 210 ms, chờ 967 ms).
- Sample 3 MiB + probe-true tức thì → gop-range, không chờ hết
  timeout (đường nhanh không bị timeout mới làm chậm).

### 3.4 Đỏ-trước đã verify

Chạy suite mới TRƯỚC khi nối T3 (chỉ có helper + test): **15/18** —
đúng 3 test sample lớn fail (treo stream chờ thêm 116 ms ≈ timeout
cũ 200; probe-false 500 ms bị cắt → gop-range (LỌT); treo all-mode
chờ thêm 166 ms). Sau khi nối T3: **18/18** (chạy lại 2 lượt liên
tiếp đều 18/18).

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round58-o6/run-regression-o6.sh`,
  sao từ N10 + thêm dòng N6, O6): U2 20/20, T3 10/10, V2 16/16, W4
  15/15, X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19, Y4
  10/10, E2blob 8/8, E2i18n 3/3, F4 6/6, H4 8/8, I6 25/25, K8
  18/18, reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12,
  Y6 11/11, D4 3/3, B6 8/8, Z6 10/10, saveToast31 15/15,
  structuredNotes32 12/12, errorDetail34Q4 35/35, L8 23/23, M10
  28/28, N10 17/17, N6 32/32, **O6 18/18**. Log `regression-o6.log`.
  (31/31 suite xanh.)
- Headed (Xvfb :183/:185, TMPDIR riêng): §1.1–§1.3. Log
  `headed-o6.log`, `headed-o6b.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**;
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
- `vite build` (chạy từ `apps/web`, outDir scratch
  `~/scratch-round58-o6/build`): **pass** trong 5,54 s; chỉ cảnh báo
  chunk > 500 kB có sẵn.
- Lưu ý: các luồng đợt 58 khác (O1, O4) đang làm song song — file
  `tsconfig.json` đã có sẵn 2 dòng exclude của họ
  (`modalCard58O4.test.ts`, `welcomeEscape58O1.test.ts`); luồng này
  chỉ thêm đúng 1 dòng của mình, không đụng file của họ.

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/gopTrialDecode55L8.ts` — 3 hằng mới
  (`TRIAL_DECODE_TIMEOUT_SIZE_THRESHOLD_BYTES` 256 KiB,
  `TRIAL_DECODE_TIMEOUT_EXTRA_MS_PER_KIB` 0,3,
  `MAX_TRIAL_DECODE_TIMEOUT_MS` 2500) + hàm mới
  `trialDecodeTimeoutForSampleSize` (§2.1); cập nhật comment header
  + comment của `DEFAULT_TRIAL_DECODE_TIMEOUT_MS` (nay là timeout
  gốc cho sample nhỏ). Không đổi `runTrialDecode`, probe, fail-open.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — import helper; 2 điểm
  gọi trial-decode (stream-mode + all-mode) truyền timeout đã scale
  theo đúng kích thước sample đem decode; cập nhật comment option
  `trialDecodeTimeoutMs` + comment cap 8 MiB + comment stream-mode.
  Không đổi logic gate, probe, prefix, tail-scan, AVCC, mdat, chunk,
  all-mode, validateSampleTimestamps.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền
  lệ J6/K8/L8/M10/N10).

MỚI:

- `apps/web/src/lib/gopTrialDecode58O6.test.ts` — 18 test (§3).
- `docs/PHASE9_ROUND58_O6_TRIAL_TIMEOUT_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: mọi file test cũ (L8/M10/N10/N6 vẫn xanh nguyên trạng —
không test nào đổi kỳ vọng), `mp4Demux.ts`, `preview.tsx`,
`store.ts`, `reverseWebcodecs.ts`. Scratch + log ở
`~/scratch-round58-o6/` (probe headed ×2 + runner, regression,
red-before, build).

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Keyframe thật bị đục lỗ giữa vẫn decode OK** (§1.2): zero 1 MiB
   giữa keyframe 4,1 MiB vẫn ra frame (median 1381 ms) — trial-decode
   không bắt được lớp này, và timeout mới 1327 ms còn có thể không
   đủ để có verdict (median 1381 > 1327) → fail-open. Bắt lớp này
   cần kiểm khác (vd hash/checksum sample hoặc decode + so pixel),
   không phải việc timeout.
2. **Sample > 8 MiB ở stream-mode vẫn bỏ qua** (thiết kế, fail-open):
   timeout mới không áp cho sample trên cap (T3 không decode). Kéo
   cap lên nữa thì trần 2500 ms sẽ là chặn cứng (8 MiB ngoại suy
   ~1250 ms median, p95 có thể chạm trần).
3. **Chưa đo Safari/Firefox thật** (không có trên VM); decoder
   Chromium là căn cứ duy nhất cho §1. Tốc độ decode trên máy yếu
   hơn / decoder phần cứng khác có thể chậm hơn — hệ số 2× là
   headroom, không phải bảo đảm tuyệt đối.
4. **Decode ở worker nền chưa làm** (M10 §8.4): trial-decode vẫn
   chạy trên main thread của đường mở file; timeout 2,5 s là chặn
   cứng nhưng 2,5 s kẹt UI khi mở file có keyframe khổng lồ vẫn là
   chi phí thật với người dùng.
5. **Cửa sổ assert thời gian của test T3 sample nhỏ khá lỏng**
   ([80, 900) ms cho thời gian chờ): trừ baseline bằng 2 lượt chạy
   liên tiếp có nhiễu ±100 ms (đo: chờ 103 ms một lượt, 194 ms lượt
   khác — cùng timeout 200 ms). Giá trị 200 ms của sample nhỏ được
   khóa chắc bằng unit test helper + test L8 cũ, không chỉ bằng test
   T3 này; ghi rõ để đợt sau khỏi siết cửa sổ một cách ngây thơ.
6. **Nợ cũ giữ nguyên (không đụng trong luồng này):** `.github/
   workflows/ci-security.yml` 403 chưa lên GitHub (repo vẫn chưa có
   CI chạy thật); các nợ M10 §8, N10 §6.2–§6.6 giữ nguyên.
