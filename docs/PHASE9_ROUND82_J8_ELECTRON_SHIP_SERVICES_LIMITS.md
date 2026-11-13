# Phase 9 Round 82 — J8: Electron ship services — quyết định + prototype — LIMITS

Ngày: 10/11/2026. Luồng J8 đợt 82. Repo: `vectornewsai-cmyk/repo-1`, branch main.
Nhiệm vụ: đóng nợ mở Phase 10 — app Electron đóng gói chưa chạy đủ services
(server/bridge + Python AI không nằm trong gói); quyết định phương án ship +
prototype đóng gói thật + kiểm chứng lại cơ chế dọn bridge mồ côi (pidfile H7).
**KHÔNG push, KHÔNG release/tag, KHÔNG binary/model/venv vào batch.**

## 0. Quyết định ship (đã chốt, có số đo ở §1)

**Ship profile `full` làm mặc định:** AppImage bundle bridge + render + cả 4 slim
venv Python (caption/tts/reframe/bgremove); model AI (~3,7 GB) KHÔNG bundle,
tải lần đầu trong app (modelDownloader của I5: resume + SHA256).

**Lý do số đo ủng hộ `full` thay vì `minimal` (khuyến nghị ban đầu trong lệnh):**

| Phương án | AppImage đo thật | AI sau cài đặt |
|---|---|---|
| minimal (H8, bridge+render, không venv) | 147.915.613 byte (sha `8898971f…`) | CHẾT: không có venv downloader — chỉ model downloader. User phải tự cài Python + faster-whisper/onnxruntime/rembg/opencv bằng pip thì AI mới chạy. Tính năng local-AI (điểm khác biệt của VCut) coi như không có sẵn. |
| **full (J8, + 4 slim venv)** | **556.967.568 byte (sha256 `43a2d04557eb9046a14c4e4dab0b77e810a548085ca3478a25cc6ba08fe257be`, build run2 10/11)** | Chạy ngay sau khi tải model lần đầu (3,7 GB, resume + SHA256, UI đã có sẵn từ I5). |
| full + model bundle (loại) | ~557 MB + 3,7 GB ≈ 4,3 GB | Không ai tải file 4,3 GB. Đã loại từ I5. |

- Chênh lệch full − minimal = **409 MB** trên file tải về; trong khi model vẫn
  phải tải 3,7 GB ở cả hai phương án (caption 486 MB + TTS 2,16 GB + codec
  91 MB + BiRefNet 973 MB). Tức là tiết kiệm 409 MB ở file cài đặt không làm
  giảm đáng kể tổng lưu lượng lần đầu (~4,3 GB), nhưng làm AI không dùng được
  ngay. 557 MB vẫn trong chuẩn trình dựng video desktop (CapCut desktop
  ~400 MB; Kdenlive AppImage ~300 MB+; DaVinci Resolve hàng GB).
- `minimal` giữ lại làm profile nhẹ (máy ít đĩa / CI), không phải mặc định.
- Model KHÔNG BAO GIỜ bundle (quyết định từ I5, giữ nguyên): manifest
  `apps/desktop/src/services/model-manifest.json` xác nhận 4 model đã verify
  SHA256, tổng **3.707.375.022 byte (3,45 GiB)**.

## 1. Số đo thật từng thành phần (10/11/2026, VM 4 vCPU / ~7 GB RAM / 89 GB trống)

Đo bằng `du -sb` / `stat`, không ước tính.

