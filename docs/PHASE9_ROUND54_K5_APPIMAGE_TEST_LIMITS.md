# PHASE 9 — Đợt 54 — Luồng K5: Test AppImage mới (LIMITS)

Ngày: 2026-11-07 (giờ UTC trong log; giờ VN = UTC+7). Repo local `~/workspace/repo-1`.
Luồng K5: smoke test + click-test menu rút gọn trên AppImage mới nhất trong
`apps/desktop/release/`. **Không push, không release/tag, không code giả.
Không sửa code nào (xem §7) — chỉ test + ghi LIMITS.**

## 0. Tóm tắt nhanh

| Hạng mục | Kết quả |
|---|---|
| AppImage được test | `vcut-studio-0.1.0-x86_64.AppImage`, **576.688.128 byte**, sha `2a15ea90…` (xem §1) |
| Diag (12 case) | **12/12 PASS** |
| Menu M0–M26 (30 case) | **9/30** — đúng tập PASS như r53j3d (snapshot asar `eb893825…`) |
| J1 GTK save flow, đường click Save (5 case) | **5/5 PASS** — M4/M5 của harness fail là do đường tương tác cũ, không phải lỗi sản phẩm (§4.1) |
| Dclick lần 1 | **crash launch: 126 × 2 lần** (race giải nén song song, §4.6) — chạy lại sau khi máy yên thì qua |
| Dclick lần 2 (7 case) | **3/7** — D1 argv tái hiện (file load được, event miss + tên sai), D2a GTK typing, D2b handoff tốt nhưng tên sai, D3 pass-ghi-nhận, D4 click fail |
| D4 exit-code (7 case) | **5/7** — D4a/D4b/D4e **exitCode=0** (nợ exit-127 đã đóng với đường thoát tươi); D4c/D4d không đo được exit do guard menu-bar |
| GPU FATAL (`error_code=1002` / `FATAL: GPU process isn't usable`) | **1 lần** trong 8 log app (dclick, lúc shutdown — §4.7); `error_code=1002`: **0 lần** |
| Bridge mồ côi sau thoát | **0 process mồ côi** trong mọi run K5; pidfile dọn sạch khi thoát sạch, còn sót khi app bị kill (§4.8) |
| Bug sản phẩm MỚI do K5 sửa | **Không có** — không sửa code (xem §7) |
| tsc | **Không chạy** — K5 không chạm code nào (theo đúng quy định task) |

## 1. Binary được test — đọc trước khi diễn giải kết quả

- **AppImage 410 MB (build J4 đợt 53, 410.119.959 byte, 22:09 UTC 06/11) mà task
  giao đã KHÔNG CÒN trên đĩa** — đã bị rebuild khác ghi đè. File còn lại duy
  nhất trong `release/` lúc K5 chạy (06:35–07:35 +07 07/11):
  - `apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage`
  - **576.688.128 byte (~550 MiB), mtime 2026-11-06 22:12:36 UTC**
  - **sha256 `2a15ea90c61e86ff1ed69dc15f6eb27153533bb2749690cea933fbc2ca82c819`**
  - sha kiểm tra lại cuối lượt (00:35 UTC): **không đổi** — không có rebuild
    nào khác ghi đè trong lúc K5 test.
  - app.asar bên trong (giải nén 1 lần để lấy fingerprint, đã xóa sau đó):
    sha `73257757085dc2699d703f53c590ff5c435bc837f2be9d439816119d3e578214`
    (3.558.084 byte), bundle **`index-CcjxMH90.js`** (khác snapshot đợt 53
    `index-CwcDTNVS.js` — đúng là build web mới hơn), có chuỗi
    `rename-project-dialog`.
  - `.deb` **không có** trong `release/` (chỉ còn `builder-debug.yml`,
    `linux-unpacked/`, AppImage).
- Bản copy đóng băng để test (tránh sibling rebuild ghi đè giữa chừng):
  `hidden_files/h9/r54k5/vcut-studio-0.1.0-x86_64.AppImage` — sha đã verify
  khớp release trước mỗi run (PRE của harness PASS cả 6 lần chạy). **Bản copy
  này là binary bằng chứng, KHÔNG stage.**
- Kết quả dưới đây chỉ có giá trị cho đúng AppImage sha `2a15ea90…` này.
- Lưu ý về harness: trong lúc K5 chạy, luồng song song K4 đang sửa file dùng
  chung `apps/desktop/scripts/click-test-menu.mjs` (thêm `answerDiscardDialog`,
  record `D1-argv`, phase `dialogprobe`). Mỗi run của K5 load file harness tại
  thời điểm bắt đầu run đó; kết quả của K5 là kết quả của AppImage, không phụ
  thuộc phiên bản harness — nhưng số thứ tự/diễn giải chi tiết cần đọc kèm
  LIMITS của K4 về phần harness.

## 2. Các lượt chạy của K5 (đều trên AppImage sha `2a15ea90…`)

