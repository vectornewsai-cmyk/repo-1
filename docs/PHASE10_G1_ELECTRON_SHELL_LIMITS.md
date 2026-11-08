# Phase 10 G1 — Electron Shell — LIMITS (giới hạn trung thực)

Ngày: 2026-11-06. Electron **45.2.3** (pin exact, kiểm tra bằng `npm view`), electron-builder **26.18.0**. Node v24.22.1, npm 10.9.4. VM test: 2 vCPU / 8 GB RAM, không GPU, chạy dưới quyền root + Xvfb.

Phạm vi G1: Electron shell — main process, preload an toàn, load UI web, menu native, script dev/build/start, đóng gói Linux qua electron-builder. KHÔNG push, KHÔNG tag/release, KHÔNG stage paths (parent gộp sau).

## §1. Làm được gì (đã kiểm chứng tận tay)

- **Workspace `apps/desktop`** tạo mới, nằm trong glob `apps/*` của root package.json. `package.json` pin exact electron 45.2.3 + electron-builder 26.18.0 + typescript ~5.6.3 + @types/node ~26.6.5. Root package.json thêm 3 script tiện ích: `dev:desktop`, `build:desktop`, `start:desktop`.
- **Main process** (`src/main.ts`, CommonJS, strict): BrowserWindow, single-instance lock, window state persist (size/position/maximized → `userData/window-state.json`, validate số, bỏ tọa độ vô lý), dev/prod load, IPC tối thiểu, smoke hook `VCUT_DESKTOP_SMOKE=1` (probe DOM + chụp màn hình + log JSON + tự thoát).
- **Preload an toàn** (`src/preload.ts`): `contextIsolation=true`, `nodeIntegration=false`; contextBridge chỉ expose `window.vcutDesktop` (platform/arch/versions, getInfo, getServices, 4 dialog, onOpenFile/onMenuAction + các method native-file của G4/G5). Không expose fs thô, không expose ipcRenderer thô.
- **Load UI production qua custom scheme `app://vcut/`** (xem §2), dev load Vite `http://127.0.0.1:5173`. Menu native nhãn tiếng Việt (Tệp/Chỉnh sửa/Xem/Cửa sổ/Trợ giúp), accelerator khớp web app; action editor gửi về renderer qua `vcut:menu-action` (web app giữ undo stack/clipboard của nó — xem LIMITS G5).
- **`tsc -p tsconfig.json` = 0 lỗi** (kiểm tra lần cuối cuối phiên; lưu ý §4 — các luồng khác vẫn đang sửa file chung nên con số này chỉ đúng tại thời điểm kiểm tra).
- **Smoke production (Xvfb, `--no-sandbox` vì chạy root): PASS** — `VCUT_SMOKE_RESULT {"bridgeFromRenderer":"ok","hasNativeFileApi":true,"hasPreloadApi":true,"ok":true,"rootChildren":1,"secureContext":true,"textLen":2154,"title":"VCut Studio — Trình dựng video","url":"app://vcut/index.html"}`. `textSample` chứa toolbar editor thật (⏮ ▶ ◀ ⚡ 00:00.0 / 00:00.0, Xuất bản, Mới/Mở/Lưu/Lịch sử, THƯ VIỆN, "Chưa có file nào…") — không phải màn hình chờ. Screenshot đầu tiên (15.658 byte) cho thấy splash thật: logo + "VCut Studio / Đang mở dự án..." + FPS meter.
- **Smoke dev mode (`dev:desktop` + `VCUT_DESKTOP_SMOKE=1`): PASS, exit 0** — Vite sẵn sàng trên 127.0.0.1:5173, Electron load `http://127.0.0.1:5173/`, kết quả probe y hệt production (`ok:true`, textLen 2154), cổng 5173 được dọn sạch sau test.
- **Đóng gói Linux — AppImage THÀNH CÔNG**: `build:desktop` cho ra `release/vcut-studio-0.1.0-x86_64.AppImage` (**128.094.564 byte**, sha256 `af59dcc92471b2e3e89add17fea2d0ba3befdd5ea76a8423f493b1381a45ce4a`). Đã giải nén (`--appimage-extract`) và chạy binary trong gói dưới Xvfb: **smoke PASS** (`ok:true`, textLen 2154, `app://vcut/index.html`, ffmpeg 8.1.2 được phát hiện trong app đóng gói). App này là app thật, không phải web bọc hời hợt.
- **Bridge CORS end-to-end: PASS** — thay đổi 1 dòng ở `server/bridge/src/index.js` (`DESKTOP_ORIGIN_RE = /^app:\/\/vcut$/`, chấp nhận thêm bên cạnh `LOCAL_ORIGIN_RE` loopback-only, không nới gì khác). Kiểm chứng 2 lớp: (1) curl với `Origin: app://vcut` → `Access-Control-Allow-Origin: app://vcut`; (2) fetch từ renderer trong app thật (origin `app://vcut`) tới `http://127.0.0.1:8787/api/health` → `bridgeFromRenderer:"ok"` (bridge chạy thật, health `{"ok":true,"ffmpeg":true}`).