| Thành phần | Byte | Ghi chú |
|---|---|---|
| Electron binary (`linux-unpacked/vcut-studio`) | 234.904.904 | Runtime Node đi kèm gói (Electron 45.2.3, Node 24.22.2 qua launcher `bin/vcut-node`) |
| `app.asar` (desktop dist + dist-web) | 3.558.084 | dist-web 3.190.212; web dist 3.625.636 |
| Bridge + render + script Python AI (text) + node_modules closure + LUT | 63.349.996 | Cây stage H8 (1.026 file); LUT `assets/filters` 58.286.427; closure `server/node_modules` (express/cors/multer/js-yaml + 79 pkg) 3.868.424 |
| Slim venv caption | 453.597.096 | Trước slim 516.672.763 (−12,2%) |
| Slim venv tts | 306.872.496 | Trước slim 894.862.978 (−65,7%, đã loại gradio/fastapi/pandas/scipy/numba/librosa) |
| Slim venv reframe | 227.717.700 | Trước slim 241.220.388 (−5,6%) |
| Slim venv bgremove | 706.841.766 | Trước slim 719.381.710 (−1,7%); rembg 2.0.60 + onnxruntime + opencv (đợt 53 J8) |
| **Tổng 4 slim venv (staged)** | **1.695.029.058 (~1,58 GiB)** | |
| Cây `build/bundled-server` đã stage (full) | 1.760.469.840 | = server bundle 63 MB + 4 venv 1,695 MB |
| AppImage full (run2 J8, 10/11) | **556.967.568** | sha256 `43a2d045…57be`; linux-unpacked 2.051.197.109 |
| AppImage full cũ trên đĩa (06/11 22:12) | 576.688.128 | Build đợt 53/54, cũng chứa 4 venv; chênh 20 MB do web dist + dist mới hơn |
| AppImage minimal (H8, 06/11) | 147.915.613 | |
| .deb minimal (H8, 06/11) | 120.231.316 | .deb full chưa build (xem §6) |
| Model caption-small (fw-small) | 486.212.372 | 4 file, SHA256 verify |
| Model tts-turbo | 2.157.916.899 | 86 file, SHA256 verify |
| Model tts-codec | 90.578.835 | 8 file, SHA256 verify |
| Model bgremove-birefnet | 972.666.916 | 1 file, SHA256 verify (đợt 53 J8) |
| **Tổng model đã verify** | **3.707.375.022 (3,45 GiB)** | |
| AppImage full + model tải lần đầu (đĩa user) | ~557 MB + 3,7 GB ≈ **4,3 GB** | + chỗ trống làm việc; downloader giữ `.part` để resume, chưa kiểm tra dung lượng trống trước khi tải (nợ từ I5) |

Phát hiện phụ khi đo (không phải lỗi ship, ghi để đợt sau biết):
- `server/caption/models/fw-small/` trên đĩa = **972.426.233 byte**, gấp đôi
  manifest (486 MB): có cả `model.bin` (483.546.902) và thư mục `blobs/`
  (483.547.013) — trùng lặp layout cache Hugging Face. Model không bundle nên
  không ảnh hưởng gói, nhưng user dev tốn ~486 MB đĩa thừa.
- `server/tts/models/` trên đĩa = 2.382.701.225 byte, hơn manifest ~134 MB
  (thư mục `gguf/` + `onnx_int8/` + `onnx_update/` ngoài manifest).
- `~/.u2net/` = 1.381.819.367 byte (birefnet 973 MB + u2net.onnx + u2netp).

## 2. Prototype: `apps/desktop/scripts/package-ship.mjs` (mới)

Script đóng gói + kiểm chứng chuẩn cho cả 2 profile (một lệnh duy nhất):

```
node apps/desktop/scripts/package-ship.mjs [--profile full|minimal]
  [--work DIR] [--skip-build] [--skip-smoke] [--skip-orphan]
# hoặc: npm run package:ship   (script mới trong apps/desktop/package.json)
```

Các bước (fail-fast: bước build fail thì dừng, không build/smoke gói từ cây
cũ — đã gặp ở run1):

1. `build-desktop`: tsc + copy-services-js (chạy trực tiếp bằng node, không
   qua npm — xem §5 về EPERM) + kiểm tra không còn file `.js` 0 byte trong
   `dist/` (tsc fail giữa chừng truncate file).
2. `prepackage` với `VCUT_BUNDLE_SLIM_VENV` theo profile.
3. `electron-builder --linux AppImage` (CLI trực tiếp, không qua npx),
   output riêng dưới `--work` (KHÔNG đè `apps/desktop/release/`).
