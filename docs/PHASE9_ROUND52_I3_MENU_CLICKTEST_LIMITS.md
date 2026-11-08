# Phase 9 — Đợt 52, luồng I3: Click-test menu/dialog/double-click .vcut — LIMITS (H9)

Ngày: 07/11/2026 (~02:35–03:15 +07, lượt cron 00:35 +07).
Phạm vi: chạy lại TRỌN VẸN click-test menu/dialog/double-click `.vcut`
trên AppImage (H9 đợt 51 dở dang — xem `docs/PHASE9_ROUND51_LIMITS.md`
§2.9 và §4.9), xác định exception D3, sửa nếu là bug thật, kiểm chứng
lại. KHÔNG push, KHÔNG tag/release, KHÔNG binary/screenshot vào batch.
AppImage test: **147.931.593 byte, sha256
`da2b85d5bdcf1674146705d150e18e0b7ae19ea8e017ead0e99e385e9b9be8f0`**
(rebuild 06/11 18:11 UTC, đã chứa fix D3). `.deb` test: 120.245.784
byte, sha256 `f8b3f034f87f0ad6572f8d9581e7f348e92ae718b607594e14112a8db66b5039`
(rebuild 06/11 18:34 UTC).

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| D3 "Lưu thành…" | **BUG SẢN PHẨM THẬT — ĐÃ SỬA + KIỂM CHỨNG XANH.** `window.prompt()` ném trong renderer sandbox → uncaught promise rejection → Lưu thành… chết lặng. Fix 1 file production + test 19/19 (red-before đã verify). M3 xanh ở cả 2 lượt full run, D3 xanh ở 3 lượt diag sau fix. |
| Cửa sổ 200×200 | **KHÔNG phải do D3. Còn sót sau fix nhưng VÔ HẠI.** D2 probe xác định: xuất hiện khi mở/đóng popup menu (không phải từ Lưu thành…); D6 đo mapState=0 (Unmapped) ở cả 3 lượt; D7/D8 chứng minh dời/ẩn nó không đổi gì. Là cửa sổ phụ của Electron/Chromium cho popup menu, còn sót lại sau khi popup đóng. |
| Menu không mở sau dialog | **Artifact môi trường Xvfb (không có WM), KHÔNG phải bug sản phẩm.** Sau dialog GTK đóng, focus lạc khỏi cửa sổ chính; click menubar lần 1 không mở popup. Harness retry `XSetInputFocus` + click lại mở được (ghi nhận trực tiếp ở D4/D5 diag và nhiều case full run). |
| Full run menu+dclick | **16/25 (16 passed / 25 failed).** M3/M8/M9 xanh (action tới renderer). M4/M5/D2a (gõ path qua dialog GTK) + M10–M26 + D1/D2b/D4 CHƯA xanh — xem §4, §5: một phần do fixture bị reboot xóa (§5.3), một phần do GPU process crash cuối lượt (§5.5), phần còn lại CHƯA xác định dứt điểm (cần đợt chuyên sâu, §8). |
| Diag D0–D8 (+D3b) | **11/11 PASS** ở lượt cuối (r52g, harness cuối). |
| .deb | Launcher trong gói ĐÚNG (`../../../vcut-studio`). Cài thử lỗi dependency như kỳ vọng (thiếu lib hệ thống trên VM — giới hạn VM, không phải lỗi gói). Purge sạch. |
| Cross-build | Chưa có mac/win/arm64 (ghi nhận theo config + docs, không build thử). |

## 1. D3 "Lưu thành…" — bug sản phẩm thật, đã sửa

### 1.1 Tái hiện (trước fix, AppImage cũ sha 88c13f47…)

3 lần tái hiện, chữ ký giống hệt (run 17 đợt 51 + diag r52a 06/11
17:47 UTC 10/10 + diag r52b 9/10):

- Click "Lưu thành…" sinh đúng 1 exception mới `Uncaught (in
  promise)` trong `app://vcut/assets/index-B4nXx6dQ.js` line 56 col
  112484, stack frames `Mc` → `hT`.
- Cửa sổ 200×200 mới id `0x600002` "vcut-studio" xuất hiện.
- Dialog lưu native KHÔNG mở; Lưu thành… chết lặng.

### 1.2 Cơ chế (đã xác định)

- Renderer Electron chạy `sandbox:true`
  (`apps/desktop/src/main.ts:115`) nên `window.prompt()` ném
  `"prompt() is not supported"`.
- `apps/web/src/desktop.ts:183` gọi `window.prompt("Tên dự án",...)`
  KHÔNG guard trong hàm async `saveProjectDesktop(true)` → uncaught
  promise rejection → flow Lưu thành… dừng trước khi tới dialog lưu
  native.
