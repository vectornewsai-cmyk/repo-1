# LIMITS — Phase 9 đợt 65, luồng S4: Cache GPU probe — fallback libx264 + nút "Probe lại GPU"

Đợt 65 S4, chạy 08/11/2026 (cron 15:35). Đóng nợ #4 trong
docs/PHASE9_ROUND64_LIMITS.md §8 + §1 R1: khi encoder GPU đã cache lỗi
thì fallback libx264; thêm nút "Probe lại GPU" trong UI.

## 1. Vấn đề (đã xác nhận trên code, không phải đoán)

- Đợt 64 R1 cache kết quả probe GPU xuống đĩa
  (`~/.cache/vcut/gpu-probe.json`, TTL 30 ngày,
  `server/render/src/gpuencode.js` → `probeGpuEncoderCached()`).
- Kịch bản kẹt: probe OK `h264_nvenc` ngày N, GPU bị tháo ngày N+5 →
  cache vẫn nói encoder còn đó → render worker chọn `h264_nvenc` →
  encode GPU fail ở bước 7 → trước đợt này job fail luôn (exit 2),
  không có đường thoát nào khác ngoài chờ hết TTL 30 ngày hoặc xoá
  tay file cache. Probe lúc chọn encoder (`tryEncode`) không cứu được
  vì đường auto không probe lại khi cache HIT.
- UI cũng không có cách nào xem/probe lại trạng thái GPU: không có
  endpoint bridge nào, không có panel nào hiển thị encoder đang dùng.

## 2. Việc làm

### 2.1 Fallback libx264 ở bước encode chính (`server/render/src/render.js` bước 7)

Khi `ffmpeg` lần 1 thoát lỗi VÀ encoder đang dùng là GPU
(`h264_nvenc`/`h264_qsv`/`h264_vaapi`):
1. Log cảnh báo + **xoá file cache probe lỗi** (`clearGpuProbeCache()`)
   để lần render sau probe lại thật thay vì kẹt ở encoder đã chết.
2. **Thử lại ĐÚNG 1 lần** bằng libx264: re-exec chính process này với
   `--encoder libx264` (ép thêm `-y` nếu argv gốc không có, vì lần fail
   có thể đã tạo file output dở dang). Re-exec thay vì đổi tham số tại
   chỗ vì graph filter đã dựng theo encoder cũ (vaapi có `hwupload`) —
   process mới dựng lại graph từ đầu với `vaapi=false` nên không còn
   surface phần cứng.
3. Kết quả lần retry thay thế kết quả lần 1 cho toàn bộ code sau
   (plugin `onExportFinish`, dọn temp, mã thoát) — retry thành công thì
   temp của lần fail cũng được dọn như render thường.

Không retry khi encoder đang dùng đã là `libx264` (lỗi nằm ở
graph/spec/media — retry vô ích, tránh tốn thêm 1 lần render).
Không retry lần 2 (đệ quy bị chặn vì process retry chạy với
`--encoder libx264` nên không vào được nhánh fallback).

### 2.2 Bridge: trạng thái + probe lại (`server/bridge/src/gpuProbe.js`, mới)

- `GET /api/gpu-probe` — CHỈ ĐỌC cache đĩa, không probe (nhanh, ~ms):
  `{ probed, encoder, detail, cached, source, probedAtMs, cacheEnabled }`.
  Chưa từng probe → `probed:false`.
- `POST /api/gpu-probe/reprobe` — xoá cache cũ rồi probe lại THẬT
  (`probeGpuEncoderCached({ forceReprobe: true })`, encode thử 1 frame
  từng encoder, tối đa ~15s/encoder, đồng bộ). Kết quả mới được ghi
  lại xuống cache đĩa ngay.
- Cả hai nằm dưới rate-limit general của `/api/` như các endpoint khác.
  Ghi vào `openapi.yaml` (path + schema `GpuProbeStatus` /
  `GpuProbeResult`) + header comment `index.js`.

### 2.3 UI: khối Encoder GPU trong ExportPanel

- `apps/web/src/lib/gpuProbe65S4.ts` (mới, mẫu `jobNote64R8.ts`):
  đọc fragment trực tiếp nên chuỗi en hiện ngay, không chờ parent gộp
  dict. `gpuProbeStatusText()` cho 4 trạng thái (chưa probe / cache tắt
  / có GPU + ngày probe / không GPU → CPU), `gpuProbeDoneText()` /
  `gpuProbeErrorText()` cho thông báo sau khi bấm. Không bao giờ trả
  key thô ra UI (thiếu key → fallback vi → `""`).
- `apps/web/src/i18n/fragments/round65-s4.json` (mới, **10 key**
  `export.gpuProbe.*`, vi+en, placeholder khớp) — CHƯA gộp vào
  `vi.json`/`en.json` (parent gộp; dict vẫn 2283 key, P7 8/8).
