# Đợt 64 R1 — Cache đĩa probe GPU (đóng nợ đợt 63 R2 §5.1/§8a): LIMITS trung thực

Ngày đo: 2026-11-08 (lượt ~12:40–13:10, giờ +07).
Máy đo: VM này (4 vCPU, RAM ~7.8GB, CPU-only, FFmpeg 8.1.2, libx264).
Harness: `server/render/src/test_round64_r1_gpu_probe_cache.js`
(**30/30 pass, exit 0**); self-test `gpuencode.js --self-test` xanh
(gồm cache MISS/HIT/null/force/TTL/file hỏng/tắt/xoá).
Log đầy đủ tại `workspace/goals/capcut-clone-video-editor/hidden_files/round64-r1/`
(`r64r1-measure.log`, `r64r1-test-p2.log`).

## 1. Kết luận ngắn

- **Cache đĩa hoạt động đúng như thiết kế.** Lần đầu probe thật + ghi
  `~/.cache/vcut/gpu-probe.json`, các lần sau đọc file: bước probe riêng
  trong process node mới **COLD median 1,21s → WARM median 0,004s**
  (3 lần mỗi phía; COLD 0,90–1,48s, WARM 0,00–0,01s) — tiết kiệm
  **~1,2s mỗi lần render** trên VM này, đúng khoảng đợt 63 đo
  (0,31–2,50s). Wall cả process WARM 0,59–0,99s là khởi động node, không
  phải đọc cache (bản thân probe chỉ 0–10ms).
- **Fallback CPU giữ nguyên và được khóa bằng test.** Mọi render đo (7 lần:
  warm-up + COLD×2 + WARM×2 + --reprobe-gpu + --no-gpu-probe-cache) đều
  ra h264 720p 5s hợp lệ, log đều `libx264 (CPU — …fallback libx264)`;
  render WARM log thêm tag `(probe cache disk HIT)`, render COLD/
  --reprobe-gpu/--no-gpu-probe-cache log KHÔNG có tag đó.
- **Phân biệt rõ "chưa probe" vs "đã probe: không có GPU".** File vắng/
  hỏng/hết TTL/sai fingerprint = MISS → probe lại; file có
  `encoder: null` = đã probe không GPU → HIT, không probe lại (test khóa
  cả hai trạng thái, gồm cả trường hợp tryFn giả trả GPU nhưng cache null
  vẫn thắng).
- **Full-render wall A/B KHÔNG kết luận được** (xem §3): COLD median
  48,17s vs WARM median 54,58s — WARM chậm hơn 6,41s là nhiễu tải, không
  phải hồi quy. Số sạch duy nhất là bước probe §2; đừng trích "render
  nhanh hơn X giây" từ đợt này.

## 2. Thiết kế (đọc code ở `server/render/src/gpuencode.js`)

- File cache mặc định `~/.cache/vcut/gpu-probe.json` (theo gợi ý đợt 63
  §8; cùng thư mục gốc với cache .trf `~/.cache/vcut/vidstab-cache`).
  Đổi đường dẫn: env `VCUT_GPU_PROBE_CACHE=<đường dẫn đầy đủ>`.
  Nội dung: `{ version: 1, probedAtMs, ffmpeg, ffmpegResolved,
  ffmpegSize, ffmpegMtimeMs, encoder, tried, detail }`.
- TTL mặc định **30 ngày** (env `VCUT_GPU_PROBE_TTL_MS` chỉ để test).
  Hết TTL → MISS → probe lại. TTL dài vì phần cứng hiếm khi đổi; rủi ro
  hết hạn muộn xem §5.3.
- Fingerprint ffmpeg **không spawn process** (chỉ `stat`): đường dẫn đã
  resolve (quét PATH bằng fs khi ffmpeg là bare name) + size + mtime.
  Đổi ffmpeg (cài lại/nâng cấp) → size/mtime đổi → MISS → probe lại.
  Không stat được ffmpeg → MISS (an toàn: probe lại, fail → null).
- Ghi cache qua file tạm + rename (như `trfCache.js`), best-effort:
  lỗi ghi (quyền/đĩa) không bao giờ fail render. Đọc lỗi (file hỏng,
  JSON sai, version khác, encoder lạ) → MISS, không throw.
- Nối vào đúng đường render: `render.js` §3c đường `--encoder auto` gọi
  `probeGpuEncoderCached()` thay cho `probeGpuEncoder()` (hàm cũ giữ
  nguyên cho test/harness cũ). Cache trong process vẫn đứng trước cache
  đĩa (cùng process render 2 lần thì lần 2 không đọc đĩa).
- Ép probe lại: CLI `--reprobe-gpu` (bỏ qua cả 2 lớp cache, probe thật +
  ghi đè file) hoặc xoá file cache. Tắt cache đĩa: CLI
  `--no-gpu-probe-cache` hoặc env `VCUT_GPU_PROBE_CACHE=0` (khi đó render
  probe lại mỗi lần = hành vi trước đợt 64).
