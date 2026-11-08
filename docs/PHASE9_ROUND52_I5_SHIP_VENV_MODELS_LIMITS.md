# Phase 9 Round 52 — I5: Ship venv Python + model AI vào app đóng gói — LIMITS

**Ngày:** 06/11/2026 (đợt 52, luồng I5). **Repo:** `vectornewsai-cmyk/repo-1`, branch main.
**Kế hoạch gốc:** H8 §5 (`docs/PHASE9_ROUND51_H8_SHIP_SERVICES_LIMITS.md` §5) — đóng nợ
Phase 10 §5.1: venv + model AI chưa nằm trong app đóng gói. H8 đã ship bridge + render
(1.026 file / 63.349.996 byte); luồng này ship nốt venv Python (thu gọn) + cơ chế tải
model lần đầu. **KHÔNG push trong phiên này — batch chỉ stage, chờ user nhắn "push đi".**

## 1. Cái gì đã làm xong (tóm tắt)

| # | Hạng mục | Trạng thái |
|---|----------|------------|
| 1 | Model manifest có checksum SHA256 (`model-manifest.json`) | ✅ xong, verify qua HF API 06/11 |
| 2 | First-run model downloader (resume / hủy / skip-if-present / verify SHA256) | ✅ xong, 11/11 test, có 1 lần tải thật từ Hugging Face |
| 3 | Slim venv build script (`build-slim-venv.mjs`) + nối vào `prepackage.mjs` (opt-in) | ✅ xong, đo byte thật |
| 4 | Nối downloader vào lifecycle desktop (services-status báo thiếu model, AI chỉ bật khi đủ model) | ✅ xong, `tsc` 0 lỗi |
| 5 | Stage venv thu gọn vào cây bundle (`copy-bundled-server.mjs` §7, copy verbatim giữ symlink) | ✅ xong, kiểm chứng relocation (mục 5) |
| 6 | bgremove venv | ❌ CHƯA — xem mục 7 nợ mở |

## 2. Kích thước venv trước / sau (đo thật, `SLIM_VENV.json`, 06/11/2026)

| Service | Trước (byte) | Sau (byte) | Giảm | File trước → sau | Đã loại bỏ (chứng minh được) |
|---------|-------------|-----------|------|------------------|------------------------------|
| caption | 516.672.763 | 453.597.096 | −12,2% (−63.075.667) | 5.057 → 3.378 | `piper` (46.285.061) + pip/setuptools/wheel/ensurepip (~10,5M) |
| tts | 894.862.978 | 306.872.496 | −65,7% (−587.990.482) | 19.878 → 5.360 | gradio, gradio_client, hf_gradio, fastapi, starlette, uvicorn, pandas, sklearn, scipy, numba, llvmlite (179.470.217), pygments, librosa, joblib, pooch |
| reframe | 241.220.388 | 227.717.700 | −5,6% (−13.502.688) | 2.426 → 1.378 | chỉ pip/rác chung, không DROP thêm |
| **Tổng** | **1.652.756.129** | **988.187.292** | **−40,2% (−664.568.837)** | | |

Chứng minh DROP an toàn (grep + chạy thật, 06/11):
- Không có `import gradio/fastapi/pandas/sklearn/scipy/numba/librosa` trong `vieneu/`,
  `vieneu_utils/`, `neucodec/`. `librosa` chỉ là optional trong
  `vieneu/base.py:_load_ref_mono` (try/except → fallback soundfile+soxr).
- `sea_g2p` (67M) là BẮT BUỘC (`vieneu_utils/phonemize_text.py` import) — đã giữ lại.
- `piper` không được `caption.py`/faster-whisper import — đã loại.
- `hf_xet` giữ (huggingface_hub dùng để tải), `av` giữ (faster-whisper decode).

Chạy workload thật trên venv thu gọn (06/11, VM 2vCPU/8GB/no-GPU, tải thay đổi lớn):
- **Caption slim:** `tts_short.wav` (4s tiếng Việt) → 2 segment, 14 từ, đúng nội dung
  ("Xin chào, đây là video hướng dẫn sử dụng trình dựng video Vegas Studio"); 18,0s
  transcribe lúc máy rỗi (102,4s lúc máy nặng — tải VM dao động rất lớn).
- **TTS slim preset:** "Xin chào, đây là kiểm thử giọng nói trên venv thu gọn." giọng Hải Đăng
  → WAV 2,72s, synth 36,7s.