- Trong bundle `dist-web/assets/index-B4nXx6dQ.js` chỉ có 2 lần gọi
  `window.prompt`: một trong `saveProjectDesktop(true)` (đường desktop,
  tới được), một trong `ProjectMenu.tsx` `doSaveAs` (bị guard bởi
  `isNativeDesktop()` nên không tới được trong desktop).
- Cửa sổ 200×200 lúc đó được cho là của Chromium còn sót sau lệnh
  prompt — **đính chính ở §2**: nó xuất hiện khi mở/đóng popup menu,
  không liên quan prompt.

### 1.3 Fix (tối thiểu, 1 file production)

`apps/web/src/desktop.ts` (~dòng 183, comment `ROUND52-I3`): bọc
`window.prompt(...)` trong try/catch; prompt ném thì `name = ""` (bỏ
qua bước đổi tên, vẫn mở dialog lưu native); prompt trả null (Cancel)
vẫn trả false; trình duyệt thường prompt hoạt động bình thường.

Hành vi này được ghi nhận trung thực: bước đổi tên qua prompt bị bỏ
qua trên desktop (tên file vẫn chọn được trong dialog lưu); dialog
nhập tên trong app là việc tương lai (§8.6).

### 1.4 Kiểm chứng fix

- Test mới `apps/web/src/desktopSaveAs52I3.test.ts` (19 assertions,
  4 case T1–T4; bundle esbuild `--format=cjs` rồi chạy node vì
  `desktop.ts` đọc `window.vcutDesktop` lúc chạy): **19/19 PASS**.
  T1 (prompt ném — đúng bug D3): trả true, dialog lưu mở 1 lần, ghi
  file 1 lần đúng path dialog trả về, nội dung là ProjectEnvelope hợp
  lệ (`format:"vcut-project"`, `spec.meta.name`, tracks), current path
  đặt, tên project giữ nguyên. T2 (prompt trả tên): đổi tên rồi lưu.
  T3 (Cancel): trả false, không dialog, không ghi. T4 (chuỗi trắng):
  không đổi tên nhưng vẫn lưu.
- **Red-before đã verify:** tạm revert hunk fix → T1 fail 8/8 đúng
  như bug (`Error: prompt() is not supported`, dialog 0, file 0);
  khôi phục fix → 19/19 xanh.
- `tsc --noEmit`: apps/web 0 lỗi, apps/desktop 0 lỗi.
- `npm run build` apps/web pass (bundle mới
  `dist/assets/index-DAcH2F5R.js`, chứa chuỗi fix
  `try{c=window.prompt`).
- End-to-end trên AppImage thật: **M3 xanh ở cả 2 lượt full run**
  (click đúng mục, action `save-project-as` tới renderer, 0 exception
  mới, dialog GTK "Lưu dự án" 1124×822 mở, Escape đóng được, không ghi
  file khi hủy); **D3 xanh ở 3 lượt diag sau fix** (r52c/r52e/r52f/r52g).
- `apps/web/tsconfig.json`: thêm exclude cho test mới (theo mẫu các
  test khác; lưu ý luồng I2 đợt 52 cũng thêm
  `src/lib/audioEngine52I2.test.ts` vào cùng file — parent gộp xử lý
  nếu xung đột).

## 2. Cửa sổ 200×200 — nguồn gốc + vô hại (đã chứng minh)

- **Nguồn gốc (D2 probe, r52f/r52g):** sau khi mở/đóng popup Tệp ở
  D2, cửa sổ 200×200 id `0x600002` "vcut-studio" đã CÓ — tức xuất
  hiện khi mở/đóng popup menu, KHÔNG phải từ click Lưu thành… (D3
  không thấy cái mới ở cả 3 lượt sau fix). Id `0x600002` ổn định qua
  các lượt vì Xvfb mới cấp XID xác định, không phải cùng một cửa sổ.
  Đây là cửa sổ phụ của Electron/Chromium cho popup menu, còn sót lại
  sau khi popup đóng.
- **Vô hại (D6, 3 lượt):** mapState=0 (Unmapped; 2 mới là Viewable),
  overrideRedirect=1, class=1 (InputOutput), type
  `_NET_WM_WINDOW_TYPE_NORMAL`, `WM_TRANSIENT_FOR=?`. Unmapped ⇒
  không nhận click, không che menubar.
- **D7/D8 (r52d):** dời cửa sổ ra (-1000,-1000) KHÔNG hồi menubar khi
  menu đang lỗi; ẩn cũng KHÔNG hồi — chứng minh 200×200 KHÔNG phải
  nguyên nhân lỗi menu. Ở r52e–r52g menu đã mở được ở D4 nên D7/D8
  chỉ còn là kiểm tra phụ (rows=8).
