# Phase 10 G3 — Đóng gói Linux (AppImage / .deb) bằng electron-builder

Ngày: 06/11/2026. Luồng G3 (đóng gói Linux). Repo: `~/workspace/repo-1`.
KHÔNG push, KHÔNG tag/release, KHÔNG stage paths (parent gộp sau).

## 0. Tóm tắt

- Electron app ở `apps/desktop` (luồng G1) đã có sẵn key `build` trong
  `package.json` (appId `studio.vcut.app`, target AppImage + deb, output
  `release/`). G3 KHÔNG viết lại config từ đầu mà hoàn thiện nó:
  file association `.vcut`, desktop entry, MIME type, `desktopName`
  (WM_CLASS), `ffmpeg` vào `deb.depends`, icon sinh lúc build, script
  `package:linux` ở root.
- Icon: KHÔNG commit PNG binary. `scripts/gen-icon.mjs` chạy
  `apps/web/public/icons/gen_icons.py` (nguồn duy nhất, Phase 8) rồi copy
  bản 512x512 vào `build/icon.png` lúc prepackage — đã kiểm chứng chạy
  được trên VM này (512x512 RGBA, 3954 bytes).
- ffmpeg: DÙNG FFMPEG HỆ THỐNG, không bundle ffmpeg-static (§4).
  Module `src/ffmpeg-check.ts` kiểm tra lúc app mở + IPC
  `desktop:ffmpeg-status`; thiếu thì dialog hướng dẫn cài, app vẫn mở.
- Kiểm chứng thật trên VM này (§6): AppImage + .deb build thành công,
  `.desktop` + mime XML đúng, AppImage chạy dưới Xvfb mở được cửa sổ
  editor thật (smoke `ok:true`).

## 1. Đã làm (file đổi/thêm — xem §8)

1. **Config electron-builder** — hoàn thiện key `build` trong
   `apps/desktop/package.json` (G1 đã đặt nền: appId, productName,
   target, output; G3 thêm phần còn lại). Không dùng file
   `electron-builder.yml` riêng để tránh 2 nơi cấu hình mâu thuẫn nhau
   (electron-builder.yml sẽ thắng key `build` nếu cả hai tồn tại).
   Pin electron-builder **26.18.0** (v27 đổi API: `desktopName` bắt buộc,
   `linux.syncDesktopName` bị bỏ — nâng cấp là việc riêng).
2. **Icon lúc build** — `scripts/gen-icon.mjs` + `scripts/prepackage.mjs`
   (prepackage chạy tự động trước `npm run package`). `prepackage` gọi
   `gen-icon.mjs` rồi `scripts/copy-web-dist.mjs` (G1) để copy
   `apps/web/dist` → `apps/desktop/dist-web`.
3. **File .desktop + MIME .vcut** — qua `fileAssociations` (ext `vcut`,
   mimeType `application/x-vcut-project`) + `linux.desktop.entry`.
   electron-builder tự sinh `MimeType=` trong .desktop và
   `/usr/share/mime/packages/*.xml` trong gói .deb (kiểm chứng §3).
   LƯU Ý: không khai `MimeType` tay trong `desktop.entry` và không dùng
   `linux.mimeTypes` song song với `fileAssociations` — electron-builder
   ghi đè/ghép sau khi spread entry nên MIME bị lặp 2–3 lần (đã gặp thật,
   xem §3). Cũng không khai `Comment`/`Categories` tay trong entry —
   chúng bị ghi đè bởi package `description` và `linux.category`.
4. **Script** — root `package:linux` → `npm run build:desktop
   --workspace=@repo-1/desktop` (build web → build desktop (tsc) →
   prepackage → electron-builder --linux). `apps/desktop` có thêm
   `prepackage` + `package`.
5. **ffmpeg** — module `src/ffmpeg-check.ts`, nối vào `main.ts` sau
   `app.whenReady()` (dialog cảnh báo nếu thiếu, không chặn app mở) +
   IPC `desktop:ffmpeg-status`.
