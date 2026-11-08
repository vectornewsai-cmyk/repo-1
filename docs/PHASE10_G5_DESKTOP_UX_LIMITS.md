# PHASE10_G5_DESKTOP_UX_LIMITS.md — Menu desktop, About, settings, crash (luồng G5)

Ngày: 2026-11-06. Phạm vi: UX desktop của app Electron (menu native,
About, settings persist, xử lý crash, tài liệu `docs/DESKTOP.md` +
`INSTALL.md`). KHÔNG push, KHÔNG tag/release (release gate vẫn giữ).

## 1. Làm được gì

- **Menu đầy đủ 5 nhóm, nhãn vi/en** (`menu.ts` + `i18n-desktop.ts`):
  Tệp / Chỉnh sửa / Xem / Cửa sổ / Trợ giúp. Mọi mục lá đều có click
  hoặc role (harness kiểm tra toàn bộ template). Đổi ngôn ngữ ở Xem >
  Ngôn ngữ → lưu `settings.json`, rebuild menu, báo renderer đổi theo.
- **Sửa lỗi role native của G1**: mục Chỉnh sửa (undo/redo/cắt/sao
  chép/dán/nhân bản/xóa/chọn tất cả) KHÔNG dùng role Electron (role chỉ
  tác động undo/clipboard Chromium, editor dùng store riêng) mà gửi
  action qua `vcut:menu-action` để renderer gọi đúng hàm store
  (`apps/web/src/desktop.ts`). Đã kiểm chứng trên Electron thật: 0 mục
  Edit dùng role.
- **About dialog đầy đủ** (`about.ts`): tên VCut Studio, version từ
  `package.json`, license MIT, version Electron/Chrome/Node, link
  repo/docs/issues, đường dẫn log + settings để gửi báo lỗi, nút sao
  chép thông tin / mở thư mục log.
- **Settings persist ở userData** (`settings.ts`): ngôn ngữ, recent
  (tối đa 10), project hiện tại — ghi nguyên tử, file hỏng → default.
  Không đụng IndexedDB/localStorage của web (chỉ đồng bộ ngôn ngữ qua
  IPC hai chiều, không vòng lặp).
- **Đọc/ghi file thật ở main** (`file-io.ts`): `desktop:read-file`
  (project + media, cap 2 GiB), `desktop:write-project-file` (nguyên tử
  tmp+rename), `desktop:note-project-opened`, current path
  (get/set, fallback `settings.lastProjectPath` để reload trang vẫn
  Ctrl+S thẳng), `desktop:get-paths`, OS recent (`app.addRecentDocument`).
- **Crash handling** (`crash.ts`): `uncaughtException` → dialog + log,
  `unhandledRejection` → chỉ log (không spam dialog),
  render-process-gone → dialog Tải lại/Thoát, log xoay > 2 MiB.
  **Không gửi crash report đi đâu** (local-first, không telemetry).
- **Cầu nối renderer** (`apps/web/src/desktop.ts` + guard ở `App.tsx` +
  `onLangChange` ở `i18n/index.ts`): menu-action, mở file từ
  menu/recent/double-click, lưu/lưu thành qua dialog hệ thống, đồng bộ
  ngôn ngữ. Đường mở/lưu dùng flow dùng chung `openProjectFlow.ts`
  của G4 (không nhân bản logic ProjectMenu).
- **Tài liệu**: `docs/DESKTOP.md` (dev, build, đóng gói Linux, yêu cầu
  hệ thống, kiến trúc, hợp đồng IPC, kiểm tra xung đột phím tắt, quyết
  định auto-update + thiết kế tương lai) + đoạn desktop ngắn ở
  `INSTALL.md` trỏ sang đó.
- **Auto-update: KHÔNG triển khai** (quyết định có chủ đích — release
  gate + cần server/releases; xem `docs/DESKTOP.md` §10).

## 2. Kiểm chứng (06/11, VM 2vCPU/8GB)