Môi trường chung: Xvfb `:147` 1600x1000 (diag/menu/dclick/d4) hoặc `xvfb-run -a`
(J1, display `:104`), CDP 9247 (harness) / 9235 (J1), userdata
`/tmp/h9-userdata-k5` riêng, testdir `/tmp/h9-test-k5` riêng, OUT duy nhất
`hidden_files/h9/r54k5/` (xem lưu ý về report bị ghi đè ở §6.4).

| # | Lượt chạy | Thời gian (UTC) | Kết quả |
|---|---|---|---|
| 1 | `--only diag` | 23:44–23:47 06/11 | **12/12 PASS** |
| 2 | `--only menu` | 23:51–23:56 | **9/30** (M0/W0/M1/M2/M3/M6/M9 + 2 PRE) |
| 3 | J1 gtk-save (`click-test-gtk-save-53j1.mjs`) | 00:00–00:03 07/11 | **5/5 PASS** (lần launch 1 fail 127, lần 2 OK) |
| 4 | `--only dclick` lần 1 | 00:06–00:10 | **crash launch 126 × 2** (xem §4.6) |
| 5 | `--only dclick` lần 2 | 00:12–00:14 | **3/7** |
| 6 | `--only d4` | 00:16–00:32 | **5/7** (D4a/D4b/D4e exit 0) |

VM reboot 1 lần trong lúc K5 làm việc (~23:47 UTC, ngay sau lượt diag —
uptime 2 phút lúc 23:49), xóa sạch `/tmp` (mất log `/tmp/h9-diag-d147.log`
gốc + toàn bộ process đợt 53 còn sót: vite 5281, bridge dev 8788, Chrome
Playwright của J5). Bằng chứng lượt diag sống sót nhờ harness copy log về
OUT trước khi reboot. Các lượt sau reboot chạy trên máy sạch (RAM trống
~942 MB, tốt hơn trước reboot).

### 2.1 Diag 12/12 (lượt 1)

| Case | Kết quả |
|---|---|
| PRE Fixture / PRE AppImage | PASS (sha `2a15ea90…` = release/) |
| D0 baseline cửa sổ + welcome modal | PASS — cửa sổ chính `VCut Studio — Trình dựng video` 1440x900@80,50; welcome modal **không mở** lúc đầu (khác r53 — fresh profile) |
| D1 đóng welcome modal | PASS (modal đã đóng sẵn) |
| D2 menubar sau đóng modal: popup Tệp | PASS — rows=8 |
| D3 Lưu thành… dialog nhập tên | PASS — 0 exception, dialog nhập tên trong app + dialog lưu GTK `Lưu dự án` 1124x822, Escape đóng được |
| D3b cửa sổ 200x200 phải UNMAPPED | PASS — `vcut-studio` 200x200 mapState=0 (Unmapped, còn sót vô hại) |
| D4 menubar sau Lưu thành… | PASS — rows=8 |
| D5 nút Trợ giúp | PASS — rows=5 |
| D6 thuộc tính cửa sổ 200x200 | PASS — overrideRedirect=1, InputOutput |
| D7 dời cửa sổ 200x200 rồi mở popup | PASS — rows=8 |
| D8 ẩn cửa sổ 200x200 | PASS (bỏ qua — đã mở được ở D7) |

### 2.2 Menu 9/30 (lượt 2) — giống hệt tập PASS của r53j3d

| Case | Kết quả | Ghi chú |
|---|---|---|
| PRE Fixture / PRE AppImage | PASS | sha `2a15ea90…` |
| M0 project mẫu load | PASS | clip count=3 (`mau-1.webm`, `mau-2.webm`, `Xin chào! Đây là VCut Studio`) |
| W0 đóng welcome modal | PASS | nút "Để sau" |
| M1 menu bar 5 nhóm | PASS | centers x=16,70,125,171,228 |
| M2 popup Tệp 8 mục | PASS | rows=8 |
| M3 Lưu thành… (dialog nhập tên J4) | PASS | đổi tên thành "M3 Doi ten" thật, 0 exception; dialog GTK mở, Escape hủy, không ghi file |
| M4 Lưu dự án | FAIL | dialog đóng (Escape dọn), file **không ghi**, `currentPath=null` — xem §4.1 (đường Return, không phải lỗi sản phẩm) |
| M5 Mở dự án… (GTK) | FAIL | dialog đóng, `onOpenFile: false`, tên vẫn "M3 Doi ten", `currentPath=null` — xem §4.1 |
| M6 Thêm media… / Escape | PASS | dialog title "Thêm media vào dự án" 1124x822, Escape đóng sau focus |
| M7 Mở gần đây | FAIL | submenu mở (rows=2), `onOpenFile: true`, tên kẹt "Dự án không tên" sau poll 10s — bug sản phẩm `loadProject` (§4.2) |
| M8 Xuất video… | FAIL | guard kích hoạt (menu bar 1 dải sau 3 lần chụp) — cascade dialog discard-confirm (§4.5) |
| M9 Dự án mới | PASS | action `new-project`, clips 3 → 0 |
| M10 Hoàn tác | FAIL | `undo: false`, clips=0 — kỳ vọng harness sai, by design (§4.9) |
| M11 Làm lại | FAIL | `redo: false` — như M10 |
| M12 Chọn tất cả + Xóa | FAIL | `select-all: false`, `delete: false`; setup undo khôi phục 0 clip |
| M13 Sao chép + Dán | FAIL | `copy: false, paste: false` |
| M14 Cắt | FAIL | `cut: false` |
| M15 Nhân bản clip | FAIL | `duplicate: false` |
| M16 Tải lại | FAIL | click `Tải lại: false`; marker `truoc-reload` còn (không reload thật) |
| M17 Phóng to / reset zoom | FAIL | innerWidth 1440 → 1440 → 1440 |
| M18 Toàn màn hình | FAIL | 1440x900 → 1440x900 → 1440x900 (không đổi geometry theo X) |
| M19 Ngôn ngữ EN ↔ VI | FAIL | `lang en: false`, menu bar EN 1 dải |
| M20 DevTools | FAIL | không thấy DevTools target |
| M21 Thu nhỏ cửa sổ | FAIL | map-state=2 sau Thu nhỏ (vẫn Viewable) |
| M22 Giới thiệu | FAIL | không thấy dialog |
| M23 Phím tắt | FAIL | không thấy dialog |
| M24 Báo lỗi… | FAIL | không thấy dialog |
| M25 Tài liệu hướng dẫn | FAIL | app còn chạy nhưng `openExternal` không kiểm chứng được qua action |
| M26 Thoát | FAIL | `click Thoát: false`, exitCode=null (guard 1 dải) |

