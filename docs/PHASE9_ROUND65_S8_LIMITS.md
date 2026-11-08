# LIMITS — Phase 9 đợt 65, luồng S8: FPS blend — decode 720p lúc lặng + presented-frame rate + FPS máy GPU thật

Ngày đo: 2026-11-08 (15:42–16:14 +07). VM: 4 vCPU, ~7,9 GB RAM, CPU-only
(SwiftShader), FFmpeg 8.1.2, Chromium headless 158 qua Xvfb + CDP.
Fixture: `long720.mp4` 20,0 s, 1280×720, 30 fps, testsrc2 + noise alls=15,
libx264 veryfast crf 23, maxrate 10M, 25,9 MB (tái dùng từ R61/R63/R64).

Nợ được giao: R64 LIMITS §8 mục 8 (R3 §1/§4): (a) đo lại decode 720p lúc
lặng, (b) presented-frame rate qua getVideoPlaybackQuality, (c) FPS máy
GPU thật. Cả 3 đều có số đo thật hoặc bằng chứng âm tính trung thực —
không bịa số nào.

## 0. Kết luận trước (TL;DR)

1. **Decode 720p lúc lặng (tab trắng, 5 rep × 3 seek × 10 s, n=15):**
   presented (ΔtotalVideoFrames) **mean 26,23 fps (18,71–30,75, std 3,67)**;
   rVFC **mean 16,02 (8,96–21,33, std 3,69)**. rVFC đếm thiếu hệ thống
   (~10 fps) — số decode 15,54 fps của R64 (chỉ dùng rVFC) ĐÁNH GIÁ THẤP
   tốc độ trình chiếu thật. Rep lặng tốt nhất (rep4): presented 29,93
   (29,35–30,75, std 0,59) — gần đủ 30 fps.
2. **Presented trong app (element pool TÁCH DOM): VẪN TĂNG — giả thuyết
   "element tách DOM thì totalVideoFrames đứng yên" BỊ BÁC BỎ.** Lúc lặng:
   presented **30,04 fps** (Δtotal 301/10,019 s), draw 47,21 fps. Lúc tải
   nặng (load5 5,4–8,0, 9 luồng khác chạy song song): presented 8,42–15,11
   (mean 12,37), draw sụp 0,29–2,68 (mean 1,72) — vòng vẽ/rAF gãy trước
   (gapP50 217–467 ms), pipeline media gãy sau. Đối chứng tab trắng cùng
   cửa sổ tải nặng cũng sụp (presented 8,86, mediaRate 0,283x) nên sụp
   draw là hiệu ứng tải VM, KHÔNG phải regression — xác nhận bằng lần chạy
   lại lúc lặng (draw 47,21, presented 30,04).
3. **Dropped trong app ≈ 0 nhưng frame vẫn mất:** dropped 0/0/5 qua 3 slot
   tải nặng (0 lúc lặng) trong khi presented chỉ 8–15 fps với mediaRate
   ~1,0x — frame mất không hiện ở dropped mà bị decoder bỏ qua (skip)
   để giữ kịp đồng hồ media. Đừng đọc dropped ≈ 0 là "không mất frame".
4. **FPS meter (PerfOverlay) đã có dòng presented thật:** "Frame trình
   chiếu (element): 19,2" khi đang phát, "…" khi đứng yên/dừng (không
   hiện 0 gây hiểu nhầm). Headed 4/4 pass, 0 lỗi trang.
5. **FPS máy GPU thật: CHƯA ĐO ĐƯỢC — VM không có GPU** (không nvidia-smi,
   không /dev/dri, WebGL SwiftShader; vaapi/cuda FAIL vì thiếu thiết bị).
   Harness đo đã viết sẵn, tự phát hiện GPU và đo hw decode ×3 khi có
   máy GPU. Cạm bẫy đã ghi: `ffmpeg -hwaccel auto` tự fallback software
   lặng lẽ (33/26 fps wall) — ok=true của nó KHÔNG phải bằng chứng HW.

## 1. Decode 720p lúc lặng — đo lại (script 1)