## §2. Quyết định thiết kế (và hệ quả)

- **Production load bằng `app://vcut/` thay vì `loadFile`**: `apps/web/dist/index.html` của Vite dùng asset path tuyệt đối (`/assets/index-*.js`) nên `file://` sẽ vỡ đường dẫn; `app://` (standard + secure privileges, `protocol.ts`, có guard chống path-traversal, MIME map) giữ secure context nên `crypto.subtle`, IndexedDB, localStorage của web app vẫn chạy. Dev load Vite trực tiếp (origin loopback, CORS cũ đã đủ).
- **Hệ quả bắt buộc**: bridge phải chấp nhận origin `app://vcut` — chỉ origin này của đúng tiến trình Electron của app mới tạo ra được; không website nào mạo danh được. Thay đổi duy nhất ở bridge là dòng `DESKTOP_ORIGIN_RE` nói trên.
- **Service worker** của web app chỉ đăng ký ở PROD và có `.catch()` nên không vỡ dưới scheme lạ (đã đọc `main.tsx`).
- **Icon đóng gói**: electron-builder trỏ tới `apps/web/public/icons/icon-512.png` (G3 đổi thành `build/icon.png` — xem §4); PNG không commit lên GitHub, gen lúc build theo mẫu cũ.

## §3. Giới hạn và nợ mở (chưa làm / chưa chứng minh được)

1. **.deb CHƯA build được trên VM này.** `build:desktop` dừng ở bước deb: fpm báo `tar failed (exit code 1)` khi nén `data.tar.xz`. Nguyên nhân đã xác định: `/tmp` trên VM là tmpfs chỉ **512 MB** (còn trống ~505 MB), trong khi fpm staging cần copy `linux-unpacked` (~278 MB) + nén — không đủ chỗ. Đây là giới hạn của máy test, không phải lỗi config. Hướng sửa chưa thử (để G3/G6): chạy build với `TMPDIR` trỏ ra đĩa lớn (vd `~/workspace/.tmp-build`), hoặc tách target deb ra khỏi AppImage. AppImage không bị ảnh hưởng.
2. **Cảnh báo `desktopName` (cosmetic, chưa xử lý dứt điểm)**: electron-builder 26.18.0 vẫn cảnh báo "Set desktopName in package.json and linux.syncDesktopName: true". Đã thử đặt `desktopName` ở root → **schema validation lỗi** ("unknown property 'desktopName'") nên đã gỡ (xem §4). G3 đã thêm `linux.desktop.entry` với `StartupWMClass: studio.vcut.app` — nhiều khả năng đã đủ cho WM_CLASS, nhưng chưa ai kiểm chứng trên desktop Linux thật (chỉ là cảnh báo, không chặn build).
3. **Screenshot `capturePage` dưới Xvfb không ổn định**: lần đầu ra splash thật, các lần sau lúc thì khung đen (5.132 byte), lúc `UnknownVizError` — dù DOM probe luôn chứng minh editor đã render (textLen 2154). Đây là artifact của Xvfb/software GL, không phải lỗi app. Vì vậy smoke check đã tách lỗi chụp khỏi kết quả probe (`screenshotError` riêng, `ok` không phụ thuộc screenshot).
4. **`--no-sandbox` chỉ dùng khi chạy dưới root** (VM test/CI). App đóng gói cho user thường (không root) không dùng flag này. `dev-desktop.mjs` tự thêm flag khi `process.getuid() === 0`; `smoke:desktop` ghi rõ trong script.
5. **`dist/` chứa file test biên dịch**: `native-files.test.js` (và các `*.test.*` khác nếu có) đang được tsc biên dịch vào `dist/` vì tsconfig chưa exclude `*.test.ts`. Vô hại (không được load bởi main) nhưng bẩn — nợ nhỏ, nên thêm `"exclude": ["src/**/*.test.ts"]` vào tsconfig sau khi các luồng ổn định.
6. **Chưa test**: mở file `.vcut` thật bằng double-click / `open-file` (phần G4/G5; wiring renderer thuộc G5); khởi động/tắt bridge, render worker, Python AI services ngay trong app (lifecycle thuộc G4 — hiện app chỉ **probe trạng thái** qua `services.ts`, chưa tự quản lý vòng đời service; muốn render/caption/TTS thì user vẫn phải chạy bridge riêng, trừ khi G4 đã nối xong — xem LIMITS G4); click-test đầy đủ menu native (G6); cài và chạy `.deb` trên máy Linux sạch (chưa có file .deb — xem nợ 1).
7. **GPU encode / decode phần cứng**: không liên quan trực tiếp tới shell, nhưng app desktop chạy trên máy không GPU vẫn dùng software GL của Chromium (raster warning `SharedImage StagingBuffer` đầy stderr dưới Xvfb — ồn, không ảnh hưởng kết quả).