- **D3b (tiêu chí đã cập nhật sau r52f):** PASS khi không có 200×200,
  HOẶC có nhưng UNMAPPED (mapState=0); chỉ FAIL khi nó MAPPED
  (Viewable) — lúc đó mới là vấn đề thật. Lý do đổi tiêu chí: bằng
  chứng D6/D7/D8 cho thấy bản thân sự tồn tại của cửa sổ unmapped
  không ảnh hưởng gì; giữ tiêu chí cũ (fail khi còn cửa sổ) sẽ làm
  mọi lượt chạy đỏ vì một leftover vô hại. Diag cuối r52g: D3b PASS
  (mapState=0).
- Ngoài 200×200 còn các cửa sổ phụ Chromium khác quanh dialog:
  `(không tên) 1x1@-1,-1`, `vcut-studio 10x10@-100,-100`,
  `vcut-studio 2x2@0,0`, `vcut-studio 167x73@0,0` (xuất hiện lúc M3
  mở dialog) — chưa điều tra, có thể là helper windows bình thường
  của Chromium; không chặn menubar (M3/D3 xanh).

## 3. Focus lạc sau dialog GTK (Xvfb không có WM) — harness retry

- Triệu chứng (r52c/r52d): D4/D5 "không thấy popup menu sau click"
  sau khi dialog GTK đóng (D3). Welcome modal cũng từng mở muộn
  (xuất hiện sau D1) trùng thời điểm lỗi, nhưng modal là DOM overlay,
  không chặn được native menu.
- Nguyên nhân: Xvfb không có window manager nên sau dialog GTK đóng,
  focus không được trả về cửa sổ chính; click menubar lần 1 không mở
  popup. Bằng chứng quyết định (r52f): note harness "popup chỉ mở
  được ở lần click thứ 2 (sau SetInputFocus) — lần 1 không mở được"
  xuất hiện, D4/D5 PASS (rows=8 / rows=5).
- Fix harness (`X11.setInputFocus`, opcode 42 + vòng click 2 lần
  trong `openTopMenu`): lần 1 click → chờ 3s; nếu không thấy popup
  thì Escape + `setInputFocus(main)` + click lại (geometry tươi) +
  chờ 3s; vẫn không thấy thì fail kèm vị trí chuột + danh sách cửa
  sổ. Lưu ý: lần đầu retry gắn nhầm vào nhánh shot-stability (chỉ
  chạy khi popup ĐÃ tìm thấy) nên r52d vẫn fail; đã chuyển lên tầng
  click ở r52e — sau đó D4/D5 xanh.
- Đây là artifact môi trường (người dùng thật có WM trả focus),
  KHÔNG phải bug sản phẩm. Trên máy thật có WM, vấn đề này không
  xảy ra.

## 4. Kết quả từng phase

### 4.1 Diag D0–D8 (+D3b) — 11/11 PASS (lượt cuối r52g, harness cuối)

| Case | Kết quả r52g | Ghi chú |
|---|---|---|
| PRE | PASS | AppImage test đúng bản release (sha da2b85d5…, 147.931.593 byte) |
| D0 baseline | PASS | 4 cửa sổ lúc khởi động; welcome modal chưa mở; chưa có 200×200 |
| D1 đóng modal | PASS | Modal chưa mở lúc đầu (mở muộn sau đó); click Để sau đóng được |
| D2 popup Tệp | PASS | rows=8; **probe: 200×200 xuất hiện sau mở/đóng popup** |
| D3 Lưu thành… sau fix | PASS | 0 exception; dialog "Lưu dự án" 1124×822 mở; Escape đóng được; không còn 200×200 MỚI |
| D3b 200×200 phải UNMAPPED | PASS | Có 200×200 id 0x600002 nhưng mapState=0 (Unmapped — vô hại) |
| D4 Tệp sau Lưu thành… | PASS | rows=8 (mở được ở lần click thứ 2 sau SetInputFocus) |
| D5 Trợ giúp | PASS | rows=5 |
| D6 thuộc tính 200×200 | PASS | mapState=0, overrideRedirect=1, type NORMAL |
| D7 dời 200×200 + mở Tệp | PASS | rows=8 |
| D8 ẩn 200×200 + mở Tệp | PASS | Menu đã mở được ở D7 — bỏ qua |

Lịch sử diag: r52a 10/10 (AppImage cũ, trước fix — D3 tái hiện bug),
r52b 9/10 (D5 FAIL flake: band detection chỉ thấy 4 dải thay vì 5 —
flake harness, không phải bug sản phẩm), r52c 8/10 (AppImage mới,
D4/D5 fail — focus, chưa có retry), r52d 6/10 (D3b/D4/D5/D7/D8 fail
— retry gắn nhầm chỗ + tiêu chí D3b cũ), r52e/r52f 10/11 (D3b fail
tiêu chí cũ), r52g **11/11** (harness cuối).

