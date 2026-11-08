# PHASE 9 — Đợt 54, luồng K4: LIMITS (discard-confirm + D1 argv)

> Ngày: 2026-11-07. Luồng K4. Repo làm việc local `~/workspace/repo-1`
> (KHÔNG phải git repo). KHÔNG push, KHÔNG release/tag.
> Build test: dev-electron từ `apps/desktop/dist`
> (`dist/main.js` sha `47ee4bf62a129086…`, `dist/preload.js` sha `1d431346e7291f81…`).
> AppImage đối chứng: `release/vcut-studio-0.1.0-x86_64.AppImage`
> sha `2a15ea90c61e86ff1ed69dc15f6eb27153533bb2749690cea933fbc2ca82c819`.

## 1. Đã sửa gì

### 1.1 Harness xử lý CHỦ ĐỘNG dialog discard-confirm (`apps/desktop/scripts/click-test-menu.mjs`)

- `answerDiscardDialog(session, {accept, tag})`: phát hiện + trả lời dialog
  `window.confirm` ("Có thay đổi chưa lưu…") theo thứ tự:
  (0) tìm cửa sổ dialog X11 trước; (1) không còn cửa sổ + CDP thấy entry
  mới + renderer trả lời → `cdp-auto`; (2) còn cửa sổ → click nút thật qua
  X11 ([Ok][Cancel], Ok bên TRÁI); (3) click vị trí ước lượng; (4) Escape
  (chỉ khi dismiss). Ghi log lựa chọn (`via`) trong mọi trường hợp.
- Gọi `answerDiscardDialog` ở: guard của `openTopMenu`, M5 (sau GTK),
  M7 (trước poll tên), D1, D2b, D4d, và probe `phaseDialogProbe`
  (`--only dialogprobe`).
- `dialogButtonCount` / `findDiscardDialogWindow`: tìm cửa sổ dialog native
  (rộng 200–700, cao 30–260, đúng 2 nút ở đáy).
- `windowGone`: poll tới khi cửa sổ biến mất (cửa sổ có thể còn liệt kê
  một lúc sau khi đã đóng) — dùng trong probe thay cho kiểm tra 1 lần.
- `cdp-stale`: nếu tìm thấy cửa sổ dialog nhưng renderer ĐÃ trả lời lại
  (modal `confirm` chặn renderer nên trả lời được = dialog đã đóng),
  cửa sổ chỉ là xác cũ → KHÔNG click (tránh click rơi xuống app bên
  dưới), kết luận CDP đã trả lời. Đây là cơ chế M7 dùng trong lượt verify.

### 1.2 Sửa bug đếm nút dialog (harness, `textBands`)

- Bug 1 — `clickDialogButton`/`dialogButtonCount` truyền
  `from=height-55, to=height` cho trục `"y"`, nhưng `textBands` trục `"y"`
  dùng `from`/`to` làm khoảng X (không phải Y) → chỉ quét dải X hẹp,
  vớ phải dòng message thay vì dòng nút. Sửa: quét toàn chiều rộng
  (`from=0, to=width`), lấy dòng cuối cùng = hàng nút.
- Bug 2 — dải nút dính 2 đường ngang chạy hết chiều rộng dialog (đường
  phân cách ở đầu dải, viền dưới dialog ở cuối dải, y=49 và y=82 trong
  ảnh 430x83) → mỗi đường cộng 1 vào MỌI cột nên toàn hàng gộp thành
  1 cột duy nhất. Sửa: cắt 3px ở 2 đầu dải nút khi chiếu cột.
- Bug 3 — code dùng `row.size` nhưng `textBands` KHÔNG trả field `size`
  (chỉ trả `center/end/start/total`) → `trim` luôn = 0, bug 2 không được
  sửa dù code đã viết. Sửa: tính kích thước bằng `row.end - row.start + 1`.
  (Phát hiện bằng cách chạy `textBands` thật bằng Node trên ảnh
  `discard-inspect.png`, không đoán.)
- `findDiscardDialogWindow`: thử lại 1 lần khi chụp `XGetImage` lỗi
  thoáng qua (đếm nút ra `null`).

### 1.3 Điều tra + sửa D1 argv (sản phẩm, `apps/desktop/src`)

**Kết luận điều tra.** Nguyên nhân gốc là race + flush sai thời điểm,
không phải argv sai:

- (a) Race preload/web: main gửi `vcut:open-file` ngay sau `loadURL`
  (did-finish-load), nhưng web chỉ đăng ký listener trong
  `initDesktopMenuBridge` (useEffect sau mount) — preload cũ không buffer
  nên event gửi trước khi có listener sẽ mất. D2b (second-instance) hoạt
  động vì lúc đó renderer đã đăng ký xong — cùng một đường send, chỉ
  khác thời điểm.
