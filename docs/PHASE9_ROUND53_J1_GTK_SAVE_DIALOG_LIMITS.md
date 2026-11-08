# Phase 9 — Đợt 53 — Luồng J1: Dialog GTK "Lưu thành…" gõ path không ghi file

Ngày: 2026-11-07 (làm việc 2026-11-06 20:35 → 22:16 UTC, tức 2026-11-07 03:35 → 05:16 +07).
Repo: `~/workspace/repo-1` (vectornewsai-cmyk/repo-1, branch main). KHÔNG push trong
lượt này — chỉ stage file text; user tự push sau từ main chat.
Phạm vi: xác định dứt điểm vì sao gõ path qua dialog GTK "Lưu thành…" không ghi
file (nợ M4/M5/D2a đợt 52). Đọc trước: `docs/PHASE9_ROUND52_LIMITS.md` §4.3 +
`docs/PHASE9_ROUND52_I3_MENU_CLICKTEST_LIMITS.md`.

## 0. Kết luận ngắn (đọc phần này là đủ)

**Không còn bug sản phẩm nào chặn flow "Lưu thành…" trên code hiện tại.**
Trọn flow mới chạy xanh end-to-end trên source-run (vòng 9, 6/6 PASS) và trên
AppImage thật (vòng 10, 5/5 PASS — xem §6):
Ctrl+Shift+S → dialog đổi tên TRONG APP mở → Enter xác nhận tên → dialog GTK
"Lưu dự án" mở → click nút **Save** → file ghi thật, `currentPath` set đúng,
main log `dialog-save-project: canceled=false filePath=/home/hatch/J1-G1-shortcut-save.vcut`.

Hai "thất bại" tưởng là bug sản phẩm thực ra là 2 nguyên nhân khác nhau, đã tách bạch:

1. **Các lượt 2–7 fail không phải do bug — do flow đổi dưới chân J1 giữa chừng
   (đụng độ với J4).** 21:07 UTC ngày 06/11, J4 rebuild bundle web (dialog đổi tên
   trong app thay `window.prompt`, xem §3); 21:18 copy sang `apps/desktop/dist-web`.
   Vòng 1 chạy 21:01 UTC (bundle cũ, chưa có dialog đổi tên) nên dialog GTK mở
   được; các vòng 2–7 chạy sau 21:18 (bundle mới) nên flow dừng ở dialog đổi tên
   đang chờ nhập tên — không dialog GTK, không exception, không file. Đúng hành vi
   thiết kế, harness của J1 lúc đó không biết dialog mới này.
2. **Nhấn Return sau khi gõ path không submit dialog GTK trên Xvfb này** (vòng 1,
   E1/E2, 2/2 lần; dialog ở nguyên, Escape mới đóng, `canceled=true`). Đây là
   quirk tương tác GTK/Xvfb (chưa tách được GTK hay Xvfb — xem §4.3), KHÔNG phải
   bug sản phẩm: đường đi được hỗ trợ (click nút **Save**) ghi file đúng (vòng 9).
   Trong flow mới người dùng chỉ gõ tên file (không gõ full path vào dialog GTK),
   nên Return-gõ-path không còn là đường đi của sản phẩm nữa.
3. **Hai bug HARNESS (không phải bug sản phẩm) đã chứng minh và sửa trong script
   fork của J1** — chưa sửa file harness chung vì J2/J3 đang sửa cùng file, để
   parent merge (xem §5).

## 1. Thay đổi code trong lượt này (chỉ 2 file repo + 1 LIMITS)

