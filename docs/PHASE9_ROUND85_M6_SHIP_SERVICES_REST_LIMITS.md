# Phase 9 Round 85 — M6: Ship services (phần còn lại) — reframe / translate / silence / scene + birefnet thật — LIMITS

Ngày: 11/11/2026 (lượt cron 06:35 +07). Luồng M6 đợt 85. Repo: `vectornewsai-cmyk/repo-1`, branch main.
Nhiệm vụ: nối tiếp L7 đợt 84 (TTS / Caption / Bgremove-u2net PASS 3/3 trong AppImage K7):
chạy job thật các service còn lại trong gói — reframe, translate, silence, scene — và
birefnet thật (session mặc định của bgremove, L7 chỉ chạy u2net).
**KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch, KHÔNG sửa file của luồng khác.**

## 0. Kết luận ngắn

**4/5 job PASS thật trong gói AppImage K7 (profile `full`): Reframe PASS, Translate PASS,
Silence PASS, Scene PASS. Bgremove birefnet-general FAIL** — session mặc định bị SIGKILL
(nghi OOM-kill khi VM tải cao), bridge tự fallback sang u2net và job vẫn hoàn tất bằng u2net
sau 412,5s (xem §3 — fallback hoạt động đúng thiết kế, nhưng job này KHÔNG được tính là
birefnet chạy được). Nợ Phase 10 "app đóng gói chưa chạy đủ services" nay đóng ở mức
**7/8 job AI đã chạy thật trong gói** (L7: TTS, caption, bgremove-u2net; M6: reframe,
translate, silence, scene); chỉ còn birefnet-general chưa có 1 lần chạy thành công nào
trong gói.

AppImage dùng: `~/workspace/tmp-j8-electron/ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage`,
**556.967.608 byte, sha256 `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c`
(verify khớp trước khi chạy)** — AppImage K7, KHÔNG build lại. Models dùng:
`~/workspace/tmp-j8-electron/ship/models/` qua `VCUT_MODELS_DIR` (model không bundle,
đúng quyết định J8); model `bgremove/birefnet-general.onnx` 972.666.916 byte có sẵn
trong models dir.

## 1. Cách kiểm chứng (script mới của M6)

Script: `apps/desktop/scripts/e2e-ship-services-rest.mjs` (mới; chỉ file này + script retry
+ LIMITS này là deliverable; KHÔNG sửa `serviceManager.js`, `main.ts`, bridge hay bất kỳ
file production nào).

- Chạy AppImage thật dưới Xvfb, chờ `/api/health` healthy, rồi gọi bridge của chính gói đó:
  `POST /api/reframe` → `POST /api/caption/translate` → `POST /api/silence` →
  `POST /api/scene` → `POST /api/bgremove` (session `birefnet-general`).
- **Cải tiến so với script L7:** cổng bridge KHÔNG đoán trước — đọc cổng thật từ
  `userdata/logs/service-manager.log` của chính app này (dòng `spawn bridge: … (BRIDGE_PORT=N)`).
  L7 đoán cổng trống đầu tiên (8787–8796) rồi hi vọng app cũng chọn đúng cổng đó; khi nhiều
  luồng chạy song song, đoán trước có thể trúng bridge của app khác. Lần này: display :90,
  CDP 9223, bridge **8787** (đọc từ log, không phải đoán).
- Mỗi job có **ground truth đã biết trước** (không tin output suông):
  - Reframe: clip1.mp4 8s 1280×720 → aspect 9:16; đích theo thiết kế reframe.py là
    1080×1920; verify tỉ lệ 9:16 + duration 8s + đủ 240 frame (đếm bằng ffprobe).
  - Translate: dùng lại `tts.wav` của L7 (giọng Việt thật, 6,24s, câu đã biết) → target en;
    verify segment tiếng Anh khớp nghĩa (từ khóa), timestamp trong duration.
  - Silence: WAV tự tổng hợp 6s (tone 440Hz 2s + lặng 2s + tone 880Hz 2s) → verify khoảng
    lặng phát hiện khớp đúng [2s, 4s] (±0,35s).
  - Scene: clip ghép 4s (2s clip1 + 2s clip2, cắt cứng tại 2,0s, re-encode) → verify có
    đúng 1 cut gần 2,0s (±0,5s).
  - Bgremove birefnet: clip 1s (30 frame, cắt từ clip1) → verify MOV alpha thật (pix_fmt
    rgba, đủ frame, phân tích alpha 1 frame bằng PIL). **Quy tắc cứng trong script: nếu
    `sessionUsed != birefnet-general` hoặc có `fallbackFrom` thì job FAIL** — không nhận
    vơ output u2net thành birefnet.
