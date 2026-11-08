# Đợt 52 I9 — Preview FPS thật trên browser + điểm nghẽn (LIMITS)

Ngày đo: 2026-11-06 (chiều/tối). Người đo: luồng I9 (đợt 52).
Nợ gốc: `PHASE9_GAP_ANALYSIS.md` §2.4 P3 — "Preview FPS trên browser thật CHƯA ĐO".

## 1. Kết luận ngắn (đọc trước)

- **Preview FPS khi phát trên VM này: ~1,4–4,6 fps** (project nhẹ/vừa/nặng, dev lẫn prod,
  headless lẫn headed Xvfb) — **rất xa 30fps**. Project 1080p 1 clip trơn (không LUT/effect)
  nhanh hơn: **7–10 fps**, vẫn xa 30.
- **Không phải lỗi code vẽ của app.** Mỗi tick preview chỉ tốn **3–20ms thread-time**
  (CDP trace `tdur`), đủ nhanh cho 30–60fps; nhưng **wall-time mỗi frame 70–1100ms** vì
  main thread / compositor / GPU process **bị hệ điều hành deschedule** (VM 4 vCPU,
  load 1–26 do 9+ luồng agent khác chạy ffmpeg/TTS/electron song song). Đây là **điểm nghẽn
  môi trường (scheduler latency)**, không phải điểm nghẽn thuật toán.
- **Proxy 720p giúp thật nhưng không cứu được FPS**: 1080p 1 clip — proxy ON **9,8 / 10,5 fps**,
  proxy OFF **7,0 / 8,2 fps** (2 lần đo mỗi arm, chênh ~25–40%). Vẫn << 30fps.
- **Tối ưu code đã thử và REVERT**: `desynchronized: true` trên canvas 2D — đo trước/sau
  không cải thiện (1,79 / 1,84 fps sau, nằm trong khoảng nhiễu 1,43–4,59 trước) nên đã
  gỡ, **không còn thay đổi nào trong code app**. Harness đo + script mới được giữ lại.
- **Playhead chạy chậm hơn thời gian thật**: do `dt` clamp 0,1s trong vòng preview, playhead
  chỉ tiến ~0,14–0,2× realtime khi frame thưa (8s project mất ~40s wall mới hết). Đây là
  hành vi đúng của clamp, không phải bug đo — nhưng là trải nghiệm tệ khi FPS thấp.
- **Cảnh báo về số prod**: các lần đo prod (cổng 4173) chạy với **media mẫu mau-1/mau-2
  THIẾU** (xem §6) — tức vòng preview chạy không có video decode; số dev (cổng 5173,
  media đủ) mới là số "có video thật". Cả hai nhóm đều cho ~1,4–4,6 fps nên kết luận
  chung không đổi, nhưng đừng so sánh dev-vs-prod như cùng điều kiện.

## 2. Số FPS đo được (thật, có file JSON trong `benchmarks/results/`)

Cấu hình chung: viewport 1440×900, canvas preview 872×276 (dpr=1), VM 4 vCPU
(`nproc`=4; memory ghi 2vCPU), không GPU, Chromium Playwright cache (Chrome/156).
Mỗi lần đo: bấm Phát, đếm rAF trong 6s. `timer` = tần suất setInterval(16ms) chạy song
song (lý tưởng ~62/s — đo mức "đói chung" của renderer, không riêng rAF).

### 2.1 Project nhẹ / vừa / nặng (media mẫu webm 640×360, 2 clip × 4s + text)

| Lần đo | Build | Project | Mode | FPS | Frame p50 | Timer | Chrome CPU | Loadavg |
|---|---|---|---|---|---|---|---|---|
| baseline-light | vite dev | nhẹ (sample) | headless | **4,66** | — | — | — | ~4 |
| light-headed | dev | nhẹ | headed Xvfb | **1,59** | 690ms | — | 31% | 12,7→15,2 |
| medium-headed | dev | vừa | headed Xvfb | **1,48** | 697ms | — | 20% | 1,2→0,5 |
| medium-headless | dev | vừa | headless | **1,40** | 597ms | — | 19% | 0,4→14,5 |
| medium-nopaused | dev | vừa | **tạm dừng** | **19,65** | 16,8ms | — | 21% | 15,1→10,9 |
| medium-warm | dev | vừa | warmup 4s + đo 4s | ~2 (8 mẫu) | — | — | — | ~18 |
| text-only | dev | chỉ text | headless | **1,47** | 771ms | — | 45% | 15,3→8,4 |
| medium-prod | prod | vừa | headless | **4,09** | 213ms | — | 109% | 4,9 |
| medium-prod-small | prod | vừa | headless 960×600 | **4,59** | 208ms | — | 79% | 4,8→3,5 |
| medium-prod2 | prod | vừa | headless | **1,43** | 810ms | — | 84% | 0,9→0,6 |
| medium-prod-hidecanvas | prod | vừa | headless, ẩn canvas | **1,56** | 681ms | — | 54% | 1,9→4,0 |
| heavy-prod | prod | nặng (3 track, 7 clip + adjustment) | headless | **3,27** | 305ms | 42,3/s | 56% | 1,5→1,2 |
| blank-page control | — | (trang trống + canvas vẽ lại) | headless | **32,46** | 16,6ms | — | — | ~19 |

