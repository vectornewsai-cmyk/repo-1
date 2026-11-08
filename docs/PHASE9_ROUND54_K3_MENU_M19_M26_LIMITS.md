# Phase 9 Round 54 — K3: Kiểm chứng độc lập menu M19–M26 + P7 (LIMITS)

Luồng K3 kiểm chứng độc lập các menu M19–M26 của Electron app mà J2 (đợt 53)
chưa kiểm chứng được ngoài cascade M18 fullscreen, và kết luận P7 (argv
`.vcut` / Recent load tên project) trên lượt chạy sạch. Repo local
`~/workspace/repo-1`; bản test: AppImage release sha `2a15ea90…`
(576.688.128 byte, 22:12 UTC 06/11), web bundle `index-CcjxMH90.js`
(sha `c5de4382…`, build 22:06 UTC 06/11).

## 0. Kết luận ngắn

- **M20, M21, M22, M24, M25, M26-đóng: PASS** (2/2 lượt). Không có bug IPC
  menu→renderer ở các mục này.
- **M19 Ngôn ngữ: FAIL (một phần — bug sản phẩm thật, về i18n).** Cơ chế
  menu→IPC→renderer hoạt động (`vcut:language-changed` tới renderer, menu
  native + khối UI dùng i18n đổi sang EN). Nhưng chuyển ngôn ngữ KHÔNG đầy
  đủ: nhóm nút project (Mới/Mở/Lưu/Lưu thành…/Xuất bản nén/Nhập bản nén/
  Lịch sử/Chưa lưu) + nút "👋 Bắt đầu" vẫn tiếng Việt ở chế độ EN — vì
  `ProjectMenu.tsx` dùng literal tiếng Việt cứng + không `useLang()`,
  `TopBar.tsx:196` "👋 Bắt đầu" cũng là literal. Không phải bug menu, không
  phải bug probe. Cần luồng riêng i18n hoá ProjectMenu + "Bắt đầu" (ngoài
  phạm vi K3 — không sửa ở đây).
- **M23 Tài liệu hướng dẫn: PASS.** Lượt 1 FAIL 1 lần (click trúng hàng
  nhưng popup không đóng, menu còn mở sau cả Escape); lượt 2 PASS ngay lần
  click đầu, cùng toạ độ/cùng code — kết luận flake 1 lần, không tái hiện
  được, không phải lỗi hệ thống. Không sửa gì cho M23.
- **M26 Thu nhỏ: FAIL (giới hạn môi trường, KHÔNG phải bug sản phẩm).**
  Click trúng hàng, popup đóng, nhưng cửa sổ vẫn Viewable + vẫn thấy đầy
  đủ trên ảnh root sau click (2/2 lượt). Trên Xvfb không có window manager,
  role `minimize` của Electron không có WM nào thực hiện → không unmap.
  Cần máy thật/WM để kết luận; không đề xuất sửa sản phẩm vì nó.
