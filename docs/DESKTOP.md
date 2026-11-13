# VCut Studio — Ứng dụng desktop (Electron, Linux)

Tài liệu này mô tả bản desktop thật của VCut Studio (Phase 10): app
Electron chạy web app đã build, quản lý bridge/render/Python AI services
trong cùng một cửa sổ, đóng gói Linux (AppImage + .deb). Bản web chạy
trình duyệt không đổi — xem `docs/USER_GUIDE.md` để dùng editor, và
`INSTALL.md` để cài đặt gói release (web + bridge).

> Trạng thái: Phase 10 đang làm (06/11/2026). Chưa release/tag — release
> gate vẫn giữ: không release cho đến khi sản phẩm ngang hoặc hơn CapCut
> thật. Xem §10 về quyết định auto-update.

## 1. Chạy dev

Yêu cầu: Node.js ≥ 20, npm, Xvfb (cho smoke test), bridge + web dev
server. Không chạy `npm install` ở đây ngoài lần đầu (workspace đã có
`node_modules` ở repo root; Electron 45.2.3 + electron-builder 26.18.0
đã pin trong `apps/desktop/package.json`).

```bash
# Terminal 1 — web dev server (Vite :5173) + bridge (:8787) như bản web.
# Terminal 2 — build desktop rồi chạy Electron ở chế độ dev:
cd apps/desktop
npm run dev:desktop
# Tương đương: npm run build && node scripts/dev-desktop.mjs
# (đặt VCUT_DESKTOP_DEV=1 hoặc cờ --dev → load http://127.0.0.1:5173)
```

Chạy production build cục bộ (không cần Vite):

```bash
cd apps/desktop
npm run start:desktop   # electron . — load app://vcut/index.html
```

Kiểm tra nhanh (smoke test dưới Xvfb, không cần màn hình thật):

```bash
cd apps/desktop
npm run smoke:desktop
# build tsc + copy web/dist → dist-web, rồi chạy Electron với
# VCUT_DESKTOP_SMOKE=1; app tự kiểm tra window.vcutDesktop, #root,
# chụp màn hình, in JSON VCUT_SMOKE_RESULT rồi thoát.
```

Kết quả smoke test 06/11 trên VM này (4 vCPU/8GB, Xvfb — đính chính F10:
bản trước ghi "2vCPU" là sai; theo số đo cùng ngày 06/11 ở RESULTS.md §5,
VM lúc đó đã là 4 vCPU): `ok: true`,
`hasPreloadApi: true`, `hasNativeFileApi: true`, `rootChildren: 1`,
`textLen: 2154`, `secureContext: true`, URL `app://vcut/index.html`.
Lỗi `dbus` trong log là nhiễu môi trường (VM không có system bus), không
phải lỗi app. Chụp màn hình lỗi `UnknownVizError` (giới hạn Xvfb/software
GL đã biết — xem `main.ts`, không chặn kết quả `ok`).

## 2. Build + đóng gói Linux

```bash
cd apps/desktop
npm run build            # tsc → dist/
npm run build:desktop    # build web + build desktop + copy dist-web + electron-builder --linux
```

- Target Linux: **AppImage** + **.deb** (x86_64), `appId: studio.vcut.app`.
- Icon: `apps/web/public/icons/icon-512.png` — icon được gen lúc build,
  **không commit file binary** (xem `apps/desktop/README.md`).
- **Services đi kèm gói (ROUND51-H8):** bridge + render worker + script
  Python (text) + node_modules thu gọn cho bridge + LUT `.cube` được stage
  lúc đóng gói (`scripts/copy-bundled-server.mjs` → `build/bundled-server/`)
  và bundle vào `resources/vcut-server/` (xem `extraResources` trong
  `apps/desktop/package.json`). Bridge chạy bằng launcher
  `resources/vcut-server/bin/vcut-node` — chính binary Electron ở chế độ
  Node (`ELECTRON_RUN_AS_NODE=1` chỉ trong cây bridge, xem
  `src/services/bundledRuntime.ts`). App đóng gói tự start bridge, render
  thật qua bridge, không cần Node.js hệ thống. Python venv + model AI
  CHƯA bundle (xem `docs/PHASE9_ROUND51_H8_SHIP_SERVICES_LIMITS.md` § venv)
  nên caption/TTS/bgremove trong app đóng gói vẫn cần Python hệ thống +
  venv/model, như bản web.
