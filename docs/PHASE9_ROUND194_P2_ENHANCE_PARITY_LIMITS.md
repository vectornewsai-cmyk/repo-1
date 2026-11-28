# Đợt 194 P2 — Enhance parity: fps nguồn + bob luân phiên + FPS headed đường bob

- **Luồng:** P2 đợt 194 (Phase 9 VCut build loop) — Editing Core, preview/render parity, đợt thứ 4 theo hướng mới (lệnh user 15:03 25/11).
- **Nền:** đợt 193 đã đóng, parent CHẤP NHẬN toàn bộ ở §14.2 aggregate `docs/PHASE9_ROUND193_LIMITS.md` (56.830 B — NGUỒN GỐC CHƯA NGÃ NGŨ, nội dung parent chấp nhận 0 đính chính, kiểm đếm lần thứ 123; KHÔNG ghi "parent viết trực tiếp", KHÔNG ghi 193 là "lần sạch"; KHÔNG dùng DB result_summary làm nguồn narrative — F-193-T7-2). Nguồn đúng thứ hai: §14.2 aggregate 192 (99.871 B, bản parent-kiểm).
- **Kết quả chính (3 khoản theo nợ P2-193 §5):**
  1. **fps nguồn + bob luân phiên — ĐẠT, đã ship:** `MediaItem.fps` đo lúc probe import (rVFC, xem §1); bob luân phiên field cho mode 1 @60fps (xem §2). Đo lại bằng bob-nearest (cơ chế đã ship): MAD vs yadif mode=1 @60fps **2,888 (top-only) → 2,297 (luân phiên)**, le8 94% → 95% — vẫn tier XẤP XỈ (cần MAD ≤2 & le8 ≥99% mới KHỚP). Hồi quy fps=30: mode=1 vs mode=0 MAD **0,000**.
  2. **FPS headed đường bob — ĐO XONG trên app thật (xem §3):** interlaced720.mp4 1280×720, canvas 1991×815 (scaleY 1,132), slot xen kẽ 7×4 s: bob **TẮT 11,06 fps / BẬT 11,10 fps**, tỉ lệ drift-corrected 1,03/1,04/0,98 → **mean 1,02×** — không đo được chi phí thêm của bob ở độ phân giải này (xem §3.2 về nền nhiễu).
  3. **Sharpen YUV-native — KHÔNG LÀM, quyết định có căn cứ (xem §6):** đường preview xuôi không có VideoFrame nào; `VideoFrame.copyTo` không xuất hiện ở đâu trong app; đường VideoFrame duy nhất (reverseWebcodecs) chỉ phục vụ phát ngược. Làm đúng cần pipeline WebCodecs decode xuôi mới — việc nhiều đợt, không làm nửa vời trong đợt này.
- **Kiểm chứng:** `npx tsc --noEmit` 0 lỗi (apps/web); 11 suite enhance **160/160 pass** (đợt 193: 155/155; +5 test mới 91P2); test media **4/4 file PASS** (mới: fpsProbe94P2 8/8); `npm run build` PASS (10,90 s); headed Chromium 1254: bottom-field F1/F2 + FPS G5 + luân phiên A1 + H9 = **5/5 PASS** (xem §3–§5).
- **File đổi (12):** `apps/web/src/media.ts`, `apps/web/src/lib/enhancePreview.ts`, `apps/web/src/preview.tsx`, `apps/web/src/lib/assetStore.ts`, `apps/web/src/lib/importAsset37T3.ts`, `apps/web/src/lib/rehydrate36S5.ts`, `apps/web/src/components/enhance/enhancePreview60Q1.test.ts`, `.../enhancePreview62R3.test.ts`, `.../enhancePreview91P2.test.ts`, `apps/web/src/media.fpsProbe94P2.test.ts` (mới), `apps/web/scripts/run-media-tests.mjs`, LIMITS này. Không push (chỉ stage). **File chung cho T10 kiểm xung đột:** `preview.tsx` (P3-194 cũng sửa — vùng của P2: `deintIntermediateSource`/`deintBobNearestSource` + call-site bob + lời gọi `enhancePreviewPlan` trong `drawVideoClip`; các vùng khác không đụng).