### 2.3 J1 GTK save flow 5/5 (lượt 3) — đường click Save trên AppImage mới

| Case | Kết quả |
|---|---|
| J1-PRE AppImage | PASS (sha `2a15ea90…`) |
| J1-SETUP project mẫu | PASS — clip count=3 |
| J1-J1 Ctrl+Shift+S mở dialog đổi tên | PASS — action tới renderer, dialog trong DOM (input="Dự án mẫu") |
| J1-J2 dialog GTK Lưu dự án mở | PASS — `Lưu dự án` 1124x822 |
| J1-J2 trọn flow (đổi tên + click Save) | PASS — nút Save tìm được (2 cột, hàng 799); dialog đóng bởi click-save; log `dialog-save-project: canceled=false filePath=/home/hatch/J1-G1-shortcut-save.vcut`; file CÓ (meta "Dự án mẫu", 2 tracks, JSON hợp lệ); `currentPath` đúng |

### 2.4 Dclick lần 2 — 3/7 (lượt 5; lần 1 crash launch, xem §4.6)

| Case | Kết quả | Ghi chú |
|---|---|---|
| PRE Fixture / PRE AppImage | PASS | |
| D1 Double-click .vcut (argv) | FAIL | `onOpenFile: false`, tên "Dự án không tên" (kỳ vọng "H9 Doubleclick") — NHƯNG `currentPath=/tmp/h9-test-k5/H9-Doubleclick.vcut` **đúng** và `recent[0]` đúng (§4.3) |
| D2a Lưu thành… file thứ hai | FAIL | dialog nhập tên trong app OK (0 exception), dialog lưu đóng sau gõ path, file `/tmp/h9-test-k5/H9-Second.vcut` **không có** — GTK typing (§4.1) |
| D2b Second-instance | FAIL | instance 2 exitCode=0 nhưng ghi "(thoát trong 20s: false)" — mâu thuẫn ghi nhận của harness (§4.10); `onOpenFile` nhận fixture: **true**; tên "Dự án không tên" (kỳ vọng "H9 Second") — `loadProject` (§4.2) |
| D3 xdg-open | PASS (ghi nhận) | xdg-open exit=3 — VM không có handler (`www-browser`/`links`/`lynx` not found); app nhận thêm open-file: 0 lần |
| D4 Đóng cửa sổ (role close) | FAIL | `click: false`, exitCode=null — không ghi lý do (nợ cũ J3 §6.3, xem §4.4) |

### 2.5 D4 exit-code — 5/7 (lượt 6)

| Case | Kết quả | Ghi chú |
|---|---|---|
| PRE Fixture / PRE AppImage | PASS | |
| D4a Thoát qua menu Tệp | **PASS — exitCode=0** | click Thoát: true; pgrep: không còn tiến trình. Nợ exit-127 đợt 51 **đã đóng với đường thoát tươi** (§4.4) |
| D4b Đóng cửa sổ | **PASS — exitCode=0** | click: true; pgrep: không còn tiến trình |
| D4c Double-click khi app sống | FAIL | instance 2 exitCode=0, thoát trong 20s: true; `onOpenFile`: true; `currentPath` đúng; nhưng tên "Dự án không tên" + **instance 1 Thoát: click false, exitCode=null** (guard menu-bar 1 dải) |
| D4d Mở .vcut qua argv rồi Thoát | FAIL | `currentPath` đúng fixture; không có dialog discard-confirm (project sạch); tên "Dự án không tên"; **Thoát: click false, exitCode=null** (guard menu-bar 1 dải) |
| D4e App sống 30s rồi Thoát | **PASS — exitCode=0** | app sống trước Thoát: true; click: true; pgrep: không còn tiến trình |