## §4. Va chạm song song với G3/G4/G5 (trung thực — parent merge cần biết)

Trong lúc G1 làm, G3/G4/G5 cùng sửa các file chung `apps/desktop/src/main.ts`, `menu.ts`, `preload.ts`, `package.json`. Hậu quả thực tế:

- `tsc` đỏ nhiều lần do code dở dang của luồng khác (không phải regression của G1); `tsc` vẫn emit JS khi lỗi (không bật `noEmitOnError`) nên smoke test vẫn chạy được trên `dist/` cũ — **phải re-run `tsc` trước mỗi kết luận**.
- **Crash thật đã gặp và đã hết**: `main.ts` gọi `initNativeFileService` trong khi `native-files.ts` (G4) đã refactor bỏ export đó → app crash lúc khởi động ("is not a function") vì `dist/` stale. Đã hết sau khi G4 sửa xong `main.ts` (dùng `LastDirStore` + `registerExportFileIpc`) và G1 re-compile. Bài học: `dist/` stale + song song sửa file = crash giả.
- **3 điểm nối G1 đã sửa giùm (ghi chú trong code, G5 xác nhận lại)**:
  1. `src/crash.ts`: kiểu `Dialog.showMessageBoxSync` không nhận window `null` → đổi sang `BrowserWindow` + guard null ở call site (không có window → mặc định "Thoát").
  2. `src/preload.ts`: thiếu implementation `getPaths` (interface khai báo nhưng object `api` không có) → thêm `ipcRenderer.invoke("desktop:get-paths")`.
  3. `src/main.ts` (`registerIpc`): thêm handler `desktop:get-paths` + import `desktopPaths`.
- **`package.json` bị G3 viết lại giữa chừng** (thêm `author`, `homepage`, `fileAssociations` .vcut, `appImage`/`deb` artifactName, `linux.desktop.entry`, script `package`/`prepackage`; `build:desktop` đổi thành `... && npm run package`, bước copy-web-dist chuyển vào `prepackage.mjs`). G1 đã theo bản mới. Hai sửa của G1 trong file này cần G3 xác nhận lại:
  - `electron` chuyển từ `dependencies` → `devDependencies` (electron-builder **bắt buộc**: "Package electron is only allowed in devDependencies").
  - **Bỏ `desktopName` ở root** (G3 thêm vào; electron-builder 26.18.0 validate lỗi "unknown property"). `executableName` hiện nằm ở `linux.executableName: "vcut-studio"` (bản G3) — cần thiết vì tên package `@repo-1/desktop` sinh ra executableName `@repo-1desktop` chứa `@`, bị builder từ chối.
  - `deb.depends` giờ có thêm `"ffmpeg"` (G3 thêm) — chưa kiểm chứng cài đặt trên máy sạch.

## §5. Bug luồng dev đã tìm và sửa (chi tiết, để khỏi lặp lại)

