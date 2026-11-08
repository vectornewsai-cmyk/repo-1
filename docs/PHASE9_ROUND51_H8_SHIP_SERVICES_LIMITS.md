# Phase 9 round 51 — H8: Ship services vào app đóng gói — LIMITS

Ngày: 06/11/2026. Luồng H8 của đợt 51 (Phase 10 Electron). Nhiệm vụ: đóng
nợ mở Phase 10 `docs/PHASE10_LIMITS.md` §5.1 — app đóng gói chưa chạy đủ
services (bridge + render + Python AI không nằm trong gói).

**Kết quả ngắn:** bridge + render worker ĐÃ chạy được trong app đóng gói
(smoke AppImage thật `ok:true`, `bridgeFromRenderer:"ok"`, render MP4 thật
qua bridge của AppImage, thoát sạch không mồ côi). Python venv + model AI
KHÔNG bundle trong đợt này (theo đúng lệnh) — kế hoạch cụ thể ở §5.
KHÔNG push, KHÔNG release/tag. Batch stage chờ user push (xem §7).

## 1. Làm được gì — cơ chế bundle

### 1.1 Cây server bundle (`resources/vcut-server/`)

`apps/desktop/scripts/copy-bundled-server.mjs` stage cây server lúc đóng
gói (chạy từ `scripts/prepackage.mjs`, trước electron-builder) vào
`apps/desktop/build/bundled-server/` (gitignored, KHÔNG commit), rồi
`extraResources` trong `apps/desktop/package.json` copy vào
`resources/vcut-server/`:

| Thành phần | Nội dung | Byte |
|---|---|---|
| `bin/vcut-node` | Launcher "node" của app đóng gói (xem §1.2) | 1.704 |
| `server/bridge/src/*.js` + `server/bridge/openapi.yaml` | Bridge (chỉ `.js`, không `*.md`) | — |
| `server/render/src/*.js` + `*.py` helper | Render worker (trừ `test_*`/`measure_*`/`demo_*`) | — |
| `server/caption/*.py`, `tts/tts.py`, `bgremove/bgremove.py`, `reframe/reframe.py`, `silence/*.py`, `scene/*.py`, `beats/*.py` | Script Python AI (text only, KHÔNG venv/models) | — |
| `packages/video-spec/src/*.js`, `packages/plugin-api/src/*.js` | Render `require()` theo đường tương đối / `REPO_ROOT` | 280K |
| `assets/filters/*.cube` (181 file) | LUT cho render + `GET /api/luts/:id` | 56M |
| `server/node_modules/` (closure: express, cors, js-yaml, multer + 79 package) | Chỉ deps bridge cần | 5,8M |

**Tổng cây stage: 1.026 file, 63.349.996 byte** (60,4 MiB, xem
`build/bundled-server/MANIFEST.json`). Giữ đúng layout tương đối của repo
vì bridge/render resolve mọi thứ theo `__dirname` (bridge →
`../../render/src/render.js`, `../../caption/caption.py`,
`../../../assets/filters`; render →
`../../../../packages/video-spec/src/index.js`, `../../../assets`).

### 1.2 Node đi kèm gói: launcher `bin/vcut-node` (không tải Node riêng)

Bridge chạy bằng **chính binary Electron** ở chế độ Node thuần
(`ELECTRON_RUN_AS_NODE=1`, Node 24.22.2 trong Electron 45.2.3) qua launcher
`apps/desktop/scripts/vcut-node` (sh, stage vào `bin/vcut-node`, chmod
0755). Launcher tìm binary theo thứ tự: `$VCUT_ELECTRON_BIN` →
`../../../vcut-studio` tương đối từ script (3 cấp `..`: bin → vcut-server
→ resources → gốc) → lỗi 127 rõ ràng nếu không thấy. `exec` thay thế
shell nên pid/process-group giữ nguyên — ServiceManager kill cả group và
pidfile (H7) vẫn đúng.

