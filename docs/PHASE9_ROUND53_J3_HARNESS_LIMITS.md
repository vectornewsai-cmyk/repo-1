# PHASE 9 — Đợt 53 — Luồng J3: Harness click-test (LIMITS)

Ngày: 2026-11-07 (giờ UTC trong log; giờ VN = UTC+7). Repo local `~/workspace/repo-1`.
Luồng J3: củng cố harness click-test `apps/desktop/scripts/click-test-menu.mjs`.
**Không push, không release/tag, không code giả. Không sửa logic sản phẩm.**
Binary được test: xem §1 — kết quả chỉ có giá trị cho đúng snapshot đó.

## 0. Tóm tắt nhanh

| Hạng mục | Kết quả |
|---|---|
| Diag (11 diag + PRE fixture) | **12/12 PASS** (r53j3b, AppImage đợt 52; và 12/12 trên snapshot) |
| Full run-1 (AppImage đợt 52) | 15/39 — xem r53j3 |
| Menu re-run r53j3c (snapshot) | 9/30 |
| Menu re-run r53j3d (snapshot) | 9/30 — M6 PASS thật, M9 PASS, còn lại fail theo mẫu cũ |
| Dclick r53j3e (snapshot, trước fix D1) | 3/7 — D1 fail-fast (testdir bị reboot xóa) |
| Dclick r53j3f (snapshot, sau fix D1) | 3/7 — D1 tự tạo lại file và chạy thật, nhưng fail vì bug sản phẩm |
| tsc `apps/desktop` | **0 lỗi** |
| tsc `apps/web` | **0 lỗi** (lỗi `clampPreviewDt` TS6133 của J5 lúc 21:37 đã được sửa — không phải việc J3) |
| GPU FATAL (`error_code=1002` / `FATAL: GPU process isn't usable`) | **0 lần** trong mọi run r53j3 (đợt 52 có 3 lần) — cờ `--disable-gpu` có tác dụng |

**Kết luận lớn nhất đợt 53:** M6 là **bug harness** (đã sửa, PASS thật). M7 là **bug harness** (sai dòng hover — đã sửa, submenu mở được, `onOpenFile: true`) **+ bug sản phẩm** (tên project kẹt ở "Dự án không tên" sau khi load — `loadProject` không lấy được `meta.name`, xem §4). Cascade M8→M26 là do **dialog `window.confirm` "Có thay đổi chưa lưu…" không được ai trả lời** — dialog còn mở nguyên từ M7 tới M26 (bằng chứng: ảnh root), làm menu bar không detect được → guard fail-fast đúng như thiết kế.

## 1. Binary được test — đọc trước khi diễn giải kết quả

- Các run r53j3 (full run-1) và diag đầu dùng **AppImage đợt 52** (147.931.593 byte, sha `da2b85d5…`).
- Giữa đợt, AppImage đợt 52 **biến mất khỏi `release/`** (sibling đang rebuild liên tục: `dist-web` build lại 21:07 và 21:18, AppImage mới xuất hiện 21:22 rồi lại đổi sha, `.deb` biến mất). J3 copy `linux-unpacked` (1,3 GB) sang `~/workspace/.tmp-h9/vcut-unpacked-r53j3/` (asar sha `eb89382597ebbb87c23860a1ac211e8a75a6bdbd94ccd55f4904c6a1ceace5a1`, bundle duy nhất `index-CwcDTNVS.js`, có chuỗi `rename-project-dialog`).
- **Mọi run r53j3b/r53j3c/r53j3d/r53j3e/r53j3f dùng snapshot unpacked này qua `--binary`** (PRE record "Unpacked snapshot được test (asar verify bằng strings)"). Kết quả menu/dclick đợt 53 chỉ có giá trị cho đúng asar `eb893825…` này.
- Sau reboot 21:55 UTC, `release/` lại có AppImage mới `vcut-studio-0.1.0-x86_64.AppImage` **410.119.959 byte (22:09)** — lớn gấp ~3 lần bản đợt 52, **J3 chưa test bản này**. Ai test tiếp phải ghi rõ sha + kích thước.
- Snapshot unpacked ở `~/.tmp-h9/` là bản sao tạm để test (1,3 GB) — **không stage**, có thể xóa sau khi push xong.