| File | Đổi gì |
|---|---|
| `apps/desktop/src/main.ts` | Thêm 1 dòng log kết quả `showSaveDialog` trong handler `desktop:dialog-save-project` (comment `ROUND53-J1`): `log(\`dialog-save-project: canceled=${result.canceled} filePath=${result.filePath?? "(none)"}\`)`. Log xuất hiện ở `dist/main.js:487` sau build. Handler `save-video` không chạm (phạm vi tối thiểu). |
| `apps/desktop/scripts/click-test-gtk-save-53j1.mjs` | **Mới.** Script chẩn đoán fork từ `click-test-menu.mjs` (chỉ chạy flow dialog lưu; report riêng `hidden_files/h9/h9-report-gtk-save-53j1.json`, không ghi đè `h9-report.json` chung). Xem §5. |
| `docs/PHASE9_ROUND53_J1_GTK_SAVE_DIALOG_LIMITS.md` | File này. |

Không chạm: harness chung `apps/desktop/scripts/click-test-menu.mjs` (J2/J3 đang
sửa), `apps/web/src/*` (flow đổi tên là của J4), bất kỳ file nào khác.
Build artifact (không stage): `apps/desktop/dist/main.js` (đã build lại, log có),
`apps/web/dist/*`, `apps/desktop/dist-web/*` (bundle mới `index-CcjxMH90.js`,
rebuild 21:46 UTC ngày 06/11 từ source hiện tại).

## 2. Phương pháp

- Chạy trên `xvfb-run -a -s "-screen 0 1600x1000x24"` (không spawn Xvfb tay),
  source mode (`--source`: chạy `node_modules/electron/dist/electron` với
  `dist/` mới) — AppImage xem §6.
- Mỗi lượt: app mới, user-data-dir mới (`/tmp/h9-j1-userdata`), project mẫu load
  (SETUP: MediaBin có `mau-1`, timeline 3 clip). CDP port 9235/9236 (tránh
  9231/9241 của J2/J3). Dialog GTK chờ theo tiêu đề riêng `"Lưu dự án"` (15s),
  không dùng `waitAnyDialog` (vòng 3 nó trả về cửa sổ phụ electron 200×200
  trước khi dialog GTK kịp mở).
- Bằng chứng: report `hidden_files/h9/h9-report-gtk-save-53j1.json`, app log
  `hidden_files/h9/h9-j1-app.log`, screenshot `hidden_files/h9/shots/j1-*.png`,
  file đã lưu `hidden_files/h9/j1/J1-G1-shortcut-save.vcut` (copy từ $HOME sau khi
  verify, file gốc ở $HOME đã dọn).

## 3. Phát hiện then chốt: flow đổi dưới chân giữa chừng (J4)

- Vòng 1 (21:01 UTC): bundle cũ `index-DAcH2F5R.js` (fix D3 đợt 52: try/catch
  quanh `window.prompt`) → menu "Lưu thành…" mở dialog GTK ngay.
- 21:07 UTC: bundle web rebuild thành `index-CwcDTNVS.js`; 21:18 copy sang
  `apps/desktop/dist-web`. Bundle mới chứa logic J4: `saveProjectDesktop(true)`
  gọi `askName` (mặc định `promptProjectName` → `RenameProjectDialog` trong app)
  thay `window.prompt`. Nguồn `apps/web/src/desktop.ts` mtime 21:28 (sửa sau bản
  build 21:07 — nhưng logic J4 đã có trong bundle 21:07; lần sửa 21:28 không đổi
  logic này, đã đối chiếu code minified `Fc(e,t=vT)` với source hiện tại).
- Kiểm chứng bundle: `window.prompt` còn đúng 1 lần trong bundle (của
  ProjectMenu, đã guard bởi `isNativeDesktop()`); `saveProjectDialog` 1 lần;
  `promptProjectName`/`RenameProjectDialog` không xuất hiện dạng chuỗi (tên đã
  minify) nhưng logic `try { u = await t(...) } catch { u = "" }` có mặt.
- Hệ quả: các vòng 2–7 (chạy sau 21:18) đều dừng ở dialog đổi tên trong app
  đang chờ nhập tên — giải thích trọn vẹn: action tới renderer (probe ghi
  nhận), listener sống (export-video Ctrl+E mở panel, H1 PASS), 0 exception,
  0 console error, G2 (gọi thẳng `saveProjectDialog` qua CDP, bypass bước hỏi
  tên) mở dialog GTK bình thường.