6. **Bug G1 đã sửa trong lúc làm** — `scripts/copy-web-dist.mjs` tính
   sai repoRoot (2 cấp `..` thay vì 3 → tìm `apps/apps/web/dist`,
   FAIL trước khi copy). Đã sửa 1 dòng + kiểm chứng prepackage chạy hết
   (icon OK, copy 6 mục, 3.6 MB). `scripts/dev-desktop.mjs` có cùng lỗi
   ở dòng 14 — G3 KHÔNG sửa (ngoài phạm vi packaging, để G1 hoặc
   parent quyết).
7. **3 lỗi config đã sửa trong lúc kiểm chứng** (đều gặp thật khi build):
   - `electron` để ở `dependencies` → electron-builder bắt buộc phải ở
     `devDependencies` (đã chuyển).
   - `desktopName` để trong key `build` → electron-builder 26 từ chối
     (unknown property); đúng chỗ là field top-level trong package.json
     + `linux.syncDesktopName: true`.
   - Không có `linux.executableName` → AppImage lấy tên từ package name
     `@repo-1/desktop` → `@repo-1desktop` (chứa `@`, bị từ chối).
     Đã set `linux.executableName: "vcut-studio"`. Thiếu `homepage` →
     target deb lỗi "Please specify project homepage" (đã thêm homepage
     trỏ repo GitHub public).

## 2. Vì sao chọn AppImage + deb (không rpm / snap / flatpak)

- **AppImage**: chạy được trên mọi distro x64 không cần cài đặt, không
  cần root — đường thử nhanh nhất; là 1 trong 2 target mặc định của
  electron-builder. Nhược: KHÔNG tự tích hợp desktop (từ electron-builder
  21, AppImage không tự tạo .desktop/menu/file association — cần
  AppImageLauncher hoặc copy tay `.desktop` + icon ra
  `~/.local/share/applications/` + `~/.local/share/icons/`); cần libfuse2
  lúc chạy trên Ubuntu 22.04+ (§7).
- **deb**: đường cài đặt chính thức cho Ubuntu/Debian/Mint — đặt
  `.desktop` vào `/usr/share/applications/`, đăng ký MIME qua
  `/usr/share/mime/packages/*.xml`, kéo `ffmpeg` theo qua `depends`.
  Đây mới là bản "cài xong mở file .vcut từ file manager được".
- **Không rpm** (mặc định không làm theo yêu cầu): thêm target không tốn
  công build nhưng tốn công kiểm chứng (cần máy Fedora/dnf để thử cài,
  VM này không có); rpm dùng chung cơ chế file association với deb nên
  thêm sau chỉ là 1 dòng `target` + 1 lần build thử. Người dùng Fedora
  dùng AppImage trong lúc chờ.
- **Không snap/flatpak**: snap là target mặc định còn lại của
  electron-builder nhưng cần snapcraft + confinement (app cần chạy ffmpeg,
  python, đọc file project khắp máy — confinement sẽ gây thêm việc);
  flatpak cần manifest + runtime riêng. Cả hai đều ngoài phạm vi "Linux
  thật sự" của đợt này và chưa có ai yêu cầu.

## 3. File .desktop + MIME .vcut — kiểm chứng

Nội dung `.desktop` lấy từ AppImage giải nén (`--appimage-extract`) và
từ `.deb` (`dpkg-deb --fsys-tarfile | tar -xO`) — hai bản giống nhau
ngoại trừ `Exec` và `X-AppImage-Version`:

```ini
[Desktop Entry]
Name=VCut Studio
Exec=AppRun --no-sandbox %U            # AppImage
Exec="/opt/VCut Studio/vcut-studio" %U # .deb
Terminal=false
Type=Application
Icon=vcut-studio
StartupWMClass=studio.vcut.app
Categories=AudioVideo;
Comment=VCut Studio — Electron shell: app desktop thật cho trình dựng video (load apps/web/dist, bridge local :8787)
Comment[vi]=Trình dựng video — chỉnh sửa video trên máy của bạn, dữ liệu không rời máy
Keywords=video;editor;edit;vcut;
MimeType=application/x-vcut-project;
```