## 2. File J3 đã chạm (harness dùng chung với J1/J2/J4 — chỉ sửa phần infra/fixture)

- `apps/desktop/scripts/click-test-menu.mjs` — file duy nhất sửa trong repo (các phần của J4: `phaseD4`, `driveRenameDialog`, sửa case M3/D2a/D3 — J3 **không** chạm).
- `hidden_files/h9/make-fixture.mjs` — nằm ngoài repo-1 (đổi đích fixture từ `/tmp/h9-test` sang `hidden_files/h9/fixtures`); **không đưa vào batch push** (xem §9).
- `docs/PHASE9_ROUND53_J3_HARNESS_LIMITS.md` — file này.

### 2.1 Thay đổi trong `click-test-menu.mjs`

1. **Fixture tự tạo + fail-fast (ROUND53-J3):** `FIXTURE_DIR = ~/workspace/goals/capcut-clone-video-editor/hidden_files/h9/fixtures/` (bền vững, không `/tmp`); `fixtureSpec()` + `ensureFixtures()` (tạo lại nếu thiếu/hỏng, đọc lại + `JSON.parse` verify, throw nếu lỗi); gọi ở `main()` đầu tiên + record PRE; `requireFixture()` kiểm tra lại trước M5/M7/D1/D2b. Cờ CLI mới `--out/--userdata/--testdir` (chạy song song với J1/J2 không giẫm nhau; fixture luôn ở canonical dir).
2. **`startXvfb`:** xóa thêm `/tmp/.tX<N>-lock`; retry tối đa 3 lần (xkb race có thể đánh sập lần spawn đầu dù đã xóa lock — gặp thật ở lượt 2 run-2).
3. **GPU flags:** thêm `--disable-gpu --disable-gpu-sandbox` vào args AppImage trong `launchAppImage` và spawn second-instance D2b; log app đổi tên thành `h9-<label>-d<DISPLAY>.log`.
4. **M6:** click đúng dòng 2 (code cũ click nhầm dòng 3); chỉ chấp nhận dialog tìm bằng title HOẶC fallback width>=400 (chống PASS GIẢ — popup menu ~250px không được tính là dialog); focus dialog (activate + SetInputFocus) trước Escape; fallback click nút Hủy (thứ 2 từ phải); dump windows + chụp `m6-dialog.png`.
5. **`clickSubmenuItem`:** hover từng bước 3 nấc, thử lại ở mép phải dòng, kiểm tra cả cửa sổ con của popup (`listChildWindows`), dump windows + chụp root khi không thấy submenu.
6. **M7:** hover đúng dòng 3 (code cũ hover nhầm dòng 2); target = `recent[0]` lúc chạy M7; seed `recentProjects=[FIXTURE1]` vào `settings.json` trong `main()` (sau `rm USERDATA`, trước launch đầu tiên; retry 3 lần + đọc lại verify vì VM có quirk EPERM thoáng qua khi ghi file); poll tên project tới 10s thay vì đọc 1 lần sau 1,5s.
7. **Guard `openTopMenu`:** nếu `bands.length !== 5` thì chụp lại menuBarBands tối đa 2 lần nữa (600ms), nếu vẫn sai thì chụp ảnh ROOT (`-menubar-gone-root.png`) để phân biệt menu bar mất thật vs XGetImage trả backing store cũ, rồi fail-fast (không click theo tọa độ rác).
8. **`phaseDclick`:** luôn launch app (không argv nếu target thiếu) rồi mới kiểm chứng D1 — sửa crash lượt 1 run-2 ("Cannot read properties of null (reading 'events')" vì D1 fail-fast bỏ luôn launch, D2a đọc `session.cdp.events` null).
9. **PRE unpacked fallback:** khi test bằng `--binary` (unpacked), bỏ so sánh sha AppImage (vô nghĩa + AppImage có thể đang bị rebuild ghi đè — gặp thật: 2 lần đọc sha liên tiếp ra 2 sha khác nhau); thay bằng verify snapshot qua `strings` trên `app.asar` (bundle `index-*.js` + cờ `rename-project-dialog`) + ghi asar sha.
10. **Copy log:** chỉ copy log đúng display (`h9-.*-d<DISPLAY>.log`) — lượt 2 run-2 đã lẫn log d141 của J2 vào OUT r53j3b (đã xóa 2 file đó).
11. **D1 tự tạo lại target (thêm sau reboot 21:55 UTC):** nếu target là VCUT1 mặc định mà thiếu (chạy `--only dclick`, hoặc menu phase không chạy / M5 không mở file nào), tự copy `FIXTURE1` → VCUT1 (verify `meta.name === "H9 Doubleclick"`) để D1/D3 có file thật. Chỉ áp dụng cho VCUT1 mặc định; file do M5 mở (`OPENED_FILE`) thì KHÔNG tự tạo — fail-fast giữ nguyên để không che bug M5. Đã kiểm chứng ở r53j3f: note "D1: tự tạo lại … từ fixture chuẩn (testdir bị xóa)", D1 chạy thật thay vì fail-fast.