- `tsc` desktop: **0 lỗi**; `tsc` web (`--noEmit`): **0 lỗi**.
- Harness G5 (`/tmp/vcut-g5-test/g5.test.ts`, esbuild bundle + stub
  Electron, `node --test`): **9/9 pass** — settings round-trip, i18n
  đủ key, accelerator không trùng, menu đủ 5 nhóm + mọi mục có
  click/role + Edit không role, click undo/đổi ngôn ngữ/mở recent
  thật + recent mất (xóa + cảnh báo), crash log + xoay, About đủ nội
  dung, file-io ghi/đọc + từ chối đuôi lạ, `wireDesktopUx` đăng ký đủ
  kênh. Harness nằm ở `/tmp` (không commit — xem §6).
- Smoke test Electron thật (`npm run smoke:desktop`, Xvfb): `ok: true`,
  `hasPreloadApi: true`, `hasNativeFileApi: true`, UI render
  (`textLen: 2154`, secure context). Lỗi `dbus` là nhiễu môi trường VM;
  chụp màn hình lỗi `UnknownVizError` (giới hạn Xvfb đã biết).
- Menu trên Electron thật (check riêng): `Menu.buildFromTemplate` +
  `setApplicationMenu` chạy được, 5 menu top, 0 mục Edit dùng role.
- Kiểm chứng userData thật: chạy dev ghi `settings.json` +
  `window-state.json` vào `~/.config/@repo-1/desktop/` (từ tên
  package `@repo-1/desktop`); bản đóng gói sẽ là
  `~/.config/VCut Studio/` (productName). Xem §4.

## 3. Giới hạn / chưa làm được

- **Không có cửa sổ Settings riêng**: ngôn ngữ đổi ở Xem > Ngôn ngữ,
  trạng thái cửa sổ tự lưu, recent ở menu Tệp. Tùy chọn khác (thư mục
  mặc định, kênh cập nhật…) chưa có chỗ chỉnh — để khi làm Settings UI.
- **Không tự mở lại project khi khởi động** (quyết định có chủ đích):
  web autosave đã khôi phục session; mở file từ `lastProjectPath` sẽ
  ghi đè session đó. User mở lại từ Tệp > Mở gần đây.
- **Xuất video từ menu chỉ mở panel Xuất** (như nút Xuất trên TopBar).
  Chọn đích `.mp4` trước render + lưu stream là flow của G4
  (`lib/nativeFiles.ts` + `desktop:save-export-file`); panel Xuất chưa
  nối vào flow đó — export trong desktop vẫn lưu bằng download của
  trình duyệt (vào thư mục tải mặc định) cho đến khi G2/G3 nối.
- **Menu "Thêm media" chỉ mở 1 dialog rồi gửi từng đường dẫn**:
  chọn nhiều file qua dialog hệ thống + tổng cap 4 GiB là flow của G4
  (`importMediaNative`); menu chưa gọi flow đó.
- **Ctrl+Y làm redo do web xử lý, không có trong menu**: Electron chỉ
  cho 1 accelerator/mục nên redo chỉ có Ctrl+Shift+Z trên menu. Quy
  tắc: guard `isDesktopMenuShortcut` chỉ chặn đúng tổ hợp menu có —
  thêm accelerator mới phải thêm vào `MENU_OWNED_KEYS` cùng lúc
  (đã từng chặn nhầm Y khiến Ctrl+Y chết hẳn; đã sửa 06/11).
- **Reload (Ctrl+R) mất state renderer chưa lưu file**: autosave
  IndexedDB khôi phục được, nhưng thao tác chưa qua autosave (debounce
  5s) có thể mất. Đây là hành vi reload chuẩn của Electron, không riêng
  VCut.
- **Crash dialog chưa được click-test trên Electron thật**: handler đã
  cài (smoke test boot không throw), logic log/dialog đã test bằng
  stub; chưa có test nào gây crash thật rồi bấm nút dialog.
- **macOS/Windows chưa test**: toàn bộ kiểm chứng trên Linux (VM này).
  Menu macOS (menu app hệ thống, Cmd thay Ctrl) chưa được xem xét —
  accelerator dùng `CommandOrControl` nên đúng về lý thuyết, chưa chạy
  thật.

## 4. Nợ mở

1. Nối panel Xuất vào flow export native của G4 (chọn đích trước
   render → `desktop:save-export-file`) — xem §3.