**Vì sao KHÔNG đặt `ELECTRON_RUN_AS_NODE=1` vào env của main process
(bài học đắt nhất đợt này, gặp thật):** biến đó mà nằm trong env của main
process thì MỌI tiến trình con Chromium (zygote, GPU, renderer, network
service) cũng khởi động bằng cùng binary và kế thừa env — chúng chạy dạng
Node, báo `/proc/self/exe: bad option: --type=utility` rồi chết, network
service crash liên tục, cửa sổ không bao giờ load. Bản build đầu tiên của
đợt này mắc đúng lỗi này: smoke AppImage timeout 120s không ra kết quả
trong khi bridge vẫn chạy tốt. Launcher giới hạn biến CHỈ trong cây bridge:
bridge có biến, render worker do bridge spawn (`process.execPath`, không
override env) kế thừa biến từ bridge — cả chuỗi đúng, Chromium an toàn.
`bundledRuntime.ts` cũng KHÔNG bao giờ chạm `process.env` (có unit test
khẳng định).

### 1.3 Loader `src/services/bundledRuntime.ts` (mới)

`resolveBundledRuntime({isPackaged, resourcesPath, repoRoot, execPath,
env})` — hàm thuần, chỉ đọc fs, test được bằng Node thuần. Thứ tự ưu tiên:
1. `VCUT_NODE` (user chỉ định rõ) → 2. node thật tại
`<vcut-server>/bin/node` nếu có (đợt này CHƯA ship, chỉ để sẵn đường) →
3. packaged + có bundle: launcher `bin/vcut-node`, mode `electron-as-node`
→ 4. node hệ thống (`node` trong PATH) + appRoot repo (dev) hoặc
`resources/app` (packaged, hành vi Phase 10 cũ — bridge thiếu, manager
báo failed, app vẫn mở).
`ensureBundledRuntimeExecutable()` chmod lại launcher mất bit +x
(best-effort, không ném). Không có tác dụng phụ nào khác.

**Điểm nối (KHÔNG sửa file H7):** `main.ts` (điểm nối ROUND51-H8, đã nối):
truyền `appRoot` + `nodeBin` từ loader vào `initServiceLifecycle()` (hàm
này đã nhận `nodeBin` từ trước) + gọi `ensureBundledRuntimeExecutable()`
+ append 1 entry `bundled-runtime` vào handler `desktop:get-services`
(đi qua preload `getServices`/`vcut:services-status` đã có, không thêm
kênh IPC). **KHÔNG sửa** `services.ts`, `serviceLifecycle.ts`,
`serviceManager.js` (H7 sở hữu) — H7 đang sửa các file đó song song, xem
§6.3 về va chạm đã gặp.

### 1.4 Bẫy electron-builder: `extraResources` prune `node_modules` ở gốc

Build đầu tiên ra gói **thiếu toàn bộ `node_modules/`** (259 file thay vì
1.025) dù cây stage đủ — nguyên nhân trong code electron-builder
(`app-builder-lib/out/util/filter.js`, `createFilter`: `relative ===
"node_modules"` → return false, cả thư mục bị prune). Cách sửa: đặt
closure ở `server/node_modules/` (chỉ prune đúng gốc) — Node resolve từ
`server/bridge/src` đi lên vẫn gặp `server/node_modules`. Đã kiểm chứng
bằng `require.resolve` + boot bridge thật từ cây stage. Bài học này cũng
áp dụng cho mọi đợt bundle sau: không bao giờ đặt `node_modules` ở gốc
của một `extraResources`.

## 2. Kích thước gói — số byte thật (06/11)

Baseline (Phase 10, `docs/PHASE10_LIMITS.md` §2, rebuild 09:42–09:45):

| Gói | Trước | Sau | Tăng |
|---|---|---|---|
| AppImage `vcut-studio-0.1.0-x86_64.AppImage` | 128.102.744 byte (sha `6e6fd2fb…`) | **147.915.613 byte** (sha256 `8898971f5b0e85ed701c32cd05614894b2015a5a47c7e9c3ae38b4a0d3382c4a`) | **+19.812.869 (+15,5%)** |
| .deb `vcut-studio_0.1.0_amd64.deb` | 103.006.396 byte (sha `266d9823…`) | **120.231.316 byte** | **+17.224.920 (+16,7%)** |

- AppImage "sau" là bản build riêng đã verify ở
  `~/workspace/tmp-h8-electron/release-h8c/` (xem §3); cây `vcut-server`
  trong gói 63.349.996 byte nhưng nén squashfs tốt (text `.cube` + JS)
  nên gói chỉ tăng ~19,8MB.