- **Venv Python thu gọn + model tải riêng (ROUND52-I5, opt-in):** venv AI
  thu gọn từ ~1,6G xuống ~0,99G (caption 505M→454M, TTS 898M→307M,
  reframe 236M→228M — đo thật, xem
  `docs/PHASE9_ROUND52_I5_SHIP_VENV_MODELS_LIMITS.md` §2) và bundle được
  vào gói khi set `VCUT_BUNDLE_SLIM_VENV=caption,tts,reframe` lúc đóng gói
  (mặc định TẮT — gói tăng ~1G). Model AI KHÔNG BAO GIỜ bundle (2,8G):
  app lần đầu chạy AI sẽ hỏi user rồi tải model từ nguồn gốc (HF/GitHub
  releases, license MIT/Apache-2.0, verify SHA256) về `userData/models`
  (xem `src/services/modelDownloader.js` + `model-manifest.json`); thiếu
  model thì service AI báo không khả dụng rõ ràng trong services-status
  (entry "models"), app không crash, không treo. Python AI chỉ bật khi
  model đã có. Chi tiết + giới hạn (bgremove chưa có venv, model BiRefNet
  chưa có checksum) xem LIMITS I5.
- Web UI phục vụ qua scheme riêng `app://vcut/` (xem `protocol.ts`) —
  vì sao không `loadFile`: đường dẫn tuyệt đối của Vite build vỡ dưới
  `file://`, và scheme riêng cho secure context để IndexedDB/localStorage
  của web app hoạt động.