Harness mới: `apps/web/scripts/measure-65r8-decode-idle.mjs` (kế thừa
DECODE_FPS_FN của R64, thêm presentedFps = ΔtotalVideoFrames/wall +
chờ cửa sổ lặng trước mỗi rep: load1 < 1,5, tối đa 180 s/rep; hết giờ
vẫn đo nhưng ghi cờ quiet=false + loadavg thật).
Log: `hidden_files/round65-r8/decode-720-idle.log`,
JSON: `hidden_files/round65-r8/decode-720-idle.json`.

### 1.1 Bảng từng rep (mỗi rep = 3 seek 0/5/10 s × 10 s)

| Rep | Lặng? | Chờ lặng | Load lúc bắt đầu rep | rVFC fps mean (min–max) | presentedFps mean (min–max) | mediaRate mean |
|---|---|---|---|---|---|---|
| 1 | ✅ | 105,2 s | 1,41 | 11,30 (8,96–13,93) | 22,37 (18,71–26,67) | 0,59–0,85 |
| 2 | ✅ | 0 s | 1,12 | 17,55 (14,08–20,57) | 27,89 (24,66–30,25) | 0,79–0,99 |
| 3 | ❌ | 175,4 s (hết giờ) | 14,51 | 14,97 (12,57–16,57) | 25,21 (20,50–27,56) | 0,64–0,89 |
| 4 | ✅ | 165,5 s | 1,49 | 20,49 (19,07–21,33) | **29,93 (29,35–30,75)** | 0,93–0,99 |
| 5 | ✅ | 0 s | 0,94 | 15,77 (12,28–18,77) | 25,74 (22,67–29,15) | 0,72–0,94 |

Tổng 15 hàng: rVFC mean **16,02** (min 8,96, max 21,33, std 3,69);
presentedFps mean **26,23** (min 18,71, max 30,75, std 3,67);
mediaRate mean 0,84 (0,587–0,992); dropped tổng 3143 / presented tổng 3952.

### 1.2 Diễn giải — đính chính R64 §4.1

- **R64 "1080p decode tốt hơn 720p là do tải" chỉ đúng một nửa.**
  Trình chiếu 720p lúc lặng đạt 29,93 fps (rep4, std 0,59) — ngang trần
  30 fps, không thua 1080p. Nhưng dao động giữa các rep lặng vẫn lớn
  (22,37 → 29,93): tải load1 KHÔNG giải thích được — rep3 tải 14,5 vẫn
  25,21, cao hơn rep1 lặng (22,37). Yếu tố chi phối còn lại: warmup/
  cache (rep sau ổn định hơn rep đầu: std presented rep1 3,28 → rep4
  0,59), vị trí seek/GOP, và tiến trình nền khác. "Lúc lặng" theo
  load1 < 1,5 là điều kiện cần, chưa đủ để số ổn định ±5%.
- **rVFC đếm thiếu hệ thống so với presented (16,02 vs 26,23 mean).**
  rVFC chỉ bắn khi callback đã đăng ký lại — main thread bận là mất
  lượt; totalVideoFrames đếm ở tầng compositor nên đủ hơn. Mọi số decode
  rVFC từ R61–R64 đều là CẬN DƯỚI của tốc độ trình chiếu thật. Từ nay
  báo cả 2 số, lấy presented làm chính cho "decode có kịp phát không".
- **mediaRate < 1 ở hầu hết các hàng (0,587–0,992, mean 0,84):** phát
  chậm hơn realtime ngay cả lúc lặng — decode+present 720p trên
  CPU-only SwiftShader vẫn chưa giữ nổi 1,0x ổn định. Chỉ rep4 đạt
  0,93–0,99. Đây là giới hạn thật của VM, không phải của clip.
- **Dropped bất thường, chưa giải thích hết (nợ mới):** dropped/10 s
  dao động 48–301; tổng dropped 3143 trên presented 3952 — total+dropped
  thường ≈ 2× số frame trong cửa sổ (vd rep4 seek5: 308 presented +
  297 dropped = 605 frame cho ~10 s media 30 fps). Nghi ngờ bộ đếm gồm
  cả frame decode-ahead bị loại, không phải tỉ lệ drop sạch. KHÔNG dùng
  dropped/(total+dropped) làm tỉ lệ drop chính thức cho tới khi làm rõ
  ngữ nghĩa bộ đếm Chrome (xem §6.4).