- J1 đã rebuild web + copy dist-web 21:46 UTC (`index-CcjxMH90.js`, vẫn chứa
  logic J4) rồi chạy vòng 8/9 trên bundle tươi từ source hiện tại — loại trừ
  mọi nghi ngờ bundle cũ/mới.

## 4. Kết quả từng thử nghiệm

### 4.1 Vòng 1 — bundle cũ, flow D3 (21:01 UTC, 5 thử nghiệm)

| # | Thử nghiệm | Kết quả |
|---|---|---|
| E1 | Baseline đúng flow đợt 52: menu → click giữa dialog → Ctrl+L → gõ full path → Return | **FAIL.** Dialog ở nguyên sau Return; chỉ Escape mới đóng. Main log: `dialog-save-project: canceled=true filePath=` (trống). Không file, `currentPath=null`, 0 exception. Screenshot `j1-e1-typed.png` (quyết định): path gõ VÀO ĐƯỢC ô Name, nhưng thành `/home/.../h9/j1/J1-E1-baseline.vcut.json` — full path gõ vào + hậu tố `.vcut.json` còn lại từ tên mặc định `Du an mau.vcut.json` (chỉ `Du an mau` được chọn; gõ thay phần chọn, giữ hậu tố). Breadcrumb vẫn ở `hatch`; danh sách file vẫn $HOME (không điều hướng). |
| E2 | + `XSetInputFocus` lên dialog trước khi gõ | **FAIL** giống E1. Focus không phải nguyên nhân. |
| E3/E5 | Click nút Save thay Return | **FAIL — harness, không phải sản phẩm.** `click-save-fail: không thấy dòng nút ở đáy dialog` — nút chưa bao giờ được click thật (bug axis của `clickDialogButton`, §5.1). |
| E4 | Mở lại menu sau dialog | **FAIL** — popup Tệp không mở (focus flake sau dialog, vấn đề Xvfb đã biết). |

Ảnh dialog lúc mở (`j1-e1-dialog-open.png`): ô Name `Du an mau.vcut.json`
(viền xanh/focus, `Du an mau` được chọn); dialog 1124×822@0,0; Cancel/Save
dưới-phải; filter "Dự án VCut".

### 4.2 Vòng 2–7 — bundle mới (J4), chưa biết dialog đổi tên

| # | Thử nghiệm | Kết quả |
|---|---|---|
| F1–F3 | Click "Lưu dự án" trong popup Tệp (popup mở đúng, 8 hàng, có screenshot) | **FAIL** cả 3: dialog GTK không xuất hiện sau click hàng. (Sau này rõ: flow dừng ở dialog đổi tên trong app.) |
| Vòng 3 | Ctrl+Shift+S + `waitAnyDialog` | **FAIL** — `waitAnyDialog` trả về cửa sổ phụ electron 200×200 trước khi dialog GTK mở; các bước sau gõ/click nhầm cửa sổ. Bài học: không dùng `waitAnyDialog` cho dialog này. |
| Vòng 4 | Ctrl+Shift+S + chờ riêng tiêu đề "Lưu dự án" 15s; đối chứng G2 gọi thẳng `window.vcutDesktop.saveProjectDialog(...)` qua CDP | **FAIL / PASS.** Shortcut: action tới, **không dialog sau 15s**. G2: dialog GTK **mở**. Đường IPC renderer→main→dialog sống; đường menu/shortcut không mở dialog. |
| Vòng 5 | Như vòng 4 + bắt exception | **FAIL** — 0 exception mới, 0 console error mới. Loại trừ "handler chạy rồi ném". |
| Vòng 6 | H1 Ctrl+E (export-video); H2 Ctrl+Shift+S | **H1 PASS** (action tới VÀ panel Xuất mở, textLen 3965→6129 — listener menu sống). **H2 FAIL** (không dialog, 0 exception). Lỗi chỉ ở đường save-as, sau listener sống. |
| Vòng 7 (lần 1) | Thử `window.prompt()` trực tiếp | **VÔ HIỆU** — SETUP fail, renderer kẹt TRƯỚC probe (màn hình đen, evaluate timeout; load máy 5.90–7.01, J2/J3/J4 chạy song song). Kết quả bỏ, không tính. |
| Vòng 7 (làm lại) | I1 `window.prompt()` trên renderer khỏe (check `1+1`=2 trước probe); I2 Ctrl+Shift+S trên cùng renderer | **I1 PASS** — `prompt()` ném `prompt() is not supported.` (đúng kỳ vọng D3; fix try/catch đúng). **I2 FAIL** — không dialog sau 15s. |