- Verify output thật: tải file qua `/api/ai-download/:token`, `ffprobe` (codec, duration,
  kích thước, số frame đếm thật), đọc lại file SRT; dọn sạch: SIGTERM cả nhóm app → kiểm
  tra cổng bridge trống + app pid chết thật.
- Work dir (ngoài repo, không stage): `~/workspace/tmp-m6-ship-e2e-rest/` — report JSON,
  console log, input tổng hợp (`inputs/`), output thật (`outputs/`).

## 2. Kết quả job thật (11/11 06:47–06:58 +07, VM 4 vCPU / 8 GB RAM)

Điều kiện tải: lượt này chạy song song với các luồng đợt 85 khác. Loadavg lúc bridge
healthy 4,58; lúc reframe xong 1,71; lúc translate/silence/scene xong 0,93–1,01 (máy khá
rảnh); **lúc bgremove chạy vọt lên 25,81** (các luồng khác vào việc nặng cùng lúc),
memAvail tụt còn ~1,5 GB. Mọi thời gian dưới đây là thời gian wall trong điều kiện đó.

| Job | Kết quả | Thời gian wall | Output thật đã verify |
|---|---|---|---|
| Bridge healthy sau khi spawn app | OK | **10,8s** (L7: 75,6s — lần này máy rảnh hơn lúc start) | `/api/health` trả `ok:true`, ffmpeg 8.1.2, disk trống 82,5 GB; `caption`/`bgremove`/`translate`/`reframe`/`silence`/`scene` đều `available:true` (reframe/silence/translate trỏ đúng venv bundle trong gói; scene dùng `python3` hệ thống) |
| Reframe — clip1 8s → 9:16 | **PASS** | **55,0s** | `clip1_9x16.mp4` 725.992 byte, **1080×1920** (đúng đích thiết kế, reframe.py dòng 53), h264 yuv420p, duration 8,00s, **240/240 frame** (đếm bằng ffprobe) |
| Translate — tts.wav vi → en | **PASS** | **63,7s** (translate 61s theo `done`) | 4 segment, `vi→en`, timestamp trong 6,24s; file `translate-en.srt` 250 byte. Text nhận: "Hello, this is the video experience of V -Cut Studio. We are currently testing the Vietnamese read in the application." — khớp 4/5 từ khóa (hello, video, test, vietnamese; xem §4 về 2 lỗi dịch nhỏ) |
| Silence — WAV tổng hợp 6s | **PASS** | **1,4s** | JSON: count=1, silences=`[{"start":2,"end":4,"duration":2}]` — **khớp đúng ground truth [2,4]**, keep=`[{"start":0,"end":2},{"start":4,"end":6}]`, audioDurationSec=6 |
| Scene — clip ghép 4s, cắt tại 2,0s | **PASS** | **2,5s** | count=1, cuts=`[2]`, duration=4s, threshold=0,4 — **đúng 1 cut, đúng vị trí 2,0s**, không cut giả |
| Bgremove — clip 1s, session `birefnet-general` | **FAIL** | **412,5s** (tổng cả fallback) | Session birefnet-general **bị SIGKILL** → bridge tự fallback sang u2net; job hoàn tất bằng u2net (`sessionUsed=u2net`, `fallbackFrom=birefnet-general`). Theo quy tắc §1, job này FAIL — xem §3 |

