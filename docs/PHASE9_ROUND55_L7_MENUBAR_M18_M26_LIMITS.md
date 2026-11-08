# Phase 9 Round 55 — L7: Zombie window M8 + M18–M26 (LIMITS)

Luồng L7 điều tra nợ đợt 54 K4 §3.2 (M8 menubar detection — zombie window
che menu bar) và §4 (M18–M26 fail trong lượt verify4). Repo local
`~/workspace/repo-1`, branch main. KHÔNG push, KHÔNG release/tag.

Bản AppImage test (KHÔNG rebuild — việc của L4):
`apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage`,
sha256 `2a15ea90c61e86ff1ed69dc15f6eb27153533bb2749690cea933fbc2ca82c819`,
576.688.128 byte, mtime 2026-11-06T22:12:36Z — khớp sha trong docs đợt 54 K4.
Môi trường headed riêng: Xvfb display **:153**, CDP 9295, TMPDIR riêng
`/tmp/r55l7-tmp`, userdata/testdir riêng mỗi lượt.

## 0. Kết luận ngắn

- **Zombie window đã xác định chắc chắn** (xem §1): cửa sổ dialog native
  GTK của `window.confirm` ("Có thay đổi chưa lưu thành file. Bỏ thay đổi
  và tiếp tục?"). Sau khi CDP `handleJavaScriptDialog` trả lời xong, JS chạy
  tiếp nhưng **cửa sổ X11 vẫn còn**, che vùng trái menu bar → `menuBarBands`
  chỉ thấy 1 dải thay vì 5. Nó không tự biến mất (poll 15 s vẫn còn), vô
  hình với CDP, và chỉ dọn đúng bằng **X11 click nút trên zombie** (đường
  GTK response để Electron tự dọn). `UnmapWindow`/`DestroyWindow` đều
  không đủ — destroy còn làm menu chết hẳn.
- **M8 ĐÃ SỬA (harness): PASS 5 lần liên tiếp** có fix zombie
  (menu-run1, menu-fix1, menu-v2-1/2/3). Yêu cầu "≥3 lần pass liên tiếp"
  đã vượt.
- **M18 ĐÃ SỬA TIÊU CHÍ (harness): PASS 3/3 lượt v2** với tiêu chí đo
  được (toggle menu ẩn/hiện + thoát F11). Geometry không thành kích thước
  màn hình là **giới hạn môi trường** (Xvfb không WM), không phải bug app.
- **M19 ĐÃ SỬA CHECK (harness): PASS 3/3 lượt v2.** Cơ chế menu→IPC→
  renderer đã được chứng minh thật (lang en tới renderer, menu EN 5 dải).
- **M20, M22, M23, M24, M25, M26: PASS 3/3 lượt v2** — trước đây fail
  chỉ vì cascade (zombie M9 + tường M18), không phải bug riêng.
- **M21 Thu nhỏ: GIỚI HẠN MÔI TRƯỜNG, không sửa được trên Xvfb không WM**
  — FAIL 3/3 lượt v2, click đã tới nơi nhưng map-state vẫn 2 (Viewable).
- **M19b (nợ i18n): FAIL 3/3 trên AppImage cũ** — nhưng luồng **L1 cùng
  đợt 55 đã sửa ở source** (`ProjectMenu.tsx` + `TopBar.tsx` dùng `t()`,
  test 6/6, headed 5/5); chỉ cần rebuild AppImage (việc L4) rồi đo lại.
- Kiểm chứng: `node --check` harness OK, `tsc --noEmit -p
  apps/desktop/tsconfig.json` = **0 lỗi** (không chạm file TS nào).

## 1. Zombie window là gì

### 1.1 Tái hiện (probe `zombieprobe`, Z2)

Mở confirm discard (click "Dự án mới" khi project bẩn) rồi để CDP
`handleJavaScriptDialog` tự trả lời (auto-accept). Kết quả:

- **CDP targets lúc M8 fail: CHỈ có**
  `page:VCut Studio — Trình dựng video:app://vcut/index.html` — zombie
  **vô hình với CDP** (X11-only).
- **Zombie:** id `0x600002`, title `"(không tên)"`, `430x83@0,0`
  (rộng 403–431 px thay đổi theo độ dài message), `mapState=2`
  (Viewable), `overrideRedirect=1`, `class=1`,
  `_NET_WM_WINDOW_TYPE=_NET_WM_WINDOW_TYPE_DIALOG`,
  `WM_TRANSIENT_FOR=0x400002` (= main window id).
- **Che menu bar:** vùng x=80..403, y=50..78 theo tọa độ root →
  `menuBarBands` chỉ thấy **1 dải** (center 175) thay vì 5.
- **Không tự biến mất:** Z3 poll 15 s — zombie còn nguyên, bands vẫn 1.

Nguồn gốc: dialog native GTK của `window.confirm` do app gọi
("Có thay đổi chưa lưu thành file. Bỏ thay đổi và tiếp tục?"). Không
phải window cũ chưa đóng, không phải DevTools, không phải second
instance — mà là **xác cửa sổ dialog đã được CDP trả lời nhưng X11
không dọn**. Renderer trả lời lại bình thường (`confirm` trả về
`true`), chỉ cửa sổ X11 kẹt lại.

### 1.2 Cách dọn nào đúng, cách nào sai (probe Z4/Z5 + zombieprobe2 C)

| Cách dọn | Kết quả đo | Kết luận |
|---|---|---|
| Chờ tự biến mất (Z3, 15 s) | zombie còn nguyên, bands=1 | KHÔNG tự hết |
| `UnmapWindow` (Z4) | bands 1→**0** (vùng menubar thành trống, chưa repaint kịp), mapState=0 nhưng id còn trong tree | KHÔNG đủ |
| `DestroyWindow` (Z5) | cửa sổ biến mất khỏi tree, bands hồi **5**, renderer vẫn trả lời, bodyText bình thường — **nhưng menu CHẾT**: không popup nào mở được (Tệp/Xem/Cửa sổ đều fail, 6 click) | KHÔNG đủ — Electron vẫn tưởng dialog đang mở |
| **X11 click nút Ok trên zombie** (zombieprobe2 case C) | cửa sổ biến mất, bands=**5**, popup Tệp mở lại được (rows=8) | **ĐÚNG** — đường GTK response để Electron tự dọn |

Lưu ý: popup ở case C chỉ mở ở **click thứ 2 sau SetInputFocus** —
quirk focus Xvfb không WM đã biết (lần 1 không mở được), không phải
lỗi dọn zombie.

### 1.3 Bug thứ tự guard trong `openTopMenu` (phát hiện ở lượt menu-run1)

Check cũ `if (topIndex >= bands.length) return...` đứng **TRƯỚC**
guard dọn zombie (`bands.length !== 5`). Với bands=1, mọi topIndex≥1
fail-fast mà không dọn zombie → menu-run1: M10–M25 chết theo sau
zombie của M9, chỉ M26 (topIndex=0) được dọn rồi PASS. Đã sửa: guard
dọn zombie chạy **TRƯỚC** check topIndex (xem §2.2).

## 2. Đã sửa gì (chỉ harness `apps/desktop/scripts/click-test-menu.mjs`)

11 marker `ROUND55-L7`. Không sửa code sản phẩm trong luồng này
(L4 đang làm M19–M26, tránh giẫm; nợ i18n M19b do L1 làm).

### 2.1 `answerDiscardDialog` — nhánh `cdp-stale` dọn zombie qua X11

Sau khi kết luận renderer đã trả lời (dialog đã được CDP trả lời,
cửa sổ chỉ là xác cũ): click nút zombie qua X11 (`clickDialogButton`,
Ok = fromRight 1 / Cancel = fromRight 0 theo `accept`), chờ
`windowGone`, đo lại bands; trả `via: "cdp-stale-cleaned"` nếu cửa sổ
biến mất **và** bands=5, nếu không vẫn `via: "cdp-stale"` + ghi rõ
trong detail. (Trước đây nhánh này chỉ kết luận "đã trả lời" mà
không dọn xác cửa sổ — chính là nguyên nhân M8 fail.)

### 2.2 `openTopMenu` — thứ tự guard + dọn lại lần cuối

- Guard dọn zombie chạy **TRƯỚC** check `topIndex >= bands.length`
  (sửa bug §1.3).
- Sau 2 lần chụp lại, nếu bands vẫn != 5 thì gọi
  `answerDiscardDialog` thêm 1 lần rồi chụp lại 1 lần cuối trước khi
  fail (đề phòng zombie xuất hiện sau lần quét đầu / XGetImage
  thoáng qua).
- Khôi phục dòng chụp root chẩn đoán (`-menubar-gone-root.png`)
  trong fail block.

### 2.3 M18 viết lại theo tiêu chí đo được (theo fsprobe F0–F4, 8/8 PASS)

Tiêu chí cũ ("geometry thành kích thước màn hình" + tắt bằng menu)
không đo được trên Xvfb không WM **và** gây cascade (menu đã ẩn thì
không click menu để tắt được → M19–M26 chết theo, quan sát ở lượt
menu-fix1). Tiêu chí mới: click bật → verify menu ẩn (bands != 5) →
thoát bằng **F11** (keysym 0xffc8) → verify bands về 5 + geometry về
cũ. Detail ghi rõ: geometry không đổi là GIỚI HẠN MÔI TRƯỜNG.

Số đo fsprobe: click FS → geometry 1440x900@80,50 **không đổi**
(màn hình 1600x1000), `_NET_WM_STATE=[]` (không có FULLSCREEN),
bands 5→2 (centers 591,685); F11 → bands về 5, geometry về cũ;
sau đó menu mở lại + action undo tới renderer (F4 PASS).

### 2.4 M19 sửa check sai + thêm M19b

- Check cũ `/Export/ && !/Xuất/` **sai**: nút EN là **"Publish"**,
  không bao giờ có "Export" (K3 §4: bodytext EN: Publish=1, Cut
  silence=1, Export=0). Check mới: `/Publish/ && /Cut silence/`,
  thêm `menuEn = bandsEn.length === 5`.
- Thêm case mới **M19b** đo riêng nợ i18n thật: các literal `Mới`,
  `Lưu thành…`, `Xuất bản nén`, `Nhập bản nén`, `Lịch sử`, `Chưa lưu`,
  `Bắt đầu` còn tiếng Việt ở chế độ EN (ProjectMenu.tsx literal cứng
  + không `useLang()`; TopBar.tsx:196 "👋 Bắt đầu"). M19b FAIL cho tới
  khi AppImage mới gồm fix L1 được đo lại.

### 2.5 Probe mới trong harness

`--only zombieprobe` (7/4), `--only zombieprobe2` (9/9),
`--only fsprobe` (8/8) + helper `wmStateNames`, `windowTypeName`
(đọc `_NET_WM_STATE` / `_NET_WM_WINDOW_TYPE`).

## 3. Kết quả đo (số thật)

### 3.1 Probe

| Probe | Kết quả | Ghi chú |
|---|---|---|
| zombieprobe | **7 passed / 4 failed** | Z0/Z0b/Z1/Z2/Z3 PASS (Z2 tái hiện M8: zombie 430x83, bands=1; Z3: không tự biến mất sau 15 s). Z4 FAIL (unmap: bands 1→0), Z5 FAIL (destroy: bands=5 nhưng menu chết). Z6/Z7 FAIL nhưng **VÔ HIỆU** vì menu đã chết sau destroy (click chưa từng tới menu). |
| zombieprobe2 | **9 passed / 0 failed** | A-modal/A0 baseline PASS (popup Tệp mở được trước zombie, rows=8), B1 PASS (zombie 431x83, bands=1, guard từ chối click mù), C PASS (click Ok: cửa sổ biến mất, bands=5, popup mở lại rows=8), D/E bỏ qua (C đã hồi), F PASS. |
| fsprobe | **8 passed / 0 failed** | F1: click FS → geometry không đổi, `_NET_WM_STATE=[]`, bands 5→2. F2: F11 → bands về 5. F4: menu mở lại + undo tới renderer. |

### 3.2 Menu full — trước / sau

| Lượt | Tổng | M8 | M18 | M19 | M20 | M21 | M22 | M23 | M24 | M25 | M26 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| verify4 (đợt 54 K4, dev-electron, baseline) | 24/19 | FAIL (action false, textLen 4196→4196) | FAIL (geometry không đổi) | FAIL (lang en false, menu EN 2 dải) | FAIL (không thấy DevTools target) | FAIL (map-state=2) | FAIL (không thấy dialog) | FAIL | FAIL | FAIL | FAIL (click false, exitCode null, process còn sống) |
| menu-run1 (code cũ, AppImage) | 11/20 | **PASS** (action true, textLen 3975→6469) | FAIL | FAIL (menu EN 1 dải) | FAIL | FAIL (map-state=2) | FAIL | FAIL | FAIL | FAIL | **PASS** (exitCode=0) |
| menu-fix1 (đã sửa guard-order, M18 cũ; **bị kill ở M24, không có report JSON**) | — | **PASS** (lần 2) | FAIL — tường M18: bands=2 sau bật, M19–M23 cascade | — | — | — | — | — | — | — | — |
| **menu-v2-1** (code cuối) | **21/10** | **PASS** | **PASS** (tiêu chí mới) | **PASS** | **PASS** | FAIL (env) | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **menu-v2-2** (code cuối) | **24/7** | **PASS** | **PASS** | **PASS** | **PASS** | FAIL (env) | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |
| **menu-v2-3** (code cuối) | **24/7** | **PASS** | **PASS** | **PASS** | **PASS** | FAIL (env) | **PASS** | **PASS** | **PASS** | **PASS** | **PASS** |

Chi tiết lượt v2 (mỗi lượt 31 case incl. PRE/M0/W0):

- **v2-1 (21/10):** fails = M4, M5, M7, M10, M12, M13, M14, M15, M19b,
  M21. M4 lần này file ghi được (1567 byte, meta "M3 Do ten") nhưng
  JSON thiếu tracks → M5/M7 kéo theo fail tên (kỳ vọng "H9 Doubleclick"
  nhưng tên thực "M3 Doi ten" — xem §5).
- **v2-2 (24/7):** fails = M10, M12, M13, M14, M15, M19b, M21.
  M4/M5/M7 PASS khi M4 ghi đủ tracks.
- **v2-3 (24/7):** fails = M10, M12, M13, M14, M15, M19b, M21 —
  giống hệt v2-2.

Số đo M19 (v2-1/2/3 giống nhau): lang en tới renderer: true; web EN
(Publish + Cut silence): true; menu bar EN 5 dải; về vi: true.
Số đo M20: DevTools target `devtools://devtools/bundled/devtools_app.html?remoteBase=...`,
đóng xong: true. M22: dialog "Giới thiệu VCut Studio" 577x365, nút
Đóng click được, dialog đóng. M24: dialog "Báo lỗi", thấy 4 nút, Đóng
click được. M26: click Thoát true, exitCode=0, pgrep còn tiến trình:
false.

**Kết luận đếm:** M8 PASS **5 lần liên tiếp** có fix zombie
(run1, fix1, v2-1, v2-2, v2-3). M18/M19/M20/M22–M26 PASS **3/3**
lượt v2 trên code cuối — đủ yêu cầu "mỗi case đã sửa ≥2 lần pass".

## 4. Phân loại M18–M26

| Case | Kết luận | Vì sao |
|---|---|---|
| M18 Toàn màn hình | **ĐÃ SỬA TIÊU CHÍ — PASS 3/3** | Toggle FS (menu ẩn/hiện) + thoát F11 đo được và pass. Geometry resize là **giới hạn môi trường**: Xvfb không WM nên không ai resize cửa sổ hay set `_NET_WM_STATE` FULLSCREEN — cần máy thật/WM mới kiểm chứng. |
| M19 Ngôn ngữ | **ĐÃ SỬA CHECK — PASS 3/3** | Check cũ sai tên nút EN. Cơ chế menu→IPC→renderer hoạt động thật trên AppImage này. |
| M19b i18n literals | **NỢ SẢN PHẨM — FAIL 3/3 trên AppImage cũ** | 7 literal còn VI ở chế độ EN: "Mới", "Lưu thành…", "Xuất bản nén", "Nhập bản nén", "Lịch sử", "Chưa lưu", "Bắt đầu". **L1 cùng đợt 55 đã sửa ở source** (24 key `t()`, test 6/6, headed 5/5 — xem `docs/PHASE9_ROUND55_L1_I18N_PROJECTMENU_TOPBAR_LIMITS.md`). AppImage test (06/11 22:12) ra đời trước fix L1 nên vẫn fail — cần rebuild (L4) rồi đo lại, không phải sửa thêm code. |
| M20 DevTools | **PASS 3/3** | Trước đây fail chỉ vì cascade zombie/M18 (K3 đã PASS trên AppImage này). |
| M21 Thu nhỏ | **GIỚI HẠN MÔI TRƯỜNG — FAIL 3/3, không sửa** | Click đã tới nơi (case chạy đủ check) nhưng role minimize cần WM: sau Thu nhỏ map-state vẫn 2 (Viewable). K3 xác nhận 2/2 lượt. Không có openbox/xfwm4/metacity trên VM nên không verify được dưới WM. |
| M22 Giới thiệu | **PASS 3/3** | Cascade đã hết. |
| M23 Phím tắt | **PASS 3/3** | Cascade đã hết. |
| M24 Báo lỗi | **PASS 3/3** | Cascade đã hết. |
| M25 Tài liệu | **PASS 3/3** | Cascade đã hết (openExternal không crash app). |
| M26 Thoát | **PASS 3/3** | Cascade đã hết (exitCode=0, không mồ côi). |

## 5. Nợ mở (không thuộc luồng này, ghi nhận trung thực)

- **M4/M5/M7 flake theo trạng thái M4** (ngoài M18–M26 nhưng liên
  quan): M4 gõ path qua dialog GTK không ổn định — v2-1 file ghi được
  nhưng JSON thiếu tracks → M5/M7 fail tên; v2-2/v2-3 M4 ghi đủ tracks
  → M4/M5/M7 đều PASS. Harness lấy kỳ vọng tên từ meta file M4 vừa
  ghi ("M3 Doi ten") chứ không cố định "H9 Doubleclick" — nên M7
  v2-1 fail là **tương tác fixture**, không phải bug zombie. Nợ GTK
  typing: xem doc L3 cùng đợt 55
  (`docs/PHASE9_ROUND55_L3_GTK_SAVE_TYPING_LIMITS.md`).
- **M7 — tên kẹt "Dự án không tên" khi load fixture:** bug
  `loadProject` đã biết; fix K1 có ở repo nhưng **CHƯA có trong
  AppImage cũ 22:12 06/11** (verify4 trên dev-electron có fix thì M7
  PASS). Chờ rebuild rồi đo lại.
- **M10–M15 — undo sau Dự án mới không khôi phục clip:** action tới
  renderer đều true (undo/select-all/delete/copy/paste/cut/duplicate)
  nhưng clips 0→0 — hành vi undo của sản phẩm, không phải menu.
  L5 cùng đợt 55 đang làm
  (`docs/PHASE9_ROUND55_L5_UNDO_AFTER_NEW_LIMITS.md`).
- **M18 geometry / M21 minimize:** giới hạn môi trường (§4) — cần
  WM thật hoặc máy thật.
- **`.deb` biến mất khỏi `release/`; `.github/workflows/ci-security.yml`
  403 chưa lên GitHub** (nợ cũ từ đợt 54, vẫn chờ user cấp quyền).
- EPERM thoáng qua khi ghi file (K4 §4) — không tái hiện trong đợt này.

## 6. Bằng chứng

`~/workspace/goals/capcut-clone-video-editor/hidden_files/round55-l7/`:

- `zombieprobe/` + `h9-report.json` + `shots/` (gồm
  `z2-zombie-root.png` — zombie che menubar, `z5-after-destroy.png` —
  menubar hồi 5 dải sau destroy nhưng menu chết) + `zombieprobe-stdout.log`
- `zombieprobe2/` + `h9-report.json` (9/9) + `zombieprobe2-stdout.log`
- `fsprobe/` + `h9-report.json` (8/8) + `fsprobe-stdout.log`
- `menu-run1/` + `h9-report.json` (11/20) + `menu-run1-stdout.log`
- `menu-fix1-stdout.log` (bị kill ở M24, **không có report JSON** —
  chỉ có stdout log)
- `menu-v2-1/` + `h9-report.json` (21/10), `menu-v2-2/` (24/7),
  `menu-v2-3/` (24/7) + stdout log từng lượt
- `menu-run2/`, `menu-fix2/`: các lượt cũ bị **hủy giữa chừng** vì vô
  giá trị kiểm chứng (trước sửa guard-order / sau khi phát hiện tường
  M18) — không tính vào số liệu.

Lệnh chạy chuẩn (từ `~/workspace/repo-1`):

```bash
TMPDIR=/tmp/r55l7-tmp node apps/desktop/scripts/click-test-menu.mjs \
  --only menu --display 153 --cdp-port 9295 \
  --out <OUT> --userdata /tmp/r55l7-... --testdir /tmp/r55l7-... \
  --appimage ~/workspace/repo-1/apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage \
  --skip-deb
```

Probe: thay `--only menu` bằng `--only zombieprobe|zombieprobe2|fsprobe`.

## 7. Lưu ý vận hành (đã mắc, ghi lại để khỏi lặp)

- `pkill -f "<pattern>"` tự khớp chính dòng lệnh shell của mình nếu
  pattern xuất hiện trong lệnh → tự kill shell (SIGTERM). Luôn dùng
  mẹo bracket: `pkill -f "[r]emote-debugging-port=9295"`,
  `pkill -f "Xvfb:15[3]"`. Chỉ kill process của mình (display :153 /
  CDP 9295); **KHÔNG** động vào Xvfb :151/:152/:156 hay process luồng
  khác — luồng L4 chạy song song trên display :152 / CDP 9252.
- Welcome modal xuất hiện **MUỘN** (sau sample load) — probe phải đóng
  modal kiểu W0 (chờ ≤30 s, bấm "Để sau", verify đã đóng) trước khi đo
  menu, nếu không modal DOM là confound (dù nó không chặn menu native).
- Popup menu native trên Xvfb không WM thường chỉ mở ở **click thứ 2
  sau SetInputFocus** — harness đã xử lý, không phải lỗi app.
