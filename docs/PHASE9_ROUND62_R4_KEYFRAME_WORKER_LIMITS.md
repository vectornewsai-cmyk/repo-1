# Phase 9 — Đợt 62, luồng R4: keyframe lớn decode ở worker nền

Ngày: 08/11/2026 (lượt cron 06:35 +07). Đóng nợ đợt 61 §5.7 (LIMITS R7
§6.1): keyframe thật ≳15–16 MiB (lúc yên) vẫn timeout → fail-open trong
trial-decode/GOP. KHÔNG push, KHÔNG release/tag, KHÔNG binary/dist vào
batch. Mọi số dưới đây đều đo/chạy thật; chỗ chưa đo được hoặc chưa giải
thích được thì ghi rõ, không mạo nhận. Giờ trong file này là +07.

## 0. Kết luận ngắn (đọc trước khi trích dẫn)

1. **Đã triển khai WORKER NỀN thật (không tăng trần main-thread):**
   `VideoDecoder` chạy trong DedicatedWorker
   (`gopTrialDecodeWorker62R4.worker.ts`); main thread chỉ spawn worker,
   transfer bản sao sample, nhận verdict, `terminate()` khi xong.
   Quyết bằng bằng chứng (§2): tăng trần main-thread đã bị R7 bác bằng
   số (công thức cho 42 MB chỉ ~12,6 s trong khi decode thực 26–34 s,
   lại kẹt UI); worker cho trần dài mà không kẹt UI, và `terminate()` hủy
   chắc hơn cả `close()` của R7.
2. **Keyframe 42,5 MB trước đây fail-open nay decode-ok thật:**
   `runTrialDecode` qua worker probe trả `decode-ok` sau **10.663,4 ms**
   (trần worker 30 s, lúc yên); T3 end-to-end đường mặc định trên file
   42,5 MB trả `gop-range`, 82 request sample, 42.493.646 byte trong
   19.599 ms (trước đây ~7,7 s fail-open — mở chậm hơn nhưng có verdict
   thật, xem §2.5 về đánh đổi này).
3. **Chỉ sample lớn mới đi worker:** sample mà timeout main-thread đã
   chạm trần 2500 ms (≳ 7,7 MiB với base 200 ms) mới sang worker; sample
   nhỏ hơn giữ nguyên đường main-thread + timeout cũ (không tốn phí
   spawn worker cho mọi lần mở file, không đổi hành vi đường nhỏ). Probe
   inject của caller không bao giờ bị đưa sang worker.
4. **Hủy chắc + rẻ hơn R7:** timeout 500 ms trên 42,5 MB → fail-open
   đúng 501,4 ms, worker terminate ngay; decode nhỏ ngay sau đó chỉ
   **15,6 ms** (R7 đo ~420–480 ms sau `close()` main-thread — xem §2.4,
   có lưu ý về tải khác nhau). Timer 500 ms bắn đúng 501,4 ms trong lúc
   worker đang decode 42,5 MB → main thread không bị kẹt.
5. **Fallback giữ hành vi cũ:** Worker không dựng được (không có Worker
   global / CSP / load lỗi) → probe main-thread với trần 2500 ms cũ.
   Rác 40 MiB với config thật → false nhanh ở cả 3 đường (worker
   421,3 ms, main-thread 97,8 ms, fallback 79 ms).
6. **T3-null 4,9 s của R7 KHÔNG lặp lại lần thứ ba:** T3 null ngay sau
   probe 42,5 MB chỉ **30,6 ms**, 1 request, 262.144 byte — outlier đó
   không phải hành vi hệ thống (xem §2.6).
7. **Test Node mới 19/19; hồi quy GOP đầy đủ 35/35 xanh** (O6 18/18 lần
   này, T3 10/10, R7 6/6). **tsc web: 1 lỗi duy nhất ở file của luồng
   R5 (`bridgeErrors62R5.test.ts`) — không phải file của luồng này,
   không sửa; tsc desktop: 0 lỗi. vite build pass** (worker chunk emit
   `gopTrialDecodeWorker62R4.worker-*.js` 1,50 kB).