## 3. Smoke test — kết luận theo từng mục task giao

- **Khởi động:** lên được, CDP page `app://vcut/index.html`, React mount
  (`textLen=4192`, `rootChildren=1`), project mẫu load 3 clip. Thời gian từ
  spawn tới mount: ~10–20s sau khi giải nén xong (giải nén 576 MB mất
  thêm ~1–2 phút dưới tải).
- **Cửa sổ chính:** `VCut Studio — Trình dựng video` 1440x900@80,50 trên
  Xvfb 1600x1000 — hiện đúng.
- **Menu bar đủ:** 5 nhóm Tệp/Chỉnh sửa/Xem/Cửa sổ/Trợ giúp, centers
  x=16,70,125,171,228 (M1 PASS; popup Tệp 8 mục, Trợ giúp 5 mục).
- **Mở project mẫu:** M0 PASS (3 clip, đủ nhãn).
- **1 thao tác editor cơ bản:** M9 Dự án mới (clips 3 → 0, action tới
  renderer) PASS; M3 đổi tên project thật PASS; M6 mở/đóng dialog Thêm
  media PASS. Play/timeline: clip count đọc được qua DOM; **không chạy
  play thật có tiếng/hình trong lượt này** (harness không có case play;
  xem §6.5).
- **Thoát sạch:** D4a/D4b/D4e exitCode=0, pgrep không còn tiến trình
  Electron; bridge chết cùng app; pidfile dọn sạch khi thoát sạch (§4.8).
  Ngoại lệ: đường thoát sau second-instance/argv (D4c/D4d) chưa đo được
  exit do guard menu-bar; K4 đo được 127 ở đường tương tự (xem §4.4).

## 4. Phát hiện (bug sản phẩm ghi lại — K5 không sửa)

### 4.1 M4/M5/D2a fail là ĐƯỜNG TƯƠNG TÁC CŨ của harness, không phải lỗi sản phẩm

- `gtkTypePath` (harness chung) làm: Ctrl+L → gõ path → **pressReturn** →
  chờ dialog đóng. Theo J1 (đợt 53), Return sau khi gõ path **không submit**
  dialog GTK dưới Xvfb (quirk GTK/Xvfb); đường hỗ trợ là **click nút Save**.
- Bằng chứng trên AppImage mới: script J1 (đường click Save) **5/5 PASS** —
  file ghi thật, JSON hợp lệ, `currentPath` đúng (§2.3). Trong khi M4/M5/D2a
  (đường Return) fail đúng bước này trên cùng build.
- Kết luận: **không có regression lưu/mở file trên AppImage mới.** Harness
  chung cần cập nhật M4/M5/D2a sang click Save (việc của luồng harness — K4
  đang sửa file này; K5 không đụng vào để tránh xung đột).
- Lưu ý: M5 lần này dialog đóng được sau gõ path (`typed=true`) nhưng file
  không load (`onOpenFile: false`, `currentPath=null`) — Return đóng dialog
  mà không chọn file (có thể rơi vào nút Cancel mặc định). Khác M4 (dialog
  không đóng, phải Escape dọn).

### 4.2 Bug sản phẩm `loadProject`: tên kẹt "Dự án không tên" — TÁI HIỆN trên AppImage mới

- Chữ ký giống hệt J3 §4.2 (đợt 53): file load được (content/clip đúng,
  `currentPath` đúng, recent đúng) nhưng tên trong ô nhập kẹt ở
  "Dự án không tên" thay vì `meta.name`.
- Tái hiện ở: **M7** (submenu Mở gần đây, poll 10s), **D1** (argv),
  **D2b** (second-instance), **D4c/D4d** (harness ghi rõ trong detail).
  Luồng K3/K4 đợt 54 đo độc lập cùng chữ ký (K3 P7: `onOpenFile` 0→1,
  clips=3, tên "Dự án không tên"; K4 D1 tương tự).
- Cơ chế (đọc code, chưa sửa — J3 §4.2): `loadProject`
  (`apps/web/src/lib/projectRepo.ts:1011,1155`) không lấy `meta.name` từ
  file `.vcut` bare-spec. **Nợ mở — cần luồng sửa `loadProject`, không
  phải việc K5.**

### 4.3 D1 (argv double-click) — tinh chỉnh phát hiện của J3 §6.1

- J3 (snapshot): `onOpenFile: false`, `currentPath=null` → kết luận argv
  không tới renderer.
- K5 trên AppImage mới (lượt dclick 2, sau khi K4 thêm `answerDiscardDialog`
  trả lời dialog discard-confirm): `onOpenFile: false` **nhưng**
  `currentPath=/tmp/h9-test-k5/H9-Doubleclick.vcut` **đúng**,
  `recent[0]` đúng, `lastProjectPath` trong settings.json đúng, tên
  "Dự án không tên" (bug §4.2). D4d (argv + Thoát) cũng `currentPath` đúng.