4. `verify-packaged-tree`: sha256 + size; `linux-unpacked` chứa `vcut-server`,
   launcher `bin/vcut-node`, closure express (chống prune `node_modules` của
   H8); đúng venv theo profile; venv python `--version` + import module nặng
   chạy được; KHÔNG chứa `models/`.
5. `probe-ai-packaged`: `probeAllPythonServices` deep trên cây đã đóng gói với
   `VCUT_MODELS_DIR` trỏ thư mục model mẫu (symlink, không copy 3,7 GB).
   Profile full yêu cầu caption/translate/tts/bgremove/reframe
   `available:true`. KHÔNG chạy job TTS/caption thật.
6. `smoke-appimage`: AppImage thật dưới Xvfb (`VCUT_DESKTOP_SMOKE=1`,
   `APPIMAGE_EXTRACT_AND_RUN=1`): bridge tự start qua `bin/vcut-node`, UI
   load, thoát sạch, không mồ côi.
7. `orphan-kill9-relaunch`: kill -9 cả nhóm Electron → bridge mồ côi còn sống
   + healthy (đúng kỳ vọng) → mở lại cùng userData → manager dọn chết bridge
   cũ (pidfile H7) → bridge mới healthy → thoát sạch.

## 3. Kết quả kiểm chứng (run2, 10/11, AppImage full 556.967.568 byte)

| Bước | Kết quả |
|---|---|
| build-desktop (tsc + copy-services-js) | PASS |
| prepackage (4 slim venv) | PASS (sau khi sửa timeout verify bgremove, xem §4.1) |
| electron-builder AppImage | PASS — `vcut-studio-0.1.0-x86_64.AppImage`, 556.967.568 byte, sha256 `43a2d04557eb9046a14c4e4dab0b77e810a548085ca3478a25cc6ba08fe257be` |
| verify-packaged-tree | PASS — đủ 4 venv, import `faster_whisper`/`onnxruntime`/`cv2`/`rembg` OK, không có `models/` |
| probe-ai-packaged | **7/8** — caption/translate/tts/reframe/silence/scene/beats `available:true` (venv/system, model ok); **bgremove `available:false` do timeout import 15s** (false-negative, đã sửa thành 120s — xem §4.2; run2 chạy trước khi sửa) |
| smoke-appimage | **PASS** — `VCUT_SMOKE_RESULT ok:true`, `bridgeFromRenderer:"ok"`, `textLen:4161`, UI "VCut Studio — Trình dựng video", bridge spawn qua `bin/vcut-node` (Electron-as-node v24.22.2), healthy `http://127.0.0.1:8787` sau ~15s, thoát sạch, pidfile đã xoá. `bridgeUrl:null` là benign (UI set `__VCUT_BRIDGE_URL__` async sau mount; smoke code ghi chú rõ; `bridgeFromRenderer:"ok"` mới là bằng chứng renderer↔bridge) |
| orphan-kill9-relaunch | **Cơ chế ĐÃ CHỨNG MINH, script FAIL do 2 race (xem §5):** kill -9 nhóm Electron → bridge 30183 còn sống + healthy trên 8787 (mồ côi xác nhận); mở lại → log ghi `pidfile: phát hiện bridge mồ côi pid 30183 … đang kill` → `đã dọn bridge mồ côi pid 30183 (cổng bridge 8787 đã trống, CDP 9222 đã trống)` → `orphan-killed`; bridge cũ CHẾT, bridge mới 30635 spawn đúng cổng 8787. Nhưng bridge mới fail healthy sau 31s (race §5.2) và smoke lần 2 chỉ ra timeout (race §5.1) nên bước này FAIL. |
| bridgePidfile unit/integration (H7, chạy lại 10/11) | **14/14 pass** (70,6s) |
| tsc apps/desktop | 0 lỗi (trước sóng EPERM) |

Report JSON run2: `~/workspace/tmp-j8-electron/ship/ship-full/ship-full-report.json`
(AppImage + linux-unpacked KHÔNG stage — chỉ ở thư mục tmp).