8. **Nợ dư trung thực:** trần worker 30 s bao được 42,5 MB lúc yên
   (10,4–19,0 s) nhưng lúc tải nặng decode 42,5 MB đo được 26–35 s
   (main-thread, R7 + đợt này) — sát/vượt trần nên lúc tải nặng vẫn có
   thể fail-open timeout (có lý do rõ ràng, không lặng lẽ). Không nâng
   trần lên 45 s: đánh đổi mở file tới 45 s không xứng với verdict cho
   file hiếm gặp này — quyết này để parent xét lại nếu muốn (xem §6.1).

## 1. Thiết kế

### 1.1 Vì sao không tăng trần main-thread (quyết bằng số, không đoán)

R7 §2.6 đã đo: ngưỡng timeout 2500 ms ở ~15–16 MiB lúc yên, ~3–5 MiB
lúc tải; công thức 0,3 ms/KiB cho 42 MB chỉ ~12,6 s trong khi decode
thực tế lúc tải là 26–34 s. Tăng trần main-thread lên, vd, 30 s sẽ kẹt
đường mở file (T3 `await` trial-decode) tới 30 s trên main thread —
đóng băng UI — mà vẫn không chắc có verdict lúc tải. Worker gỡ được cả
hai vế: trần dài + không kẹt UI. Đây là hướng R7 §6.1 và M10 §8.4 đã
chỉ ra; luồng này triển khai nó.

### 1.2 Cơ chế đã chọn

- **Worker entry** (`gopTrialDecodeWorker62R4.worker.ts`): nhận
  `{sample: ArrayBuffer, config}`, chạy đúng probe production
  `createBrowserTrialDecodeProbe()` trong worker (cùng `isConfigSupported`
  → `configure` → `decode` 1 key chunk → `flush`), trả
  `{type:"result", outcome}` hoặc `{type:"error", message}`. Worker
  không tự terminate — main thread terminate (1 worker / 1 lần gọi,
  không giữ worker dùng chung để tránh state rò rỉ giữa các lần mở file).
- **Probe worker** (`createWorkerTrialDecodeProbe(factory?, fallback?)`):
  spawn worker, transfer **bản sao** sample (`sample.slice()` — buffer
  gốc của caller không bị neuter, khóa bằng test), nhận verdict rồi
  `terminate()`; worker lỗi/load lỗi → chạy probe fallback (mặc định:
  probe main-thread) và trả outcome của nó; không có fallback thì reject
  để `runTrialDecode` fail-open dạng probe-error. Signal abort →
  `terminate()` ngay + reject (runTrialDecode đã gắn `.catch(()=>{})`
  nên reject sau timeout không gây unhandled rejection — mẫu R7).
  Không có `Worker` global mà không có factory inject → trả null để
  caller dùng probe main-thread.
- **Routing** (`planTrialDecodeCall`, dùng ở cả 2 điểm gọi T3 —
  stream-mode và all-mode): chỉ khi (a) caller dùng probe mặc định
  (`opts.trialDecodeProbe === undefined` — probe inject giữ nguyên),
  và (b) timeout main-thread của sample đã chạm trần 2500 ms, thì mới
  đi worker với timeout worker; ngược lại giữ nguyên probe + timeout
  main-thread. Không dựng được worker probe → về đường main-thread cũ,
  kèm `workerUnavailableReason: "no-worker"`.
- **Timeout worker** (`trialDecodeTimeoutForSampleSizeWorker`): cùng dạng
  công thức với main-thread nhưng tỉ lệ **1,0 ms/KiB** (≈ 2× tốc độ
  decode chậm nhất đo được ở keyframe lớn: 0,5–0,8 ms/KiB ở 37–42 MB
  lúc tải — R7 §2.1; công thức cũ 0,3 ms/KiB đánh giá thấp keyframe
  khổng lồ, R7 §2.6) và trần **30 s**. Ví dụ (base 200): 4.107.475 B →
  3956 ms; 9.683.047 B → 9401 ms; 42.493.646 B → 30.000 ms (trần).
  Rác lớn vẫn fail NHANH (decoder lỗi trong vài ms–0,4 s) nên trần dài
  không làm rác lọt.