Project vừa = nhẹ + LUT `vcut-cyberpunk`/`vcut-cinematic` + blur/sharpen + transition
`dissolve` 0,6s + 1 text clip. Project nặng = vừa + track PIP (opacity 0,7, LUT + sepia)
+ adjustment layer (LUT + vignette) + 1 text clip. Seed: `make-preview-fps-seeds.mjs`.

**Đọc số đúng cách:** cùng project/build đo lặp cho 1,40 / 4,09 / 4,59 / 1,43 fps —
phương sai rất lớn theo từng lần chạy, không có "một con số" duy nhất. Khoảng tin cậy
trung thực: **nhẹ/vừa/nặng ~1,4–4,6 fps khi phát; ~20 fps khi tạm dừng; ~32 fps trang trống.**

### 2.2 Proxy ON vs OFF — clip 1080p 1 clip (h264 1920×1080, 8s, `/tmp/clip1080p.mp4`)

Đo bằng `measure-1080p-proxy.mjs` (import → proxy → thêm lên timeline → phát, cùng một
phiên — xem §5 vì sao phải cùng phiên). Mỗi arm đo 2 lần:

| Arm | Lần 1 | Lần 2 | Frame p50 (lần 2) | Timer (lần 2) | Loadavg (lần 2) | Playhead hết 6s |
|---|---|---|---|---|---|---|
| **Proxy ON** (720p qua bridge) | **9,79 fps** | **10,47 fps** | 89,5ms | 44,7/s | 1,9→2,1 | 00:05,9 / 00:08,0 |
| **Gốc 1080p** (không proxy) | **6,98 fps** | **8,22 fps** | 106,3ms | 36,8/s | 2,1→2,0 | 00:05,1 / 00:08,0 |

Proxy nhanh hơn gốc ~25–40% (tỉ lệ 1,27–1,40, lặp lại cả 2 lần) — decode 1080p đắt hơn
720p là thật. Nhưng **cả hai đều << 30fps**: proxy giúp, không cứu được. Pipeline proxy
đã kiểm chứng end-to-end trước đó (`check-proxy-auto.mjs`: "PROXY 720p OK", bridge 8787).

## 3. Điểm nghẽn — bằng chứng

### 3.1 Bằng chứng chính: thread-time << wall-time (CDP trace, text-only, 6s)

Trace `preview-trace-r52-textonly-stack.json` (có `tdur` — thread time thật):

- 21 `FireAnimationFrame` trong 6s; callback dài nhất **1096ms wall nhưng chỉ 20,6ms
  thread-time**; các FAF khác 71–85ms wall / 4–7ms thread-time. **Code callback rẻ**,
  thời gian wall là thread **không được CPU chạy** (deschedule), không phải code chạy lâu.
- `BeginMainFrame` về cách nhau 0,2–1,2s; mỗi cái wall 71–1182ms / thread 5–29ms.
  Giữa các frame, main thread gần như **không có task nào** — nó đang **chờ compositor**
  phát hành frame tiếp theo, còn compositor/GPU process cũng đang chờ được schedule.
- `Canvas2DResourceProvider::ProduceCanvasResource` chỉ 10–13ms wall / ~2ms thread mỗi
  frame — không phải nút cổ chai. RasterTask tổng ~361ms trong trace đầu.

### 3.2 Loại trừ (mỗi dòng là một lần đo đối chứng thật)