## 3. Kết quả chi tiết từng case

Báo cáo JSON + log app đã copy về OUT (sống sót qua reboot 21:55 UTC — `/tmp` bị xóa sạch, xem §7):

- `hidden_files/h9/r53j3/h9-report.json` — full run-1 AppImage đợt 52: 15/39.
- `hidden_files/h9/r53j3b/h9-report.json` — diag 12/12 + full run-2 (snapshot): 9/16 (menu phase crash vì nghẽn tải — xem §7).
- `hidden_files/h9/r53j3c/h9-report.json` — menu re-run (snapshot): 9/30.
- `hidden_files/h9/r53j3d/h9-report.json` — menu re-run (snapshot): 9/30.
- `hidden_files/h9/r53j3e/h9-report.json` — dclick (snapshot, trước fix D1): 3/7.
- `hidden_files/h9/r53j3f/h9-report.json` — dclick (snapshot, sau fix D1): 3/7.

### 3.1 Menu phase — r53j3d (snapshot, chạy 21:50–21:53 UTC, display :139)

| Case | Kết quả | Ghi chú |
|---|---|---|
| PRE fixture | PASS | 1258/1253 byte, tự tạo/verify |
| PRE snapshot | PASS | asar `eb893825…`, bundle `index-CwcDTNVS.js` |
| M0 sample load | PASS | clip count=3 |
| W0 đóng welcome modal | PASS | nút "Để sau" |
| M1 menu bar 5 nhóm | PASS | centers x=16,70,125,171,228 |
| M2 popup Tệp 8 mục | PASS | rows=8 |
| M3 Lưu thành… (dialog nhập tên J4) | PASS | đổi tên thành "M3 Doi ten" thật, 0 exception |
| M4 Lưu dự án | FAIL | dialog đóng, file **không ghi** (GTK typing — J1); `currentPath=null` |
| M5 Mở dự án… (GTK) | FAIL | dialog đóng, `onOpenFile: false`, tên vẫn "M3 Doi ten" (GTK typing — J1) |
| M6 Thêm media… / Escape | **PASS (thật)** | dialog title "Thêm media vào dự án" 1124x822, đóng bằng Escape sau focus — xem §4 |
| M7 Mở gần đây | FAIL | submenu mở (rows=2), `onOpenFile: true`, nhưng tên kẹt "Dự án không tên" sau poll 10s — xem §4 |
| M8 Xuất video… | FAIL | guard kích hoạt (1 dải sau 3 lần chụp) — xem §5 |
| M9 Dự án mới | PASS | action `new-project`, clips 3 → 0 |
| M10 Hoàn tác | FAIL | action `undo: false`, clips=0 |
| M11 Làm lại | FAIL | action `redo: false` |
| M12 Chọn tất cả + Xóa | FAIL | `select-all: false`, `delete: false` |
| M13 Sao chép + Dán | FAIL | `copy: false, paste: false` |
| M14 Cắt | FAIL | `cut: false` |
| M15 Nhân bản clip | FAIL | `duplicate: false` |
| M16 Tải lại | FAIL | `click Tải lại: false` |
| M17 Phóng to / reset zoom | FAIL | innerWidth 1440 → 1440 → 1440 |
| M18 Toàn màn hình | FAIL | 1440x900 → 1440x900 → 1440x900 |
| M19 Ngôn ngữ EN ↔ VI | FAIL | `lang en: false`, menu bar EN 1 dải |
| M20 DevTools | FAIL | không thấy DevTools target |
| M21 Thu nhỏ cửa sổ | FAIL | map-state=2 sau Thu nhỏ (vẫn Viewable) |
| M22 Giới thiệu | FAIL | không thấy dialog |
| M23 Phím tắt | FAIL | không thấy dialog |
| M24 Báo lỗi… | FAIL | không thấy dialog |
| M25 Tài liệu hướng dẫn | FAIL | app còn chạy (không crash) nhưng `openExternal` không được kiểm chứng qua action |
| M26 Thoát | FAIL | `click Thoát: false`, exitCode=null |

