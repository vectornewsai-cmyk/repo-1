# Phase 10 G6 — Kiểm chứng độc lập — LIMITS (giới hạn trung thực)

Ngày: 06/11/2026. Luồng G6 (kiểm chứng độc lập G1–G5). Repo: `~/workspace/repo-1`.
KHÔNG push, KHÔNG tag/release, KHÔNG stage paths, KHÔNG ghi build-loop-log
(parent gộp sau). KHÔNG sửa code production — G6 chỉ thêm harness + tài liệu này.

## 0. Kết luận ngắn

**App Electron là app thật và chạy được.** Harness của G6 chạy lại toàn bộ từ
đầu trên cây cuối cùng (sau khi G1–G5 đều xong): **43/43 check PASS, 0 FAIL**
(lượt chạy 09:27 UTC 06/11, xem §2). Dev Electron lẫn AppImage đóng gói đều
mở cửa sổ editor thật (`app://vcut/index.html`, textLen 2154, DOM `#root`
mount), preload API đầy đủ, fetch bridge từ renderer qua CORS `app://vcut`
thành công, main log không có uncaught exception, không còn process mồ côi.

**Nhưng có 3 điểm đỏ/nợ mà parent phải biết trước khi coi Phase 10 là xong:**

1. **AppImage trên đĩa là bản CŨ (build 09:13), chứa `main.js` cũ** — trong
   `app.asar` của nó KHÔNG có chuỗi `bridgeFromRenderer` (0 lần, trong khi
   `dist/main.js` hiện tại có 4 lần). AppImage chạy được, nhưng không phản
   ánh `main.ts` cuối cùng của G1. **Cần rebuild AppImage + .deb sau khi code
   đóng băng.** (Chi tiết §4.1.)
2. **App KHÔNG tự khởi động bridge/services** — smoke với bridge tắt cho
   `bridgeFromRenderer: "fetch-error:Failed to fetch"` và `:8787` vẫn tắt sau
   khi app chạy. Đây là nợ G2 #1 đã biết (adapter chưa nối vào `main.ts`),
   G6 chứng minh bằng hành vi chạy thật, không chỉ đọc code. Muốn render /
   caption / TTS trong app thì user vẫn phải chạy bridge riêng. (Chi tiết §2,
   §4.4.)
3. **`.deb` đã build xong nhưng CHƯA AI cài thử trên máy sạch** — G6 chỉ kiểm
   tra nội dung gói bằng `dpkg-deb`. Cài thật + mở `.vcut` bằng double-click
   vẫn là nợ mở.

## 1. Phương pháp (chỉ tin số đo G6 tự chạy)

- Harness riêng của G6: `apps/desktop/scripts/verify-desktop.mjs` (Node thuần,
  global fetch + WebSocket CDP, không `npm install`, không dep mới). Chạy lại:
  `node apps/desktop/scripts/verify-desktop.mjs --appimage
  apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage`
  (thoát 0 khi mọi check pass, 1 khi có check fail; ghi JSON ra
  `/tmp/g6-verify-report.json`).
- Harness làm, theo thứ tự: kiểm tra cấu trúc → `tsc --noEmit` apps/desktop →
  `vite build` apps/web → `tsc` emit apps/desktop → `copy-web-dist.mjs` →
  `copy-services-js.mjs` → tự start bridge `:8787` (để probe CORS; bridge này
  do HARNESS start, không tính công cho app) → smoke nội bộ của app
  (`VCUT_DESKTOP_SMOKE=1`, bridge bật) → launch Electron dev dưới Xvfb + CDP
  (DOM, fetch bridge từ renderer, screenshot + đo pixel stddev bằng PIL) →
  launch AppImage dưới Xvfb + CDP (với `APPIMAGE_EXTRACT_AND_RUN=1`,
  `TMPDIR` ra đĩa — xem §4.2) → tắt bridge → smoke với bridge tắt (app có tự
  start services không?) → kiểm tra không còn process Electron mồ côi.
- Ngoài harness, G6 chạy lại độc lập 6 test suite (G2/G4/G5 + 3 suite web của
  G4) và 1 script IPC riêng (`/tmp/g6-ipc-check.mjs`, gọi thật 3 kênh IPC từ
  renderer), đọc `.desktop` + MIME XML từ AppImage giải nén và từ `.deb`
  (`dpkg-deb`), và xem trực tiếp 1 screenshot AppImage.
