# VCut Studio — Electron shell (apps/desktop)

App desktop thật cho VCut Studio: cửa sổ Electron chạy UI web đã build
(`apps/web/dist`), nói chuyện với bridge local (`http://127.0.0.1:8787`)
và các service local khác như bản web. Local-first tuyệt đối — không server
ngoài, không tài khoản, không upload.

## Chạy

```bash
# Dev: Vite dev server (:5173) + Electron (load http://127.0.0.1:5173)
npm run dev:desktop --workspace=@repo-1/desktop

# Chạy bản production đã build (load UI từ apps/desktop/dist-web qua app://vcut/)
npm run start:desktop --workspace=@repo-1/desktop

# Build đầy đủ + đóng gói Linux (AppImage + .deb) ra apps/desktop/release/
npm run build:desktop --workspace=@repo-1/desktop

# Smoke test: Electron khởi động dưới Xvfb, kiểm tra preload API + #root
# render + chụp màn hình ra /tmp/vcut-desktop-smoke.png
npm run smoke:desktop --workspace=@repo-1/desktop
```

Yêu cầu: Node >= 20, npm workspaces đã install ở repo root (`npm install` —
Electron 45.2.3 được pin exact trong `package.json`). Chế độ dev cần bridge
chạy riêng (`npm run dev --workspace=@repo-1/bridge`) để render/caption/TTS
hoạt động; nếu bridge chưa chạy, editor vẫn mở, các tính năng AI/render sẽ
báo lỗi rõ ràng thay vì treo.

## Kiến trúc

```
apps/desktop/
  src/
    main.ts        — main process: lifecycle, single instance, BrowserWindow,
                     IPC (dialog/info/services), smoke hook (VCUT_DESKTOP_SMOKE)
    preload.ts     — contextBridge: window.vcutDesktop (API tối thiểu, không fs thô)
    menu.ts        — menu native nhãn tiếng Việt, phím tắt khớp web app
    protocol.ts    — scheme app://vcut/ phục vụ UI đã build (dist-web/)
    services.ts    — probe sức khỏe bridge :8787 (+ vite :5173 ở dev)
    windowState.ts — nhớ size/position/maximized (userData/window-state.json)
  scripts/
    dev-desktop.mjs    — dev: vite + Electron, Ctrl+C dừng cả hai
    copy-web-dist.mjs  — copy apps/web/dist → apps/desktop/dist-web
  dist/            — main/preload đã compile (tsc, không commit)
  dist-web/        — bản sao UI web để đóng gói (không commit)
  release/         — AppImage/.deb sau khi đóng gói (không commit)
```

## Vì sao dùng scheme `app://` thay vì loadFile

Bản build Vite dùng đường dẫn asset tuyệt đối (`/assets/...`) nên `loadFile`
thẳng `index.html` sẽ gãy. Scheme `app` đăng ký dạng standard + secure nên
UI vẫn là secure context (Web Crypto, IndexedDB, localStorage chạy), và
origin `app://vcut` được bridge chấp nhận ở CORS (xem
`server/bridge/src/index.js` — chỉ đúng origin này, không mở thêm).
Dev mode không cần scheme này vì load thẳng Vite dev server (origin loopback).

## Bảo mật preload

- `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true`.
- Renderer chỉ thấy `window.vcutDesktop`: `platform/arch/versions`,
  `getInfo()`, `getServices()`, 4 dialog (`openProjectDialog`,
  `saveProjectDialog`, `openMediaDialog`, `saveVideoDialog`), và 2
  subscription `onOpenFile` / `onMenuAction`. Không expose `fs`,
  `ipcRenderer` thô, hay `require`.

## Menu — phím tắt khớp web app

Tệp: Dự án mới (Ctrl+N), Mở dự án… (Ctrl+O), Thêm media…, Lưu (Ctrl+S),
Lưu thành… (Ctrl+Shift+S), Xuất video… (Ctrl+E), Thoát.
Chỉnh sửa: Hoàn tác (Ctrl+Z), Làm lại (Ctrl+Y), Cắt/Sao chép/Dán,
Nhân bản clip (Ctrl+D), Chọn tất cả (Ctrl+A).
Xem: Tải lại (Ctrl+R), DevTools (F12), Toàn màn hình (F11).
Các action thuộc editor (mới/mở/lưu/xuất/nhân bản…) được gửi về renderer qua
kênh `vcut:menu-action`; renderer đăng ký bằng
`window.vcutDesktop.onMenuAction` (đấu nối ở luồng G3/G5). File `.vcut`
double-click từ ngoài được gửi qua kênh `vcut:open-file`.

## Đóng gói Linux

`electron-builder` (config trong `package.json`, trường `build`):
appId `studio.vcut.app`, target AppImage + .deb, icon
`apps/web/public/icons/icon-512.png` (gen lúc build bằng
`apps/web/public/icons/gen_icons.py`, không commit binary).