## 2. Presented-frame rate trong app (script 2)

Harness mới: `apps/web/scripts/measure-65r8-presented-fps.mjs` — kế thừa
khung clicktest-64r3-fps-long.mjs (vite dev, inject long720 bằng patchClip,
GATE warmup draw delta ≥ 20 + element rs≥1/w>0/buf>0/ct>0/srcAttr) +
mẫu slot KÉP (draw + quality + element trong cùng 1 evaluate để wall
khớp) + guard mark `__r8mark` (element bị pool drop/tạo lại giữa slot
thì hủy slot) + RAF stats cắt theo TIMESTAMP (sửa biến thể bug n=0 của
R64 — ring buffer 5000 mẫu đẩy mẫu cũ, fromIdx tuyệt đối vượt độ dài;
file clicktest-64r3-fps-long.mjs vẫn còn bug đó, xem §6.5).
Baseline (không enhance), 10 s/slot, 3 rep + 1 rep xác nhận lúc lặng.
JSON: `hidden_files/round65-r8/presented/presented-fps.json` (+
`presented-quiet/presented-fps.json`), log cùng thư mục.

### 2.1 Lúc tải nặng (3 slot, load5 5,4–8,0 — 9 luồng đợt 65 chạy song song)

| Slot | draw fps | presented fps | dropped fps | mediaRate | phRate | gapP50 (n) | load trước→sau |
|---|---|---|---|---|---|---|---|
| rep1 | 2,19 | 15,11 (Δtotal 159/10,526 s) | 0 | 0,999x | 1,039x | 466,6 ms (23) | 3,65 → 2,84 |
| rep2 | 2,68 | 13,59 (Δtotal 137/10,078 s) | 0 | 1,000x | 1,005x | 333,3 ms (27) | 2,61 → 2,21 |
| rep3 | 0,29 | 8,42 (Δtotal 86/10,213 s) | 0,49 (Δ 5) | 0,925x | 1,005x | 216,6 ms (43) | 2,03 → 1,58 |

Tổng: draw mean **1,72** (0,29–2,68); presented mean **12,37** (8,42–
15,11, std 2,86); dropped mean 0,16; mediaRate mean 0,97x; phRate mean
1,02x. Element: attached=false, inDoc=false ở mọi slot — và total vẫn
tăng. **Giả thuyết "element tách DOM thì totalVideoFrames đứng yên"
BỊ BÁC BỎ bằng số đo trực tiếp.**

Đối chứng tab trắng cùng cửa sổ tải: rVFC 3,24 fps, presented 8,86
(Δtotal 93/10,5 s), dropped 53 (5,05 fps), mediaRate **0,283x** — decode
trần cũng sụp. Sụp draw trong app là hiệu ứng tải VM, không phải
regression của preview (xem §2.2).

### 2.2 Xác nhận lúc lặng (1 slot, load 4,65→3,85, load5 1,44→1,42)

| draw fps | presented fps | dropped | mediaRate | phRate | gapP50 (n) |
|---|---|---|---|---|---|
| **47,21** (473 draws/10,019 s) | **30,04** (Δtotal 301/10,019 s; q 202→503) | 0 | 1,000x | 0,995x | 16,7 ms (474) |

Đối chứng tab trắng cùng cửa sổ lặng: rVFC 21,43, presented 30,70
(Δtotal 308/10,033 s), dropped 22 (2,19 fps), mediaRate 0,993x.

- Draw 47,21 > presented 30,04 (tỉ lệ 1,57×): preview vẽ lại cùng frame
  — đúng hiện tượng R64 §6.2, nay đo được cả 2 số cùng slot. Draw FPS
  là tốc độ vẽ canvas (kể cả vẽ trùng frame); presented là frame mới
  thật element trình chiếu. Số người dùng thấy là draw; số clip "chạy"
  là presented; cả 2 đều cần báo, không thay nhau được.
- GATE warmup lúc lặng: draw delta 88/6 s (so với 23/6 s lúc tải nặng),
  element rs=4, q.total=161 — element khỏe hẳn khi VM lặng.
- RAF stats theo timestamp cho n=474, gapP50 16,7 ms, gapP95 50 ms —
  vòng rAF tick đúng 60 Hz lúc lặng; không còn n=0 (xem §6.5).

