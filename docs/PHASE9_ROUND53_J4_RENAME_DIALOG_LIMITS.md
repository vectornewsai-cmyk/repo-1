# Phase 9 — Round 53 — J4: Rename dialog thay `window.prompt` + đo lại D4

Luồng J4, đợt 53. Repo local `~/workspace/repo-1`, branch main.
AppImage test: `401.060.440 byte`, sha256 `d5cbe6fe8eb27ea8539ed76de27af197b1c1573db3a1e4cc360ccb503c69dac5`
(bundle web trong asar: `index-CwcDTNVS.js`, asar `3.557.183 byte`).
KHÔNG push GitHub trong đợt này. Release gate vẫn giữ (không release/tag).

## 1. Đã làm gì

Thay `window.prompt` trong flow **Lưu thành…** trên desktop bằng dialog nhập tên
trong app (UI thật trong renderer):

- Mới: `apps/web/src/components/project/RenameProjectDialog.tsx` —
  component `RenameProjectDialog` + `promptProjectName(currentName): Promise<string|null>`
  (mount imperative bằng `createRoot` vào div gắn `document.body`; tái dùng CSS
  `.modal-backdrop/.modal/.modal-head/.modal-body/.modal-actions` sẵn có).
  Hành vi: input autofocus + select-all; Enter lưu, Escape hủy, click backdrop hủy,
  nút Hủy → `null`, nút Lưu → chuỗi đã trim; chuỗi trắng → `""` (giữ tên cũ, vẫn lưu);
  môi trường không có DOM → resolve `""` ngay; guard `pending` — gọi lần 2 khi dialog
  đang mở trả về cùng promise, không xếp chồng dialog.
  `data-testid`: `rename-project-dialog`, `rename-project-input`,
  `rename-project-save`, `rename-project-cancel`.
- `apps/web/src/desktop.ts` (chỉ vùng nhập tên/prompt + 1 import):
  `saveProjectDesktop(as, askName = promptProjectName)` — tham số `askName` injectable
  cho test. Khối `window.prompt` cũ thay bằng `await askName(...)` trong try/catch
  (throw → `name = ""`, giữ fallback D3 đợt 52); `null` → return `false` (hủy);
  tên khác trắng sau trim → `st.setProjectName`; trắng → giữ tên, vẫn mở dialog lưu.
  Không còn dòng code `window.prompt(` nào trong `desktop.ts` (chỉ còn trong comment).
- i18n: thêm 5 key dưới `projectMenu` ở cả `vi.json` và `en.json`:
  `renameTitle`, `renameLabel`, `renameHint`, `renameSave`, `renameCancel`.
- Test mới `apps/web/src/desktopSaveAs53J4.test.ts`; **xóa**
  `apps/web/src/desktopSaveAs52I3.test.ts` (test hành vi prompt cũ, không còn tồn tại).
  `apps/web/tsconfig.json` chỉ đổi 1 dòng exclude test tương ứng.
- Harness `apps/desktop/scripts/click-test-menu.mjs`: helper `driveRenameDialog`
  (poll tối đa 5s chờ `[data-testid="rename-project-dialog"]`, đọc input prefilled,
  set tên bằng native value setter + event `input`, click Save qua CDP, chờ dialog biến mất);
  M3 viết lại (đổi tên qua dialog); M4 đọc tên kỳ vọng động từ `.project-name` (trước đây
  hardcode `"Dự án mẫu"` — M3 đổi tên sẽ phá M4); diag D3 drive dialog trước khi chờ GTK;
  D2a drive dialog `null` (giữ nguyên tên); thêm `phaseD4` (D4a–D4e) + branch `--only d4`;
  thêm cờ CLI `--cdp-port` (mặc định 9231, fallback 9241) — các luồng song song đụng CDP.
- Cố tình KHÔNG sửa: `ProjectMenu.tsx:171` vẫn dùng `window.prompt` cho đường web
  không-desktop (guard bởi `isNativeDesktop()`, chạy được trên browser — ngoài phạm vi);
  bundle vẫn còn 1 `window.prompt` từ đường này.

## 2. Kiểm chứng code