- `--encoder` ép tay (nvenc/qsv/vaapi) **vẫn probe thật như cũ qua
  `tryEncode`, không qua cache đĩa** (theo yêu cầu đợt 63 §8) — cache
  chỉ phục vụ đường auto.
- Xoá file cache không đổi kết quả render, chỉ làm render sau chậm lại
  (probe lại) — cache chỉ là tối ưu tốc độ, không có trạng thái nào khác
  phụ thuộc vào nó.

## 3. Số đo thật

### 3.1 Bước probe riêng (process node mới, cache riêng qua env)

| | #1 | #2 | #3 | Median |
|---|---|---|---|---|
| COLD (xoá file trước mỗi lần) | 1,48s | 0,90s | 1,21s | **1,21s** |
| WARM (file có sẵn) | 0,01s | 0,00s | 0,00s | **0,004s** |

COLD khớp khoảng đợt 63 (0,31–2,50s). Cả 3 COLD đều `source=probe,
cached=false, encoder=null`; cả 3 WARM đều `source=disk, cached=true,
encoder=null`. Loadavg lúc đo: 14,58 (cao — 8–10 luồng đợt 64 chạy
song song) nhưng WARM vẫn ~0 vì không spawn ffmpeg.

### 3.2 Full render enhance 720p 5s preset Cân bằng (xen kẽ COLD/WARM)

Nguồn shakynoisy720 (gen như đợt 63), veryfast/CRF23, cache .trf đã làm
nóng bằng 1 render warm-up (71,09s, gồm detect mới + probe thật).

| Render | Wall | Loadavg lúc kết thúc | Tag cache trong log |
|---|---|---|---|
| COLD #1 (VCUT_GPU_PROBE_CACHE=0) | 45,19s | 3,87 | không |
| WARM #1 (cache HIT) | 43,11s | 1,97 | `probe cache disk HIT` |
| COLD #2 | 48,17s | 0,99 | không |
| WARM #2 | 54,58s | 0,65 | `probe cache disk HIT` |
| --reprobe-gpu | 59,07s | — | không (probe lại, mtime cache mới) |
| --no-gpu-probe-cache | 63,19s | — | không (file cache không bị ghi đè) |

Median COLD 48,17s vs WARM 54,58s (chênh −6,41s). **Đây là nhiễu tải,
không phải hồi quy**: cùng một render, wall dao động 43–71s giữa các
lần chỉ vì tải VM (loadavg 0,65–14,58 trong đợt đo; xem bài học đợt 61
§2.1 và đợt 63 §2.4 — wall tuyệt đối không trích được dưới tải dao
động). Tiết kiệm thật của đợt này là **~1,2s ở bước probe (§3.1)**,
chiếm ~2–3% full render Cân bằng 720p 5s — đúng kỳ vọng đợt 63 §8
(1–9%). Đừng trích con số full-render nào của bảng trên làm tốc độ
sản phẩm.

### 3.3 Kiểm chứng gộp

- `gpuencode.js --self-test`: **pass** (gồm cache đĩa MISS/HIT, cache
  `encoder: null`, forceReprobe, TTL=0, file JSON hỏng, tắt cache,
  xoá cache).
- Harness đợt này: **30/30 pass, exit 0** (unit + probe COLD/WARM×3 +
  render COLD/WARM×2 + 2 cờ mới).
- `server/render/test_p2.js` (hồi quy P2: probe giả lập + probe thật +
  render auto/ép nvenc fallback): xem `r64r1-test-p2.log`.
- `node --check` xanh cho cả 3 file đổi/thêm. Không đụng file web →
  không chạy tsc/vite (như đợt 63 §5).

## 4. Cách chạy lại / dùng

```bash
node server/render/src/gpuencode.js --self-test
node server/render/src/test_round64_r1_gpu_probe_cache.js  # ~6-8 phút tùy tải
# Xem cache hiện tại:
cat ~/.cache/vcut/gpu-probe.json
# Ép probe lại (vừa gắn/tháo GPU, đổi ffmpeg):
node server/render/src/render.js --spec x.json --out y.mp4 --reprobe-gpu
# Tắt cache đĩa (hành vi cũ — probe mỗi lần render):
VCUT_GPU_PROBE_CACHE=0 node server/render/src/render.js --spec x.json --out y.mp4
```

## 5. Giới hạn — đọc trước khi trích số

1. **Tải VM là biến số lớn nhất (như mọi đợt).** Loadavg 0,65–14,58
   trong đợt đo. Wall full-render dao động 43–71s cho cùng render;
   chỉ bước probe (§3.1, WARM ~0 vì không spawn process) và tỉ lệ
   trong cùng một phép đo mới trích được.
