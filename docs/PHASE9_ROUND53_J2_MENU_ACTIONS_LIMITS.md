# Phase 9 Round 53 — J2: Menu actions M10–M26 (LIMITS)

Luồng J2 điều tra: vì sao menu action M10–M26 "không tới renderer" sau M9
trong full run đợt 52 (8/27). Repo local `~/workspace/repo-1`, AppImage test
sha `d5cbe6fe…` (401.060.440 byte, build mới của J4 21:25 06/11).

## 0. Kết luận ngắn

**Không có bug sản phẩm nào làm gãy IPC menu→renderer.** Khi click đúng
menu/hàng, mọi action M10–M26 đều tới renderer và làm đúng việc (chứng minh
live: P1 10/10, P3 sweep đầy đủ, P8 26/26; unit test 46/46). Thất bại đợt 52
là 3 nguyên nhân cộng lại, không phải 1 bug:

1. **Vùng đen nhất thời trên menubar sau "Dự án mới"** (`black=[[0,322]]`)
   làm lệch `textBands` của harness cũ thành 1 dải `[161]` → click trúng
   nhãn "Cửa sổ" thay vì "Chỉnh sửa" → không action nào tới. Tái hiện 2/2
   lượt, tự hết sau 1 tương tác thành công (repaint).
2. **M18 Toàn màn hình ẩn thanh menu** (GTK fullscreen trên Xvfb không có
   window manager: cửa sổ vẫn 1440x900 nhưng menu biến mất) → mọi menu sau
   đó trượt theo (cascade M19–M26 trong lượt full). **F11 khôi phục được**
   (accelerator có sẵn, `menu.ts:245`) — P8b chứng minh.
3. **Kỳ vọng của harness sai**: undo sau Dự án mới KHÔNG khôi phục project
   cũ — là by design (`store.ts:2946` `clearHistory()` trong `newProject`).
   M10 đợt 52 kỳ vọng clip về 3 nên fail cả khi click đúng.

Không sửa code sản phẩm. Chỉ thêm test khóa hành vi by-design (U13/U14) +
probe script. P7 (argv `.vcut` / Recent load) **chưa kết luận được** (bị
nhiễm bởi instance kẹt sau fullscreen) — xem §6.

## 1. Phương pháp + lượt chạy

- Probe riêng `apps/desktop/scripts/probe-menu-53j2.mjs` (snapshot
  `click-test-menu.mjs` lúc 21:02 06/11 + các phase P0–P8 của J2; không sửa
  harness dùng chung). Chạy trên AppImage qua `xvfb-run -a`, display :141,
  CDP 9237, userdata `/tmp/h9-j2-userdata`, OUT
  `hidden_files/h9/j2/`. Điểm khác harness cũ: menubar shot và popup shot
  ghi file khác nhau; dùng clean centers đo ở P0 khi live bands bị lừa;
  log mọi cửa sổ mới theo thứ tự xuất hiện; `clickRowProbe` phân biệt
  click-trượt / IPC-gãy / IPC-tốt qua `__h9.actions`.
- Unit test `apps/web/src/desktopMenuActions53J2.test.ts`: gọi
  `handleMenuAction` trực tiếp với store thật (cô lập tầng handler).
- Lượt chạy:
  - Lượt 1 (21:30): chết ở P2 sau ~11 phút — **Xvfb :141 chết giữa chừng**
    (VM quá tải, nhiều harness song song), probe kẹt vì `readReply` không
    timeout. Đã vá: timeout 30s cho `readReply` (probe chỉ, không sửa
    harness chung) + retry `startXvfb` 4 lần (xkbcomp race, đợt 52 §7).
  - Lượt full P0–P7 (21:57–22:11): **53 passed / 22 failed** (report
    `h9-report-j2-full-rerun.json`).
  - Lượt P8 (22:13): **26 passed / 0 failed** (report `h9-report-j2.json`
    hiện tại là của lượt P8; log lượt full ở `probe-stdout-full-rerun.log`).

## 2. Kết quả từng menu/case