- `ExportPanel.tsx`: khối `.gpu-probe` đặt sau khối normalize, trước
  `ReframeSection` — dòng trạng thái + nút "Probe lại GPU" (disabled
  khi đang probe hoặc đang render/upload) + ghi chú "Nếu encoder GPU
  lỗi lúc render, VCut sẽ tự thử lại bằng libx264." Trạng thái tải 1
  lần khi mở panel (GET); bridge chưa chạy thì giữ "Chưa probe…",
  không ồn. Nút bấm POST reprobe rồi cập nhật trạng thái + thông báo.
- `styles.css`: `.gpu-probe` (viền mờ + padding, dùng lại nhịp
  preset-row/tips sẵn có).

## 3. Kiểm chứng thật (số đo trên VM này, 2vCPU, không GPU thật)

VM không có GPU thật nên kịch bản "GPU đã tháo" được **GIẢ LẬP ở tầng
ffmpeg CLI và ghi rõ là giả lập** — không claim có GPU thật ở đâu:

### 3.1 Fallback render (`server/render/src/test_round65_s4_gpu_fallback.js`) — **18/18**

- Fake `fake-ffmpeg.sh`: fail CHỈ khi argv chứa đúng `h264_nvenc`
  (in lỗi mock "No capable devices found"), còn lại exec ffmpeg thật.
- Cache đĩa gieo bằng `writeGpuProbeCache()` thật
  (encoder=`h264_nvenc`, fingerprint đúng file wrapper) → render
  `--encoder auto` đọc cache HIT → chọn `h264_nvenc` → lần 1 fail
  (exit 1) → fallback → **exit 0**, output MP4 h264 640x360 2s hợp lệ
  (ffprobe), 8,49s wall (gồm cả lần fail + lần retry).
- Log khóa được: `encoder video: h264_nvenc … (probe cache disk HIT)`,
  `encoder GPU h264_nvenc encode thất bại (thoát mã 1) → thử lại bằng
  libx264`, `cache probe GPU đã xoá`, `fallback libx264 thành công
  (5.4s)`. File cache lỗi **không còn tồn tại** sau fallback. Chỉ
  retry đúng 1 lần.
- Đối chứng 1: `--encoder libx264` + wrapper luôn-fail → exit 2,
  KHÔNG retry, không marker fallback (không che giấu lỗi thật).
- Đối chứng 2: cache HIT `encoder=null` → thẳng libx264, exit 0,
  không retry, cache null còn nguyên (chỉ xoá cache khi GPU fail).

### 3.2 Endpoint bridge (`server/render/src/test_round65_s4_gpu_bridge.js`) — **13/13**

Bridge thật trên cổng 8791 (work dir + cache riêng), cache gieo
`h264_nvenc` (fingerprint ffmpeg thật):
- `GET /api/gpu-probe` → 200, `probed:true, encoder:h264_nvenc,
  cached:true, source:disk` (chỉ đọc cache).
- `POST /api/gpu-probe/reprobe` → 200 sau 1088ms, `encoder:null,
  tried:[h264_nvenc, h264_qsv, h264_vaapi], cacheCleared:true,
  source:probe` (probe thật trên VM không GPU).
- `GET` sau reprobe → `probed:true, encoder:null`; file cache trên
  đĩa đã ghi lại `encoder:null`.
- `GET /api/openapi.json` chứa `/api/gpu-probe` (YAML sửa đúng).
- Lỗi gặp khi viết test (đã sửa, ghi để khỏi lặp lại): `gpuProbe.js`
  require sai `../render/src/gpuencode` (phải là
  `../../render/src/gpuencode`); harness bridge tính sai `ROOT`
  (`server/render/src` lên 2 cấp chỉ tới `server/`, phải 3 cấp mới
  tới gốc repo) — cả hai đều là lỗi của code/test mới, không phải lỗi
  sản phẩm, đã sửa + test xanh lại.

### 3.3 Web UI (`apps/web/src/lib/gpuProbe65S4.test.ts`, esbuild bundle) — **9/9**

Fragment 10 key vi+en (không rỗng, vi≠en, placeholder khớp);
`GPU_PROBE_KEYS` khớp 1:1 fragment; `gpuProbeString(s)` đúng locale +
thay `{var}` + fallback vi + thiếu key → undefined (không key thô);
`gpuProbeStatusText` đủ 4 trạng thái; `gpuProbeDoneText` /
`gpuProbeErrorText` thay `{result}`/`{error}`; nối tĩnh ExportPanel
(import lib + 2 endpoint + khối `.gpu-probe` + CSS) và bridge (2 route
+ module + fallback render + openapi) đều khóa bằng assert đọc file.

### 3.4 Hồi quy