M10–M26 fail theo cùng một mẫu (guard 1 dải hoặc action=false) — không phải 17 bug riêng lẻ, mà là 1 nguyên nhân chung (§5).

### 3.2 Dclick phase — r53j3f (snapshot, chạy 22:13–22:15 UTC, sau fix D1)

| Case | Kết quả | Ghi chú |
|---|---|---|
| PRE fixture / PRE snapshot | PASS | như trên |
| D1 Double-click .vcut (argv) | FAIL | **bug sản phẩm mới trên snapshot**: `onOpenFile: false`, tên "Dự án mới", `currentPath=null`; app log không có dòng argv/open-file nào — xem §6.1 |
| D2a Lưu thành… (tạo file thứ hai) | FAIL | dialog nhập tên trong app hoạt động (input "Dự án mới", xác nhận true, **0 exception prompt** — J4); nhưng dialog lưu GTK gõ path không ghi file → `/tmp/h9-test-139/H9-Second.vcut` không có, `currentPath=null` (GTK typing — J1) |
| D2b Second-instance | FAIL | instance 2 exitCode=0 (handoff single-instance tốt); `onOpenFile: true`; `currentPath` đúng fixture; nhưng tên kẹt "Dự án không tên" sau poll 10s (kỳ vọng "H9 Second") — cùng bug `loadProject` như M7 (§4) |
| D3 xdg-open | PASS (ghi nhận) | xdg-open exit=3 — VM không có association (`www-browser`/`links`/`lynx` not found); app nhận thêm open-file: 0 lần. Pass này là "ghi nhận hành vi thực tế", không chứng minh được association |
| D4 Đóng cửa sổ (role close) | FAIL | `click: false`, exitCode=null — xem §6.3 |

r53j3e (trước fix D1) khác r53j3f ở 2 điểm: D1 fail-fast (file target không tồn tại vì `/tmp` bị reboot xóa — đúng thiết kế fail-fast, app vẫn launch không argv); D3 xdg-open exit=2 (file không tồn tại). Còn lại giống hệt (D2a/D2b/D4 fail cùng lý do).

## 4. Kết luận M6 / M7 — kèm bằng chứng

### 4.1 M6 — BUG HARNESS, đã sửa, PASS thật (không phải bug sản phẩm)

- **Code cũ click nhầm dòng:** `clickMenuItem(session, 0, 3)` nhưng theo `menu.ts` dòng 2 mới là "Thêm media…", dòng 3 là "Mở gần đây" (comment cũ ghi ngược). Bằng chứng: `r53j3/shots/m6-dialog.png` cho thấy popup Tệp với "Mở gần đây" highlight + cửa sổ submenu 195x40@330,173 trong window list; `r53j3/shots/m6-media.png` cho thấy popup 8 dòng.
- Cú click cũ mở submenu Mở gần đây thay vì dialog; `waitAnyDialog` vớ phải popup còn mở (250x298, title rỗng) rồi Escape đóng popup → **PASS GIẢ** ở run-1. Đợt 52 fail cũng cùng nguyên nhân.
- **Sau fix (click dòng 2):** r53j3c và r53j3d M6 **PASS thật** — dialog tìm bằng title `"Thêm media vào dự án" 1124x822@0,0`, đóng bằng Escape (sau focus), không file nào mở thêm. **Kết luận: Escape đóng được dialog GTK thật; M6 không phải bug sản phẩm.**
- Bài học giữ lại trong code: dialog fallback chỉ chấp nhận width>=400 (popup menu ~250px không được tính là dialog) để không lặp lại PASS GIẢ.

