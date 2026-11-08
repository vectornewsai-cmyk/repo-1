# Phase 10 — Electron app thật + Linux: LIMITS tổng hợp (parent merge)

Ngày: 06/11/2026. Lệnh user 15:37: "build electron app thật sự đấy nhé, và linux nữa đấy nhé".
6 luồng G1–G6 xong, G6 kiểm chứng độc lập 43/43, parent gộp + kiểm chứng lại
toàn bộ. KHÔNG push, KHÔNG release/tag (release gate vẫn giữ). Batch stage
chờ user push sau từ main chat.

## 1. Làm được gì (đã kiểm chứng tận tay bởi parent)

- **Electron shell thật** (`apps/desktop`): main process TS, single instance,
  window-state persist, preload contextIsolation + sandbox, menu tiếng Việt,
  production load qua custom scheme `app://vcut/` (giữ secure context cho
  IndexedDB/crypto — `file://` vỡ vì Vite dùng asset path tuyệt đối),
  dev load Vite :5173. `tsc` desktop 0 lỗi, `tsc` web 0 lỗi, `vite build` pass.
- **Smoke production (Xvfb)**: `ok:true`, editor thật render
  (textLen 2566, toolbar + timeline + thư viện), preload API + native file API
  có, screenshot thật. Dev smoke cũng pass.
- **Services lifecycle nối vào app (G2, parent gộp)**: app tự khởi động bridge
  khi mở, tắt sạch (kill process group, không mồ côi) khi thoát. Kiểm chứng:
  smoke với bridge tắt → app tự start bridge, `bridgeFromRenderer:"ok"`;
  sau khi app thoát, không còn tiến trình bridge nào.
- **Bridge URL động (nợ G2-a, parent đóng)**: web UI dùng live binding
  `lib/bridgeUrl.ts` — 9 component + `webglLut.ts` trước đây hardcode 8787,
  giờ lấy URL thật qua preload `getBridgeUrl()` + event `vcut:services-status`.
  Kiểm chứng E2E (8787 bị chiếm bởi dummy 404): manager chọn 8788,
  `bridgeFromRenderer:"ok"`, `bridgeUrl:"http://127.0.0.1:8788"`.
  Trong lúc gộp phát hiện + sửa 1 race: `get-bridge-url` trả fallback 8787
  trong lúc manager còn đang chọn cổng → handler giờ chờ manager settle
  (tối đa 10s) mới trả; smoke probe cũng chờ tương tự.
- **Đóng gói Linux**: AppImage + .deb qua electron-builder (xem §2 số đo mới
  sau rebuild). `.desktop` + MIME `.vcut` đúng cả 2 gói, icon sinh lúc build
  (không commit PNG binary), ffmpeg dùng hệ thống (không bundle ffmpeg-static,
  tránh nghĩa vụ GPL; `.deb` kéo `ffmpeg` qua depends; thiếu thì dialog hướng
  dẫn cài, app vẫn mở).
- **File native**: dialog hệ thống mở/lưu `.vcut`, recent 1 nguồn duy nhất
  (`settings.json`), nhớ thư mục dialog, import media nhiều file (chặn 2 GiB/file),
  chọn đích MP4 trước khi render + stream MP4 từ bridge ra đích (không chở
  bytes qua IPC), single-instance + argv mở file, kéo-thả từ file manager.
- **Desktop UX + docs**: 5 nhóm menu (vi/en), About, settings persist ở userData,
  crash dialog + log xoay (không telemetry), auto-update KHÔNG triển khai
  (release gate; thiết kế tương lai trong `docs/DESKTOP.md` §10),
  `docs/DESKTOP.md` + đoạn desktop trong `INSTALL.md`.
- **Bridge CORS**: `app://vcut` được cấp ACAO; origin loopback (:5173) vẫn 200
  — kiểm chứng bằng curl thật, không vỡ web dev.
- **Harness kiểm chứng G6** (`apps/desktop/scripts/verify-desktop.mjs`, 43 check):
  chạy lại trên cây đã gộp — xem §4.

## 2. Gói Linux (rebuild sau khi đóng băng code — parent, 09:42–09:45 06/11)

- AppImage `vcut-studio-0.1.0-x86_64.AppImage`: **128.102.744 byte**,
  sha256 `6e6fd2fbdb733c244cccd98d1007322abcc4475627a5767c45238b3677be9fa4`.
- `.deb` `vcut-studio_0.1.0_amd64.deb`: **103.006.396 byte**,
  sha256 `266d9823f4f31b7ea45023332d4b4d0b8c83432617a4697428b497b072d6aa11`.
- Tươi: app.asar trong AppImage chứa code gộp (`get-bridge-url` ×3,
  `bridgeFromRenderer` ×4, `vcut:services-status` ×12 — bản cũ 09:13 có 0 lần
  `bridgeFromRenderer`). `.deb`: app.asar 3.363.595 byte,
  `studio.vcut.app.desktop` đúng, Package vcut-studio 0.1.0 amd64,
  Depends có `ffmpeg`, Installed-Size 283686 KB.