### 2.3 Dropped ≈ 0 trong app — đọc đúng

- Trong app dropped là 0/0/5 (3 slot tải nặng) và 0 (lúc lặng), trong khi
  presented chỉ 8–15 fps lúc tải nặng với mediaRate ~1,0x. Frame mất
  không đi qua droppedVideoFrames: decoder bỏ qua frame chưa decode
  (skip) để giữ kịp đồng hồ media, nên total+dropped < 30×wall.
- Đối chứng: tab trắng VISIBLE cùng clip thì dropped 22–301 — bộ đếm
  dropped chỉ có ý nghĩa khi element được compositor trình chiếu.
- Hệ quả cho FPS meter: KHÔNG hiện dropped của element trong app làm
  chỉ số mất frame; mất frame đọc ở presented < 30 khi mediaRate ≈ 1,0x.

## 3. FPS meter — dòng presented đã nối vào UI

- Lib mới `apps/web/src/lib/presentedFps.ts`: `takePresentedSample` /
  `presentedRateBetween` thuần (test được bằng Node) + ghi rõ giới hạn
  (attached=false thì total có thể đứng yên — nay đã biết là KHÔNG
  đứng yên trên Chrome này, nhưng lib vẫn giữ cờ attached để harness
  khác dùng).
- Lib nối UI `apps/web/src/lib/perfPresented65R8.ts` + fragment
  `apps/web/src/i18n/fragments/round65-s8.json` (2 key mới
  `perf.presentedFps`, `perf.presentedNote`, vi+en — parent gộp sau,
  đúng mẫu jobNote64R8.ts đợt 64 R8; KHÔNG sửa vi.json/en.json nên
  snapshot số key dict không đổi).
- `PerfOverlay.tsx`: thêm 1 dòng "Frame trình chiếu (element): X" +
  1 dòng ghi chú, lấy mẫu mỗi 1 s từ `__vcutMediaEls` (tổng total của
  các element VIDEO đang phát; không có → "…", không hiện 0; tổng đi
  lùi → hủy cửa sổ). Không đổi hành vi đo rAF cũ.
- Unit test: `presentedFps65R8.test.ts` **12/12**, `perfPresented65R8.test.ts`
  **8/8** (esbuild bundle + node).
- Headed `apps/web/scripts/measure-65r8-perf-overlay.mjs`: **4/4 pass**,
  0 lỗi trang — lúc đứng yên "…", đang phát hiện **19,2** (clip mẫu
  webm 640×360), sau khi dừng 2,5 s về lại "…". JSON:
  `hidden_files/round65-r8/overlay/overlay.json`.

## 4. FPS máy GPU thật — chưa đo được (bằng chứng âm tính)

Harness mới: `apps/web/scripts/measure-65r8-gpu-harness.mjs` — phân
biệt 3 tầng như `benchmarks/render/gpu_encode_harness.sh` (encoder
trong build / thiết bị / encode-decode thật). Chạy 2 lần (lần 2 sau khi
sửa cách ghi `hwaccel auto` — xem §5.2). JSON:
`hidden_files/round65-r8/gpu-harness.json`.

| Tầng | Kết quả |
|---|---|
| Thiết bị | nvidia-smi: KHÔNG CÓ; lspci VGA: (rỗng); /dev/dri: (rỗng); /proc/driver/nvidia: false; CPU AMD EPYC 9D25, 4 vCPU, 7,7 GB |
| FFmpeg build | 8.1.2; hwaccels: vdpau/cuda/vaapi/qsv/drm/opencl; encoder HW trong build: h264_nvenc, hevc_nvenc, h264_vaapi, hevc_vaapi, h264_qsv, hevc_qsv, av1_nvenc; decoder HW: h264_cuvid, hevc_cuvid, h264_qsv |
| WebGL | ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device (Subzero)), SwiftShader driver) — GPU giả lập CPU |
| Thử decode thật | `-hwaccel vaapi` FAIL ("Hardware device setup failed for decoder"); `-hwaccel cuda` FAIL ("Operation not permitted"); `-hwaccel auto` ok=true NHƯNG là fallback software (xem §5.2) |
| **Verdict** | **NO_GPU_ON_THIS_VM — chưa đo được FPS máy GPU thật** |