### 4.2 M7 — BUG HARNESS (sai dòng hover) đã sửa; còn lại là BUG SẢN PHẨM (tên không áp dụng khi load)

- **Code cũ hover nhầm dòng:** `clickSubmenuItem(session, 0, 2, ...)` nhưng dòng 2 là "Thêm media…" (không có submenu), dòng 3 mới là "Mở gần đây". Bằng chứng: `r53j3/shots/m7-recent-no-sub-root.png` cho thấy chuột highlight "Thêm media…", không có submenu nào.
- **Sau fix (hover dòng 3 + seed recent):** r53j3c và r53j3d M7 — submenu MỞ (rows=2), click entry → `onOpenFile: true`. Phần harness của M7 nay hoạt động.
- **Phần còn fail là bug sản phẩm:** tên trong ô nhập kẹt ở "Dự án không tên" thay vì "H9 Doubleclick", **dù đã poll tới 10s** (r53j3d). Không phải load chậm — load đã xong (content đúng: fixture có 3 clip y hệt project mẫu — `mau-1.webm`, `mau-2.webm`, text "Xin chào! Đây là VCut Studio" — nên không phân biệt được bằng clip count; `currentPath` ở D2b cũng đúng fixture). Chỉ có **tên** là không áp dụng.
- Cơ chế (đọc code, chưa sửa): `openProjectFileFlow` (`apps/web/src/lib/openProjectFlow.ts`) gọi `st.setProjectName(res.name)` với `res.name` từ `loadProject` (`apps/web/src/lib/projectRepo.ts:1011` `let name = "Dự án không tên"` và `:1155` `name: name && name.trim().length > 0 ? name : "Dự án không tên"`). Với file `.vcut` bare-spec (chỉ có `meta.name`, không có trường `name` ở cấp khác), `loadProject` trả về tên mặc định thay vì `meta.name` — cùng chữ ký lỗi mà J4 đã ghi trong LIMITS của mình ("load thành 'Dự án không tên' — bug loadProject"). D2b cho cùng chữ ký: `onOpenFile: true`, `currentPath` đúng, tên sai. **Đây là việc của luồng sửa `loadProject`, không phải harness.**
- Nợ kiểm chứng cho M7: harness nên trả lời dialog discard-confirm một cách chủ động (xem §5) rồi mới poll tên — hiện M7 vẫn để dialog tự treo (xem §5).

## 5. Cascade M8→M26 — dialog `window.confirm` không được trả lời

**Bằng chứng quyết định (ảnh root do guard mới chụp):**

- `r53j3d/shots/m8-export-menubar-gone-root.png`: ở phía trên màn hình có dialog native **"Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục?"** với 2 nút Ok/Cancel, đang mở. Project lúc đó: tên "Dự án không tên", 3 clip, cờ "Chưa lưu".
- `r53j3d/shots/m26-exit-menubar-gone-root.png`: **cùng dialog đó vẫn còn mở ở M26**, project lúc này đã trống (0 clip, tên "Dự án mới", cờ "Đã lưu" — M9 đã reset).
- Dialog này là `window.confirm(...)` ở `apps/web/src/lib/openProjectFlow.ts:47`, gọi qua `confirmDiscardProject()` trong `openProjectFromPath` (`apps/web/src/desktop.ts:138`) — chạy khi mở file mà project hiện tại đang dirty (sau M3 đổi tên + M4 lưu thất bại, project chưa từng được lưu).

**Cơ chế cascade:**