- Kết luận tinh chỉnh: **argv CÓ tới được app và file CÓ load**
  (ground truth là `currentPath` + recent — K4 đã tách record `D1-argv`
  theo hướng này); chỉ có **event `onOpenFile` tới renderer bị miss**
  (probe đăng ký sau khi event phát — race mount) và **tên không áp dụng**
  (bug §4.2). Cần luồng khác điều tra thời điểm gửi `vcut:open-file` so
  với `did-finish-load` / preload register — K5 không sửa.

### 4.4 Exit code 127 — đã đóng với đường thoát tươi, còn lửng ở đường second-instance

- **Mới, đo trực tiếp trên AppImage này:** D4a (menu Thoát) **exitCode=0**,
  D4b (Đóng cửa sổ) **exitCode=0**, D4e (sống 30s rồi Thoát) **exitCode=0** —
  cả 3 đều fresh launch → thoát sạch, pgrep không còn process.
- Đối chiếu: K4 (cùng AppImage, cùng đợt) đo D4 trong phase dclick (sau
  D2a/D2b/D3) được **click: true, exitCode=127**. D4c/D4d của K5 (cũng sau
  second-instance/argv) **không đo được exit** vì click Thoát fail ở guard
  menu-bar 1 dải (xem §4.5), exitCode=null.
- Kết luận: **127 không còn là hành vi mặc định khi thoát** (đợt 51 đo 127
  mọi đường). Nó chỉ còn xuất hiện ở đường thoát sau second-instance
  forward — tương quan với GPU FATAL lúc shutdown ở lượt dclick của K5
  (§4.7). Cơ chế gốc (main/serviceLifecycle shutdown sau forward) chưa
  được chứng minh tới cùng — cần luồng riêng điều tra, không phải K5.

### 4.5 Cascade M8→M26 — dialog discard-confirm vẫn chặn menu phase

- Như J3 §5: sau M7 load file khi project đang dirty (đổi tên "M3 Doi ten",
  chưa lưu), `window.confirm` "Có thay đổi chưa lưu thành file. Bỏ thay đổi
  và tiếp tục?" mở và **không được trả lời** trong menu phase → menu bar
  chỉ còn 1 dải (centers x=161) ở M8 và M26, guard fail-fast; M10–M25 fail
  theo cùng mẫu. M9 PASS (như J3 — nhiều khả năng Escape cuối M8 đã
  dismiss dialog dạng Cancel, giải phóng menu cho M9).
- K4 (đợt 54) đã thêm `answerDiscardDialog` (CDP auto-accept) vào phase
  dclick/d4 — bằng chứng: lượt dclick 2 + D4 của K5 có note "CDP dialog
  auto-accept: confirm…" và D4c/D4d xử lý được dialog. **Menu phase vẫn
  chưa có bước này** — việc còn lại cho luồng harness.
- Ảnh bằng chứng: `shots/d4c-exit-menubar-gone-root.png`,
  `shots/d4d-exit-menubar-gone-root.png` (guard chụp root khi menu-bar
  1 dải — D4c/D4d cũng dính cùng mẫu).

### 4.6 Launch fail thoáng qua 126/127 — race giải nén song song, không phải lỗi AppImage

- Quan sát được trong các lượt K5 (tổng cộng 5 lần fail launch rồi retry OK,
  trừ dclick lần 1 fail cả 2 lần):
  - J1 lần 1: exit **127**; lần 2 OK.
  - Dclick lần 1: exit **126 × 2 lần** (cả 2 attempt) — lúc đó K4 đang chạy
    phase dclick song song (launch app thứ 2 của họ).
  - D4a lần 1: exit **127**; lần 2 OK.
  - D4d lần 1: **không thấy CDP page target sau 600s** (note của harness;
    code chờ 300s/attempt — text "600s" trong message là sai số, xem §6.6);
    lần 2 OK.
  - D4e lần 1: **không thấy CDP page target sau 600s**; lần 2 OK.
- Cơ chế (đã xác minh 1 phần): AppImage với `APPIMAGE_EXTRACT_AND_RUN=1`
  giải nén vào `$TMPDIR/appimage_extracted_<md5>` — **md5 chỉ phụ thuộc
  nội dung file** (3 bản copy khác đường dẫn của K3/K4/K5 đều ra cùng hậu
  tố `ddc15d5441866a7c8ec9bab5cd841738`). Hai run song song cùng nội dung
  sẽ **giải nén/xóa cùng 1 thư mục**: run này đang exec thì run kia xóa
  hoặc đang ghi đè file → exec fail 126 (cannot execute) / 127 (file
  không tìm thấy) / CDP không lên. Khi máy yên (không còn run AppImage
  song song), launch lần 1 đều OK (diag, menu, dclick lần 2).
- Log của attempt fail bị attempt retry ghi đè (cùng đường dẫn log) nên
  nguyên nhân 126/127 **không chứng minh được tới cùng từ log** — chỉ
  còn tương quan thời gian với run song song của K4/K3. Đây là nợ hạ
  tầng test, không phải bug sản phẩm: **đề xuất harness dùng TMPDIR
  riêng mỗi run** (vd. `$TMPDIR` theo `--out`/`--userdata`) để mỗi
  AppImage giải nén vào thư mục riêng.
