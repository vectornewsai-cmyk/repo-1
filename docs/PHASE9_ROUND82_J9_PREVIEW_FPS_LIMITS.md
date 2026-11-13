# Đợt 82 J9 — Preview FPS: profile + 2 ứng viên bị bác bỏ bằng số đo (LIMITS)

Ngày đo: 10/11/2026 (lượt cron 21:35 +07; đo 14:43–16:42 UTC, tức
21:43–23:42 giờ VN). Người đo: luồng J9 (đợt 82).
Máy đo: VM này (4 vCPU, ~7GB RAM, Chromium 158 qua Xvfb + CDP; VM reboot
~14:27 UTC, up ~15 phút lúc bắt đầu). Nợ: GAP §0 "Preview FPS trên browser
thật" + I9 đợt 52 + I5 đợt 81.

## 1. Kết luận ngắn (đọc trước)

- **KHÔNG có thay đổi production nào được giữ.** Hai ứng viên duy nhất rút
  ra từ profile đều bị bác bỏ bằng số đo trực tiếp (xem §4): (a) bỏ
  held-frame copy — tiết kiệm ~0,3 ms/tick (decode-wait chỉ trả 1 lần/
  frame mới, lần vẽ main sẽ trả thay); (b) hạ `imageSmoothingQuality`
  high → medium/low — **không khác nhau** (p50 ~8 ms cả ba); chỉ tắt hẳn
  smoothing mới rẻ hơn (~1,3–1,8 ms) nhưng đó là đổi chất lượng hình
  thấy được + phá parity sharpen của R8, trong khi FPS vẽ đã >30 lúc
  tải thấp và lúc tải cao thì scheduling át hết — không có thắng lợi
  nào đo được ngoài nhiễu. Theo luật đợt: không thắng thì revert — ở
  đây không implement gì để revert; `preview.tsx` **không đổi**.
- **Preview FPS trên VM này là hàm của tải VM, không phải của code app.**
  Bằng chứng trực tiếp, cùng code, cùng clip, cùng harness:
  **7 draws/s lúc load ~3,5 → 38 draws/s lúc load ~1,7** (probe phase 1,
  clip 720p trơn, cửa sổ 2560×1440). Baseline bench cũng vậy: nhẹ
  **2,36 fps lúc load 24 → 24,31 fps lúc load 2–3**; vừa/nặng 12,5–12,7
  fps lúc load ~0,4–2 (R52 đo 1,4–4,6 fps lúc tải lẫn lộn 0,4–26).
  Mọi số FPS tuyệt đối trong file này chỉ có nghĩa kèm loadavg lúc đo.
- **1080p trơn, headless prod (đo lại): proxy 720p 6,47 fps vs gốc
  4,16 fps** — proxy vẫn nhanh hơn (hướng khớp R52) nhưng tỉ lệ 1,56×
  bị nhiễm (tải tăng 0,77 → 5,49 trong arm proxy); cả hai vẫn xa 30 fps.
- **Điểm nghẽn lớn nhất còn lại là scheduling latency của VM** (I9 đã
  kết luận; đợt này củng cố): tick nền không-video ~60 ms lúc tải ~3,5
  và ~25 ms lúc tải ~1,7; drawImage wall/call cũng co 4× theo tải
  (main upscale 55,35 → 13,13 ms/call). Không có thay đổi code app nào
  trong phạm vi previewEngine/canvas đo được là cải thiện FPS trên VM
  này — việc đúng vẫn là đo lại trên máy thật có GPU / CPU không tranh
  chấp trước khi kết luận về sản phẩm (như I9 §3.3).

## 2. Số FPS đo được (thật, có file JSON trong `benchmarks/results/`)

### 2.1 Nhẹ / vừa / nặng — bench-preview-fps.mjs, headed Xvfb, 1440×900

Cửa sổ đo 5s, warmup 0, canvas 872×276, dpr=1. `fpsAvg` = rAF của TRANG
(không phải draw fps của preview — xem §6.3).

| Lần đo | Project | Tải 1-phút | fpsAvg | frame p50 | Timer 16Hz | Chrome CPU |
|---|---|---|---|---|---|---|
| light-1 (r82) | nhẹ | 12,23 → 18,33 | **5,16** | 27,6 ms | 29,3/s | ~133% |
| light-3 (r82) | nhẹ | 24,16 → 21,25 | **2,36** | 352,8 ms | — | ~35% |
| light-8 (r82) | nhẹ | 2,1 → 3,2 | **24,31** | 39,1 ms | — | ~77–83% |
| medium-7 (r82) | vừa | 0,41 → 1,56 | **12,72** | 73,7 ms | — | ~97–128% |
| heavy-7 (r82) | nặng | 1,56 → 2,1 | **12,52** | 75,1 ms | — | ~93–97% |
| R52 (đối chiếu) | nhẹ/vừa/nặng | 0,4–26 | 1,4–4,6 | 208–810 ms | 31–45/s | 19–109% |