### 4.2 Menu thật (full run #2, 06/11 19:25–19:32 UTC) — 8/27

| Case | Kết quả | Chi tiết |
|---|---|---|
| PRE | PASS | sha khớp release |
| M0 sample load | PASS | 3 clip: mau-1.webm, mau-2.webm, "Xin chào! Đây là VCut Studio" |
| W0 đóng welcome modal | PASS | Modal mở sau M0, đóng bằng Để sau |
| M1 menu bar 5 nhóm | PASS | centers x=16,70,125,171,228 |
| M2 popup Tệp 8 mục | PASS | rows=8 |
| M3 Lưu thành… sau fix | PASS | 0 exception; dialog mở; Escape hủy; không ghi file |
| M4 Lưu dự án | FAIL | §5.1 — dialog mở nhưng Return không chấp nhận path (Escape đóng dialog kẹt); action save-project: true; file không ghi; currentPath=null |
| M5 Mở dự án… | FAIL | §5.1 + §5.3 — dialog đóng nhưng onOpenFile false, tên vẫn "Dự án mẫu", currentPath=null; fixture đã bị reboot xóa nên mở cũng không load được |
| M6 Thêm media… | FAIL | Dialog "Thêm media" xuất hiện nhưng Escape → đóng: false; dialog fallback có title rỗng |
| M7 Mở gần đây | FAIL | Không thấy submenu sau hover |
| M8 Xuất video… | PASS | action export-video: true; textLen 1972 → 4146 |
| M9 Dự án mới | PASS | action new-project: true; clips 3 → 0 |
| M10 Hoàn tác | FAIL | §5.2 — action undo: false; clips=0 |
| M11 Làm lại | FAIL | §5.2 — action redo: false; clips=0 |
| M12 Chọn tất cả + Xóa | FAIL | §5.2 — select-all: false, delete: false; clips 0 → 0 (cascade từ M10/M11: không khôi phục được clip) |
| M13 Sao chép + Dán | FAIL | §5.2 — copy: false, paste: false; clips 0 → 0 |
| M14 Cắt | FAIL | §5.2 — cut: false; clips 0 → 0 |
| M15 Nhân bản clip | FAIL | §5.2 — duplicate: false; clips 0 → 0 |
| M16 Tải lại (role reload) | FAIL | §5.2 — click Tải lại: false; marker truoc-reload còn (không reload thật) |
| M17 Phóng to / reset zoom | FAIL | §5.2 — innerWidth 1440 → 1440 → 1440 (không đổi) |
| M18 Toàn màn hình | FAIL | §5.2 — geometry 1440x900 không đổi |
| M19 Ngôn ngữ EN ↔ VI | FAIL | §5.2 — lang en tới renderer: false; menubar EN chỉ 1 dải; về vi: false |
| M20 DevTools | FAIL | §5.2/§5.5 — DevTools target: không thấy; đóng xong: false |
| M21 Thu nhỏ cửa sổ | FAIL | §5.5 — sau Thu nhỏ map-state=2 (vẫn Viewable, không Unmapped) |
| M22 Giới thiệu | FAIL | §5.2 — không thấy dialog Giới thiệu |
| M23 Phím tắt | FAIL | §5.2 — không thấy dialog Phím tắt |
| M24 Báo lỗi… | FAIL | §5.2 — không thấy dialog Báo lỗi |
| M25 Tài liệu hướng dẫn | FAIL | §5.2 — app còn chạy: true nhưng click item: false |
| M26 Thoát | FAIL | §5.5 — click Thoát: false; exitCode=null; tiến trình còn sống |

Full run #1 (06/11 18:38–18:51 UTC, AppImage mới): 15 passed /
12 failed; phaseMenu crash giữa chừng (CDP timeout
`Runtime.evaluate` 20s) nên danh sách case không đầy đủ — M4–M11
fail "không thấy popup menu sau click" (trước khi có focus retry).
Không dùng run #1 làm kết luận cuối; run #2 (16/25) là đầy đủ.

### 4.3 Double-click .vcut (full run #2) — 1/5