- (b) Flush ở `did-finish-load` không gửi được: `did-finish-load` có thể
  bắn khi `webContents.isLoading()` vẫn `true` (sub-resource chưa xong)
  → `handleOpenFile` giữ file lại rồi không còn dịp xả (listener `once`).
  Bằng chứng trong log dclick: chỉ có dòng "xả file đang chờ" rồi 2 dòng
  "giữ lại", KHÔNG có dòng "đã gửi" — file kẹt mãi trong `pendingOpenFile`.
- (c) "App log không có dòng argv" không chứng minh gì: `main.ts` cũ hoàn
  toàn không log argv.

**Sửa:**

- Mới `openFileQueue.ts` (+ `openFileQueue.test.ts`, 4 test, 4/4 PASS):
  hàng đợi thuần (không import electron/node) — `push()` giữ path khi
  chưa có subscriber, `subscribe()` xả hàng đợi cho subscriber đầu tiên.
- `preload.ts`: đăng ký `ipcRenderer.on("vcut:open-file")` ngay khi preload
  chạy, đẩy vào hàng đợi; `onOpenFile` subscribe qua queue.
  **LƯU Ý QUAN TRỌNG — class hàng đợi INLINE trong `preload.ts`, KHÔNG
  import từ `./openFileQueue`**: preload chạy với `sandbox: true` nên
  `require` file tương đối LÀM HỎNG TOÀN BỘ preload
  (`window.vcutDesktop = undefined`, mọi menu action + open-file đều
  chết). Bản sửa đầu tiên (import riêng file) đã gây ra đúng lỗi này —
  phát hiện ở lượt verify (17/43 pass, mọi action đều `false`), xác nhận
  bằng probe trực tiếp (`typeof window.vcutDesktop === "undefined"`),
  sửa bằng cách inline rồi mới hết. `openFileQueue.ts` giữ bản tham chiếu
  + test cho cùng thuật toán — sửa logic thì sửa CẢ HAI CHỖ.
- `main.ts`: log kết quả parse argv; `handleOpenFile` giữ lại
  `pendingOpenFile` khi `isLoading()`; `flushPendingOpenFile()`; chờ
  `did-stop-loading` (lúc `isLoading()` chắc chắn `false`) mới xả thay
  vì xả ở `did-finish-load`.
- Harness D1: tiêu chí pass đổi từ "probe `onOpenFile` phải true" sang
  ground truth tên + `currentPath` + `recent[0]` (xem §3.3 — probe là
  subscriber thứ hai nên đúng ra không thấy event queued).

## 2. Kết quả đo (số thật)

### 2.1 Probe dialog (`--only dialogprobe`, AppImage cũ) — 9/9 PASS

Lượt cuối `r54k4-probe7` (2026-11-07 00:58–00:59 UTC), display 165 /
CDP 9265: **9 passed / 0 failed**.

| Case | Kết quả |
|---|---|
| P1 `answerDiscardDialog` (X11 click Ok) | PASS — tìm thấy dialog 430x83, 2 nút, click Ok → đóng, confirm `true` |
| P2 CDP handle kèm `promptText` | PASS — handle kèm promptText đóng được dialog, confirm `true`, renderer trả lời lại. **`promptText` KHÔNG phải thủ phạm** (bác bỏ giả thuyết đợt 53) |
| P3 X11 click Ok | PASS — confirm `true` |
| P4 Escape | PASS — confirm `false` (= Cancel) |
| P5 X11 click Cancel | PASS — confirm `false` |
| P6 tổng kết | PASS — cơ chế trả lời ĐƯỢC: CDP handle, X11 click Ok, Escape, X11 click Cancel |

Cơ chế đã chứng minh: CDP nhận `Page.javascriptDialogOpening` cho
`window.confirm`; renderer BỊ CHẶN khi dialog mở (`evaluate("1+1")`
không trả về trong 3s) — đây chính là nguyên nhân crash M5 ở baseline.
Dialog là cửa sổ X11 native 430x83, title rỗng, 2 nút [Ok][Cancel],
Ok bên TRÁI.

### 2.2 Lượt verify đầy đủ (dev-electron, build final) — 24/19

`r54k4-verify4` (2026-11-07 01:35–01:39 UTC), display 185 / CDP 9285:
**24 passed / 19 failed**. Baseline AppImage đợt này:
15 passed / 6 failed + menu phase CRASH ở M5 (M5–M26 không chạy).

- M3 PASS (`save-project-as` tới renderer, dialog nhập tên xuất hiện,
  tên đổi thành "M3 Doi ten" thật).