| Case (M đợt 52) | Kết quả J2 | Ghi chú |
|---|---|---|
| M1–M2 menubar/popup | PASS 10/10 (P1, 2 vòng × 5 menu) | Harness-way mở đúng menu, đủ hàng (8/8/8/2/5), `black=[]` trên instance sạch |
| M4/M5 dialog GTK | PASS (P8, 2 vòng) | Dialog "Mở dự án" 1124x822 mở/đóng được; menubar hồi đủ 5 bands sau khi đóng |
| M9 Dự án mới | PASS (P2) | Action `new-project` tới, clips 3→0 |
| M10 Hoàn tác sau Dự án mới | **Action TỚI, clip KHÔNG khôi phục** | `p2-undo` PASS (action tới); clip ở 0 — by design (`clearHistory`), kỳ vọng harness sai |
| M11 Làm lại | PASS (P2) | Action `redo` tới, clips 0→0 |
| M12 Chọn tất cả + Xóa | PASS (P3, sample mới) | select-all (3), delete (3→0), undo-delete (0→3) |
| M13 Sao chép + Dán | PASS (P3) | copy, paste 3→6, undo-paste 6→3 |
| M14 Cắt + Ctrl+Z | PASS (P3) | cut 3→0; **Ctrl+Z phím XTEST thật PASS** (0→3, action undo tới). Ctrl+Z qua CDP Input FAIL ở lượt 1 là artifact probe (Phase 10 G5: DOM bỏ qua Ctrl+Z trên desktop, menu accelerator xử lý; CDP không kích hoạt accelerator) |
| M15 Nhân bản | PASS (P3) | duplicate 3→6, undo-dup 6→3 |
| M16 Tải lại | PASS (P4) | Marker mất, editor mount lại, probes cài lại |
| M17 Phóng to / Đặt lại | PASS (P4) | innerWidth 1440→1315→1440 |
| M18 Toàn màn hình | **Bật được, tắt bằng menu THẤT BẠI** | Click bật trúng; cửa sổ vẫn 1440x900 nhưng menu biến mất (`bands=[591,685]`). F11 khôi phục (P8b PASS) |
| M19 Ngôn ngữ | FAIL lượt full — do cascade M18 | Chưa kiểm chứng độc lập ngoài cascade |
| M20 Công cụ nhà phát triển | FAIL lượt full — do cascade M18 | Chưa kiểm chứng độc lập ngoài cascade |
| M21–M25 Trợ giúp (Giới thiệu/Phím tắt/Báo lỗi/Tài liệu/GitHub) | FAIL lượt full — do cascade M18 | Chưa kiểm chứng độc lập ngoài cascade |
| M26 Cửa sổ (Thu nhỏ/Đóng) | FAIL lượt full — do cascade M18 | Chưa kiểm chứng độc lập ngoài cascade |
| M7 Mở gần đây (submenu) | Submenu PASS; click entry CHƯA KẾT LUẬN | Submenu mở (141x89, 2 dòng); click entry làm `onOpenFile` tăng 0→1 nhưng tên project không đổi — lượt bị nhiễm (xem §6) |
| P7 argv `.vcut` | FAIL — CHƯA KẾT LUẬN | `onOpenFile: false` trong lượt bị nhiễm (instance cũ còn sống giữ single-instance lock) |

## 3. Chuỗi nhân quả M10–M26 đợt 52 (đã chứng minh live)

1. M9 `new-project` → vùng đen `[[0,322]]` trên strip menubar (tái hiện
   2/2 lượt full, đúng ngay sau click Dự án mới; `liveBands=[161]`).
2. Harness cũ đo live bands → 1 dải `[161]` → click x=161 trúng nhãn
   "Cửa sổ" (148–195) thay vì "Chỉnh sửa" → mở menu Cửa sổ → không có
   action undo nào được gửi → M10 fail với `action undo: false`.
3. Vùng đen kéo dài ở đợt 52 vì không tương tác nào sau M9 tới được
   renderer (không repaint) — probe J2 dùng clean centers nên click trúng
   → repaint → vùng đen hết ngay ở lần đo sau (`p2-edit-redo: black=[]`).
4. **Dialog GTK được minh oan** (P8, 2 vòng): vùng đen chỉ xuất hiện TRONG
   LÚC dialog che cửa sổ (`black=[[0,1043]]`, `bands=[1242]` — đúng vùng
   dialog 1124x822 che); đóng dialog xong bands hồi đủ 5, menu Chỉnh sửa
   mở đúng (harness-way), Hoàn tác tới renderer.
5. **M18 fullscreen** (P4 + P8b): click "Toàn màn hình" → GTK fullscreen
   ẩn thanh menu native; trên Xvfb không WM, cửa sổ không resize (vẫn
   1440x900) nên không còn cách nào click menu để tắt. F11 (accelerator
   có sẵn) khôi phục menubar đủ 5 bands, menu mở lại + Hoàn tác tới.
   Lượt full không bấm F11 nên M19–M26 trượt theo — là cascade, không
   phải 17 case hỏng riêng.
6. **Undo sau new-project là by design**: `store.ts:2930–2947` —
   `newProject()` gọi `clearHistory()` (xóa stack undo) rồi mới set spec
   trống. Unit test U13/U14 khóa hành vi này (undo sau new-project là
   no-op; edit mới sau đó undo lại bình thường).

## 4. Bằng chứng IPC/handler đúng (sản phẩm)