- Light-1 bị nhiễm cuối project (playhead chạm 8s trong cửa sổ 6s +
  warmup 2s); light-3/medium-7/heavy-7/light-8 dùng cửa sổ gọn 5s,
  warmup 0 (tổng 6,5s < 8s) nên sạch hơn.
- Vừa ≈ nặng (12,72 vs 12,52): thêm track PIP + adjustment layer gần
  như không tốn thêm ở mức rAF trang lúc tải thấp — LUT/effect làm nhẹ
  chậm ~2× so với vừa (24,31 → 12,72), xem §5.3 (chưa có fix).
- Các lần medium/heavy/light-2 lúc tải 33 đều HỎNG (bench thu chỉ 4–6
  mẫu rAF/5s, từ chối đo; dữ liệu từng phần: previewRaf gap P50
  2,2–2,7 GIÂY, timer 17–27/s; light-2: 20 tick mà draw=0, skip=7).
  Đó là bằng chứng starvation, không phải baseline.

### 2.2 1080p trơn + proxy 720p — measure-1080p-proxy.mjs, headless, prod 4173

Clip long1080.mp4 (h264 1920×1080, 30fps, 20s; dùng thay clip1080p.mp4
của R52 đã mất sau reboot). Build prod mới (tsc + vite build pass, §7).
Mỗi arm 1 clip trơn, đo rAF 6s, cửa sổ 1440×900.

| Arm | FPS | Frame p50 | Timer | Chrome CPU | Tải |
|---|---|---|---|---|---|
| **Proxy ON** (720p qua bridge) | **6,47** | 164,1 ms | 25,3/s | ~50% | 0,77 → 5,49 |
| **Gốc 1080p** (không proxy) | **4,16** | 214,4 ms | 16,5/s | ~113% | 5,49 → 5,71 |

- Proxy nhanh hơn gốc 1,56× — NHƯNG tỉ lệ bị nhiễm: tải tăng mạnh
  trong arm proxy (0,77 → 5,49, có thể do ffmpeg tạo proxy/sibling
  J1 chạy cùng lúc) và arm gốc chạy lúc tải đã cao (5,5–5,7, Chrome
  CPU 113% vs 50%). Đừng trích 1,56× như tỉ lệ sạch; hướng "proxy
  giúp" khớp R52 (1,27–1,40×, đo headed dev, 2 lần/arm). Cả hai arm
  đều << 30 fps.
- R52 (đối chiếu, headed dev): proxy 9,8/10,5 fps vs gốc 7,0/8,2 fps.

### 2.3 Draw rate thật của vòng preview — probe-82j9-draw-cost.mjs

Clip long720.mp4 (1280×720, 30fps, 20s), cửa sổ 2560×1440, canvas
preview backing 1991×815, dpr=1. Đếm `__vcutHoldStats.draw` (số lần
vẽ video thành công) trong lúc phát.

| Lần probe | Tải | Video active | Draws | Draw rate | Tick gap mean |
|---|---|---|---|---|---|
| Lần 8 | ~3,5 | [0,4s) | 28 | **~7/s** | 73,3 ms |
| Lần 9 | ~1,7 | [0,8s) | 308 | **~38/s** | 25,6 ms |

- Cùng code, cùng clip, cùng harness — chỉ khác tải: draw rate chênh
  **5,4×**. Đây là bằng chứng mạnh nhất của đợt này cho §1: FPS
  preview trên VM này do tải quyết định.
- Lần 8 chỉ có 4s video (patch đổi `out` mà `duration` clip vẫn 4s —
  bug nhỏ của probe, đã sửa ở lần 9 bằng cách patch clip 2 sang cùng
  long720); lần 9 video active [0,8s) (playhead chạm cuối project 8s).
- Cả hai lần: hold ≤5, skip 0 — decoder không tụt nhiều lúc tải thấp;
  syncReseekVideo chỉ +2 trong 12,6s (lần 9) — syncMedia gần như
  không seek lại khi phát trơn (xem §3.3).

## 3. Profile — chi phí vẽ ở đâu

### 3.1 Phân rã tick trong lúc phát (phase 1 probe)

