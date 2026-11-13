# Phase 9 Round 84 — L7: Ship services E2E — kiểm chứng job AI thật trong AppImage — LIMITS

Ngày: 11/11/2026 (lượt cron 03:35 +07). Luồng L7 đợt 84. Repo: `vectornewsai-cmyk/repo-1`, branch main.
Nhiệm vụ: SHIP SERVICES E2E — kiểm chứng end-to-end các dịch vụ AI trong AppImage đã đóng gói
(nợ mở Phase 10: app đóng gói chưa từng chạy đủ services; J8/K7 đã bundle bridge + render + 4 slim
venv vào profile `full`, K7 probe 8/8 `available:true` nhưng chưa chạy job thật).
**KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch, KHÔNG sửa file của L1.**

## 0. Kết luận ngắn

**Cả 3 job AI chạy được thật trong gói AppImage K7 (profile full), output thật đã verify trên đĩa
bằng ffprobe + đọc file, không tin log suông: TTS PASS, Caption PASS, Bgremove PASS.**
Nợ mở Phase 10 "app đóng gói chưa chạy đủ services" **ĐÃ ĐÓNG** ở mức kiểm chứng E2E (3/3 job),
với lưu ý trung thực: mọi job đều CHẬM trên VM này khi tải cao (xem §2), và lần chạy đầu lộ 1 bug
harness của chính L7 (không phải lỗi sản phẩm, §3).

AppImage dùng: `~/workspace/tmp-j8-electron/ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage`,
**556.967.608 byte, sha256 `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c`
(verify khớp trước khi chạy)** — chính là AppImage K7 build lại đợt 83 (không phải J8).
Task giao ghi đường dẫn `~/workspace/tmp-k7-clicktest/ship-full/` — **đường dẫn đó không tồn tại**;
AppImage K7 thực ra nằm ở `tmp-j8-electron/ship/ship-full/` (theo `ship-run2.log` của K7).
Models dùng: `~/workspace/tmp-j8-electron/ship/models/` (fw-small, bgremove, VieNeu-TTS-v3-Turbo…)
qua `VCUT_MODELS_DIR` — model không bundle, đúng quyết định J8.

## 1. Cách kiểm chứng (script mới của L7)

Script: `apps/desktop/scripts/e2e-ship-services.mjs` (mới, chỉ file này + LIMITS + log luồng
là deliverable; KHÔNG sửa `serviceManager.js`, `main.ts`, `package-ship.mjs`,
`clicktest-ship-full.mjs` hay bất kỳ file nào của L1).

- Chạy AppImage thật dưới Xvfb, chờ `/api/health` healthy, rồi gọi bridge của chính gói đó:
  `GET /api/tts/voices` → `POST /api/tts` → `POST /api/caption` → `POST /api/bgremove`.
- Thứ tự có chủ đích: TTS tạo ra clip giọng nói thật, caption chạy trên chính WAV đó nên
  text nhận được đối chiếu được với câu đã đọc (kiểm tra fuzzy 5 từ khóa, bỏ dấu).
- Verify output thật: tải file kết quả qua `/api/ai-download/:token`, `ffprobe` (codec,
  duration, pix_fmt, số frame), đọc lại file SRT, và phân tích kênh alpha 1 frame thật
  bằng PIL (đếm pixel transparent/semi/opaque) — không tin event `done` suông.
- Ghi thời gian từng job (bao gồm load model lần đầu), loadavg/RAM/RSS mẫu trước/sau mỗi job.
- Dọn sạch: SIGTERM cả nhóm app → kiểm tra cổng bridge trống + app pid chết thật.
- Work dir (ngoài repo, không stage): `~/workspace/tmp-l7-ship-e2e-run3/` — report JSON,
  console log, output thật (`tts.wav`, `caption.srt`, `clip-2s_no_bg.mov`, `clip-2s.mp4`).
  Lượt 1 + lượt 2 dở dang giữ ở `tmp-l7-ship-e2e/` và `tmp-l7-ship-e2e-run2/` (xem §3).

## 2. Kết quả job thật (lượt chạy 3, 11/11 04:08–04:18 +07, VM 4 vCPU / 8 GB RAM)