- Hệ quả khác của race này: note "instance cũ đã VẪN SỐNG sau SIGKILL+pkill
  trước khi spawn dclick/d4d/d4e" xuất hiện 3 lần (K4 cũng gặp) — app cũ
  không chết kịp sau SIGKILL khi đang tranh chấp giải nén/tải nặng, làm
  launch sau chờ CDP tới timeout.

### 4.7 GPU FATAL: 1 lần trong 8 log (lúc shutdown), `error_code=1002`: 0 lần

- Đếm trên 8 log app của K5 (diag/menu/j1/dclick/d4a–d4e): **1 FATAL**
  duy nhất — lượt dclick 2, 00:14:45 UTC, lúc shutdown:
  `FATAL:content/browser/gpu/gpu_data_manager_impl_private.cc:389] GPU process isn't usable. Goodbye.`
  Đi kèm: GPU process exit_code=15 rồi 32512, Network service crashed ×2.
- 7 log còn lại: 0 FATAL, 0 `error_code=1002`. Cờ `--disable-gpu
  --disable-gpu-sandbox` vẫn ngăn lỗi GPU lúc khởi động (như J3).
- FATAL 1 lần này xảy ra lúc `closeAppClean` (D4 click fail → harness
  SIGTERM app) dưới tải cao (loadavg ~9, K6 + sibling đang chạy) — nhiều
  khả năng là đường shutdown, không phải lỗi khởi động. Ghi nhận, chưa
  kết luận nguyên nhân gốc.
- Các dòng dbus `Failed to connect to the bus` / dconf-WARNING xuất hiện
  mọi run — nhiễu VM (không có dbus), không ảnh hưởng test.

### 4.8 Thoát sạch / bridge mồ côi — 0 process mồ côi, pidfile sót khi bị kill

- Sau mỗi run K5 (kiểm tra ngay khi harness kết thúc, trước reboot):
  **không còn process nào** thuộc run đó (app + bridge đều chết; cổng
  8787/9247 nhả; thư mục giải nén `appimage_extracted_ddc15d…` được dọn
  khi app thoát — kiểm chứng: sau lượt dclick 2, thư mục này biến mất
  khỏi `~/.tmp-h9/`).
- Bridge của app chạy trên **8787** (diag/menu/dclick/d4) hoặc **8788**
  (J1 — lúc đó 8787 đã bị bridge của K4 giữ → manager tự chọn cổng khác:
  dynamic port hoạt động). Log: `[vcut-desktop] services: bridge
  http://127.0.0.1:8787 — running`. Bridge là process con dạng
  `vcut-studio …/server/bridge/src/index.js` (electron-as-node), chết
  cùng app.
- Pidfile: `bridge.pid.json` + `electron.pid.json` trong userDataDir được
  **ghi lúc chạy, xóa lúc thoát sạch** (sau lượt menu: thư mục userdata
  chỉ còn `settings.json` + `window-state.json`; sau lượt D4 cũng sạch).
  Sau lượt dclick 2 (app chết bởi FATAL lúc shutdown, §4.7), **cả 2
  pidfile còn sót** nhưng PID ghi trong đó (app 13077, bridge 13228) đều
  đã chết — **stale pidfile, không phải process mồ côi**. Cơ chế tự chữa
  H7 (đợt 51) sẽ xóa pidfile kiểu này ở lần khởi động sau (pid chết →
  xóa, spawn bình thường).
- Lưu ý: 2 process `node server/bridge/src/index.js` (PID 10301, 14417)
  thấy lúc kiểm tra là **bridge dev của sibling đợt 54** (K6 TTS — đường
  dẫn repo, không phải extracted AppImage), không phải của K5, không
  tính là mồ côi từ AppImage.

### 4.9 M10–M26: cascade + kỳ vọng harness sai (giữ nguyên kết luận J2/J3)

- M10/M11 (`undo`/`redo` sau Dự án mới = false): **by design** —
  `clearHistory()` trong `newProject` (J2). Kỳ vọng harness sai, không
  phải bug sản phẩm.
- M12–M15 fail vì setup (undo khôi phục 0 clip sau M11) — hệ quả của
  M10, không phải 4 bug riêng.
- M16–M26: đa số là nạn nhân cascade dialog (§4.5) + M18 fullscreen ẩn
  menubar (J2) — chưa có đo độc lập ngoài cascade trên AppImage này.

### 4.10 Các ghi nhận nhỏ khác

- **D2b mâu thuẫn ghi nhận:** "instance 2 exitCode=0 (thoát trong 20s:
  false)" — exitCode=0 nhưng cờ 20s lại false (harness đọc exitCode sau
  khi poll hết hạn?). Handoff single-instance thì hoạt động tốt
  (`onOpenFile: true`, `currentPath` đúng). Nợ ghi nhận của harness,
  không phải bug sản phẩm.