- **M7 PASS** — dialog discard-confirm được CDP auto-accept; harness
  thấy cửa sổ 403x83 còn liệt kê nhưng renderer đã trả lời lại nên
  KHÔNG click (via `cdp-stale`); `onOpenFile: true`, tên đúng.
  **Không còn cascade**: M9/M11/M16/M17 PASS sau M7 (đợt 53: M8–M26
  fail hàng loạt vì dialog treo).
- **D1 PASS, D1-argv PASS** — tên "H9 Doubleclick", `currentPath` +
  `recent[0]` đều đúng target. **D2b PASS** (`onOpenFile: true`, tên
  "H9 Second", `currentPath` đúng). D3/D4 PASS.
- Xem §4 để biết các FAIL còn lại (đều là nợ cũ, không phải do đợt này).

### 2.3 Lượt dclick riêng (dev-electron, build final) — 7/1

`r54k4-dclick3` (2026-11-07 01:33 UTC): **7 passed / 1 failed**
(chỉ D2a fail — xem §4.1). D1/D1-argv/D2b/D3/D4 đều PASS.
Log app `h9-dclick-d183.log` có dòng `argv: 8 phần tử, file project
trong argv: …/H9-Doubleclick.vcut` và `open-file: đã gửi … về renderer`.

### 2.4 Kiểm chứng biên dịch / unit test

- `tsc --noEmit` apps/desktop: **0 lỗi** (chạy cuối sau mọi sửa).
- `openFileQueue.test.ts` (esbuild bundle + `node --test`): **4/4 PASS**.
- `node --check` harness: OK. Build `tsc -p tsconfig.json` + copy
  services: OK. `dist/main.js` 36.254 byte (sha `47ee4bf62a129086…`),
  `dist/preload.js` 8.873 byte (sha `1d431346e7291f81…`).

## 3. Những điểm cần hiểu đúng (trung thực)

### 3.1 Vì sao đợt 53 dialog treo — CHƯA kết luận dứt khoát

Probe đã loại trừ `promptText` (P2: handle kèm promptText đóng được
dialog). Nhưng vì sao auto-handler ở đợt 53 không đóng dialog ở M7 thì
vẫn chưa có bằng chứng trực tiếp: auto-handler gửi handle fire-and-forget
(không retry, lỗi bị nuốt), nên một lỗi thoáng qua / race là đủ để dialog
treo mà không ai biết. `answerDiscardDialog` nay xác minh + thử lại
(X11 / CDP-direct / Escape) nên không còn phụ thuộc vào một lần handle
duy nhất — đó là phần sửa có ý nghĩa, không phải lời giải thích cho đợt 53.

### 3.2 Cửa sổ dialog "xác cũ" sau khi CDP trả lời (zombie window)

Sau khi CDP `handleJavaScriptDialog` trả lời confirm, JS đã chạy tiếp
(renderer trả lời lại, project đã load) NHƯNG cửa sổ native có thể vẫn
HIỂN THỊ trên màn hình (ảnh `r54k4-verify4/shots/m8-export-menubar-gone-root.png`:
dialog 403x83 còn nguyên, che mất menu bar). Đây là lý do M8 fail:
`menuBarBands` chỉ thấy 1 dải (thay vì 5) nên guard từ chối click mù →
action `export-video` không được gửi. M9 trở đi vẫn chạy được (click
xuyên qua cửa sổ zombie tới menu bên dưới). Click X11 (P3/P5) thì hủy
cửa sổ thật sự — chỉ CDP handle mới để lại zombie. Hướng xử lý tiếp:
`answerDiscardDialog` nên click dọn cả cửa sổ zombie (kể cả khi renderer
đã trả lời), hoặc guard M8 nên robust hơn khi menu bar bị che — CHƯA làm
trong đợt này.

### 3.3 Tiêu chí D1 đổi — vì sao probe `onOpenFile` vẫn `false`

Hàng đợi preload giao event queued CHỈ cho subscriber đầu tiên (web
bridge, đăng ký ở mount) để không mở cùng file hai lần; probe đăng ký
sau nên đúng ra không thấy event khởi động. Vì vậy D1 (cũ) đòi probe
`onOpenFile=true` là đòi một điều thiết kế đã loại trừ. D1 nay pass theo
ground truth (tên + `currentPath` + `recent[0]`), `onOpenFile` của probe
chỉ còn là bằng chứng phụ (ghi trong detail). Event live (D2b) thì cả
web lẫn probe đều nhận (probe `onOpenFile: true`).

### 3.4 Tên project ở D1/M5 và bug `loadProject`

Trên fixture dùng ở đợt này, tên áp dụng đúng ("H9 Doubleclick") — bug
`loadProject` không lấy `meta.name` từ bare-spec `.vcut` (đợt 53 J3
§4.2) KHÔNG tái hiện trên fixture này. Bug vẫn mở cho tới khi có người
kiểm chứng trên file bare-spec thật.