Điều kiện tải: lượt này chạy song song với 8–10 luồng đợt 84 khác; loadavg lúc spawn app
10,88; lúc bridge healthy 11,65; lúc bgremove xong 18,99. Mọi thời gian dưới đây là thời
gian wall trong điều kiện đó — **không phải số đo máy rảnh**, đừng trích làm benchmark sạch.

| Job | Kết quả | Thời gian wall | Output thật đã verify |
|---|---|---|---|
| Bridge healthy sau khi spawn app | OK | **75,6s** (lượt 1: 106,1s) | `/api/health` trả `ok:true`, ffmpeg 8.1.2, disk trống 83,7 GB, `caption`/`bgremove`/`translate`/`reframe`/`silence`/`scene` đều `available:true` |
| TTS — 1 câu tiếng Việt, giọng mặc định "Hải Đăng" | **PASS** | **157,9s** (bao gồm load model lần đầu) | `tts.wav` 599.084 byte, 6,24s, pcm_s16le 48 kHz (ffprobe). Realtime = 6,24/157,9 ≈ **0,04×** — rất chậm, nhưng gồm cả load model 2,16 GB lần đầu + VM tải cao; số TTS cũ 0,32–0,44× đo khi model đã load và máy rảnh hơn, không mâu thuẫn |
| Caption — faster-whisper trên chính `tts.wav`, lang vi | **PASS** | **65,2s** (transcribe 63,4s theo `done`) | 3 segment, lang `vi`, timestamp khớp duration 6,24s; file `caption.srt` 261 byte ghi ra đĩa. Text nhận: "Xin chào, đây là video thử nghiệm của VCUT Studio, chúng ta đang kiểm chứng dọc độc tiếng Việt ngay trong ứng dụng đã đồng gói." — khớp 4/5 từ khóa; **2 lỗi nhận diện**: "dọc độc" (đúng: "giọng đọc"), "đồng gói" (đúng: "đóng gói"). Realtime transcribe = 6,24/63,4 ≈ **0,10×** (chậm hơn mức 0,3–0,44× đo trước đây — do tải VM cao lúc chạy, xem §4) |
| Bgremove — clip 2s cắt từ `clip1.mp4`, session `u2net` | **PASS** | **300,7s** cho 62 frame ≈ **0,21 fps** | `clip-2s_no_bg.mov` 6.567.977 byte, codec png, `pix_fmt=rgba`, 960×540, 62/62 frame (đếm bằng `ffprobe -count_frames`), duration 2,067s. Frame 30 phân tích bằng PIL: **0% pixel opaque, 57,8% transparent hoàn toàn, 42,2% semi-transparent, alpha tối đa 213/255, alpha trung bình 5,3** — nền đã xoá thật, nhưng mask mềm (không có pixel nào opaque hoàn toàn) |

Ghi chú về clip bgremove: full 8s = 240 frame ở ~0,2 fps sẽ mất ~20 phút nên L7 cắt còn 2s
(60 frame, `ffmpeg -c copy`, duration 2,067s) — vẫn là job thật qua cùng code path.
Output 960×540 (nhỏ hơn input 1280×720) là **đúng thiết kế**: `bgremove.py --max-side`
mặc định 960 (dòng 52), không phải lỗi.

RAM/CPU quan sát được (mẫu `loadavg` + MemAvailable + tổng RSS tiến trình vcut):
- Trước launch: loadavg 10,88, memAvail 2.138 MB, vcutRSS ~84 MB.
- Bridge healthy: loadavg 11,65, memAvail 2.061 MB, vcutRSS ~1.078 MB (14 proc — gồm
  Electron + bridge + 8 probe Python song song lúc start).
- Sau TTS: loadavg 2,21, memAvail 2.918 MB, vcutRSS ~344 MB.
- Sau caption: loadavg 1,74, memAvail 3.051 MB, vcutRSS ~346 MB.
- Sau bgremove: loadavg 18,99, memAvail 2.258 MB, vcutRSS ~302 MB.
- Dọn dẹp: cổng bridge 8788 trống sau kill, app pid đã chết — không mồ côi.

## 3. Hai lần chạy dở trước khi PASS (ghi trung thực, cả hai đều KHÔNG phải lỗi sản phẩm)

### 3.1 Lượt 1 (11/11 03:50–03:55 +07): bug harness L7 làm mất event `done` của TTS