- Tên file `.desktop` là `studio.vcut.app.desktop` (nhờ top-level
  `desktopName` + `linux.syncDesktopName: true`). Đã gặp thật trường hợp
  `desktopName` top-level bị mất (do một luồng song song ghi đè
  package.json giữa chừng, 06/11 09:06) → electron-builder cảnh báo
  "desktopName is not set in package.json" và đặt tên file
  `vcut-studio.desktop`, `StartupWMClass` rơi về productName. Đã khôi
  phục lại và build lại.
- `MimeType` chỉ xuất hiện **đúng 1 lần** sau khi bỏ `linux.mimeTypes`
  (trước đó bị lặp 2 lần trong AppImage, 3 lần trong .deb vì
  `fileAssociations` + `mimeTypes` ghép chồng).
- MIME XML trong `.deb` (`/usr/share/mime/packages/vcut-studio.xml`,
  295 bytes): `<mime-type type="application/x-vcut-project">` với
  `<glob pattern="*.vcut"/>` + comment "VCut Studio project file".
  AppImage cũng chứa file XML tương tự (`usr/share/mime/packages/`).
- Icon trong `.deb`: `/usr/share/icons/hicolor/512x512/apps/vcut-studio.png`
  (3954 bytes — đúng file icon đã gen). AppImage có `vcut-studio.png` ở
  gốc + symlink `.DirIcon`.
- Chưa có `desktop-file-validate` / `appstreamcli` trên VM này nên
  `.desktop` chỉ kiểm tra bằng mắt + mở app thật, chưa validate bằng
  tool chuyên dụng (nợ §7).

## 4. ffmpeg: hệ thống hay bundle ffmpeg-static?

| Tiêu chí | ffmpeg hệ thống (CHỌN) | ffmpeg-static bundle |
|---|---|---|
| Kích thước gói | +0 MB (Electron ~90–120 MB giữ nguyên) | +~70–80 MB (1 binary Linux x64) |
| License phát hành | Sạch: ta không phân phối ffmpeg (LGPL/GPL) | Rủi ro: build tĩnh của ffmpeg-static gồm libx264 (GPL) và các codec khác — phân phối kèm theo kéo nghĩa vụ GPL (offer source...). Cần audit cấu hình build trước khi dùng. |
| Độ tin cậy | Phụ thuộc máy user có ffmpeg không; Ubuntu mặc định KHÔNG có | Luôn có, đúng version đã test |
| Khớp kiến trúc sẵn có | Render worker + bridge đã dùng `ffmpeg` trên PATH / env FFMPEG; bridge /api/health đã báo ffmpeg true/false + version | Phải sửa đường dẫn spawn (FFMPEG env trỏ vào resources/) + test lại toàn bộ render path |
| Bảo trì | User tự cập nhật ffmpeg theo distro | Ta phải cập nhật ffmpeg-static theo từng release |

Quyết định: **ffmpeg hệ thống**.
- `.deb` kéo `ffmpeg` theo qua `depends` → user cài .deb là có ffmpeg.
- AppImage: `src/ffmpeg-check.ts` kiểm tra lúc mở app; thiếu thì dialog
  hướng dẫn cài theo distro (apt/dnf/pacman) + gợi ý env FFMPEG; app vẫn
  mở, render/export báo lỗi rõ ràng.
- Bridge `/api/health` vốn đã báo ffmpeg status — UI (G5) có thể hiển thị
  trạng thái này thay vì tin mù.
- Nợ mở: nếu sau này muốn AppImage "cài là chạy" không cần apt, cân nhắc
  lại ffmpeg-static kèm audit license (xem §7).

## 5. Điều kiện tiên quyết trên máy build

- Node >= 20, npm (workspaces đã install ở repo root — Electron 45.2.3
  pin exact, electron-builder 26.18.0 pin exact trong
  `apps/desktop/package.json`).
- Python 3 + Pillow (gen icon lúc prepackage; VM này: Python 3.12.3,
  PIL 10.2.0).