- `.deb` "sau" build cùng lượt với AppImage đầu tiên (12:44) — nội dung
  `vcut-server` đã verify đủ (1.212 entry, gồm 40 file express) NHƯNG
  chứa launcher bản **chưa sửa** đường `../../../vcut-studio` (xem §3.2)
  nên **.deb trong `release/` hiện tại phải build lại** trước khi dùng
  thật (xem §6.4). Số byte .deb sau khi build lại với launcher đã sửa sẽ
  chênh không đáng kể (~1,7KB script).
- Lưu ý: `release/` trong repo đang bị nhiều luồng round 51 build đè
  nhau (xem §6.4) — AppImage trong `release/` lúc này (147.915.646 byte,
  12:41) là bản build của H7 từ cùng cây code, KHÔNG phải bản H8 đã
  smoke-test. Bản đã verify nằm ở `release-h8c/` (nêu trên).

## 3. Kiểm chứng thật (không claim suông)

### 3.1 Unit test loader — 10/10 pass

`cd apps/desktop && npm run build && node --test
src/services/bundledRuntime.test.cjs` → **10 pass, 0 fail**:
dev (repo root, system-node) / packaged + bundle (electron-as-node qua
launcher) / packaged + thiếu bundle (fallback `resources/app`, ok=false) /
`bin/node` thắng launcher / `VCUT_NODE` thắng mọi chế độ / thiếu launcher
→ fallback system-node / resolve không chạm `process.env` / ensure chmod
lại launcher mất bit +x / cây stage thật (resolve qua override, đủ bridge
+ render + launcher + express). `tsc` desktop 0 lỗi.

### 3.2 Boot bridge từ cây stage (trước khi đóng gói)

- `ELECTRON_RUN_AS_NODE=1` + binary Electron chạy thẳng bridge stage:
  `/api/health` ok:true, node v24.22.2, ffmpeg 8.1.2.
- Render E2E qua bridge stage (spec demo 720p 10s, clip1+clip2+music):
  job `done`, MP4 h264 1280×720 + aac, 10,0s, **2.279.729 byte**,
  QA ok. `GET /api/luts/cartcut-teal-orange` trả `.cube` từ bundle.
- Launcher `bin/vcut-node` (sau khi sửa §3.3): `--version` → v24.22.2,
  boot bridge trên cổng 8792 health ok, tắt sạch bằng SIGTERM.
- Dọn sạch sau mỗi lần test: không còn tiến trình bridge/render.

### 3.3 Smoke AppImage — 2 lần fail thật rồi mới pass (trung thực)

1. **Lần 1 (build 11:58, thiếu `node_modules`):** chưa smoke — phát hiện
   gói thiếu deps khi kiểm tra `linux-unpacked` (xem §1.4). Gói này đã
   bị loại, không dùng.
2. **Lần 2 (build4, `ELECTRON_RUN_AS_NODE` trong env main process):**
   AppImage chạy, loader resolve đúng, bridge bundle start tốt trên
   8787 (`service-manager.log`: spawn đúng `vcut-server`, state running)
   NHƯNG cửa sổ không load — network service crash liên tục
   (`/proc/self/exe: bad option: --type=utility`), smoke timeout 120s
   không có `VCUT_SMOKE_RESULT`, bridge mồ côi pid 13258 (đã kill tay +
   verify cổng 8787 trống). Nguyên nhân: biến nhiễm tiến trình con
   Chromium (xem §1.2). Đã sửa bằng launcher.
3. **Lần 3 (build5, launcher sai đường `../../vcut-studio`):**
   `_checkNodeBin` fail: `Không chạy được node ".../bin/vcut-node":
   Command failed: ... --version` — launcher tính sai 2 cấp `..` thay
   vì 3 cấp (bin → vcut-server → resources → gốc). Đã sửa thành
   `../../../vcut-studio`, verify bằng layout giả trước khi rebuild.
4. **Lần 4 (build6 = release-h8c, PASS):** chạy
   `APPIMAGE_EXTRACT_AND_RUN=1` (VM thiếu libfuse2, xem §6.1),
   `VCUT_DESKTOP_SMOKE=1`, Xvfb, userdata riêng:
   `VCUT_SMOKE_RESULT {"bridgeFromRenderer":"ok",
   "bridgeUrl":"http://127.0.0.1:8788","hasNativeFileApi":true,
   "hasPreloadApi":true,"ok":true,"rootChildren":1,
   "screenshot":".../h8-smoke3.png","secureContext":true,"textLen":2154,
   "title":"VCut Studio — Trình dựng video","url":"app://vcut/index.html"}`.
   Cổng 8788 do 8787 đang bận (bridge của luồng khác) — manager tự dò
   cổng trống, đúng thiết kế. Log manager: `spawn bridge: .../bin/vcut-node
   .../server/bridge/src/index.js (BRIDGE_PORT=8788)` → running →
   thoát: `dừng bridge (pid 18519, SIGTERM cả process group)` →
   `bridge state -> stopped`, pidfile gỡ, **không mồ côi** (verify pid
   chết, cổng 8788 đóng, app thoát hẳn).