1. **Vite mặc định chỉ bind `::1`** trên máy này; main process load `http://127.0.0.1:5173` nên không bao giờ tới được. Sửa: `dev-desktop.mjs` spawn Vite với `--host 127.0.0.1` (ghi chú trong code). Không đổi config Vite của web app.
2. **`repoRoot` trong `dev-desktop.mjs` tính thiếu 1 cấp** (2× `..` → ra `apps/`, spawn electron ở `apps/node_modules/.bin/electron` → ENOENT). Sửa thành 3× `..`. (`copy-web-dist.mjs` vốn đã đúng 3 cấp.)
3. **Vite mồ côi**: `killAll()` cũ chỉ kill tiến trình `npm`, còn Vite (cháu của npm) sống tiếp, giữ cổng 5173 và giữ pipe stdout làm treo script gọi. Sửa: spawn với `detached: true` + kill cả process group `process.kill(-pid)`. Đã kiểm chứng: sau test dev, cổng 5173 trống.
4. **Electron dưới root** từ chối chạy không `--no-sandbox` (FATAL `crbug.com/638180`). `dev-desktop.mjs` tự thêm flag khi uid 0 (xem §3.4).

## §6. File G1 đã đổi/thêm (phần G1; các file chung còn có sửa của G3/G4/G5 — xem §4)

- `apps/desktop/package.json` — tạo mới (G1), sau đó G3 viết lại phần build config; G1 sửa: electron → devDependencies, bỏ `desktopName` root.
- `apps/desktop/tsconfig.json` — tạo mới (G1).
- `apps/desktop/src/main.ts` — tạo mới (G1: lifecycle, window, IPC, smoke hook, protocol wiring); G4/G5 sửa thêm (native-files, desktop-ux, export IPC); G1 sửa 1 handler `desktop:get-paths` + smoke probe bridge.
- `apps/desktop/src/preload.ts` — tạo mới (G1: `window.vcutDesktop` tối thiểu); G5 mở rộng (native-file methods, getPaths); G1 thêm implementation `getPaths`.
- `apps/desktop/src/menu.ts` — tạo mới (G1: menu tiếng Việt); G5 viết lại (i18n, `MenuDeps`).
- `apps/desktop/src/protocol.ts` — tạo mới (G1: scheme `app://vcut/`).
- `apps/desktop/src/windowState.ts` — tạo mới (G1).
- `apps/desktop/src/services.ts` — tạo mới (G1: probe bridge/Vite dev).
- `apps/desktop/scripts/dev-desktop.mjs` — tạo mới (G1: Vite + Electron, đã sửa 4 bug §5).
- `apps/desktop/scripts/copy-web-dist.mjs` — tạo mới (G1).
- `apps/desktop/README.md` — tạo mới (G1: cách chạy dev/build/start/smoke, kiến trúc, vì sao `app://`).
- `server/bridge/src/index.js` — **1 dòng** (G1): thêm `DESKTOP_ORIGIN_RE = /^app:\/\/vcut$/` vào CORS allowlist (đã kiểm chứng end-to-end, §1).
- `package.json` (root) — G1 thêm 3 script `dev:desktop`, `build:desktop`, `start:desktop`.
- `docs/PHASE10_G1_ELECTRON_SHELL_LIMITS.md` — file này.

Không thuộc G1 (các luồng khác tạo trong cùng thư mục): `src/about.ts`, `src/crash.ts`, `src/desktop-paths.ts`, `src/desktop-ux.ts`, `src/ffmpeg-check.ts`, `src/file-io.ts`, `src/i18n-desktop.ts`, `src/native-files.ts` (+ test), `src/serviceLifecycle.ts`, `src/services/`, `src/settings.ts`, `src/shortcuts.ts`, `scripts/gen-icon.mjs`, `scripts/prepackage.mjs`, `scripts/copy-services-js.mjs`, `build/icon.png`, `tsconfig.stub.json`.

## §7. Cách chạy lại kiểm chứng

```bash
cd ~/workspace/repo-1/apps/desktop
../../node_modules/.bin/tsc -p tsconfig.json        # expect: 0 lỗi
npm run build:desktop --workspace=@repo-1/desktop   # AppImage ra release/; .deb lỗi trên VM này do /tmp tmpfs 512M (xem §3.1)
VCUT_DESKTOP_SMOKE=1 xvfb-run -a ../../node_modules/.bin/electron --no-sandbox .
# expect: VCUT_SMOKE_RESULT {"ok":true,...,"textLen":2154,...} (cần bridge chạy để có bridgeFromRenderer:"ok")
npm run dev:desktop --workspace=@repo-1/desktop     # Vite :5173 + Electron (VCUT_DESKTOP_SMOKE=1 để tự kiểm tra rồi thoát)
```
