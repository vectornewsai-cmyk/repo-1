# Phase 10 — Luồng G2: Vòng đời services local trong Electron — LIMITS

Ngày: 06/11/2026. Repo: `~/workspace/repo-1`, workspace mới `apps/desktop`.
Luật: KHÔNG push, KHÔNG tag/release, KHÔNG stage paths, KHÔNG ghi build-loop-log
(parent gộp sau), KHÔNG code giả, KHÔNG `npm install` (chỉ G1 được phép).

## 1. Đã làm được gì

Quản lý vòng đời service local cho Electron app, module JS thuần (không import
electron) để test độc lập bằng Node:

- `apps/desktop/src/services/serviceManager.js` — `createServiceManager()`:
  spawn bridge, health-check, đổi cổng khi bận, restart giới hạn sau crash,
  tắt sạch cả process group khi quit, log ra file, đẩy trạng thái qua event.
- `apps/desktop/src/services/pythonServices.js` — định nghĩa + probe 8 service
  AI Python (caption, translate, tts, bgremove, reframe, silence, scene,
  beats): chọn đúng python binary theo đúng logic bridge (env → venv → python3)
  và kiểm tra sâu bằng `import` module nặng.
- `apps/desktop/src/services/serviceManager.d.ts` + `pythonServices.d.ts` —
  kiểu cho code TS import module JS (tsc allowJs tắt).
- `apps/desktop/src/serviceLifecycle.ts` — adapter nối manager vào main process
  TS (load bằng createRequire, 2 vị trí dist/src), kèm đúng đoạn code nối vào
  `main.ts`/`preload.ts` trong header comment. Adapter type-check sạch
  (tsc strict, kiểm tra tách biệt — build chung đang lỗi do code G1/G4 còn
  làm dở, xem §3.5).
- `apps/desktop/scripts/copy-services-js.mjs` — copy `src/services/*.js` vào
  `dist/services/` sau `npm run build` (tsc không copy .js). G3 có thể gọi từ
  `prepackage.mjs`.
- `apps/desktop/src/services/serviceManager.test.cjs` — test thật bằng
  `node:test`, không mock service.

## 2. Phát hiện kiến trúc quan trọng (đọc code thật, không suy đoán)

1. **Service dài hạn DUY NHẤT là bridge** (`node server/bridge/src/index.js`,
   entry point đúng như `scripts/start.sh`). Render worker
   (`server/render/src/render.js`) và các script Python AI đều là **CLI chạy
   theo job, do bridge spawn** (`jobQueue.js`, `caption.js`, `tts.js`,
   `bgremove.js`, `reframe.js`, `silence.js`, `scene.js`, `beats.js`) — không
   có daemon Python/render nào để quản lý. Manager vì vậy quản lý bridge trực
   tiếp, còn render/AI báo trạng thái qua probe + flag `/api/health`.
2. **Bridge BỎ QUA argv `--port`** (start.sh truyền `--port` nhưng `index.js`
   chỉ đọc env `BRIDGE_PORT`, mặc định 8787). Manager truyền cổng qua env.
3. **Bridge tự ưu tiên venv chỉ cho reframe** (`.venv`). Caption/TTS/bgremove
   dùng env `<TÊN>_PYTHON` hoặc `python3` mặc định — mà system `python3` trên
   VM này KHÔNG có faster-whisper/rembg/onnxruntime. Manager khi spawn bridge
   tự nối venv đã có trên đĩa vào env (`CAPTION_PYTHON`,
   `TTS_PYTHON` → `.venv2`, `BGREMOVE_PYTHON`), chỉ khi user chưa set env đó.
   Không có bước này thì caption/TTS fail lúc chạy job dù `/api/health` báo
   available:true (flag của bridge chỉ kiểm tra file script tồn tại).
4. **Bridge bind 0.0.0.0** (`app.listen(PORT)` không truyền host) — manager
   không ép loopback-only được nếu không sửa bridge (xem nợ mở).
5. **Node binary:** trong Electron, `process.execPath` là binary Electron,
   KHÔNG phải node — manager dùng `node` trong PATH (hoặc env `VCUT_NODE`,
   hoặc option `nodeBin`). App đóng gói cần node khả dụng (quyết định đóng
   gói thuộc G1/G5).

## 3. Kiểm chứng thật (đã chạy, không claim suông)

Lệnh: `xvfb-run -a node --test apps/desktop/src/services/serviceManager.test.cjs`
— **8/8 pass, ~21–38s** (2 lần chạy; lần 1 có 1 fail do lỗi test, đã sửa —
xem §3.4). Adapter biên dịch riêng ra `/tmp` và chạy thật:
`ADAPTER-RUNTIME-OK events=starting,running,stopped`.