### 3.4 Render thật qua bridge của AppImage (PASS)

AppImage release-h8c chạy nền (userdata4, CDP 9236): bridge bundle lên
8787, POST render spec demo → job `done`, tải MP4 **2.279.729 byte**
(h264 1280×720 + aac, 10,0s, QA ok — đúng bằng lần render qua cây stage),
đóng cửa sổ qua CDP (`window.close()`) → bridge dừng (SIGTERM group),
cổng 8787 đóng, không mồ côi.

### 3.5 Test suite lân cận (trạng thái cuối đợt)

- `serviceManager.test.cjs`: **8/8 pass lúc 11:47** (sau khi H7 sửa xong
  lỗi `readBridgePidfile` — xem §6.3). Hai lần chạy full-suite sau đó
  (khi VM tải cao, nhiều luồng chạy song song) fail 7/8 ở cùng 1 test
  (`trạng thái đẩy qua event`: `bridge không healthy sau 30s trên cổng
  8787`); chạy riêng test đó thì **pass trong 7,4s**, và `manager.start()`
  trực tiếp cũng **START_OK** (~14s, bridge healthy chậm ~10s do deep
  probe Python + tải VM). Kết luận: flake do timeout 30s (`START_TIMEOUT_MS`)
  quá chặt khi VM 2vCPU đang chạy nhiều build/Electron song song — KHÔNG
  phải regression từ H8 (H8 không sửa file này; manager vẫn start tốt
  trong app thật, xem §3.3–3.4). Nợ mở: cân nhắc tăng `START_TIMEOUT_MS`
  hoặc làm health-check khoan dung hơn khi tải cao.
- `bridgePidfile.test.cjs` (H7): **12/12 pass** (11:47).
- `npm run build --workspace=@repo-1/web` (trong `build:desktop`) **FAIL
  lúc 12:0x do file test của luồng H1/H2** (`ttsEstimate51H1/H2.test.ts`
  thiếu module `./ttsEstimate51H1`/`./ttsEstimate51H2`, lỗi TS6133/TS2307/
  TS7006) — file của luồng khác, H8 không sửa. Gói AppImage đã verify
  được build bằng `electron-builder` trực tiếp từ `apps/web/dist` tốt
  cuối cùng (11:51) + desktop build mới; web UI trong gói là bản tốt
  cuối cùng, không phải bản mới nhất của các luồng khác.

## 4. Cơ chế chi tiết (để đợt sau nối tiếp không đoán)

- `main.ts` → `resolveBundledRuntime()` → `initServiceLifecycle({appRoot,
  nodeBin, ...})` (đã nhận `nodeBin` từ trước, không đổi chữ ký) →
  ServiceManager spawn `nodeBin` (= launcher) với env kế thừa process.env
  → launcher `exec env ELECTRON_RUN_AS_NODE=1 <electron> bridge/index.js`
  → bridge spawn render bằng `process.execPath` (kế thừa biến) → render
  spawn ffmpeg hệ thống.
- `desktop:get-services` trả thêm `{name:"bundled-runtime", ok, detail}`
  — renderer thấy rõ nguồn bridge (bundle / VCUT_NODE / hệ thống /
  không có bridge).
- `copy-bundled-server.mjs` dọn sạch `build/bundled-server/` rồi stage
  lại mỗi lần (đổi layout không dọn sẽ sót thư mục cũ — gặp thật khi
  chuyển closure sang `server/node_modules`).
- Staging KHÔNG copy: `.venv/`, `models/`, `__pycache__/`, `*.md`,
  `test_*/measure_*/demo_*`, assets ngoài `filters/`, node_modules ngoài
  closure (root `node_modules` 456MB → closure 5,8MB).

## 5. Kế hoạch bundle Python venv + model AI (đợt sau làm)

**Đo thật trên VM này (06/11):**

