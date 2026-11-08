# PHASE10_G4_NATIVE_FILES_LIMITS.md — Tích hợp file native trong Electron (luồng G4)

Ngày: 2026-11-06. Phạm vi: IPC main-process + preload API + renderer adapter cho
file native (mở/lưu project, recent, import media, xuất MP4, mở file từ hệ
thống, kéo-thả). KHÔNG push, KHÔNG tag/release (release gate vẫn giữ).

## 1. Làm được gì

- **Mở project (.vcut/.vcut.json/.json/.vcut.zip)** — nút Mở dùng dialog hệ
  thống → đọc ở main qua kênh `desktop:read-file` của G5 → nạp bằng flow
  dùng chung mới `apps/web/src/lib/openProjectFlow.ts` (tách nguyên vẹn từ
  ProjectMenu: replaceProject → rehydrate → checkMissingMedia → load report
  → toast; hành vi hai đường mở khớp nhau). Mở từ menu Tệp / Recent /
  double-click / second-instance (argv Linux quét toàn bộ argv, nhận cả
  `.vcut.json`/`.vcut.zip`) đi qua cầu nối `apps/web/src/desktop.ts` của G5.
- **Lưu / Lưu thành** — qua `desktop.ts` của G5 (`saveProjectDesktop`):
  ghi ở main qua `desktop:write-project-file` (tmp + rename), current path
  giữ ở main (`desktop:get/set-current-project-path`, kênh đã có sẵn ở
  file-io.ts của G5); Ctrl+S trong Electron do menu nhận (guard
  `isDesktopMenuShortcut` ở App.tsx) nên không chạy trùng hai lần.
- **Recent documents** — một nguồn sự thật duy nhất: `settings.json` của G5
  (menu Tệp > Dự án gần đây, `app.addRecentDocument` qua file-io). G4 đã
  XOÁ `NativeFileService` + kho `vcut-native-files.json` riêng của bản đầu
  vì trùng với file-io.ts/settings.ts của G5 (giữ hai kho sẽ lệch nhau).
- **Nhớ thư mục gần nhất của dialog** — `LastDirStore`
  (`userData/vcut-last-dirs.json`, fail-soft như windowState.ts) nối vào cả
  4 dialog của G1 trong main.ts. G5 chưa có trường này nên G4 giữ file riêng.
- **Import media** — nút Thêm media trong Electron dùng dialog hệ thống
  chọn nhiều file → đọc bytes ở main (`desktop:read-file`, chặn 2 GiB/file
  ở main, tổng 4 GiB ở adapter) → `importFiles` hiện có + proxy tự động
  như đường web (đã tách `autoProxyFresh` trong MediaBin để dùng chung).
- **Xuất video** — dialog chọn đích `.mp4` TRƯỚC khi render (hủy thì không
  render); render xong, main tự STREAM MP4 từ bridge
  (`GET /api/render/{jobId}/download`) ra đích qua kênh mới
  `desktop:save-export-file` — không chở bytes video qua IPC.
- **Kéo-thả từ file manager** — `initNativeDrop()` (App.tsx): chỉ chặn drop
  có File; kéo nội bộ Timeline/MediaBin dùng data `text/media-id`, không có
  File nên đi qua như cũ. File project thả vào nạp bằng flow hiện có; media
  thả vào import thẳng (File đã mang bytes, không cần IPC).
- **Tên file mặc định bỏ dấu tiếng Việt** — "Đám cưới Lan Hùng" →
  `Dam cuoi Lan Hung.vcut` (không thành `m ci Lan Hng` như regex `\w`
  ASCII thuần). Hai bên desktop/web dùng cùng logic (ghi chú trong code).
- **Sửa 3 lỗi tích hợp tìm thấy khi đối chiếu với G5** (đều có comment
  `G4 fix` tại chỗ):
  1. `main.ts` đăng ký trùng `desktop:get-paths` (G1 seam fix + file-io.ts
     của G5) — ipcMain.handle trùng sẽ throw và crash app lúc khởi động.
     Đã gỡ bản ở main.ts.
  2. `main.ts` gọi `setAppMenu(mainWindow, ...)` với chữ ký cũ và
     `wireDesktopUx(win, nativeFiles)` với 2 đối số — menu.ts nay nhận
     `MenuDeps`, desktop-ux chỉ nhận 1 đối số. Đã sửa; handler
     `desktop:language-changed` nay dùng đúng store + rebuildMenu của
     desktopUx (tránh hai bản sao settings trong RAM lệch nhau).
  3. `desktop.ts` của G5: mở project thành công không báo main nên Recent
     không thêm mục mới và current path vẫn cũ → menu Lưu/Ctrl+S sau lần
     mở này hỏi lại đường dẫn. Đã thêm `noteProjectOpened` sau cả hai
     nhánh mở; project mới (menu + nút Mới) nay xoá current path ở main
     để lần Lưu tới không ghi đè file cũ.