## 4. Hai bug thật tìm được + sửa trong đợt này

### 4.1 build-slim-venv verify timeout 120s quá chặt (sửa: 120s → 300s)

- Hiện tượng (run1, 10/11): `build-slim-venv --service bgremove` fail ở bước
  verify dù stdout đã in `VERIFY OK: .../build/slim-venv/bgremove`. Nguyên
  nhân: `runVerify` dùng `spawnSync(..., {timeout: 120000})`; import
  rembg+cv2+numpy+PIL đo tay mất **49,7s wall (chỉ 2,5s CPU)** khi VM tải cao
  (loadavg ~13) — process in xong `VERIFY OK` nhưng thoát interpreter chậm
  (onnxruntime/cv2 teardown) nên bị kill ở 120s.
- Sửa: `apps/desktop/scripts/build-slim-venv.mjs` — timeout verify 120000 →
  300000 + comment ghi số đo. Run2 prepackage PASS (bgremove verify OK).
- Lưu ý: 300s vẫn fail-fast nếu import thật sự treo.

### 4.2 Probe AI deep-import timeout 15s báo sai bgremove thiếu module (sửa: 15s → 120s)

- Hiện tượng (run2 probe): bgremove `available:false`, reason `Thiếu module
  "rembg" … Lỗi: timeout sau 15000ms`, trong khi `modelOk:true` và
  verify-packaged-tree import `rembg` cùng venv với timeout 120s thì PASS.
  Tức là probe báo service "không khả dụng" sai — user mở app sẽ thấy Xoá nền
  tắt dù venv vẫn tốt.
- Nguyên nhân: `probePythonService` (`apps/desktop/src/services/pythonServices.js`)
  gọi `runShort(python, ['-c', 'import ...'], 15000)`; import rembg kéo theo
  onnxruntime+cv2+numpy, mất ~50s wall khi máy lạnh/tải cao.
- Sửa: timeout deep-import 15000 → 120000 + comment ghi số đo + đánh đổi
  (probe chạy song song nên wall time ≈ import chậm nhất, không cộng dồn;
  `start()` có thể chờ lâu hơn trên máy lạnh).
- Chưa kiểm chứng lại bằng ship run mới (bị chặn bởi sóng EPERM, xem §5.3) —
  file đã sửa trong src, `dist/services/pythonServices.js` sẽ được copy lại ở
  lần build tới (copy-services-js). **Cần run4 để xác nhận probe bgremove
  thành `available:true` trên AppImage mới.**

### 4.3 Script ship tự sửa 2 lỗi của chính nó (run1 → run2)

- (a) Thiếu fail-fast: run1 prepackage fail mà script vẫn chạy tiếp
  electron-builder từ cây stage cũ. Đã thêm `finishEarly()` sau mỗi bước
  build/verify.
- (b) `parseSmokeResult` chỉ đọc dòng `VCUT_SMOKE_RESULT` đầu tiên: guard
  30s của smoke mode in timeout TRƯỚC rồi probe thật in `ok:true` ngay sau
  (race đã ghi ở H7 §2.5). Đã sửa thành quét tất cả các dòng, ưu tiên
  `ok:true`; bước orphan ghi rõ `smokeNote` khi smoke lần 2 không ra ok và
  vẫn dọn nhóm app 2 trong `finally` (không để sót Xvfb/Electron).
- (c) Bỏ npm/npx trong script: `npm run build` và `npx electron-builder` đều
  dính EPERM khi npm mở log file (xem §5.3) — đổi sang chạy trực tiếp
  `node <tscBin>` và `node <electron-builder/cli.js>`.

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

### 5.1 Smoke guard 30s race (đã biết từ H7 §2.5, tái hiện ở run2)

`runSmokeCheck` trong `main.ts` in `VCUT_SMOKE_RESULT {"error":"timeout"}`
sau 30s rồi `app.quit()`, trong khi probe thật có thể in `ok:true` ngay sau
đó. Script ship đã xử lý bằng cách chờ cả hai dòng. Không phải lỗi sản phẩm
nghiêm trọng (smoke lần 1 vẫn PASS), nhưng guard 30s hơi chặt khi máy tải
cao — cân nhắc tăng lên 60s ở đợt harness sau.