RAM/CPU quan sát được (mẫu `loadavg` + MemAvailable + tổng RSS tiến trình vcut):
- Trước launch: loadavg 4,39, memAvail 1.507 MB, vcutRSS ~0 MB.
- Bridge healthy: loadavg 4,58, memAvail 1.651 MB, vcutRSS ~1.251 MB (14 proc).
- Sau reframe: loadavg 1,71, memAvail 1.517 MB, vcutRSS ~592 MB.
- Sau translate: loadavg 1,01, memAvail 1.642 MB, vcutRSS ~402 MB.
- Sau silence/scene: loadavg ~1,0, memAvail ~1.574 MB, vcutRSS ~405 MB.
- Sau bgremove (fallback u2net xong): loadavg 2,16, memAvail 3.870 MB, vcutRSS ~289 MB.
- Dọn dẹp: cổng bridge 8787 trống sau kill, app pid đã chết — không mồ côi.

## 3. Birefnet: FAIL như thế nào, và vì sao chưa kết luận "không chạy được"

### 3.1 Birefnet KHÔNG phải service riêng — cần nói rõ

`birefnet-general` **không có endpoint riêng**: nó là 1 session của `POST /api/bgremove`
(tham số `session`), và còn là **session mặc định** (`DEFAULT_SESSION = "birefnet-general"`
trong `server/bridge/src/bgremove.js` và `server/bgremove/bgremove.py`). Nghĩa là user bấm
xoá nền trong app đóng gói mà không chọn session sẽ đi đúng session này.
**Quyết định đợt 73 vẫn giữ nguyên, không mở lại:** birefnet CHỐT ĐÓNG như hướng thay thế
u2net — u2net là fallback chính thức. Job này không tranh luận lại quyết định đó; nó chỉ
kiểm chứng session mặc định có chạy được thật trong gói hay không. Kết quả: **chưa chạy
được lần nào trong gói** (L7 chạy u2net; M6 chạy birefnet-general và fail).

### 3.2 Diễn biến fail (bằng chứng)

- 06:50:50 +07: `POST /api/bgremove` với `session=birefnet-general`, clip 1s (30 frame).
- Tiến trình birefnet chạy ~3,5 phút rồi **chết vì SIGKILL** (không exit code, không timeout —
  timeout bridge là 30 phút). Bridge gửi event NDJSON
  `{"type":"phase","phase":"fallback","message":"Session birefnet-general thất bại (bị SIGKILL)
  — tự chuyển sang u2net (nhẹ hơn)."}` rồi chạy lại bằng u2net.
- U2net fallback chạy tiếp ~3,5 phút nữa (tổng job 412,5s) và hoàn tất: `done` với
  `sessionUsed=u2net`, `fallbackFrom=birefnet-general`,
  `fallbackReason="session birefnet-general bị SIGKILL (nghi OOM-kill trên máy ít RAM)"`.
  Script M6 KHÔNG tải file MOV của lần fallback này (không phải output birefnet — tải về
  cũng không chứng minh được gì thêm; u2net trong gói đã được L7 verify).
- Lúc fail: loadavg **25,81**, memAvail ~1,5 GB (quan sát lúc 06:54, khi process u2net đang
  chạy; process birefnet đã chết trước đó). `dmesg`/`syslog` không ghi dòng OOM-kill nào
  đọc được từ phiên này — **SIGKILL + tải cao chỉ là nghi vấn mạnh, chưa phải bằng chứng
  chắc chắn** (xem §3.3).

### 3.3 Chưa kết luận được gì — và bước tiếp theo

- **Chưa kết luận birefnet hỏng trong gói.** Model file có sẵn (972.666.916 byte), venv
  bgremove bundle trong gói (K7 probe `import rembg` pass), session birefnet từng chạy
  được ở các đợt trước ngoài gói (xem `server/bgremove/BGREMOVE_LIMITS.md`). Khả năng
  lớn nhất: OOM-kill do contention với các luồng đợt 85 khác (loadavg 25,81/4 CPU,
  memAvail 1,5 GB lúc fail), nhưng chưa loại trừ lỗi khác (vd: model load fail trên
  máy ít RAM ngay cả khi rảnh).