- `dpkg-deb` (đóng gói .deb — VM này có `/usr/bin/dpkg-deb`).
- Mạng: electron-builder tải Electron dist (~100 MB) + app-builder
  binaries lần đầu (cache ở `~/.cache/electron-builder`); registry.npmjs.org
  + github.com đều tới được từ VM này (kiểm chứng 06/11).
- **/tmp phải đủ trống HOẶC đặt TMPDIR ra đĩa**: fpm (đóng .deb) stage
  ~280 MB dưới thư mục tạm. `/tmp` trên VM này là tmpfs 512 MB — lần
  build live đầu tiên đã FAIL với `ENOSPC` vì còn 85 MB trống (do
  thư mục stage của lần build trước chưa dọn). Đã dọn `/tmp` và build lại
  với `TMPDIR=~/workspace/tmp-g3-snap/tmp` (nằm trên đĩa). KHÔNG cần:
  fakeroot (electron-builder dùng dpkg-deb trực tiếp), rpmbuild (không
  build rpm), libfuse2 (chỉ cần lúc CHẠY AppImage, không cần lúc build).

## 6. Kiểm chứng thật trên VM này

Build snapshot (cấu hình cuối, trước khi áp vào cây live):

- `vcut-studio-0.1.0-x86_64.AppImage` — **128.086.257 bytes (~122,2 MB)**
- `vcut-studio_0.1.0_amd64.deb` — **103.000.488 bytes (~98,2 MB)**
- `.deb`: `dpkg-deb -I` → Package `vcut-studio`, Version 0.1.0, Arch
  amd64, Maintainer VCut Studio, Homepage repo GitHub,
  Depends `ffmpeg, libgtk-3-0, libnotify4, libnss3, libxss1, libxtst6,
  xdg-utils, libatspi2.0-0, libuuid1, libsecret-1-0`,
  Recommends `libappindicator3-1`, Installed-Size 283641 KB.
- Nội dung `.deb` (`dpkg-deb -c`): `/opt/VCut Studio/vcut-studio`
  (235 MB binary) + `resources/app.asar` (3,3 MB, 277 entries —
  gồm `dist/main.js`, `dist-web/index.html`, `package.json`),
  `.desktop`, mime XML, icon 512 (xem §3).
- AppImage chạy dưới Xvfb
  (`APPIMAGE_EXTRACT_AND_RUN=1 VCUT_DESKTOP_SMOKE=1 xvfb-run -a
  ./vcut-studio-0.1.0-x86_64.AppImage --no-sandbox`, VM này không có
  libfuse nên phải dùng `APPIMAGE_EXTRACT_AND_RUN=1`; chạy bằng root
  nên cần thêm `--no-sandbox`):
  `VCUT_SMOKE_RESULT {"hasNativeFileApi":true,"hasPreloadApi":true,
  "ok":true,"rootChildren":1,"secureContext":true,"textLen":2154,
  "title":"VCut Studio — Trình dựng video","url":"app://vcut/index.html"}`
  — cửa sổ editor mở thật, UI tiếng Việt đầy đủ ("Xuất bản", "THƯ VIỆN"...).
  Log ghi `[vcut-desktop] ffmpeg: ffmpeg version 8.1.2` — chứng tỏ
  ffmpeg-check đã nối vào main và chạy trong app đóng gói. Screenshot
  smoke: `~/workspace/tmp-g3-snap/smoke-vcut.png` (5132 bytes).
- `tsc --noEmit` trên cây live: **0 lỗi** (sau khi G5 sửa xong lỗi type
  tạm thời ở `desktop-ux.ts`/`preload.ts` giữa chừng).

Build live (cây thật, `npm run package:linux`):

- Lần 1 (09:10): AppImage xong (128.094.564 bytes) nhưng .deb FAIL do
  fpm `ENOSPC` trên tmpfs `/tmp` (xem §5) + `desktopName` top-level bị
  một luồng song song ghi đè mất giữa chừng.