- Không đổi: cap sample 64 MiB (Q5), timeout main-thread 2500 ms,
  fail-open, logic gate, AVCC, T3/fetch. Không thêm key i18n nào
  (lý do `timeout-<ms>ms` dùng lại key `gop.trial.timeout` có sẵn với
  biến timeout) nên không có fragment i18n.

## 2. Đo headed thật (Xvfb riêng, Chromium headed, TMPDIR riêng)

Hai lượt probe, cổng/display riêng mỗi lượt: chính `:194` 8929/9425,
bổ sung `:195` 8931/9427. Fixture MP4 cũ dùng lại (P6/Q5/R7, KHÔNG đưa
binary vào batch). **Bối cảnh tải (quan trọng khi đọc số):** lượt chính
bắt đầu lúc loadavg ~0,85 nhưng leo lên **10–16** trong ~5 phút đầu
(các luồng đợt 62 khác chạy song song — chromeCPU% chỉ ~27–32%),
rồi rơi về **~0,3** từ giữa lượt; vòng hiệu chuẩn CPU (busy-loop 50M,
chỉ xu hướng tương đối): đầu **5286,4 ms**, cuối **2003,9 ms** — CPU khả
dụng tăng ~2,6× trong lượt. Hệ quả: đường cong main-thread (đo đầu,
lúc tải) chậm hơn nhiều so với idle; đường cong worker (đo sau, lúc
yên dần) nhanh hơn một phần nhờ tải rơi — **không được so sánh trực
tiếp main vs worker ở cỡ lớn để kết luận worker decode nhanh hơn**
(decode cùng decoder, cùng máy; worker chỉ gỡ kẹt UI + cho trần dài).
So sánh sạch duy nhất là cặp control nhỏ đầu lượt (cùng lúc tải) và
cặp control nhỏ lúc yên ở lượt bổ sung (§2.7).

### 2.1 Đường cong decode main-thread (đối chứng, ×3, lúc tải 10–16 → rơi)

| File | Size (byte) | Decode lần lượt (ms) | Median | R7 lúc yên |
|---|---|---|---|---|
| bigkey-4k (4K) | 300.148 | 605,0 / 1095,8 / 1068,6 | 1068,6 | 72,0 |
| bigkey-4k-noisy (4K) | 4.107.475 | 3370,2 / 3491,8 / 2899,8 | 3370,2 | 604,5 |
| bigkey-4k-noisy60 (4K) | 9.683.047 | 11967,0 / 8814,4 / 13791,2 | 11967,0 | 1961,2 |
| bigkey-8k-noisy (8K) | 19.720.025 | 13011,2 / 14904,7 / 9098,9 | 13011,2 | 2958,5 |
| bigkey-8k-noisy60 (8K) | 30.727.296 | 21730,5 / 15071,9 / 7465,5 | 15071,9 | ~5–7,8 s (tải) |
| bigkey-8k-noisy80 (8K) | 37.168.458 | 7160,2 / 8289,1 / 19793,5 | 8289,1 | ~20,5 s (tải) |
| bigkey-8k-noisy100 (8K) | 42.493.646 | 34986,3 / 30409,0 / 20500,2 | 30409,0 | 26–33,6 s (tải) |

Đọc đúng: số tuyệt đối lúc tải cao gấp ~4–15× lúc yên (300 KiB:
1069 ms so với 72 ms) — đây là nhiễu tải, không phải hồi quy (đường
decode không đổi; lần decode đầu 29 KB ra 228,3 ms cũng là warm-up +
tải). Spread lớn ở cỡ lớn (7,5–21,7 s ở 30,7 MB; 20,5–35,0 s ở
42,5 MB) phản ánh đúng lúc tải đang rơi giữa các lần đo. Số này dùng
để chốt trần worker (§2.3), không dùng làm tốc độ chuẩn.

### 2.2 Đường cong decode WORKER (×3; 42,5 MB ×2 + 1 lần ở §2.3)

