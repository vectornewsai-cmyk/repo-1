# Phase 9 — Đợt 55, luồng L8: nối trial-decode bất đồng bộ (fail-open) vào kiểm tra GOP T3

Ngày: 07/11/2026 (lượt cron 09:35 +07; làm việc ~02:40–03:30 UTC). Đóng đề
xuất ở `docs/PHASE9_ROUND54_K8_GOP_LONG_REVERSE_LIMITS.md` §3.2: nối
VideoDecoder trial-decode vào T3 để loại moov giả tinh vi
"AVCC-đúng-cấu-trúc nhưng H.264-rác" mà mọi lớp T3 trước đó bỏ lọt.
KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào batch. Mọi số dưới
đây đều đo/chạy thật; chỗ chưa đo được thì ghi rõ, không mạo nhận.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Đã nối trial-decode vào T3 (sau lớp K8 + kiểm AVCC), cả 2 mode.**
   Interface inject `GopTrialDecodeProbe` + wrapper fail-open
   `runTrialDecode` (module mới `gopTrialDecode55L8.ts`); T3 nhận thêm
   2 option `trialDecodeProbe` / `trialDecodeTimeoutMs` (mặc định:
   probe VideoDecoder thật của trình duyệt, timeout 200 ms). Chỉ
   decoder báo lỗi THẬT mới fallback full-file; không có decoder /
   probe ném lỗi / timeout đều cho qua.
2. **Moov giả tinh vi — ĐÃ CHẶN ĐƯỢC BẰNG ĐO THẬT (headed).** File giả
   dựng từ fixture thật (chỉ patch sample 0 thành H.264-rác, moov giữ
   nguyên 100%): T3 stream + all đều fallback full-file, lý do
   `trial-decode: ...`; cùng file đó với probe null thì lọt gop-range
   (chứng minh K8 + AVCC một mình bỏ lọt — đúng lỗ L8 đóng). File thật
   không đổi hành vi (gop-range cả 2 mode, 72 GOP all-mode).
3. **Chi phí — ĐO THẬT, GHI RÕ CẢ 2 MẶT (§3).** Decode trực tiếp sample
   0 thật 720p: K8 trên máy yên 15,5 ms; đợt này trên máy tải nặng
   (loadavg ~3–7, fetch 39 MB mất 3,5–5,1 s thay vì ~0,5 s ở K8):
   7 lần đo 25,1–169,7 ms, median 82,9 ms (lần đầu 169,7 ms là
   warmup; các lần sau gom 2 cụm ~25 ms và ~83–87 ms). Chênh T3
   stream median đo được 110 ms (lần 2) / 193,5 ms (lần 1) — NHƯNG
   2 số này bị nhiễu fetch/tail-scan áp đảo (dao động từng vòng
   ±200–1200 ms) nên KHÔNG dùng làm claim chi phí; claim chi phí là
   số decode trực tiếp. Kết luận: ngân sách ~50 ms ĐẠT trên máy yên
   (~15–25 ms), VƯỢT trên máy tải nặng (median ~83 ms, tối đa ~170 ms
   lần đầu) — nhưng chi phí chỉ trả 1 lần khi mở file, bị chặn cứng
   bởi timeout 200 ms, và đường mở file vốn đã 400–2000 ms dưới tải
   nên phần tăng thêm là nhỏ tương đối. Vẫn giữ luôn-bật (xem §3.3:
   không có tín hiệu nghi ngờ rẻ nào phân biệt được lớp file này —
   đó chính là lý do trial-decode tồn tại).
4. **Test Node mới 23/23 (đỏ-trước 20/23).** Đúng 3 test chặn fail khi
   tạm vô hiệu nhánh chặn; mọi test fail-open vẫn xanh. Hồi quy GOP:
   25/27 suite xanh hoàn toàn (K8 18/18, I6 25/25, T3 10/10, L8 23/23);
   2 suite E2i18n/Z6 fail 1 test mỗi suite do 1 luồng round-55 khác
   thêm 24 key i18n (dict 1011 key, test còn hardcode 987) — không phải
   do L8, xem §4. tsc 0 lỗi; vite build pass 37,31 s.
5. **Không sửa logic lớp kiểm K8 hiện có, không sửa file test của K8.**
   Chỉ thêm wiring sau nó + module mới + test mới + 1 dòng exclude
   tsconfig.

## 1. Thiết kế interface inject (fail-open)