- **TTS slim clone** (`--ref-audio tts_short.wav`): 58 ký tự → WAV 3,2s, `cloned:true`,
  synth 110,0s — chứng minh fallback soundfile+soxr hoạt động sau khi loại librosa/scipy/numba.
- **Reframe slim:** `agent-demo.mp4` (10s 720p) → MP4 9:16 1080×1920, 3.325.320 byte,
  300 frame, trajectory 240 điểm.
- `VCUT_MODELS_DIR` được tôn trọng: caption dùng model từ thư mục copy riêng (cùng transcript);
  TTS dùng model qua symlink trong thư mục riêng (WAV 1,76s, synth 9,4s).

## 3. Model nào tải được / tải riêng (không bundle vào gói)

Model **KHÔNG BAO GIỜ bundle** vào AppImage/.deb (2,7G) — tải riêng lần đầu về
`userData/models` (hoặc `VCUT_MODELS_DIR` nếu set). Manifest:
`apps/desktop/src/services/model-manifest.json` (sinh bởi
`apps/desktop/scripts/gen-model-manifest.mjs`, hash SHA256 file local, re-run + `--check` pass).

| Model | Nguồn (URL resolve main) | License (verify qua HF API 06/11) | File | Kích thước (byte) | Checksum |
|-------|--------------------------|-----------------------------------|------|-------------------|----------|
| caption-small | `huggingface.co/Systran/faster-whisper-small` | MIT | 4 | 486.212.372 | ✅ SHA256 đủ 4 file |
| tts-turbo | `huggingface.co/pnnbao-ump/VieNeu-TTS-v3-Turbo` | Apache-2.0 | 86 | 2.157.916.899 | ✅ SHA256 đủ 86 file |
| tts-codec | `huggingface.co/OpenMOSS-Team/MOSS-Audio-Tokenizer-Nano-ONNX` | Apache-2.0 | 8 | 90.578.835 | ✅ SHA256 đủ 8 file |
| bgremove-birefnet | `github.com/danielgatis/rembg/releases/download/v0.0.0/birefnet-general.onnx` | MIT (rembg) | 1 | ~170M (ước lượng, chưa tải) | ❌ **chưa verify** — downloader từ chối tải model chưa verify |
| **Tổng đã verify** | | | **98** | **≈ 2.734.708.106 (~2,55 GiB)** | |

Downloader (`apps/desktop/src/services/modelDownloader.js`, chỉ dùng Node builtin):
- HTTPS download từng file, theo redirect (tối đa 5), `.part` + HTTP Range resume, verify
  SHA256 sau tải, rename nguyên tử, skip nếu đã có đủ (size + SHA256), hủy qua AbortSignal
  (giữ `.part` để resume sau), ghi marker `.vcut-complete`, từ chối model chưa verify.
- `resolveModelsRoot()`: env `VCUT_MODELS_DIR` thắng → layout repo khi có model trong repo
  (dev) → `userData/models` thống nhất (app đóng gói).
- `checkModel` dùng fast path theo size (không hash lại khi poll trạng thái).

**Đường tải đã chứng minh (không mock kết quả tải thật):**
- Tải thật `config.json` của faster-whisper-small (2.370 byte) từ Hugging Face, verify
  SHA256 khớp manifest (~1s).
- 11/11 test `modelDownloader.test.cjs`: server HTTP local chứng minh download / skip /
  resume / tải lại file hỏng / từ chối checksum sai / hủy giữa chừng.

## 4. Lifecycle desktop: thiếu model thì báo rõ, không crash

- `pythonServices.js`: `MODEL_CHECKS` (caption/translate: `fw-small/model.bin`; tts: marker
  `.vcut-complete` ở cả 2 thư mục model; bgremove: `birefnet-general.onnx` trong `~/.u2net`
  hoặc `VCUT_MODELS_DIR/bgremove`); `probePythonService` trả `available:false` + reason nêu rõ
  tên model + kích thước + thư mục khi thiếu model (kiểm chứng thật: với
  `VCUT_MODELS_DIR` trỏ thư mục rỗng, caption/tts `available:false` kèm reason đầy đủ).
- `serviceManager.js`: `_modelsEnv()` set `VCUT_MODELS_DIR=userData/models` chỉ khi layout
  thống nhất (app đóng gói; dev không đổi); thêm `reprobeAi()` (probe lại AI không restart bridge).
- `main.ts`: IPC mới `desktop:get-models`, `desktop:download-model` (một model tại một thời
  điểm, progress qua `vcut:model-download-progress`, xong thì `reprobeAi()`),
  `desktop:cancel-model-download`; `desktop:get-services` thêm mục `models` (số model sẵn
  sàng / danh sách thiếu).