- **Bước tiếp theo (đã chuẩn bị sẵn, chưa chạy):** script
  `apps/desktop/scripts/e2e-ship-services-birefnet-retry.mjs` — chỉ chạy job
  birefnet-general, clip ngắn hơn (0,5s = 15 frame, giảm thời gian giữ peak memory),
  khi VM rảnh. M6 đã viết xong script nhưng **KHÔNG chạy retry trong lượt này** vì lúc
  script chính xong, load VM lại vọt lên 19,21 (memAvail 1,6 GB) sau 2 phút chờ vẫn còn
  9,56 / 1,6 GB — chạy lại trong cùng điều kiện contention thì không cho thông tin mới,
  chỉ thêm nguy cơ OOM-kill (chính phiên exec của M6 đã bị OOM-kill 1 subprocess trong
  lúc chạy — xem §5). Parent / đợt sau chạy retry khi load < 5 và memAvail > 3 GB:
  `node apps/desktop/scripts/e2e-ship-services-birefnet-retry.mjs` (kỳ vọng PASS thì
  birefnet đóng; FAIL lại khi máy rảnh thì là lỗi hệ thống, cần điều tra model/venv).
- Hệ quả thực tế nếu birefnet không chạy được trên máy 8 GB: user bấm xoá nền mặc định
  trong app đóng gói sẽ **luôn rơi về u2net** (chậm hơn 1 lần thử birefnet chết + thời gian
  u2net) — trải nghiệm vẫn đúng (có output), chỉ chậm và không được chất lượng mask
  birefnet. Không phải lỗi chặn ship, nhưng là nợ cần đóng bằng retry + (nếu cần) đổi
  default session hoặc cảnh báo RAM.

## 4. Giới hạn — chưa làm được / chưa test (trung thực)

- **Translate có 2 lỗi dịch nhỏ** trên câu test (faster-whisper fw-small, translate task):
  "video experience" (đúng: "test video" / "video thử nghiệm") và "V -Cut" (đúng: "VCut" —
  khiến từ khóa `vcut` không khớp, chỉ 4/5). Không phải lỗi ship (dịch đúng nghĩa tổng thể,
  đủ 4 segment, timestamp chuẩn), nhưng là bằng chứng translate trong gói chưa hoàn hảo
  trên tên riêng/từ ghép. Chưa thử model lớn hơn (fw-medium không có trong manifest).
- **Tốc độ đo được là số đo dưới tải thay đổi, không phải benchmark sạch:** reframe 55s cho
  clip 8s (~4,4 fps xử lý), translate 0,10× realtime (61s cho 6,24s audio — gồm load model),
  silence 1,4s, scene 2,5s — đừng trích làm benchmark; đo sạch cần VM rảnh.
- **Reframe upscale:** input 1280×720 crop 9:16 (405×720) rồi upscale lên 1080×1920 theo
  thiết kế (reframe.py dòng 53) — chất lượng upscale chưa đánh giá bằng mắt (chỉ verify
  kích thước/duration/frame). Clip test là clip mẫu đơn giản, không có mặt người rõ ràng
  để kiểm chứng Haar face tracking bám chủ thể đúng hay fallback motion.
- **Silence/scene chỉ verify trên input tổng hợp:** silence trên WAV tone+lặng nhân tạo
  (không phải giọng nói thật có khoảng lặng tự nhiên); scene trên clip ghép 2 clip mẫu
  (không phải video thật có nhiều cảnh). Đủ chứng minh code path chạy đúng, chưa chứng
  minh độ chính xác trên dữ liệu thực tế phức tạp.
- **Chưa chạy birefnet-general thành công lần nào trong gói** (§3). Chưa thử TTS clone
  giọng / giọng khác, chưa đo tải model lần đầu trong app, chưa test .deb full / macOS /
  Windows / arm64 (như mọi đợt trước).
- **Sóng EPERM:** không gặp trong lượt này (ghi node + python đều OK, đã probe trước mỗi
  lượt chạy). Sóng từng xuất hiện ở đợt 82/83 nên vẫn là rủi ro môi trường cho đợt sau.