| Test | Kết quả |
|---|---|
| Bridge khởi động, `/api/health` ok, log ghi file, `bridge-jobs` được tạo | ✔ |
| Cổng 8787 bận → tự dùng cổng trống, URL báo đúng cổng thật | ✔ |
| Probe AI đúng thực tế máy này (caption/tts có qua venv; bgremove thiếu rembg; reframe có cv2; beats có numpy) | ✔ |
| Bridge bị SIGKILL → restart (backoff 1s) và chạy lại, pid mới, health ok | ✔ |
| `stop()`: pid chết + cả process group chết, không mồ côi | ✔ |
| `killProcessGroup` dọn cả cháu trong group (leader + child đều chết sau SIGTERM) | ✔ |
| Node binary sai → `start()` reject với lỗi rõ ràng, không treo | ✔ |
| Trạng thái đẩy qua event `starting → running → stopped`, không poll | ✔ |
| Adapter TS (biên dịch tách biệt): init → start → snapshot → legacy shape → stop, pid+group chết, không bridge sót | ✔ |

### 3.1 Số đo thật trên VM này (06/11)

- `start()` đầy đủ (probe sâu song song + spawn bridge): **~3,8s**
  (import `faster_whisper` 3,1–3,3s, `onnxruntime` 2,7s, `cv2` 2,2s,
  `numpy` 2,5s chạy song song; bridge healthy sau ~1s).
- `stop()` khi bridge idle: **~0,1s** (SIGTERM group, không cần SIGKILL).
- Probe AI lúc start: caption ✔ (venv), translate ✔ (venv), tts ✔ (venv
  `.venv2`), bgremove ✘ (`Thiếu module "rembg"` — không venv, system python3
  không có rembg), reframe ✔ (venv, cv2), silence ✔ (stdlib+ffmpeg),
  scene ✔ (stdlib+ffmpeg), beats ✔ (numpy, system python3).
- Sau test: không còn tiến trình bridge (kiểm tra bằng `pgrep -f
  "bridge/src/index[.]js"` — pattern có `[.]` để tránh self-match).

### 3.2 Cách quản lý cụ thể

- Spawn: `node server/bridge/src/index.js` với env `BRIDGE_PORT=<cổng thật>`,
  `BRIDGE_WORK_DIR=<userData>/bridge-jobs`, `CAPTION_PYTHON`/`TTS_PYTHON`/
  `BGREMOVE_PYTHON` nối venv nếu có; `detached: true` để kill theo group.
- Cổng: dò trống từ 8787 lên 8796; nếu bridge chết vì `EADDRINUSE` giữa
  chừng thì thử cổng tiếp theo. URL thật nằm ở `snapshot.bridge.url`.
- Health: poll `GET /api/health` mỗi 250ms, tối đa 30s sau spawn.
- Crash: restart tối đa 3 lần, backoff 1s/2s/4s; hết lượt → state `failed`
  + thông báo rõ (ghi rõ đường dẫn log) — không restart vô hạn.
- Log: `<userData>/logs/bridge-YYYY-MM-DD.log` (stdout+stderr bridge),
  `<userData>/logs/service-manager.log`; xoay khi >10MB (→ `.1`).
- Trạng thái: event `status` (hoặc `onStatus`) mỗi khi đổi state/cổng/
  restart — renderer nhận qua `vcut:services-status`, không poll.
- Offline tuyệt đối: chỉ HTTP loopback tới bridge; không telemetry.

### 3.3 Bài học trong lúc test (đã sửa, ghi lại để khỏi lặp)

- Lần chạy test đầu: 7/8 — fail do **lỗi test** (đọc `snap2.restarts` thay vì
  `snap2.bridge.restarts`), không phải lỗi manager.
- Lần chạy thứ hai: test `stop()` fail vì `pgrep -f` khớp cả shell chứa
  chuỗi lệnh và bridge của luồng Phase 10 khác đang chạy song song trên cùng
  VM. Đã đổi test sang assert chính xác bằng pid + pgid của chính bridge
  manager spawn. **Kết luận: không dùng `pgrep -f` làm bằng chứng mồ côi
  trên VM dùng chung.**

### 3.4 Chưa kiểm chứng được (giới hạn thật)

1. **Chưa từng chạy Electron app thật.** Lúc làm G2, Electron chưa được cài
   (G1 đang `npm install` electron 45.2.3 dở); module được test độc lập bằng
   Node thuần dưới Xvfb. Việc nối adapter vào `main.ts`/`preload.ts` CHƯA
   áp dụng (file của G1 đang làm dở, build chung còn lỗi type ở
   `desktop-ux.ts`/`main.ts`) — adapter + đoạn code nối chính xác nằm trong
   header `serviceLifecycle.ts`, parent/G1 nối khi merge.