### 5.2 Bridge mới fail healthy sau kill -9 + mở lại (race H7 §5.4, tái hiện thật trên AppImage ship)

- Run2 orphan lần 2: bridge mới 30635 spawn 15:45:43, log bridge in `đang chạy
  tại http://127.0.0.1:8787`, nhưng manager báo `bridge state -> failed:
  bridge không healthy sau 31s trên cổng 8787 (timeout thích ứng 30s)` rồi
  kill bridge mới.
- Cơ chế khả dĩ nhất (chưa chứng minh tới cùng): lúc `start()`, manager chạy
  song song deep probe AI (8 import Python nặng: faster-whisper, onnxruntime,
  rembg, cv2…) với vòng poll health của bridge; mỗi `/api/health` lại spawn
  `ffmpeg -version` (H7 đo 604–1895ms dưới tải), nên health check liên tục
  chạm timeout 2000ms trong 30s. Lần 1 (smoke) bridge healthy sau 15s — cùng
  một race, lần đó gặp may.
- Đây là flake đã ghi từ H7 §5.4 (`ffmpegVersion()` spawn lại mỗi request
  health; gợi ý cache trong bridge) và I5 §7.6. **Chưa sửa trong J8** (sửa
  bridge là thay đổi lớn hơn phạm vi ship prototype) — ghi lại làm nợ mở cho
  đợt sau, kèm bằng chứng log run2 (`userdata-orphan/logs/`).
- Hệ quả cho ship: lần mở app đầu sau crash có thể fail bridge (app vẫn mở,
  báo failed) dù bridge thật vẫn chạy được — user mở lại lần nữa thì hết.
  Không chặn quyết định ship, nhưng phải sửa trước khi coi desktop là ổn
  định. Ứng viên sửa: cache `ffmpegVersion()` trong bridge +/hoặc chạy deep
  probe SAU khi bridge healthy thay vì song song.

### 5.3 Sóng EPERM — chặn run3/run4, làm hỏng `dist/` + `package-ship.mjs` (đã khôi phục)

- Từ ~15:49 10/11, VM bắt đầu trả `EPERM: operation not permitted, write`
  cho ghi file bằng Node/npm/tsc (cả file mới và file cũ, cả `/tmp` và repo):
  `npm run build` fail ở `LogFiles.load`; tsc fail `TS5033` trên 19 file;
  `python open(p,'w')` fail sau khi truncate.
- Đặc tính đo được: sóng bật/tắt theo phút — ghi đơn lẻ thường lọt qua
  (25/25 write burst OK lúc 15:58:45), nhưng tiến trình ghi nhiều file liên
  tục (tsc 25 file/~3s) gần như luôn dính (14/14 lần thử tsc fail trong
  ~5 phút; restore 40 lần retry/file vẫn fail). `touch` KHÔNG sửa được lần
  này (khác I5 §7.8). Shell `>` và `muse.write`/`muse.edit` vẫn ghi được
  trong cùng thời điểm — sóng dường như chỉ chặn write qua một số đường
  (Node `writeFileSync`/`spawnSync`).
- Thiệt hại và khôi phục:
  - `apps/desktop/dist/`: 19 file `.js` bị tsc truncate về 0 byte (lỗi của
    J8: chạy tsc giữa sóng). Khôi phục từ `app.asar` của AppImage run2 bằng
    script `~/workspace/tmp-j8-electron/restore-dist.mjs` (đọc header asar:
    JSON ở offset 16, dài u32@12; dữ liệu ở 16+len; ghi từng file kèm retry)
    + chạy lại `copy-services-js.mjs` để `dist/services/*.js` khớp src.
  - `apps/desktop/scripts/package-ship.mjs`: bị python patch truncate về 0
    byte (mở `'w'` rồi write fail EPERM). Tái tạo toàn bộ từ bản staged
    `~/workspace/tmp-j8-electron/package-ship.mjs.new` (473 dòng,
    `node --check` OK) rồi `cp` về chỗ cũ — đã verify.
  - `ship-full-report.json` run3: 0 byte (writeFileSync truncate rồi fail) —
    chỉ là report tmp, sẽ ghi lại ở run sau.