| Lần | Khóa drawImage | Calls | Tổng ms | ms/call |
|---|---|---|---|---|
| 8 (tải ~3,5) | video→1280×720 (held copy) | 28 | 415,7 | **14,85** |
| 8 | video→1991×815 (main upscale) | 28 | 1549,8 | **55,35** |
| 8 | video→120×68 (thumbnail) | 2 | 97,9 | 48,95 |
| 9 (tải ~1,7) | video→1280×720 (held copy) | 308 | 242,1 | **0,79** |
| 9 | video→1991×815 (main upscale) | 308 | 4045,3 | **13,13** |
| 9 | video→120×68 (thumbnail) | 2 | 13,5 | 6,75 |
| 9 | canvas→1991×815 | 5 | 0,3 | 0,06 |

- Cùng một lần vẽ, wall-time co **4–19×** khi tải giảm 3,5 → 1,7.
  Phần lớn "chi phí drawImage" là thread chờ được schedule (khớp
  trace I9: thread-time << wall-time), không phải công việc thật.
- Thumbnail filmstrip (`video→120×68`) chỉ 2 lần/cửa sổ — không đáng kể.

### 3.2 Micro-benchmark drawImage (phase 2 probe, element video riêng)

| Phép đo | Lần 8 (tải ~3,5) | Lần 9 (tải ~1,7) |
|---|---|---|
| P1 phát, video→1280×720 (mean / p50 / p95) | 13,07 / **0,3** / 73,1 ms | 0,93 / **0,3** / 8,1 ms |
| P1 phát, video→1991×815 (mean / p50 / p95) | 39,61 / **18,6** / 93,4 ms | 10,43 / **7,9** / 18,0 ms |
| P2 sau seek: lần 1 (mean / p50) | 39,4 / **44,3** ms | 11,0 / **7,9** ms |
| P2 sau seek: lần 2 (mean / p50) | 5,66 / **1,1** ms | 0,28 / **0,3** ms |
| P2 sau seek: lần 3 (mean / p50) | 0,69 / **0,3** ms | 0,32 / **0,3** ms |
| P3 canvas→canvas 1280×720 (mean / p50) | 0,24 / **0** ms | 0,04 / **0** ms |
| P4 pause cùng frame, video→1991×815 (mean / p50) | 24,93 / **9,1** ms | 7,93 / **7,8** ms |

- **Decode-wait chỉ trả 1 lần/frame mới:** lần vẽ đầu sau seek tốn
  ~8–44 ms (tùy tải — bản thân nó cũng co theo tải), lần 2/3 cùng
  frame chỉ 0,3–1,1 ms. Blit canvas→canvas ~0 ms; blit video cùng
  frame 720p ~0,3 ms (p50).
- Upscale main 720p→1991×815: p50 **7,9–18,6 ms** (frame mới) và
  **7,8–9,1 ms** (cùng frame) — chi phí thật duy nhất đáng kể trong
  lần vẽ, và nó cũng co theo tải.
- Lưu ý đo: `currentTime` đọc trong vòng lặp đồng bộ bị đóng băng
  (artifact — totalVideoFrames vẫn +70/+23 trong P1 nên video thật
  sự vẫn tiến); đừng dùng 0/79 "currentTime không đổi" để kết luận
  video đứng.

### 3.3 Reseek syncMedia + nền scheduling

- `__vcutSyncReseeksVideo` chỉ **+2 trong 12,6s** phát trơn (lần 9):
  syncMedia gần như không seek lại — decode-wait KHÔNG đến từ
  reseek (ngưỡng drift 0,35s + chặn nhịp K9 đang làm đúng việc).
  Nới ngưỡng drift để "đỡ seek" không còn gì để đỡ.
- Tick nền không-video: gap mean ~60 ms lúc tải ~3,5 (lần 8: 173 tick
  mà chỉ 28 lần draw trong 4s video, còn lại tick nền ~60 ms) và
  ~25 ms lúc tải ~1,7 (lần 9: 318 tick/12,6s). Trần scheduling này
  tồn tại độc lập với code vẽ — rAF của trang trống còn ~32 fps
  (I9) trong khi preview cần vẽ mỗi tick.

## 4. Hai ứng viên bị bác bỏ (không implement, không A/B trên production)

### 4.1 Bỏ held-frame copy (1 drawImage video thêm/tick) — BÁC BỎ

- Lý do thử: mỗi tick vẽ thành công làm 2 lần drawImage từ video
  (held copy 1280×720 + main 1991×815); `storeHeldFrame`
  (`preview.tsx:1442-1469`, gọi tại ~1646) trông như chi phí thừa.