- Lần 2 (09:13–09:16, TMPDIR ra đĩa + desktopName đã khôi phục):
  **EXIT 0 — cả hai gói xong.**
  - `vcut-studio-0.1.0-x86_64.AppImage` — **128.094.490 bytes (~122,2 MB)**
  - `vcut-studio_0.1.0_amd64.deb` — **102.998.060 bytes (~98,2 MB)**
  - `.deb` kiểm chứng lại: Package `vcut-studio`, Depends có `ffmpeg`,
    Installed-Size 283655 KB, chứa `studio.vcut.app.desktop` (đúng tên
    nhờ desktopName), mime XML, icon 512; `.desktop` có
    `StartupWMClass=studio.vcut.app` và `MimeType` đúng 1 lần.
  - `desktopName: studio.vcut.app` vẫn còn nguyên trong package.json
    sau build.
- Chạy AppImage live dưới Xvfb:
  - Trực tiếp `./vcut-studio-0.1.0-x86_64.AppImage` với
    `APPIMAGE_EXTRACT_AND_RUN=1` và `/tmp` chỉ còn 228 MB trống đã
    **FAIL exit 127** (runtime giải nén ~280 MB ra `/tmp` không đủ chỗ;
    log chỉ in listing file đã giải nén, không có lỗi rõ ràng).
    Chạy lại với `TMPDIR` ra đĩa → **EXIT 0,
    `VCUT_SMOKE_RESULT ok:true`** — chứng tỏ app đóng gói không lỗi,
    lỗi là do `/tmp` đầy. Trên máy có libfuse (mount thay vì giải nén)
    hoặc `/tmp` đủ trống thì không gặp.
  - Binary đã giải nén chạy trực tiếp cũng **EXIT 0, ok:true**,
    log `[vcut-desktop] ffmpeg: ffmpeg version 8.1.2`, screenshot
    `smoke-vcut-live.png` (5132 bytes).
  - Bằng chứng smoke (log + screenshot) lưu tại
    `workspace/goals/capcut-clone-video-editor/hidden_files/phase10-g3/`.

## 7. Giới hạn + nợ mở (trung thực)

- **arm64 chưa làm**: target chỉ x64. Electron + electron-builder hỗ trợ
  arm64 nhưng cần build trên máy arm64 (hoặc cross-compile + test trên
  phần cứng arm64 thật); VM này x64 nên không kiểm chứng được.
- **Windows/macOS chưa build được từ Linux**: electron-builder có thể
  cross-build Windows từ Linux (cần wine/mono cho một số bước) nhưng
  macOS bắt buộc máy mac (codesign + notarize). Đợt này chỉ Linux.
- **AppImage cần libfuse2 lúc chạy**: Ubuntu 22.04+/Debian 12+ không cài
  sẵn libfuse2 → AppImage không mount được (lỗi `libfuse.so.2`).
  VM này cũng KHÔNG có libfuse2 nên kiểm chứng chạy AppImage phải dùng
  `APPIMAGE_EXTRACT_AND_RUN=1`. Người dùng: cài .deb (khuyên dùng) hoặc
  `sudo apt install libfuse2` rồi chạy AppImage. (Ghi rõ trong docs G5
  nếu có phần hướng dẫn cài đặt.)
- **Chạy AppImage bằng `APPIMAGE_EXTRACT_AND_RUN=1` cần `/tmp` (hoặc
  `$TMPDIR`) đủ ~300 MB trống**: runtime giải nén toàn bộ ~280 MB ra
  thư mục tạm. Đã gặp thật: `/tmp` tmpfs 512 MB chỉ còn 228 MB trống →
  AppImage exit 127 không báo lỗi rõ. Đặt `TMPDIR` ra đĩa là chạy được
  ngay. Trên máy có libfuse thì AppImage mount trực tiếp, không giải
  nén, không gặp vấn đề này.
- **Services trong app đóng gói**: main process hiện tại KHÔNG tự spawn
  bridge/render/Python services — `src/services.ts` chỉ probe
  `http://127.0.0.1:8787/api/health`. Vòng đời services do luồng G2
  quản lý (serviceManager đã có trong `src/services/`); khi G2 nối
  spawn vào main thì `extraResources` trong config packaging phải bổ
  sung đúng thư mục server (bridge/render/packages) — hiện config để
  trống phần này, KHÔNG claim app đóng gói chạy đủ services.