| Case | Kết quả | Chi tiết |
|---|---|---|
| D1 argv VCUT1 | FAIL | §5.3 — onOpenFile probe: false; tên "Dự án mới"; currentPath=null; nhưng log app cho thấy app ĐÃ thử đọc file (`desktop:read-file` ENOENT vì M4 chưa ghi file) — app xử lý argv đúng, probe harness miss event (gửi trước khi installProbes) + file không tồn tại |
| D2a Lưu thành… ghi VCUT2 | FAIL | §5.1 — 0 exception; dialog "Lưu dự án" mở, gõ path đóng: true; nhưng file KHÔNG được ghi; currentPath=null |
| D2b second-instance FIXTURE2 | FAIL | §5.3 — instance 2 thoát nhanh (exitCode 0, single-instance OK); instance 1 nhận onOpenFile: true nhưng project KHÔNG load (tên vẫn "Dự án mẫu"); log app: `desktop:read-file` ENOENT vì fixture đã bị reboot xóa |
| D3 xdg-open .vcut | PASS | Ghi nhận hành vi thực tế: xdg-open exit=2 (file không tồn tại vì M4 chưa ghi); app nhận thêm open-file: 0 lần |
| D4 Đóng cửa sổ (role close) | FAIL | §5.5 — click: false; exitCode=null (app đã chết do GPU FATAL lúc đó) |

Lưu ý D1/D2b: launch dclick lần 1 timeout 300s do instance
menu-phase không chết sau SIGKILL+pkill (cùng
`--user-data-dir=/tmp/h9-userdata` bị single-instance lock chặn);
lần 2 mới lên được. Tiến trình sống sót sau SIGKILL gợi ý D-state
(chờ I/O) hoặc kill nhầm process group — chưa xác định.

### 4.4 .deb (full run #2) — 3/3

| Case | Kết quả | Chi tiết |
|---|---|---|
| P1 apt: 5 lib hệ thống | PASS | Cả 5 lib đều không có candidate trên VM (package lists trống): libgtk-3-0, libnotify4, libxtst6, libatspi2.0-0, libsecret-1-0 — **giới hạn VM, không phải lỗi gói** |
| P1b Cài .deb | PASS | `dpkg -i` lỗi dependency như kỳ vọng (thiếu libnotify4, libxtst6, libsecret-1-0); gói giải nén được, triggers chạy |
| P2 Dọn sau thử .deb | PASS | purge exit=0; `/opt/vcut-studio` không còn |

Kiểm chứng launcher trong gói (trước khi cài thử): giải nén `ar x` +
`tar -tf data.tar.xz` — launcher
`resources/vcut-server/bin/vcut-node` ĐÚNG:
`BIN="$HERE/../../../vcut-studio"` (3 cấp `..`, bản sửa H8; bản cũ
sai `../../vcut-studio` đã hết). `vcut-server`: 1.214 entry.
`resources/app.asar` có, chứa bundle mới `index-DAcH2F5R.js` (có chuỗi
fix `try{c=window.prompt`, không còn bundle cũ `index-B4nXx6dQ.js`).
MIME `vcut-studio.xml` + `.desktop` có.

### 4.5 Cross-build — 4/4 (ghi nhận, không build thử)

X1: chưa có mac/win/arm64 trong package.json (linux targets:
AppImage, deb; arch mặc định x64). X2: Windows NSIS từ Linux cần
Wine — VM không có Wine. X3: macOS dmg cần máy Mac (target dmg gọi
sips, chỉ có trên macOS); build mac zip unsigned từ Linux khả thi về
mặt kỹ thuật nhưng CHƯA thử (cần tải Electron mac binary +
ký/notarize vẫn bắt buộc máy Mac + Apple Developer account). X4:
Linux arm64 khả thi từ Linux x64 (`electron-builder --linux --arm64`)
nhưng CHƯA thử (không chạy/kiểm chứng được binary arm64 trên VM x64).

## 5. Phân tích các FAIL còn lại (chưa đóng)

### 5.1 Gõ path qua dialog GTK không ghi file (M4, M5, D2a) — CHƯA xác định dứt điểm

- M4: dialog "Lưu dự án" mở, action save-project tới renderer
  (true), nhưng Return sau khi gõ path KHÔNG đóng dialog (phải
  Escape đóng "dialog kẹt"); file không ghi; currentPath=null.
- D2a: dialog mở, 0 exception, "gõ path đóng: true" (dialog biến
  mất sau Return hoặc Escape — harness không phân biệt được hai
  đường này), nhưng file KHÔNG ghi; currentPath=null.
- M5: dialog đóng nhưng onOpenFile false, project không load.
- Điều đã loại trừ: **đường đọc/ghi file của app hoạt động.**
  (a) Unit test `desktopSaveAs52I3.test.ts` chứng minh renderer ghi
  file đúng khi đã có path (T1–T4). (b) Log dclick cho thấy
  `desktop:read-file` được gọi và thử đọc thật khi app nhận path qua
  argv (chỉ fail ENOENT vì file không tồn tại). Vậy khoảng trống nằm
  ở tương tác với dialog GTK (Ctrl+L + gõ path + Return) — hoặc
  keystrokes không tới được location bar (focus/dialog không được
  kích hoạt đúng vì không có WM — `activateWindow` là no-op), hoặc
  Return không submit trong GTK file chooser trên Xvfb này.