- **P7 argv `.vcut`: file ĐƯỢC load đúng, tên SAI (bug sản phẩm đã biết).**
  `currentPath` đúng fixture + 3 clip load đủ (2/2 lượt PASS sau khi tách
  case). Tên kẹt "Dự án không tên" thay vì "H9 Doubleclick" — đúng bug
  `loadProject` J3 đã báo: nhánh bare-spec của `parseProjectText` không
  đọc `spec.meta.name` (đã chứng minh trên bundle: `s` giữ "Dự án không
  tên", chỉ nhánh envelope mới gán `s = n.name`). **K1 đợt 54 đang sửa ở
  repo; bản build test này (22:12) CHƯA có fix đó** — đo trên code hiện
  tại của build, ghi rõ phiên bản đo (xem §1).
- **P7 Recent: submenu PASS, click entry load file PASS, tên SAI (cùng bug
  loadProject).** `onOpenFile` 0→1 lần + 3 clip load lại (2/2 lượt).
- **`__h9.openFiles` miss ở P7 argv là race của probe, KHÔNG phải bug
  sản phẩm.** Main gửi `vcut:open-file` sau khi `loadURL` resolve, trước
  khi probe đăng ký listener `installProbes()` (sau mount); handler thật
  của app nhận được (bằng chứng: `currentPath` + clips đúng). Đã tách case
  ở lượt 2 để không gộp lỗi probe vào verdict sản phẩm.

Không sửa code sản phẩm. Chỉ thêm probe K3 + LIMITS này.

## 1. Phiên bản đo (ghi rõ — K1 đang sửa song song)

- AppImage test: copy tại `~/workspace/.tmp-h9-k3/test.AppImage`,
  sha256 `2a15ea90c61e86ff1ed69dc15f6eb27153533bb2749690cea933fbc2ca82c819`,
  khớp `apps/desktop/release/vcut-studio-0.1.0-x86_64.AppImage` lúc chạy.
- Web bundle trong AppImage: `dist-web/assets/index-CcjxMH90.js`
  (sha `c5de4382…`), khớp `apps/desktop/dist-web/` lúc build 22:06 UTC.
- Kiểm chứng tĩnh trên bundle đã giải nén (`.tmp-h9-k3/squashfs-root/`):
  nhánh bare-spec của `parseProjectText` không đọc `meta.name`:
  `let r, s="Dự án không tên"; … else { …; r=n }` — `s` không đổi.
  Nhánh envelope mới gán `s=n.name`. Đây là bug loadProject (J3).
- Repo lúc K3 chạy: `projectRepo.ts` mtime 23:41 UTC 06/11 (K1 đang sửa
  loadProject), `main.ts` đã có thay đổi K4 (log argv + flush
  `pendingOpenFile` ở `did-finish-load`). **Cả hai đều CHƯA có trong bản
  AppImage test** (main.js trong asar không có chuỗi `did-finish-load`,
  không có dòng log `argv:`). Mọi kết luận P7 dưới đây là của bản build
  22:12, không phải của code repo mới nhất. Sau khi K1/K4 rebuild, P7
  cần đo lại trên build mới.
- `menu.ts` mtime 08:56, `preload.ts` 18:27 (06/11) — chuỗi menu→IPC
  giống J2, không đổi theo bản build này.

## 2. Phương pháp + lượt chạy

- Probe riêng `apps/desktop/scripts/probe-menu-54k3.mjs` (dẫn xuất từ
  probe J2: giữ nguyên infra X11/CDP/AppSession + helper menu; thay phase
  P4 bằng P4k3 chỉ M20+M19, KHÔNG chạy M18; thêm guard menubar trong
  `openMenuProbe` trước mỗi action: nếu bands != 5 thì F11 khôi phục, đo
  lại, ghi case guard riêng; P7 tách case file-load/tên + note race
  `__h9.openFiles`).
- Chạy trên AppImage qua `xvfb-run -a`, display :144, CDP 9243,
  userdata `/tmp/h9-k3-userdata`, OUT
  `hidden_files/h9/k3/` (bằng chứng: `h9-report-k3.json`,
  `probe-stdout-k3*.log`, `shots/`, `k3-bodytext-en/vi.txt`).
- Lượt 1 (23:55–00:03 UTC): **38 passed / 6 failed**.
- Lượt 2 (00:18–00:23 UTC, probe đã sửa check M19 + retry M23 + tách
  case P7): **41 passed / 4 failed**. Lượt 2 là verdict chính; lượt 1
  giữ lại ở `hidden_files/h9/k3/run1/` (report + log + ảnh menubar EN/VI,
  after-docs, after-min, popup-docs, crop toolbar).
- Guard menubar: lượt 1 can thiệp 1 lần (trước GitHub — do popup Tài liệu
  còn mở sau click lỗi làm menubar còn 4 dải; F11-toggle-back+Escape hồi
  về 5); lượt 2 không cần can thiệp lần nào (0/11 guard). Không có
  cascade kiểu M18 vì M18 không chạy; `black=[]` mọi lần đo.
- `tsc --noEmit` apps/desktop: **0 lỗi** (K3 không chạm file TS nào).

## 3. Kết quả từng menu/case (verdict chính = lượt 2)

| Case | Lượt 1 | Lượt 2 | Verdict |
|---|---|---|---|
| M19 Ngôn ngữ: submenu mở (Xem hàng 7, 2 dòng) | PASS | PASS | PASS |
| M19: lang en tới renderer | PASS | PASS | PASS |
| M19: web + menu đổi sang EN | FAIL (check sai từ: `/Export/` không có vì nút EN là "Publish"; `/Xuất/` còn) | FAIL (đo đúng — xem §4) | **FAIL (một phần)** |
| M19: về Tiếng Việt | PASS | PASS | PASS |
| M20 Công cụ nhà phát triển | PASS (DevTools target mở thật, đóng được) | PASS | PASS |
| M21 Giới thiệu (dialog 577x365) | PASS | PASS | PASS |
| M22 Phím tắt (dialog 544x574) | PASS | PASS | PASS |
| M23 Tài liệu hướng dẫn | FAIL (click trúng nhưng popup không đóng) | PASS | **PASS** (lượt 1 là flake, xem §5) |
| M24 Báo lỗi (dialog 824x232) | PASS | PASS | PASS |
| M25 VCut Studio trên GitHub | PASS | PASS | PASS |
| M26 Thu nhỏ | FAIL (map-state=2) | FAIL (map-state=2) | **FAIL (môi trường)** (§6) |
| M26 Đóng cửa sổ | PASS (exitCode=0, không mồ côi) | PASS | PASS |
| P7 argv: file được load | (chưa tách case) | PASS (currentPath đúng + 3 clip) | PASS |
| P7 argv: tên project | FAIL ("Dự án không tên") | FAIL ("Dự án không tên") | **FAIL (bug loadProject, K1)** |
| P7 Recent: submenu mở | PASS | PASS | PASS |
| P7 click entry Recent | FAIL (tên) | FAIL (tên) | **FAIL (chỉ tên sai; onOpenFile 0→1 + 3 clip PASS)** |
| Guard menubar trước mỗi action | 10/11 không cần; 1 hồi bằng F11-toggle-back+Escape | 11/11 không cần | PASS (guard hoạt động) |

## 4. M19 — bằng chứng đầy đủ (bug i18n thật)

- IPC tốt: click "English" → `__h9.langs` có `"en"`; click "Tiếng Việt"
  → `"vi"`. Menu native đổi thật: bands VI `[16,70,125,171,228]` →
  EN `[16,50,87,137,188]` (ảnh `k3-menubar-en.png`).
- Web UI đổi một phần (đếm trên `k3-bodytext-en.txt` vs `-vi.txt`,
  4912 vs 5070 byte):
  - Đã đổi EN: `Publish` (VI 0 → EN 1), `Split`, `Cut silence`,
    `MEDIA LIBRARY`, `PROJECT` (đều VI 0 → EN 1).
  - Còn VI ở chế độ EN: `Mới`, `Mở`, `Lưu` (2×), `Lưu thành…`,
    `Xuất bản nén`, `Nhập bản nén`, `Lịch sử`, `Chưa lưu`, `Bắt đầu`
    (đều EN 1 = VI 1 — không đổi).
- Cơ chế (đọc code, không đoán): nhóm chưa đổi là literal tiếng Việt
  cứng trong `apps/web/src/components/project/ProjectMenu.tsx`
  (vd. `🆕 Mới`, `💾 Lưu thành…`, `📦 Xuất bản nén`,
  `title="Tạo dự án mới"`; component không gọi `useLang()` nên không
  re-render khi đổi ngôn ngữ) và `TopBar.tsx:196` `👋 Bắt đầu` (literal).
  Nhóm đã đổi dùng `t("topbar.*Short")` + `TopBar.tsx:38` `useLang()`.
  EN dict trong bundle CÓ đủ key (`cutSilenceShort:"🔇 Cut silence"`,
  `publishShort:"⬇ Publish"` — kiểm tra trên bundle đã giải nén) nên
  không phải thiếu bản dịch: lỗi là literal cứng + thiếu subscribe.
- Lưu ý sửa check của lượt 1: probe cũ kiểm `/Export/` — sai vì nút EN
  là "Publish"; kiểm `/Xuất/` — thô vì nó gộp cả literal ProjectMenu.
  Lượt 2 đo tách 2 nhóm + lưu bodyText (đã sửa trong probe).
- Ngoài phạm vi K3: i18n hoá ProjectMenu (chuyển literal → key `t()`
  + `useLang()`) và "Bắt đầu" — cần luồng riêng (chạm nhiều chuỗi +
  key en/vi + test parity). K3 không sửa.

## 5. M23 — lượt 1 FAIL là flake

- Lượt 1: click tại (379,178) — đúng giữa hàng "Tài liệu hướng dẫn"
  trên popup 201x202@278,77 (ảnh `k3-popup-p5-docs.png` + root shot
  `k3-after-p5-docs.png` cho thấy menu còn mở sau click, hàng đúng vị
  trí). `popupGone=false`, `clipInfo` sau click lỗi 1 lần (3→-1, CDP
  evaluate throw rồi tự hồi — case GitHub ngay sau đó đo clips 3→3
  bình thường). Escape cũng không đóng được popup lúc đó.
- Lượt 2: cùng toạ độ, cùng code path (probe chỉ thêm retry khi lần 1
  fail — retry không kích hoạt vì lần 1 đã PASS): popup đóng, app còn
  chạy, textLen=3955. Không tái hiện được.
- Kết luận: flake 1 lần (click bị nuốt / menu ở trạng thái thoáng qua),
  không phải lỗi hệ thống của M23. Không sửa gì. Nếu tái hiện ≥2 lần ở
  lượt sau thì điều tra lại (nghi vấn `shell.openExternal` + dbus trên
  VM không có dbus — log app có lỗi dbus, nhưng GitHub cùng cơ chế thì
  PASS 2/2 nên giả thuyết này yếu).

## 6. M26 Thu nhỏ — giới hạn môi trường

- 2/2 lượt: click trúng hàng (popup đóng), nhưng `map-state` vẫn 2
  (Viewable) sau Thu nhỏ; ảnh root `k3-after-p6-min.png` cho thấy cửa
  sổ chính vẫn hiển thị đầy đủ sau click. `XMapWindow` sau đó cũng 2.
- Giải thích: Xvfb không có window manager; role `minimize` của
  Electron gửi yêu cầu tới WM, không có WM thực hiện nên cửa sổ không
  unmap. Đây là hành vi môi trường, không phải bug sản phẩm (trên máy
  thật có GNOME/KDE/Windows/macOS thì minimize do WM xử lý).
- Cần đo lại trên máy thật hoặc Xvfb + WM (vd. openbox) mới kết luận
  được. M26-Đóng cửa sổ PASS 2/2 (exitCode=0, không mồ côi).

## 7. P7 — kết luận đầy đủ

- Tiền điều kiện sạch 2/2 lượt: cổng CDP trống trước launch, userdata
  mới, không fullscreen trước đó (khác J2 — instance kẹt đã loại).
- argv: file được load — `currentPath` = fixture, clips = 3/3 (lượt 2,
  case tách riêng). Tên SAI: ô nhập tên project = "Dự án không tên"
  (kỳ vọng "H9 Doubleclick") — bug loadProject, xem §1 (K1 đang sửa).
- Recent: `noteProjectOpened` ok, `recentProjects` chứa fixture;
  submenu "Mở gần đây" mở (141x89, 2 dòng); click entry → `onOpenFile`
  0→1 lần + clips 3/3 — file load đúng, chỉ tên sai (cùng bug).
- `__h9.openFiles` miss ở argv (2/2 lượt `false`): race của probe.
  Trong AppImage test, `createWindow` làm `await win.loadURL(...)`
  rồi mới flush `pendingOpenFile` → `webContents.send("vcut:open-file")`
  (xem `main.js` đã giải nén, không có `did-finish-load` — flush này
  là của bản build cũ, K4 đã cải tiến ở repo sau đó). Probe đăng ký
  listener `installProbes()` sau khi mount → miss event đã gửi. Handler
  thật của app nhận được (bằng chứng currentPath + clips). Không phải
  bug D1 (`findProjectPathInArgv` — unit test đã PASS ở đợt 53; argv
  tới main và file được load thật).
- Cần đo lại sau khi K1 rebuild (tên) — K3 không rebuild AppImage
  (ngoài phạm vi + tránh giẫm K1/K4 đang sửa cùng lúc).

## 8. File đã chạm (trong batch này)

- `apps/desktop/scripts/probe-menu-54k3.mjs` (mới — probe K3: P4k3 chỉ
  M20+M19, guard menubar F11 trong `openMenuProbe`, retry M23, tách
  case P7 + lưu bodyText EN/VI; dẫn xuất từ probe J2, không sửa
  harness dùng chung `click-test-menu.mjs`).
- `docs/PHASE9_ROUND54_K3_MENU_M19_M26_LIMITS.md` (mới — file này).
- Không chạm: `menu.ts`, `preload.ts`, `desktop.ts`, `store.ts`,
  `projectRepo.ts` (K1), `main.ts` (K4), `TopBar.tsx`,
  `ProjectMenu.tsx` (chỉ đọc để phân loại M19), `click-test-menu.mjs`.
- Bằng chứng (không stage, không đưa /tmp):
  `hidden_files/h9/k3/` — `h9-report-k3.json` (lượt 2: 41/4),
  `probe-stdout-k3-run2.log`, `k3-bodytext-en.txt`,
  `k3-bodytext-vi.txt`, `shots/`; lượt 1 giữ ở `k3/run1/`.

## 9. Nợ mở

- **M19 i18n chưa đủ**: ProjectMenu literal VI + không `useLang()`,
  "Bắt đầu" literal ở `TopBar.tsx:196`. Cần luồng riêng i18n hoá +
  đo lại EN sau khi sửa (không thuộc K3).
- **P7 tên project**: chờ K1 sửa `loadProject` + rebuild AppImage rồi
  đo lại argv/Recent (tên kỳ vọng "H9 Doubleclick").
- **M26 Thu nhỏ**: cần máy thật hoặc Xvfb + WM để kết luận (hiện chỉ
  có bằng chứng "không có tác dụng trên Xvfb không WM").
- **M23 flake lượt 1**: chưa tái hiện được; nếu gặp lại ≥2 lần thì điều
  tra (nghi vấn `shell.openExternal` + dbus trên VM).
- Nợ cũ không thuộc K3: `.github/workflows/ci-security.yml` vẫn chưa lên
  GitHub (403 quyền); D4 exit 127 (J4 đợt 53) chưa đo lại.

## 10. Chạy lại

```bash
# Lượt đầy đủ P0 → P4k3 → P5 → P6 → P7 (cần AppImage đã verify sha)
xvfb-run -a node apps/desktop/scripts/probe-menu-54k3.mjs \
  --display 144 \
  --out ~/workspace/goals/capcut-clone-video-editor/hidden_files/h9/k3 \
  --userdata /tmp/h9-k3-userdata --testdir /tmp/h9-k3-test \
  --appimage ~/workspace/.tmp-h9-k3/test.AppImage
# Chạy lẻ: thêm --only p4k3 | p5 | p6 | p7

# tsc phần chạm (probe là .mjs nên chỉ kiểm tra desktop không bị liên lụy)
node_modules/.bin/tsc --noEmit -p apps/desktop/tsconfig.json
```
