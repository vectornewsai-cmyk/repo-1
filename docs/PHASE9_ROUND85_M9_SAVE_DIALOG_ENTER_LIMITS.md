# Phase 9 Round 85 — M9: Hộp thoại lưu file native — Enter không đóng dialog + hoàn thiện export UI — LIMITS

Ngày: 11/11/2026 (lượt cron 06:35 +07). Luồng M9 đợt 85.
Nhiệm vụ: xác định Enter trong ô Name/location không đóng dialog là hành vi
GTK hay lỗi app; sửa harness thành luồng đúng; chạy lại click-test gói thật
tới 8/8 PASS ≥1 lần; kiểm tra nút "Tải xuống MP4" có cần bấm tay không.
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào batch.
AppImage dùng lại bản K7 đã build (không build lại): **556.967.608 byte,
sha256 `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c`**.

## 0. Kết luận (đọc trước)

**Enter KHÔNG đóng dialog là hành vi CHUẨN của GTK file chooser, KHÔNG PHẢI
lỗi app.** Probe 6 biến thể phím, mỗi biến thể 1 instance app thật (kèm cây X
+ ảnh chụp màn hình thật): tất cả đều STILL_OPEN, không job nào chạy. App
không thể sửa được: dialog là Electron `showSaveDialog` native
(`apps/desktop/src/main.ts:624-641`, `dialog-save-video`), app không có cách
nào lắng nghe phím bên trong dialog native. Luồng đúng DUY NHẤT là gõ đích
rồi **click nút Save** — đúng luồng L1 đã xây; M9 không đổi code sản phẩm
nào, chỉ sửa harness (3 chỗ, xem §3). Nút "Tải xuống MP4" **giữ bấm tay**
(không nối tự động — xem §4, không có bằng chứng user muốn tự động).

## 1. Probe Enter — 6 biến thể, 6/6 STILL_OPEN

Probe riêng `~/workspace/tmp-m9-probe/probe-enter.mjs` (+ `xtest-m9.py`):
chạy AppImage thật dưới Xvfb :147 (CDP 9322, bridge đọc từ pidfile),
đi K1–K6, click nút Xuất, rồi chạy từng biến thể phím trên dialog thật.
Tiêu chí phân biệt: dialog đóng + có job render = Save được chấp nhận;
dialog đóng + không job = Cancel; dialog vẫn mở = phím không xác nhận.

| Biến thể | Phím | Kết quả | Bằng chứng |
|---|---|---|---|
| A | tên-file `probe-enter-a.mp4` + Return | **STILL_OPEN** | Ảnh `xshot-A-after-keys.png`: ô Name có viền focus xanh, text gõ đúng, dialog vẫn mở, jobId=(none) |
| B | full-path + Return (lặp đúng L1 lần 16) | **STILL_OPEN** | Tái hiện đúng quan sát L1; text full path còn nguyên trong ô Name |
| C | full-path + Tab + Return | **STILL_OPEN** | Ảnh `xshot-C-after-keys.png`: sau Tab, viền focus vẫn ở ô Name |
| D | full-path + Tab ×12 + Space | **STILL_OPEN** | Ảnh `xshot-D-after-tabs.png`: sau 12 Tab không widget nào khác hiện focus; Space sau đó cũng không đóng |
| E | full-path + Ctrl+S | **STILL_OPEN** | Không có phản ứng gì |
| F | full-path + Return ×2 | **STILL_OPEN** | Ảnh `xshot-F-after-enter1.png`: sau Return lần 1, text full path còn nguyên, thư mục vẫn là /home/hatch — Return lần 1 KHÔNG navigate, KHÔNG xác nhận |

Verdict JSON từng biến thể: `~/workspace/tmp-m9-probe/probe-{A,B,C,D,E,F}-verdict.json`
(`dialog` 1124x822 tại (0,0), id 4194310; `jobId: null`, `renderProgress: false`
cả 6). Log từng biến thể: `probe-{A..F}.log`. Ảnh chụp X11 thật (ffmpeg
x11grab): `xshot-{A..F}-after-keys.png` (+ `xshot-D-after-tabs.png`,
`xshot-F-after-enter1.png`).

**Ba giả thuyết đã loại trừ bằng đo thật:**

