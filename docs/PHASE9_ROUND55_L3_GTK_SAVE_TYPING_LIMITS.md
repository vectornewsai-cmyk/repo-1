# Phase 9 — Đợt 55 — Luồng L3: Gõ path trong dialog GTK "Lưu dự án" — NGUYÊN NHÂN GỐC + SỬA HARNESS

Ngày: 2026-11-07 (làm việc 09:39 → ~13:00 +07).
Repo: `~/workspace/repo-1` (vectornewsai-cmyk/repo-1, branch main). KHÔNG push trong
lượt này — chỉ stage file text; user tự push sau từ main chat.
Phạm vi: điều tra + sửa bug "gõ path qua dialog GTK không ghi được file"
(nợ D2a/M4/M5 từ đợt 53 J1 + đợt 54 K4 §4.1). Đọc trước:
`docs/PHASE9_ROUND53_J1_GTK_SAVE_DIALOG_LIMITS.md` và
`docs/PHASE9_ROUND54_K4_DISCARD_CONFIRM_D1_LIMITS.md` §4.

## 0. Kết luận ngắn (đọc phần này là đủ)

**Không có bug sản phẩm nào. Nợ M4/M5/D2a đóng được bằng 3 sửa HARNESS trong
`apps/desktop/scripts/click-test-menu.mjs` (không chạm code sản phẩm):**

1. **`gtkTypePath` submit bằng Return — Return KHÔNG BAO GIỜ submit dialog GTK
   trên Xvfb này** (6/6 variant Return fail: V0/V1/V3/V5/V6/V7 — dialog ở
   nguyên, chỉ Escape mới đóng, main log `canceled=true`). Đây là quirk
   GTK/Xvfb, không phải bug sản phẩm: click nút Save/Mở ghi/mở file đúng.
   Sửa: submit bằng click nút phải nhất (Save / Mở) thay cho Return.
2. **Gõ đè tên mặc định `Du an mau.vcut.json` giữ lại hậu tố `.json`** — GTK chỉ
   chọn phần `Du an mau.vcut`, gõ thay phần chọn, `.json` còn lại → dialog trả
   path + `.json` (V2: file ghi ra `.vcut.json`, currentPath lệch; paste qua
   clipboard để lại `.vcut` — V8). Sửa: click thẳng ô Name + Ctrl+A trước
   khi gõ để chọn hết tên mặc định (chỉ dialog Lưu; dialog Mở không có tên
   mặc định nên chỉ Ctrl+L + gõ như cũ).
3. **M4/M5/M7/D1 đọc tên file app ghi mà không bóc envelope `{spec}`** — app ghi
   file dạng `{"format": "vcut-project", ..., "spec": {...}}` nên `j.meta` /
   `j.tracks` ở top-level luôn `undefined`: M4 `valid=false` dù file ghi đúng,
   M5/M7/D1 `expectName` kẹt "H9 Doubleclick" dù tên thật là "M3 Doi ten".
   Sửa: đọc qua `j?.spec ?? j` như D2a đã làm (4 chỗ: M4, M5, M7, D1).
4. **Finder nút dialog dùng minGap=6 gộp 2 nút Cancel/Save thành 1 cột**
   (J1 đợt 53 §5.2 đã chứng minh; `clickDialogButton` chung vẫn minGap=6) —
   click rơi vào khe giữa 2 nút, dialog không đóng. Sửa: thêm helper riêng
   `clickGtkDialogRightButton` dùng minGap=3, chỉ dùng cho dialog GTK lưu/mở;
   không đổi `clickDialogButton` chung (các dialog nhỏ khác không ảnh hưởng).

**Sau sửa, chạy lại bằng chính harness chung: menu phase 24/31 pass
(trước sửa 13/31), dclick phase 6/8 pass — M4, M5, M7, D2a đều PASS.**
7 fail còn lại ở menu toàn nợ cũ (M10/M12–M15 chuỗi undo sau Dự án mới,
M19b i18n, M21 thu nhỏ cửa sổ); 2 fail ở dclick (D1, D2b) chỉ sai ở bước kiểm
tra TÊN — do AppImage test (build 06/11 22:12) cũ hơn bản sửa loadProject của
K1 (đợt 54, đã sửa trong source, chưa đóng gói lại) — xem §6.