## §1. fps nguồn vào MediaItem — ĐẠT

### §1.1. Cách đo (media.ts)

`HTMLVideoElement` KHÔNG có sẵn thuộc tính fps nên probe phải đo: sau `loadedmetadata`, phát video (muted, detached — không tiếng, không hiện) rồi đếm `requestVideoFrameCallback`: fps = ΔpresentedFrames / ΔmediaTime, snap về tốc độ chuẩn gần nhất (`snapVideoFpsEstimate`, xem §1.2). Chốt sớm khi đủ cửa sổ mediaTime 0,5 s (~15 frame @30fps); hết `VIDEO_FPS_PROBE_MAX_MS = 900 ms` thì dùng mẫu đã có (≥2 frame) hoặc undefined. `probeVideoFps` fail-open, không throw: không có rVFC / video <0,4 s / `play()` bị từ chối / decode lỗi → undefined NGAY (không chờ hết timeout — import không bị chậm oan). Video 30fps giả trong test chốt trong <900 ms; video thật 30fps đo headed? Không — probe chạy lúc import trên máy user, không đo thêm ở đây ngoài test giả + logic (xem §1.3).

### §1.2. Lỗi snap đã bắt được khi chạy test (hồi quy có test khóa)

29.97 và 30 chỉ cách nhau 0,03 nên cửa sổ ±0,6 của hai tốc độ chồng nhau: bản đầu "lấy tốc độ đầu tiên trong dung sai" đã biến đo 30,0 thành **29.97** (test P2c/P2d fail lần đầu). Sửa thành **lấy tốc độ GẦN NHẤT** (trong ±0,6), ngoài thì giữ ước lượng làm tròn 2 chữ số. Test khóa: 30,0 → 30; 29,9 → 29.97; 29,99 → 30; 29,7 → 29.97; 30,4 → 30.

### §1.3. Lưu bền qua reload

`MediaItem.fps` → `IngestMeta.fps` → `AssetManifest.fps` (assetStore.ingest, chỉ ghi lúc ingest mới — manifest đã dedup theo sha thì giữ nguyên) → `rehydrate36S5` khôi phục lại vào item (không probe lại lúc reload — probe rVFC cần phát video ~0,5 s mỗi item). Cả hai đường ingest (`ingestImportedItem` + `ingestImportedItemWithProgress`) đều truyền fps; type `ImportedItemLike`/`ImportAssetStoreLike` cập nhật theo. Sample media không có fps (không probe lúc sinh mẫu) → undefined → bob giữ top field như cũ.

### §1.4. Giới hạn của số đo fps

- VFR: rVFC cho fps TRUNG BÌNH trên cửa sổ đo (~0,5–0,9 s đầu video), không phải fps từng đoạn — bob luân phiên dùng fps trung bình này; footage VFR mạnh có thể lệch field ở đoạn fps khác trung bình (chưa đo — nợ §8).
- Video <0,4 s, ảnh/audio, trình duyệt không có rVFC, codec không phát được → fps undefined → top field như cũ (không hồi quy).

## §2. Bob luân phiên cho mode 1 — ĐẠT, đã ship

### §2.1. Công thức field (enhancePreview.ts)

Render: `trim → yadif mode=1 → speed → fps=projFps` (`setpts=PTS-STARTPTS` chạy TRƯỚC yadif nên chỉ số yadif đếm từ điểm trim — server/render/src/render.js). yadif mode=1 xuất 2 frame/frame nguồn (top rồi bottom). Frame output tại thời gian nguồn đã tiêu `consumedSec` (kể từ điểm trim = `rampSourceTimeAt − clip.in`) ứng với frame yadif số floor(consumedSec × 2 × inputFps); **field = chỉ số đó % 2** (0 = top, 1 = bottom) — `deintBobFieldForConsumedTime(consumedSec, inputFps)`, thuần, có test khóa. Thêm `deintBobFieldForOutputFrame(frameIdx, projFps, inputFps)` cho harness (field = floor(frameIdx × 2×inputFps / projFps) % 2). Hệ quả đã kiểm bằng công thức: proj 60/nguồn 30 → luân phiên mỗi frame; proj 30/nguồn 30 → luôn 0; nguồn 60 @proj 60 → luôn 0; nguồn 25 @proj 30 → mẫu 0,1,1,1,0,0,0,1.