Cách đo trên máy có GPU (không cần sửa script): chép script + fixture
`long720.mp4` sang máy có NVIDIA/VAAPI/QSV rồi chạy
`node apps/web/scripts/measure-65r8-gpu-harness.mjs` — script tự phát
hiện thiết bị, thử từng hwaccel explicit, đo hw decode ×3, ghi cùng
file JSON (so với CPU decode R64 §4.2: 720p 95,66 fpsCpu).

## 5. Sự cố trong lúc đo (trung thực, không giấu)

1. **Đợt presented tải nặng sụp draw 0,29–2,68 fps** (mục 2.1) — lúc
   đầu tưởng regression của preview so với baseline R64 (11,43–54,58).
   Đối chứng tab trắng cùng cửa sổ cũng sụp (presented 8,86, mediaRate
   0,283x) + lần chạy lại lúc lặng hồi phục hoàn toàn (draw 47,21,
   presented 30,04) → kết luận là hiệu ứng tải VM (9 luồng đợt 65 chạy
   song song, load5 5,4–8,0), không phải regression. Bài học: mọi số FPS
   headed trong đợt nhiều luồng song song PHẢI kèm đối chứng tab trắng
   cùng cửa sổ + 1 lần chạy lại lúc lặng, nếu không sẽ kết luận sai.
2. **`ffmpeg -hwaccel auto` nói dối:** lần chạy GPU đầu ghi attempt
   auto ok=true (33 fps wall) và suýt được báo là "HW decode chạy".
   Kiểm tra lại: không có thiết bị thì auto tự fallback software lặng
   lẽ. Đã sửa script: thử vaapi/cuda explicit để lấy bằng chứng FAIL
   + gắn cờ `hwUsed: false` cho attempt auto + ghi rõ trong log. Trên
   máy GPU thật, nhánh có-thiết-bị cũng chỉ đo hwaccel explicit nào ok,
   không tin `auto`.
3. **Chờ lặng tốn thời gian:** decode-idle chờ 105 s + 175 s (hết giờ,
   rep3) + 165 s mới lặng; tổng phiên decode ~11 phút cho 150 s đo thật.
   Cửa sổ lặng trên VM 10 luồng song song là hiếm — các đợt sau nên đo
   FPS headed vào lúc ít luồng chạy hoặc chấp nhận ghi cờ quiet=false
   kèm loadavg như script này đã làm.
4. **Lệnh waiter 30 phút bị aborted:** lần đầu đặt vòng chờ lặng 30 phút
   bằng exec nền đã bị runtime abort (không có session); đã chạy lại
   trực tiếp khi load đã hạ (load5 0,76) và thành công. Không mất dữ liệu.
5. **Vite build lần đầu gọi sai config:** dùng config dev của harness
   (`vite.r8-presented.config.mjs`) nên build báo thiếu index.html —
   lỗi gọi lệnh của luồng, không phải lỗi code; đã chạy lại build chuẩn
   từ `apps/web` và pass (25,61 s).

## 6. Độ tin cậy & giới hạn

- **Tin được:** presented tab trắng 18,71–30,75 (n=15, rep lặng tốt nhất
  std 0,59); presented trong app lúc lặng 30,04 (Δtotal 301, khớp trần
  30 fps); draw lúc lặng 47,21 (khớp dải R64); GPU không có trên VM (3
  tầng bằng chứng độc lập); overlay headed 4/4.
- **Chưa tin hẳn:** số FPS tuyệt đối lúc tải nặng (dao động 5–10× theo
  cửa sổ tải — chỉ dùng để so sánh tương đối trong cùng cửa sổ, kèm
  loadavg); dropped tab trắng (ngữ nghĩa bộ đếm chưa rõ, §1.2); mediaRate
  trong app lúc tải nặng ≈ 1,0x trong khi tab trắng 0,283x — chênh này
  chưa giải thích được cơ chế (có thể preview syncMedia giữ nhịp element
  khác với video tự phát; cần đo đối chứng có/không syncMedia).
- **Không đo được đợt này:** FPS máy GPU thật; presented 1080p trong app
  (chỉ đo 720p); spread presented qua nhiều ngày (warmup/cache).