- `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**.
- `npm run build` apps/web: **pass** (5,63s); bundle chứa `rename-project-dialog`
  (+ testid input/save); chỉ còn 1 `window.prompt` trong bundle (đường web).
- Test `desktopSaveAs53J4.test.ts`: **35/35 PASS**.
  T1 đổi tên (arg dialog = `defaultProjectFileName("Tên mới")`, envelope hợp lệ,
  current path được set), T2 Cancel (false, không dialog, không ghi), T3 trắng
  (true, giữ tên, file vẫn ghi), T4 `askName` throw (true, bỏ đổi tên, file vẫn ghi,
  không unhandled rejection), T5 `saveProjectDesktop(false)` có path sẵn
  (`askName` không được gọi, ghi đè), T6 `promptProjectName` thật không DOM → `""`,
  T7 parity i18n (key `projectMenu` vi==en + 5 key mới), T8 regression
  (không dòng code `window.prompt(` trong `desktop.ts`, trừ comment).
- **Đỏ-trước (unit):** tạm khôi phục `window.prompt` trong `desktop.ts` → test mới
  fail **10 assertion** (T1 ×5, T2 ×4, T8 ×1); khôi phục code → 35/35 xanh lại.
- `node --check` harness: OK.

## 3. Kiểm chứng E2E trên AppImage mới (display 145, CDP 9245)

- **Diag `--only diag`: 12/12 PASS.** D3: dialog xuất hiện (input điền sẵn
  `"Dự án mới"`), xác nhận OK, 0 exception, dialog GTK `"Lưu dự án"` 1124×822 mở,
  Escape đóng, không thêm cửa sổ 200×200; D0–D8 xanh; 200×200 vẫn unmapped (mapState=0).
- **Đỏ-trước (E2E):** trên AppImage cũ (sha `da2b85d5…`) diag **11/12** — D3 fail đúng
  chỗ `"dialog nhập tên trong app: KHÔNG xuất hiện"`, còn lại xanh.
- **Menu `--only menu`: 9 passed, 21 failed.** Pass: PRE ×2, M0 (sample 3 clip), W0,
  M1 (5 nhóm menu), M2 (8 hàng), **M3 (dialog đổi tên: input điền sẵn `"Dự án mẫu"`,
  xác nhận, tên thành `"M3 Doi ten"`, 0 exception, GTK mở, Escape đóng, không ghi file)**,
  M6 (dialog Add-media, Escape đóng — đợt 52 FAIL), M9 (new project).
  Fail là pattern đã biết từ đợt 52, KHÔNG phải regression của J4: M4 (GTK đóng qua
  Escape fallback, file không ghi — §5.1 đợt 52), M5 (onOpenFile false), M7 (submenu mở,
  onOpenFile true, nhưng tên `"Dự án không tên"` — xem §4), M8 (export-video action
  false — đợt 52 pass, lần này fail, khả năng flake focus/geometry sau dialog GTK),
  M10–M26 (action không tới renderer sau M9 — §5.2 đợt 52), M20–M24 (không thấy
  DevTools/dialog), M21 (minimize map-state vẫn 2), M26 (click Thoát false, exitCode=null
  — app vẫn sống).
- Report: `hidden_files/h9-j4/h9-report-diag-r53j4.json`,
  `hidden_files/h9-j4/h9-report-menu-r53j4.json`.

## 4. Bug mới phát hiện — KHÔNG sửa trong J4 (cho luồng sau)

**File `.vcut` bare-spec load sai tên `"Dự án không tên"`.**
`apps/web/src/lib/projectRepo.ts` — `loadProject`: `name` mặc định
`"Dự án không tên"` (~dòng 1011), chỉ được set từ `data.name` trong nhánh envelope
(`data.format === "vcut-project"`). Nhánh bare-spec (`else`, `spec = data`) không đọc
`spec.meta.name`. Fixture H9 là bare-spec nên M7, D1, D2b, D4c, D4d đều hiện
`"Dự án không tên"` thay vì `"H9 Doubleclick"` / `"H9 Second"` dù file load đúng
(currentPath đúng). D4d đã loại trừ check tên khỏi verdict vì bug này.
Phạm vi open-flow, thuộc khu vực J3 — không sửa trong J4.

## 5. D4 — kết luận: exitCode=127 là BUG THẬT, nhưng chỉ sau second-instance forward

Đo trên cùng AppImage sha `d5cbe6fe…`, 2 lượt chạy độc lập (display 145, CDP 9245):

| Case | Lượt 1 (21:45–21:46 UTC 06/11) | Lượt 2 (21:57–22:12 UTC 06/11) |
|---|---|---|
| D4a Thoát qua Tệp | exitCode=0 ✓ | exitCode=0 ✓ |
| D4b Đóng cửa sổ | exitCode=0 ✓ | exitCode=0 ✓ |
| D4c double-click .vcut khi app sống | instance 2 exit 0 ✓, onOpenFile ✓, instance 1 Thoát click true, **exitCode=127** ✗ | instance 2 exit 0 ✓, onOpenFile ✓, instance 1 Thoát **click false, exitCode=null** ✗ |
| D4d mở .vcut qua argv rồi Thoát | — | **không kết luận được** (xem dưới) |
| D4e sống 30s rồi Thoát | — | exitCode=0 ✓ |

Kết luận:

1. **Thoát bình thường luôn sạch (exitCode=0, 4/4 đo: D4a ×2, D4b ×2, D4e ×1).**
   Số 127 đợt 51 KHÔNG tái hiện trên quit thường — không phải bug thoát chung.
2. **127 là thật, nhưng chỉ trong kịch bản double-click `.vcut` khi app đang sống**
   (second-instance forward): lượt 1 instance 1 thoát với 127; lượt 2 instance 1
   không thoát được (click Thoát thất bại — menu bar chỉ còn 1 dải thay vì 5,
   cửa sổ ở trạng thái suy thoái sau khi nhận forward) và tiến trình **không chết
   sau SIGKILL + pkill** (zombie), chặn 2 lần launch tiếp theo (mỗi lần đốt 300s
   chờ CDP page target rồi mới retry thành công).
3. Không có `process.exit(127)` nào trong `apps/desktop/src` (chỉ `process.exit(1)`
   ở `crash.ts:84,117`) → 127 không phải mã thoát chủ đích của app; khả năng là
   mã thoát từ tiến trình con / wrapper khi shutdown sau forward, hoặc shell trả về
   khi binary con kết thúc bất thường. Chưa xác định được nguyên nhân gốc.
4. D4d lượt 2 **không có giá trị đo**: launch lần 1 thất bại (không thấy CDP page
   sau 300s) vì zombie D4c còn giữ port 9245/userdata; lần retry tuy lấy được page
   (currentPath đúng FIXTURE1) nhưng click Thoát vẫn false, exitCode=null — trạng
   thái cửa sổ đã nhiễm từ zombie. Cần đo lại D4d **cô lập** (display/port/userdata
   riêng, app không dính D4c trước đó).
5. Sau lượt 2: không còn tiến trình nào trên userdata/port 145 (pgrep sạch) — zombie
   cuối cùng tự chết khi retry thành công.

Đợt sau cần: đo D4d cô lập; điều tra shutdown sau second-instance forward
(log shutdown, trạng thái D-state của zombie, vì sao menu bar suy thoái 1 dải);
xem xét timeout/kill mạnh hơn trong harness khi instance không chết.

Report: `hidden_files/h9-j4/h9-report-d4-r53j4.json` (lượt 2: 5 passed, 2 failed).

## 6. Nợ mở khác

- M4/M5/M10–M26: pattern đã biết từ đợt 52, không đổi. M8 regressed so với đợt 52
  (khả năng flake, cần đo lại).
- **`.deb` build thất bại** trong lần package cuối (lỗi child-process trong
  `builder-util` tail; `.deb` vắng trong `release/`, chỉ có AppImage +
  `linux-unpacked` + `builder-debug.yml`). Ngoài phạm vi J4.
- **AppImage 401MB** (tăng từ 148MB đợt 52): `linux-unpacked/resources/vcut-server`
  1.1G (server/venv của I5 nay được đóng gói theo). Không phải lỗi đóng gói,
  nhưng cần xem lại kích thước gói trước khi ship.
- **CDP cross-talk (sự cố môi trường, không phải bug sản phẩm):** 2 lần chạy diag
  trên AppImage mới crash `"không tìm thấy cửa sổ chính"` (X11 trống, renderer vẫn
  sống qua CDP) vì devtools bind thất bại `"Address already in use"` — CDP đã gắn
  vào app của luồng khác. Đã sửa bằng cờ `--cdp-port` (J4 dùng 9245, display 145).
  Log app còn flood stdout bằng listing đệ quy cây AppImage đã giải nén
  (~10k dòng, 1.9–2.8MB/log) mỗi lần khởi động.
- **Build #1 thất bại `ETXTBSY: text file is busy`** — tiến trình AppImage của luồng
  khác đang chạy file release khi electron-builder ghi đè; build #2 fail do tsc
  của file luồng J5 đang sửa dở; build #3 (package-only, bỏ qua tsc/vite) mới ra
  AppImage. Các luồng song song vẫn phá `tsc` lẫn nhau giữa đợt — không sửa file
  của luồng khác.
- **Sai số nhỏ trong message harness (chưa sửa, ngoài phạm vi):**
  `click-test-menu.mjs:597` báo `"không thấy CDP page target sau 600s"` nhưng
  deadline thực tế là 300s (`:587`). Cosmetic.
- File workflow `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền,
  chờ user) — nợ cũ, không thuộc J4.