- Unit test `desktopMenuActions53J2.test.ts`: **46/46 PASS** (U1–U14, không
  unhandled rejection). Red-before đã kiểm chứng ở lượt trước: tạm bỏ
  `st.undo()` trong `desktop.ts` → đúng 4 assertion undo fail; khôi phục
  xong sha `desktop.ts` khớp trước/sau.
- Live trên AppImage: `__h9.actions` ghi nhận mọi action (undo/redo/cut/
  copy/paste/duplicate/delete/select-all/new-project); clipCount đổi đúng
  (paste/duplicate 3→6, cut/delete 3→0, undo về 3).
- Bridge: `vcutDesktop.onMenuAction` đã đăng ký (P0, cả 2 lượt full + P8).
- `tsc --noEmit` apps/web 0 lỗi, apps/desktop 0 lỗi.

## 5. File đã chạm (trong batch này)

- `apps/desktop/scripts/probe-menu-53j2.mjs` (mới — probe J2, P0–P8;
  gồm vá timeout `readReply` 30s + retry `startXvfb` + sửa null-guard
  `clickRowProbe` sau reload + `keyboardCtrlZ` dùng phím XTEST thật)
- `apps/web/src/desktopMenuActions53J2.test.ts` (mới — 46 check, gồm U13/U14)
- `apps/web/tsconfig.json` (thêm test file vào exclude, cạnh
  `desktopSaveAs53J4.test.ts`)
- `docs/PHASE9_ROUND53_J2_MENU_ACTIONS_LIMITS.md` (mới — file này)
- Không chạm: `click-test-menu.mjs` (dùng chung với J1/J3),
  `apps/desktop/src/menu.ts`, `preload.ts`, `apps/web/src/desktop.ts`,
  `store.ts` (chỉ đọc để phân loại).

## 6. Nợ mở

- **M19/M20/M21–M26 chưa kiểm chứng độc lập ngoài cascade M18.** Cần lượt
  probe bỏ qua fullscreen, hoặc bấm F11 ngay sau M18 rồi chạy tiếp các
  case — P8b chứng minh đường hồi hoạt động nhưng chưa chạy hết các case
  này sau hồi.
- **P7 argv `.vcut` / Recent load tên project chưa kết luận.** Lượt full:
  instance cũ (kẹt fullscreen) còn sống sau `SIGKILL+pkill` khi P7
  relaunch → launch lần 1 timeout 600s (không thấy CDP page target) →
  single-instance lock bị giữ → `onOpenFile: false`, tên trong ô nhập vẫn
  "Dự án không tên" dù `currentPath` đã là fixture. Cần lượt sạch
  (userdata mới, không fullscreen trước đó) để phán.
- **Cơ chế vùng đen `[0,322]` sau new-project** chưa chứng minh tới tầng
  Chromium/Xvfb (chỉ quan sát hành vi: xuất hiện sau reset state, hết
  sau repaint). Không ảnh hưởng user thật (chỉ harness đọc pixel); không
  đề xuất sửa sản phẩm vì nó.
- **Xvfb chết giữa chừng khi VM quá tải** (lượt 1, 21:35; VM reboot 21:56
  giữa đợt). Đã vá timeout trong probe J2; harness dùng chung
  (`click-test-menu.mjs`) vẫn có nguy cơ kẹt tương tự ở `readReply`
  (ngoài phạm vi J2).
- AppImage đợt 52 (`da2b85d5…`, 147MB) đã bị xóa khỏi `release/` giữa đợt
  bởi rebuild của J4; các lượt J2 dùng build mới `d5cbe6fe…` (401MB).
  `menu.ts`/`preload.ts` không đổi nên chuỗi menu→IPC giống đợt 52.
- Nợ cũ không thuộc J2: `.github/workflows/ci-security.yml` vẫn chưa lên
  GitHub (403 quyền); J4 D3 (rename dialog) vẫn FAIL trong diag của J4.

## 7. Chạy lại

```bash
# Probe full P0–P7 (cần AppImage đã verify ở ~/workspace/.tmp-h9-j2/)
xvfb-run -a node apps/desktop/scripts/probe-menu-53j2.mjs \
  --display 141 \
  --out ~/workspace/goals/capcut-clone-video-editor/hidden_files/h9/j2 \
  --userdata /tmp/h9-j2-userdata --testdir /tmp/h9-j2-test \
  --appimage ~/workspace/.tmp-h9-j2/vcut-studio.AppImage
# Chỉ P8 (dialog GTK + fullscreen/F11): thêm --only p8

# Unit test (46 check)
node_modules/.bin/esbuild apps/web/src/desktopMenuActions53J2.test.ts \
  --bundle --platform=node --format=cjs \
  --outfile=/home/hatch/workspace/.tmp-h9-j2/desktopMenuActions53J2.test.cjs \
  --log-level=warning
node /home/hatch/workspace/.tmp-h9-j2/desktopMenuActions53J2.test.cjs
```