- `preload.ts`: `DesktopApi` thêm `getModels`, `downloadModel`, `cancelModelDownload`,
  `onModelDownloadProgress` + interface `ModelStatus` / `ModelDownloadProgress`.
- Script Python (đánh dấu `ROUND52-I5`, tối thiểu): `server/tts/tts.py` kiểm tra
  `VCUT_MODELS_DIR` trước repo mặc định; `server/caption/caption.py` thêm `--model-dir`
  (mặc định `VCUT_MODELS_DIR` hoặc repo); `server/bgremove/bgremove.py` set
  `U2NET_HOME=<VCUT_MODELS_DIR>/bgremove` khi không có `--model-dir`.
- `docs/DESKTOP.md` §2: thêm bullet về slim venv + tải model lần đầu.

## 5. Cây bundle đã stage (kiểm chứng 06/11/2026, sau khi rebuild)

- `node scripts/copy-bundled-server.mjs` → **11.215 file, 1.052.443.303 byte (1.003,7 MiB)**
  trong `apps/desktop/build/bundled-server/` (so với 1.026 file / 63.349.996 byte khi chưa có
  venv). `slimVenvs: [caption, tts, reframe]`.
- **Kiểm chứng relocation (quyết định):** đổi tên `build/slim-venv` đi chỗ khác (same-filesystem
  rename), rồi import venv đã stage — cả 3 đều OK, `sys.prefix` của TTS trỏ đúng đường
  staged (`.../build/bundled-server/server/tts/.venv`), chứng minh venv staged tự chứa,
  không rò đường dẫn máy build. Symlink giữ nguyên dạng tương đối: `lib64 -> lib`,
  `bin/python -> python3`. (Lưu ý: `bin/python3 -> /usr/bin/python3.12` là tuyệt đối theo
  đúng chuẩn venv — trỏ tới Python hệ thống; xem giới hạn Python 3.12 ở mục 7.)
- `resolvePythonBin`/`buildBridgeEnv` trên cây staged resolve caption/tts/reframe về venv
  slim đã bundle mà không cần đổi code; bgremove vẫn `system python3` (không có venv).
- `VCUT_BUNDLE_SLIM_VENV=caption,tts,reframe node scripts/prepackage.mjs` chạy end-to-end
  OK (slim build → stage → manifest có đủ 3 venv). Mặc định prepackage KHÔNG bundle venv
  (opt-in, vì +~1G vào gói).

## 6. Kiểm chứng (06/11/2026)

- `tsc -p tsconfig.json --noEmit` (apps/desktop): **0 lỗi**. Full build (tsc emit +
  `copy-services-js.mjs`): OK, 6 file copy gồm `modelDownloader.js` + `model-manifest.json`.
- `node --test` gộp: **modelDownloader 11/11, bundledRuntime 10/10, bridgePidfile 14/14 = 35/35 pass**.
- `serviceManager.test.cjs` solo: **8/9** — lỗi duy nhất "trạng thái đẩy qua event"
  (bridge không healthy sau 32s), đúng flake tải đã ghi trong H8 LIMITS §3.5 (timeout quá
  chặt khi 2vCPU tải nặng với nhiều luồng song song), KHÔNG phải regression. Một lần chạy
  gộp cũng fail "probe AI" dưới tải nặng, chạy solo lại pass trong 3,9s.
- Dev caption/tts `available:true, model ok:true` khi model đủ (model gating đang bật).
- `node --check` pass cho cả 5 script `.mjs` đã sửa/tạo.
- Tái hiện: `node scripts/build-slim-venv.mjs --service <caption|tts|reframe>` (đo byte thật,
  ghi `SLIM_VENV.json`); `node scripts/gen-model-manifest.mjs --check`;
  `node --test src/services/modelDownloader.test.cjs`;
  `VCUT_BUNDLE_SLIM_VENV=caption,tts,reframe node scripts/prepackage.mjs`.

## 7. Giới hạn & nợ mở (trung thực)

1. **bgremove KHÔNG có venv, KHÔNG có checksum.** `rembg==2.0.38` (pin K4) yêu cầu
   Python <3.11 (mọi bản ≤2.0.54 đều yêu cầu <3.11; chỉ ≥2.0.55 hỗ trợ Python mới hơn);
   VM chỉ có Python 3.12.3, không có 3.11/3.10/3.9. Lệnh `--fresh` cho bgremove đã FAIL
   thật; venv dở dang (13MB) đã xóa. Cần Python ≤3.10 hoặc nâng pin rembg (CHƯA verify —
   không đổi pin K4 nếu chưa chạy bgremove thật). Model `birefnet-general.onnx` cũng chưa
   verify checksum nên downloader từ chối tải.