| File | Size (byte) | Decode lần lượt (ms) | Median |
|---|---|---|---|
| bigkey-4k (4K) | 300.148 | 922,5 / 370,5 / 318,6 | 370,5 |
| bigkey-4k-noisy (4K) | 4.107.475 | 1862,2 / 1602,7 / 2098,4 | 1862,2 |
| bigkey-4k-noisy60 (4K) | 9.683.047 | 4627,9 / 5675,5 / 5016,3 | 5016,3 |
| bigkey-8k-noisy (8K) | 19.720.025 | 10215,9 / 13074,5 / 8794,1 | 10215,9 |
| bigkey-8k-noisy60 (8K) | 30.727.296 | 26605,1 / 23492,7 / 15979,0 | 23492,7 |
| bigkey-8k-noisy80 (8K) | 37.168.458 | 24012,3 / 11738,7 / 21446,5 | 21446,5 |
| bigkey-8k-noisy100 (8K) | 42.493.646 | 19018,9 / 10377,1 | ~14,7 s (trung bình) |

Tất cả outcome `true`. Worker decode được mọi cỡ (VideoDecoder chạy
trong worker thật — không phải setTimeout giả). Tỉ lệ decode ở worker
lúc yên dần: 4,1 MB ~0,45 ms/KiB; 9,7 MB ~0,53; 19,7 MB ~0,53;
30,7 MB ~0,78; 37,2 MB ~0,59; 42,5 MB ~0,35–0,45 — cùng bậc với
main-thread lúc tải (0,5–0,8 ms/KiB, R7), xác nhận tỉ lệ timeout worker
1,0 ms/KiB có ~1,3–2× headroom so với số đo (9,7 MB: timeout 9401 ms
so với median 5016 ms; 19,7 MB: ~19,5 s so với 10.216 ms; 30,7 MB:
~29,7 s so với 23.493 ms — đoạn này headroom mỏng nhất, ~1,3×).

### 2.3 Verdict thật cho keyframe 42,5 MB (kết quả chính)

- `planTrialDecodeCall` cho sample 42.493.646 B: `viaWorker: true`,
  `timeoutMs: 30000`.
- `runTrialDecode` qua worker probe: trả về sau **10.663,4 ms**,
  `passed: true, skipped: false, reason: "decode-ok"` — lần đầu tiên
  keyframe 42,5 MB có verdict thật thay vì fail-open timeout-2500ms.
- T3 end-to-end đường mặc định trên file 42,5 MB: **19.599 ms**,
  `mode: gop-range`, 82 request sample, 42.493.646 byte (fetch 82 chunk
  + worker decode ~10,7 s + overhead). So với R7 (7.672,9 ms fail-open):
  mở file chậm thêm ~12 s nhưng có verdict thật. Xem §2.5.

### 2.4 Abort worker + chi phí sau abort

- `runTrialDecode` worker probe 42,5 MB, timeout 500 ms: trả về sau
  **501,4 ms**, `passed: true, skipped: true`,
  `reason: timeout-500ms` fail-open; worker terminate ngay (probe
  settle cùng lúc, không còn decode nền).
- Decode nhỏ (29 KB) ngay sau abort: **15,6 ms** (outcome true) —
  nhanh hơn hẳn chi phí một lần sau abort của R7 (~420–480 ms sau
  `close()` main-thread). Lưu ý: lần này đo lúc VM yên (loadavg
  ~0,3–4) trong khi R7 đo lúc tải cao (13–18) nên không kết luận
  tuyệt đối rằng terminate rẻ hơn close() đúng ~30×; hướng thì rõ:
  terminate worker không để lại decoder main-thread cần teardown, và
  không có lần decode nào sau abort bị chậm bất thường trong lượt này.
- Timer 500 ms bắn đúng 501,4 ms trong lúc worker đang decode 42,5 MB
  → main thread không bị kẹt trong khi decode chạy ở worker (bằng chứng
  gián tiếp nhưng đo được; không đo FPS UI trực tiếp).

### 2.5 Đánh đổi mở file chậm hơn (ghi rõ, không giấu)