- **Không phải video decode**: project chỉ-text (không có video nào) vẫn 1,47 fps.
- **Không phải LUT/effect**: project nhẹ (không LUT/effect) vẫn 1,59 fps.
- **Không phải raster canvas**: ẩn `.preview-canvas` (`display:none`) vẫn 1,56 fps.
- **Không phải kích thước canvas/cửa sổ**: cửa sổ 960×600 (canvas co còn 392×1) vẫn 4,59 fps.
- **Không phải load VM**: 1,43 fps ở load 0,86; 4,59 fps ở load 4,8 — không tương quan.
- **Không phải JS bão hòa**: CPU profile steady-state (2nd play, đã warm) — main thread
  **94,9% idle**, tổng JS 1,4%. Profile lần 1: `createAudioContext` ~2s thread-time
  (xem §4.2 — đã warm sẵn ở pointerdown, ngoài cửa sổ đo).
- **Không phải GPU process**: GPU process chỉ ~7% CPU trong lúc đo.
- **Không phải rAF bị bóp riêng**: setInterval(16ms) chạy song song chỉ đạt **31–45 lần/s**
  (lý tưởng ~62/s) — renderer **đói chung**, không phải riêng rAF.
- **Không phải canvas full-res**: canvas đã đúng kích thước hiển thị (872×276, dpr=1) —
  claim "canvas full-res" trong gap analysis đã lỗi thời; giảm phân giải không còn gì để giảm.

### 3.3 Cơ chế (giải thích được mọi số liệu)

Mỗi frame preview là một **chuỗi nối tiếp qua nhiều tiến trình**: main thread (tick ~5ms)
→ commit → compositor → GPU process (produce canvas resource, verify flush) → present
→ BeginFrame tiếp theo. Trên VM oversubscribed (load 1–26, 9+ luồng agent khác chạy
ffmpeg/TTS/electron), **mỗi hop trả phí scheduling latency 100–1000ms**. Chuỗi nối tiếp
nên phí cộng dồn → 1,4–4,6 fps. Khi tạm dừng, không còn chuỗi present → rAF đo được
~20 fps; trang trống không có canvas/video/audio → ~32 fps. Project 1 clip 1080p trơn
(7–10 fps) nhanh hơn vừa/nặng vì ít việc hơn mỗi tick, nhưng vẫn bị cùng trần scheduling.

**Hệ quả thực tế:** không có thay đổi code app nào (trong phạm vi previewEngine/canvas)
đo được là cải thiện FPS trên VM này — vì code không phải nút cổ chai. Việc đúng là
**đo lại trên máy thật có GPU / CPU không bị tranh chấp** trước khi kết luận về sản phẩm.

## 4. Tối ưu đã thử (chỉ giữ cái nào cải thiện thật — theo luật đợt)

### 4.1 `desynchronized: true` trên canvas 2D — THỬ, ĐO, REVERT

Lý do thử: `ProduceCanvasResource` + `VerifyFlush` là vòng đợi tới GPU process mỗi frame;
`desynchronized: true` cho phép canvas trình bày không đồng bộ với vsync compositor.
Thay đổi: `canvas.getContext("2d", { desynchronized: true })` tại 2 điểm lấy context của
canvas preview trong `preview.tsx` (tickInner ~2508, hitText ~3299), kèm chú thích.

Kết quả trước/sau (prod, headless, 6s):
- Medium: trước 4,09 / 4,59 / 1,43 fps → sau **1,79** (load 7,9→9,7), **1,84** (heavy, load 9,4→10,9),
  lần lặp thứ 3 chỉ thu được 9 mẫu rAF/6s (bench từ chối vì <10 mẫu).
- Sau nằm **trong khoảng nhiễu trước** (1,43–4,59), không chứng minh được cải thiện →
  **đã revert toàn bộ**, `preview.tsx` hiện không còn thay đổi nào (grep `desynchronized` = 0).
  Build prod sau revert đã chạy lại (`tsc 0 + vite build pass`, xem §7).

### 4.2 Hoãn tạo AudioContext — ĐÓNG, không làm

Profile lần 1 cho thấy `new AudioContext()` tốn ~2s thread-time. Nhưng `kickAudio`
(`preview.tsx:3261-3263`) đã gọi `engine.ensure()` trên **mọi pointerdown/keydown** —
tức AudioContext được tạo ở lần bấm đầu tiên (trước cả cú click Phát), ngoài cửa sổ đo.
Hoãn tạo không còn gì để hoãn. Phần còn lại của tick đầu (~2–3,4s wall ngoài AudioContext)
theo `tdur` chủ yếu là deschedule (xem §3.1), không phải code.