1. M7 click entry Mở gần đây → `openProjectFromPath` → project dirty → `window.confirm` mở (modal, chặn JS).
2. Harness không xử lý dialog này (M7 chỉ poll tên) → dialog treo.
3. Khi dialog modal mở, vùng menu bar trong ảnh chụp cửa sổ chỉ còn **1 dải** (nhãn Tệp/Chỉnh sửa/Xem/Cửa sổ/Trợ giúp không detect được — dialog che/khóa vùng menu). Guard mới retry chụp lại 2 lần (600ms) — cả 3 lần đều 1 dải, centers x=161 — rồi chụp root + fail-fast đúng như thiết kế (không click mù). M8 và M26 đều kích hoạt guard.
4. M10–M25 fail với `action: false` theo cùng mẫu. **Đây không phải 17 bug menu riêng lẻ** — là 1 dialog chặn toàn bộ.
5. **Ngoại lệ M9:** M9 PASS (action `new-project`, clips 3 → 0). Cơ chế chính xác chưa xác định dứt điểm — giả thuyết hợp lý nhất: `pressEscape()` cuối M8 (dọn panel) đã dismiss dialog confirm của M7 dưới dạng Cancel, giải phóng menu cho M9; dialog thấy ở M26 là một instance mở sau đó (hoặc cùng dialog nếu Escape không dismiss được và cú click M9 vẫn lọt qua). **Mở, cần probe riêng:** log trạng thái dialog (listWindows) ở đầu mỗi case M8–M26.

**Việc cần làm (cho đợt sau, không phải J3 đợt này):**

- Harness: xử lý dialog discard-confirm một cách chủ động trong M7/D2b/D1 — trả lời **Ok** (muốn test đường load) hoặc **Cancel** (muốn test đường hủy) qua CDP `Page.handleJavaScriptDialog` hoặc click nút Ok trên cửa sổ dialog bằng X11 — rồi mới đo tên/path. Hiện tại harness để dialog treo và mọi case sau đều chết theo.
- Sản phẩm (ghi nhận, không sửa lén): `window.confirm` đồng bộ chặn toàn bộ renderer; đường mở file qua menu/recent/double-click đều đi qua nó. Nếu project dirty, bất kỳ thao tác mở nào cũng treo app cho tới khi user trả lời — hành vi này đúng về mặt UX (hỏi trước khi bỏ thay đổi) nhưng harness phải tính đến nó trong mọi case mở file.

## 6. Các phát hiện khác (bug sản phẩm ghi lại, không sửa)

### 6.1 D1 (argv double-click) — bug sản phẩm MỚI trên snapshot: argv không tới renderer

- r53j3f: app launch với argv `/tmp/h9-test-139/H9-Doubleclick.vcut` (file đã được D1 tự tạo lại từ fixture, verify `meta.name="H9 Doubleclick"`), nhưng sau 2,5s: `onOpenFile: false`, tên "Dự án mới" (project mặc định), `currentPath=null`, `recent[0]` vẫn là fixture đã seed.
- App log `h9-dclick-d139.log` **không có dòng nào về argv / open-file / ENOENT** — main process dường như không nhận/xử lý argv, hoặc gửi event trước khi renderer đăng ký listener (race `findProjectPathInArgv` ↔ `onOpenFile`).
- Phân biệt với D2b: D2b (second-instance, cùng snapshot) thì `onOpenFile: true` — đường IPC khi app đang chạy hoạt động; chỉ đường **argv lúc khởi động** là hỏng. Cần luồng khác điều tra `main.ts` (argv parse + thời điểm gửi `vcut:open-file` so với `did-finish-load` / preload register). J3 không sửa (ngoài phạm vi harness).
- Lưu ý: D1 ở full run-1/run-2 trước đây fail-fast (file thiếu) nên bug này chưa từng được đo — r53j3f là lần đầu D1 chạy thật trên snapshot.

### 6.2 D2a/D2b/M4/M5 — nợ GTK typing (J1) vẫn nguyên