### 1.1 Module mới `apps/web/src/lib/gopTrialDecode55L8.ts`

- `TrialDecodeConfig { codec, codedWidth, codedHeight, description }`
  — dựng từ track đã demux bằng `trialDecodeConfigFromTrack(track)`
  (codec/avcC/kích thước; `description` là nội dung box avcC).
- `GopTrialDecodeProbe = (sample, config) => Promise<boolean>` — true
  = decode ra frame OK, false = decode lỗi thật. Probe không throw
  (lỗi nội bộ → false); wrapper vẫn phòng thủ thêm.
- `createBrowserTrialDecodeProbe(): GopTrialDecodeProbe | null` —
  probe production: tạo 1 VideoDecoder mới mỗi lần gọi, configure từ
  config, decode đúng 1 chunk key ở timestamp 0, chờ flush, close
  trong finally; trả true CHỈ khi có frame output và không có lỗi nào
  (callback `error` lẫn exception decode/flush). Trả null khi
  `typeof VideoDecoder === "undefined"` (Node, Safari cũ không có
  WebCodecs). Lưu ý tiền lệ K8: `VideoDecoder.close()` trả undefined,
  không phải Promise — gọi thường, không await.
- `runTrialDecode(probe, sample, config, timeoutMs = 200)` — bọc probe
  bằng timeout + fail-open, trả `TrialDecodeResult { passed, skipped, reason }`:
  - probe null/undefined → `{passed:true, skipped:true, reason:"no-decoder"}`.
  - probe true → `{passed:true, skipped:false, reason:"decode-ok"}`.
  - probe false → `{passed:false, skipped:false, reason:"decode-failed"}`.
  - probe ném lỗi/reject → fail-open `{passed:true, skipped:true, reason:"probe-error: ..."}`.
  - quá timeout → fail-open `{passed:true, skipped:true, reason:"timeout-<ms>ms"}`.
    Promise probe vẫn chạy nền sau timeout nhưng đã gắn `.catch(()=>{})`
    nên không gây unhandled rejection; decoder bên trong probe vẫn được
    close trong finally khi flush xong (chỉ đóng muộn). Phân biệt
    timeout với probe-trả-false bằng cờ `timedOut` do chính callback
    timeout đặt trước khi resolve (probe trả false đúng lúc timeout bắn
    thì tính là timeout — hướng fail-open, an toàn).
  - timeoutMs ≤ 0 / không finite → dùng mặc định 200 ms.
- `DEFAULT_TRIAL_DECODE_TIMEOUT_MS = 200`. Chọn 200 ms vì: sample thật
  720p decode OK 15,5–17,1 ms (K8, máy yên), mẫu rác lỗi 0,5–1,6 ms —
  200 ms là ~12× headroom cho máy chậm/tải nặng, đồng thời chặn cứng
  đường mở file không kẹt quá 200 ms vì decoder treo. Timeout → cho
  qua (fail-open), không chặn — nên 200 ms không phải ngưỡng "chặn
  file thật chậm", mà chỉ là ngưỡng "bỏ qua kiểm tra".

### 1.2 Wiring trong `gopRangeFetch39T3.ts` (KHÔNG sửa lớp K8)

Option mới trên `GopRangeFetchOptions`:
- `trialDecodeProbe?: GopTrialDecodeProbe | null` — undefined (mặc
  định) = probe trình duyệt thật (null trong Node → bỏ qua); null =
  tắt hẳn (opt-out); function = probe inject (test / caller tự cung).
- `trialDecodeTimeoutMs?: number` — mặc định 200 ms.

Probe được phân giải 1 lần ở đầu `fetchVideoTrackByGopRange` để cả 2
mode dùng chung (không tạo VideoDecoder thừa). Wiring đặt SAU lớp K8
(bố cục/ctts/stss) và SAU kiểm AVCC sample 0 — chỉ chạy khi file đã
qua mọi lớp rẻ, tránh tốn decode cho file đã fail rẻ:

- **Stream-mode** (sau kiểm AVCC trên `firstSample` — tái dùng đúng
  request `"sample"` của J6, không thêm fetch): CHỈ chạy khi
  `s0.size <= MAX_FIRST_SAMPLE_PROBE_BYTES` (256 KiB, tức đã fetch đủ
  toàn bộ sample 0). Sample 0 lớn hơn cap thì `firstSample` chỉ là
  tiền tố — decode tiền tố cắt dở sẽ lỗi oan file thật nên BỎ QUA
  (fail-open), không fetch thêm byte nào.