### 4.3 Vòng 8 — xác nhận dialog đổi tên + thử click Save (finder cũ)

Bundle tươi `index-CcjxMH90.js` (rebuild web + copy dist-web 21:46 UTC).

| # | Thử nghiệm | Kết quả |
|---|---|---|
| J1 | Ctrl+Shift+S → probe DOM `[data-testid="rename-project-dialog"]` (tới 10s) | **PASS** — dialog đổi tên trong DOM, input=`"Dự án mẫu"`; action `save-project-as` tới renderer. Screenshot `j1-j1-rename-dialog.png`. |
| J2a | Enter xác nhận tên → chờ dialog GTK "Lưu dự án" 15s | **PASS** — dialog GTK mở, 1124×822. |
| J2b | Click ô Name → Ctrl+A → gõ chỉ tên file `J1-G1-shortcut-save.vcut` → click nút Save (finder cũ, minGap=6) | **FAIL — harness.** Finder chỉ thấy **1 cột** [944–1117], tâm 1030.5; click rơi vào khe giữa 2 nút; dialog không đóng (`click-save-no-close` + Escape dọn); main log `canceled=true filePath=`; không file; `currentPath=null`. Nguyên nhân: §5.2. |

### 4.4 Vòng 9 — chạy lại vòng 8 với finder đã sửa (minGap=3)

**6/6 PASS** (toàn bộ lượt):

| # | Kết quả |
|---|---|
| J1-PRE | `dist/main.js` có log `dialog-save-project` (ROUND53-J1); electron binary có sẵn. |
| J1-SETUP | Project mẫu load (clip count=3). |
| J1-J1 | Rename dialog trong DOM (input=`"Dự án mẫu"`), action tới. **PASS.** |
| J1-J2a | Sau Enter: dialog GTK "Lưu dự án" mở. **PASS.** |
| J1-J2b | Nút Save tìm được: **2 cột**, hàng 799; dialog đóng bởi **click-save**; main log `dialog-save-project: canceled=false filePath=/home/hatch/J1-G1-shortcut-save.vcut`; file ở $HOME **CÓ** (meta `"Dự án mẫu"`, 2 tracks, JSON hợp lệ; đã copy về `hidden_files/h9/j1/J1-G1-shortcut-save.vcut` rồi dọn file $HOME); `currentPath=/home/hatch/J1-G1-shortcut-save.vcut`. **PASS.** |

### 4.5 Về câu hỏi gốc M4/M5/D2a

- **Gõ path qua dialog GTK không ghi file — đã rõ:** trên flow cũ (vòng 1),
  gõ full path vào ô Name + Return không submit (2/2). Trên flow mới, click
  **Save** ghi file đúng (vòng 9). **Không có bug sản phẩm** chặn lưu.
- **Return không submit:** còn mở là quirk môi trường (GTK trên Xvfb không WM)
  hay hành vi GTK khi ô Name chứa path có dấu `/` — chưa tách được, và không
  còn là đường đi của sản phẩm (flow mới chỉ gõ tên file). Ghi nhận là nợ mở,
  không chặn gì: người dùng thật click Save (hoặc Enter khi ô Name chỉ có tên
  file — chưa thử riêng trường hợp này, xem §7).
