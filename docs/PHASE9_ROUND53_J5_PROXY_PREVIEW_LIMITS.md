# LIMITS — Phase 9, Đợt 53, Luồng J5: proxy persist + tick `[null]` + playhead drift

Ngày: 06–07/11/2026. Repo: `~/workspace/repo-1` (branch main, local; KHÔNG push từ phiên nền).
Phạm vi: nối proxy vào restore (mất sau reload), chứng minh headed đường tick
preview thật cho `computeClipGain` với `volumeKeyframes: [null]` (nợ I2 §6.1),
sửa playhead chậm do clamp `dt` 0,1 s khi FPS thấp (I9).

## 1. Proxy persist — HOÀN THÀNH (unit + headed 11/11)

### Thiết kế
- Manifest (`AssetStore`) lưu **đường dẫn proxy** (`proxyPath`,
  `/api/proxy/file/<tên>.mp4`) + `proxyHeight` + `proxySizeBytes` — KHÔNG lưu
  URL đầy đủ, vì cổng bridge có thể đổi giữa các phiên (8787→8788…).
  `AssetStore.setProxy(assetId, ProxyInfo | null)` validate path/height/size,
  `null` xóa; không throw.
- `proxyPathFromUrl(url)` (mới, `lib/proxy.ts`): tách path từ URL đầy đủ.
- `MediaItem.assetId?` (mới): gán ở `store.importFiles`, `relinkMedia`,
  `sample.ts`, `rehydrate36S5.ts`.
- `store.setMediaProxy`: sau `set()` trong bộ nhớ, persist fire-and-forget qua
  `AssetStore().setProxy(...)` — mất persist thì proxy trong phiên vẫn chạy.
- `rehydrate36S5.ts`: khôi phục `assetId` + `proxyUrl =
  proxyBaseUrl + manifest.proxyPath` (`proxyBaseUrl` mặc định
  `http://127.0.0.1:8787`, `App.tsx` truyền `BRIDGE_URL` live). Proxy file mất
  khỏi đĩa bridge → `MediaPool.videoFor` fallback về gốc (code cũ, không sửa).

### Unit (Node `--experimental-strip-types`, repo root)
- `assetStore.test.ts`: **27/27** (22 cũ + 5 mới `setProxy`: ghi/đọc lại, từ chối
  path/height/size/asset lạ, xóa bằng null, path `%20` + 480p).
- `rehydrate36S5.test.ts`: **22/22** (19 cũ + 3 mới: khôi phục proxyUrl với base
  tùy chọn, base mặc định 8787, manifest không proxy vẫn có `assetId`).
- `proxyAuto.test.ts`: **13/13** (8 cũ + 5 mới `proxyPathFromUrl`).
- Hồi quy cùng đợt: `audioEngine52I2` 15/15, `audioEngine44Z2` 6/6,
  `previewEngine` 14/14, `previewEngine51H6` 15/15,
  `playheadPacingRound29L2` 10/10, `projectRepoRound49E4` 13/13.
- `npx tsc --noEmit` (apps/web): **0 lỗi**. `npm run build`: **pass**
  (5,8 s; chỉ cảnh báo chunk > 500 kB có sẵn từ trước).

### Headed — `scripts/clicktest-53j5-proxy-persist.mjs`, 06/11/2026 ~22:18 +07: **11/11 PASS**
Bridge thật + vite dev + Xvfb Chromium + CDP; clip 1080p thật
(testsrc 1920×1080 30 fps h264, 8 s, 164.381 byte), proxy 720p thật qua ffmpeg.
- A0 load sample; P0 import clip 1080p + thêm timeline (assetId
  `a_30fef61945efcf5a`); P1 tạo proxy qua nút MediaBin →
  `http://127.0.0.1:8787/api/proxy/file/clip1080p__proxy_720p.mp4`, height 720,
  size **101.013 byte** (ffmpeg ~6 s); P2 manifest có đúng `proxyPath` +
  height + size; P3 autosave chứa clip; P4 sau reload proxyUrl khôi phục đúng
  giá trị cũ, assetId giữ nguyên; P5 nút hiện `✓ PROXY 720p`; P6 file proxy
  không bị tạo lại (mtime + size giữ nguyên); P7 GET proxyUrl → **206**,
  `video/mp4`; P8 phát sau reload dùng proxy thật (xem dưới); P9 0 lỗi
  console trong phiên.