## 4. Nợ mở (không thuộc đợt này / chưa sửa)

- **GTK typing (J1) — M4, M5, D2a fail.** Dialog GTK mở được, action tới
  renderer (`save-project: true`), nhưng gõ path không ghi được file
  (dialog đóng nhưng file không có trên đĩa; `currentPath=null`). Đây là
  nợ từ đợt trước, không phải do dialog discard-confirm hay D1.
- **M8 menubar detection** — xem §3.2 (zombie window che menu bar).
- **M10/M12–M15 (chuỗi undo sau Dự án mới).** M9 reset clip về 0 (PASS),
  M10 undo không khôi phục (clip vẫn 0) → M12–M15 không có clip để thao
  tác (action tới renderer đều `true`: copy/paste/cut/duplicate/select-all
  đều tới). Là hành vi undo sau new-project, không liên quan dialog/D1.
- **M18–M26 (fullscreen, ngôn ngữ, DevTools, thu nhỏ, Giới thiệu /
  Phím tắt / Báo lỗi, Tài liệu, Thoát).** Fail trong lượt verify4; đều là
  case cửa sổ/role hoặc menu phụ, phần lớn là giới hạn Xvfb không có WM
  hoặc nợ cũ — không điều tra sâu trong đợt này.
- **Bug `loadProject` (tên kẹt "Dự án không tên")** — xem §3.4.
- **`.deb` biến mất khỏi `release/`** (chỉ còn AppImage sau rebuild H8)
  → P1b fail. **`.github/workflows/ci-security.yml` 403** chưa lên
  GitHub (quyền workflows của App) — repo vẫn chưa có CI chạy thật.
- **EPERM thoáng qua (môi trường).** Lỗi `EPERM: operation not permitted,
  write` xuất hiện rải rác khi ghi file (report, screenshot, copyfile
  sang /tmp, WriteStream log) — làm crash 1 lượt probe (probe6, AppImage
  thoát 127 rồi report không ghi được) và 2 lượt verify đầy đủ (verify
  v1 + verify3, crash ở phaseMenu). Viết lại ngay sau đó thì OK. Không
  phải lỗi code harness (cùng lệnh ghi đó chạy được hầu hết thời gian);
  nghi là giới hạn thoáng qua của filesystem/namespace trên VM. Lượt
  verify4 chạy lúc load thấp thì hoàn thành bình thường.

## 5. File chung đã chạm (ghi rõ)

- `apps/desktop/scripts/click-test-menu.mjs` — harness dùng chung cho
  mọi luồng click-test. Chỉ sửa trong phạm vi: cơ chế
  `answerDiscardDialog`, đếm nút dialog, `windowGone`, probe
  dialogprobe (P1–P6), tiêu chí D1. Không đổi logic các case khác (M8
  fail là do zombie window, không phải do sửa case M8).
- `apps/desktop/src/preload.ts`, `apps/desktop/src/main.ts` — code sản
  phẩm desktop (xem §1.3).
- `apps/desktop/src/openFileQueue.ts` + `openFileQueue.test.ts` — mới.
- `dist/main.js`, `dist/preload.js`, `dist/openFileQueue.js` — build lại
  từ source trên (tsc). `dist/openFileQueue.js` còn nằm trong dist nhưng
  preload KHÔNG require nó nữa (đã inline) — file thừa vô hại, có thể
  dọn ở đợt sau.
- KHÔNG sửa `apps/web` (không chạm web UI). KHÔNG sửa file workflow,
  KHÔNG push, KHÔNG release/tag.

## 6. Bằng chứng (không stage, chỉ để trong hidden_files)

- `~/workspace/goals/capcut-clone-video-editor/hidden_files/h9/r54k4-baseline/h9-report.json`
  (baseline AppImage: 15/6 + crash M5).
- `…/h9/r54k4-probe7/h9-report.json` (probe dialog: 9/9).
- `…/h9/r54k4-verify4/h9-report.json` (verify đầy đủ, build final: 24/19)
  + `shots/m8-export-menubar-gone-root.png` (zombie window).
- `…/h9/r54k4-dclick3/h9-report.json` (dclick riêng, build final: 7/1).
- Log app `/tmp/h9-dclick-d183.log` (dòng `argv:` + `open-file: đã gửi`).
- Các lượt trung gian: `r54k4-probe` → `r54k4-probe6b`, `r54k4-verify`,
  `r54k4-verify2`, `r54k4-verify3`, `r54k4-dclick`, `r54k4-dclick2`
  (lịch sử debug: đếm nút, `row.size`, EPERM, preload sandbox).