- Trạng thái cuối đợt: **run4 (ship lại sau khi sửa probe 120s) CHƯA CHẠY
  ĐƯỢC vì sóng EPERM vẫn bật/tắt** — xem §7. Đây là blocker môi trường, không
  phải lỗi sản phẩm. Khi sóng qua, chạy `npm run package:ship` (hoặc
  `node apps/desktop/scripts/package-ship.mjs --profile full`) để lấy
  ALL GREEN.

### 5.4 Chưa làm / chưa test

- `.deb` full chưa build, chưa cài thử: VM thiếu lib hệ thống cho .deb
  (xem §6). AppImage là đường ship chính đã verify; .deb cần máy đủ lib.
- macOS/Windows/arm64: không build được từ Linux (như mọi đợt trước).
- `VCUT_NODE` override / `bin/node` thật đi kèm gói: chưa ship, chỉ có đường
  code (như H8).
- Tải model lớn lần đầu trong app (3,7 GB) chưa đo tốc độ thật trên VM này
  (chỉ chứng minh tải 2.370 byte + resume 463 MB đợt 53 J8); downloader chưa
  kiểm tra dung lượng trống trước khi tải (nợ I5).
- `dist/` hiện tại đã khôi phục từ asar run2 (build 15:17, TRƯỚC fix probe
  120s) — `dist/services/pythonServices.js` phải được copy lại từ src ở lần
  build tới; đừng dùng `dist/` hiện tại để kết luận về probe mới.
- Không đụng TTS 39 (đúng lệnh — không đo lại TTS); chỉ probe available.

## 6. `.deb` — kiểm tra lib hệ thống trên VM này (10/11)

`deb.depends` trong `apps/desktop/package.json`: ffmpeg, libgtk-3-0,
libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1,
libsecret-1-0.

| Lib | Trên VM này |
|---|---|
| ffmpeg 8.1.2 | CÓ (`/usr/bin/ffmpeg`) |
| libgtk-3-0 3.24.41 | CÓ |
| libnss3 3.98 | CÓ |
| libxss1 | CÓ |
| libatspi2.0-0 2.52.0 | CÓ |
| libuuid1 2.39.3 | CÓ |
| xdg-utils 1.1.3 | CÓ |
| **libnotify4** | **KHÔNG CÓ** |
| **libxtst6** | **KHÔNG CÓ** |
| **libsecret-1-0** | **KHÔNG CÓ** |
| libfuse2 (AppImage chạy trực tiếp, không phải dep .deb) | KHÔNG CÓ — AppImage cần `APPIMAGE_EXTRACT_AND_RUN=1` trên VM này |

Kết luận: `.deb` không cài/chạy được trên VM này (thiếu 3 lib trong depends
+ libfuse2 cho AppImage trực tiếp) — giới hạn VM đã biết từ Phase 10, không
phải lỗi đóng gói. Build `.deb` vẫn làm được bằng electron-builder/fpm
(không cần lib lúc build), nhưng không kiểm chứng được — để bước riêng.

## 7. File trong batch (stage chờ push — text only)

Đổi/thêm (6 file, toàn text — KHÔNG binary, KHÔNG `dist/`/`build/`/
`release/`/AppImage/.deb/venv/model):

| File | Đổi gì |
|---|---|
| `apps/desktop/scripts/package-ship.mjs` (mới) | Script ship chuẩn: profile full/minimal, build → prepackage → AppImage → verify → probe AI → smoke → orphan; fail-fast; retry EPERM; parser smoke chịu race guard 30s |
| `apps/desktop/package.json` | Thêm script `package:ship` |
| `apps/desktop/src/services/pythonServices.js` | Deep-import probe timeout 15s → 120s (§4.2) |
| `apps/desktop/scripts/build-slim-venv.mjs` | Verify timeout 120s → 300s (§4.1) |
| `docs/DESKTOP.md` | § mới: profile ship full/minimal + cách chạy `package:ship` + bảng kích thước (xem §8) |
| `docs/PHASE9_ROUND82_J8_ELECTRON_SHIP_SERVICES_LIMITS.md` (mới) | File này |