`enhancePreviewPlan` thêm 2 tham số tùy chọn cuối (`inputFps?`, `consumedSec?`) → field mới `deintBobField` (0|1; 0 khi tap không áp hoặc thiếu fps/thời gian — hành vi cũ); `EnhancePreviewDebug` mang theo field để harness đọc qua `window.__vcutPreviewEnhance`. Shape-lock cập nhật theo quy ước: plan 12 → **13 key** (60Q1), debug 14 → **15 key** (62R3). Lời gọi cũ (5–6 đối số, harness 191–194) không đổi gì.

### §2.2. Cơ chế bottom field (preview.tsx)

`deintIntermediateSource(src, w, h, field)` / `deintBobNearestSource(src, w, h, field)`: field=0 giữ đúng lần vẽ cũ (4 đối số, toàn bộ nguồn); field=1 dùng source-rect lệch `drawImage(src, 0, 1, w, h−1, 0, 0, cw, ch)` — đúng mẫu đã xác minh headed Chromium 1254 đợt 192 P2 (F). `drawVideoClip` truyền `item.fps` + `max(0, rampSourceTimeAt(clip, t) − clip.in)` vào plan rồi vẽ bob theo `plan.deintBobField`. Phát ngược: `consumedSec` vẫn là thời gian kể từ điểm trim (giảm dần khi phát ngược) nên field vẫn đổi đúng nhịp nửa khung nguồn.

### §2.3. Đo lại MAD/le8 (probe-194-p2a, bob-nearest — cơ chế đã ship)

Fixture sinh lại bằng gen.sh đợt 193 (testsrc2 320×180, `tinterlace`, yadif truths). 32 frame output @60fps, truth `inter_yadif_m1_60.yuv`:

| | MAD | le8 |
|---|---|---|
| bob-nearest top-only | 2,888 | 94% |
| bob-nearest **luân phiên** | **2,297** | **95%** |
| bob-bilinear luân phiên (đối chiếu 193) | 2,795 | — |
| bob-bilinear top-only (đối chiếu 193) | 3,305 | — |

Luân phiên cải thiện 0,59 MAD so với top-only trên cùng cơ chế nearest; nearest tốt hơn bilinear cả hai chế độ. **Vẫn tier XẤP XỈ** (cần MAD ≤2 & le8 ≥99% mới KHỚP) — bob không bao giờ đạt KHỚP vì chỉ giữ 1 field (mất nửa thông tin dọc); hơn nữa cần yadif thật trong preview (nợ lớn từ đợt 193). Hồi quy: mode=1 qua fps=30 vs mode=0, MAD **0,000** (16/16 frame, như đợt 193).

## §3. FPS headed đường bob trên app thật — ĐO XONG

Harness `headed-194-p2-bob.mjs` (bản sao ở `hidden_files/round194-p2/`): vite dev :5590 + Xvfb :196 + CDP Chromium 1254, cửa sổ 2560×1440, project mẫu (clip 1 → interlaced720.mp4 30fps, `fps: 30` trong media item, in 0/out 4, canvas 1991×815, scaleY 1,132 ≥ 0,9 → tap áp), slot xen kẽ [off,on,off,on,off,on,off] × 4 s, draw fps qua `__vcutHoldStats.draw`, tỉ lệ drift-corrected như E1 G5. Kết quả lần 2 (lần 1 tải cao, xem §3.2):

| slot | 0 off | 1 on | 2 off | 3 on | 4 off | 5 on | 6 off |
|---|---|---|---|---|---|---|---|
| draw fps | 10,52 | 10,87 | 10,50 | 11,03 | 10,77 | 11,41 | 12,44 |
| hook tap (giữa slot) | false | true | false | true | false | true | false |

**Tắt mean 11,06 fps / Bật mean 11,10 fps; tỉ lệ 1,03/1,04/0,98 → mean 1,02×; không slot đóng băng (<0,5 fps); 0 lỗi trang.** Hook tap đúng mọi slot (đo GIỮA slot — xem §3.1).