## 1. Thay đổi trong lượt này (chỉ 1 file harness + 1 LIMITS)

| File | Đổi gì |
|---|---|
| `apps/desktop/scripts/click-test-menu.mjs` | (a) `gtkTypePath` mới: dialog Lưu → click ô Name + Ctrl+A rồi gõ, submit bằng click nút phải nhất; dialog Mở → Ctrl+L + gõ, submit bằng click nút. (b) Mới `clickGtkDialogRightButton` (finder minGap=3 cho dialog GTK). (c) 4 chỗ đọc tên file app ghi: bóc envelope `j?.spec ?? j` (M4, M5, M7, D1). Không đổi logic case nào khác, không chạm `clickDialogButton` chung. |
| `docs/PHASE9_ROUND55_L3_GTK_SAVE_TYPING_LIMITS.md` | File này. |

Không chạm: code sản phẩm (`apps/desktop/src/*`, `apps/web/src/*` — không có
bug sản phẩm), workflow, release/. Build artifact (không stage): AppImage copy
đã verify sha trong `hidden_files/round55-l3/`.

## 2. Phương pháp

- Chạy trên Xvfb RIÊNG `:151` (tự spawn tay, `1600x1000x24`, không auth),
  userdata riêng, TMPDIR riêng, CDP 9251 — không đụng display/port/TMPDIR
  của luồng round 55 khác (L4 build AppImage, L7 zombieprobe :153).
- AppImage test: copy của `apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage`,
  **sha256 `2a15ea90c61e86ff1ed69dc15f6eb27153533bb2749690cea933fbc2ca82c819`,
  576.688.128 byte** — khớp release/ (ghi rõ ở PRE của mọi lượt chạy).
- Script thí nghiệm riêng (fork từ J1):
  `hidden_files/round55-l3/gtk-save-typing-55l3.mjs` — 9 variant đối chứng
  (V0–V8) trên cùng 1 app instance, mỗi variant 1 target khác nhau, đọc main
  log `dialog-save-project:` làm ground truth cho path dialog trả về.
- Bằng chứng: report `hidden_files/round55-l3/l3-report.json` (thí nghiệm),
  `l3-verify-report.json` (verify 5/5), `harness-menu/h9-report.json`
  (menu trước sửa: 13/18), `harness-menu2/h9-report.json` (menu sau sửa:
  24/7), `harness-dclick/h9-report.json` (dclick sau sửa: 6/2), app log
  `app-l3*.log`, screenshot `shots/l3-v*-*.png`, file `.vcut` đã ghi trong
  `testdir/` (V4/R1–R3) và `testdir-harness/` (VCUT1/VCUT2 của harness).

## 3. Kết quả thí nghiệm đối chứng (9 variant, AppImage sha 2a15ea90…)

Flow mỗi variant: Lưu thành… (menu click hoặc Ctrl+Shift+S) → dialog đổi tên
trong app (xác nhận) → dialog GTK "Lưu dự án" → gõ → submit → kiểm tra file
+ `currentPath` + main log. Tất cả các variant đều: action tới renderer,
0 exception mới, rename dialog xác nhận đúng.

| # | Gõ / submit | Kết quả | Ý nghĩa |
|---|---|---|---|
| V0 | menu + Ctrl+L + gõ full path + Return | **FAIL** — dialog không đóng sau Return, Escape dọn (`canceled=true`), không file | Tái hiện đúng lỗi D2a/M4 |
| V1 | shortcut + Ctrl+L + gõ full path + Return | **FAIL** — giống V0 | Loại trừ biến menu click |
| V2 | Ctrl+L + gõ full path + **click Save** | **FAIL** (kiểu khác) — dialog đóng bởi click-save, main log `canceled=false filePath=…/L3-V2-ctrlL-clicksave.vcut.json`; file CÓ ở `…vcut.json`, `currentPath=…vcut.json` | Gõ đè giữ hậu tố `.json` (§4.2) |
| V3 | click ô Name + Ctrl+A + gõ full path + Return | **FAIL** — Return không đóng, Escape dọn, không file | Return fail cả khi gõ đúng ô Name |
| V4 | click ô Name + Ctrl+A + gõ full path + **click Save** | **PASS** — file đúng target, JSON hợp lệ (meta "Dự án mẫu", 2 tracks), `currentPath` đúng | Đường đi đúng: chọn hết tên + click Save |
| V5 | Ctrl+L + gõ full path + Return **2 lần** | **FAIL** — giống V0/V1 | Return lần 2 cũng không submit |
| V6 | click ô Name + Ctrl+A + chỉ tên file (không path) + Return | **FAIL** — giống V0 | Đóng mục 2 trong §7 của J1: Enter sau khi gõ tên file đơn CŨNG không submit trên Xvfb này |
| V7 | Ctrl+L + gõ chậm (120ms/ký tự) + Return | **FAIL** — giống V0/V1 | Loại trừ biến tốc độ gõ |
| V8 | Ctrl+L + **paste** qua clipboard + click Save | **FAIL** (kiểu khác) — dialog đóng bởi click-save, main log `canceled=false filePath=…/L3-V8-paste-clicksave.vcut.vcut`; file CÓ ở `…vcut.vcut` | Paste để lại hậu tố `.vcut` thay vì `.json` (§4.2) |