- **Quyết định ship (ROUND82-J8, 10/11 — cập nhật § trên):** profile mặc định
  là **`full`** — AppImage bundle bridge + render + cả 4 slim venv
  (caption/tts/reframe/**bgremove**, bgremove đã có venv từ đợt 53 J8:
  707 MB, rembg 2.0.60). AppImage full đo thật **556.967.568 byte**
  (sha256 `43a2d045…57be`); profile `minimal` (không venv) ~148 MB chỉ dùng
  cho máy ít đĩa/CI. Model AI KHÔNG bundle — tổng 4 model đã verify SHA256
  là **3.707.375.022 byte (3,45 GiB)**, tải lần đầu trong app. Script ship
  chuẩn (một lệnh, build → prepackage → AppImage → verify → probe AI →
  smoke → kiểm chứng dọn bridge mồ côi):
  `npm run package:ship` (xem `apps/desktop/scripts/package-ship.mjs`).
  Chi tiết + số đo + giới hạn xem
  `docs/PHASE9_ROUND82_J8_ELECTRON_SHIP_SERVICES_LIMITS.md`.
- File native (`.vcut`) không commit vào repo (xem
  `docs/PHASE10_G5_DESKTOP_UX_LIMITS.md` §6 về quy ước binary).

## 3. Yêu cầu hệ thống (bản desktop)

| Thành phần | Yêu cầu |
|---|---|
| Hệ điều hành | Linux x86_64 (Ubuntu 20.04+ / Debian 11+ / Fedora tương đương) |
| Node.js (dev) | ≥ 20 (chỉ cần khi chạy dev / build; app đóng gói dùng binary Electron làm Node qua launcher `bin/vcut-node`) |
| ffmpeg | bản đầy đủ, có encoder libx264 (render/export) |
| Python | ≥ 3.10 + pip (AI services local: caption/TTS/bgremove) — venv/model AI chưa bundle trong gói, xem §2 |
| RAM | ≥ 8GB khuyến nghị (như bản web) |
| Ổ đĩa | ~1GB (không AI models) / ~5GB (có AI models); AppImage 0.1.0 sau khi bundle services: **147.915.613 byte** (trước: 128.102.744; +19.812.869, +15,5%), .deb 120.231.316 byte (trước: 103.006.396) — xem `docs/PHASE9_ROUND51_H8_SHIP_SERVICES_LIMITS.md` |

Bản desktop tự quản lý vòng đời bridge/render/Python services trong app
(luồng G3) — user không cần chạy `scripts/start.sh` riêng. Từ ROUND51-H8,
app đóng gói tự start bridge từ bundle `resources/vcut-server/` (không
cần bridge chạy tay, không cần Node.js hệ thống); xem
`src/services/bundledRuntime.ts` + `docs/PHASE9_ROUND51_H8_SHIP_SERVICES_LIMITS.md`.

## 4. Kiến trúc

```
apps/web (React editor) ──preload (contextBridge)──► main process (Electron)
        ▲  window.vcutDesktop (duy nhất)              ├─ menu.ts (G5)
        │  contextIsolation, không nodeIntegration,   ├─ file-io.ts (G5)
        │  sandbox=true                                ├─ settings.ts (G5)
        └──────────────────────────────────────────── ├─ crash.ts (G5)
                                                       ├─ native-files.ts (G4)
                                                       ├─ services.ts (G1)
                                                       └─ windowState.ts (G1)
```

Renderer **không bao giờ** thấy `fs` hay `ipcRenderer` thô — mọi thao
tác hệ thống đi qua `window.vcutDesktop` (preload) và `ipcMain.handle`
ở main. Phân công sở hữu (để khỏi sửa nhầm file của nhau):

| File | Chủ | Nội dung |
|---|---|---|
| `apps/desktop/src/main.ts` | G1 (+ G4/G5 nối) | Single instance, BrowserWindow, dialog IPC, lifecycle |
| `menu.ts` | G5 | Menu native, ngôn ngữ, About/Báo lỗi |
| `desktop-ux.ts` | G5 | Điểm nối: file IPC + crash + menu (`wireDesktopUx`) |
| `file-io.ts` | G5 | Đọc/ghi file thật, recent, current path, `desktop:get-paths` |
| `settings.ts` | G5 | `settings.json` (ngôn ngữ, recent, project hiện tại) |
| `crash.ts` | G5 | Ghi log crash, dialog lỗi, theo dõi render-process-gone |
| `about.ts` | G5 | Nội dung About / Phím tắt / Báo lỗi |
| `i18n-desktop.ts`, `shortcuts.ts`, `desktop-paths.ts` | G5 | Nhãn vi/en, bảng phím tắt, đường dẫn userData |
| `native-files.ts` | G4 | Helper nhận diện path, `LastDirStore`, xuất MP4 dạng stream |
| `serviceLifecycle.ts` | G2 (+ H7 đợt 51) | Adapter nối ServiceManager vào main process; dọn mồ côi lúc khởi động |
| `services/serviceManager.js` | G2 (+ H7 đợt 51) | Spawn/tắt bridge, restart, ghi + dọn pidfile lúc start/stop |
| `services/bridgePidfile.js` | H7 (đợt 51) | Pidfile bridge + nhận diện cmdline + kill bridge mồ côi (fail-closed) |
| `services/bundledRuntime.ts` | H8 (đợt 51) | Loader runtime bundle: chọn node (VCUT_NODE → bin/node → launcher `bin/vcut-node` → node hệ thống) + appRoot (bundle `resources/vcut-server/` khi đóng gói, repo khi dev) |
| `scripts/copy-bundled-server.mjs` | H8 (đợt 51) | Stage cây server bundle vào `build/bundled-server/` lúc đóng gói (chạy từ `prepackage.mjs`) |
| `scripts/vcut-node` | H8 (đợt 51) | Launcher sh: chạy binary Electron dạng Node, giới hạn `ELECTRON_RUN_AS_NODE=1` chỉ trong cây bridge |
| `apps/web/src/desktop.ts` | G5 | Cầu nối renderer ↔ menu (menu-action, mở file, ngôn ngữ) |
| `apps/web/src/lib/nativeFiles.ts` | G4 | Import media nhiều file, export native, kéo-thả |
| `apps/web/src/lib/openProjectFlow.ts` | G4 | Đường mở project/bản nén dùng chung (tách từ ProjectMenu) |
| `apps/web/src/i18n/index.ts` | G5 (+ `onLangChange`) | i18n web vi/en, localStorage `vcut-lang` |

## 5. Preload API (`window.vcutDesktop`)

Hợp đồng kênh IPC — đổi tên kênh phải đổi cả hai bên (main + preload):

| Kênh / sự kiện | Hướng | Mô tả |
|---|---|---|
| `desktop:get-info` | renderer → main | Version app/Electron/Chrome/Node, platform, arch |
| `desktop:get-services` | renderer → main | Trạng thái bridge (:8787) + Vite dev (:5173, chỉ dev) |
| `desktop:get-paths` | renderer → main | `userData` / `settings.json` / `logs/main.log` (file-io.ts) |
| `desktop:language-changed` | renderer → main | Web đổi ngôn ngữ → main lưu settings + rebuild menu |
| `desktop:dialog-open-project` | renderer → main | Dialog mở `.vcut` → đường dẫn hoặc null |
| `desktop:dialog-save-project` | renderer → main | Dialog lưu `.vcut` → đường dẫn hoặc null |
| `desktop:dialog-open-media` | renderer → main | Dialog chọn nhiều media → danh sách đường dẫn |
| `desktop:dialog-save-video` | renderer → main | Dialog chọn đích `.mp4` → đường dẫn hoặc null |
| `desktop:read-file` | renderer → main | Đọc thô project/media → `{data, name, size}`; lỗi thì **ném** (preload bắt → `{ok:false, error}`) |
| `desktop:write-project-file` | renderer → main | Ghi JSON project (nguyên tử tmp+rename) → `{ok:true, path}`; lỗi thì ném |
| `desktop:note-project-opened` | renderer → main | Báo project mở xong → main cập nhật recent + current path |
| `desktop:get-current-project-path` | renderer → main | Đường dẫn project hiện tại (RAM, fallback `settings.lastProjectPath`) |
| `desktop:set-current-project-path` | renderer → main | Đặt/xoá đường dẫn project hiện tại |
| `desktop:save-export-file` | renderer → main | Lưu MP4 đã render: main **stream** từ bridge, không chở bytes qua IPC (G4) |
| `vcut:menu-action` | main → renderer | Action menu Chỉnh sửa/Tệp (undo, copy, save…) |
| `vcut:open-file` | main → renderer | Mở file từ menu / recent / double-click / second-instance |
| `vcut:language-changed` | main → renderer | Menu đổi ngôn ngữ → web `setLang` theo |

Giới hạn an toàn: đọc qua IPC tối đa **2 GiB/file** (project + media),
import nhiều media tổng tối đa **4 GiB** (renderer kiểm tra trước);
chỉ chấp nhận đuôi project (`.vcut`/`.vcut.json`/`.json`/`.vcut.zip`) và
media đã biết; ghi project chỉ đuôi project, xuất chỉ `.mp4`.

## 6. Menu

Menu đầy đủ 5 nhóm, nhãn tiếng Việt (fallback tiếng Anh ở Xem > Ngôn
ngữ): **Tệp** (Mới / Mở dự án / Thêm media / Mở gần đây / Lưu / Lưu
thành… / Xuất video… / Thoát), **Chỉnh sửa** (Hoàn tác / Làm lại / Cắt /
Sao chép / Dán / Nhân bản / Xóa / Chọn tất cả), **Xem** (Tải lại / Tải
lại mạnh / DevTools / Zoom / Toàn màn hình / Ngôn ngữ), **Cửa sổ** (Thu
nhỏ / Đóng), **Trợ giúp** (Giới thiệu / Phím tắt / Tài liệu / Báo lỗi /
GitHub). Mọi mục đều gọi chức năng thật — không có mục chết (kiểm chứng
bằng harness, xem §11).

**Sửa lỗi quan trọng (G5):** các mục Chỉnh sửa KHÔNG dùng `role` native
của Electron. Role `undo`/`copy`/… chỉ tác động undo/clipboard của
Chromium — editor dùng undo stack và clipboard riêng trong store nên
role sẽ im lặng hoặc làm sai. Các mục này gửi action về renderer qua
`vcut:menu-action`, renderer gọi đúng hàm store (`apps/web/src/desktop.ts`).

### Kiểm tra xung đột phím tắt (menu desktop vs web app)

| Tổ hợp | Menu desktop | Web app (App.tsx) | Kết luận |
|---|---|---|---|
| Ctrl/Cmd+N | Mới | — (không xử lý) | Menu nhận; web không tranh |
| Ctrl/Cmd+O | Mở dự án | — | Menu nhận; web không tranh |
| Ctrl/Cmd+S | Lưu | Lưu (Ctrl+S) | **Menu nhận, web bỏ qua** (guard `isDesktopMenuShortcut` ở App.tsx) — chạy 1 lần |
| Ctrl/Cmd+Z / Shift+Z | Hoàn tác / Làm lại | Hoàn tác / Làm lại | **Menu nhận, web bỏ qua** — chạy 1 lần |
| Ctrl/Cmd+Y | *(không có trong menu)* | Làm lại | **Web xử lý** — guard KHÔNG chặn Y (xem ghi chú dưới) |
| Ctrl/Cmd+A | Chọn tất cả | Chọn tất cả clip | **Menu nhận, web bỏ qua** — chạy 1 lần |
| Ctrl/Cmd+C/V/D | Sao chép / Dán / Nhân bản | Copy / Paste / Duplicate | **Menu nhận, web bỏ qua** — chạy 1 lần |
| Ctrl/Cmd+X | Cắt (copy + xóa) | — (không có cut riêng) | Menu nhận |
| Ctrl/Cmd+E | Xuất video… | — | Menu nhận (mở panel Xuất) |
| Ctrl/Cmd+Shift+S | Lưu thành… | — | Menu nhận |
| Delete / Backspace | *(không gán accelerator)* | Xóa vùng chọn | **Web xử lý** — menu cố ý không gán để khỏi xóa trùng 2 lần |
| Space / K | — | Phát/dừng | Web xử lý, không tranh |
| J / L | — | Phát ngược / Tua +5s | Web xử lý, không tranh |
| S | — | Cắt clip tại playhead | Web xử lý, không tranh |
| ← / → / Home / End | — | Tua từng frame / Đầu-cuối | Web xử lý, không tranh |
| F | — | Toàn màn hình preview | Web xử lý, không tranh (khác F11) |
| M | — | Thêm marker | Web xử lý, không tranh |
| Esc | — | Đóng modal | Web xử lý, không tranh |
| Ctrl/Cmd+R | Tải lại (role) | — | Role Electron; reload mất state renderer nhưng autosave (IndexedDB) khôi phục |
| F12 | DevTools (role) | — | Role Electron |
| F11 | Toàn màn hình cửa sổ (role) | — | Khác phím F (preview) nên không tranh |
| Ctrl/Cmd+0 / + / - | Zoom reset/in/out (role) | — | Role Electron (zoom toàn cửa sổ) |

Ghi chú Ctrl+Y: bản đầu của guard chặn cả Y, nhưng menu không có
accelerator Ctrl+Y nên Ctrl+Y sẽ **chết hẳn** trong desktop (web bỏ qua,
menu không nhận). Đã sửa 06/11: `MENU_OWNED_KEYS` chỉ gồm các tổ hợp menu
thật sự có (`a/c/d/s/v/z`); Ctrl+Y để web xử lý làm redo như cũ. Quy tắc
chung: **guard chỉ chặn đúng các tổ hợp menu đã nhận** — thêm accelerator
mới vào menu thì phải thêm vào `MENU_OWNED_KEYS` cùng lúc.

## 7. Settings persist (userData, không đụng IndexedDB)

Web app giữ project/autosave trong IndexedDB + `localStorage`
(`vcut-lang`). Desktop giữ **riêng** trong userData (Linux):

| File | Nội dung | Chủ |
|---|---|---|
| `settings.json` | Ngôn ngữ menu (`lang`), project gần đây (tối đa 10), project hiện tại (`lastProjectPath`) | G5 (`settings.ts`) |
| `window-state.json` | Kích thước/vị trí/trạng thái maximize của cửa sổ | G1 (`windowState.ts`) |
| `vcut-last-dirs.json` | Thư mục gần nhất của dialog hệ thống | G4 (`LastDirStore`) |
| `bridge.pid.json` | Pidfile bridge: pid + cổng + appPid + bridgeEntry + thời gian spawn (xem §7.1) | H7 đợt 51 (`bridgePidfile.js`) |
| `electron.pid.json` | Pidfile Electron: appPid + pgid + execPath + appPath + userDataDir + cổng CDP + thời gian start (xem §7.2) | I4 đợt 52 (`electronOrphanCleanup.js`) |
| `logs/main.log` | Log crash main process (xoay khi > 2 MiB → `main.log.1`) | G5 (`crash.ts`) |

Đường dẫn userData theo tên app của Electron:

- Bản đóng gói lẫn chạy dev bằng `electron .` đều dùng
  `~/.config/@repo-1/desktop/` (tên lấy từ `name` trong
  `apps/desktop/package.json` là `@repo-1/desktop`, KHÔNG phải productName
  "VCut Studio") — đã kiểm chứng: AppImage rebuild đợt 51 H7 ghi
  `bridge.pid.json` + `logs/service-manager.log` vào chính thư mục này
  (đính chính ghi chú cũ trong tài liệu này từng ghi `~/.config/VCut
  Studio/` cho bản đóng gói — sai, xem
  `docs/PHASE9_ROUND51_H7_ORPHAN_BRIDGE_LIMITS.md` §5).

Code không hardcode đường dẫn — luôn dùng `app.getPath("userData")`;
About dialog hiển thị đúng đường dẫn của máy đang chạy. Ghi settings
nguyên tử (tmp + rename); file hỏng → dùng default, không crash app.

Đồng bộ ngôn ngữ hai chiều (không vòng lặp): menu đổi →
`vcut:language-changed` → web `setLang` (lưu `vcut-lang`); nút ngôn ngữ
trên TopBar đổi → `onLangChange` → `desktop:language-changed` → main
lưu `settings.json` + rebuild menu. `setLang` early-return khi trùng
ngôn ngữ nên chuỗi dừng sau một vòng.

**Không tự mở lại project khi khởi động** (quyết định có chủ đích):
web autosave/IndexedDB đã khôi phục session; mở file từ
`lastProjectPath` sẽ ghi đè session đó. User mở lại từ Tệp > Mở gần đây.

### 7.1 Pidfile bridge + dọn bridge mồ côi lúc khởi động (đợt 51, H7)

Bridge spawn `detached` (group riêng) nên app bị `kill -9`/crash sẽ để
lại bridge mồ côi giữ cổng + kế thừa socket CDP — xem
`docs/PHASE9_ROUND51_H7_ORPHAN_BRIDGE_LIMITS.md` để biết chi tiết và số
đo. Cơ chế (từ đợt 51):

- Manager ghi `bridge.pid.json` trong userData mỗi lần bridge chạy thành
  công (spawn đầu + restart), ghi nguyên tử (tmp + rename); xoá khi
  `stop()` sạch.
- Mỗi lần `start()`, manager dọn pidfile cũ TRƯỚC khi spawn bridge mới:
  pid chết → xoá pidfile; pid sống nhưng cmdline KHÔNG phải bridge VCut
  → KHÔNG kill (fail-closed), chỉ xoá pidfile sai; pid sống và cmdline
  đúng là bridge VCut (`server/bridge/src/index.js` trong argv) → kill
  cả cây (SIGTERM → SIGKILL), chờ cổng bridge + cổng CDP trống rồi mới
  spawn mới. Kill theo group chỉ khi pid là group leader; nếu không thì
  chỉ kill đúng pid đó.
- **Giới hạn:** `kill -9` thì không handler nào chạy được — dọn dẹp xảy
  ra ở LẦN CHẠY SAU, không phải lúc chết. Lần chạy Electron hiện tại bind
  CDP lúc khởi động, trước khi `main.ts` chạy, nên nếu cổng CDP đang bị
  mồ côi giữ thì lần chạy đó vẫn mất CDP (app vẫn mở bình thường); cổng
  chỉ trống cho lần chạy sau. Harness `verify-desktop.mjs` gọi dọn
  TRƯỚC khi spawn Electron nên không gặp vấn đề này. **SIGTERM không làm
  Electron thoát** — muốn tắt sạch thì đóng cửa sổ (đường `before-quit`
  → `stopLocalServices`), đừng gửi signal.
- Kiểm chứng: unit + tích hợp `bridgePidfile.test.cjs` (`node --test
  apps/desktop/src/services/bridgePidfile.test.cjs`) và smoke thật
  `node scripts/verify-orphan-cleanup.mjs` (kill -9 Electron thật, mở
  lại, xác nhận bridge cũ chết + bind lại CDP được).

### 7.2 Pidfile Electron + dọn renderer/GPU con mồ côi + timeout khởi động thích ứng (đợt 52, I4)

Chi tiết + số đo: `docs/PHASE9_ROUND52_I4_ELECTRON_RELIABILITY_LIMITS.md`.

- **Pidfile Electron:** main ghi `electron.pid.json` trong userData lúc
  khởi động (sau khi giữ single-instance lock), ghi nguyên tử; xoá khi
  thoát sạch. Mỗi lần `start()`, manager dọn con Electron mồ côi của lần
  chạy trước TRƯỚC khi spawn bridge: chỉ kill tiến trình nào đủ TẤT CẢ
  điều kiện — argv[0] là `vcut-studio`/`electron`, có `--type=<...>`
  (con) hoặc đúng appPid đã chết trong pidfile (main), có marker
  `--user-data-dir` khớp ĐÚNG userData của lần chạy cũ, đã mồ côi
  (ppid == 1 hoặc cha chết), không nằm trong cây tiến trình hiện tại,
  không phải bridge VCut. Kill từng pid (SIGTERM → 5 s → SIGKILL),
  KHÔNG kill theo process group (pgid có thể là group của shell/launcher).
  Quét tối đa 3 lượt (con của zygote chỉ thành mồ côi sau khi zygote
  chết). Holder socket CDP lạ (không phải con VCut) chỉ được báo, không
  bao giờ bị kill. Windows/macOS: chưa triển khai (fail-closed, no-op).
- **Đính chính H7:** renderer/GPU con KHÔNG giữ socket CDP — đo thật:
  sau kill -9, socket CDP chỉ còn bridge giữ (bridge spawn render/python
  giữ fd kế thừa). Dọn bridge (group kill) đã giải phóng socket; dọn con
  Chromium vẫn cần (mồ côi ăn tài nguyên) nhưng không phải đường chính
  giải phóng CDP. Lưu ý parser: con Chromium giữ cmdline nối bằng khoảng
  trắng (1 byte NUL cuối), không tách bằng NUL như process thường.
- **Timeout khởi động thích ứng theo tải:** thay 30 s cứng bằng
  `30 s × min(loadavg/CPU, 4)`, trần 120 s (máy yên vẫn đúng 30 s);
  timeout từng health check nới theo tải (tối đa 8 s); hết giờ mà health
  check gần nhất đã chạm được bridge thì gia hạn thêm 30 s một lần duy
  nhất. `stop()` gọi trong lúc `start()` đang bay sẽ huỷ start (không
  để bridge mồ côi) và chờ start huỷ xong tối đa 30 s.
- **Cache health:** `GET /api/health` không còn spawn `ffmpeg -version`
  mỗi request — kết quả lần đầu được cache trong vòng đời process
  (ffmpeg không đổi khi bridge đang chạy). Đo thật: SEQ median dưới tải
  nặng 1007 ms → 19 ms (~53×), CONC 10 median 1521 ms → 97 ms (~16×).
- **Giới hạn:** Electron bind CDP trước khi `main.ts` chạy nên lần chạy
  dọn tự nó vẫn mất CDP (chỉ trống cho lần chạy sau); harness dọn TRƯỚC
  khi spawn thì lần chạy đó có CDP. Con Chromium sau kill -9 có lúc tự
  thoát trong <1 s, có lúc linger ≥7 s — dọn có tác dụng ở trường hợp
  linger (smoke kill -9 → mở lại: 32/32, kill thật 3 con gpu/utility/
  renderer).
- Kiểm chứng: `electronOrphanCleanup.test.cjs` 11/11,
  `serviceManager.test.cjs` 10/10, `bridgePidfile.test.cjs` 14/14,
  `bundledRuntime.test.cjs` 10/10, `tsc` 0 lỗi; smoke thật
  `node scripts/verify-electron-orphan-cleanup.mjs` (kill -9 Electron
  thật, dọn, mở lại, thoát sạch).

## 8. Xử lý crash + báo lỗi

- Main process `uncaughtException` → ghi log + dialog lỗi dễ hiểu
  (tiếng Việt/tiếng Anh theo ngôn ngữ menu) với nút Khởi động lại /
  Thoát + đường dẫn log. `unhandledRejection` → chỉ ghi log, không hiện
  dialog (tránh spam).
- Render process chết (`render-process-gone`) → ghi log + dialog Tải
  lại / Thoát.
- Log xoay khi > 2 MiB (`main.log` → `main.log.1`).
- **Không gửi crash report đi đâu**: local-first, không telemetry. User
  tự gửi file log kèm báo lỗi (xem dưới).

**Cách báo lỗi** (Trợ giúp > Báo lỗi, hoặc tự làm):

1. Mở Trợ giúp > Báo lỗi (hoặc Giới thiệu) để xem đường dẫn log +
   settings; nút "Mở thư mục log" / "Sao chép thông tin" có sẵn.
2. Gửi kèm: file `logs/main.log`, file `settings.json`, phiên bản app
   (Giới thiệu > Version), các bước tái hiện.
3. Gửi issue tại <https://github.com/vectornewsai-cmyk/repo-1/issues>.

## 9. About dialog

Trợ giúp > Giới thiệu hiển thị: tên **VCut Studio**, version lấy từ
`package.json` (`app.getVersion()`), license **MIT**, version
Electron/Chrome/Node, link repo + docs + issues, đường dẫn log và
settings. Nút "Sao chép thông tin" copy toàn bộ để dán vào issue.

## 10. Auto-update — QUYẾT ĐỊNH: KHÔNG triển khai

**Không có updater tự động trong Phase 10.** Lý do:

1. **Release gate:** user chốt không release/tag cho đến khi sản phẩm
   ngang hoặc hơn CapCut thật. Updater cần bản release để cập nhật —
   chưa có release thì updater không có gì để tải.
2. **Cần server/releases:** `electron-updater` cần feed cập nhật (GitHub
   Releases hoặc server tự host) + ký số artifact + kênh release
   (stable/beta). Chưa có hạ tầng nào trong số đó.
3. **Local-first:** cập nhật tự động tải code về máy user là bề mặt
   rủi ro (supply-chain) — cần làm cẩn thận, không vội.

Người dùng cập nhật bằng cách tải bản mới (xem `INSTALL.md` §6) cho đến
khi updater được làm. Không có code updater nửa vời nào trong repo.

### Thiết kế updater tương lai (để sau này làm, khi đã release)

- Thư viện: `electron-updater` (đi kèm electron-builder), feed
  **GitHub Releases** (`provider: github`, repo
  `vectornewsai-cmyk/repo-1`).
- Artifact Linux: AppImage (hỗ trợ cập nhật tại chỗ) + `.deb` (cập nhật
  qua package manager của hệ thống, không qua updater).
- Hành vi: kiểm tra khi khởi động + mục Trợ giúp > "Kiểm tra cập nhật";
  tải nền, hỏi user trước khi cài + khởi động lại; **không tự cài lặng**.
- Ký số: ký artifact release bằng khóa của project, updater verify
  chữ ký + checksum trước khi cài.
- Kênh: chỉ `latest` (stable) ban đầu; beta (nếu có) là kênh riêng,
  opt-in trong Settings.
- Việc cần làm trước: có release đầu tiên (tag + artifact ký số) và
  quyết định ai giữ khóa ký.

## 11. Kiểm chứng (06/11)

| Kiểm tra | Kết quả |
|---|---|
| `tsc` desktop (`tsc -p apps/desktop/tsconfig.json`) | 0 lỗi |
| `tsc` web (`tsc --noEmit -p apps/web/tsconfig.json`) | 0 lỗi |
| Harness G5 (`/tmp/vcut-g5-test/g5.test.ts`, esbuild + stub Electron, `node --test`) | **9/9 pass**: settings round-trip, i18n đủ key, accelerator không trùng, menu đủ 5 nhóm + mọi mục có click/role + Edit không dùng role, click undo/language/recent thật + recent mất, crash log + xoay, About đủ nội dung, file-io ghi/đọc + từ chối đuôi lạ, `wireDesktopUx` đăng ký đủ kênh |
| Smoke test Electron thật (`npm run smoke:desktop`, Xvfb) | `ok: true`, preload + native file API có, UI render (`textLen: 2154`, secure context) |
| Menu trên Electron thật (check riêng, `Menu.buildFromTemplate` + `setApplicationMenu`) | 5 menu top, **0 mục Edit dùng role** |
| `vite build` web | Pass (qua `copy-web-dist` trong smoke) |
| Độ tin cậy Electron/bridge đợt 52 I4 (07/11) | `serviceManager.test.cjs` **10/10**, `electronOrphanCleanup.test.cjs` **11/11**, `bridgePidfile.test.cjs` **14/14**, `bundledRuntime.test.cjs` **10/10**, `tsc` 0 lỗi; health SEQ median dưới tải nặng 1007 ms → 19 ms (cache `ffmpegVersion`); smoke kill -9 → mở lại **32/32** (kill thật 3 con gpu/utility/renderer mồ côi); chi tiết `docs/PHASE9_ROUND52_I4_ELECTRON_RELIABILITY_LIMITS.md` |
| ROUND51-H8: AppImage bundle services (smoke thật, Xvfb, `APPIMAGE_EXTRACT_AND_RUN=1`) | `ok: true`, `bridgeFromRenderer: "ok"`, bridge bundle tự start (launcher `bin/vcut-node`, cổng 8788 do 8787 bận), `textLen: 2154`, `secureContext: true`; thoát sạch, bridge dừng (SIGTERM group), pidfile gỡ, không mồ côi |
| ROUND51-H8: render thật qua bridge của AppImage (spec demo 720p 10s) | Job `done`, MP4 h264 1280×720 + aac, 10,0s, 2.279.729 byte, QA ok |
| ROUND51-H8: unit loader (`bundledRuntime.test.cjs`, `node --test`) | **10/10 pass**: dev/packaged/bundle-thiếu/bin-node/VCUT_NODE/launcher-thiếu/không chạm env/chmod launcher/cây stage thật |

## 12. Checklist tích hợp (cho luồng khác)

- [ ] `desktop:get-paths` chỉ đăng ký **một lần** ở `file-io.ts` (qua
  `wireDesktopUx`) — `main.ts` KHÔNG đăng ký lại (trùng handler sẽ throw
  lúc khởi động).
- [ ] `setAppMenu(win)` chỉ nhận 1 đối số; `wireDesktopUx(win)` chỉ nhận
  1 đối số, trả về `DesktopUx` có `.settings` + `.rebuildMenu()` (main.ts
  dùng để đồng bộ ngôn ngữ từ TopBar).
- [ ] Thêm accelerator mới vào menu → thêm vào `MENU_OWNED_KEYS`
  (`apps/web/src/desktop.ts`) cùng lúc, nếu không phím đó chết hoặc chạy
  trùng (xem §6, vụ Ctrl+Y).
- [ ] Đổi tên kênh IPC → đổi cả `FILE_CHANNELS` (file-io.ts) + preload.ts
  + `DesktopApiLike` (apps/web/src/desktop.ts).
- [ ] Recent chỉ có một nguồn sự thật: `settings.json` (G5). Đừng tạo
  kho recent thứ hai.
- [ ] Không commit file binary (icon/OGG/cube/TTF/PNG) — chỉ commit script
  gen (xem `docs/PHASE10_G5_DESKTOP_UX_LIMITS.md` §6).