- `app-stdout.log` chứa ~4.600 dòng liệt kê file đã extract (runtime in ra khi
  `APPIMAGE_EXTRACT_AND_RUN=1`) — nhiễu log, không phải lỗi.

## 5. Sự cố trong lượt: phiên exec của M6 bị OOM-kill 1 subprocess

Lúc bgremove đang chạy (loadavg ~25, memAvail ~1,5 GB), runtime báo subprocess của lệnh
exec bị OOM-kill (`failureKind: subprocess.oom_killed`). **Script E2E vẫn chạy xong đầy đủ:**
toàn bộ log 5 job + cleanup + report JSON đều đã ghi ra đĩa trước khi phiên kết thúc
(`e2e-report.json` 12.924 byte, `KẾT QUẢ: Reframe=PASS Translate=PASS Silence=PASS
Scene=PASS BgremoveBirefnet=FAIL`). Không mất dữ liệu; không chạy lại job nào (chỉ đọc
lại report + verify lại output bằng ffprobe/SRT). Đây là cùng 1 sóng tải đã giết
birefnet — bằng chứng phụ cho giả thuyết OOM ở §3.2, nhưng vẫn chưa đủ để kết luận chắc
chắn (không có dòng OOM nào trong dmesg/syslog đọc được).

## 6. File trong batch (stage chờ push — text only)

| File | Đổi gì |
|---|---|
| `apps/desktop/scripts/e2e-ship-services-rest.mjs` (mới) | Script E2E: verify sha AppImage → Xvfb + AppImage thật → đọc cổng bridge thật từ service-manager.log → reframe → translate trên WAV L7 → silence trên WAV tổng hợp → scene trên clip ghép → bgremove birefnet-general clip 1s → verify output bằng ffprobe/PIL → report JSON + dọn sạch; ground truth đã biết cho cả 4 job không-ML-nặng; quy tắc FAIL nếu fallback khỏi birefnet |
| `apps/desktop/scripts/e2e-ship-services-birefnet-retry.mjs` (mới) | Script retry chỉ-job-birefnet (clip 0,5s/15 frame) để chạy khi VM rảnh — chưa chạy trong lượt này (§3.3) |
| `docs/PHASE9_ROUND85_M6_SHIP_SERVICES_REST_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: `~/workspace/tmp-m6-ship-e2e-rest/` (AppImage dùng lại, userdata,
report JSON, output thật MP4/SRT — giữ ngoài repo để parent đối chiếu),
`apps/desktop/dist/`, `build/`, `release/`, binary, model, venv.

## 7. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
# 0. Chờ sóng tải VM qua (load < 5, memAvail > 3 GB) rồi mới chạy retry birefnet.
# 1. E2E đầy đủ 5 job (~11 phút, gồm load model lần đầu):
cd ~/workspace/repo-1
node apps/desktop/scripts/e2e-ship-services-rest.mjs
# Kỳ vọng: Reframe=PASS Translate=PASS Silence=PASS Scene=PASS
# BgremoveBirefnet=PASS (khi VM rảnh) hoặc FAIL với fallback u2net (khi VM tải cao).
# Report JSON + output thật ở ~/workspace/tmp-m6-ship-e2e-rest/ (đổi M6_WORK nếu cần).
# 2. Chỉ retry birefnet khi VM rảnh:
node apps/desktop/scripts/e2e-ship-services-birefnet-retry.mjs
# Report + output ở ~/workspace/tmp-m6-ship-e2e-birefnet-retry/.
```

## 8. Tương tác với luồng khác trong đợt 85

- Chỉ thêm 2 file script mới + LIMITS này; KHÔNG sửa file nào của luồng khác, KHÔNG sửa
  code production.
- Chạy song song với các luồng khác trên cùng VM: chính sóng tải của các luồng khác
  (loadavg 25,81) là nghi phạm giết birefnet — các luồng cần chạy AppImage khác nên
  chọn động display/cổng (mẫu L7/M6) và **đọc cổng bridge từ service-manager.log của
  chính mình** thay vì đoán cổng trống (cải tiến của M6, §1).
- Không đụng `.github/workflows/*`, không đụng TTS/Gradio, không đụng model/venv.