- **Hậu tố `.vcut.json` còn lại khi gõ path (vòng 1):** hành vi GTK chooser khi
  chỉ phần tên gốc được chọn; gõ thay phần chọn, giữ hậu tố. Không phải bug
  sản phẩm. Trong flow mới, tên mặc định vẫn `Du an mau.vcut.json` nhưng người
  dùng xác nhận tên ở dialog trong app trước, dialog GTK chỉ là bước chọn vị
  trí/lưu.

## 5. Bug harness đã chứng minh (chưa sửa file chung — J2/J3 đang sửa)

Cả 2 bug sống trong script fork của J1 (`click-test-gtk-save-53j1.mjs`); file
chung `click-test-menu.mjs` **không chạm** trong lượt này. Parent merge 2 sửa
này vào harness chung khi J2/J3 xong.

### 5.1 `clickDialogButton`: trục X/Y bị tráo (gốc của E3/E5 fail)

Hàm gốc gọi `textBands(img, {axis:"y", from:height-55, to:height})` — nhưng với
axis `"y"`, from/to là **khoảng X**, không phải khoảng Y. Trên dialog 1124×822
nó quét dải x∈[767,822) (vùng trống) → luôn "không thấy dòng nút". Chứng minh
offline trên `j1-e3-savebtn.png`: quét đúng ý đồ (55px cuối) = `[]`; quét toàn
chiều rộng thấy các hàng, gồm hàng nút y 782–815. Bản sửa trong fork:
`findDialogSaveButton` quét toàn chiều rộng, lấy hàng chữ cuối (= hàng nút),
cột phải nhất (= Save).

### 5.2 Cột nút Cancel/Save cách nhau chỉ ~4px (gốc của vòng 8 J2b fail)

Chữ "Cancel" và "Save" trong hàng nút cách nhau ~4px (map text x=900..1124:
`####…####..####…####`). `textBands` với minGap=6 gộp 2 nút thành 1 band
[944–1117] → click tâm 1030.5 rơi vào khe giữa 2 nút → dialog không đóng.
Chứng minh offline trên `j1-savebtn-scan.png`:

| minGap | Kết quả cột |
|---|---|
| 6 / 12 | 1 cột [944–1117], tâm 1030.5 (sai — khe giữa 2 nút) |
| 3 / 2 | 2 cột: Cancel [944–1028] tâm 986 + Save [1033–1117] tâm 1075 (đúng) |

Sửa trong fork: `findDialogSaveButton` dùng minGap=3 cho lần quét cột; vòng 9
xanh với tâm Save (1075, 799). Lưu ý: hàm `clickDialogButton` cũ (bản copy
harness chung) vẫn còn trong fork nhưng không còn được gọi — chỉ để tham chiếu.

### 5.3 XAuth dưới xvfb-run (đã sửa trong fork)

xvfb-run khởi động Xvfb với `-auth` (`$XAUTHORITY=/tmp/xvfb-run.XXX/Xauthority`,
MIT-MAGIC-COOKIE-1). Harness cũ tự spawn Xvfb không auth nên setup không-auth
chạy được; dưới xvfb-run server từ chối setup: `"Authorization required, but no
authorization protocol specified"` (status 0). Fork thêm `X11.readXAuthCookie()`
(đọc `$XAUTHORITY` hoặc `~/.Xauthority`, khớp số display + `MIT-MAGIC-COOKIE-1`)
và gửi cookie trong setup request — đã verify X11 nối được, XTEST OK. Nếu
harness chung muốn chạy dưới `xvfb-run -a`, cần sửa này.

## 6. Kiểm chứng

- `tsc --noEmit` apps/desktop: **0 lỗi** (exit 0).
- `tsc --noEmit` apps/web: **0 lỗi** (exit 0, chạy bằng `./node_modules/.bin/tsc`
  trực tiếp; `npx tsc` fail EPERM do `~/.npm` thuộc root — xem ghi chú môi
  trường dưới).