**Tổng kết thí nghiệm: Return 0/6 pass (V0/V1/V3/V5/V6/V7); click Save 1/3
pass đúng target (V4), 2/3 ghi file nhưng sai tên (V2/V8).**

### Verify sau khi xác định đường đi đúng (V4)

Chạy lại flow V4 (menu click → rename → ô Name + Ctrl+A → gõ full path →
click Save) **3 lần liên tiếp: 3/3 PASS** (R1–R3, `l3-verify-report.json`),
mỗi lần file đúng target, JSON hợp lệ, `currentPath` đúng, 0 exception.
Thêm 1 lần mở file qua dialog Mở (Ctrl+L + gõ + click Mở, đường M5): **PASS**
(R4, `currentPath` đúng file V4). Tổng verify: **5/5**.

## 4. Nguyên nhân gốc (đã chứng minh)

### 4.1 Return không submit dialog GTK trên Xvfb này — quirk môi trường, không phải bug sản phẩm

- Bằng chứng: 6 variant Return (menu/shortcut, Ctrl+L/ô Name, gõ nhanh/chậm,
  Return 1 lần/2 lần, full path/chỉ tên file) đều fail giống nhau: dialog ở
  nguyên sau Return (screenshot `*-after-submit.png`), chỉ Escape mới đóng,
  main log `canceled=true filePath=` (trống), không file, `currentPath=null`,
  0 exception. Trong khi click nút Save/Mở trên cùng dialog, cùng bản app,
  ghi/mở file đúng (V2/V4/V8/R1–R4).
- Chưa tách được GTK hay Xvfb (không có máy thật có WM để đối chứng trong
  lượt này) — nhưng không còn là đường đi của sản phẩm trên Xvfb: người dùng
  thật click Save (hoặc Enter trên máy thật có WM — chưa đo, xem §7).
- Hệ quả cho harness: `gtkTypePath` cũ dùng Return làm submit nên M4/M5/D2a
  fail từ đầu; M4/D2a còn ghi `typed=true` giả sau khi Escape đóng dialog
  (code fallback Escape) — detail vẫn ghi rõ "Escape đã đóng dialog kẹt"
  nên không che bug, nhưng verdict fail là đúng.

### 4.2 Gõ đè tên mặc định giữ lại hậu tố — hành vi GTK chooser, harness phải chọn hết trước khi gõ

- Ảnh `l3-v2-ctrlL-clicksave-typed.png` (quyết định): ô Name chứa
  `…/testdir/L3-V2-ctrlL-clicksave.vcut.json` — path gõ vào + `.json` còn lại;
  breadcrumb vẫn ở `hatch` (không điều hướng). Ảnh `l3-v8-dialog-open.png`:
  lúc mở, ô Name là `Du an mau.vcut.json` với `Du an mau.vcut` được chọn
  (tô xanh), `.json` không chọn — GTK chỉ chọn tên trừ đuôi cuối cùng.
- Cơ chế: gõ/paste thay phần được chọn, giữ phần không chọn. V2 (gõ):
  path + `.json`. V8 (paste): path + `.vcut` — paste để lại hậu tố khác gõ
  (`.vcut` thay vì `.json`); chưa tách được cơ chế GTK cho khác biệt này
  (có thể paste đi qua location-entry parse khác với gõ phím), nhưng cả hai
  đều sai tên và đều hết sai khi Ctrl+A trước — xem V4/R1–R3.