- Chưa làm (đợt sau, §8.1): chụp dialog NGAY sau khi gõ path (xem
  location bar có path không) trước khi Return; thử `XSetInputFocus`
  lên dialog trước khi gõ; thử gõ path rồi click nút Save bằng chuột
  thay vì Return; log kết quả `showSaveDialog` ở main (cần thêm log
  tạm — không sửa production vội).

### 5.2 Menu action không tới renderer sau M9 (M10–M26) — CHƯA xác định dứt điểm

- M8/M9 (menu Tệp) xanh: action tới renderer. Từ M10 trở đi, action
  không tới (`undo/redo/copy/paste/cut/duplicate/select-all/delete:
  false`; M16 click Tải lại: false; M19 lang: false; M22–M24 không
  thấy dialog; M25 click: false).
- `menu.ts` dùng custom click handler `sendAction(win, ...)` cho
  undo/redo/copy/cut/paste (dòng 220–221) — click trúng mục PHẢI sinh
  action; role items (reload/zoom/fullscreen/minimize/close/quit)
  cũng fail. Điểm chung không phải loại item mà là click/popup ở các
  menu 1–4 sau M9.
- Screenshot m10-undo.png: màn hình chính trống (0 clip sau M9),
  KHÔNG thấy popup — popup hoặc không mở, hoặc đã đóng mà không chọn
  được mục. Diag D5 chứng minh popup Trợ giúp (topIndex 4) MỞ ĐƯỢC
  (rows=5) nên openTopMenu không hỏng hoàn toàn.
- Cascade: M9 làm trống timeline (clips 3 → 0) nên M12–M15 mất tiền
  đề (không còn clip để chọn/sao chép/cắt/nhân bản); setup M12 định
  Hoàn tác để khôi phục clip nhưng undo (M10) đã fail nên M12–M15
  fail theo dây chuyền. Harness nên load lại sample project trước
  M12 thay vì trông chờ undo (xem §8.2).
- Giả thuyết chưa chứng minh (cần đợt chuyên sâu): row-click lệch
  geometry ở popup các menu 1–4 (textBands tách/gộp sai hàng có
  shortcut/submenu), hoặc renderer frame mất kết nối sau M9. KHÔNG
  kết luận là bug sản phẩm — bằng chứng hiện có không đủ.

### 5.3 Fixture .vcut bị reboot xóa (M5, D1, D2b) — lỗi setup harness

- `/tmp/h9-test/` TRỐNG hoàn toàn lúc kiểm tra sau full run #2
  (VM reboot ~17:52 UTC 06/11, uptime 1:33 lúc 19:25 — `/tmp` là
  tmpfs). Fixture `H9-Fixture.vcut` ("H9 Doubleclick") và
  `H9-SecondInstance.vcut` ("H9 Second") tạo trước reboot đã mất;
  không tạo lại trước full run #2.
- Hệ quả: M5 mở fixture → không có file để load; D2b argv FIXTURE2
  → app nhận (onOpenFile: true) nhưng đọc ENOENT; D1 argv VCUT1 →
  file không tồn tại vì M4 chưa ghi (cộng thêm probe miss event).
- Bài học: fixture phải tạo lại sau mỗi reboot và kiểm tra
  `exists()` trước khi chạy full run; harness nên tự tạo fixture
  (hoặc fail-fast khi fixture thiếu) thay vì chạy mù.

### 5.4 D4 exitCode=127 (đợt 51) — không tái hiện như cũ

- Đợt 51: D4 pass nhưng exitCode=127 bất thường. Full run #2: D4
  FAIL khác (click: false; exitCode=null) — app đã chết do GPU FATAL
  (§5.5) trước khi D4 chạy nên không so sánh được. Exit code 127
  vẫn là nợ mở, cần đo lại khi app sống.

### 5.5 GPU process FATAL cuối lượt (M20–M26, D4) — giới hạn VM

- Log menu `/tmp/h9-menu.log` 19:29:26 UTC: `Network service
  crashed`, `GPU process launch failed: error_code=1002` (×3), rồi
  `FATAL: GPU process isn't usable. Goodbye.` — app chết. Kèm
  `electron: Error sending from webContents: Render frame was
  disposed before WebFrameMain could be accessed` (main gửi menu
  action vào frame đã dispose).
- Giải thích M20–M26 + D4 fail muộn trong run (click không tới,
  window không đổi trạng thái, tiến trình còn sống nhưng renderer
  đã chết). GPU launch failure trên Xvfb/VM không GPU là giới hạn
  môi trường đã biết (headless + `--disable-gpu` không đủ trong mọi
  trường hợp); không quy cho bug sản phẩm khi chưa tái hiện trên máy
  có GPU/WM thật.
- M10–M19 fail TRƯỚC 19:29:26 nên FATAL không giải thích được nhóm
  này — xem §5.2.