- P8 (bằng chứng chính): element video của clip có `src` = `srcKey` =
  đúng proxyUrl và `currentTime` chạy tới **7,982/8 s** — preview thật sự
  giải mã từ file proxy, không phải blob gốc. `previewUrlFor` cũng trả
  `usingProxy=true`.

### Hai bẫy đo lường đã gặp (ghi lại để đợt sau khỏi lặp)
1. **Click CDP không tới nút Proxy.** Click chuột qua CDP tại đúng tọa độ nút
   không kích hoạt `onClick`: `document.elementFromPoint` tại tâm nút trả về
   phần tử class `tl-toolbar` — **thanh công cụ timeline đang phủ lên nút
   Proxy của thẻ media ở cửa sổ 1440×900**, nên click chuột thật rơi vào
   toolbar. Harness P1 bấm bằng `.click()` trong trang (bỏ qua hit-test) thì
   proxy tạo bình thường. Đây là vấn đề UI thật (người dùng bấm chuột vào nút
   đó cũng trượt), KHÔNG sửa trong đợt này — cần quyết định layout riêng.
   Bằng chứng: `bấm nút proxy: {"atPoint":"tl-toolbar",...}` trong log các
   lượt chạy proxy (file `~/workspace/tmp-round53-j5/proxy/proxy-run*.log`).
2. **Resource timing không thấy fetch proxy.** `performance.getEntriesByType`
   luôn trả `[]` cho proxy dù element đang dùng proxy: (a) buffer
   resource-timing mặc định (150 entry) đã đầy từ lúc vite dev nạp hàng trăm
   module — khi đầy, trình duyệt không ghi thêm entry; (b) element tạo từ lúc
   render tạm dừng sau reload đã preload xong (`preload=auto`) nên lúc phát
   không fetch mới — `clearResourceTimings()` trước khi phát còn xóa luôn
   entry duy nhất đó. P8 cuối dùng bằng chứng element src + currentTime,
   resource timing chỉ ghi thêm (0 lần). Đừng dùng resource timing làm cửa
   pass/fail cho video preload trong vite dev.

### Nợ mở (proxy)
- Nút Proxy bị timeline toolbar phủ ở 1440×900 (mục 1 trên) — chưa sửa.
- Proxy stale nếu `WORK_ROOT` của bridge bị xóa/đổi tay: lần phát đầu fallback
  về gốc (code cũ), nhưng item vẫn giữ `proxyUrl` chết cho tới khi user bấm
  tạo lại — chưa có cơ chế tự phát hiện + tạo lại.
- Chưa đo trên máy thật / Safari / màn hình lớn hơn (chỉ Chromium headed
  trên VM này, 1440×900).

## 2. Tick preview thật cho `computeClipGain` với `[null]` — HOÀN THÀNH (nợ I2 §6.1 đã đóng)

### Headed — `scripts/clicktest-53j5-tick-null-gain.mjs`, 06/11/2026 ~21:34 +07: **8/8 PASS**
Clip audio tone 440 Hz thật (8 s) trên audio track, `volumeKeyframes: [null]`,
volume 0,5; bấm Phát bằng click chuột thật qua CDP (`.click()` tổng hợp không
tạo user activation nên AudioContext giữ suspended — cả 3 harness đều dùng
CDP `Input.dispatchMouseEvent` cho nút Play).
- B0 import tone + clip audio 8 s; B1 store giữ `[null]` + volume 0,5;
  B2 module `computeClipGain([null])` → 0,5 (neo kỳ vọng).
- B3 (nợ I2 §6.1): phát với clip `[null]` — **tickErrors +0, 0 lỗi
  window/CDP/console mới**. Đường tick preview thật không ném.
- B4: RMS `[null]` @0,5 = **0,0437** vs tĩnh @0,5 = **0,0424**, tỉ lệ **1,031**
  (kỳ vọng ~1,0) — gain đúng qua tick thật (đo bằng AnalyserNode trên master bus).
- B5 sanity: RMS @1,0 = **0,0881** vs @0,5 = 0,0424, tỉ lệ **2,078**
  (kỳ vọng ~2,0) — phép đo nhạy với gain thật (4/6 mẫu cuối của B5 bằng 0 vì
  timeline 8 s đã phát xong; mean chỉ dùng 2 mẫu còn tiếng).