2. Nối menu "Thêm media" vào `importMediaNative` của G4 (nhiều file +
   tổng cap 4 GiB).
3. Cửa sổ Settings riêng (khi có tùy chọn đáng để chỉnh).
4. Click-test crash dialog thật (gây crash có chủ đích dưới Xvfb, bấm
   Khởi động lại/Thoát).
5. `wireDesktopUx` đăng ký file IPC một lần nhờ cờ module; trên macOS
   nếu cửa sổ bị đóng rồi tạo lại (activate), `onRecentChanged` vẫn
   trỏ về cửa sổ cũ đã destroy (đã guard `isDestroyed()` trong
   `rebuildMenu`, nhưng menu click sau đó gửi IPC vào webContents cũ —
   không crash, chỉ không có tác dụng). Cần dọn lại khi làm multi-window.
6. Tên file mặc định: `desktop.ts` bỏ dấu như G4 nhưng giữ đuôi
   `.vcut.json` (đuôi chuẩn web) thay vì `.vcut` của G4 — khác đuôi
   mặc định giữa hai đường lưu (dialog chính vẫn chấp nhận cả hai).

## 5. Ghi chú tích hợp G4 ↔ G5 (để G6 khỏi sửa nhầm)

Trong ngày 06/11, G4 và G5 cùng sửa `main.ts` / `preload.ts` /
`native-files.ts` / `menu.ts` / `settings.ts` / `file-io.ts` và API
đổi 2 lần. Trạng thái CUỐI (đã tsc 0 + harness 9/9 + smoke ok):

- **G5 giữ**: `file-io.ts` (đọc/ghi + recent + current path +
  `desktop:get-paths`), `settings.ts` (recent là nguồn sự thật duy
  nhất), `menu.ts` (`setAppMenu(win)` 1 đối số), `desktop-ux.ts`
  (`wireDesktopUx(win)` 1 đối số, trả `DesktopUx` có `.settings` +
  `.rebuildMenu()`).
- **G4 giữ**: `native-files.ts` (helper thuần + `LastDirStore` +
  `saveExportFile` stream), preload đã viết theo kênh file-io của G5
  (`desktop:read-file` / `write-project-file` / `note-project-opened`),
  `lib/nativeFiles.ts` + `lib/openProjectFlow.ts` bên renderer.
- **Đã xoá**: `NativeFileService` + `vcut-native-files.json` của G4 bản
  đầu (trùng file-io/settings của G5); `file-io.ts` bản đầu của G5 đã
  được viết lại theo hợp đồng preload cuối (kênh `desktop:read-file`
  ném lỗi thay vì trả object lỗi — preload bắt và trả
  `{ok:false, error}`).
- **Bẫy đã gặp**: `main.ts` từng đăng ký trùng `desktop:get-paths`
  (G1 seam fix + file-io) — trùng `ipcMain.handle` throw lúc khởi
  động. Hiện chỉ file-io đăng ký kênh này. `setAppMenu`/`wireDesktopUx`
  từng lệch chữ ký giữa các bản — hiện đều 1 đối số.
- **Hai instance LastDirStore**: `main.ts` (dialog G1) và `menu.ts`
  (dialog menu) mỗi bên giữ một instance đọc cùng file
  `vcut-last-dirs.json`; chỉ ghi khi user chọn file nên giá trị hội tụ
  (cùng thư mục vừa chọn). Chấp nhận được; đừng gộp vội.

## 6. Quy ước binary + file test

- Icon `.png`, file `.ogg`/`.cube`/`.ttf` không commit — chỉ commit
  script gen (mẫu từ Phase 9).
- Harness test G5 nằm ở `/tmp/vcut-g5-test/` (stub Electron + test
  `node:test`), KHÔNG commit vào repo — G6 muốn chạy lại thì bundle
  bằng esbuild như lệnh trong §2. Nếu cần test bền vững, chuyển harness
  vào `apps/desktop/src/*.test.ts` theo mẫu `native-files.test.ts`
  của G4 trong đợt sau (không làm trong đợt này để khỏi đụng G4).