1. "Gõ sai focus / phím đi lạc" — LOẠI. Mọi biến thể đều `FOCUS_OK`
   (XGetInputFocus == id dialog), text xuất hiện đúng trong ô Name, ảnh
   chụp thấy ô Name có viền focus. Phím tới đúng widget, chỉ là GTK
   không làm gì với Enter ở đó.
2. "Dấu `/` trong full path khiến GTK hiểu là điều hướng, còn tên-file
   thường thì Enter sẽ đóng" — LOẠI. Biến thể A (tên-file, không `/`)
   cũng STILL_OPEN.
3. "Enter lần 1 navigate, Enter lần 2 xác nhận" — LOẠI. Biến thể F: sau
   Return lần 1, text và thư mục hiện tại không đổi gì (ảnh after-enter1),
   Return lần 2 cũng không đóng.

**Vì sao không phải lỗi app:** dialog là hộp thoại native của hệ thống do
Electron mở (`dialog.showSaveDialog(mainWindow, { defaultPath, filters:
[mp4, *], title })`); renderer/main không nhận được sự kiện phím nào từ
bên trong dialog, không có handler nào để sửa. Sửa duy nhất có thể làm ở
phía app là bỏ hẳn dialog native (tự vẽ hộp thoại lưu trong renderer) —
đi ngược UX native và ngoài phạm vi nhiệm vụ; không làm.

## 2. Ba sự cố gặp khi probe (đều đã sửa trong probe, hai cái lan sang harness)