- Ảnh `l3-v4-namefield-clicksave-typed.png`: ô Name chứa đúng path đã gõ,
  không hậu tố; breadcrumb đã điều hướng tới `testdir` (GTK tự parse path
  tuyệt đối trong ô Name). Đây là hành vi đúng khi chọn hết tên trước.
- Không phải bug sản phẩm: dialog trả về đúng nội dung ô Name; renderer ghi
  đúng path nhận được (`writeProjectFile` + `currentPath` đều trỏ tới file
  `.json`/`.vcut.vcut` đã ghi — file tồn tại, JSON hợp lệ). Lỗi chỉ ở cách
  harness đưa text vào dialog.

### 4.3 Validation M4/M5/M7/D1 không bóc envelope `{spec}` — bug harness thứ ba

- App ghi file dự án dạng envelope: `{"format": "vcut-project",
  "formatVersion": 1, "appVersion": "0.1.0", "specVersion": "0.2.0",
  "savedAt": ..., "name": "M3 Doi ten", "spec": {"version": "0.2.0",
  "meta": {...}, "tracks": [...]}}` (đọc từ
  `testdir-harness/H9-Doubleclick.vcut`, 1567 byte).
- M4 đọc `j?.meta?.name` / `j.tracks` ở top-level → luôn `undefined` →
  `valid=false` dù file ghi đúng (menu run 1: file CÓ 1567 byte,
  `currentPath` đúng, vẫn FAIL). M5/M7/D1 đọc `j?.meta?.name` để lấy
  `expectName` → kẹt "H9 Doubleclick" dù tên thật trong file là
  "M3 Doi ten" (menu run 1: M5 `onOpenFile: true`, tên "M3 Doi ten",
  `currentPath` đúng, clips=3, vẫn FAIL; M7 tương tự).
- D2a đã đọc đúng từ trước (`const spec = j?.spec ?? j`) nên chỉ M4/M5/M7/D1
  sai. Fixture do harness tự tạo là bare-spec (không envelope) nên các check
  fixture (`ensureFixtures`/`requireFixture`) không bị ảnh hưởng — không sửa.

## 5. Kiểm chứng sau sửa (bằng chính harness chung đã sửa)

### 5.1 Menu phase (`--only menu`, display :158, CDP 9255)

| Lượt | Kết quả | M4/M5/M7 |
|---|---|---|
| Trước sửa (display :157, `harness-menu/`) | 13 passed / 18 failed | M4 FAIL (không file — Return), M5 FAIL (không mở — Return), M7 FAIL (expectName) |
| Sau sửa (display :158, `harness-menu2/`) | **24 passed / 7 failed** | **M4 PASS** (file 1567 byte, JSON hợp lệ + meta "M3 Doi ten" + tracks: true, `currentPath` đúng), **M5 PASS** (kỳ vọng tên "M3 Doi ten", dialog đóng, `onOpenFile` — xem report), **M7 PASS** |

7 fail còn lại toàn nợ cũ, không liên quan luồng này: M10/M12/M13/M14/M15
(chuỗi undo sau Dự án mới — K4 §4), M19b (i18n literal tiếng Việt — K3 §4,
luồng khác đang làm), M21 (thu nhỏ cửa sổ trên Xvfb không WM). Lưu ý: M18–
M20/M22–M26 flaky theo trạng thái fullscreen (lượt 1 fail hàng loạt do menu
bar chỉ còn 2 dải sau M18; lượt 2 M18 PASS nhờ F11 thoát đúng nên M19/M20/
M22–M26 PASS theo) — không phải do sửa của luồng này.

### 5.2 Dclick phase (`--only dclick`, display :159, CDP 9257)

**6 passed / 2 failed** (`harness-dclick/h9-report.json`):

- **D2a PASS** — click đúng mục, rename dialog xác nhận, dialog lưu "gõ path
  đóng: true", file `H9-Second.vcut` CÓ, JSON hợp lệ + có tracks,
  `currentPath` đúng. (Meta "Dự án không tên" là do D1 load không áp tên —
  xem §6, không phải do đường gõ path.)
- D1-argv PASS, D3 PASS, D4 PASS (exitCode=0).
- D1 FAIL, D2b FAIL — chỉ sai bước kiểm tra TÊN (xem §6).