| Thành phần | Dung lượng | Ghi chú |
|---|---|---|
| `server/caption/.venv` | 505M | faster-whisper 1.2.1 + ctranslate2 + onnxruntime + tokenizers + av (pin K4) |
| `server/caption/models` | 928M | Model Whisper |
| `server/tts/.venv2` | 898M | VieNeu-TTS (onnxruntime) |
| `server/tts/models` | 2,3G | `VieNeu-TTS-v3-Turbo`, `MOSS-Audio-Tokenizer-Nano-ONNX` |
| `server/reframe/.venv` | 236M | opencv-python-headless 5.0.0.93 + numpy 2.5.4 (pin K4) |
| `server/bgremove/.venv` | KHÔNG CÓ | Chưa tạo trên VM này — cần tạo mới (rembg + onnxruntime + model u2net ~170MB tải riêng) |
| **Tổng venv (không models)** | **~1,6G** | Khớp ước tính "1,6GB" trong PHASE10_LIMITS |
| **Tổng venv + models** | **~4,9G** | Chưa tính bgremove |

**Phương án đề xuất (đợt sau quyết + làm):**

A. **Bundle venv thu gọn vào `extraResources`** (khuyến nghị cho caption/
   reframe/silence/scene/beats — nhẹ, không model lớn):
   - Tạo venv sạch từ `requirements.txt` đã pin (K4) trên máy build
     Linux x86_64, `pip install --no-cache-dir`, rồi strip: xoá
     `__pycache__`, `*.pyc`, `tests/`, `*.dist-info/RECORD` thừa, `pip`
     setuptools wheel sau khi cài (giữ lại `pip` tối thiểu hoặc xoá hẳn
     nếu không cần cài thêm lúc chạy). Ước tính thu gọn: caption 505M →
     ~350–400M, reframe 236M → ~150M, tts venv 898M → ~600M (onnxruntime
     là phần lớn, khó gọn hơn).
   - Đặt ở `resources/vcut-server/venv/<service>/`, `pythonServices.js`
     + `buildBridgeEnv()` đã hỗ trợ `server/<svc>/.venv/bin/python`
     tương đối từ appRoot — chỉ cần đổi `venvRel` từ `.venv` sang
     `venv/<svc>` hoặc giữ nguyên tên `.venv` trong bundle (đơn giản
     nhất: stage `server/caption/.venv` → `vcut-server/server/caption/.venv`,
     code hiện tại tìm đúng, không sửa code).
   - Vấn đề lớn nhất: venv chứa **đường dẫn tuyệt đối lúc tạo** (shebang
     `#!/path/to/.venv/bin/python`, `pyvenv.cfg` ghi `home = ...`) —
     phải tạo venv với đường dẫn ĐÍCH (`--prompt` không đủ; dùng
     `python -m venv --copies` + sửa shebang bằng `sed` lúc stage, hoặc
     build venv ngay trong cây stage với `VIRTUAL_ENV` trỏ đúng đích).
     Cần test thật: chạy `caption.py --help` bằng python bundle trên máy
     sạch (không có venv gốc).
   - License: faster-whisper (MIT), ctranslate2 (MIT), onnxruntime
     (MIT), opencv (Apache-2.0), numpy (BSD) — đều cho phép phân phối
     lại; **giữ lại file LICENSE của từng package** trong venv khi strip
     (không xoá `*.dist-info/METADATA` + `LICENSE*`).

B. **Model AI tải riêng lần đầu (khuyến nghị cho TTS 2,3G + Whisper
   928M):** KHÔNG bundle model vào AppImage (gói sẽ lên ~5GB, không ai
   tải). Thay vào đó: app lần đầu chạy AI → hỏi user → tải model từ
   nguồn gốc (Hugging Face / URL trong `fetch_model.py` /
   `download_model.sh` đã có) về `userData/models/`, verify checksum
   (SHA256, ghi rõ trong docs), resume khi đứt mạng, cho phép user chọn
   thư mục model có sẵn. Ước tính tải lần đầu: Whisper ~928M, TTS ~2,3G
   (cân nhắc chỉ tải model Turbo nhỏ trước, model lớn để user chọn sau).
   Bridge đã đọc model theo đường dẫn (caption `models/`, tts `models/`)
   — cần nối thêm env/đường dẫn `VCUT_MODELS_DIR` trỏ về userData khi
   đóng gói (việc cho đợt sau).