### 4.3 Không làm (đã xem xét, không có bằng chứng sẽ giúp)

- Giảm phân giải canvas theo kích thước hiển thị: canvas **đã** đúng kích thước hiển thị.
- Dùng proxy làm nguồn preview mặc định: proxy đã là mặc định khi bridge chạy + video
  >720p (auto-proxy BẬT mặc định); đo §2.2 cho thấy nó giúp ~25–40% nhưng không đủ.
- Throttle vẽ / OffscreenCanvas / giảm tần suất cập nhật time-display: công việc mỗi tick
  chỉ 3–20ms — không phải nút cổ chai; không đo mù.
- Nâng clamp `dt` 0,1s để playhead chạy đúng tốc độ wall-clock: đổi semantics timing của
  vòng preview (clamp tồn tại để chống nhảy sau sleep/wake) — là việc riêng, không làm
  trong đợt này; ghi vào nợ mở (§8).

## 5. Phát hiện phụ: proxy chỉ sống trong phiên (quan trọng cho ai đo sau)

- `proxyUrl` chỉ nằm trong store bộ nhớ (`setMediaProxy`); **manifest AssetStore không lưu
  proxyUrl** (field: assetId, originalName, sha256, size, mimeType, kind, ingestedAt,
  refCount, width, height, duration, thumbnail).
- Item khôi phục sau reload **không có `file`** (chỉ có url) nên **nút Proxy không render**
  (`MediaBin.tsx:99`: chỉ render khi `item.kind === "video" && item.file`) — sau reload
  không thể tạo proxy cho item đã restore. Auto-proxy chỉ chạy lúc import (`onFiles`).
- Hệ quả: đo proxy phải import → tạo proxy → phát **trong cùng một phiên, không reload**
  (đó là cách `measure-1080p-proxy.mjs` làm). Bench seed+reload thông thường sẽ đo bản
  gốc dù seed trỏ file 1080p.
- Hỏi thêm: sau reload, preview dùng bản gốc 1080p (không proxy) cho tới khi user import
  lại — hành vi này có thể là nợ UX riêng (không thuộc phạm vi đợt này).

## 6. Caveat đo lường (đừng trích số mà bỏ qua)

1. **Media mẫu thiếu trên origin prod (:4173).** IndexedDB tách theo origin: mau-1/mau-2.webm
   chỉ có trên `:5173` (vite dev), **manifests trên `:4173` rỗng** (đã kiểm chứng bằng probe
   trực tiếp). Mọi lần đo prod (medium/heavy/desync) chạy với project trỏ asset thiếu —
   preview ở trạng thái missing-asset, không decode video. Số dev (media đủ) và prod
   (media thiếu) đều ~1,4–4,6 fps nên kết luận không đổi, nhưng **không so sánh dev-vs-prod
   như cùng điều kiện**. Đo 1080p proxy/orig (§2.2) không bị ảnh hưởng: file được import
   trực tiếp trên `:4173` trong phiên đo.
2. **Phương sai lớn.** Cùng project/build cho 1,40–4,59 fps tùy lần chạy (do load VM dao động
   0,4–26 vì luồng khác). Mọi số trong §2 là điểm đo, không phải hằng số sản phẩm.
3. **Load VM không ổn định.** Trong lúc đo có lúc `drive51h2.py` (TTS) chiếm 85–99% CPU,
   ffmpeg render, electron test, `xz -d` — loadavg ghi kèm từng lần đo trong JSON.
4. **Chrome từng SIGTRAP** 2026-11-06 ~19:00–19:10 (không mở được debug port; cả Chrome của
   luồng I8 cũng chết; `strace` thì chạy được) — tự hết, nguyên nhân không rõ, nghi do
   sandbox/load. Harness bench poll target 30s không log heartbeat — nên thêm nếu dùng lại.
5. **`getEntriesByType('longtask')` không observer trả 0** — đừng tin; longtask thật chỉ thấy
   qua PerformanceObserver `buffered:true` (đo được 18→35 longtask, tổng ~6s trong ~10s phát).
6. **Không đo `test-preview-engine.sh` dòng 547**: fail pre-existing wipeleft (51,5 vs 50) —
   xem §7, không phải hồi quy.

## 7. Kiểm chứng