## 2. Kiểm chứng (đều chạy thật, không claim suông)

- Desktop unit test `native-files.test.ts`: **8/8 PASS** (helper thuần,
  LastDirStore round-trip + file hỏng, saveExportFile stream từ bridge
  fake byte-identical + từ chối đích không .mp4 / bridge 404, IPC handler
  qua fake ipcMain). Chạy bằng esbuild bundle + `node --test`.
- Desktop `tsc`: **0 lỗi** — chạy với stub `electron.d.ts` đặt ở
  `/tmp/vcut-electron-stub/` (electron chưa install — G1 mới được
  `npm install`; stub chỉ bao phủ API đang dùng, không commit vào repo).
  Lưu ý: lần chạy đầu báo lỗi ở preload/crash/main/protocol — đều là do
  stub thiếu trường (`ipcRenderer.invoke` trả `Promise<any>` thật,
  `WebContents.reload`, `allowServiceWorkers`/`corsEnabled`); sau khi vá
  stub thì 0 lỗi. Typecheck thật bằng types của electron vẫn cần chạy lại
  sau khi G1 install.
- Web `tsc`: **0 lỗi**. `vite build`: **pass** (13.48s; dist đã build lại
  ở `apps/web/dist/` — build output, không stage/push).
- Web test liên quan (esbuild bundle + node --test, harness nội bộ của
  file): `projectRepo.test.ts` **10/10**, `loadReport.test.ts` **10/10**,
  `archiveNested32P4.test.ts` **7/7**.
- Bundle check esbuild (`--external:electron`): `main.ts` + `preload.ts`
  bundle được, `node --check` pass.
- Không còn tham chiếu tới symbol đã xoá (`NativeFileService`,
  `registerNativeFileIpc`, `desktop:native:*`, `getRecentProjects`) —
  chỉ còn 1 dòng comment lịch sử trong file-io.ts của G5.

## 3. Giới hạn — CHƯA test được bằng tay người / bằng app thật

- **Electron chưa được install** (`apps/desktop/node_modules/` không tồn
  tại; G1 mới được chạy `npm install`) nên **chưa chạy được app thật
  dưới Xvfb, chưa bấm được dialog thật, chưa chạy được smoke test**
  (`VCUT_DESKTOP_SMOKE=1`). Dialog headless không bấm được — đã test bằng
  IPC trực tiếp (fake ipcMain) + unit test cho handler như nhiệm vụ cho
  phép. Smoke probe có thêm `hasNativeFileApi` (chỉ ghi nhận, chưa chặn
  `ok`).
- **Chưa test end-to-end trong app thật**: mở/lưu/import/export/kéo-thả
  bằng tay người; Recent submenu cập nhật sau khi mở/lưu; single-instance
  mở file thứ hai trên Linux; dialog nhớ đúng thư mục gần nhất qua các lần
  mở app. Tất cả mới ở mức unit + typecheck + build.
- **Kéo-thả**: mới kiểm tra bằng lý luận code (chỉ chặn khi
  `dataTransfer.files.length > 0`); chưa click-test trên browser thật.
- **Lưu thành (Save As)**: G5 giữ flow hỏi tên qua prompt rồi mới dialog
  (như web) — khác với thiết kế đầu của G4 (tên theo file chọn). Hành vi
  hiện tại là của G5, ghi nhận để khỏi nhầm.
- **`defaultProjectFileName` của G5** (`desktop.ts`) trả `.vcut.json`,
  còn helper G4 (`native-files.ts`) trả `.vcut` — hai đuôi đều đọc được
  như nhau, chỉ khác đuôi mặc định khi Lưu thành từ menu (G5) so với tên
  gợi ý khác. Chưa thống nhất (nợ nhỏ, không ảnh hưởng đọc/ghi).
- **Mở file khi app chưa chạy (pendingOpenFile)**: `handleOpenFile` của
  G1 gửi `vcut:open-file` sau khi load URL; đường này dùng
  `openProjectFromPath` của G5 (đã có noteProjectOpened sau fix §1.3).
  Chưa test thật vì chưa launch được app.