File có keyframe 0 > ~7,7 MiB nay mở chậm hơn: T3 42,5 MB mất 19,6 s
thay vì 7,7 s fail-open. Đây là giá của verdict thật — file vẫn mở
được (fail-open nếu timeout), UI không đóng băng (decode ở worker),
và chỉ file keyframe khổng lồ (8K/bitrate rất cao, hiếm) mới chạm
tới; file thường (sample 0 ≤ 7,7 MiB) không đổi gì. Nếu parent thấy
19,6 s là quá chậm thì hướng giảm là hạ trần worker (đổi lấy verdict
ít hơn), không phải quay về main-thread.

### 2.6 T3-null 4,9 s của R7 — không lặp lại (lần thứ ba)

T3 null ngay sau probe 42,5 MB: **30,6 ms**, 1 request, 262.144 byte,
`mode: gop-range`. R7 đã đo lại 3 lần (375–613 ms); lần này 30,6 ms
(lúc yên). Kết luận giữ nguyên: 4,9 s là outlier cùng lớp với 19,8 s
của Q5 (nhiễu nhất thời dưới tải + heap lớn), không phải hành vi của
đường null, không dùng làm số đại diện. Nguyên nhân gốc chính xác của
lần 4,9 s đó vẫn chưa xác định được — ghi rõ, không đoán.

### 2.7 Lượt bổ sung — sửa test rác + phí spawn lúc yên

Bước rác ở lượt chính dùng config giả (avcC tự chế 8 byte, codec
`avc1.64001F`, 7680×4320) nên `isConfigSupported` trả unsupported ngay:
worker 43,2 ms → `"unsupported-config"`, fallback 0,5 ms →
`"unsupported-config"` — chỉ đo được cổng config, không đo được đường
decode-failed. Lượt bổ sung dùng config THẬT của track 8K (codec
`avc1.64003C`, 7680×4320, avcC 49 byte) + rác 40 MiB ngẫu nhiên:

| Đường | Thời gian | Outcome |
|---|---|---|
| Worker probe + config thật | 421,3 ms | `false` (decode-failed) |
| Main-thread probe + config thật | 97,8 ms | `false` (khớp R7: 97,3 ms) |
| Fallback (factory ném lỗi) + config thật | 79,0 ms | `false` |

Rác lớn vẫn fail nhanh ở cả 3 đường — trần worker dài không làm rác
lọt, fallback giữ được fast-fail. Bài học ghi lại: test rác phải dùng
config thật của track, không dùng avcC tự chế (test Node R4 không mắc
lỗi này vì dùng FakeWorker; chỉ probe headed mắc).

Phí spawn worker lúc yên (decode nhỏ 29 KB ×3, lượt bổ sung):
worker 197,5 / 108,6 / 129,4 ms (median 129,4) so với main-thread
20,7 / 38,3 / 8,1 ms (median 20,7) → phí spawn + transfer + roundtrip
≈ **~109 ms lúc yên**. Lúc tải cao (lượt chính, loadavg ~16) worker
nhỏ mất 511,1 / 866,7 / 700,6 ms (median 700,6) — spawn dưới tải rất
đắt. Đây là lý do worker CHỈ dùng cho sample lớn (decode đã tính bằng
giây, phí spawn ~0,1–0,9 s là chấp nhận được), không dùng cho mọi lần
mở file.

## 3. Test Node mới `gopTrialDecode62R4.test.ts` — 19/19

Đỏ-trước đã verify: chạy suite mới TRƯỚC khi viết module production →
esbuild lỗi "không resolve được `./gopTrialDecodeWorker62R4.ts`" (1 error).
Sau khi viết code: **19/19**.

- Timeout worker: ≤ 256 KiB → base; 4.107.475 B → 3956 ms; 42.493.646 B
  → trần 30.000 ms; 64 MiB → trần; base không hợp lệ → 200 ms.
- Routing: sample nhỏ → main-thread (timeout 212 ms); sample
  9.683.047 B → worker (timeout 9401 ms); probe inject + sample lớn →
  giữ probe inject, trần 2500 ms; không có Worker (Node) → fallback
  main-thread, lý do `"no-worker"`; defaultProbe null + có factory →
  vẫn đi worker.