- B6: 0 lỗi trong phiên.
- Hook chẩn đoán thêm vào `preview.tsx` (cùng tiền lệ `__vcutPreviewIdle`):
  `window.__vcutAudioAnalyser`, `__vcutSyncReseeks{,Video,Audio}`,
  `__vcutMediaState` (+ `src`/`srcKey` của element, thêm sau để chẩn đoán P8);
  đều xóa ở effect cleanup.

## 3. Playhead chậm do clamp `dt` 0,1 s — BUG THẬT, ĐÃ SỬA (tỉ lệ playhead); audio re-seek KHÔNG đổi

### Sửa
- Mới `lib/playheadPacing.ts`: `PREVIEW_DT_CAP_S = 2`, `clampPreviewDt(dt)`.
  Cap 2 s bao phủ gap lập lịch dài nhất đã đo (1096 ms, I9) và còn dư; gap vô
  lý vẫn bị chặn. `preview.tsx` tick dùng
  `clampPreviewDt((now - last) / 1000)`; `forwardStep`/`reverseStep` không đổi.
- `onVisible` trong `preview.tsx` reset `last = performance.now()` cả khi
  loop đang chạy (đóng lỗ hổng tab ẩn → dt khổng lồ khi quay lại).
- `lib/previewRafHook.ts` mirror cap mới. Unit mới
  `playheadPacing53J5.test.ts`: **5/5**.

### Đo thật — `scripts/probe-53j5-playhead-drift.mjs` (sample 8 s + tone 8 s,
2 tiến trình `yes` đốt CPU trong lúc phát để tái hiện VM tranh chấp)

| Lượt | Clamp | Click | Tỉ lệ playhead/wall | Re-seek (video/audio) | Gap p50/p95/max |
|---|---|---|---|---|---|
| before (21:21) | 0,1 s | tổng hợp | 0,942 | 25 (—) | 66,6/116,7/600 ms |
| after (21:31) | 2 s | tổng hợp | 1,012 | 23 (11/12) | 100/299,9/600 ms |
| before2 (21:36) | 0,1 s | thật | **0,842** | **40 (28/12)** | 83,4/199,9/300,1 ms |
| after2 (21:39) | 2 s | thật | **1,007** | **10 (0/10)** | 66,6/100/183,3 ms |

- **Bug xác nhận bằng mô hình:** ở before2, tỉ lệ dự đoán từ các gap dưới
  cap 0,1 s là 0,838 ≈ đo được 0,842 — clamp là nguyên nhân drift, không
  phải code khác. (Ở FPS ~1,5 fps như I9, cùng cơ chế cho ~0,14–0,2×.)
- **Sửa có tác dụng với playhead:** 0,842 → 1,007 (click thật),
  0,919 → 1,012 (tổng hợp). `tickErrorDelta` = 0 ở cả 4 lượt, 0 lỗi mới.
- **Video re-seek 28 → 0: KHÔNG được nhận là công của bản sửa một cách sạch.**
  Lượt before2 có một cơn +8 re-seek trong ~0,6 s khi clip video thứ 2 trở
  nên active (element mới ở currentTime 0 vs target ~4 s, seek chậm dưới tải
  + nhánh forward của `syncMedia` không có chặn nhịp như nhánh reverse).
  Lượt after2 chạy nhanh hơn (gap p50 66 vs 83 ms) nên seek kịp trong 1–2 tick.
  Cải thiện tương quan với tốc độ lượt chạy, không tách được khỏi bản sửa.
- **Audio re-seek KHÔNG đổi (~10–12 ở cả 4 lượt).** `__vcutMediaState`
  (after2) cho thấy element audio ĐANG phát (`paused=0`, `readyState=4`)
  nhưng `currentTime` tụt sau playhead một khoảng ổn định ~0,2–0,3 s
  (vd playhead 7,467 → audio 7,141; 5,767 → 5,597; 1,367 → 1,039), thỉnh
  thoảng vượt ngưỡng 0,35 s của `syncMedia` → re-seek. Nguyên nhân chưa rõ
  (chưa chứng minh): jitter đồng hồ media / độ trễ seek dưới tải CPU, hoặc
  thời gian của `MediaElementAudioSourceNode`/AudioContext. **Không được
  báo cáo rằng bản sửa clamp cải thiện đồng bộ audio** — nó chỉ sửa tốc độ
  playhead; phần re-seek do drift (~4/12 ở before2) đã hết nhưng phần do
  jitter (~8–10) vẫn còn và chiếm đa số.