2. **Tốc độ tải model lớn CHƯA đo.** Chỉ chứng minh tải thật 2.370 byte (~1s); file 2,16G
   chưa từng tải trên VM này (tránh tốn băng thông/đĩa). Resume/verify đã chứng minh bằng
   server local, nhưng throughput thực tế qua HF/GitHub trên máy user là ẩn số.
3. **Dung lượng đĩa cần cho AI đầy đủ: ~4G.** Venv thu gọn ~1G + model đã verify ~2,55G
   (+ bgremove ~0,17G khi có) + AppImage ~150M + chỗ trống làm việc. Máy ít đĩa sẽ tải
   model thất bại giữa chừng (downloader giữ `.part` để resume, nhưng không có kiểm tra
   dung lượng trống trước khi tải — nợ mở).
4. **Venv chỉ Linux x86_64 + system Python 3.12.** `pyvenv.cfg` ghi đường dẫn máy build;
   `bin/python3 -> /usr/bin/python3.12` tuyệt đối — máy user thiếu Python 3.12 hoặc khác
   kiến trúc thì venv bundle không chạy (bridge fallback về `system python3` khi đó, AI
   vẫn có thể chạy nếu máy user có đủ deps — chưa kiểm chứng fallback này).
5. **AppImage tăng ~1G khi opt-in venv.** Gói không venv ~148M; có venv ~1,15G. Mặc định
   KHÔNG bundle venv (opt-in qua `VCUT_BUNDLE_SLIM_VENV`) — quyết định này giữ nguyên.
6. **`START_TIMEOUT` flake đã có từ trước** (H8 LIMITS §3.5): deep-import probe có thể chạm
   timeout 15s khi tải nặng (đã gặp 1 lần transient, probe lại pass trong 4,4s). Không phải
   lỗi của luồng này.
7. **Downloader chưa kiểm tra dung lượng trống** trước khi tải; chưa có giới hạn băng thông;
   chưa thử tải qua proxy. Model bgremove chưa verify nên mục bgremove trong UI sẽ luôn
   báo thiếu cho đến khi có checksum.
8. **Quirk môi trường VM (không phải lỗi sản phẩm):** cuối phiên 06/11, shell của VM bắt
   đầu chặn copy nội dung file có mtime cũ (EPERM trên `cp`/`copyFileSync`/`write`,
   kể cả sau `touch` vẫn copy được — xem chi tiết dưới). Đã xử lý bằng cách `touch` lại
   cây nguồn trước khi chạy `copy-bundled-server.mjs` (chỉ đổi mtime, không đổi nội dung).
   Lần stage cuối (19:1x 06/11) đã chạy OK sau `touch`: 11.215 file / 1.052.443.303 byte.
   Nếu chạy lại staging mà gặp EPERM tương tự, chạy lại lệnh `touch` ở mục "Tái hiện"
   rồi chạy lại script — không sửa code vì lỗi này.

## 8. File đổi / mới (batch này — text only, KHÔNG venv/model/binary)

**Mới (7):**
- `apps/desktop/scripts/gen-model-manifest.mjs`
- `apps/desktop/scripts/build-slim-venv.mjs`
- `apps/desktop/src/services/model-manifest.json`
- `apps/desktop/src/services/modelDownloader.js`
- `apps/desktop/src/services/modelDownloader.d.ts`
- `apps/desktop/src/services/modelDownloader.test.cjs`
- `docs/PHASE9_ROUND52_I5_SHIP_VENV_MODELS_LIMITS.md` (file này)

**Sửa (12):**
- `apps/desktop/src/services/pythonServices.js`, `pythonServices.d.ts`
- `apps/desktop/src/services/serviceManager.js`, `serviceManager.d.ts`
- `apps/desktop/src/main.ts`, `apps/desktop/src/preload.ts`
- `apps/desktop/scripts/copy-services-js.mjs`, `prepackage.mjs`, `copy-bundled-server.mjs`
- `apps/desktop/package.json` (thêm script `build:slim-venv`)
- `server/tts/tts.py`, `server/caption/caption.py`, `server/bgremove/bgremove.py`
- `docs/DESKTOP.md` (§2)

**Không đưa vào batch:** `apps/desktop/dist/`, `build/` (slim-venv + bundled-server),
`release/`, `node_modules/`, venv gốc `server/*/.venv*`, model trong `server/*/models/`.