- `bash apps/web/scripts/test-preview-engine.sh`: tsc compile sạch, transform-order OK,
  dừng ở fail **pre-existing dòng 547** (`transClip: wipeleft p=0.5 → B x=51.5, expected 50`),
  exit 1 — đúng như `ROUND51_LIMITS.md` §2.6, không phải hồi quy.
- `node --experimental-strip-types apps/web/src/lib/previewEngine.test.ts`: **14/14 passed**.
- `npm run build` (apps/web): **tsc 0 + vite build pass** (chạy 2 lần trong đợt: trước tối ưu
  và sau khi revert; lần cuối 26,5s, chỉ còn warning chunk-size cũ).
- `node --check` qua cho mọi script mới/sửa (bench, seeds, probe, import, measure).

## 8. Nợ mở

- **Chưa đo**: Safari; máy thật có GPU; máy người dùng điển hình (CPU không tranh chấp) —
  đây mới là số quyết định trải nghiệm thật. Số trên VM này **không dùng được để kết luận
  VCut chậm trên máy người dùng**.
- Chưa đo: heavy trên dev; light trên prod; medium 1080p có LUT/effect (so proxy trên
  project nặng thật, không chỉ 1 clip trơn).
- Playhead chạy ~0,14–0,2× realtime khi FPS thấp (clamp `dt` 0,1s) — cân nhắc tách việc
  "playhead theo wall-clock" riêng (đổi semantics, cần thiết kế).
- Proxy mất sau reload (§5) — cân nhắc lưu proxyUrl vào manifest hoặc tạo lại proxy cho
  item restore (việc UX riêng).
- Bridge từng bận cổng 8787 do luồng khác (EADDRINUSE) — đo proxy cần kiểm tra bridge
  đang chạy là của mình hay của luồng khác.
- Harness bench: poll target 30s im lặng nên thêm heartbeat log; `pkill -f` tự match
  chính mình (đã tự kill shell 2 lần) — chỉ kill Chrome theo PID.

## 9. File đổi / mới (đợt 52 I9 — KHÔNG push, chờ parent stage)

**Code app: không còn thay đổi nào** (`preview.tsx` đã revert về nguyên trạng;
`git diff` không áp dụng được — `~/workspace/repo-1` không có `.git`, push qua API).

**Mới:**
- `apps/web/scripts/probe-raf-control.mjs` — đối chứng rAF trang trống.
- `apps/web/scripts/probe-media-clock.mjs` — longtask observer + playhead/video probe.
- `apps/web/scripts/probe-cpu-profile.mjs` — CDP Profiler theo hàm/file (có `--preplay`).
- `apps/web/scripts/probe-trace.mjs` — CDP Tracing + `--analyze` (top event, BeginFrame).
- `apps/web/scripts/probe-replay.mjs` — đo FPS lần phát thứ 2 (chưa chạy thành công).
- `apps/web/scripts/make-preview-fps-seeds.mjs` — seed vừa/nặng từ autosave nhẹ.
- `apps/web/scripts/import-1080p-for-bench.mjs` — import 1080p vào profile bench, ghi 2 seed.
- `apps/web/scripts/measure-1080p-proxy.mjs` — đo FPS proxy ON/OFF cùng phiên (2 arm).
- `docs/PHASE9_ROUND52_I9_PREVIEW_FPS_LIMITS.md` — file này.
- `benchmarks/results/preview-fps-r52-*.json` (23 file: 18 FPS + 3 cpu-profile + 2 trace;
  có 1 file 0 byte `medium-prod-timer.json` do lần chạy bị kill giữa chừng, và 2 file chứa `error`
  do <10 mẫu rAF — giữ nguyên làm bằng chứng).

**Sửa:**
- `apps/web/scripts/bench-preview-fps.mjs` — cờ `--headed/--profile/--seed-autosave/
  --dump-autosave/--no-play/--warmup/--window-size/--hide-canvas`; sample CPU cây Chrome
  mỗi 500ms; loadavg trước/sau; frame-time p5/p50/p95; đếm song song setInterval(16ms);
  phân tích `__vcutPreviewRaf` (gap/lost); kiểm tra seed load đúng (tên project + số clip).
- `benchmarks/RESULTS.md` §5 — điền số R52 (thay "CHƯA ĐO").

**Không đưa vào repo:** clip 1080p (`/tmp/clip1080p*.mp4`), seed (`/tmp/vcut-fps-r52-seeds/`),
profile Chrome (`/tmp/vcut-fps-r52-profile`), log bridge/vite (`/tmp/vcut-fps-r52-*.log`).