2. **Chỉ đo clip 5s, 720p, preset Cân bằng, n nhỏ** (probe 3+3 lần,
   render 2+2 lần). Ngoại suy clip dài/1080p chưa kiểm chứng; tiết
   kiệm tuyệt đối ~1,2s/lần render không đổi theo độ dài clip (probe
   chạy 1 lần/render), tỉ lệ % sẽ nhỏ hơn trên clip dài.
3. **Cache stale khi đổi phần cứng trong TTL 30 ngày.** Gắn GPU mới
   (hoặc tháo GPU) mà không chạy `--reprobe-gpu`/xoá file thì render
   auto tiếp tục dùng kết quả cũ tối đa 30 ngày: gắn thêm GPU → bỏ lỡ
   encode GPU (chỉ chậm hơn, không sai); tháo GPU → render auto dùng
   encoder GPU đã cache → ffmpeg encode fail → **render fail** (không
   có fallback ở bước encode chính — khác với probe ép tay có fallback).
   Đây là rủi ro thật duy nhất của cache; giảm nhẹ bằng TTL + fingerprint
   ffmpeg + cờ `--reprobe-gpu`, nhưng chưa có cơ chế phát hiện phần
   cứng đổi tự động. Nợ mở: cân nhắc kiểm tra rẻ sự hiện diện thiết bị
   (/dev/dri, nvidia-smi) trước khi tin cache, hoặc fallback libx264
   khi encode GPU fail giữa render (xem §6).
4. **Fingerprint ffmpeg trên VM này yếu một nửa.** `/usr/bin/ffmpeg`
   có mtime = epoch 0 (quirk overlayfs của VM: Access/Modify/Change đều
   1970-01-01) nên fingerprint thực tế chỉ còn path + size. Cài lại
   ffmpeg cùng version (cùng size) sẽ không làm cache hết hạn — chỉ còn
   TTL 30 ngày bảo vệ. Trên máy thường mtime có nghĩa nên vấn đề này
   chỉ áp dụng cho VM này.
5. **Một lần quan sát cold probe 10,9s ngoài harness** (lệnh `node -e`
   tay, loadavg ~12,5, lần spawn ffmpeg đầu tiên sau khi mở máy) —
   cao hơn hẳn khoảng đợt 63 (0,31–2,50s) và harness đợt này
   (0,90–1,48s). Chưa rõ nguyên nhân (có thể spawn đầu tiên + tải);
   không dùng số này làm kết luận, chỉ ghi lại là outlier chưa giải
   thích được.
6. **Chưa từng encode GPU thật.** VM không có GPU nên mọi số trên đều
   là "probe fail → fallback libx264". Trên máy có GPU, cache sẽ ghi
   encoder GPU thật — đường đó chưa được kiểm chứng (cần máy có GPU).
7. **Cache là file local theo user, không theo repo.** Máy khác/user
   khác không thấy cache này (đúng thiết kế — probe theo máy). Bridge
   restart không mất cache (file trên đĩa), nhưng nếu `HOME` đổi hoặc
   thư mục `~/.cache` bị xoá thì probe lại 1 lần.
8. **Đồng thời:** 2 render chạy cùng lúc khi cache MISS đều probe thật
   + ghi cùng file (ghi tạm + rename nên file không hỏng, chỉ tốn 2
   lần probe). Không lock — chấp nhận được vì probe chỉ tốn ~1s và
   hiếm khi MISS đồng thời.
9. **Không có UI cho cache.** Ép probe lại chỉ có qua CLI/env (xem §4);
   chưa có nút trong EnhancePanel hay settings — user thường không
   biết cache tồn tại (ghi chú để đợt UI sau quyết định có cần không).

## 6. Nợ mở thêm (cho đợt sau)

- **Fallback libx264 khi encode GPU (đã cache) fail giữa render.**
  Hiện tại render fail luôn nếu encoder GPU trong cache không còn dùng
  được (tháo GPU trong TTL). Hướng: bắt lỗi encode, thử lại bằng
  libx264 rồi mới fail job — cùng triết lý "không bao giờ fail job vì
  GPU" của Phase 7 P2.
- **Phát hiện đổi phần cứng rẻ trước khi tin cache** (vd stat
  /dev/dri/renderD128, /dev/nvidia*, `nvidia-smi --query-gpu` khi có)
  để cache tự hết hạn khi thiết bị xuất hiện/biến mất, thay vì chờ TTL.
- **Nút "Probe lại GPU" trong UI** (EnhancePanel/settings) gọi
  `--reprobe-gpu` hoặc xoá file cache qua bridge — hiện chỉ có CLI.
- **Đo lại trên máy có GPU thật** để kiểm chứng nhánh cache encoder GPU
  (HIT trả nvenc/qsv/vaapi và render dùng đúng encoder đó).

## 7. Cách chạy lại

```bash
node server/render/src/gpuencode.js --self-test
node server/render/src/test_round64_r1_gpu_probe_cache.js
node server/render/test_p2.js   # hồi quy P2 (probe + render auto/ép nvenc)
```