### §3.1. Bẫy harness đã bắt được (2 lần)

- **Lần 1:** toggle deint → true không về đích (hook tap=false dù store đã bật) vì sau slot trước playhead ở cuối clip (~4 s) nên clip không còn active → preview không vẽ lại → hook giữ giá trị cũ. Sửa: đặt playhead về 0,5 s TRƯỚC khi toggle.
- **Lần 1 (tiếp):** hook CUỐI slot của slot on 3/5 là false — playhead cuối slot ~4 s đã sang clip kế (không enhance). Sửa: đọc hook GIỮA slot (playhead ~2 s, clip đang active). Cả hai đều là lỗi đo, không phải lỗi sản phẩm.

### §3.2. Nền nhiễu của số FPS

Lần 1 chạy lúc loadavg ~10–12 (luồng khác đang đo): off 6,82 / on 6,56 fps, tỉ lệ 0,77/1,06/1,24 → mean 1,02×. Lần 2 lúc loadavg ~0,9–1,8: 11,06/11,10 fps, tỉ lệ 1,03/1,04/0,98 → mean 1,02×. Hai lần độc lập cùng cho **1,02×** — bob (thêm 1 lần vẽ full-res nearest + 1 lần half-res) không đo được chi phí thêm ở độ phân giải này: khung hình ~90 ms (11 fps, software raster) thì 1 lần vẽ nearest thêm (≤0,57 ms/frame @640×360 đo đợt 193 — ở 1991×815 lớn hơn theo diện tích nhưng vẫn ~1–2 ms) chìm dưới nhiễu tải (±0,2× giữa các tỉ lệ). Kết luận đúng mức: **không có hồi quy FPS đo được từ bob**; muốn tách chi phí ~1 ms cần đo ở khung hình nhỏ hơn hoặc nền yên hơn — không làm trong đợt này.

## §4. Bottom-field headed — ĐÃ XÁC MINH (F1/F2)

Đúng dạng `drawImage` 9 đối số của code mới, Chromium 1254:

- **F1 canvas** (mẫu xen kẽ 214/38): half field=0 → [214×6]; half field=1 (sy=1) → [38×6]; hai bước bob field=1 → [38×8]. PASS.
- **F2 video** (`rowpat-alt.mp4`, xen kẽ qua encode libx264 crf 10): half field=0 → ~230; half field=1 → ~26; hai bước field=1 → ~26 (Y 214/38 limited-range → RGB ~230/26 sau chuyển limited→full: (214−16)×255/219 ≈ 230, (38−16)×255/219 ≈ 26 — số RGB, không phải số Y gốc; lần chạy đầu kiểm theo 214/38 nên FAIL giả, đã sửa theo khoảng tách biệt ≥200/≤60). PASS.

## §5. Luân phiên field trên app thật — ĐÃ XÁC MINH (A1)

Project fps 60 (đổi `spec.meta.fps` qua store) + nguồn 30fps + deint bật, phát 3,5 s, poll hook `deintBobField` mỗi 70 ms: 32 mẫu, 31 playhead khác nhau, **đổi field 10 lần, cả hai giá trị 0/1 đều xuất hiện** (chuỗi đầu: 0,0,0,0,0,0,0,1,0,1,0,0,0,1,0,0). PASS. Lưu ý trung thực: poll 70 ms không phân giải được từng frame 60fps (mỗi lần poll cách ~4 frame output; chuỗi dài toàn 0 đầu phiên là hệ quả bình thường của bước nhảy ~4 frame — parity chỉ đổi khi bước nhảy lẻ) — xen kẽ ĐÚNG TỪNG FRAME được khóa bởi unit test công thức (§2.1) + cơ chế lấy field F1/F2 (§4); A1 chứng minh đường luân phiên chạy thật trên app (không kẹt ở top), không chứng minh từng frame.

## §6. Sharpen YUV-native — KHÔNG LÀM (quyết định có căn cứ)

Kiểm tra trực tiếp trên code, không đoán:

- Đường preview xuôi: `<video>` element → canvas 2D `drawImage` → `getImageData` RGBA; `applySharpen` (effectCanvas.ts) làm việc trên luma SUY RA từ RGB. **Không có mặt phẳng YUV nào** trên đường này.
- `VideoFrame` chỉ xuất hiện ở `reverseWebcodecs.ts` (đường phát ngược/stepping, opt-in qua `window.__vcutReverseWebcodecs`) — frame ở đó cũng chỉ được vẽ qua `drawImage` (chuyển sang RGB), không đọc mặt phẳng Y.
- `VideoFrame.copyTo` **không xuất hiện ở đâu** trong `apps/web/src` (grep 0 kết quả ở media/preview/effectCanvas/reverseWebcodecs).
- Làm đúng cần pipeline WebCodecs decode XUÔI mới (VideoDecoder riêng từng clip, demux/seek/đồng bộ audio, interplay với proxy/blob-prefetch/hold-frame) thay cho đường `<video>` hiện tại — việc nhiều đợt, rủi ro cao (chạm playback/seek/sync), trong khi lợi ích chưa chứng minh: biến thể rẻ nhất đợt 193 (V2) chỉ hơn ~1% MAD, và sai số Y_est (mean |Δ| 2,06 trên natural15) là cận trên lý thuyết chứ không phải lợi ích đảm bảo.
- **Điều kiện mở lại:** khi nào có đường WebCodecs decode xuôi thật (hoặc `requestVideoFrameCallback` trả metadata YUV — hiện không có) thì làm lại bài toán sharpen trên Y plane; trước đó giữ `applySharpen` như cũ (MAD ~1,5–2,5 ở t=0,5–1,0 trên nội dung nhiễu — giới hạn đứng từ đợt 193 §2.2).

## §7. Kiểm chứng

- `npx tsc --noEmit` (apps/web): **0 lỗi** (đã sửa 2 lỗi lúc đầu: `EnhancePreviewDebug` literal trong preview.tsx thiếu `deintBobField`; test fps khai `process` thiếu `exit`).
- 11 suite enhance: **160/160 pass** (59P8 21/21, 60Q1 16/16, 61R3 7/7, 62R3 10/10, 63R3 8/8, 75C8 14/14, 76D4 10/10, 77E1 11/11, 91P2 40/40 — trước 35/35, +5 test mới field/plan/debug, 61R2 9/9, 64R2 14/14).
- Test media (`run-media-tests.mjs`): **4/4 file PASS** (blobPrefetch90R3, captureThumb66T6 2/2, fpsProbe94P2 **8/8** — snap/fpsFromPresentedFrames/probeVideoFps/fileToMediaItem, retryPlay95W2 7/7).
- `npm run build` (apps/web): **PASS** (10,90 s; cảnh báo chunk >500 kB có sẵn, không liên quan).
- Probe: `/tmp/round194-p2` (probe-194-p2a.mjs + fixture sinh lại bằng gen.sh đợt 193 + rowpat-alt/pair.mp4); bản sao probe + script/kết quả headed ở `~/workspace/goals/capcut-clone-video-editor/hidden_files/round194-p2/`. Số đo bằng ffmpeg 8.1.2 / node 24.22.1 / Chromium 1254.

## §8. Giới hạn còn lại / nợ

1. **Deint vẫn tier XẤP XỈ:** MAD 2,30 (luân phiên @60fps) / 2,55–4,11 (@30fps, đợt 193), le8 93–95% (cần ≤2 & ≥99% mới KHỚP). Bob giữ 1 field nên không bao giờ đạt KHỚP; hơn nữa cần yadif thật trong preview (nợ lớn).
2. **fps VFR:** probe cho fps trung bình cửa sổ đầu video; footage VFR mạnh có thể lệch field ở đoạn fps khác trung bình — chưa đo.
3. **Sample media không có fps** (không probe lúc sinh mẫu) → bob luôn top field trên clip mẫu; muốn có thì probe lúc sinh mẫu hoặc thêm fps vào `sample.ts` (nợ nhỏ).
4. **FPS bob:** không tách được chi phí ~1 ms khỏi nhiễu tải ở khung 1991×815 (xem §3.2); đo tách bạch cần nền yên/khung nhỏ hơn.
5. **Sharpen trên nhiễu:** giữ giới hạn Y_est đợt 193 (MAD ~1,5–2,5 ở t=0,5–1,0); YUV-native chỉ khi có đường WebCodecs xuôi (xem §6).
6. **P4-194 lưu ý:** N5 deint @30fps KHÔNG ĐỔI (field luôn 0 khi proj 30/nguồn 30 — hồi quy MAD 0,000 đã kiểm); N5 @60fps mode 1 kỳ vọng mới MAD ~2,30 / le8 ~95% (luân phiên, thay cho 2,80/— của bilinear đợt 193). S2 (warm-up thích nghi) không bị ảnh hưởng — plan chỉ thêm field, không đổi alpha.