- **All-mode** (sau kiểm AVCC trên `chunks[0].data` ở GOP 0): chạy
  luôn vì `chunks[0].data` là toàn bộ sample 0 (GOP 0 đã fetch đủ
  range — không có cap). Kiểm ngay sau GOP 0 để không fetch thừa các
  GOP sau khi đã biết moov giả.
- Cả 2 mode: `trial.passed === false` → fallback
  `demux-moov: trial-decode sample 0 lỗi (decode-failed: ... — moov giả?)`.
  Khác với K8 §3.2 đề xuất (chỉ stream-mode): all-mode cũng nối vì
  đã có đủ sample 0 miễn phí trong GOP 0, cùng chi phí, cùng bảo vệ —
  ghi rõ độ lệch này để parent khỏi tưởng sót.

Caller production duy nhất (`reverseWebcodecs.ts:1418`, stream-mode,
không truyền probe) tự động dùng probe trình duyệt thật — không cần
sửa caller. Trong Node/test, `VideoDecoder` vắng → probe null → bỏ
qua → test cũ không đổi hành vi (K8 18/18 vẫn xanh, xem §4).

## 2. Đo headed thật (VideoDecoder thật, Xvfb :157, TMPDIR riêng)

Giàn: Chromium headed (`~/.cache/ms-playwright/chromium-1248`),
CDP, server HTTP Range riêng (cổng 8902, debug 9398). Fixture thật
`trailing-real37.mp4` (38.996.431 byte, 2160 sample, 720p, moov cuối).
File giả `fake-garbage-s0-37.mp4`: dựng từ fixture thật bằng
`makeFake55L8.ts` — demux bằng code production (sample 0: offset 48,
size 29.245, key, avc1.64001F, khớp đúng K8 probe), ghi đè đúng vùng
sample 0 bằng mẫu H.264-rác AVCC-đúng-cấu-trúc (công thức K8 case B);
moov giữ nguyên 100%, sha256 đổi `2376649d…` → `529c963c…`. Log:
`headed-trial-decode.log`, `headed-trial-decode-cost.log`.

### 2.1 Direct decode 3 loại sample (tái xác nhận K8 §3.1) — lần 1

| Case | AVCC | VideoDecoder | Thời gian |
|---|---|---|---|
| A: sample 0 thật (keyframe IDR, 29.245 byte) | ok | **OK, ra frame** | **206 ms** (K8 máy yên: 15,5 ms) |
| B: AVCC-đúng-cấu-trúc, H.264-rác | **ok (qua được!)** | **LỖI** (ok=false) | 0,7 ms (K8: 0,5 ms) |
| C: byte giữa NAL | fail ("NAL 0 dài 539828328 vượt sample còn lại 996") | **LỖI** (ok=false) | 4,2 ms (K8: 1,6 ms) |

Lần 1 bị nhiễu tải máy nặng: fetch 39 MB mất 5120 ms (K8: 545 ms),
loadavg lúc đó ~5,4 — nên 206 ms của case A KHÔNG phải chi phí thật
của decode mà là decode dưới tải nặng + lần decode đầu tiên trong
trang (warmup). Xem lần 2 (§2.3) để tách nhiễu.

### 2.2 T3 trên file thật + file giả — lần 1 (kết quả đúng, số ms nhiễu)

- Stream file thật, probe mặc định: **gop-range** 3 lần (6301,1 /
  872,8 / 825,6 ms — lần đầu 6,3 s là warmup: tail-scan + decoder
  init đầu tiên; median 872,8 ms).
- Stream file thật, probe null: **gop-range** 3 lần (679,3 / 1208,9 /
  523,0 ms; median 679,3 ms). Chênh median 193,5 ms — NHIỄU: từng
  vòng dao động ±300 ms, không tách được tín hiệu trial-decode.
- Stream file giả, probe mặc định: **full-file**
  `demux-moov: trial-decode sample 0 lỗi (decode-failed: VideoDecoder
  không decode được sample 0 — moov giả?)` (811,2 ms) — **CHẶN ĐÚNG**.
- Stream file giả, probe null: **gop-range** (469,2 ms) — chứng minh
  K8 + AVCC một mình bỏ lọt file này (đúng lỗ L8 đóng).
- All file thật, probe mặc định: **gop-range**, 72 GOP (6795,1 ms —
  fetch toàn bộ 39 MB).