- Số đo bác bỏ: P2 cho thấy decode-wait (~8–44 ms) chỉ trả ở lần vẽ
  ĐẦU sau seek/frame mới; lần 2/3 cùng frame chỉ 0,3–1,1 ms.
  Held copy là lần vẽ đầu nên nó trả decode-wait — bỏ nó thì lần vẽ
  main (lần đầu còn lại) sẽ trả thay, tổng không đổi. Tiết kiệm thực
  chỉ ~0,3 ms/tick (blit 720p) trên tick 25–140 ms: **<2%, trong nhiễu
  đo**. Ngoài ra held copy là giá của cơ chế giữ frame khi decoder
  tụt (J4 đợt 26; lần 8 hold +1, lần 9 hold +5 — cơ chế vẫn được dùng).
  **Kết luận: không implement.**
- (G1 đợt 79 đã chứng minh cùng nguyên lý theo hướng ngược lại: đọc
  intermediate từ held canvas thay vì video thì rẻ hơn — vì lần vẽ
  video thứ hai mới là lần đắt khi frame chưa sẵn.)

### 4.2 Hạ `imageSmoothingQuality` high → medium/low — BÁC BỎ

- Lý do thử: `renderFrame` đặt `ctx.imageSmoothingQuality = "high"`
  trên canvas chính (R8 đợt 63, vì parity sharpen); trong software
  raster, "high" có thể đắt hơn hẳn "medium"/"low" cho upscale
  720p→1991×815 (~8–19 ms/tick).
- Số đo phase 3 (30 lần vẽ/ô, video→1991×815):
  - Đang phát: high p50 **8,1** / mean 10,89 ms; medium p50 **8,0** /
    mean 8,94; low p50 **8,0** / mean 8,95.
  - Pause cùng frame: high p50 **7,8** / mean 8,89; medium 7,8/7,83;
    low 7,8/7,79.
  - **high ≈ medium ≈ low (p50 giống hệt nhau)** — chất lượng
    smoothing trong số các chế độ bật không ảnh hưởng chi phí đo được.
  - Chỉ tắt hẳn smoothing mới rẻ hơn: playing off p50 **1,8** /
    mean 2,63; paused off p50 **1,3** / mean 1,32 (~6,5 ms/tick).
    Nhưng tắt smoothing là đổi chất lượng hình thấy được (upscale
    1,13–1,56× sẽ răng cưa/shimmer) + phá parity sharpen của R8 —
    không chấp nhận được như một "tối ưu" lặng lẽ. Và 6,5 ms cũng
    không đổi được FPS vẽ (đã 38/s lúc tải thấp; lúc tải cao thì
    scheduling hàng trăm ms át hết).
  **Kết luận: không implement; giữ `"high"` như R8.**

## 5. Kết luận + nợ mở

- **Không có cải thiện code nào thắng trên VM này.** Mọi chi phí
  app-side đo được (held copy ~0,3 ms, smoothing quality ~0 ms,
  reseek ~0, thumbnail ~0) đều nhỏ hơn 1–2 bậc so với scheduling
  latency (25–140 ms/tick, co 3–5× theo tải). Đây là kết quả âm có
  bằng chứng, không phải "chưa đo".
- **Nợ đo còn mở (không thuộc J9):**
  - LUT/effect làm nhẹ chậm ~2× (bench: 24,31 → 12,72 fps lúc tải
    thấp) — chi phí thật của app, nhưng sửa nó là tối ưu pipeline
    effect/WebGL, không kịp trong đợt này và chưa có A/B nào chứng
    minh hướng sửa. Để đợt sau quyết (đo A/B LUT on/off xen kẽ
    trước khi code).
  - Đo lại trên máy thật có GPU / CPU không tranh chấp — số quyết
    định trải nghiệm thật (như I9 §8).
  - 1080p/proxy: tỉ lệ 1,56× lần này bị nhiễm tải — đo lại 2–3 lần/
    arm lúc tải ổn định nếu cần tỉ lệ sạch.
  - Playhead chạy ~1× realtime ở lần 9 (đã hết clamp 0,1s cũ — J5
    đợt 53) — không còn là vấn đề.

## 6. Giới hạn — đọc trước khi trích số

1. **Mọi số FPS tuyệt đối trong file này chỉ có nghĩa kèm loadavg.**
   Cùng code cho 2,36 fps (tải 24), 5,16 (tải 12–18), 12,5–12,7
   (tải 0,4–2), 24,31 (tải 2–3), 38 draws/s (tải 1,7). Đừng trích
   một con số làm "tốc độ VCut".