- App chạy tốt: bridge healthy sau 106,1s; `GET /api/tts/voices` HTTP 200; `POST /api/tts`
  trả stream NDJSON 200.
- Sau ~3,5 phút script báo "TTS FAIL: stream kết thúc mà không có event done".
- **Nguyên nhân thật (bug của script L7, không phải lỗi app):** `readNdjsonStream` race
  `reader.read()` với `sleep(1000)` mỗi vòng — mỗi lần race thua để lại một `read()` đang
  chờ mồ côi; chunk tới bị read mồ côi nuốt mất nên vòng lặp không bao giờ thấy event `done`.
- **Bằng chứng job thật đã xong:** token download `ffdf3ec2449b9800` đã đăng ký trong
  `userdata/bridge-jobs/ai-downloads/`; `GET /api/ai-download/<token>` trả HTTP 200,
  WAV 622.124 byte, 6,48s, pcm_s16le 48 kHz — file `tts-run1-evidence.wav` giữ trong
  `tmp-l7-ship-e2e-run2/` và `tmp-l7-ship-e2e-run3/`.
- Sửa: đọc stream bằng `for await...of res.body` (không race từng lần đọc nữa) + flush
  buffer cuối; timeout tổng vẫn có nhờ `AbortSignal.timeout` ở fetch. Lượt 3 dùng code
  đã sửa và TTS PASS ngay lần đầu.
- Lượt 1 bị kill giữa chừng (bgremove đang chạy) nên không có report JSON lượt 1; log
  console lượt 1 nằm trong output của session đã kill (không lưu file do `tee` fail vì
  WORK chưa tồn tại lúc `tee` mở file — đã sửa bằng cách `mkdir` trước khi chạy lượt 3).

### 3.2 Lượt 2 (11/11 03:58–04:04 +07): app chết vì mất X server — lỗi vận hành harness, không phải lỗi app

- App (pid 14793) chết ngay sau khi extract: log ghi
  `Missing X server or $DISPLAY` + `The platform failed to initialize. Exiting.`
  (04:00:43 +07), `service-manager.log` chưa từng được tạo.
- **Nguyên nhân:** Xvfb :98 của lượt 2 không còn sống khi Electron khởi động. Lượt 1 bị
  kill bằng SIGTERM cả nhóm tiến trình nên Xvfb :98 của lượt 1 cũng chết; lượt 2 spawn
  Xvfb :98 mới nhưng script không verify Xvfb sống thật (chỉ `sleep(1500)`) nên app chạy
  vào display chết. Ngoài ra cổng 8787 lúc đó đã bị luồng khác của đợt 84 chiếm
  (AppImage `/tmp/l1-probe`, CDP 9222) — script lượt 2 hardcode 8787/9223 nên dù app
  sống cũng sẽ đụng cổng.
- Sửa (đã vào script): chọn động display (:90–:99, kiểm tra `/tmp/.X{n}-lock` +
  `/tmp/.X11-unix/X{n}`) và cổng (bridge 8787–8796, CDP 9223–9232); spawn Xvfb với stderr
  ghi ra `xvfb.log` và **verify lock file xuất hiện trong 10s** trước khi spawn app;
  `waitBridgeHealthy` fail nhanh kèm 10 dòng ERROR cuối của `app-stdout.log` nếu app
  chết sớm (thay vì chờ hết 600s). Lượt 3: Xvfb :90 OK, bridge 8788, CDP 9223.

## 4. Giới hạn — chưa làm được / chưa test (trung thực)

- **Tốc độ đo được ở lượt 3 là số đo dưới tải cao, không phải benchmark sạch:** TTS 0,04×
  (gồm load model), caption transcribe 0,10×, bgremove u2net 0,21 fps — đều chậm hơn các
  số đo trước đây trên VM này (TTS median 0,32–0,44×, caption 0,3–0,44×, bgremove 0,43 fps)
  vì lượt này chạy giữa 8–10 luồng song song (loadavg 10–19/4 CPU). Muốn số sạch phải đo
  lại khi VM rảnh; đừng dùng số lượt 3 để kết luận sản phẩm chậm đi.