- **Không thay đổi:** thang blend piecewise (không đụng); ngưỡng FPS
  enhance 0,75x (không đụng); không sửa preview.tsx/media.ts (chỉ thêm
  lib + PerfOverlay + harness).

## 7. Nợ mở (chuyển đợt sau)

1. FPS máy GPU thật: chạy `measure-65r8-gpu-harness.mjs` trên máy có GPU
   (NVIDIA/VAAPI/QSV) — script đã sẵn, chỉ cần máy.
2. Presented 1080p trong app + decode 1080p bằng metric presented
   (so sánh công bằng với 720p §1 — R64 chỉ có rVFC cho 1080p).
3. Làm rõ ngữ nghĩa droppedVideoFrames của Chrome (total+dropped ≈ 2×
   frame cửa sổ) — đo kèm `webkitDecodedFrameCount` / đếm frame decode
   qua WebCodecs để đối chiếu.
4. mediaRate trong app ≈ 1,0x lúc tải nặng vs tab trắng 0,283x: đo đối
   chứng element tự phát vs element dưới syncMedia của preview.
5. RAF_STATS_FN n=0 trong `clicktest-64r3-fps-long.mjs` vẫn còn (nợ R64
   §8.3) — script mới đợt này đã dùng cách cắt theo timestamp và cho
   n=474 lúc lặng; nên backport cách đó vào file cũ.
6. Dropped của element trong app không hiện mất frame (skip ở decoder):
   nếu muốn chỉ số mất frame thật trong UI, cần đếm frame skip (so
   currentTime tiến vs total tiến) — chưa làm.
7. Ổn định số FPS headed: đo vào cửa sổ ít luồng song song, hoặc
   harness tự chờ lặng như decode-idle (load1 < 1,5) trước mỗi slot
   presented trong app.

## 8. Chạy lại được (harness)

```bash
# Decode 720p lúc lặng (5 rep × 3 seek × 10 s, chờ lặng load1<1.5)
cd ~/workspace/repo-1
node apps/web/scripts/measure-65r8-decode-idle.mjs
# Presented trong app (baseline, 10 s/slot, 3 rep) + đối chứng tab trắng
node apps/web/scripts/measure-65r8-presented-fps.mjs
# Trình đo lại lúc lặng (1 rep) — dùng sau khi tải VM hạ
R8_PRES_REPEATS=1 R8_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round65-r8/presented-quiet \
  node apps/web/scripts/measure-65r8-presented-fps.mjs
# GPU harness (probe + đo hw decode khi có GPU)
node apps/web/scripts/measure-65r8-gpu-harness.mjs
# Kiểm chứng dòng presented trong FPS meter (headed)
node apps/web/scripts/measure-65r8-perf-overlay.mjs
# Unit test (esbuild bundle + node, từ gốc repo)
./node_modules/.bin/esbuild apps/web/src/lib/presentedFps65R8.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round65-r8/presentedFps65R8.test.cjs && node /tmp/round65-r8/presentedFps65R8.test.cjs
./node_modules/.bin/esbuild apps/web/src/lib/perfPresented65R8.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round65-r8/perfPresented65R8.test.cjs && node /tmp/round65-r8/perfPresented65R8.test.cjs
```

## 9. Kiểm chứng trong đợt

- Unit: presentedFps65R8 **12/12**, perfPresented65R8 **8/8**.
- `tsc --noEmit` (apps/web) **exit 0**; `vite build` **pass** (25,61 s,
  cảnh báo chunk >500 kB có từ trước).
- Headed overlay **4/4** (O1/O2/O3 + H9), 0 lỗi trang.
- Presented harness: 3/3 slot hợp lệ (mark còn nguyên) + 1 slot xác nhận
  lúc lặng hợp lệ; đối chứng tab trắng chạy được cả 2 lần.
- Decode-idle: 5/5 rep hoàn thành (4 lặng, 1 không lặng nhưng ghi cờ),
  15/15 hàng có đủ loadavg trước/sau.
- GPU harness: chạy 2 lần, lần 2 sau khi sửa cách ghi `auto` (vaapi/
  cuda FAIL có bằng chứng stderr, verdict NO_GPU_ON_THIS_VM).