- M4, M5, D2a đều fail ở cùng một bước: dialog lưu/mở GTK mở ra ("Lưu dự án" / "Mở dự án…") nhưng **gõ path không ghi file** — file không xuất hiện trên đĩa, `currentPath=null`. Dialog thì đóng được (Escape hoặc gõ path + Return đóng dialog nhưng file không ghi).
- Phần dialog nhập tên trong app (J4) hoạt động tốt: M3 PASS, D2a xác nhận dialog xuất hiện + 0 exception `window.prompt`. Nợ còn lại thuần túy là GTK typing — thuộc J1.
- D2b chứng minh single-instance handoff tốt (instance 2 exitCode=0 trong 20s) — chỉ tên là sai (bug `loadProject`, §4.2).

### 6.3 D4 — click Đóng cửa sổ fail, lý do không được ghi lại

- r53j3e/r53j3f: `click: false; exitCode=null`. `clickMenuItem(session, 3, 1)` trả `ok:false` nhưng record của J4 chỉ log `r.ok` (không log `r.reason`) nên không biết fail ở guard hay ở click dòng.
- Ảnh `r53j3f/shots/d4-close.png` cho thấy **welcome modal ("Chào mừng tới VCut Studio") vẫn đang mở** trong phaseDclick — phase này không đóng modal (W0 chỉ chạy ở menu phase; `phaseD4` của J4 có `closeWelcome()` riêng). Modal DOM không chặn menu native về lý thuyết, nhưng trạng thái cửa sổ lúc D4 (sau D2b + D3) chưa được đối chiếu.
- Việc cần làm: (a) record thêm `r.reason` ở D4; (b) đóng welcome modal ở đầu phaseDclick (như W0); (c) đo exitCode bằng `phaseD4` của J4 (D4a/D4b/D4c — J3 chưa chạy phase này; nợ exitCode=127 đợt 51 vẫn chưa được đo lại trên snapshot).

### 6.4 M3/D2a/D3 trên snapshot mới — dialog nhập tên trong app của J4 HOẠT ĐỘNG

- J4 đã thêm `apps/web/src/components/project/RenameProjectDialog.tsx` + sửa `apps/web/src/desktop.ts` và `apps/desktop/src/main.ts` (hash khác baseline đợt 53) + sửa case M3/D2a/D3 trong harness (helper `driveRenameDialog`, `[data-testid="rename-project-dialog"]`). Trên snapshot mới (asar chứa `rename-project-dialog`): diag D3 PASS (dialog xuất hiện, input "Dự án mẫu", xác nhận true, dialog lưu mở, Escape hủy); menu r53j3c/r53j3d M3 PASS (đổi tên thành "M3 Doi ten" thật, 0 exception). M3/D2a trên AppImage cũ sẽ là đỏ-trước theo thiết kế của J4 (dialog không xuất hiện) — không phải regression của J3.

## 7. Môi trường / quirk đã gặp đợt 53

- **VM reboot ~21:55 UTC (06/11):** `uptime` 1 phút lúc 21:56:42; toàn bộ `/tmp` bị xóa (mất `/tmp/h9-*.log`, mất testdir). **Bằng chứng sống sót** vì harness copy log app + report JSON về OUT (`hidden_files/h9/r53j3d/`) trước khi reboot — thiết kế copy-về-OUT đã cứu run r53j3d (9/30, hoàn thành 21:53:46, ngay trước reboot). D1 tự tạo lại target (§2.1.11) sinh ra từ chính sự cố này.
- **GPU flags có tác dụng:** không còn `GPU process launch failed: error_code=1002` (đợt 52 có 3 lần) và không còn `FATAL: GPU process isn't usable. Goodbye.` trong bất kỳ run r53j3 nào; chỉ còn `GPU process exited unexpectedly: exit_code=15` lúc shutdown (benign, theo SIGTERM khi closeAppClean) + `Network service crashed` 1 lần (run-1). Log kiểm chứng: `r53j3d/h9-menu-d139.log`, `r53j3f/h9-dclick-d139.log` (grep `FATAL|error_code=1002` = 0).
- **Xvfb/xkb race vẫn còn** (đợt 52 §7): đã thêm retry 3 lần vào `startXvfb`; không gặp lỗi spawn Xvfb nào trong các run r53j3 (kể cả sau reboot, display :139 lên sạch).
- **VM quirk EPERM thoáng qua khi ghi file** (đợt 52 §4.8): `writeFile` settings.json tạo file 0 byte rồi EPERM ở lượt 2 run-2; đã thêm retry 3 lần + đọc lại verify cho seed recent (M7).
- **Load VM cao khi nhiều luồng chạy song song:** loadavg 9–13 lúc 21:15–21:35 (J2 chạy harness song song trên :141 + J6 chạy Playwright Chrome); full run-2 menu phase crash (M0 `sampleLoaded=false` + `cdp timeout Runtime.evaluate`) trong lúc đó — nhiều khả năng nghẽn do tranh chấp, chưa kết luận là lỗi snapshot; diag trên cùng snapshot vẫn chạy tốt. **Không chạy lại khi J2/J6 đang chiếm tải nặng — kiểm tra `uptime` + `ps` trước mỗi run.**
- **AppImage/`.deb` trong `release/` bị rebuild liên tục bởi sibling** trong suốt đợt 53 — kết quả snapshot chỉ có giá trị cho asar `eb893825…` (xem §1). `process.poll` trên exec nền đôi khi trả "completed" sớm giả — luôn kiểm tra log file trực tiếp thay vì tin poll.