- All file giả, probe mặc định: **full-file**, cùng lý do
  trial-decode (732,6 ms) — **CHẶN ĐÚNG**.

### 2.3 Đo chi phí lần 2 — lặp xen kẽ (tách nhiễu)

Probe riêng `vdTrialDecodeCost55L8.ts`: decode trực tiếp sample 0
thật 7 lần (decoder mới mỗi lần, như production) + T3 stream xen kẽ
có/không probe 5 vòng. Loadavg đầu lần 2 ~2,9, cuối ~2,1 (vẫn tải,
nhưng nhẹ hơn lần 1).

- Decode trực tiếp 7 lần (ms): **169,7 / 25,1 / 82,9 / 25,5 / 86,8 /
  84,3 / 26,1 — median 82,9 ms, cả 7 đều ok=true.** Lần đầu 169,7 ms
  là warmup; các lần sau gom 2 cụm ~25 ms và ~83–87 ms (dao động do
  tải máy / GC / luồng khác tranh CPU — fetch 39 MB lần này vẫn mất
  3507 ms, gấp ~6× K8 máy yên). So với K8 máy yên 15,5 ms: cụm ~25 ms
  là chi phí gần-yên, cụm ~85 ms là chi phí dưới tải.
- T3 stream có probe 5 lần (ms): 1992,0 / 605,3 / 204,3 / 600,0 /
  606,1 — median 605,3 ms. Không probe: 773,9 / 495,3 / 404,1 / 719,5
  / 397,7 — median 495,3 ms. Chênh median **110 ms**; chênh từng vòng:
  +1218 / +110 / −200 / −120 / +208 ms — dao động ±200–1200 ms, tức
  chênh median vẫn bị nhiễu fetch/tail-scan áp đảo, KHÔNG dùng làm
  claim chi phí. Claim chi phí là số decode trực tiếp ở trên.
- Cả 10 lần T3 đều gop-range (file thật không bị chặn oan).

### 2.4 Kết luận chi phí (trung thực)

- Ngân sách ~50 ms thêm vào đường mở file: **ĐẠT trên máy yên**
  (K8: 15,5 ms; cụm ~25 ms lần này), **VƯỢT trên máy tải nặng**
  (median ~83 ms, tối đa ~170 ms lần đầu). Chi phí chỉ trả 1 lần khi
  mở file, bị chặn cứng bởi timeout 200 ms (quá thì fail-open, không
  chặn), và đường mở file vốn đã 400–2000 ms dưới tải nên phần tăng
  thêm là nhỏ tương đối.
- **Giữ luôn-bật** (không chuyển sang "chỉ chạy khi nghi ngờ") vì
  không có tín hiệu nghi ngờ rẻ nào phân biệt được lớp file này: mẫu
  giả có cùng kích thước sample, cùng bảng sample, cùng AVCC hợp lệ
  với file thật — đó chính là lý do trial-decode tồn tại. Nếu một
  ngày đo trên máy yên cho thấy chi phí ổn định > 50 ms thì mới cân
  nhắc lại (vd chỉ decode khi sample 0 nhỏ hơn ngưỡng, hoặc cache
  kết quả theo URL+size).

## 3. Test Node mới `gopTrialDecode55L8.test.ts` — 23/23

### 3.1 Unit `runTrialDecode` + factory (12 test)

- probe null / undefined → pass + skipped /no-decoder/.
- probe true → pass, không skipped /decode-ok/; probe false → FAIL,
  không skipped /decode-failed/.
- probe throw đồng bộ / reject → pass + skipped /probe-error/
  (fail-open).
- probe treo + timeout 30 ms → pass + skipped /timeout-30ms/, trả sau
  88 ms (đo: timer dưới tải bắn muộn — vẫn trong giới hạn).
- probe chậm-trả-true (100 ms) + timeout 30 ms → timeout thắng, pass
  + skipped; probe nhanh-trả-true (10 ms) + timeout 200 ms → pass,
  không skipped.
- `createBrowserTrialDecodeProbe()` trong Node → null (không có
  VideoDecoder); `DEFAULT_TRIAL_DECODE_TIMEOUT_MS = 200`;
  `trialDecodeConfigFromTrack` lấy đúng codec avc1.64001F / 1280×720 /
  description (avcC) từ track thật.

### 3.2 T3 thật qua server Range (11 test)

Builder MP4 tối thiểu sao từ K8 + thêm mẫu garbage-sample0 (công thức
K8 case B) và kiểm tra fixture `validateAvccSample(garbage, 1000).ok
=== true` — đúng lỗ hổng K8 §3.1.