- AppImage chạy dưới Xvfb: smoke `ok:true`, editor thật (harness G6, §4).
- **Cài `.deb` thử trên VM này (parent)**: `dpkg -i` giải nén đúng nhưng để
  package "unconfigured" vì thiếu 5 lib hệ thống (libgtk-3-0, libnotify4,
  libxtst6, libatspi2.0-0, libsecret-1-0); apt trên VM tối giản này KHÔNG có
  candidate cho 3/5 lib nên không kéo được, `apt-get install -f` gỡ package.
  Đây là giới hạn của VM (không có desktop environment), KHÔNG phải lỗi đóng
  gói — Depends khai đúng các lib runtime chuẩn của Electron, máy Ubuntu
  desktop đủ lib sẽ cài bình thường. **Binary đã cài chưa chạy được trên VM
  này** (thiếu .so) — AppImage (tự bundle lib) là đường chạy đã kiểm chứng
  trên VM. Đã `dpkg --purge` dọn sạch sau thử.
- Build lần 1 (G3, 09:13–09:16): AppImage 128.094.490 byte, .deb 102.998.060 byte
  — STALE sau gộp (G6 phát hiện) nên parent đã rebuild.
- Lỗi build đã gặp: fpm `ENOSPC` vì `/tmp` tmpfs 512 MB (stage ~280 MB) —
  dọn `/tmp` + `TMPDIR` ra đĩa thì build được (G3). AppImage chạy kiểu giải nén
  cũng cần `/tmp`/`$TMPDIR` đủ ~300 MB, không thì exit 127 không log (G6).

## 3. Xung đột gộp đã xử lý (parent)

- **Chủ sở hữu lifecycle**: G1 `services.ts` ghi "vòng đời do G4 quản lý" —
  SAI. G2 mới là chủ (`serviceLifecycle.ts` + `src/services/`). Đã sửa comment;
  `desktop:get-services` giờ trả snapshot của manager khi có, fallback probe
  HTTP khi chưa nối. Chỉ còn MỘT manager, không có 2 manager song song.
- **Trùng handler `desktop:get-paths`** (G1 seam fix + file-io G5): đã gỡ bản
  ở main.ts (G4 sửa), chỉ file-io.ts đăng ký.
- **Chữ ký menu/desktop-ux đổi 2 lần giữa G4/G5**: trạng thái cuối ổn định —
  G5 giữ `file-io.ts` + `settings.ts` + `menu.ts` + `desktop-ux.ts`;
  G4 giữ `native-files.ts` (helper + LastDirStore + export stream).
- **`build` script desktop** giờ chạy `tsc && node scripts/copy-services-js.mjs`
  (trước đây dist/services/ thiếu khi chạy/đóng gói vì tsc không copy .js).
- **tsconfig exclude `*.test.ts`**: `dist/` từng chứa `native-files.test.js`
  biên dịch — đã exclude + xoá file cũ, build lại không tái sinh.
- **Race ghi đè `apps/desktop/package.json`** giữa các luồng (mất top-level
  `desktopName` lúc 09:06): đã khôi phục, kiểm tra còn nguyên sau build (G3).
- **Harness G6 sửa 2 kỳ vọng cũ** (parent): textLen assert `=== 2154` →
  `> 300` (số ký tự đổi theo project mẫu); kỳ vọng bridge-down
  `bridgeFromRenderer !== "ok"` → `=== "ok"` (nợ G2 đã đóng, app tự start
  bridge). Không phải regression — xem §4.
- **Sửa trong lúc gộp**: `dev-desktop.mjs` repoRoot đã đúng 3 cấp (G1 sửa,
  claim G3 "chưa sửa" đã lỗi thời); `desktop:get-paths` thực tế ở `file-io.ts:51`
  (G1 LIMITS ghi main.ts — sai vị trí, chức năng đúng).

## 4. Kiểm chứng parent (chạy lại trên cây đã gộp)

- `tsc` desktop 0 lỗi; `tsc` web 0 lỗi; `vite build` pass (6,03s).
- G2 `serviceManager.test.cjs`: 8/8. G4 `native-files.test.ts`: 8/8.
  G5 `g5.test.ts`: 9/9. Web `projectRepo`: 10/10, `loadReport`: 10/10,
  `archiveNested32P4`: 7/7.
- Smoke production (bridge tắt): `ok:true`, `bridgeFromRenderer:"ok"`,
  `bridgeUrl:"http://127.0.0.1:8787"`, app tự start bridge, không mồ côi sau thoát.
- Smoke production (8787 bị dummy 404 chiếm): manager chọn 8788,
  `bridgeFromRenderer:"ok"`, `bridgeUrl:"http://127.0.0.1:8788"`.
- Harness G6 (43 check, đã sửa 2 kỳ vọng cũ — xem §3): **43/43 PASS, 0 FAIL**
  trên cây đã gộp + gói rebuild (chạy 2 lần: lần 1 còn 1 FAIL CDP do cổng 9222
  bị bridge mồ côi từ lần chạy trước chiếm — xem §5; sau khi dọn mồ côi,
  lần 2 đạt 43/43). Không còn tiến trình Electron/bridge mồ côi sau harness.