| # | Sự cố | Nguyên nhân thật | Sửa |
|---|---|---|---|
| 1 | Lần chạy A đầu: K3 timeout sau 180s, bridge không healthy | Probe check cứng cổng 8887, nhưng `serviceManager.js` **bỏ qua env BRIDGE_PORT** (chỉ đọc `opts.preferredPort \|\| 8787`, rồi scan 8787..8796 khi bận). Lúc đó 8787 bị luồng khác giữ → bridge thật ở **8788** (pidfile `userdata-A/bridge.pid.json`: `port: 8788`, pid 7909). K3 check sai cổng nên không bao giờ healthy | Probe + harness: đọc cổng thật từ `bridge.pid.json` rồi mới health-check (xem §3.2). `main.ts` không hề nhắc `BRIDGE_PORT` (grep 0 kết quả) |
| 2 | Lần chạy A đầu (sau khi sửa #1): click nút Xuất TRƯỢT, không thấy dialog | Nút Xuất nằm dưới nếp gấp của modal cuộn được; `scrollIntoView("nearest")` + rect đo trước bị lệch ~60px sau khi layout dịch (ảnh chụp: nút ở viewport y~862, click ở y=825 rơi vào ô info text) | Probe + harness: scroll nút về GIỮA modal, đo LẠI rect ngay trước click, thử tối đa 3 lần (xem §3.3). Lần chạy A sau sửa: nút đo lại y=533 (top=518, bottom=548, vh=872), dialog hiện ngay lần 1 |
| 3 | Biến thể D, E lần đầu: K5 timeout "timeline thêm clip" | Probe chỉ đóng modal chào mừng 1 lần sau K2; modal có thể hiện MUỘN (sau K2) nên click "+ Thêm" rơi vào backdrop — đúng bài học K7 lần 7 mà harness đã có `ensureNoModal` + thử lại, probe lúc đó chưa có | Probe: thêm `ensureNoModal()` ngay trước click K5 + thử lại 1 lần như harness. D/E chạy lại với code đã sửa đều qua K5 (D/E rerun xong, xem §1) |
| 4 | Probe lần A đầu "xong" nhưng tiến trình treo (phải SIGTERM) | Probe kết thúc `main()` mà không `process.exit()`: WebSocket CDP mở + pipe stdout của app giữ event loop sống mãi; `process.on("exit")` không chạy khi bị SIGTERM nên log chính không được ghi (chỉ có applog từ catch) | Probe: log incremental (append từng dòng vào `probe-*.log` ngay khi log), `process.exit(0/1)` tường minh sau cleanup. Harness chính KHÔNG dính (đã có `process.exit` cuối `main()`) |

Phụ: AppImage in ra stdout **danh sách file giải nén ~4,3 MB (21.194 dòng)**
khi chạy với `APPIMAGE_EXTRACT_AND_RUN=1` — hành vi có sẵn, L1 cũng gặp y
hệt (`probe-applog.txt` 4.300.872 byte, cùng nội dung). Probe M9 chỉ giữ
500 KB cuối của appLog; không phải lỗi app, không sửa.

## 3. Sửa harness click-test (file duy nhất M9 sửa)

`apps/desktop/scripts/clicktest-ship-full.mjs` — sửa 3 chỗ, đều là harness
test, **không đổi code sản phẩm** (`node --check` OK; XTEST python trích ra
compile OK; không chạm TS nên không cần tsc):

| # | Sửa | Vì sao (bằng chứng) |
|---|---|---|
| 1 | Helper XTEST: thử `CDLL("libXtst.so.6")` hệ thống trước, lỗi thì fallback `CDLL(os.environ["XTST_LIB"])`; harness trích `usr/lib/libXtst.so.6` từ chính AppImage bằng `--appimage-extract` ở K1, truyền qua env `XTST_LIB` cho cả 2 lần gọi python (`tree` + `type`) | **libXtst.so.6 KHÔNG có sẵn hệ thống trên VM này** lúc M9 bắt đầu (ldconfig không thấy; `apt install libxtst6` → "Unable to locate package"): helper cũ chết ngay dòng import với `OSError`, không gõ được dialog. Bản bundle trong AppImage load được (deps libX11/libXext đều có sẵn hệ thống — kiểm bằng `ldd`). Ghi chú trung thực: trong lúc M9 chạy, `libXtst.so.6` đã XUẤT HIỆN trong `/lib/x86_64-linux-gnu` (ldconfig thấy từ ~00:32) — M9 không cài nó, nhiều khả năng một luồng đợt 85 song song đã cài; click-test lần 20 vì vậy chạy bằng lib hệ thống, KHÔNG phải fallback. Fallback đã được kiểm chứng độc lập: (a) probe M9 (`xtest-m9.py`) in `XTST_FALLBACK ...` và gõ phím thành công khi hệ thống chưa có lib; (b) sau lần 20, chạy lại chính python của harness trong mount namespace che lib hệ thống (`unshare -rm`, bind `/dev/null` đè lên lib hệ thống) → in `XTST_FALLBACK /home/hatch/workspace/tmp-k7-clicktest/squashfs-root/usr/lib/libXtst.so.6` rồi mới `XOPEN_FAIL` (do :97 đã dọn, không còn display — import/load đã qua) |
| 2 | K3: chờ `bridge.pid.json` tối đa 120s, đọc cổng thật, health-check trên cổng đó (tối đa 300s); mọi URL render/download sau K3 dùng `bridgePort` đã phát hiện thay cho hằng số 8787; K8 đổi tên biến cục bộ thành `bridgePortK8` để khỏi shadow | Sự cố §2 #1: check cứng 8787 fail oan khi bridge thật ở 8788. Lần 20 log: `K3: bridge.pid.json — bridge pid=... port=8787` (lần này 8787 trống nên vẫn 8787, nhưng cơ chế đã đúng) |
| 3 | K7: mỗi lần thử scroll nút Xuất về GIỮA modal (`scrollIntoView block:"center"`), đo LẠI rect ngay trước click, log `y/top/bottom/vh`, tối đa 3 lần cho tới khi gõ được đích; giữ lại bước kiểm `clickedOk` + retry cũ làm lưới an toàn | Sự cố §2 #2: click trượt do rect cũ lệch ~60px. Lần 20: `K7: click Xuất lần 1: nút y=533 (top=518 bottom=548 vh=872)` — dialog hiện ngay lần 1, `TYPED_OK` ngay |
| — | Comment XTEST cập nhật kết luận M9 (Enter = hành vi GTK, click Save là luồng đúng duy nhất; phím Return giữ lại làm no-op vô hại) | Ghi rõ để luồng sau không "sửa" lại Enter lần nữa |

Không đổi `serviceManager.js`, `main.ts`, `package-ship.mjs`,
`package.json`, `ExportPanel.tsx`, không đụng `.github/workflows/*`.

## 4. Nút "Tải xuống MP4" sau render — GIỮ BẤM TAY, không nối tự động

Đã đọc `apps/web/src/ExportPanel.tsx:1313-1330` (`downloadMp4`) +
`apps/web/src/lib/nativeFiles.ts:127` (`saveExportNative`):

- Luồng hiện tại: click "Xuất MP4" → dialog native hỏi đích TRƯỚC →
  render → job done → user bấm nút "⬇ Tải xuống MP4" → `saveExportNative`
  stream MP4 đã render về đích đã chọn (Electron) hoặc anchor download
  (web). Không có useEffect nào tự gọi `downloadMp4` khi job done; nút
  chỉ hiện sau khi HEAD-check xác nhận file output còn đó (đợt 68 V8).
- **Không nối tự động**, theo đúng chỉ đạo "chỉ khi có bằng chứng user
  muốn vậy; mặc định giữ nút bấm tay": không có yêu cầu, setting hay
  bằng chứng nào cho thấy user muốn tự động ghi file. Lý do giữ tay:
  đích được chọn TRƯỚC khi render (user có thể đổi ý trong lúc render);
  tự ghi file nhiều MB xuống đĩa mà không có thêm một cử chỉ xác nhận
  là hành vi gây ngạc nhiên; file vẫn nằm trên bridge sau khi done nên
  user có thể tải lại, đổi ý, hoặc bỏ — nút bấm tay là điểm kiểm soát
  cuối cùng đó. Harness click-test vẫn tự bấm nút này (đó là automation
  test, không phải hành vi app).

## 5. Kết quả click-test gói thật (harness đã sửa, AppImage K7)

Lần chạy 20 (`~/workspace/tmp-k7-clicktest/clicktest-run20.log`,
report `clicktest-report.json`, exit 0):

| Bước | Kết quả |
|---|---|
| K1 mở app + CDP lên | PASS (CDP sau ~42s — VM tải cao lúc chạy) |
| K2 UI mount | PASS |
| K3 bridge healthy từ renderer | PASS — pidfile port=8787, healthy sau 2s; fetch renderer ok:true (HTTP 200) |
| K4 import clip mẫu | PASS — clip1.mp4 (104.028 byte) vào bin (cùng mau-1.webm, mau-2.webm mẫu) |
| K5 thêm clip vào timeline | PASS — `.tl-clip 3 → 4` |
| K6 preview play | PASS — time-display "00:00.0 / 00:08.0" → "00:04.4 / 00:08.0"; `video currentTime` vẫn đứng yên như mọi lần trước (quirk có sẵn, xem §6) |
| K7 export MP4 qua UI | **PASS** — job `2c734a676d2786ac` done sau 38s; download **484.316 byte** → `export.mp4`, ffprobe duration **8,000000s**; đích native `export-ui.mp4` **484.316 byte, duration 8,000000s**; `TYPED_OK` ngay lần 1 (`SAVE_CLICK x=1084 y=799`) |
| K8 thoát sạch | PASS — app + bridge chết, pidfile xoá, cổng trống |
| **Tổng** | **8/8 PASS — allPass:true** |

Kiểm lại độc lập sau lần chạy: `ffprobe` cả hai file
`export.mp4` + `export-ui.mp4` đều `duration=8.000000 size=484316`.
Nhiệm vụ yêu cầu "8/8 PASS ≥1 lần" — đã đạt ngay lần chạy đầu tiên với
harness đã sửa nên không chạy thêm lần 2.

## 6. Nợ còn lại / giới hạn

- **Nút Save click theo tọa độ tương đối (heuristic, giữ nguyên từ L1):**
  harness bấm Save tại (rộng-40, cao-23) tính từ góc dialog — đo thật
  nhiều lần đều 1124x822 tại (0,0) trên VM này; lần 20 tâm đo được
  (1084, 799). Nếu GTK/theme/màn hình khác đổi layout action-area,
  click có thể trượt (sẽ thấy `DIALOG_STILL_OPEN` rồi K7 fail honest,
  không PASS giả). **Đã chứng minh không còn fallback bàn phím nào:**
  Tab×12 + Space cũng không đóng (biến thể D) — click Save là đường duy
  nhất. Chưa thử Alt+S / các phím tắt khác của GTK (không có bằng chứng
  chúng tồn tại trong chooser này; click đã đủ tin cậy qua 3 lần PASS
  8/8: L1 lần 18+19, M9 lần 20).
- **K5 tiêu chí `.tl-clip` tăng còn yếu (có sẵn, không phải lỗi M9):**
  project mẫu "Du an mau" đã có 3 clip trong timeline khi app mở mới;
  lần chạy probe thấy `0 → 3` (mẫu render muộn, sau khi đo `tlBefore`),
  lần 20 thấy `3 → 4` (mẫu đã render xong trước K5). Tiêu chí "tăng"
  có thể PASS nhờ mẫu render muộn chứ không nhờ click "+ Thêm" — nhưng
  harness log kèm `autosave clipCount` + `srcs` để đối chiếu, và lần 20
  tăng đúng 3 → 4 sau click. Chưa siết tiêu chí (ngoài phạm vi M9).
- **K6 quirk có sẵn (giữ nguyên từ L1):** `video currentTime` đứng yên
  trong khi time-display vẫn chạy (00:00.0 → 00:04.4). K6 PASS theo tiêu
  chí time-display đổi; chưa điều tra vì sao currentTime đứng yên.
- **Đường retry mở dialog thứ hai (giữ nguyên từ L1):** nếu lần gõ đầu
  fail, harness bấm lại nút Xuất bằng CDP (đi xuyên qua dialog native
  đang mở) → `showSaveDialog` thứ hai mở thêm một dialog. Lần 20
  `TYPED_OK` ngay lần 1 nên nhánh này chưa chạy.
- **K7b fallback vẫn ở trong script:** chỉ chạy khi K7 UI fail, để phân
  biệt lỗi UI export với lỗi render bridge. Không tính là export qua UI.
- **Bridge mồ côi giữ fd CDP 9222 (giữ nguyên từ L1):** chỉ ảnh hưởng
  harness dùng `--remote-debugging-port`; user thường không dùng CDP.
- **/tmp tmpfs 512 MB (giữ nguyên từ L1):** AppImage giải nén ~2 GB vào
  `$TMPDIR`; probe/harness đều đặt `TMPDIR` dưới `~/workspace` nên
  không dính; máy user có /tmp nhỏ vẫn có thể gặp `ENOSPC` khó chẩn đoán.
- **Sóng EPERM:** lần này M9 kiểm tra ghi trước mỗi lượt chạy đều OK
  (repo-1 + tmp-m9-probe), không gặp sóng trong lượt; luật dừng-đúng-luật
  vẫn giữ (còn 723 writeFileSync chưa nối helper — nợ chung đợt 84).
- **Chưa làm:** `.deb` full, macOS/Windows/arm64, tải model 3,7 GB lần
  đầu, downloader kiểm tra dung lượng trống (nợ I5) — giữ nguyên từ L1.
- **LibXtst hệ thống xuất hiện giữa lượt:** M9 không cài nó; không rõ
  luồng nào đã cài — nếu luồng đó gỡ đi, harness vẫn chạy được nhờ
  fallback §3.1 (đã kiểm chứng bằng mount namespace).

## 7. File trong batch (stage chờ push — text only)

Đổi/thêm (toàn text — KHÔNG binary, KHÔNG `dist/`/`build/`/`release/`/
AppImage/.deb/venv/model):

| File | Đổi gì |
|---|---|
| `apps/desktop/scripts/clicktest-ship-full.mjs` (M9 sửa) | XTEST: fallback libXtst từ AppImage qua env `XTST_LIB` (§3.1); K3: cổng bridge đọc từ `bridge.pid.json` (§3.2); K7: click Xuất scroll-giữa + đo lại + tối đa 3 lần (§3.3); comment kết luận Enter = hành vi GTK |
| `docs/PHASE9_ROUND85_M9_SAVE_DIALOG_ENTER_LIMITS.md` (M9 mới) | File này |

KHÔNG đưa vào batch: AppImage 556 MB + `linux-unpacked/` +
`userdata-*/` + report JSON + log chạy + ảnh chụp X11 + verdict JSON
(đều ở `~/workspace/tmp-k7-clicktest` / `~/workspace/tmp-m9-probe`,
giữ ngoài repo để parent đối chiếu), `export*.mp4` (file xuất test),
`~/workspace/tmp-m9-probe/squashfs-root/` (libXtst đã trích — ngoài repo).