## 7. File đã chạm (J4)

Đổi: `apps/web/src/desktop.ts` (chỉ vùng nhập tên/prompt + import),
`apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json`,
`apps/web/tsconfig.json` (1 dòng: đổi exclude test 52I3 → 53J4),
`apps/desktop/scripts/click-test-menu.mjs` (helper + M3 + M4 + diag D3 + D2a +
phaseD4 D4a–D4e + cờ `--cdp-port` + branch main + comment header).
Thêm: `apps/web/src/components/project/RenameProjectDialog.tsx`,
`apps/web/src/desktopSaveAs53J4.test.ts`,
`docs/PHASE9_ROUND53_J4_RENAME_DIALOG_LIMITS.md` (file này).
Xóa: `apps/web/src/desktopSaveAs52I3.test.ts` (thay bằng test 53J4 — file đã xóa
không nằm trong paths file vì không tồn tại trên đĩa; lúc push cần kèm deletion).
Không stage: `apps/web/dist/*`, `apps/desktop/dist-web/*`, `apps/desktop/dist/*`,
`apps/desktop/release/*`, `~/.tmp-h9/vcut-53j4.AppImage` (bản pin để test),
`~/.tmp-h9/appimage-53j4-extract/`, `~/.tmp-pkg53j4/`, `/tmp/*.log`, `/tmp/*.cjs`,
`hidden_files/h9-j4/h9-report-*.json` (bằng chứng, giữ trong hidden_files).