## 8. Nợ mở (cho đợt sau)

1. **M4/M5/D2a — GTK typing không ghi file (J1):** dialog GTK mở ra nhưng gõ path không tạo file. M4/M5/D2a đều fail vì bước này.
2. **M7/D2b/D1 — tên project kẹt "Dự án không tên" (bug `loadProject`):** file load được (content + currentPath đúng ở D2b) nhưng `meta.name` không áp dụng. Cần sửa `loadProject` (`projectRepo.ts:1011,1155`) đọc `meta.name` từ bare-spec `.vcut`. J4 đã ghi nhận cùng chữ ký.
3. **D1 (argv) — argv `.vcut` không tới renderer trên snapshot (§6.1):** `onOpenFile: false`, app log không có dòng argv. Cần điều tra `findProjectPathInArgv` / thời điểm gửi event.
4. **Cascade M8→M26 — harness chưa xử lý dialog discard-confirm (§5):** thêm bước trả lời dialog chủ động (CDP `Page.handleJavaScriptDialog` hoặc click Ok/Cancel bằng X11) vào M7/D2b/D1; log trạng thái dialog ở đầu mỗi case M8–M26; làm rõ cơ chế M9 PASS.
5. **D4 — chưa đo được exitCode:** record thêm `r.reason`; đóng welcome modal ở đầu phaseDclick; chạy `phaseD4` của J4 (D4a/D4b/D4c) để đo lại exitCode=127 đợt 51 trên snapshot mới.
6. **D3 — xdg-open chưa kiểm chứng được association:** VM không có browser/handler cho `.vcut` (exit 2/3); cần `.desktop` cài sẵn hoặc môi trường có handler thật mới đo được đường xdg-open.
7. **AppImage mới 410 MB (22:09) chưa được test:** J3 chỉ test snapshot asar `eb893825…`; cần chạy lại diag + menu trên AppImage mới (ghi rõ sha) khi sibling ngừng rebuild.
8. **`ci-security.yml` vẫn chưa lên GitHub** (403 quyền workflows — nợ chung từ Phase 6, không thuộc J3).

## 9. Stage

Batch J3 (file text, NUL-delimited — xem `~/workspace/repo-1-push/paths-loop/phase9-round53-j3-harness.txt`):

- `apps/desktop/scripts/click-test-menu.mjs`
- `docs/PHASE9_ROUND53_J3_HARNESS_LIMITS.md` (file này)

**Không stage:** `hidden_files/h9/make-fixture.mjs` (nằm ngoài repo-1, không thuộc cây push); binary/dist/snapshot unpacked (`~/.tmp-h9/`, 1,3 GB); ảnh chụp `.png` trong `hidden_files/h9/r53j3*/shots/` (bằng chứng tại chỗ, không đưa vào batch); log `/tmp/h9-*.log` (đã mất sau reboot — bản copy nằm trong OUT `hidden_files/h9/r53j3*/`).