- control + probe-true → gop-range cả 2 mode, probe gọi đúng 1 lần
  mỗi mode (không decode thừa mỗi GOP).
- control + probe-false → full-file /trial-decode/ cả 2 mode (K8 pass,
  trial-decode chặn). Lý do đo được:
  `demux-moov: trial-decode sample 0 lỗi (decode-failed: VideoDecoder
  không decode được sample 0 — moov giả?)`.
- control + probe-throw → gop-range cả 2 mode (fail-open).
- control + probe-treo (timeout 40 ms) → gop-range cả 2 mode; đo:
  stream 262 ms, all 216 ms (cả thời gian T3, không kẹt).
- control + không truyền probe (mặc định Node) → gop-range cả 2 mode
  (không có VideoDecoder → bỏ qua).
- control + probe null (opt-out) → gop-range cả 2 mode.
- moov-giả-tinh-vi (sample 0 H.264-rác, AVCC+K8 đều qua) +
  probe-false → full-file /trial-decode/ cả 2 mode.
- moov-giả-tinh-vi + probe null → gop-range cả 2 mode (chứng minh
  K8+AVCC một mình bỏ lọt — đúng lỗ L8 đóng).
- sample 0 lớn (300.000 byte > cap 256 KiB) stream-mode: probe KHÔNG
  gọi (0 lần) → gop-range (bỏ qua, fail-open); all-mode: probe gọi
  1 lần trên toàn bộ sample → probe-false chặn được (full-file
  /trial-decode/).

### 3.3 Đỏ-trước đã verify

Tạm vô hiệu 2 nhánh chặn (`if (!trial.passed)` → `if (false && ...)`),
chạy lại: **20/23** — đúng 3 test chặn fail (control+probe-false,
moov-giả+probe-false, sample-lớn all-mode), tất cả trả gop-range cho
file/probe-lỗi thay vì fallback; mọi test fail-open vẫn xanh. Khôi
phục file từ backup (diff khớp 100%), chạy lại: **23/23**.

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round55-l8/run-regression-l8.sh`,
  esbuild bundle + node, sao từ K8 + thêm dòng L8): U2 20/20, T3 10/10,
  V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4 13/13, C5 11/11, Z4 19/19,
  Y4 10/10, E2blob 8/8, F4 6/6, H4 8/8, I6 25/25, **K8 18/18**,
  reversePlayback 10/10, reversePreviewGate 12/12, A6 12/12, Y6 11/11,
  D4 3/3, B6 8/8, saveToast31 15/15, structuredNotes32 12/12,
  errorDetail34Q4 35/35, **L8 23/23**. Log `regression-l8.log`.
- **2 suite fail 1 test mỗi suite — KHÔNG phải do L8, ghi rõ:** E2i18n
  2/3 và Z6 9/10, cùng 1 assertion duy nhất: số key i18n
  `1011 !== 987` ("vi/en parity toàn file"). Kiểm tra: `vi.json` +
  `en.json` hiện đều có đúng 1011 key, tập key bằng nhau — dict vẫn
  nhất quán; chỉ con số 987 hardcode trong 2 test là cũ. 2 file dict
  bị sửa lúc 02:44:04 UTC (trong lượt round-55 này) bởi 1 luồng song
  song khác đang i18n hoá (nợ M19 từ đợt 54); luồng L8 không đụng
  file i18n nào. Luồng i18n đó cần cập nhật 987 → 1011 trong 2 test
  này (hoặc parent gộp xử lý) — không sửa trong luồng này để tránh
  xung đột file với luồng đang làm.
- Test Node mới L8: **23/23** (đỏ-trước 20/23, xem §3.3).
- Headed (Xvfb :157, TMPDIR riêng): probe trial-decode lần 1 + đo chi
  phí lần 2 — file giả bị chặn cả 2 mode, file thật gop-range cả 2
  mode (xem §2). Log `headed-trial-decode.log`,
  `headed-trial-decode-cost.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **0 lỗi**.
- `vite build` (outDir scratch `~/scratch-round55-l8/build`): **pass**
  trong 37,31 s; chỉ cảnh báo chunk > 500 kB có sẵn.

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

ĐỔI (production):