- Test hồi quy: file đợt 52 `apps/web/src/desktopSaveAs52I3.test.ts` đã bị J4
  **xóa** (thay bằng `desktopSaveAs53J4.test.ts` vì `desktop.ts` không còn gọi
  `window.prompt`). Chạy test thay thế đúng mẫu header của nó (esbuild bundle
  rồi `node`, bundle ra `hidden_files/h9/j1/desktopSaveAs53J4.test.cjs` — không
  để /tmp): **35/35 PASS, 0 FAIL, "ALL PASS"** (T1–T8: đổi tên/hủy/trắng/ném/
  lưu thẳng/không DOM/i18n/regression D3). Lưu ý: test T7 đọc `apps/web/src/i18n/*.json`
  bằng đường dẫn tương đối nên **phải chạy từ repo root**; chạy từ `~` crash
  `ENOENT ... i18n/vi.json` sau T6 (exit 2) — lỗi cwd của người chạy, không phải
  lỗi test. (Bản bundle `.cjs` và output `j4-test-out.txt` nằm ở `h9/j1/`, không
  đưa vào batch.)
- **AppImage: build lần 1 FAIL ở bước đóng gói, build lần 2 ra AppImage thật
  và vòng 10 đã xanh 5/5 trên chính file đó** (xem §6). Lần 1 fail EPERM nhất
  thời khi copy `vcut-server`; lần 2 qua được và AppImage hoàn chỉnh.
- **Build lần 1 (21:59 UTC) FAIL ở electron-builder khi copy `vcut-server`:**
  `Compound error: EPERM copyfile '.../server/tts/.venv/.../fusion_attention.cpython-312.pyc'
  -> '.../release/linux-unpacked/resources/vcut-server/...'` (log:
  `hidden_files/h9/j1-appimage-build.log`). Web build, desktop build,
  prepackage (19.686 file / 1.678,9 MiB) và `app.asar` (3.558.084 byte) đều
  OK trước đó; bản unpacked đã copy được 407M rồi mới lỗi. Đây KHÔNG phải lỗi
  quyền file thật: cùng file đó copy tay bằng `cp` và bằng `node
  fs.copyFileSync` (cả thường lẫn `COPYFILE_FICLONE`) đều OK ngay sau đó.
  Lần khởi động build đầu tiên (21:54, không `setsid nohup`) exit 1 chỉ sau
  ~0,2s, không ghi gì vào log (runtime báo về muộn sau khi lượt đã xong) —
  npm chết ngay lúc khởi động, khớp kiểu lỗi EPERM khi npm ghi `~/.npm`
  (thư mục thuộc root) như đã gặp ở `npx tsc`/`npx vitest`; lần retry
  (22:06, `setsid nohup`) chạy được bình thường nên nguyên nhân không ổn
  định — có thể do va chạm với tiến trình npm khác cùng lúc.
  Vòng 10 trung gian đã chạy trên binary unpacked của lần 1
  (`release/linux-unpacked/vcut-studio`, sha `d5cbe6fe8eb27ea8…`): 5/5 PASS —
  bằng chứng code đóng gói đúng ngay cả trước khi có AppImage thật.
- **Build lần 2 (retry) — AppImage XONG, .deb fail (không liên quan J1).**
  Khởi động 22:06 UTC, log `hidden_files/h9/j1-appimage-build2.log`: lần này
  bước copy `vcut-server` qua được (không EPERM — chứng tỏ lỗi lần 1 là nhất
  thời, rất có thể do J8 đang build venv song song lúc đó), AppImage build
  xong + block map xong: `release/vcut-studio-0.1.0-x86_64.AppImage`
  **576.688.128 byte, sha256 `2a15ea90c61e86ff1ed69dc15f6eb27153533bb2749690cea933fbc2ca82c819`**
  (22:12). Bước `.deb` sau đó fail ở fpm (Ruby, exit code 1) — lỗi đóng gói
  .deb, không ảnh hưởng AppImage và không thuộc phạm vi J1.