KHÔNG đưa vào batch: `apps/desktop/dist/` (đã khôi phục từ asar, là build
output), `build/`, `release/`, `~/workspace/tmp-j8-electron/` (AppImage
556 MB + linux-unpacked + userdata + report run2 — giữ ngoài repo để parent
đối chiếu), `~/workspace/tmp-j8-electron/package-ship.mjs.new` (bản staged
trung gian, đã `cp` về chỗ cũ), `restore-dist.mjs` (script cứu hộ một lần,
không phải deliverable — ghi cách làm trong LIMITS này).

## 8. Cách chạy lại (để parent / đợt sau kiểm chứng)

```bash
# 0. Chờ sóng EPERM qua: thử ghi file bằng node, thấy OK liên tục mới chạy.
node -e "require('fs').writeFileSync('/tmp/wave-probe.txt','x'); console.log('ok')"
# 1. Ship full (mặc định) — một lệnh, ~30-40 phút:
cd ~/workspace/repo-1/apps/desktop
npm run package:ship
# Kỳ vọng: ALL GREEN; AppImage ~557 MB tại
#   ~/workspace/tmp-j8-electron/ship/ship-full/vcut-studio-0.1.0-x86_64.AppImage
#   + report JSON cùng thư mục. Probe bgremove phải available:true (fix §4.2).
# 2. Chỉ kiểm tra nhanh (không build lại): dùng AppImage run2 đã có:
#   APPIMAGE_EXTRACT_AND_RUN=1 VCUT_DESKTOP_SMOKE=1 VCUT_MODELS_DIR=<dir models>
#   xvfb-run -a <AppImage> --user-data-dir=/tmp/j8-userdata --no-sandbox
#   (models dir mẫu đã chuẩn bị: ~/workspace/tmp-j8-electron/ship/models)
# 3. Unit/integration orphan (nhanh, không cần Electron build):
#   node --test apps/desktop/src/services/bridgePidfile.test.cjs  # 14/14
# 4. Minimal profile (so sánh kích thước):
#   node scripts/package-ship.mjs --profile minimal  # kỳ vọng AppImage ~148 MB
```

## 9. Tương tác với luồng khác trong đợt 82 (để parent gộp)

- File chung đã sửa: `apps/desktop/src/services/pythonServices.js` (1 dòng
  timeout + comment), `apps/desktop/scripts/build-slim-venv.mjs` (1 dòng
  timeout + comment), `apps/desktop/package.json` (1 dòng script),
  `docs/DESKTOP.md` (thêm § ship — xem §8). Không sửa file nào khác của
  luồng khác; không đụng `.github/workflows/*`, không đụng TTS/Gradio.
- `apps/desktop/dist/` bị J8 làm hỏng rồi khôi phục từ asar run2 (xem §5.3):
  nội dung hiện tại = build 15:17 10/11 (trước fix probe 120s). Luồng nào
  cần `dist/` mới thì chạy lại `npm run build` (tsc + copy-services-js) khi
  sóng EPERM đã qua — đừng dùng `dist/` hiện tại để kết luận về probe mới.
- `apps/desktop/build/bundled-server/` + `build/slim-venv/` là cây stage của
  run2 (full, 4 venv, 1,76 GB) — dùng lại được cho lần ship sau (prepackage
  sẽ rebuild slim venv khi chạy).
- Sóng EPERM ảnh hưởng MỌI luồng đang build trên VM này, không riêng J8 —
  parent nên báo các luồng khác: ghi file bằng Node có thể fail EPERM rồi
  truncate file về 0 byte; cách an toàn là ghi ra file mới rồi `cp`/`mv`,
  hoặc retry + verify size sau khi ghi.
