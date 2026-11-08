# Phase 9 đợt 53 — LIMITS tổng hợp (parent gộp, 07/11/2026)

Đợt 53: 9 luồng song song (J1–J9), lượt cron 03:35 +07 07/11. Cả 9 luồng
đều hoàn thành có LIMITS + tự stage batch riêng (66 entry). Parent gộp
từ main chat: đối chiếu baseline/lists, sửa snapshot i18n 982→987, sửa
1 entry paths đợt 52 trỏ file đã xóa, kiểm chứng lại, stage batch phụ
i18n. KHÔNG push — chờ user nhắn "push đi".

## 1. Tóm tắt từng luồng (số thật, xem LIMITS riêng từng luồng)

- **J1 — Dialog GTK "Lưu thành…"** (`..._J1_GTK_SAVE_DIALOG_LIMITS.md`):
  nợ M4/M5/D2a đợt 52 đã đóng: không còn bug sản phẩm chặn flow. Trọn
  flow mới (Ctrl+Shift+S → dialog đổi tên trong app → dialog GTK →
  click Save) chạy xanh 6/6 source-run + 5/5 AppImage thật, file ghi
  thật, `currentPath` đúng. Return sau khi gõ path không submit dialog
  GTK là quirk GTK/Xvfb, không phải bug sản phẩm (đường hỗ trợ là click
  Save). Chỉ đổi main.ts (+1 dòng log) + script chẩn đoán mới.
- **J2 — Menu actions M10–M26** (`..._J2_MENU_ACTIONS_LIMITS.md`):
  không có bug sản phẩm nào gãy IPC. Thất bại đợt 52 là 3 nguyên nhân
  cộng lại: vùng đen nhất thời `[[0,322]]` sau "Dự án mới" làm lệch
  textBands; M18 fullscreen ẩn menubar (GTK, Xvfb không WM) → cascade
  M19–M26, F11 khôi phục được; kỳ vọng harness sai (undo sau Dự án mới
  không khôi phục project cũ là by design — `clearHistory()`).
  Probe P8 26/26 PASS; unit test mới 46/46.
- **J3 — Harness click-test** (`..._J3_HARNESS_LIMITS.md`): củng cố
  harness (fixture tự tạo, fail-fast, `--disable-gpu`, guard menubar).
  M6/M7 là **bug harness** (click/hover nhầm dòng) — đã sửa, PASS thật.
  Phát hiện mới: **bug sản phẩm `loadProject`** — không lấy `meta.name`
  từ bare-spec `.vcut` nên tên kẹt "Dự án không tên". GPU FATAL 0 lần
  mọi run (đợt 52 có 3 lần). Diag 12/12; menu 9/30, dclick 3/7.
- **J4 — Rename dialog** (`..._J4_RENAME_DIALOG_LIMITS.md`): dialog
  nhập tên trong app thay `window.prompt` (đóng nợ D3 đợt 52 — prompt
  ném trong sandbox). Test mới `desktopSaveAs53J4.test.ts` 35/35 PASS;
  **xóa** `desktopSaveAs52I3.test.ts` (test hành vi prompt cũ). D4 exit
  127 là bug thật sau forward (xem §5).
- **J5 — Proxy persist + preview** (`..._J5_PROXY_PREVIEW_LIMITS.md`):
  proxy nối vào restore qua manifest (`proxyPath`, `setProxy`,
  `isValidProxyPath`); headed proxy persist 11/11 (proxy 720p thật,
  khôi phục sau reload, không tạo lại); tick `[null]` headed 8/8
  (đóng nợ I2 §6.1); sửa clamp `dt` (playhead 0,842 → 1,007). Unit
  assetStore 27/27, rehydrate 22/22, proxyAuto 13/13.
- **J6 — GOP/Seek** (`..._J6_GOP_SEEK_LIMITS.md`): chặn moov giả ở T3
  (nợ đợt 52 §4.5), cổng e2e thu hẹp PASS, guard seekable pre-seek
  (đề xuất đợt 52 I8, nay đã implement). Test mới 25/25 (đỏ-trước 3/25
  fail đúng chỗ).
- **J7 — TTS transfer** (`..._J7_TTS_TRANSFER_LIMITS.md`): transfer
  theo text 0,90–1,01 (đóng nợ F3 §8.3 một phần); đường cong Trúc Ly
  8 điểm; fallback WAV kích hoạt thật (dòng `fallbackUsed: true`).
  P13 > M3 của Trúc Ly biên mỏng 0,02 ký tự/giây — cần đo lặp.
- **J8 — bgremove venv** (`..._J8_BGREMOVE_VENV_LIMITS.md`): venv
  Python 3.10 chạy thật, rembg 2.0.60 + BiRefNet thật, model 972 MB
  tải thật (checksum verify). Đóng nợ "bgremove không có venv" đợt 52.
- **J9 — Mirror probe** (`..._J9_MIRROR_PROBE_LIMITS.md`): checker
  243→422 probe; script sync catalog chính thức; sửa 1 lệch sticker;
  video-spec 152/152, web I7 12/12, F1 11/11, H5 13/13.

## 2. Việc parent gộp đã làm

1. **Đối chiếu đĩa**: 9 batch đợt 53 (66 entry) — mọi file tồn tại,
   toàn text, NUL cuối. LIMITS J1–J9 đủ. Không file lạ ngoài phạm vi
   (trừ build artifact `apps/desktop/build/` + icon PNG regenerate —
   không stage).