### 5.6 Các fail nhỏ khác

- M6: dialog "Thêm media" xuất hiện nhưng Escape không đóng được
  (đóng: false); harness fallback dùng dialog mới có title rỗng —
  có thể dialog thêm-media không phải GTK file chooser chuẩn (hoặc
  Escape bị chặn bởi focus). Chưa điều tra sâu.
- M7: không thấy submenu "Mở gần đây" sau hover — hover bằng
  `mouseMove` + chờ có thể chưa đủ trên Xvfb (submenu cần hover giữ
  + render). Chưa điều tra sâu.
- M26: app không thoát sau click Thoát (exitCode=null, tiến trình
  còn) — nhưng app đã chết do GPU FATAL trước đó nên kết quả này
  không có giá trị; cần đo lại.

## 6. Rebuild + đóng gói (đợt 52 I3)

- `npm run build` apps/web: pass (27,77s; bundle mới
  `index-DAcH2F5R.js`).
- `npm run package:linux` từ root (script root → build desktop +
  `electron-builder --linux`): ~28 phút (VM tải nặng, xz nén đơn
  luồng). AppImage xong 18:11, `.deb` xong 18:34 UTC 06/11.
  Lưu ý: `npm run package:linux` KHÔNG có trong
  `apps/desktop/package.json` (chỉ có `"package": "electron-builder
  --linux"`); script nằm ở root `package.json`.
- `TMPDIR=~/workspace/.tmp-pkg52i3` (đĩa, theo mẫu đợt 51).
- Build output KHÔNG stage (theo tiền lệ): `apps/web/dist/*`,
  `apps/desktop/dist-web/*`, `apps/desktop/release/*` (AppImage +
  `.deb` mới + `linux-unpacked/`).

## 7. Vấn đề môi trường đã gặp

- **Xvfb/xkb race (vẫn còn):** Xvfb mới đôi khi exit 1 ngay do
  xkbcomp fail `Cannot close "/var/lib/xkb/server-<N>.xkm" (not
  enough space?)` → `Failed to compile keymap` → `Failed to activate
  virtual core keyboard`. Không phải hết dung lượng (`/var` còn
  7,2G, ghi tay OK; `-xkbdir /tmp` cũng fail). Strace chứng minh
  xkbcomp chạy tốt khi bị làm chậm — race timing giữa xkbcomp ghi
  file và X server đọc file. Cách xử lý: xóa lock stale
  (`/tmp/.tX<N>-lock`, `/tmp/.X<N>-lock`, `/tmp/.X11-unix/X<N>`)
  rồi chạy lại; đôi khi cần thử vài lần. Harness `startXvfb` không
  xóa `.tX<N>-lock` — khiếm khuyết harness đáng ghi (chưa sửa trong
  lượt này).
- **VM tải nặng:** loadavg lên tới 24,7 (18:55 UTC 06/11) do các
  luồng đợt 52 song song (TTS driver, ffmpeg, caption, Playwright
  I6); lúc full run #2 load chỉ 0,66 (máy nhẹ) nhưng M10+ vẫn fail
  nên tải không phải nguyên nhân duy nhất.
- **Cẩn thận với `pkill -f`:** pattern chứa chuỗi lệnh sẽ tự khớp
  chính shell gọi nó; luôn dùng `[X]vfb`-style bracket trick.
- **`/tmp` là tmpfs 512M, mất sau reboot:** fixture + log + AppImage
  giải nén tạm đều mất; fixture phải tạo lại, log quan trọng copy về
  `hidden_files/` ngay.
- **D5 flake (band detection):** không tái hiện ở r52e–r52g (D5
  pass rows=5 cả 3 lượt); vẫn là flake đã biết của harness.

## 8. Nợ mở (cho đợt sau)

1. **Dialog GTK gõ path (M4/M5/D2a):** chụp dialog sau khi gõ path;
   `XSetInputFocus` lên dialog trước khi gõ; thử click nút Save thay
   vì Return; log kết quả `showSaveDialog` ở main. Mục tiêu: phân
   biệt harness-typing vs app-dialog-handling.
2. **Menu action M10–M26:** chạy probe riêng từng menu 1–4 (mở popup
   + chụp popup + click từng hàng + đọc `__h9.actions` ngay sau mỗi
   click); kiểm tra textBands trên popup Chỉnh sửa/Xem/Cửa sổ/Trợ
   giúp; load lại sample project trước M12 (đừng trông chờ undo sau
   M9); đo lại M20–M26/D4 khi app sống (không có GPU FATAL).
3. **Fixture tự tạo + fail-fast:** harness tự tạo fixture `.vcut`
   (hoặc kiểm tra `exists()` trước khi chạy) — tránh chạy mù sau
   reboot; lưu fixture vào `hidden_files/h9/` (không phải `/tmp`).