- `apps/web/src/lib/gopRangeFetch39T3.ts` — thêm 2 option
  (`trialDecodeProbe`, `trialDecodeTimeoutMs`), phân giải probe 1 lần
  ở đầu hàm, wiring trial-decode sau kiểm AVCC ở stream-mode (chỉ khi
  sample 0 ≤ cap 256 KiB) và sau GOP 0 ở all-mode (luôn đủ sample);
  cập nhật comment bước 5. KHÔNG đổi logic lớp K8, gate, probe,
  prefix, tail-scan, AVCC, mdat.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền lệ
  J6/K8: test import đuôi `.ts` nên tsc báo TS5097 nếu không exclude).

MỚI:

- `apps/web/src/lib/gopTrialDecode55L8.ts` — interface probe +
  factory VideoDecoder thật + wrapper timeout/fail-open.
- `apps/web/src/lib/gopTrialDecode55L8.test.ts` — 23 test (§3).
- `docs/PHASE9_ROUND55_L8_GOP_TRIAL_DECODE_LIMITS.md` — LIMITS này.

KHÔNG ĐỔI: `apps/web/src/lib/mp4Demux.ts`, file test của K8
(`gopFakeMoov54K8.test.ts`), mọi file production khác, `preview.tsx`,
`store.ts`, `reverseWebcodecs.ts` (caller không cần sửa — mặc định đã
dùng probe trình duyệt). Scratch + log ở `~/scratch-round55-l8/`
(probe, runner, fake file, log headed ×2, regression) và bằng chứng ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l8/`.

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **False-positive profile lạ:** file H.264 hợp lệ nhưng decoder của
   máy người dùng không hỗ trợ profile (vd High 4:4:4) có thể bị chặn
   oan ở T3 (fallback full-file — vẫn phát được, chỉ chậm hơn). Đây
   là rủi ro K8 §3.2 đã nêu; fail-open chỉ cứu được trường hợp
   decoder vắng/lỗi/timeout, không cứu được trường hợp decoder trả lời
   rõ ràng "không decode được" cho file thật. Chưa đo trên profile
   lạ — cần 1 file High 4:4:4 / 10-bit thật để đo ở đợt sau (nếu
   decoder Chromium từ chối thì cân nhắc whitelist: chỉ chặn khi lỗi
   là "wasn't a key frame" / lỗi bitstream, còn lỗi "unsupported
   profile" thì fail-open).
2. **Moov giả sao chép y nguyên bảng sample thật nhưng sửa timestamp
   (stts)** (K8 §3.3): trial-decode sample 0 KHÔNG bắt được lớp này
   (sample 0 vẫn là byte thật, decode OK) — cửa cuối vẫn là decoder
   khi phát + controller fallback. Chặn triệt để cần decode thử nhiều
   frame / đối chiếu hash sample — chưa làm.
3. **Sample 0 lớn (> 256 KiB) ở stream-mode thì trial-decode bị bỏ
   qua** (thiết kế, §1.2): file giả có keyframe đầu khổng lồ (> 256
   KiB) sẽ lọt ở stream-mode (all-mode vẫn chặn vì đủ sample). Muốn
   bịt thì fetch thêm đúng phần còn lại của sample 0 chỉ để trial-decode
   (thêm 1 request Range) — chưa làm vì keyframe > 256 KiB ở 720p là
   hiếm (fixture thật 29 KiB); ghi để đợt sau cân nhắc.
4. **Chi phí dưới tải nặng vượt ngân sách ~50 ms** (§2.4): median
   ~83 ms, tối đa ~170 ms lần đầu — vẫn giữ luôn-bật vì không có tín
   hiệu nghi ngờ rẻ; đo lại trên máy yên ở đợt sau để có số sạch
   (K8: 15,5 ms).
5. **Chưa đo trên Safari/Firefox thật:** `VideoDecoder` có từ Safari
   15.4+ (WebCodecs); Safari cũ hơn → probe null → bỏ qua (fail-open,
   đã test bằng probe null ở Node + headed). Chưa đo headed Safari —
   không có Safari trên VM này.
6. **Nợ cũ giữ nguyên (không đụng trong luồng này):** cơ chế gốc lần
   đóng băng chạy 1 K8 (§1.4); "155 + http chunked" NOT_MEASURED
   (I8 §4); cutoff `buffered [[0,2.367]]` chưa giải thích (J6 §4);
   guard seekable chưa có đo headed trên app thật (J6 §7.6); file
   nhiều mdat mà mdat thứ hai nằm ngoài tiền tố 512 KiB vẫn fallback
   oan (J6 §7.2).