2. **Sửa paths đợt 52**: file `apps/web/src/desktopSaveAs52I3.test.ts`
   đã bị J4 xóa trên đĩa (thay bằng test 53J4) nhưng vẫn nằm trong
   `phase9-round52-i3-menu-clicktest.txt` (5 entry). Đã gỡ entry đó
   (còn 4) — vì đợt 52 chưa push, file này sẽ không bao giờ lên
   GitHub, không cần xóa riêng trên GitHub. Đẩy file paths đó khi chưa
   sửa sẽ fail (đọc file không tồn tại).
3. **Snapshot i18n 982→987**: J4 thêm 5 key (dialog đổi tên). 7 file
   test (D4, saveToast31, structuredNotes32, errorDetail34Q4 comment,
   B6, Z6, E2) cập nhật 982→987 + ghi chú lịch sử đợt 53; vi == en ==
   987, 0 key mồ côi. Kiểm chứng: D4 3/3, saveToast31 15/15,
   structuredNotes32 12/12, B6 8/8, Z6 10/10, E2 3/3. Stage batch phụ
   `phase9-round53-i18n-snapshot.txt` (7 entry).
4. **Handoff đợt 53 báo "J1/J2 còn chạy" là stale**: lúc gộp, cả 9
   batch đã stage đủ trên đĩa (J1 22:06 UTC, J2 22:21 UTC); worker
   viết báo cáo trước khi kiểm tra lại. Parent tin đĩa, không chờ
   handoff bổ sung.

## 3. Kiểm chứng parent (chạy lại trên cây đã gộp, số thật)

- `tsc --noEmit` apps/web: **0 lỗi**; apps/desktop: **0 lỗi**.
- `vite build` apps/web: **pass** (5,64 s).
- i18n (sau sửa 987): D4 3/3, saveToast31 15/15, structuredNotes32
  12/12, B6 8/8, Z6 10/10, E2 3/3.
- Số các luồng (chỉ đối chiếu LIMITS, không đo lại): J1 6/6 + 5/5,
  J2 unit 46/46 + probe P8 26/26, J3 diag 12/12, J4 35/35, J5 unit
  27/27 + 22/22 + 13/13 + 5/5 + headed 11/11 + 8/8, J6 25/25, J9
  checker 422/0/0 + video-spec 152/152.
- KHÔNG chạy lại ở bước gộp: mọi phép đo headed/TTS WAV/heap/smoke
  AppImage của các luồng, phiên solo thật, đo IDB thật, Safari/máy
  thật/GPU thật. Parent không sửa logic luồng nào ngoài 2 việc ở §2
  (paths đợt 52 + snapshot i18n).

## 4. Nợ mở / chưa làm được (trung thực)

1. **D4 exit 127 là bug thật sau forward** (J4 §6): click D4 false,
   lý do chưa được ghi — cần đo lại exitCode qua phaseD4.
2. **Bug sản phẩm `loadProject`** (J3): không lấy `meta.name` từ
   bare-spec `.vcut` → tên kẹt "Dự án không tên" (D2b cùng chữ ký:
   currentPath đúng, tên sai). Chưa sửa.
3. **Menu M19–M26** chưa kiểm chứng độc lập ngoài cascade M18 (J2);
   P7 argv `.vcut`/Recent load tên project chưa kết luận (cần lượt
   sạch); D1 argv (`findProjectPathInArgv`) chưa điều tra (J3).
4. **Dialog discard-confirm `window.confirm`** (J3): còn mở nguyên từ
   M8 tới M26 vì không được trả lời — harness cần xử lý chủ động.
5. **AppImage mới 410 MB** (build J4, 22:09 UTC) chưa test (J3 §6).
6. **TTS**: P13 > M3 Trúc Ly biên mỏng 0,02 ký tự/giây — cần đo lặp;
   nguyên nhân gốc lỗi ghi WAV đợt 52 vẫn chưa rõ.
7. **Proxy**: nút Proxy bị thanh toolbar timeline phủ ở 1440×900
   (click thật trượt); audio re-seek ~10–12/lượt không đổi sau sửa
   clamp; proxy stale nếu WORK_ROOT bị xóa tay (J5 §6).
8. **GOP/seek**: phiên lùi dài > 60 s chưa đo (J4 đợt 52); tail
   streaming còn rủi ro file chế tác moov giả (J4 đợt 52 §5.3).

## 5. Batch đã stage (KHÔNG push), chờ user push sau

- Đợt 53 (9 file / 66 entry): `phase9-round53-j1-gtk-save-dialog.txt`
  (3), `phase9-round53-j2-menu-actions.txt` (4),
  `phase9-round53-j3-harness.txt` (2),
  `phase9-round53-j4-rename-dialog.txt` (8),
  `phase9-round53-j5-proxy-preview.txt` (19),
  `phase9-round53-j6-gop-seek.txt` (9),
  `phase9-round53-j7-tts-transfer.txt` (5),
  `phase9-round53-j8-bgremove-venv.txt` (8),
  `phase9-round53-j9-mirror-probe.txt` (8).
- Batch phụ i18n: `phase9-round53-i18n-snapshot.txt` (7 entry).
- Batch đóng đợt: `phase9-round53-closing.txt` (1 entry — LIMITS tổng
  hợp này, do các luồng đợt 53 đã tự stage hết nên parent chỉ còn
  file này).
- Sửa paths đợt 52: `phase9-round52-i3-menu-clicktest.txt` 5→4 entry
  (gỡ file đã xóa 52I3).
- **Tổng chờ push: 21 file paths / 303 entry** (63 Phase 10 + 64 đợt
  51 + 102 đợt 52 + 66 đợt 53 + 7 i18n đợt 53 + 1 LIMITS tổng hợp
  đợt 53). Các đợt 1–50 đã push xong (HEAD e2cb35e1).