4. **M6/M7:** dialog Thêm media (Escape không đóng) + submenu Mở
   gần đây (hover không mở) — điều tra riêng.
5. **D4 exitCode=127 (đợt 51):** đo lại exit code khi app thoát
   sạch; kiểm tra tiến trình con sau khi thoát.
6. **Dialog nhập tên trong app:** sau fix D3, bước đổi tên qua
   `window.prompt` bị bỏ qua trên desktop — cần dialog nhập tên
   trong app (thay prompt) nếu muốn giữ tính năng đổi tên khi Lưu
   thành….
7. **Harness `startXvfb`:** xóa cả `/tmp/.tX<N>-lock` khi khởi động
   (hiện chỉ xóa `.X<N>-lock` + socket).
8. **GPU FATAL trên Xvfb:** cân nhắc `--disable-gpu` / flag
   `--disable-gpu-sandbox` cho AppImage khi chạy click-test, hoặc
   ghi nhận là giới hạn môi trường cố hữu.

## 9. Bằng chứng

- Harness: `apps/desktop/scripts/click-test-menu.mjs` (~1900 dòng;
  X11 thuần qua socket, XTEST click, CDP WebSocket; display mặc
  định :137, CDP 9231, màn 1600×1000; `--only
  diag|menu|dclick|deb|cross`, `--appimage`, `--binary`,
  `--display`, `--skip-deb`).
- Báo cáo JSON (`hidden_files/h9/`):
  `h9-report-diag-r52a.json` (10/10, AppImage cũ, trước fix),
  `h9-report-diag-r52b.json` (9/10, D5 flake),
  `h9-report-full-r52.json` (15/12, full run #1, phaseMenu crash),
  `h9-report-diag-r52c.json` (8/10, AppImage mới, D4/D5 fail focus),
  `h9-report-diag-r52d.json` (6/10, D3b/D4/D5/D7/D8 fail),
  `h9-report-diag-r52e.json` (10/11, D3b tiêu chí cũ),
  `h9-report-diag-r52f.json` (10/11 + D2 probe + focus note),
  `h9-report-full-r52b.json` (16/25, full run #2 đầy đủ),
  `h9-report-diag-r52g.json` (11/11, harness cuối),
  `h9-report.json` (bản mới nhất = r52g),
  `settings-after.json`, `make-fixture.mjs`.
- Screenshots: `hidden_files/h9/shots/` (diag-*.png, m*.png,
  d2-*.png, d4-close.png; m4-save.png cho thấy popup Tệp 8 hàng
  render sạch; m10-undo.png cho thấy màn hình chính trống, không
  popup).
- Log app: `/tmp/h9-menu.log` (GPU FATAL 19:29:26, `Render frame was
  disposed`), `/tmp/h9-dclick.log` (`desktop:read-file` ENOENT cho
  VCUT1 + FIXTURE2 — bằng chứng app xử lý argv), `/tmp/h9-diag.log`.
  Lưu ý: `/tmp` mất sau reboot — log các lượt sau cần copy về
  `hidden_files/` ngay (chưa làm trong lượt này).
- Sản phẩm: `apps/desktop/src/main.ts:115` (`sandbox:true`),
  `apps/web/src/desktop.ts:183` (prompt — đã fix),
  `apps/web/src/components/project/ProjectMenu.tsx:171` (prompt thứ
  hai, chỉ chạy ngoài desktop nhờ guard `isNativeDesktop()`),
  `apps/desktop/src/menu.ts:16-17,220-221` (undo/copy dùng
  `sendAction`, không phải role Chromium),
  `apps/desktop/src/preload.ts` (expose `saveProjectDialog` → IPC
  `desktop:dialog-save-project`), `apps/desktop/src/main.ts:390`
  (dialog title "Lưu dự án", filters `.vcut`/JSON).

## 10. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/desktop.ts` | Sửa | Fix D3: try/catch `window.prompt` (ROUND52-I3) |
| `apps/web/src/desktopSaveAs52I3.test.ts` | Mới | Test 19 assertions, 4 case T1–T4 (red-before đã verify) |
| `apps/web/tsconfig.json` | Sửa | Thêm exclude test mới |
| `apps/desktop/scripts/click-test-menu.mjs` | Sửa | M3, D2a viết lại theo hành vi sau fix; D3/D3b/D6/D7/D8; D2 probe 200×200; focus retry (SetInputFocus + click 2 lần); main() dọn VCUT1/VCUT2; sửa text D7/D8 |
| `docs/PHASE9_ROUND52_I3_MENU_CLICKTEST_LIMITS.md` | Mới | Tài liệu này |

Stage: `paths-loop/phase9-round52-i3-menu-clicktest.txt` — 5 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.