- Worker probe với FakeWorker: decode-ok → true, terminate đúng 1 lần,
  sample gốc không bị neuter (transfer bản sao, khác buffer); outcome
  `"unsupported-config"` giữ nguyên; worker báo lỗi / onerror / factory
  ném lỗi → fallback main-thread; factory ném lỗi + không fallback →
  reject; abort → terminate ngay + reject, không chờ worker trả lời.
- Tích hợp `runTrialDecode` + worker probe treo → timeout 50 ms
  fail-open + terminate 1 lần; worker trả false nhanh → decode-failed.
- Không factory + không có Worker global (Node) → null.

## 4. Kiểm chứng gộp của luồng

- Hồi quy GOP đầy đủ (script `~/scratch-round62-r4/
  run-regression-r4.sh`, sao từ R7 + thêm dòng R4): U2 20/20, T3
  10/10, V2 16/16, W4 15/15, X4 10/10, A4 18/18, B4 13/13, C5
  11/11, Z4 19/19, Y4 10/10, E2blob 8/8, E2i18n 3/3, F4 6/6, H4
  8/8, I6 25/25, K8 18/18, reversePlayback 10/10,
  reversePreviewGate 12/12, A6 12/12, Y6 11/11, D4 3/3, B6 8/8,
  Z6 10/10, saveToast31 15/15, structuredNotes32 12/12,
  errorDetail34Q4 35/35, L8 23/23, M10 28/28, N10 17/17, N6 32/32,
  O6 18/18 (lần này không flake), P6 16/16, Q5 15/15, R7 6/6,
  **R4 19/19**. Log `regression-r4.log`.
- Headed (Xvfb riêng, TMPDIR riêng): §2. Log `headed-r4.log`,
  `headed-r4b.log`.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: **1 lỗi duy nhất ở
  file của luồng R5** (`src/lib/bridgeErrors62R5.test.ts(15,10):
  'existsSync' is declared but its value is never read`) — các luồng
  đợt 62 khác đang chạy song song; file của luồng này 0 lỗi (đã lọc
  riêng: không có lỗi nào ở `gopTrialDecode*` / `gopRangeFetch39T3.ts`).
  Không sửa file R5 (không phải phạm vi luồng này).
  `npx tsc --noEmit -p apps/desktop/tsconfig.json`: **0 lỗi**.
- `vite build` (chạy từ `apps/web`, outDir scratch
  `~/scratch-round62-r4/build`): **pass** trong 22,57 s; worker chunk
  emit `assets/gopTrialDecodeWorker62R4.worker-DvsAAzGW.js` (1,50 kB,
  đã đọc nội dung: đúng probe VideoDecoder thật + onmessage); chỉ cảnh
  báo chunk > 500 kB và dynamic-import có sẵn.
- Hạn chế harness: esbuild KHÔNG bundle `new Worker(new URL(...
  .ts))` (giữ nguyên câu lệnh) nên probe headed không dùng được factory
  mặc định production — đã inject factory load worker bundle riêng
  (`/worker.mjs`, cùng source worker, bundle bằng esbuild). Đường load
  Vite production đã verify bằng vite build (chunk worker emit +
  `index-*.js` tham chiếu đúng tên file). Không phải bug sản phẩm.

## 5. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

MỚI:

- `apps/web/src/lib/gopTrialDecodeWorker62R4.ts` — probe worker,
  timeout worker, `planTrialDecodeCall`, giao thức worker.
- `apps/web/src/lib/gopTrialDecodeWorker62R4.worker.ts` — worker entry
  (chạy probe production trong DedicatedWorker).
- `apps/web/src/lib/gopTrialDecode62R4.test.ts` — 19 test (§3).
- `docs/PHASE9_ROUND62_R4_KEYFRAME_WORKER_LIMITS.md` — LIMITS này.

ĐỔI:

- `apps/web/src/lib/gopRangeFetch39T3.ts` — 2 điểm gọi trial-decode
  (stream-mode + all-mode) dùng `planTrialDecodeCall` (probe + timeout
  theo sample); import thêm plan, bỏ import
  `trialDecodeTimeoutForSampleSize` (không còn dùng trực tiếp); cập
  nhật 2 comment (Q5/O6) cho đúng hành vi mới. Không đổi logic gate,
  fetch, AVCC, fail-open.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (tiền lệ
  J6/K8/L8/M10/N10/O6/P6/Q5/R7).

KHÔNG ĐỔI: `gopTrialDecode55L8.ts` (probe/timeout main-thread giữ
nguyên), mọi file production khác, `mp4Demux.ts`, `vi.json`/`en.json`
(không có chuỗi UI mới — không cần fragment i18n). Scratch + log ở
`~/scratch-round62-r4/` (probe headed ×2 + runner, regression,
red-before, build; file MP4 lớn chỉ làm fixture đo, KHÔNG đưa vào
batch).

## 6. Nợ mở / rủi ro dư (không mạo nhận đã xong)

1. **Trần worker 30 s có thể không đủ cho keyframe 42–64 MiB lúc tải
   nặng:** decode 42,5 MB lúc tải đo được 26–35 s (main-thread, R7 +
   đợt này — median 30,4 s ≈ trần). Lúc yên thì bao thoải mái (10,4–
   19,0 s). Lúc tải nặng vẫn fail-open timeout (có lý do rõ ràng).
   Không nâng trần lên 45 s trong luồng này (đánh đổi mở file tới 45 s
   cho file hiếm — cần quyết của parent, xem §2.5). Nếu parent muốn
   bao chắc hơn thì nâng `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS` là đủ
   (không cần đổi kiến trúc).
2. **Headroom timeout worker mỏng ở 30,7 MB:** timeout ~29,7 s so với
   decode đo được 16,0–26,6 s (chỉ ~1,3×). Lúc tải nặng hơn nữa có thể
   chạm trần. Theo dõi ở đợt sau; nếu lặp lại thì tăng tỉ lệ 1,0 →
   1,2 ms/KiB (chỉ đổi hằng số + test).
3. **T3-null 4,9 s vẫn chưa rõ nguyên nhân gốc** (R7 §6.5): đã đo 4
   lần đều nhanh (30,6–613 ms) nên không phải hành vi hệ thống; nguyên
   nhân chính xác của lần 4,9 s đó chưa xác định được. Không dùng làm
   số đại diện.
4. **Chi phí một lần sau abort của R7 (~0,3–0,5 s) nay chỉ còn ~16 ms
   qua worker** (§2.4) — nhưng 2 lần đo ở tải khác nhau nên chưa khóa
   chắc tỉ lệ; đợt sau đo lại cùng tải nếu cần số chính xác.
5. **Chưa đo Safari/Firefox thật** (không có trên VM); `Worker` +
   `VideoDecoder` trong worker là hành vi Chromium đã đo. Trình duyệt
   không có Worker → fallback main-thread (đã khóa bằng test Node +
   code); trình duyệt có Worker nhưng không có VideoDecoder trong
   worker → worker trả error → fallback main-thread (chưa đo thật).
6. **Heap cuối trang headed 395,2 MB** (từ 0,7 MB đầu lượt): probe giữ
   nhiều sample trong scope qua các bước + GC chưa chạy — cùng lớp với
   298,7 MB của R7, là artifact của harness đo (giữ fixture 42 MB ×
   nhiều bước), không phải leak của đường T3 sản phẩm (T3 không giữ
   sample sau khi trả về). Không sửa trong luồng này.
7. **Nợ cũ giữ nguyên (không đụng trong luồng này):** sample > 64 MiB
   vẫn bỏ qua trial-decode (Q5); keyframe thật bị đục lỗ giữa KHÔNG bắt
   chắc được (Q5 §6.3, O6 §6.1); `.github/workflows/ci-security.yml`
   403 chưa lên GitHub (repo vẫn chưa có CI chạy thật); các nợ M10 §8,
   N10 §6, O6 §6, P6 §6, Q5 §6, R7 §6 (trừ §6.1 đã đóng ở đây: keyframe
   lớn fail-open → nay có verdict qua worker lúc yên) giữ nguyên.