### 5.3 Biên dịch

- `node --check apps/desktop/scripts/click-test-menu.mjs`: OK (sau mọi sửa).
- `tsc --noEmit` apps/desktop: **0 lỗi**; apps/web: **0 lỗi** (không chạm
  code TS nào trong lượt này; chạy bằng `./node_modules/.bin/tsc` trực tiếp
  vì `npx` fail EPERM do `~/.npm` thuộc root — nợ môi trường cũ).
- Không có test unit mới: logic sửa là tương tác X11/GTK, không có logic
  thuần nào để tách test (parse/validate path không đổi — `writeProjectFile`
  và `isProjectFilePath` không chạm).

## 6. Nợ mở

1. **D1/D2b fail ở bước kiểm tra tên trên AppImage test** — file load đúng
   (`currentPath` + `recent[0]` đúng; D2b `onOpenFile: true`, instance 2
   exitCode=0) nhưng tên kẹt "Dự án không tên" thay vì "H9 Doubleclick" /
   "H9 Second". Nguyên nhân: AppImage test (build 06/11 22:12, sha
   `2a15ea90…`) cũ hơn bản sửa `loadProject` của K1 (đợt 54: đọc `meta.name`
   từ bare-spec — đã sửa trong source, đã stage, CHƯA đóng gói lại thành
   AppImage). Trên build dev-electron có fix K1, K4 đã đo tên áp dụng đúng
   (K4 §3.4). Cần chạy lại D1/D2b sau lần rebuild AppImage tiếp theo (L4 đợt
   55 đang build) để xác nhận fix K1 — không thuộc phạm vi luồng này, không
   sửa gì thêm.
2. **Return trong dialog GTK trên Xvfb** (§4.1) — chưa tách được GTK hay Xvfb;
   chưa đo Enter trên máy thật có WM. Không chặn gì (đường đi được hỗ trợ là
   click Save/Mở; harness nay dùng click). Nếu ai đó muốn đóng: thử Enter sau
   khi gõ tên file trên máy thật có WM.
3. **Paste để lại `.vcut` thay vì `.json`** (§4.2) — khác biệt gõ-vs-paste
   chưa tách được cơ chế GTK; cả hai đều hết sai khi Ctrl+A trước nên không
   chặn. Ghi nhận để khỏi ai điều tra lại.
4. **Lượt chạy 1 của thí nghiệm fail launch 127 (2 lần)** — nguyên nhân:
   TMPDIR/UserData tôi đặt quá dài
   (`…/hidden_files/round55-l3/tmpdir/scoped_…/SingletonSocket` > 108 ký tự
   → Chromium FATAL "Socket path too long", log `app-l3.log`). Sửa bằng
   TMPDIR/userdata ngắn (`~/workspace/.tmp-r55l3`, `~/.ud-r55l3`) thì launch
   OK ngay. Đây là bài học đã có trong header harness chung (K2) nhưng fork
   J1 (cũ, trước K2) không có — fork của tôi đã sửa theo. Không phải bug sản
   phẩm (xem thêm K2 §D4).
5. Nợ cũ không thuộc luồng này (ghi lại để khỏi quên): M10/M12–M15 (undo sau
   Dự án mới), M19b (i18n ProjectMenu/TopBar), M21 (thu nhỏ cửa sổ),
   `.github/workflows/ci-security.yml` vẫn 403 chưa lên GitHub (repo không có
   CI chạy thật), `.deb` chưa build lại được.

## 7. File trong batch (stage)

- `apps/desktop/scripts/click-test-menu.mjs` (sửa `gtkTypePath` +
  `clickGtkDialogRightButton` mới + bóc envelope ở M4/M5/M7/D1)
- `docs/PHASE9_ROUND55_L3_GTK_SAVE_TYPING_LIMITS.md` (file này)

Không đưa binary/dist/AppImage vào batch. File stage NUL-delimited:
`~/workspace/repo-1-push/paths-loop/phase9-round55-l3-gtk-save-typing.txt`
(verify read-back bằng `tr '\0' '\n'` + kiểm tra từng file tồn tại).
Script thí nghiệm + report + screenshot + log + file `.vcut` mẫu chỉ để ở
`hidden_files/round55-l3/` (không stage).