- **electron-builder 26 (pin)**: v27 có breaking changes (vd
  `linux.syncDesktopName` bỏ, `desktopName` bắt buộc). Pin 26.18.0 để
  tránh đổi ngầm; nâng cấp v27 là việc riêng, cần đọc changelog.
- **`scripts/dev-desktop.mjs` dòng 14**: cùng lỗi repoRoot như
  copy-web-dist.mjs (2 cấp `..` thay vì 3) — G3 không sửa, để G1/parent.
- **Không có `desktop-file-validate`/`appstreamcli` trên VM này**:
  .desktop chỉ kiểm tra bằng mắt + mở app thật, chưa validate bằng tool
  chuyên dụng.
- **Chưa thử cài .deb thật lên máy sạch** (cần sudo/root + máy Ubuntu
  sạch): chỉ kiểm tra nội dung gói bằng `dpkg-deb -c/-e/-I`. Cài thử
  là nợ cho G6/parent nếu có máy test.
- **Icon .deb nhiều kích cỡ**: electron-builder chỉ đưa 1 icon 512x512
  vào gói (từ PNG 512 đã gen). Các distro thường chấp nhận; nếu muốn bộ
  icon nhiều cỡ (16/32/48/128/256) thì gen thêm từ nguồn rồi khai
  `linux.icon` theo thư mục — chưa làm.
- **Race ghi đè package.json giữa các luồng song song**: đã gặp thật
  06/11 09:06 (top-level `desktopName` bị mất). Ai còn sửa
  `apps/desktop/package.json` cần kiểm tra lại field này trước khi build;
  G6 nên verify lại config cuối trước khi push.

## 8. File đã đổi/thêm (luồng G3)

- `apps/desktop/package.json` — hoàn thiện key `build` (appImage
  artifactName, fileAssociations `.vcut`, deb artifactName + depends
  `ffmpeg`, linux executableName/icon `build/icon.png`/desktop.entry/
  syncDesktopName, scripts `prepackage`+`package`+`build:desktop` mới);
  top-level `desktopName`, `author`, `homepage`; `electron` chuyển từ
  `dependencies` sang `devDependencies`.
- `apps/desktop/scripts/gen-icon.mjs` (mới) — gen icon lúc build từ
  `apps/web/public/icons/gen_icons.py` → `build/icon.png` (512x512).
- `apps/desktop/scripts/prepackage.mjs` (mới) — chạy gen-icon rồi
  copy-web-dist (npm tự chạy trước `package`).
- `apps/desktop/src/ffmpeg-check.ts` (mới) — `checkFfmpeg()`,
  `ffmpegInstallHint()`, `ffmpegPath()` (spawnSync `ffmpeg -version`,
  tôn trọng env FFMPEG, timeout 10s).
- `apps/desktop/src/main.ts` — import ffmpeg-check; IPC
  `desktop:ffmpeg-status`; kiểm tra ffmpeg sau `app.whenReady()` +
  dialog cảnh báo nếu thiếu (không chặn app, không hiện ở smoke mode).
- `apps/desktop/scripts/copy-web-dist.mjs` — sửa 1 dòng: repoRoot 2 cấp
  `..` → 3 cấp (bug G1, file tìm sai `apps/apps/web/dist`).
- `package.json` (root) — thêm script `package:linux`.
- `docs/PHASE10_G3_LINUX_PACKAGING_LIMITS.md` (mới) — tài liệu này.
- KHÔNG đổi: `apps/desktop/src/ffmpeg-check.ts` không cần sửa gì thêm;
  không tạo `electron-builder.yml` (đã cân nhắc rồi bỏ — xem §1.1).
- Artifact build (KHÔNG commit, chỉ để kiểm chứng, nằm ngoài repo):
  `apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage`,
  `apps/desktop/release/vcut-studio_0.1.0_amd64.deb`,
  `apps/desktop/release/linux-unpacked/`.