- **Vòng 10 — AppImage thật `vcut-studio-0.1.0-x86_64.AppImage`: 5/5 PASS.**
  Chạy script chẩn đoán ở chế độ mặc định (AppImage release, không `--source`):
  PRE check sha test == sha release (`2a15ea90c61e86ff…`, 576.688.128 byte);
  SETUP PASS; J1 rename dialog trong DOM PASS; J2a dialog GTK mở sau Enter
  PASS; J2b click Save PASS — nút Save 2 cột, hàng 799; dialog đóng bởi
  click-save; main log `dialog-save-project: canceled=false
  filePath=/home/hatch/J1-G1-shortcut-save.vcut`; file ghi (meta "Dự án mẫu",
  2 tracks, JSON hợp lệ); `currentPath` set đúng. **Trọn flow "Lưu thành…"
  đã xanh trên bản đóng gói thật.**

## 7. Nợ mở

1. **File `.deb` chưa build được** (fpm fail ở build lần 2, §6) — không thuộc
   phạm vi J1 (chỉ cần AppImage để kiểm chứng; AppImage đã xanh 5/5).
   Nợ đóng gói .deb để luồng khác xem. **Vòng 10 trên AppImage đã xong
   (5/5 PASS)** — không còn nợ AppImage.
2. **Return trong dialog GTK** (vòng 1, flow cũ): chưa tách được GTK hay Xvfb;
   chưa thử Enter khi ô Name chỉ có tên file (không path) trên flow mới. Không
   chặn sản phẩm (click Save xanh). Nếu ai đó muốn đóng: thử Enter sau khi gõ
   tên file đơn (không `/`) trong dialog GTK trên Xvfb và trên máy thật có WM.
3. **Merge 2 sửa harness (§5.1, §5.2, §5.3) vào `click-test-menu.mjs`** — sau
   khi J2/J3 xong phần của họ, hoặc parent tự merge. Fork của J1 giữ bản sửa
   để tham chiếu.
4. **Test J4 `desktopSaveAs53J4.test.ts` phụ thuộc cwd** (T7 đọc i18n bằng
   đường dẫn tương đối) — nên sửa thành đường dẫn theo `__dirname`/URL của
   file test để chạy từ đâu cũng được. Nợ của J4, J1 chỉ ghi nhận (đã chạy đúng
   từ repo root: 35/35).
5. `~/.npm` thuộc root (`drwxrws--- root nogroup`) khiến `npx` (tsc/vitest)
   fail EPERM — J1 vòng qua bằng binary trực tiếp trong `node_modules/.bin`.
   Nợ môi trường VM, không liên quan sản phẩm. (Vitest cũng không có sẵn trong
   repo — test J4 chạy bằng esbuild+node theo header của nó.)
6. Nợ cũ đợt 52 **không thuộc J1** (ghi lại để khỏi quên): M10–M26 menu action
   không tới renderer sau M9 (J2); M6 Escape không đóng dialog Add-media; M7
   Recent hover; D4 exitCode=127; GPU FATAL trên Xvfb; `.github/workflows/ci-security.yml`
   vẫn 403 chưa lên GitHub (repo không có CI chạy thật).

## 8. File trong batch (stage)

- `apps/desktop/src/main.ts` (log ROUND53-J1)
- `apps/desktop/scripts/click-test-gtk-save-53j1.mjs` (mới)
- `docs/PHASE9_ROUND53_J1_GTK_SAVE_DIALOG_LIMITS.md` (file này)

Không đưa binary/dist vào batch. File stage NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round53-j1-gtk-save-dialog.txt`
(verify read-back bằng `tr '\0' '\n'` + kiểm tra từng file tồn tại).
File tạm không stage, dọn cuối lượt: `hidden_files/h9/j1-main-fragment.mjs`
(đã splice vào script chẩn đoán), file `.vcut` lẻ ở $HOME (đã dọn sau vòng 9).