### Nợ mở (playhead/sync)
- Nhánh forward của `syncMedia` thiếu chặn nhịp mà nhánh reverse đã có
  (`shouldIssueStepSeek` + kiểm tra `el.seeking`): element đang seek vẫn bị
  ra lệnh seek mới, tự bơm thêm độ trễ. Đây là ứng viên sửa cho cơn re-seek
  audio, nhưng ngoài phạm vi đợt này (đổi hành vi sync, rủi ro hồi quy) —
  để đợt sau, kèm đo trước/sau.
- Chưa đo trên máy thật / FPS cao / Safari; chưa đo GPU encode (I9).
- `playheadPacingRound29L2.test.ts:123` tên test vẫn ghi "clamp 0.1" (mỹ quan,
  test vẫn đúng).

## 4. File đã chạm (đợt này)

**Production** (không chạm `audioEngine.ts` — file dùng chung, giữ nguyên):
- `apps/web/src/media.ts` — `MediaItem.assetId?`
- `apps/web/src/lib/assetStore.ts` — manifest `proxyPath/proxyHeight/proxySizeBytes`,
  `ProxyInfo`, `isValidProxyPath`, `AssetStore.setProxy`
- `apps/web/src/lib/proxy.ts` — `proxyPathFromUrl`
- `apps/web/src/lib/rehydrate36S5.ts` — `proxyBaseUrl`, `DEFAULT_PROXY_BASE_URL`,
  khôi phục proxy + `assetId`
- `apps/web/src/store.ts` — `setMediaProxy` persist; `importFiles` + `relinkMedia`
  giữ `assetId`
- `apps/web/src/sample.ts` — giữ `assetId` mẫu
- `apps/web/src/App.tsx` — truyền `BRIDGE_URL` làm `proxyBaseUrl`
- `apps/web/src/lib/playheadPacing.ts` — `PREVIEW_DT_CAP_S = 2`, `clampPreviewDt`
- `apps/web/src/lib/previewRafHook.ts` — mirror cap mới
- `apps/web/src/preview.tsx` — dùng `clampPreviewDt`; `onVisible` reset `last`;
  hook `__vcutAudioAnalyser`, `__vcutSyncReseeks{,Video,Audio}`,
  `__vcutMediaState` (+ `src`/`srcKey`)
- `apps/web/tsconfig.json` — thêm exclude cho `src/lib/playheadPacing53J5.test.ts`

**Test:** `apps/web/src/lib/assetStore.test.ts`,
`apps/web/src/lib/rehydrate36S5.test.ts`, `apps/web/src/lib/proxyAuto.test.ts`,
`apps/web/src/lib/playheadPacing53J5.test.ts` (mới).

**Harness headed** (Node + vite dev + Xvfb Chromium + CDP, mẫu I2):
`apps/web/scripts/probe-53j5-playhead-drift.mjs`,
`apps/web/scripts/clicktest-53j5-tick-null-gain.mjs`,
`apps/web/scripts/clicktest-53j5-proxy-persist.mjs`.

**Không đưa vào batch:** `apps/web/dist/` (build ghi ra), fixture/scratch
`~/workspace/tmp-round53-j5/` (tone/clip/log/result — ngoài repo), script chẩn
đoán tạm `~/workspace/tmp-round53-j5/proxydiag.mjs`.

## 5. Môi trường / ghi chú vận hành
- VM 2vCPU/8GB, nhiều luồng đợt 53 chạy song song: bộ nhớ có lúc chỉ còn
  ~281 MB trống; 1 lần Chromium headed crash (SIGABRT) giữa lượt chẩn đoán,
  1 lần `tsc` thoáng thấy lỗi ở `seekSeekable53J6.test.ts` (file của luồng J6
  đang ghi dở — không phải của J5; chạy lại 0 lỗi).
- Shell đôi khi chặn ghi/copy file có mtime cũ (EPERM) — chạm `touch` rồi thử lại.
- Harness tự chọn cổng trống (dev 5281–5299, debug 9471–9489, bridge
  8787–8799, Xvfb :90–:129) vì nhiều luồng chạy cùng lúc.