- **Cửa sổ 200x200** (`vcut-studio`, overrideRedirect) vẫn còn nhưng
  UNMAPPED (diag D3b/D6 PASS) — vô hại, như đợt 53.
- **Models 0/4 trong AppImage:** log mọi run:
  `models: layout=unified root=/tmp/h9-userdata-k5/models — 0/4 model sẵn
  sàng (thiếu: Whisper small, VieNeu-TTS v3 Turbo 0.5B, MOSS Audio
  Tokenizer Nano, BiRefNet general)`. AppImage 576 MB đã gồm venv
  Python (bgremove/TTS) nhưng **không gồm model** — model phải tải riêng
  sau. Ghi nhận đúng thực tế, không phải lỗi test.
- **ffmpeg 8.1.2** bundled, log đủ mọi run.
- **Mở popup Tệp lần 1 không mở được sau dialog GTK** (note lặp lại nhiều
  run: "popup chỉ mở được ở lần click thứ 2 (sau SetInputFocus) — nghi
  focus lạc sau dialog GTK (Xvfb không có WM)") — quirk Xvfb, harness đã
  tự retry và qua.

## 5. So sánh với đợt 53 (cùng AppImage mới vs snapshot cũ)

| Chỉ số | r53j3d (snapshot asar `eb893825…`) | K5 (AppImage `2a15ea90…`) |
|---|---|---|
| Diag | 12/12 | **12/12** |
| Menu | 9/30 (M0/W0/M1/M2/M3/M6/M9) | **9/30 (cùng tập PASS)** |
| Dclick | 3/7 | **3/7** (lần 2; lần 1 crash launch 126) |
| D4 exit | chưa đo (D4 click false) | **D4a/D4b/D4e = 0** (mới, tốt hơn) |
| GPU FATAL | 0 mọi run | **1 (shutdown, dclick)** |
| J1 save flow | 5/5 (AppImage cũ) | **5/5 (AppImage mới)** |
| `loadProject` tên | bug | **bug, tái hiện** |
| D1 argv | `currentPath=null` | **`currentPath` đúng**, event miss (§4.3 — tinh chỉnh) |

**Kết luận tổng:** AppImage mới không regression so với snapshot đợt 53 ở
mọi chỉ số so sánh được; có 2 điểm tốt hơn (D4 exit 0 ở đường tươi; D1
`currentPath` đúng) và 1 điểm xấu hơn cần theo dõi (GPU FATAL 1 lần lúc
shutdown). Các bug còn lại đều là nợ đã biết từ đợt 53, không phải mới.

## 6. Giới hạn / môi trường (trung thực)

1. **VM, không phải máy thật:** Xvfb (không WM thật, không GPU thật, không
   dbus), CPU-only, RAM 8 GB. Mọi kết quả click-test chỉ có giá trị trong
   môi trường này; chưa click-test trên máy thật / macOS / Windows.
2. **Tải song song cao:** trong lúc K5 chạy, K3 (probe menu), K4 (harness
   full), K6 (TTS dev bridge) và luồng dialogprobe chạy cùng lúc; loadavg
   lên tới 9,35; 1 lần VM reboot giữa chừng. Một phần fail launch (126/127)
   và GPU FATAL lúc shutdown có thể do tải — chưa tách được khỏi lỗi sản
   phẩm (xem §4.6/§4.7).
3. **Harness bị sửa song song:** K4 sửa `click-test-menu.mjs` trong lúc K5
   chạy (xem §1). Kết quả K5 đo AppImage, không đo harness — nhưng nếu
   cần chạy lại chính xác từng case thì phải chốt phiên bản harness.
4. **Report JSON bị ghi đè:** K5 dùng chung 1 OUT `hidden_files/h9/r54k5/`
   cho 6 lượt chạy nên `h9-report.json` chỉ còn lượt cuối (D4). Bảng case
   trong LIMITS này được chép lại từ output console từng lượt đã bắt được
   (đầy đủ từng case); log app (.log) + ảnh (.png) của mọi lượt vẫn còn
   nguyên trong OUT để đối chiếu. Report J1 giữ tên riêng nên còn nguyên
   (`h9-report-gtk-save-53j1.json`).
5. **Chưa đo:** play thật có tiếng/hình; render/export thật từ AppImage
   (M8 fail do cascade, không phải do render); import media thật qua
   dialog (M6 chỉ mở/đóng dialog); TTS/caption/bgremove qua AppImage
   (models 0/4 — chưa tải model); .deb (không có file để cài); xdg-open
   association (VM không có handler).
6. **Message sai số trong harness:** `launchAppImage` báo "không thấy CDP
   page target sau 600s" nhưng deadline code là 300s/attempt — text
   message chưa khớp code (ghi nhận, không sửa — file của K4).
7. **Không test lại sau reboot bằng lượt sạch hoàn toàn:** các lượt sau
   reboot chạy xen kẽ với sibling; không có lượt nào chạy một mình trên
   máy hoàn toàn yên (gần nhất là dclick lần 2 lúc K3/K4 vừa xong).

## 7. Vì sao K5 không sửa code

- Không phát hiện **bug sản phẩm mới** nào do K5 tự tìm ra mà sửa được
  nhỏ, an toàn trong lượt: các bug tái hiện (`loadProject`, D1 event
  race, exit-127 sau forward, cascade dialog) đều là nợ đã biết, thuộc
  về luồng khác (sửa `loadProject` chạm core project loading; D1 race
  chạm main/preload timing; dialog cascade đang được K4 xử lý ở harness).
  Sửa ẩu trong lúc K4 đang sửa cùng vùng = rủi ro xung đột cao, lợi ích
  thấp.
- Không sửa harness (M4/M5 click Save, message 600s, ghi D4 reason):
  file đang được K4 sửa song song; K5 đã xác minh đường đúng bằng script
  J1 có sẵn (5/5) thay vì sửa file dùng chung.
- **Không chạy `tsc --noEmit`:** K5 không chạm code nào nên không có
  "phần mình chạm" để kiểm chứng (đúng quy định task). Trạng thái tsc
  của cây sau các sửa đổi của sibling là việc của parent lúc gộp.

## 8. Nợ mở (cho đợt sau — theo thứ tự ưu tiên)

1. **`loadProject` không lấy `meta.name` từ bare-spec `.vcut`**
   (projectRepo.ts:1011,1155) — tái hiện ở M7/D1/D2b/D4c/D4d + K3 P7 +
   K4 D1. Sửa + test lại M7/D1/D2b.
2. **Exit 127 sau second-instance forward** — K4 đo 127, K5 đo 0 ở đường
   tươi; cần đo lại D4c/D4d sau khi guard menu-bar được sửa (K4
   dialogprobe) + trace shutdown main process sau forward.
3. **Harness menu phase chưa trả lời dialog discard-confirm** (M8→M26
   cascade) — K4 đã làm cho dclick/d4, còn menu phase.
4. **Harness M4/M5/D2a dùng Return thay vì click Save** (GTK quirk) —
   cập nhật sang đường J1 đã chứng minh 5/5.
5. **Race giải nén AppImage song song** (126/127, CDP timeout) — dùng
   TMPDIR riêng mỗi run; sửa message "600s" cho khớp deadline 300s.
6. **GPU FATAL 1 lần lúc shutdown** (dclick) — theo dõi xem có lặp lại
   ở lượt yên tĩnh không; nếu lặp, điều tra shutdown GPU path.
7. **D4 click false không ghi reason** (dclick-D4 + D4c/D4d exit click)
   — record thêm `r.reason` như J3 đã đề xuất.
8. **Pidfile sót khi app bị kill** — chấp nhận được (H7 tự chữa ở lần
   sau) nhưng nên có test khẳng định lần sau khởi động sạch.
9. **AppImage 576 MB không gồm model AI (0/4)** — nếu muốn test
   caption/TTS/bgremove trên AppImage thì cần tải model trước (hoặc ghi
   rõ AppImage slim không kèm model).
10. **`ci-security.yml` vẫn chưa lên GitHub** (403 quyền workflows — nợ
    chung từ Phase 6, không thuộc K5).

## 9. Bằng chứng (trong `hidden_files/h9/r54k5/`, không stage)

- `vcut-studio-0.1.0-x86_64.AppImage` — bản copy đóng băng đã test
  (sha `2a15ea90…`, binary — KHÔNG stage).
- Log app: `h9-diag-d147.log`, `h9-menu-d147.log`, `h9-j1-app.log`,
  `h9-dclick-d147.log`, `h9-d4a-d147.log`, `h9-d4b-d147.log`,
  `h9-d4c-d147.log`, `h9-d4d-d147.log`, `h9-d4e-d147.log`,
  `h9-second-instance.log` (mỗi file bắt đầu bằng ~22k dòng listing
  giải nén AppImage — nhiễu của runtime, nội dung app nằm sau đó).
- Report JSON còn lại: `h9-report.json` (lượt D4 cuối),
  `h9-report-gtk-save-53j1.json` (lượt J1, 5/5).
- Ảnh: `shots/` — 67 PNG (menubar, dialog GTK, dialog nhập tên,
  `*-menubar-gone-root.png` cho guard, `d4*-exit.png`).
- `H9-Doubleclick.vcut` (bản copy target D1), `j1/J1-G1-shortcut-save.vcut`
  (file J1 đã ghi thật qua click Save), `settings-after.json`.

## 10. Stage

Batch K5 (file text, NUL-delimited — xem
`~/workspace/repo-1-push/paths-loop/phase9-round54-k5-appimage-test.txt`):

- `docs/PHASE9_ROUND54_K5_APPIMAGE_TEST_LIMITS.md` (file này)

**Không stage:** AppImage copy trong `hidden_files/h9/r54k5/` (binary);
log/ảnh/report trong `hidden_files/h9/r54k5/` (bằng chứng tại chỗ);
fixture `.vcut` trong `hidden_files/h9/fixtures/` (dùng chung, đã có từ
đợt 53, không thuộc cây push).