## §9. Thay đổi code

### §9.1. `apps/web/src/media.ts`

- `MediaItem.fps?: number` (+ comment: nguồn, cách dùng, undefined nghĩa là gì).
- Mới `VideoFrameCallbackSample`, `VIDEO_FPS_STANDARD_RATES`, `snapVideoFpsEstimate` (gần nhất, ±0,6), `fpsFromPresentedFrames` (Δframe/Δt), `VIDEO_FPS_PROBE_MAX_MS = 900`, `VIDEO_FPS_PROBE_MIN_WINDOW_SEC = 0.5`, `VIDEO_FPS_PROBE_MIN_DURATION_SEC = 0.4`, `probeVideoFps(v)` (rVFC, fail-open).
- `probeVideo` trả thêm `fps?` (đo sau `loadedmetadata`, bounded ~900 ms); `fileToMediaItem` ghi `item.fps` khi đo được.

### §9.2. `apps/web/src/lib/enhancePreview.ts`

- Mới `deintBobFieldForConsumedTime(consumedSec, inputFps)` + `deintBobFieldForOutputFrame(frameIdx, projFps, inputFps)` (thuần).
- `EnhancePreviewPlan` + `EnhancePreviewDebug` thêm `deintBobField: 0 | 1`; `enhancePreviewPlan` thêm tham số tùy chọn `inputFps?`, `consumedSec?` (sau `noiseSigma?` — lời gọi cũ không đổi).
- Comment đầu file cập nhật (mode 1 đã ship luân phiên + số đo mới).

### §9.3. `apps/web/src/preview.tsx`

- `deintIntermediateSource(src, w, h, field = 0)` + `deintBobNearestSource(src, w, h, field = 0)` (field=1 → source-rect sy=1, sh=h−1).
- `drawVideoClip`: truyền `item.fps` + `max(0, rampSourceTimeAt(clip, t) − clip.in)` vào plan; bob vẽ theo `plan.deintBobField`.
- Literal `enhancePreviewDebugState` thêm `deintBobField: 0` (sửa lỗi tsc).

### §9.4. Bền qua reload + test

- `assetStore.ts`: `AssetManifest.fps?` + `IngestMeta.fps?` (ghi lúc ingest mới).
- `importAsset37T3.ts`: `ImportedItemLike.fps?` + meta `fps` ở cả hai đường ingest; type meta của store cập nhật theo.
- `rehydrate36S5.ts`: item khôi phục mang `fps: c.manifest.fps`.
- `enhancePreview60Q1.test.ts`: shape plan 12 → 13 key. `enhancePreview62R3.test.ts`: shape debug 14 → 15 key + assert `deintBobField: 0`. `enhancePreview91P2.test.ts`: +5 test (field theo consumed/output-frame, plan, debug). `media.fpsProbe94P2.test.ts` (mới, 8 test — snap/fps/probe/fileToMediaItem). `run-media-tests.mjs`: thêm file thứ 4 vào danh sách.

## §10. Hướng cho đợt sau

- P4-194: N5 @60fps mode 1 kỳ vọng MAD ~2,30 / le8 ~95% (xem §8.6); N5 @30fps không đổi.
- Đợt 195 P2 (nếu tiếp tục enhance parity): (a) fps cho sample media (probe lúc sinh mẫu); (b) đo lại fps bob ở khung nhỏ hơn/nền yên hơn để tách chi phí ~1 ms (xem §3.2); (c) sharpen YUV-native CHỈ khi có đường WebCodecs decode xuôi — không làm nửa vời (xem §6).