C. **Không làm:** bundle nguyên `.venv` đang chạy trên VM này (chứa
   đường dẫn `/home/hatch/...`, rác test, `__pycache__`); tải model lén
   không hỏi user; bundle model bản quyền (không có — toàn model local
   đã dùng).

**Rủi ro:** dung lượng (AppImage ~150M → ~2G nếu bundle cả venv thu gọn,
~5G nếu kèm models — nên tách model ra tải riêng như phương án B);
venv Linux x86_64 không chạy trên macOS/Windows/arm64 (mỗi platform cần
venv riêng — đợt sau chỉ làm Linux trước); onnxruntime/ctranslate2 có
`.so` biên dịch theo glibc — máy user glibc quá cũ sẽ lỗi import (cần
ghi rõ yêu cầu hệ thống + fallback báo lỗi rõ ràng, không crash app);
quyền thực thi của `venv/bin/python` sau khi đóng gói (xử lý như launcher:
chmod lúc stage + verify).

## 6. Giới hạn — chưa làm được / chưa test (trung thực)

1. **`.deb` trong `release/` chứa launcher bản cũ** (sai đường
   `../../vcut-studio`, xem §3.3 bước 3) — do build cùng lượt với
   AppImage đầu tiên, trước khi sửa launcher. Cần build lại `.deb` từ
   cây stage đã sửa. AppImage đã verify (`release-h8c/`) thì đúng.
   `.deb` vẫn chưa chạy được trên VM này (thiếu 5 lib hệ thống, giới hạn
   VM đã biết từ Phase 10).
2. **Web build gãy do luồng khác** (H1/H2 test thiếu module, §3.5) —
   gói đã verify dùng `apps/web/dist` tốt cuối cùng (11:51), không phải
   web mới nhất. Khi H1/H2 sửa xong, build lại `build:desktop` đầy đủ.
3. **AppImage cần `APPIMAGE_EXTRACT_AND_RUN=1` trên VM này** (thiếu
   libfuse2 — giới hạn VM đã biết từ Phase 10 §5.6; máy user Ubuntu
   desktop có fuse2 thì chạy trực tiếp bình thường). Smoke đã chạy theo
   cách harness G6 dùng.
4. **Chưa test:** `.deb` cài trên máy sạch; macOS/Windows/arm64 (không
   build được từ Linux); AppImage trên máy có sẵn libfuse2 (chạy trực
   tiếp không extract); `VCUT_NODE` override trong app đóng gói thật;
   `bin/node` thật đi kèm gói (chưa ship — chỉ có đường code); caption/
   TTS/bgremove trong app đóng gói (cần venv — xem §5).
5. **ServiceManager test flake khi tải cao** (§3.5): `START_TIMEOUT_MS`
   30s quá chặt khi VM 2vCPU chạy nhiều luồng song song (bridge healthy
   chậm ~10s). Chạy riêng thì pass.
6. **Va chạm trong đợt 51 (đã xử lý, ghi để parent biết):**
   - H7 đang sửa `serviceManager.js` song song: lúc 11:44 file này
     **gãy hoàn toàn** (`ReferenceError: readBridgePidfile is not defined`
     — destructure thiếu `readBridgePidfile` trong khi `module.exports`
     đã dùng nó; `serviceManager.test.cjs` fail 0/1). H8 KHÔNG sửa file
     H7 — chỉ đọc để xác nhận + chờ; H7 sửa xong lúc 11:45, test lại
     8/8. Đây là trạng thái giữa chừng của luồng khác, không phải lỗi H8.
   - `build:desktop` lần 2 fail do web tsc của H1/H2 (§3.5) — H8 build
     AppImage bằng `electron-builder` trực tiếp, bỏ qua bước build web.
   - `release/` bị nhiều luồng build đè nhau: H7 build AppImage-only
     song song đã ghi đè AppImage của H8 giữa chừng (copy giữa lúc ghi
     ra file rách 25MB, sha khác) — H8 chuyển sang build ra thư mục
     riêng `tmp-h8-electron/release-h8c/` để có artifact ổn định đo +
     smoke. Parent nên quy định: mỗi luồng build ra thư mục riêng, chỉ
     parent gộp vào `release/` sau cùng.
   - Service restart giữa lúc build lần 1 (fpm `.deb` đang chạy) — build
     lần 1 mất `.deb` (đã build lại xong ở build3, §2).
   - Cổng 8787/8788/8789 luôn bận vì bridge của các luồng khác — smoke
     dùng manager tự dò cổng (8788) thay vì 8787 cứng; đây là hành vi
     đúng, không phải lỗi.