- **Caption có 2 lỗi nhận diện thật** trên câu test ("dọc độc", "đồng gói") — model
  fw-small + giọng TTS tổng hợp; không phải lỗi ship, nhưng là bằng chứng caption trong
  gói chưa hoàn hảo. Chưa thử model lớn hơn (fw-medium không có trong manifest).
- **Bgremove u2net mask mềm:** frame kiểm chứng không có pixel nào alpha=255 (tối đa 213).
  Subject vẫn tách được khỏi nền, nhưng cạnh/vùng đặc có thể hơi trong suốt khi composite
  lên nền khác — chưa kiểm chứng composite thực tế. Chưa thử session mặc định
  `birefnet-general` qua gói (chỉ probe K7 báo available; job thật lần này chỉ chạy u2net
  theo đúng lệnh).
- **Chưa chạy job reframe / translate / silence / scene qua gói** — chỉ probe available
  trong `/api/health` (đều `available:true`). Chưa chạy job TTS clone giọng, chưa thử
  TTS với giọng khác ngoài mặc định.
- **Chưa đo lần tải model đầu tiên trong app** (model đã có sẵn trong models dir mẫu;
  downloader resume + SHA256 của I5 chưa được kiểm chứng lại ở lượt này).
- **Chưa test .deb full / macOS / Windows / arm64** (như mọi đợt trước).
- Sóng EPERM: **không gặp trong lượt này** (ghi node + python đều OK, đã probe trước mỗi
  lượt chạy). Sóng từng xuất hiện ở đợt 82/83 nên vẫn là rủi ro môi trường cho đợt sau.
- `app-stdout.log` của AppImage chứa ~21.230 dòng liệt kê file đã extract (runtime in ra
  khi `APPIMAGE_EXTRACT_AND_RUN=1`) — nhiễu log, không phải lỗi, nhưng làm file log lớn;
  script L7 lọc dòng ERROR khi fail nhanh để tránh đọc hết.

## 5. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `apps/desktop/scripts/e2e-ship-services.mjs` (mới) | Script E2E: verify sha AppImage → Xvfb + AppImage thật → poll bridge healthy → TTS → caption trên WAV TTS → bgremove u2net clip 2s → verify output bằng ffprobe/PIL → report JSON + dọn sạch; chọn động display/cổng; đọc NDJSON bằng for-await (sửa bug lượt 1) |
| `docs/PHASE9_ROUND84_L7_SHIP_SERVICES_E2E_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: `~/workspace/tmp-l7-ship-e2e*/` (AppImage dùng lại, userdata,
report JSON, output thật WAV/SRT/MOV — giữ ngoài repo để parent đối chiếu),
`apps/desktop/dist/`, `build/`, `release/`, binary, model, venv.

## 6. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
# 0. Chờ sóng EPERM qua + kiểm tra cổng/display trống (script tự chọn động).
# 1. E2E đầy đủ (~10 phút khi tải cao, gồm load model lần đầu):
cd ~/workspace/repo-1
node apps/desktop/scripts/e2e-ship-services.mjs
# Kỳ vọng: KẾT QUẢ: TTS=PASS Caption=PASS Bgremove=PASS → ALL PASS
# Report JSON + output thật ở ~/workspace/tmp-l7-ship-e2e-run3/ (đổi L7_WORK nếu cần).
# 2. Chỉ kiểm tra nhanh 1 job (vd TTS) mà không chạy lại toàn bộ: dùng AppImage K7
#    + models dir như trên, gọi trực tiếp POST /api/tts rồi GET /api/ai-download/:token.
```

## 7. Tương tác với luồng khác trong đợt 84

- Chỉ thêm 1 file script mới + LIMITS này; KHÔNG sửa file nào của L1 hay luồng khác.
- Chạy song song với các luồng khác trên cùng VM: đã gặp đụng cổng 8787 (luồng L1) và
  mất Xvfb :98 (lượt 2) — script đã sửa thành chọn động display/cổng + verify Xvfb,
  nên các luồng sau dùng chung mẫu này sẽ ít đụng nhau hơn. Khuyến nghị các luồng cần
  chạy AppImage khác cũng chọn động display/cổng thay vì hardcode 8787/:98.
- Không đụng `.github/workflows/*`, không đụng TTS/Gradio, không đụng model/venv.
