# Phase 9 đợt 73 — A7: Keyframe — trần 90 s + audit Safari

Ngày: 09/11/2026, lượt cron 15:35 +07. Repo `~/workspace/repo-1`.
Đóng nợ đợt 72 §4 mục 7 ("Keyframe: trần 90 s đã xác nhận không bao giờ
là ràng buộc; Safari chưa đo được").

**Kết luận ngắn:**
1. **Trần 90 s KHÔNG ràng buộc ở đâu.** Đây là
   `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS = 90_000` (trial-decode keyframe
   codec lớn ở worker nền). Với mọi sample pipeline có thể gửi (cap T3
   64 MiB), công thức timeout cho tối đa **78.536 ms < 90.000 ms**
   (biên 11.464 ms). Trần chỉ bắt đầu cắt ở sample ≈ 73–74 MiB — ngoài
   miền cho phép. Test khóa 18/18.
2. **Keyframe animation (clip dài > 90 s) nội suy đúng.** Không có hằng
   số 90 s nào trong đường nội suy TS / mirror JS render / speed curve /
   panel / FFmpeg expr: ràng buộc duy nhất của `keyframe.t` là
   `[0, duration của clip]`. Test khóa timestamp tới 3600 s.
3. **Safari vẫn CHƯA đo được** (không có Safari/WebKit thật trên VM
   Linux — không claim số đo Safari nào). Audit tĩnh tìm ra 1 lỗi
   chắc-chắn-vỡ đã vá (nhãn MIME media mẫu), 3 lỗi có-thể-vỡ đã vá
   (roundRect, backdrop-filter, 100dvh) + danh sách API đã có fallback.
   Rủi ro lớn nhất còn lại: file VP9/WebM/AV1 của user có thể không
   phát được trên Safari cũ (không có codec-probe lúc import).

## 1. Audit trần 90 s — đường trial-decode keyframe codec

"Keyframe" ở đây là keyframe của video codec (sample 0 của file), không
phải keyframe animation của editor (xem §2).

### 1.1 Chuỗi code path (production)

| Bước | File:dòng | Nội dung |
|---|---|---|
| Cap sample | `apps/web/src/lib/gopRangeFetch39T3.ts:372` | `MAX_TRIAL_DECODE_SAMPLE_BYTES = 64 * 1024 * 1024` — sample > 64 MiB không bao giờ vào trial-decode |
| Trần worker | `apps/web/src/lib/gopTrialDecodeWorker62R4.ts:104` | `MAX_WORKER_TRIAL_DECODE_TIMEOUT_MS = 90_000` |
| Công thức | `apps/web/src/lib/gopTrialDecodeWorker62R4.ts:134-149` | `trialDecodeTimeoutForSampleSizeWorker`: `min(200 + ceil((bytes − 256 KiB)/1024 × 1,2), 90_000)` |
| Định tuyến | `apps/web/src/lib/gopTrialDecodeWorker62R4.ts:285-324` | `planTrialDecodeCall`: chỉ sample mà timeout main-thread đã chạm trần 2500 ms mới đi worker; không dựng được worker → về main-thread + `workerUnavailableReason: "no-worker"` |
| Gọi | `apps/web/src/lib/gopRangeFetch39T3.ts:1753, 1792, 1948` | T3 gọi `planTrialDecodeCall` sau khi kiểm `s0.size <= MAX_TRIAL_DECODE_SAMPLE_BYTES` |
| Ép timeout | `apps/web/src/lib/gopTrialDecode55L8.ts:375-435` | `runTrialDecode`: `Promise.race` probe vs `setTimeout(timeout)`; timeout thắng → abort signal → `worker.terminate()` + fail-open `timeout-<ms>ms` |
| Trần main-thread | `apps/web/src/lib/gopTrialDecode55L8.ts:130-134` | `MAX_TRIAL_DECODE_TIMEOUT_MS = 2500`, tỉ lệ 0,3 ms/KiB (đường nhỏ, không liên quan trần 90 s) |
| Worker entry | `apps/web/src/lib/gopTrialDecodeWorker62R4.worker.ts` | Worker KHÔNG tự ép timeout — main thread ép qua `runTrialDecode`; worker chỉ decode + trả verdict |

### 1.2 Chứng minh trần không bao giờ ràng buộc (tính bằng code thật)

| Sample | Công thức (ms) | Trần 90 s có cắt? |
|---|---|---|
| ≤ 256 KiB | 200 (base) | Không |
| 8 MiB | 9.724 | Không |
| 32 MiB | 39.215 | Không |
| **64 MiB (cap T3)** | **78.536** | **Không — biên 11.464 ms** |
| 73 MiB | 89.596 | Không (vẫn dưới trần) |
| 74 MiB | 90.824 → kẹp về 90.000 | **Có — nhưng ngoài miền T3 cho phép** |

Trần chỉ là trần an toàn tuyệt đối, không phải ràng buộc hiệu năng:
miền vào của công thức bị chặn cứng ở 64 MiB bởi T3, mà công thức đạt
trần lần đầu ở ≈ 73–74 MiB. **Điều kiện để kết luận này còn đúng: cap
T3 phải giữ ≤ 73 MiB** — test khóa `MAX_TRIAL_DECODE_SAMPLE_BYTES`
đúng 64 MiB (xem §3) nên nếu ai nâng cap T3 lên ≥ 74 MiB, test sẽ
báo ngay ở assert hằng số.

Lưu ý trung thực: trần 90 s không ràng buộc ≠ trial-decode luôn kịp.
Dưới tải cực nặng (1,6–2,1 ms/KiB, đợt 64 R10) keyframe 64 MiB cần
~105–137 s > 90 s → vẫn timeout → fail-open đúng thiết kế (đợt 67 U5
§1.2 đã quyết không kéo trần thêm). Trần 90 s chỉ bảo đảm không cắt
sample nào trong dải cho phép ở tải thấp/trung bình.

### 1.3 Sửa doc trong đợt này

- `apps/web/src/lib/gopRangeFetch39T3.ts:514` — comment cũ ghi "trần
  riêng 60 s (…đợt 64 R10 nâng lên 60 s)" đã lỗi thời từ đợt 67 U5
  (nâng lên 90 s). Đã sửa thành 90 s + trích U5 + xác nhận A7.
  Chỉ sửa comment, không đổi hành vi.

## 2. Audit keyframe animation — không có trần 90 s nào

Đã grep toàn repo (`keyframe|clamp|90|duration|interpolat`) qua
`apps/web/src`, `packages/video-spec/src`, `server/render/src`,
`scripts`, `server/bridge`. Mọi chỗ clamp/giới hạn thời gian keyframe:

### 2.1 Nội suy (không có hằng thời gian tuyệt đối)

| File:dòng | Hàm | Ràng buộc thời gian |
|---|---|---|
| `packages/video-spec/src/keyframes.ts:133-153` | `interpolateKeyframes(kfs, t)` | Không có. `p = (t − a.t)/(b.t − a.t)` thuần số học; chỉ clamp `p` về [0,1] trong `applyEasing` (dòng ~95) và clamp giá trị về keyframe biên ngoài khoảng |
| `packages/video-spec/src/keyframes.ts:110-129` | `normalizeKeyframes` | Sort theo `t`, trùng `t` thì sau thắng; lọc entry lỗi. Không giới hạn `t` |
| `server/render/src/keyframes.js:90-112` | `interpolateKeyframes` (mirror) | Y hệt bản TS (đã kiểm bằng test §3, cả ease-in/out) |
| `packages/video-spec/src/speedcurve.ts:158-175` | `speedAt` | Cùng mẫu: ngoài khoảng clamp về `v` biên. Không giới hạn `t` |
| `apps/web/src/lib/previewEngine.ts:119-147` | `memoInterpolateKeyframes` | Cache theo `Math.round(t × 120)` (frame index 120 Hz, 256 entry/mảng, FIFO) — với t = 3600 s thì frame = 432.000, vẫn là key Map thường, không tràn/kẹp |
| `apps/web/src/lib/previewEngine.ts:1755-1781` | `interpolateTrackPoints` | Tuyến tính giữa 2 điểm track, kẹp ngoài khoảng. Không giới hạn `t` |
| `apps/web/src/lib/audioEngine.ts:83-107` | `interpolateVolumeKeyframes` | Gọi `interpolateKeyframes` + fallback easing lạ → linear. Không giới hạn `t` |
| `apps/web/src/lib/twoLevelCurve.ts:173-550` | speed curve 2 tầng | Chỉ `normalizeSpeedKeyframes` + `speedAt`; không giới hạn `t` |

### 2.2 Validate / sanitize / UI — bound duy nhất là duration của clip

| File:dòng | Ràng buộc |
|---|---|
| `packages/video-spec/src/keyframes.ts:205` + `server/render/src/keyframes.js:146-152` (`validateAnimations`) | `kf.t ∈ [0, duration]` — duration lấy từ clip, không có hằng số trần |
| `packages/video-spec/src/keyframes.ts:186` (`MAX_KEYFRAMES_PER_PROP = 128`) | Trần **số lượng** keyframe/prop (tránh biểu thức FFmpeg phình), không phải trần thời gian |
| `apps/web/src/components/keyframes/KeyframePanel.tsx:129, 146, 167, 188, 214, 219` | Mọi clamp `t` đều là `clamp(t, 0, clip.duration)` (thêm/drag/sửa keyframe, `laneTime` map theo `clip.duration`) |
| `apps/web/src/components/keyframes/KeyframeGraph.tsx:76-85` | Lấy mẫu ~80 điểm qua `interpolateKeyframes` trên `[0, duration]` |
| `apps/web/src/lib/curveFix.ts:690+` (`sanitizeOneKeyframe`, speed curve) | Chỉ sửa thứ tự/tính đơn điệu của `t`, không kẹp `t` theo hằng số |
| `apps/web/src/store.ts:1510-1539` (cap τ nested trim) | Cap duration theo lượng nguồn còn lại qua đảo tích phân curve — cap theo nội dung, không phải 90 s |

### 2.3 Render (FFmpeg expr) — timestamp > 90 s đi thẳng vào biểu thức

| File:dòng | Nội dung |
|---|---|
| `server/render/src/keyframes.js:164-193` (`buildInterpExpr`) | Sinh `if(lt(tc,T), seg, …)` với `T = ffNum(t)` (làm tròn 1e-6, không đổi dạng số lớn); ngoài khoảng clamp về giá trị biên bằng `lt/gt` |
| `server/render/src/keyframes.js:276-320` (`buildKeyframeTransform`) | Scale `eval=frame` + clamp giá trị scale về [0.01, 8] (clamp **giá trị**, không phải thời gian); rotation `*PI/180` |
| `server/render/src/audiomix.js:41-90` (`buildVolumeInterpExpr`) | Mirror `buildInterpExpr` cho volume, dùng `t` trực tiếp; không giới hạn `t` |
| `server/render/src/render.js:780-782, 803, 870-922` | Gọi 3 builder trên với `t` cục bộ của clip / `(t − clipStart)`; không kẹp thời gian |

Không tìm thấy hằng số 90 / 90_000 / 90000 nào khác ngoài trần worker
§1 (grep `90_000|90000` toàn repo, trừ test + ví dụ `maxAge` của
express trong node_modules).

## 3. Kiểm chứng (chạy thật trên VM này)

Test mới `apps/web/src/lib/keyframeBeyond90Round73A7.test.ts` — **18/18
pass** (bundle esbuild, mẫu 62R4/64R10):
- (A1) TS linear keyframe 0/90/180/300 s: t = 95/120/150/270 đúng từng
  số; clip 1 giờ (0→3600): t = 1800 → 50, t = 3599 → 99,972…, t = 3600
  → 100, t = 7200 clamp về 100; ease-in/ease-out đoạn [90,180] tại
  t = 135 → 25 / 75; 1 keyframe ở t = 200 → hằng số tới t = 3600;
  trùng t sau 90 s: sau thắng + nội suy tiếp đúng (t = 210 → 64,5).
- (A2) `validateAnimations`: clip 300 s chấp nhận t = 150/300, chặn
  t = 301 với `[0, 300]`; clip 3600 s chấp nhận t = 3599; clip 90 s
  chặn t = 91 — chứng tỏ bound đi theo duration, không phải hằng 90.
- (A3) `speedAt` curve 0/120/240 s: t = 150 → 2,5; t = 300/3600
  clamp về 4.
- (A4) Mirror JS render: nội suy t = 150/3600 khớp TS; biểu thức
  FFmpeg chứa đúng `lt(t,180)`, `lt(t,300)`, `lt(t,240)` (scale
  transform); `validateAnimations` JS duration 300 chấp nhận t = 150,
  chặn t = 301.
- (B) Trần worker: hằng số 90_000 đúng; cap T3 đúng 64 MiB; công thức
  ở 64 MiB = **78.536 ms**, biên **11.464 ms**; 32 MiB = 39.215 ms
  (đơn điệu); 73 MiB = 89.596 ms < trần, 74 MiB kẹp đúng về 90.000;
  `planTrialDecodeCall` sample 64 MiB → `viaWorker: true`,
  `timeoutMs: 78.536`; sample 1 MiB → main-thread, timeout ≤ 2500.

Hồi quy chạy lại sau sửa:
- `keyframeNormalizeRound50F1.test.ts`: 11/11.
- `gopTrialDecode62R4.test.ts`: 19/19; `64R10`: 11/11; `67U5`: 11/11.
- `canvasRoundRect73A7.test.ts`: 3/3; `sampleMime73A7.test.ts`: 4/4.
- `server/render/src/keyframes.js --self-test`: pass.
- `tsc --noEmit` (apps/web): **0 lỗi**; `vite build`: **pass** (21,73 s).

## 4. Audit Safari — không có Safari thật, chỉ audit tĩnh

Phương pháp: grep `webkit|AudioContext|VideoDecoder|VideoEncoder|
requestVideoFrameCallback|OffscreenCanvas|createImageBitmap|
MediaRecorder|showOpenFilePicker|ctx.filter|roundRect|webgl|
MediaSource|SharedArrayBuffer|AudioWorklet|canPlayType|navigator.gpu|
structuredClone|randomUUID|BroadcastChannel|playsInline|captureStream|
backdrop-filter|100dvh|:has(|color-mix|aspect-ratio|ResizeObserver|
clipboard|popover` trên `apps/web/src`, `packages/video-spec/src`,
`server/render/src`. Phân loại theo hành vi trên Safari thật (chưa đo
— mọi "phiên bản Safari" dưới đây là kiến thức API công khai, không
phải số đo; cần đo lại khi có Safari thật).

### 4.1 Chắc-chắn-vỡ — đã vá trong đợt này (1 mục)

| # | Vấn đề | File:dòng | Vá |
|---|---|---|---|
| S1 | Media mẫu bị gán nhãn MIME sai trên Safari: danh sách mime chỉ có webm (`sampleMedia.ts:161`, `sample.ts:79`); Safari `isTypeSupported("video/webm…")` = false → `new MediaRecorder(stream)` dùng mặc định **video/mp4**, nhưng code cũ vẫn đóng `Blob`/`File` với `{ type: "video/webm" }` hard-code → blob URL mang type sai, `<video>` trên Safari không phát được media mẫu (template pack + project mẫu). Trên Chromium mime đã là webm nên không lộ. | `apps/web/src/lib/sampleMedia.ts:188-190`, `apps/web/src/sample.ts:109` (cũ) | Mới `apps/web/src/lib/sampleMime.ts`: `recorderContainerType(rec.mimeType)` — lấy container thật từ recorder (`video/webm;codecs=vp9` → `video/webm`, `video/mp4` → `video/mp4`); Chromium không đổi hành vi. Test `sampleMime73A7.test.ts` 4/4. **Còn tồn đọng:** tên file vẫn `.webm` do caller đặt (`templatePack.ts:159`, `sample.ts` đặt `mau-*.webm`) — chỉ sửa nhãn MIME, chưa sửa đuôi tên (đổi tên đụng contract `GeneratedMedia`/manifest mẫu, để đợt riêng). |

### 4.2 Có-thể-vỡ — đã vá trong đợt này (3 mục)

| # | Vấn đề | File:dòng | Vá |
|---|---|---|---|
| S2 | `ctx.roundRect` chỉ có từ Safari 16. Text clip có `backgroundColor` gọi thẳng `ctx.roundRect` → trên Safari < 16 ném TypeError mỗi frame có clip đó (vòng lặp rAF sống sót nhờ `finally → scheduleNext` ở `preview.tsx` ~4004, nhưng hộp nền chữ không vẽ được + console spam). | `apps/web/src/preview.tsx:741, 794` (cũ) | Mới `apps/web/src/lib/canvasRoundRect.ts`: `pathRoundRect` feature-detect tại chỗ — có thì `roundRect`, không thì `ctx.rect` (hộp vuông, chữ vẫn vẽ đủ). 2 call-site đã chuyển qua helper; không còn `ctx.roundRect(` trực tiếp trong preview. Test `canvasRoundRect73A7.test.ts` 3/3 (mock ctx). |
| S3 | `backdrop-filter` không prefix: Safari < 18 chỉ hiểu `-webkit-backdrop-filter` → mất hiệu ứng mờ (chỉ thẩm mỹ). | `apps/web/src/styles.css:1344` (`.modal-backdrop`) | Thêm dòng `-webkit-backdrop-filter: blur(3px);` trước dòng không prefix. |
| S4 | `max-height: calc(100dvh − 48px)` không fallback: Safari < 15.4 bỏ qua khai báo → modal có thể tràn viewport. (`.app` đã có fallback `100vh` trước `100dvh` ở `mobile.css:142`.) | `apps/web/src/mobile.css:266` (`.modal`) | Thêm dòng `max-height: calc(100vh − 48px);` trước dòng dvh. |

### 4.3 Có-thể-vỡ — chưa vá (cần Safari thật để quyết)

| # | Vấn đề | File:dòng | Ghi chú |
|---|---|---|---|
| S5 | **File VP9/WebM/AV1 của user có thể không phát được trên Safari cũ.** Import chấp nhận `video/*` (`MediaBin.tsx:323`) mà không có codec-probe nào lúc import (grep `canPlayType` = 0 kết quả). VP9 trong WebM: Safari ≥ 14.1 (macOS Big Sur+)/iOS 15 mới có; AV1: Safari 17+. Trên Safari cũ hơn, `<video>` không play được và `VideoDecoder.isConfigSupported` cũng trả unsupported → đường phát ngược rơi về element nhưng element cũng không play → clip không xem được trong preview (render FFmpeg phía server không ảnh hưởng). Không vá trong đợt này: cần Safari thật để đo ma trận codec/phiên bản + quyết UX (báo lỗi lúc import hay transcode). | `apps/web/src/MediaBin.tsx:323`, `apps/web/src/lib/gopTrialDecode55L8.ts:264` (guard `isConfigSupported`) | Fallback hiện có: reverse engine về element (xem §4.4) — nhưng element cũng không cứu được codec không hỗ trợ. |
| S6 | `decodeAudioData` dạng promise (waveform): Safari < 14.1 cần dạng callback → `await undefined` rồi throw khi đọc `numberOfChannels`; đã có `p.catch` gỡ cache (`waveform.ts:131` + catch sau đó) nên chỉ mất waveform, không crash app. Safari quá cũ, không vá. | `apps/web/src/lib/waveform.ts:131` | Thấp. |
| S7 | `canvas.captureStream` (ghi media mẫu): Safari 15+ mới có; Safari cũ hơn → `recordSample`/`recordPackMedia` ném → bắt bởi try/catch → trả null / `PackError NO_RECORDER`. Đã guard, không vá thêm. | `apps/web/src/lib/sampleMedia.ts:158`, `apps/web/src/sample.ts:77` | Thấp. |

### 4.4 Đã có fallback / không có nguy cơ (đã kiểm chứng bằng đọc code)

| API / hành vi | File:dòng | Trạng thái |
|---|---|---|
| `webkitAudioContext` fallback | `apps/web/src/lib/waveform.ts:114`, `apps/web/src/lib/audioEngine.ts:204` | Có — Safari cũ dùng prefix, Safari ≥ 14.1 dùng chuẩn |
| `AudioContext` resume sau gesture (autoplay policy Safari) | `apps/web/src/lib/audioEngine.ts:259-260, 286-287` | Có — `resume()` khi `suspended` |
| WebCodecs: kiểm tra đủ 3 API + fallback element | `apps/web/src/lib/reversePlayback.ts:304, 322-340` (`readWebcodecsCapability`), `apps/web/src/preview.tsx:3428` (badge báo đúng đường) | Có — thiếu 1 trong `VideoDecoder`/`EncodedVideoChunk`/`VideoFrame` thì về element + badge báo rõ |
| `VideoDecoder.isConfigSupported` guard | `apps/web/src/lib/gopTrialDecode55L8.ts:264` | Có |
| Worker module không dựng được → probe main-thread | `apps/web/src/lib/gopTrialDecodeWorker62R4.ts` (`createWorkerTrialDecodeProbe` catch + fallback) | Có — Safari < 15 (không có module worker) vẫn mở file qua đường main-thread 2500 ms |
| `MediaRecorder` typeof guard | `apps/web/src/lib/sampleMedia.ts:151`, `apps/web/src/sample.ts` | Có — trả null thay vì ném |
| `structuredClone` → JSON fallback | `apps/web/src/lib/projectHistory.ts:402-404` | Có |
| `crypto.randomUUID` → fallback id | `apps/web/src/lib/projectId63R7.ts:27-35` | Có |
| `BroadcastChannel` typeof guard | `apps/web/src/lib/projectAssetRefs62R7.ts:59-61` | Có — trả null |
| `ResizeObserver` typeof guard | `apps/web/src/preview.tsx:4126` | Có |
| `navigator.clipboard.writeText` try/catch | `apps/web/src/ExportPanel.tsx:1337` | Có — lỗi thì chỉ không set "copied" |
| `playsInline` trên `<video>` (iOS Safari) | `apps/web/src/media.ts:195`, `apps/web/src/components/enhance/fastMotion.ts:224`, `apps/web/src/lib/thumbnails.ts:72` | Có |
| WebGL1 LUT (`getContext("webgl")` null) | `apps/web/src/lib/webglLut.ts:284-292`, `apps/web/src/preview.tsx:1571-1589` | Có — `applyWebglLut` trả null → giữ `drawSrc` gốc + `cssFilter` (LUT CSS), không crash |
| `getVideoPlaybackQuality` guard (đo presented FPS) | `apps/web/src/lib/presentedFps.ts:74` | Có — thiếu API thì trả null, meter tắt |
| Không dùng | — | `OffscreenCanvas`, `createImageBitmap`, `VideoEncoder`, `AudioDecoder`, `MediaSource`, `SharedArrayBuffer`, `AudioWorklet`, File System Access API (`showOpenFilePicker`), WebGPU (`navigator.gpu`), `requestVideoFrameCallback` (chỉ nhắc trong comment), `ctx.filter`, `:has()`, `color-mix`, `popover`, `.at()`, `Object.hasOwn` — grep 0 kết quả ở code production |
| CSS prefix đã có | `styles.css:40,123-138,1540-1542`, `lut.css:64-66`, `transitions.css:281`, `mobile.css:34` | `-webkit-font-smoothing`, scrollbar, line-clamp, tap-highlight, mask — đã có sẵn |
| `aspect-ratio` (Safari 15+) | `styles.css:483` + 3 file css khác | Dùng cho khung preview 16/9; Safari < 15 mất tỉ lệ khung (layout) — Safari quá cũ, không vá |
| `100dvh` ở `.app` | `mobile.css:142` | Đã có fallback `100vh` trước đó |

## 5. Nợ mở cho đợt sau

1. **Safari thật vẫn chưa đo** — mọi kết luận §4 chỉ đúng ở mức audit
   tĩnh + kiến thức API công khai. Cần máy macOS/iOS thật (hoặc dịch vụ
   cloud có Safari) để đo: (a) ma trận codec VP9/WebM/AV1/HEVC theo
   phiên bản (S5); (b) MediaRecorder mặc định + nhãn MIME sau vá S1;
   (c) roundRect fallback trên Safari < 16 (S2); (d) trial-decode
   keyframe lớn bằng VideoDecoder Safari (đợt 67 U5 đã ghi nợ này).
2. **Tên file media mẫu vẫn `.webm`** dù nội dung có thể là MP4 trên
   Safari (S1) — cần đổi contract tên theo container thật
   (`templatePack.ts:159`, `sample.ts` `mau-*.webm`) + kiểm tra chỗ nào
   dựa vào đuôi `.webm` (proxy/manifest/relink).
3. **Codec-probe lúc import (S5):** thêm `canPlayType` /
   `VideoDecoder.isConfigSupported` khi user import video, báo rõ
   "Safari không phát được VP9/AV1" thay vì để clip chết lúc preview.
4. Trần worker 90 s: nếu cap T3 bị nâng lên ≥ 74 MiB thì trần SẼ ràng
   buộc — test A7 khóa cap ở 64 MiB; ai đổi cap phải đổi cả trần/test.
5. Dưới tải cực nặng trial-decode 64 MiB vẫn timeout → fail-open đúng
   thiết kế (không phải lỗi trần 90 s).
6. `ci-security.yml` / `ci-build.yml` vẫn 403 (nợ chung, không thuộc đợt này).

## 6. Files (stage, KHÔNG push)

- Test mới: `apps/web/src/lib/keyframeBeyond90Round73A7.test.ts` (18/18),
  `apps/web/src/lib/canvasRoundRect73A7.test.ts` (3/3),
  `apps/web/src/lib/sampleMime73A7.test.ts` (4/4).
- Module mới: `apps/web/src/lib/canvasRoundRect.ts`,
  `apps/web/src/lib/sampleMime.ts`.
- Sửa: `apps/web/src/preview.tsx` (roundRect → helper, 2 chỗ),
  `apps/web/src/lib/sampleMedia.ts` + `apps/web/src/sample.ts` (nhãn MIME
  theo `rec.mimeType`), `apps/web/src/styles.css` + `apps/web/src/mobile.css`
  (fallback prefix/dvh), `apps/web/src/lib/gopRangeFetch39T3.ts` (comment
  60 s → 90 s), `apps/web/tsconfig.json` (exclude 3 test mới).
- LIMITS này: `docs/PHASE9_ROUND73_A7_KEYFRAME_SAFARI_LIMITS.md`.
- Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round73-a7-keyframe-safari.txt`.