- Môi trường đo: VM 4 vCPU / 7 GB RAM, không GPU, root + Xvfb, Node v24.22.1,
  npm 10.9.4, Electron 45.2.3, electron-builder 26.18.0, ffmpeg 8.1.2,
  Python 3.12.3 + PIL 10.2.0. Screenshot dưới Xvfb/software GL KHÔNG ổn định
  (lúc đen 5.132 byte, lúc có nội dung 183.100 byte — G1 §3.3 đúng); G6 dùng
  DOM probe làm tín hiệu chính, screenshot chỉ là bằng chứng phụ, và đã xem
  trực tiếp 1 ảnh AppImage: dialog onboarding "Chào mừng tới VCut Studio"
  tiếng Việt phủ trên editor thật (timeline dưới, FPS meter góc phải).
- Lưu ý về thời điểm: G1–G5 sửa file chung song song; mọi số đo dưới đây là
  trên cây cuối cùng lúc 09:27 UTC 06/11 (sau khi cả 5 file LIMITS đã lên đĩa).
  Số đo G6 chạy trước đó trong phiên (trước khi G1 xong) đã được chạy LẠI hết
  ở lượt cuối này.

## 2. Kết quả harness G6 (43/43 PASS, 0 FAIL — lượt 09:27 UTC)