- CORS: curl `Origin: http://127.0.0.1:5173` → 200; `Origin: app://vcut` →
  `Access-Control-Allow-Origin: app://vcut`; không origin → 200.

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

1. **App đóng gói CHƯA tự chạy đủ services**: `server/bridge` + render + Python
   AI KHÔNG nằm trong gói (`files` chỉ có `dist/`, `dist-web/`, `package.json`;
   `extraResources` trống). Trong app đóng gói, `startLocalServices()` ném lỗi
   "không tìm thấy bridge" → bắt lại, app vẫn mở để xem/sửa project, chỉ báo
   services không khả dụng. Render/caption/TTS/bgremove trong app đóng gói
   CHƯA chạy được — cần 1 đợt riêng quyết định: ship bridge + node binary +
   venv Python (~1,6 GB) + model AI như thế nào (extraResources? tải riêng?).
   Dev (chạy từ repo) thì đầy đủ.
2. **Bridge mồ côi khi app bị kill -9 / crash (phát hiện thật trong đợt gộp)**:
   bridge spawn `detached` (group riêng) nên `kill -9` group Electron không
   giết được bridge; bridge mồ côi còn giữ cổng (8788/8789...) và KẾ THỪA
   socket CDP 9222 của Electron, làm lần chạy dev sau fail "bind() failed:
   Address already in use". Thoát bình thường (đóng cửa sổ / app.quit()) thì
   sạch — before-quit → stopLocalServices kill đúng group, đã kiểm chứng
   nhiều lần không còn mồ côi. SIGTERM KHÔNG làm Electron thoát (đã thử:
   treo đủ 8s grace rồi mới SIGKILL) nên harness không dừng app bằng signal
   được — harness giờ đóng cửa sổ qua CDP (`window.close()`) để app thoát
   theo đường bình thường, kiểm chứng không còn mồ côi sau harness. Nợ mở
   cho đợt sau: pidfile + dọn bridge mồ côi lúc app khởi động (stale-cleanup),
   hoặc manager nhận lại bridge khỏe đã chạy sẵn thay vì spawn thêm.
3. **Bridge bind `0.0.0.0`** (không ép loopback-only nếu không sửa bridge);
   cần `BRIDGE_HOST` nếu muốn khóa loopback (nợ G2/G3).
4. **bgremove không chạy được trên VM này** (system python3 thiếu rembg, không
   có venv) — manager báo `available:false` kèm lý do (G2).
5. **Chưa test**: double-click mở `.vcut` thật, click-test đầy đủ menu/dialog,
   cài `.deb` trên máy sạch (thử trên VM này thì thiếu 5 lib hệ thống, xem §2),
   `dev:desktop` end-to-end (G1 smoke dev pass nhưng chưa click-test),
   macOS/Windows/arm64 (không build được từ Linux; macOS bắt buộc máy Mac),
   validate `.desktop` bằng tool, `desktop-file-validate` không có trên VM.
6. **Nợ nhỏ**: Export panel chưa nối flow export native của G4; menu Thêm media
   chưa dùng `importMediaNative`; chưa có cửa sổ Settings riêng; crash dialog
   chưa click-test thật; multi-window `onRecentChanged` trỏ cửa sổ cũ (đã guard,
   không crash); đuôi mặc định Lưu thành chưa thống nhất (G5 `.vcut.json` vs
   helper G4 `.vcut`); 2 instance `LastDirStore`/`SettingsStore` trong RAM;
   `.desktop` AppImage ép `--no-sandbox` (mặc định electron-builder);
   AppImage cần libfuse2 lúc chạy (Ubuntu 22.04+ không có sẵn).
7. **Số đo hiệu năng desktop**: chưa đo FPS/khởi động lạnh trên máy thật;
   chỉ có smoke/Xvfb trên VM 2vCPU/8GB.
8. **G1 LIMITS §4.3 + G4 LIMITS**: vài chi tiết vị trí/số dòng đã lỗi thời sau
   gộp (xem §3) — số đo chức năng vẫn đúng, chỉ sai chỗ ghi chú.

## 6. File trong batch (stage chờ push)

`apps/desktop` (34 file: src + scripts + package.json + README + tsconfig),
`apps/web/src` (20 file: bridgeUrl.ts mới, desktop.ts, MediaBin, ExportPanel,
7 modal/panel, ProjectMenu, i18n x3, nativeFiles, openProjectFlow, webglLut,
vite-env.d.ts), `server/bridge/src/index.js` (1 dòng CORS `DESKTOP_ORIGIN_RE`),
`package.json` (root, script desktop), `INSTALL.md`, `docs/DESKTOP.md`,
`docs/PHASE10_G1..G6_LIMITS.md`, `docs/PHASE10_LIMITS.md` (file này).
KHÔNG stage: `dist/`, `dist-web/`, `release/` (AppImage/.deb/linux-unpacked),
`node_modules/`, icon PNG (sinh lúc build).