2. **Chưa test stop() giữa lúc render job đang chạy.** Group-kill đã chứng
   minh bằng process group giả lập (leader + cháu đều chết). Với job thật,
   bridge tự hủy job khi nhận SIGTERM (`shutdown()` trong `index.js`); group
   kill là lưới an toàn thứ hai — chưa đo end-to-end với render đang chạy
   (cần job render dài + kill giữa chừng; để cho G6 hoặc test tay sau).
3. **Windows chưa test.** `killProcessGroup` có nhánh `taskkill /T /F`
   nhưng chỉ chạy trên Linux ở đây.
4. **Deep probe chỉ import module, không kiểm tra file model**
   (vd: caption model `fw-small` có trên VM này, nhưng nếu thiếu thì chỉ
   fail lúc chạy job). Chưa có probe model-dir.
5. **Không kiểm tra dung lượng đĩa/RAM trước khi start** (bridge tự kiểm tra
   disk free trong `/api/health` — manager chỉ đọc lại flag).

## 4. Nợ mở (cho parent / luồng khác)

1. **Nối adapter vào main/preload (G1 hoặc parent lúc merge):** thêm
   `initServiceLifecycle` + `startLocalServices()` trong `whenReady()`,
   `stopLocalServices()` trong `before-quit`, handler `desktop:get-services`
   dùng `localSnapshotToServiceStatus()`, preload thêm `onServicesStatus`.
   Đoạn code chính xác nằm trong header `src/serviceLifecycle.ts`.
2. **Web UI phải dùng `snapshot.bridge.url`, không hardcode 8787.**
   `src/services.ts` (G1) hiện hardcode `BRIDGE_URL = 127.0.0.1:8787` và
   `main.ts` chỉ probe (không start service) — khi 8787 bận, UI sẽ báo
   bridge chết dù bridge đang chạy ở cổng khác.
3. **Bridge bind 0.0.0.0:** muốn loopback-only cần thêm env `BRIDGE_HOST`
   vào `server/bridge/src/index.js` (sửa bridge, ngoài scope G2).
4. **bgremove không chạy được trên VM này** (thiếu venv + rembg trong system
   python3). Cần `bash scripts/install.sh` (tạo `server/bgremove/.venv`) hoặc
   cài rembg — việc của môi trường/đóng gói, không phải code manager.
5. **Đóng gói:** `node` + các venv Python (~1,6GB: caption 505MB, tts 898MB,
   reframe 236MB) + model AI phải đi kèm app Linux thế nào là quyết định của
   G1/G5 (bundle hay yêu cầu cài sẵn). Manager chỉ báo lỗi rõ khi thiếu.
6. **Mâu thuẫn phân công cần parent chốt:** `src/services.ts` (G1) ghi
   "vòng đời service do luồng G4 quản lý", trong khi task giao G2 làm vòng
   đời. Nếu G4 cũng viết một manager nữa sẽ trùng lặp — parent xác nhận một
   đầu mối duy nhất (module này).
7. **Log chưa dọn file cũ:** log xoay ở 10MB nhưng không xóa log ngày cũ —
   có thể đầy userData sau thời gian dài. Thêm dọn log >30 ngày nếu cần.
8. **`server/tracking/track.py` không thuộc diện quản lý** — bridge không
   serve tracking, ngoài danh sách service của task nên không probe.

## 5. File đã đổi/thêm (G2)

Mới (không sửa file nào của luồng khác):

- `apps/desktop/src/services/serviceManager.js` — manager vòng đời (spawn/
  health/port/restart/stop/log/event).
- `apps/desktop/src/services/pythonServices.js` — định nghĩa + probe 8
  service AI Python, nối venv cho bridge.
- `apps/desktop/src/services/serviceManager.d.ts` — kiểu TS cho manager.
- `apps/desktop/src/services/pythonServices.d.ts` — kiểu TS cho probe.
- `apps/desktop/src/services/serviceManager.test.cjs` — 8 test thật
  (`node:test`, chạy dưới `xvfb-run`).
- `apps/desktop/src/serviceLifecycle.ts` — adapter TS nối manager vào main.
- `apps/desktop/scripts/copy-services-js.mjs` — copy `src/services/*.js`
  vào `dist/services/` sau build.
- `docs/PHASE10_G2_SERVICES_LIMITS.md` — file này.

Không sửa: `server/bridge/*`, `server/*` (chỉ đọc), `apps/desktop/src/main.ts`,
`preload.ts`, `services.ts`, `package.json`, `scripts/prepackage.mjs`
(của G1/G3 — chỉ đọc để phối hợp). Không chạy `npm install`.