2. **Bench fpsAvg là rAF của trang, probe draw rate là số lần vẽ
   preview** — hai metric khác nhau, cửa sổ khác nhau (1440×900 vs
   2560×1440), đừng so trực tiếp (vd 24,31 vs 38/s).
3. **1080p/proxy đo headless trên prod**, không phải headed dev như
   R52; tỉ lệ 1,56× bị nhiễm tải tăng trong arm proxy.
4. **JSON probe lần 8 đã bị lần 9 ghi đè** (cùng đường dẫn output) —
   số lần 8 trong §2.3/§3 chỉ còn trong log luồng
   `hidden_files/round82-j9.md`, không còn file JSON riêng. Số lần 9
   (đầy đủ phase 1+2+3) còn trong
   `benchmarks/results/preview-fps-r82-draw-cost.json`.
5. **Sóng EPERM + SIGTERM đã làm hỏng nhiều lần đo** (xem log luồng):
   EPERM từng đợt (vài giây tới >2 phút) giết 4 lần chạy chuỗi;
   1 lần SIGTERM cả nhóm lúc 16:25 UTC (nghi cleanup `pkill -f`
   match command line exec dài — từ đó chạy qua script file).
   Các số trong file này đều từ lần chạy hoàn tất, không phải lần
   bị giết giữa chừng.

## 7. Kiểm chứng

- `tsc` (apps/web, qua `npm run build`): **0 lỗi**; `vite build`
  **pass** (built in 6,11s, chỉ warning chunk-size cũ) — build prod
  dùng để đo 1080p §2.2.
- `node --check` probe-82j9-draw-cost.mjs: **OK** (sau khi khôi phục
  file bị EPERM truncate — xem log luồng).
- Probe lần 9: **EXIT=0**, 0 lỗi trang; phase 1+2+3 đầy đủ.
- Bench medium-7/heavy-7/light-8: **EXIT=0**, seed load đúng
  (seedLoaded=true / clips đúng), playing=true.
- `preview.tsx` **không đổi** (md5 không kiểm tra lại trong đợt —
  không sửa file này; chỉ thêm script probe + docs + JSON kết quả).
- Không đụng TTS/Gradio, workflow, binary; không push/tag.

## 8. File đổi / mới (đợt 82 J9 — KHÔNG push, chờ parent stage)

**Code app: không đổi.** `preview.tsx` nguyên trạng (2 ứng viên đều
bị bác bỏ trước khi code).

**Mới:**
- `apps/web/scripts/probe-82j9-draw-cost.mjs` — probe profile: phase 1
  phân rã tick (draw-wrap + gap rAF + holdStats + reseek counters),
  phase 2 micro-benchmark drawImage (mới/cùng frame/canvas), phase 3
  imageSmoothingQuality. Bài học harness ghi trong header: evalJs
  phải `awaitPromise=true`; TMPDIR phải ngắn (Chrome SingletonSocket
  giới hạn ~108 ký tự); ghi file có `writeFileRetry` 12×10s vì sóng
  EPERM; chạy qua script file để tránh SIGTERM `pkill -f`.
- `docs/PHASE9_ROUND82_J9_PREVIEW_FPS_LIMITS.md` — file này.
- `benchmarks/results/preview-fps-r82-draw-cost.json` — JSON probe lần 9.
- `benchmarks/results/preview-fps-r82-1080p-proxy.json` — JSON arm proxy.
- `benchmarks/results/preview-fps-r82-1080p-orig.json` — JSON arm gốc.
- `benchmarks/results/preview-fps-r82-light-1.json` — bench nhẹ lần 1
  (5,16 fps, tải 12–18; bị nhiễm cuối project).
- `benchmarks/results/preview-fps-r82-light-3.json` — bench nhẹ lần 3
  (2,36 fps, tải 24; cửa sổ gọn).
- `benchmarks/results/preview-fps-r82-light-8.json` — bench nhẹ lần 8
  (24,31 fps, tải 2–3).
- `benchmarks/results/preview-fps-r82-medium-7.json` — bench vừa
  (12,72 fps, tải 0,4–1,6).
- `benchmarks/results/preview-fps-r82-heavy-7.json` — bench nặng
  (12,52 fps, tải 1,6–2,1).

**Không đưa vào repo:** file R52 đã restore nguyên trạng
(`preview-fps-r52-1080p-{proxy,orig}.json` — backup/restore đã kiểm
tra, xem log luồng); clip1080p `/tmp` (copy của long1080); profile
Chrome; log bridge/vite.