## 4. Nợ mở / việc cho parent hoặc luồng khác

- **G1 install electron** rồi chạy lại: desktop `tsc` bằng types thật +
  smoke test Xvfb (`VCUT_DESKTOP_SMOKE=1`) + click-test tay cho 6 mục ở
  §3 (đặc biệt: dialog, Recent, second-instance, kéo-thả, export đích).
- **Trùng lặp logic mở project**: `desktop.ts` của G5 có bản copy riêng
  của flow mở (reportOpened/rehydrateBin/openProjectFromPath) song song
  với `openProjectFlow.ts` của G4 (ProjectMenu + drop dùng). Hành vi hiện
  khớp nhau, nhưng hai bản copy có thể lệch trong tương lai — nên refactor
  `desktop.ts` dùng `openProjectFlow.ts` ở đợt sau (G4 không tự viết lại
  file của G5 trong đợt này).
- **Hai SettingsStore trong RAM**: `wireDesktopUx` tạo `new SettingsStore`
  riêng, còn `getDesktopSettings` là singleton riêng — cùng đọc một file
  settings.json. Hiện không gây lỗi thấy được (menu dùng store của
  desktopUx; handler language-changed đã chuyển sang dùng store đó), nhưng
  là nợ kiến trúc nhỏ của G5.
- **`services.ts` vẫn ghi "vòng đời service do luồng G4 quản lý"** trong
  comment nhưng G4 không quản lý vòng đời service trong đợt này (chỉ health
  probe của G1 + stream export qua bridge URL) — comment đó của G1, để
  parent/G1 đối chiếu khi làm service lifecycle.
- **File `vcut-last-dirs.json` riêng** (thay vì thêm trường vào
  settings.json của G5): quyết định có chủ ý để không sửa file G5 đang
  làm dở; nếu parent muốn gộp thì chuyển `lastDir` vào `DesktopSettings`.

## 5. File đổi/thêm (14 file)

Desktop (`apps/desktop/src/`):
- `native-files.ts` — VIẾT LẠI: helper thuần + `LastDirStore` +
  `saveExportFile`/`registerExportFileIpc` (`desktop:save-export-file`);
  đã xoá `NativeFileService`/`registerNativeFileIpc`/recent riêng.
- `native-files.test.ts` — VIẾT LẠI: 8 test cho module mới.
- `main.ts` — import, `lastDirs` + `desktopUx`, `registerIpc(lastDirs)`,
  gỡ handler `desktop:get-paths` trùng, sửa `wireDesktopUx` 1 đối số,
  sửa handler `desktop:language-changed`, đăng ký export IPC, smoke
  probe thêm `hasNativeFileApi`.
- `preload.ts` — mục G4: đọc/ghi qua kênh G5 (`desktop:read-file`,
  `desktop:write-project-file`, `desktop:note-project-opened`), kênh mới
  `desktop:save-export-file`, khôi phục `get/setCurrentProjectPath`.

Web (`apps/web/src/`):
- `lib/openProjectFlow.ts` — MỚI: `openProjectFileFlow`,
  `openArchiveFileFlow`, `confirmDiscardProject`,
  `buildNativeSavePayload`, `markCurrentProjectSaved`,
  `saveNotesLinesForResult`, `snapshotHistoryAfterSave` (tách từ
  ProjectMenu, hành vi giữ nguyên).
- `lib/nativeFiles.ts` — VIẾT LẠI (tối thiểu): `importMediaNative`,
  `pickExportDestinationNative`, `saveExportNative`, `initNativeDrop`,
  `isNativeDesktop`.
- `vite-env.d.ts` — typing `window.vcutDesktop` (inline, không import
  cross-package).
- `i18n/vi.json`, `i18n/en.json` — block `nativeFiles` (9 key).
- `components/project/ProjectMenu.tsx` — dùng `openProjectFlow` +
  nhánh native qua `desktop.ts` của G5 (Mở/Lưu/Lưu thành/Mới).
- `App.tsx` — gọi `initNativeDrop()` cạnh `initDesktopMenuBridge`.
- `MediaBin.tsx` — nút Thêm media dùng dialog hệ thống khi native;
  tách `autoProxyFresh` dùng chung hai đường import.
- `ExportPanel.tsx` — chọn đích `.mp4` trước khi render; nút tải dùng
  `saveExportNative` khi native.
- `desktop.ts` (của G5, G4 sửa 3 dòng) — thêm `noteProjectOpened` vào
  interface + gọi sau khi mở thành công (2 chỗ) + xoá current path khi
  project mới.