7. **Nợ nhỏ:** `copy-bundled-server.mjs` chưa prune `*.dist-info` thừa
   trong closure (79 package, 5,8M — đã gọn, không đáng kể); `MANIFEST.json`
   nằm trong gói (12KB, có ích để debug, giữ lại); launcher là sh —
   Windows không dùng được (chỉ Linux đợt này); chưa có test tự động
   cho việc `extraResources` không prune `node_modules` (hồi quy có thể
   tái diễn nếu đổi layout — test cây stage thật trong
   `bundledRuntime.test.cjs` chỉ kiểm tra file tồn tại, chưa kiểm tra
   gói đã đóng; harness G6 nên thêm check `resources/vcut-server/
   server/node_modules/express` khi có `--appimage`).

## 7. File trong batch (stage chờ push — text only)

Đổi/thêm (7 file, toàn text — KHÔNG binary, KHÔNG `dist/`/`release/`/
`build/`/AppImage/.deb):

| File | Đổi gì |
|---|---|
| `apps/desktop/src/services/bundledRuntime.ts` (mới) | Loader runtime bundle (resolve + ensure executable) |
| `apps/desktop/src/services/bundledRuntime.test.cjs` (mới) | Unit test loader, 10 test |
| `apps/desktop/scripts/copy-bundled-server.mjs` (mới) | Stage cây server bundle lúc đóng gói |
| `apps/desktop/scripts/vcut-node` (mới) | Launcher sh chạy Electron dạng Node trong cây bridge |
| `apps/desktop/src/main.ts` | Nối loader (ROUND51-H8): `appRoot` + `nodeBin` + entry `bundled-runtime` trong `desktop:get-services` |
| `apps/desktop/package.json` | Thêm `build.extraResources` (`build/bundled-server` → `vcut-server`) |
| `apps/desktop/scripts/prepackage.mjs` | Thêm bước `copy-bundled-server.mjs` |
| `docs/DESKTOP.md` | §2/§3/§4/§11: services đi kèm gói, kích thước mới, bảng sở hữu, kết quả kiểm chứng H8 |
| `docs/PHASE9_ROUND51_H8_SHIP_SERVICES_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: `apps/desktop/dist/`, `dist-web/`,
`build/bundled-server/`, `release/` (AppImage/.deb/linux-unpacked),
`node_modules/`, `~/workspace/tmp-h8-electron/` (artifact kiểm chứng
riêng của H8, giữ ngoài repo để parent đối chiếu: AppImage đã verify
`release-h8c/`, log smoke, MP4 render).

## 8. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
# 1. Unit loader (sau npm run build ở apps/desktop):
cd apps/desktop && npm run build && node --test src/services/bundledRuntime.test.cjs
# Kỳ vọng: 10 pass, 0 fail.
# 2. Stage cây bundle + verify require:
node scripts/copy-bundled-server.mjs   # kỳ vọng: 1026 file, 60,4 MiB
node -e "for (const d of ['express','cors','multer','js-yaml']) console.log(d, require.resolve(d, {paths:['./build/bundled-server/server/bridge/src']}))" 
# 3. Đóng gói AppImage riêng (tránh đè release/ của luồng khác):
export TMPDIR=~/workspace/tmp-h8-electron
npx electron-builder --linux AppImage -c.directories.output=/tmp/h8-appimage
# 4. Smoke AppImage (VM thiếu libfuse2 → cần APPIMAGE_EXTRACT_AND_RUN=1):
export TMPDIR=~/workspace/tmp-h8-electron APPIMAGE_EXTRACT_AND_RUN=1 VCUT_DESKTOP_SMOKE=1
xvfb-run -a /tmp/h8-appimage/vcut-studio-0.1.0-x86_64.AppImage --user-data-dir=/tmp/h8-userdata --no-sandbox
# Kỳ vọng trong stdout: VCUT_SMOKE_RESULT {... "ok":true, "bridgeFromRenderer":"ok", "textLen":2154 ...}
# và service-manager.log trong userdata: spawn bridge qua bin/vcut-node → running → stopped, không mồ côi.
```