| Nhóm | Kết quả G6 tự đo |
|---|---|
| Cấu trúc | `package.json` có main `dist/main.js`; preload `src/preload.ts`; electron 45.2.3 (devDependencies); electron-builder config trong `package.json` |
| `tsc apps/desktop --noEmit` | **0 lỗi** |
| `vite build` apps/web | **pass** (chỉ warning chunk > 500 kB, đã có từ trước) |
| `tsc` emit + copy | pass; `dist/main.js` mới; `copy-web-dist` 6 mục; `copy-services-js` 2 file; `dist/services/serviceManager.js` có mặt |
| Smoke, bridge BẬT | `VCUT_SMOKE_RESULT {"bridgeFromRenderer":"ok","hasNativeFileApi":true,"hasPreloadApi":true,"ok":true,"rootChildren":1,"secureContext":true,"textLen":2154,"title":"VCut Studio — Trình dựng video","url":"app://vcut/index.html"}` — khớp từng field với claim G1 §1 |
| Dev Electron dưới Xvfb (CDP) | process sống; page target `app://vcut/index.html`; DOM mount (`rootChildren: 1`); **fetch từ renderer tới bridge: `{"ok":true,"ffmpeg":true}`** (CORS `app://vcut` chứng minh độc lập, không qua probe nội bộ của app); screenshot 183.100 byte, pixel stddev 21,79 (có nội dung thật); main log 2.733 byte, không uncaught exception; không process mồ côi |
| AppImage dưới Xvfb (CDP) | process sống (pid 16427); page target `app://vcut/index.html`; DOM mount; fetch bridge `{"ok":true,"ffmpeg":true}`; screenshot 183.100 byte, stddev 21,79 — **giống hệt bản dev**; main log 10.925 byte, không uncaught exception; không process mồ côi |
| Smoke, bridge TẮT | UI vẫn load `ok:true`, textLen 2154; `bridgeFromRenderer: "fetch-error:Failed to fetch"`; **`:8787` vẫn tắt sau khi app chạy → app không tự start services** (nợ G2 #1, chứng minh bằng hành vi) |
| Bridge health | `{"ok":true,"ffmpeg":true,"ffmpegVersion":"ffmpeg version 8.1.2 …","runningJobs":0,"queuedJobs":0,"lowDisk":false}` (sau khi dọn `/tmp`; trước đó `lowDisk:true`, xem §4.2) |

Test suite chạy lại độc lập (cây cuối, 06/11):

| Suite | Lệnh G6 | Kết quả |
|---|---|---|
| G2 `serviceManager.test.cjs` | `node --test` | **8/8 pass, 22,3 s** |
| G4 `native-files.test.ts` | esbuild bundle + `node --test` | **8/8 pass, 0,33 s** |
| G5 `g5.test.ts` | esbuild bundle (`--alias:electron=stub`) + `node --test` | **9/9 pass, 0,22 s** |
| Web `projectRepo.test.ts` | esbuild bundle + `node --test` | **10/10 ✓, 0 fail** |
| Web `loadReport.test.ts` | như trên | **10/10 ✓, 0 fail** |
| Web `archiveNested32P4.test.ts` | như trên | **7/7 ✓, 0 fail** |

(Lưu ý: `node --test` báo "1 test / 1 pass" ở cấp file cho 3 suite web; 10/10/7 là
số assertion `✓` bên trong file — G6 đếm trực tiếp từ output.)

IPC gọi thật từ renderer (script riêng, bridge tắt lúc gọi):

| Kênh | Kết quả |
|---|---|
| `desktop:get-paths` | ok, trả đúng `{"logPath":"~/.config/@repo-1/desktop/logs/main.log","settingsPath":"~/.config/@repo-1/desktop/settings.json","userData":"~/.config/@repo-1/desktop"}` |
| `desktop:get-info` | ok, `{"appVersion":"0.1.0","arch":"x64","chrome":"156.0.8078.80","electron":"45.2.3","node":"24.22.2","platform":"linux"}` |
| `desktop:get-services` | ok, `[{"name":"bridge","ok":false,"detail":"fetch failed"}]` — probe thật, báo bridge tắt trung thực |

## 3. Đối chiếu từng claim G1–G5

Ký hiệu: ✅ đã xác minh bằng số đo G6 · ⚠️ đúng một phần / đã lỗi thời ·
❌ sai · ⏳ G6 không đo được (ghi rõ lý do).

### G1 — Electron shell

| Claim | G6 |
|---|---|
| Electron 45.2.3 + electron-builder 26.18.0 pin exact | ✅ devDeps ghi đúng 2 số này; `get-info` live trả electron 45.2.3 |
| `tsc -p tsconfig.json` = 0 lỗi | ✅ G6 chạy lại 0 lỗi (cả `--noEmit` lẫn emit) |
| Smoke production PASS, `bridgeFromRenderer:"ok"`, textLen 2154 | ✅ chạy lại, khớp từng field (§2) |
| Smoke dev mode (`dev:desktop`) PASS | ⏳ G6 KHÔNG chạy `npm run dev:desktop` (chỉ chạy production smoke + launch dev trực tiếp qua CDP). 4 bug §5 của G1 kiểm chứng bằng đọc code: `repoRoot` 3 cấp ✅, Vite `--host 127.0.0.1` (đọc code), kill process group (đọc code), `--no-sandbox` khi uid 0 (đọc code) |
| AppImage build thành công, 128.094.564 byte, sha256 `af59dcc9…` | ⚠️ **sha256 KHỚP** (`af59dcc92471b2e3e89add17fea2d0ba3befdd5ea76a8423f493b1381a45ce4a`) nhưng **size thực tế 128.094.490 byte** — lệch 74 byte so với con số G1 ghi (nhiều khả năng G1 ghi nhầm; cùng sha thì cùng nội dung). Và xem §4.1: AppImage này build từ `main.ts` cũ |
| AppImage smoke PASS (G1 tự chạy) | ✅ G6 chạy lại độc lập: smoke ok:true + CDP launch AppImage ok (DOM + fetch bridge) |
| Bridge CORS end-to-end (1 dòng `DESKTOP_ORIGIN_RE`) | ✅ curl `Origin: app://vcut` → ACAO (đã đo đầu phiên) + renderer fetch ok + smoke `bridgeFromRenderer:"ok"` |
| `.deb` CHƯA build được (fpm `tar failed`, `/tmp` tmpfs 512 MB) | ⚠️ **đúng lúc G1 viết, SAI ở hiện tại** — G3 build lần 2 đã xong, `.deb` đã có trên đĩa (xem G3) |
| Cảnh báo `desktopName` (G1 gỡ vì schema lỗi) | ⚠️ đã lỗi thời: `package.json` hiện tại **CÓ** top-level `desktopName: "studio.vcut.app"` + `linux.syncDesktopName: true` (G3 thêm lại) và build thành công; G6 không thấy warning đó trong lần build của mình |
| Screenshot `capturePage` không ổn định (lúc splash, lúc đen, lúc `UnknownVizError`) | ✅ G6 gặp cả 2 đầu: 5.132-byte đen (09:12) và 183.100-byte có nội dung (09:27) |
| `--no-sandbox` chỉ khi root | ✅ (đọc code `dev-desktop.mjs`; harness chạy root với flag này) |
| `dist/` chứa file test biên dịch (`native-files.test.js`) | ✅ `dist/native-files.test.js` có mặt — tsconfig chưa exclude `*.test.ts` |
| §3.6 chưa test: mở `.vcut` double-click, lifecycle services, click-test menu, cài `.deb` máy sạch | ⏳ vẫn chưa đo (xem §5); riêng lifecycle services G6 đã đo: app KHÔNG start services |
| §4.3 "thêm handler `desktop:get-paths` ở `main.ts` registerIpc" | ⚠️ **vị trí sai, chức năng đúng**: handler thực tế đăng ký ở `file-io.ts:51` (qua `wireDesktopUx`); `main.ts:244` cố tình KHÔNG đăng ký (comment giải thích đăng ký trùng sẽ throw). IPC live test `getPaths()` trả đúng (§2) |
| `src/crash.ts`, `preload.ts getPaths` (3 điểm nối G1 sửa giùm) | ✅ `getPaths` có trong preload + IPC live ok; `crash.ts` chỉ đọc code (chưa click-test crash dialog) |

### G2 — Services lifecycle

| Claim / nợ | G6 |
|---|---|
| `serviceManager.test.cjs` 8/8 | ✅ chạy lại 8/8 |
| Adapter CHƯA nối vào main/preload (nợ #1) | ✅ grep cây cuối: không có `initServiceLifecycle` / `startLocalServices` trong `main.ts` / `preload.ts`; **và** smoke bridge-tắt chứng minh bằng hành vi (§2) |
| `services.ts:12` hardcode `BRIDGE_URL = "http://127.0.0.1:8787"` (nợ #2) | ✅ đúng dòng 12; Web UI vẫn phải dùng `snapshot.bridge.url` thay vì hardcode (chưa sửa) |
| Bridge bind `0.0.0.0` (`app.listen(PORT)` không host, `server/bridge/src/index.js:1736`), cần `BRIDGE_HOST` | ✅ đúng dòng 1736; bridge chỉ đọc `BRIDGE_PORT` env, bỏ qua `--port` argv (đọc code) |
| CORS đã kiểm chứng live | ✅ (§2) |
| bgremove: không có rembg trên system python3 | ✅ `python3 -c "import rembg"` → ModuleNotFoundError |
| Log rotate 10 MB nhưng log cũ không bao giờ bị xoá | ⏳ chỉ đọc code, chưa đo hành vi (cần chạy lâu + nhiều log) |
| Đóng gói phải quyết định cách ship node + Python venvs (~1,6 GB) + model AI | ⏳ G6 không đo dung lượng venv; `build.files` hiện tại chỉ gồm `dist/**/*`, `dist-web/**/*`, `package.json` — tức gói hiện tại KHÔNG chứa server/venv (phù hợp với §7 G3) |

### G3 — Đóng gói Linux

| Claim / nợ | G6 |
|---|---|
| Config electron-builder hoàn thiện (appId, fileAssociations `.vcut`, deb depends `ffmpeg`, executableName, desktop.entry, syncDesktopName, icon `build/icon.png`) | ✅ đọc `package.json` hiện tại khớp hết; electron đã ở devDependencies |
| Icon gen lúc build: 512x512 RGBA, 3954 byte | ✅ `build/icon.png` đúng 512x512 RGBA, 3954 byte |
| ffmpeg hệ thống + `ffmpeg-check.ts` + IPC `desktop:ffmpeg-status` | ✅ module tồn tại, IPC đăng ký ở `main.ts`, log app ghi `ffmpeg version 8.1.2`; dialog thiếu-ffmpeg chưa kích hoạt thử (ffmpeg có sẵn) |
| `.desktop` + MIME `.vcut` đúng | ✅ đọc từ AppImage giải nén VÀ từ `.deb`: `Name=VCut Studio`, `Exec=AppRun --no-sandbox %U` (AppImage) / `Exec="/opt/VCut Studio/vcut-studio" %U` (deb), `StartupWMClass=studio.vcut.app`, `MimeType=application/x-vcut-project;` đúng 1 lần, `Categories=AudioVideo;`; MIME XML có `<glob pattern="*.vcut"/>` (comment AppImage: "VCut Studio document", .deb: "VCut Studio project file") |
| AppImage + `.deb` build thành công (snapshot: 128.086.257 / 103.000.488 byte) | ✅ **bản live trên đĩa**: AppImage 128.094.490 byte (sha khớp G1), `.deb` **102.998.060 byte** — khác số snapshot của G3 là bình thường (build khác nhau); `.deb`: `dpkg-deb -I` → Package `vcut-studio` 0.1.0 amd64, Depends `ffmpeg, libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6, xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0`, Installed-Size 283655 KB; nội dung có `/opt/VCut Studio/vcut-studio`, `resources/app.asar` 3.331.102 byte, `.desktop`, mime XML, icon 512 (3954 byte) |
| Build live lần 1: AppImage xong, `.deb` FAIL `ENOSPC` + `desktopName` bị ghi đè mất | ✅ phù hợp bằng chứng: `desktopName` hiện đã khôi phục, `.deb` build lần 2 đã xong |
| `copy-web-dist.mjs` sai repoRoot (2 cấp → 3 cấp), G3 sửa 1 dòng | ✅ hiện cả 2 file đều 3 cấp |
| `dev-desktop.mjs` dòng 14 cùng lỗi, G3 KHÔNG sửa | ⚠️ đã lỗi thời: file hiện đúng 3 cấp (G1 đã sửa, xem G1 §5.2) — trạng thái cuối ĐÚNG |
| arm64 / Windows / macOS chưa làm | ⏳ đúng phạm vi; G6 không thử build |
| AppImage cần libfuse2 lúc chạy; VM này không có nên phải `APPIMAGE_EXTRACT_AND_RUN=1` | ✅ VM không có libfuse2 (G6 dùng flag này mọi lần chạy AppImage); G6 chưa thử chạy AppImage không có flag để xem lỗi libfuse trực tiếp |
| Services trong app đóng gói: main KHÔNG spawn, `extraResources` trống | ✅ smoke bridge-tắt chứng minh (§2) |
| Chưa thử cài `.deb` thật lên máy sạch; chưa có `desktop-file-validate` | ⏳ đúng, G6 cũng chỉ kiểm tra nội dung gói, không cài thử |

### G4 — Native files

| Claim / nợ | G6 |
|---|---|
| `native-files.test.ts` 8/8 | ✅ chạy lại 8/8 |
| Web suite projectRepo 10/10, loadReport 10/10, archiveNested32P4 7/7 | ✅ chạy lại lượt cuối: 10 ✓ / 10 ✓ / 7 ✓, 0 fail |
| Symbol đã xoá chỉ còn "1 dòng comment lịch sử" | ⚠️ **thực tế 2 dòng**: `native-files.ts:19` và `file-io.ts:28` — cả 2 đều chỉ là comment, không ảnh hưởng |
| `desktop:get-paths` ở main.ts chỉ là comment | ✅ đúng (comment giải thích không đăng ký ở đó; handler ở `file-io.ts`) |
| `noteProjectOpened` gọi ở 3 chỗ | ✅ `desktop.ts:147`, `components/project/ProjectMenu.tsx:134`, `lib/nativeFiles.ts:172` |
| `initNativeDrop()` nối ở `App.tsx:288` | ✅ đúng dòng 288 |
| Export panel chưa nối native export; menu "Thêm media" chưa nối `importMediaNative`; 2 flow mở project trùng (`openProjectFlow.ts` vs `desktop.ts`); 2 SettingsStore; tên mặc định `.vcut.json` (G5) vs `.vcut` (G4) | ⏳ G6 không click-test các flow này; các nợ vẫn đứng nguyên theo mô tả G4 (chỉ xác nhận bằng đọc code ở đầu phiên, không đo lại lượt cuối) |
| Dialogs / second-instance / drag-drop / pendingOpenFile chưa test trên app thật | ⏳ đúng; riêng **second-instance G6 đã gặp ngoài ý muốn** (§4.3): lock hoạt động (instance thứ 2 thoát với log "Đã có instance khác đang chạy"), nhưng đó không phải test có chủ đích |

### G5 — Desktop UX

| Claim / nợ | G6 |
|---|---|
| `g5.test.ts` 9/9 | ✅ chạy lại 9/9 |
| Menu Edit dùng click/`sendAction`, không `role` (role chỉ ở File exit `quit`, View reload/forceReload/devTools/zoom/fullscreen, Window minimize/close) | ✅ đọc code đầu phiên, khớp |
| userData thật `~/.config/@repo-1/desktop/` (`settings.json` lang vi, `window-state.json`) | ✅ file tồn tại; IPC `get-paths` live trả đúng đường dẫn |
| `docs/DESKTOP.md` + mục desktop trong INSTALL.md | ✅ tồn tại |
| Không có code auto-updater | ✅ grep `autoUpdater` rỗng trong `apps/desktop/src/` |
| Crash dialog chưa click-test trên Electron thật; macOS/Windows chưa test; `wireDesktopUx` macOS re-activation; 2 LastDirStore | ⏳ chưa đo (vẫn là nợ) |
| Không tự mở lại project cuối khi khởi động (chủ đích); export từ menu chỉ mở Export panel (download trình duyệt, không phải native flow); Ctrl+Y redo chỉ có trên web | ⏳ chưa click-test; ghi theo G5 |

## 4. Phát hiện mới của G6 (không có trong LIMITS G1–G5)

### 4.1 AppImage trên đĩa là bản cũ — cần rebuild sau khi code đóng băng (ĐỎ, quan trọng nhất)

- `release/vcut-studio-0.1.0-x86_64.AppImage` build lúc 09:13, nhưng G1 sửa
  `main.ts` lần cuối sau đó (thêm probe `bridgeFromRenderer`). Bằng chứng:
  `grep -c bridgeFromRenderer` trên `app.asar` trong AppImage = **0**, trong
  khi `dist/main.js` hiện tại = **4**. `.deb` cùng build 09:13, `app.asar`
  3.331.102 byte giống hệt AppImage — cũng cũ theo.
- Hệ quả: AppImage chạy tốt nhưng **không phản ánh code cuối cùng**; mọi sửa
  `main.ts`/`preload.ts` sau 09:13 đều chưa có trong gói. **Trước khi đưa gói
  cho user test, chạy lại `npm run package:linux` (hoặc ít nhất
  `build:desktop`) trên cây đã đóng băng, rồi kiểm chứng lại bằng harness G6.**

### 4.2 `/tmp` tmpfs 512 MB đầy → AppImage exit 127 (lỗi môi trường, đã chứng minh)

- Lần chạy harness đầu, AppImage thoát code **127** sau khi in xong danh sách
  giải nén, không một dòng log Electron nào. Nguyên nhân: `/tmp` đã đầy 100%
  (2 thư mục giải nén cũ 278 MB + 228 MB), AppImage cần ~280 MB để giải nén
  nên không chạy được. Sau khi dọn `/tmp` (505 MB trống), cùng file AppImage
  chạy ngon (smoke ok:true + CDP ok).
- Harness G6 đã sửa để không phụ thuộc chuyện này: AppImage launch dùng
  `TMPDIR` ra đĩa (`~/workspace/.tmp-g6`) + có preflight check dung lượng
  `/tmp`. Nhưng **người build sau này cần nhớ**: trên VM này, luôn dọn `/tmp`
  hoặc đặt `TMPDIR` ra đĩa trước khi build/chạy AppImage (G3 đã gặp cùng vấn
  đề với fpm `.deb`).
- Kèm theo: bridge `/api/health` từng báo `lowDisk:true` (chỉ 0,22 GB trống)
  khi `/tmp` đầy; sau khi dọn báo `lowDisk:false` (0,49 GB).

### 4.3 Lỗi harness của chính G6: kill process Electron mồ côi (đã sửa, ghi để khỏi lặp)

- Lần chạy harness đầu, sau khi kill Electron dev, process thật (pid 15299)
  vẫn sống và giữ single-instance lock → 4 check sau đó FAIL giả (AppImage
  exit 127 lần 2 + smoke-down báo "Đã có instance khác đang chạy — thoát").
  Nguyên nhân: harness kill `.bin/electron` (CLI wrapper), mà wrapper spawn
  `dist/electron` làm process con — kill wrapper không giết được con.
- Đã sửa trong harness: dùng thẳng `node_modules/electron/dist/electron` +
  spawn `detached: true` + kill cả process group (`process.kill(-pid)`), kèm
  check "không còn process mồ côi" sau mỗi lần launch và cuối harness. Lượt
  chạy cuối 43/43 đã sạch (không orphan).
- Bài học phụ: **single-instance lock hoạt động đúng** — instance thứ 2 thoát
  ngay với log tiếng Việt "Đã có instance khác đang chạy — thoát." (quan sát
  ngoài ý muốn, không phải test có chủ đích).

### 4.4 `.desktop` của AppImage ép `--no-sandbox` cho mọi user

- File `.desktop` trong AppImage: `Exec=AppRun --no-sandbox %U`. Đây là mặc
  định của electron-builder cho AppImage (chrome-sandbox setuid hay trục trặc
  trong AppImage), không phải G3 cấu hình tay — G6 chưa xác minh nguyên nhân
  bằng tài liệu electron-builder, chỉ ghi nhận hệ quả: user mở app từ menu
  sẽ luôn chạy không sandbox. Nếu parent muốn sandbox bật cho user thường,
  cần kiểm chứng riêng (không phải việc G6).

### 4.5 Các lệch nhỏ khác (ghi cho đúng sổ sách)

- G1 ghi AppImage 128.094.564 byte — thực tế 128.094.490 byte (sha256 khớp,
  nhiều khả năng ghi nhầm số).
- G3 ghi kích thước snapshot (AppImage 128.086.257, `.deb` 103.000.488) —
  bản live khác số đó (128.094.490 / 102.998.060) là bình thường vì build
  khác thời điểm; đừng so 2 bộ số này với nhau.
- G4 nói symbol đã xoá còn "1 dòng comment" — thực tế 2 dòng (xem §3 G4).
- G3 nói `dev-desktop.mjs` chưa sửa — thực tế G1 đã sửa rồi (xem §3 G3).

## 5. Chưa đo được (trung thực — G6 không claim những thứ này)

- **Click-test thật**: menu native từng mục, dialog mở/lưu file, export chọn
  đích `.mp4` rồi render, "Thêm media" từ menu, mở `.vcut` bằng double-click
  / `open-file`, kéo-thả file vào cửa sổ, crash dialog, Settings window.
- **Cài `.deb` trên máy Ubuntu sạch** (cần sudo + máy sạch): chỉ kiểm tra nội
  dung gói, chưa cài, chưa chạy thử sau cài, chưa thử mở `.vcut` từ file
  manager sau khi cài.
- **AppImage không dùng `APPIMAGE_EXTRACT_AND_RUN`** trên máy có libfuse2
  (VM này không có libfuse2 nên mọi lần chạy AppImage đều dùng flag này).
- **`.desktop` chưa validate bằng `desktop-file-validate` / `appstreamcli`**
  (không có tool trên VM).
- **macOS / Windows / arm64**: không build, không chạy (ngoài phạm vi Linux
  x64 đợt này).
- **Dev mode `npm run dev:desktop`** (Vite :5173 + Electron): chưa chạy
  end-to-end; chỉ launch dev trực tiếp + đọc code các bug fix.
- **Hiệu năng / render thật trong app**: chưa đo FPS preview, chưa render
  export thật từ app đóng gói (bridge tắt trong smoke; bridge bật chỉ probe
  health). Render worker / Python AI services trong app đóng gói chưa tồn tại
  (xem §6).
- **Độ bền**: chạy app lâu, mở/đóng nhiều project, log rotate, second-instance
  với file chờ mở (`pendingOpenFile`) — chưa đo.

## 6. Nợ mở tổng hợp (G1–G5 + G6, xếp theo mức chặn việc dùng thật)

1. **Rebuild AppImage + `.deb` sau khi code đóng băng** (G6 §4.1) — gói hiện
   tại cũ hơn code.
2. **Nối service lifecycle vào app (G2 #1)**: `serviceManager` đã có
   (8/8 test) nhưng chưa nối vào `main.ts`; app hiện chỉ probe bridge, không
   start bridge/render/Python AI. Không có bước này thì app đóng gói không
   render/caption/TTS được trừ khi user tự chạy bridge riêng.
3. **Quyết định đóng gói services**: `build.files` hiện không chứa server,
   venv Python (~1,6 GB theo G2) hay model AI; bridge bind `0.0.0.0` cần
   `BRIDGE_HOST`; Web UI hardcode `:8787` cần đổi sang `snapshot.bridge.url`.
   (G2 #2, G3 §7.)
4. **Nối export native + "Thêm media" + thống nhất flow mở project**
   (G4): export panel chưa nối `desktop:save-export-file`; 2 flow mở project
   trùng nhau; tên mặc định `.vcut.json` vs `.vcut` chưa thống nhất; 2
   SettingsStore / 2 LastDirStore trong RAM.
5. **Cài `.deb` thử trên máy sạch + mở `.vcut` bằng double-click + click-test
   menu/dialog đầy đủ** (G6 §5).
6. **Nhỏ**: tsconfig exclude `*.test.ts` khỏi `dist/` (G1 §3.5); `.desktop`
   validate bằng tool chuyên dụng; icon `.deb` nhiều kích cỡ; log cũ không
   bao giờ bị xoá (G2); `desktopName` + `electron` devDeps cần kiểm tra lại
   mỗi khi có luồng khác sửa `package.json` (đã từng bị ghi đè mất lúc 09:06).
7. **Không làm trong đợt này (giữ nguyên quyết định)**: auto-updater (G5 chủ
   đích không làm), arm64, Windows/macOS, snap/flatpak, rpm, ffmpeg-static
   bundle (G3 chọn ffmpeg hệ thống).

## 7. File G6 đã đổi/thêm (chỉ harness + tài liệu này, KHÔNG sửa production)

- `apps/desktop/scripts/verify-desktop.mjs` (mới) — harness kiểm chứng độc
  lập, chạy lại được (xem §1). Trong lúc làm G6 đã sửa 2 bug của chính
  harness này: resolve đường dẫn AppImage tương đối → tuyệt đối; kill process
  group thay vì kill CLI wrapper (xem §4.3).
- `docs/PHASE10_G6_VERIFICATION_LIMITS.md` (mới) — tài liệu này.
- KHÔNG đổi: mọi file `apps/desktop/src/*`, `apps/web/src/*`,
  `server/bridge/src/index.js`, `package.json` — G6 không sửa code của luồng
  khác. Các file build (`dist/`, `dist-web/`, `release/`) chỉ được tái tạo
  bởi lệnh build trong lúc kiểm chứng (tsc/vite/copy), không sửa tay.
- File tạm của G6 (không commit, chỉ để truy vết): `/tmp/g6-verify-report.json`
  (JSON đầy đủ 43 check), `/tmp/g6-final-run.log`, `/tmp/g6-dev.log`,
  `/tmp/g6-appimage.log`, `/tmp/g6-smoke-up.log`, `/tmp/g6-smoke-down.log`,
  `/tmp/g6-electron-shot.png`, `/tmp/g6-appimage-shot.png` (183.100 byte,
  đã xem trực tiếp: onboarding + editor thật).

## 8. Cách chạy lại kiểm chứng

```bash
cd ~/workspace/repo-1
# Dọn /tmp trước (tmpfs 512 MB — AppImage cần ~280 MB để giải nén):
df -h /tmp
node apps/desktop/scripts/verify-desktop.mjs \
  --appimage /home/hatch/workspace/repo-1/apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage
# expect: SUMMARY: 43 passed, 0 failed (số check có thể tăng nếu harness thêm check)
# Bỏ --appimage để chỉ kiểm chứng bản dev (không chạy AppImage).

# Chạy lại từng suite (độc lập):
cd apps/desktop/src/services && node --test serviceManager.test.cjs   # expect 8/8
cd ~/workspace/repo-1
node_modules/.bin/esbuild apps/desktop/src/native-files.test.ts --bundle --platform=node --format=esm --outfile=/tmp/g6-native-files.test.mjs --log-level=error && node --test /tmp/g6-native-files.test.mjs  # expect 8/8
```