- `node server/render/src/gpuencode.js --self-test`: pass (gồm cache
  MISS/HIT/null/force/TTL/file hỏng/tắt/xoá).
- `tsc` web: **0 lỗi**; `vite build`: pass (25,6s).
- P7 i18n audit (`i18nAudit59P7.test.ts`): **8/8** (dict vẫn 2283 key,
  0 orphan). Lưu ý: lần chạy đầu đỏ 7/8 vì chuỗi fallback cứng
  `"Probe lại GPU"` trong ExportPanel bị scan literal bắt (tồn đọng
  1 mẫu) — đã bỏ các fallback literal, dùng chuỗi fragment trực tiếp,
  chạy lại 8/8.
- Orphans Q4 (`i18nOrphans60Q4.test.ts`): **16/16**.
- cssClasses Q2 (`cssClasses60Q2.test.ts`): **59/59**.
- jobNote R8 (`jobNote64R8.test.ts`): **19/19** (ExportPanel sửa nhưng
  khối `.render-note` không đổi).
- Hồi quy render R64 R1 (`test_round64_r1_gpu_probe_cache.js`):
  **30/30 pass**, exit 0 (chạy lại sau khi sửa render.js; ~7,3 phút) —
  cache đĩa MISS/HIT/null/force/TTL, full render COLD vs WARM, cờ
  `--reprobe-gpu` / `--no-gpu-probe-cache` đều đúng như trước.

## 4. Nợ còn lại (trung thực)

1. **Chưa test trên GPU thật**: mọi encode GPU (nvenc/qsv/vaapi) chưa
   từng chạy thành công trên máy có GPU — probe thật, encode thử 1
   frame, và fallback khi GPU fail *lúc encode* (khác với fail lúc
   probe) đều mới chỉ kiểm chứng bằng giả lập wrapper. Trên máy có GPU
   thật cần đo lại: render auto chọn đúng encoder GPU + MP4 hợp lệ,
   và tháo GPU trong TTL → fallback libx264 thật.
2. **Chưa click-test nút "Probe lại GPU" trên browser thật**: VM này
   không có Chromium/Playwright (nợ đứng cũ — browser thật không tới
   được 127.0.0.1:5173, Playwright download thất bại). Nút đã kiểm
   chứng ở tầng lib (9/9) + endpoint live (13/13) + nối tĩnh
   ExportPanel, nhưng chưa có lần bấm thật nào trên UI.
3. **Retry tốn 1 lần render**: khi lỗi không phải do encoder (vd
   graph/spec hỏng) mà encoder đang dùng là GPU, lần retry libx264 sẽ
   fail lại y hệt sau khi chạy gần hết 1 lần render. Chấp nhận được vì
   trước đây job fail luôn; nhưng nếu muốn tiết kiệm thì cần bắt stderr
   ffmpeg để phân biệt lỗi encoder vs lỗi graph — render.js hiện chạy
   ffmpeg với stderr inherit (bridge parse tiến trình từ đó) nên chưa
   làm được mà không đổi đường progress.
4. **Probe lại đồng bộ, chặn event loop**: `POST /reprobe` có thể mất
   tới ~45s (3 encoder × 15s timeout) khi ffmpeg treo; chỉ gọi từ nút
   bấm thủ công nên chấp nhận được, nhưng không nên gọi tự động.
5. **Fragment chưa gộp vào dict**: 10 key `export.gpuProbe.*` chỉ nằm
   trong `round65-s4.json`; parent gộp vào `vi.json`/`en.json` (dict
   2283 → 2293) + cập nhật snapshot số key ở các test như tiền lệ đợt 64.
6. **Vaapi + hwupload**: fallback re-exec dựng lại graph nên vaapi
   được xử lý đúng, nhưng chưa có test vaapi thật (không có
   /dev/dri/renderD128 trên VM).

## 5. File đổi/thêm (stage — xem fragment)

- `server/render/src/render.js` (sửa: nhánh fallback bước 7 + comment 3c)
- `server/bridge/src/gpuProbe.js` (mới)
- `server/bridge/src/index.js` (sửa: require + 2 route + header API)
- `server/bridge/openapi.yaml` (sửa: 2 path + 2 schema)
- `server/render/src/test_round65_s4_gpu_fallback.js` (mới)
- `server/render/src/test_round65_s4_gpu_bridge.js` (mới)
- `apps/web/src/lib/gpuProbe65S4.ts` (mới)
- `apps/web/src/lib/gpuProbe65S4.test.ts` (mới)
- `apps/web/src/i18n/fragments/round65-s4.json` (mới)
- `apps/web/src/ExportPanel.tsx` (sửa: import + state + khối `.gpu-probe`)
- `apps/web/src/styles.css` (sửa: `.gpu-probe`)
- `docs/PHASE9_ROUND65_S4_LIMITS.md` (mới, file này)
