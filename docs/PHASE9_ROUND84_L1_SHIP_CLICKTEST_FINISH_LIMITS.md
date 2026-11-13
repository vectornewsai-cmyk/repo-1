# Phase 9 Round 84 — L1: HOÀN THÀNH K7 đợt 83 (ship full click-test) — LIMITS

Ngày: 11/11/2026 (lượt cron 03:35 +07). Luồng L1 đợt 84.
Nhiệm vụ: hoàn thành K7 đợt 83 còn dở (log luồng cũ
`hidden_files/round83-k7.md` §5–§7 + `docs/PHASE9_ROUND82_J8_ELECTRON_SHIP_SERVICES_LIMITS.md` §5).
KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch, KHÔNG file `.github/workflows/*`.
AppImage dùng lại bản K7 đã build (không build lại): **556.967.608 byte,
sha256 `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c`**.

## 0. Điểm xuất phát (đọc từ đĩa, mới hơn log K7)

Log K7 dừng ở lần chạy 9, nhưng trên đĩa đã có thêm lần chạy 10–14 + ship-run3/4
(K7 tự chạy tiếp trước khi cron timeout, chưa kịp ghi log):

- Lần chạy 10: `SyntaxError: Identifier 'dur' has already been declared`
  (dòng 524, K7b) — K7 đã sửa ngay sau đó (lần 11–14 chạy được).
- Lần chạy 12: 7/9 — K7 fail + K7b fail (job fallback error).
- Lần chạy 13–14: 8/9 — K1–K6 + K8 PASS, K7b PASS, **K7 export UI FAIL
  cả hai lần**: click nút "Xuất MP4" xong không job nào xuất hiện
  (timeout chờ `.render-progress[data-job-id]` 120s). XTEST gõ nhầm cửa sổ
  ("Chromium clipboard" lần 13; cửa sổ "vcut-studio" 2x2/Unmapped lần 14 →
  `BadMatch` ở `X_SetInputFocus`).
- Ship-run3 (19:27) + run4 (19:35): **ALL GREEN cả hai** (`--skip-build`,
  code K7 đã sửa): probe AI 8/8, smoke PASS, orphan PASS (run4: bridge cũ
  24001 chết, bridge mới 24211 healthy, smoke lần 2 ok). §6 của K7 chưa
  được ghi nhưng bằng chứng đã có trên đĩa.

## 1. Chẩn đoán dialog GTK (probe riêng, trước khi sửa harness)

Viết probe độc lập `~/workspace/tmp-l1-probe/probe.mjs` (+ `xprobe.py`
dump cây X đệ quy kèm map_state/geometry): chạy AppImage thật, đi K1–K6,
click nút Xuất, dump cây X + chụp màn hình X11 thật (ffmpeg x11grab).

**Kết quả chẩn đoán (bằng chứng hình + cây X):**

| Phát hiện | Bằng chứng |
|---|---|
| Dialog GTK **có mở thật** sau khi click Xuất | Ảnh `xshot-after-click.png`: hộp "Save" với ô Name "Du an mau.mp4", danh sách file /home/hatch, nút Cancel/Save, filter "Video MP4" |
| Dialog là cửa sổ top-level MỚI, **Viewable, 1124x822 tại (0,0)** | Cây X sau click: `WIN 4194310 map=Viewable xy=(0,0) wh=1124x822 name=''` |
| **Tên cửa sổ RỖNG** (`XFetchName` → "") — title nằm ở `_NET_WM_NAME`, không phải `WM_NAME` | Cùng cây X trên; đây là lý do K7 lần 12–14 chọn sai cửa sổ (chọn theo tên → trúng cửa sổ tiện ích "vcut-studio" 2x2 **Unmapped** → `XSetInputFocus` BadMatch, phím gõ đi lạc) |
| **Enter trong ô Name/location KHÔNG đóng dialog** | Lần 15/16: gõ xong, 15s sau panel không đổi; dialog vẫn mở trên ảnh chụp |
| Ô Name lúc mở đã focus với tên mặc định được chọn một phần ("Du an mau" chọn, ".mp4" không) — gõ đè mà không chọn hết sẽ **dính đuôi ".mp4" cũ** thành "export-ui.mp4.mp4" | Ảnh lần 16: ô Name = `/home/.../export-ui.mp4.mp4` |
| Nút Save ở góc dưới-phải dialog, tâm ≈ (1084, 799) trên màn 1920x1080, tức tương đối (rộng-40, cao-23) tính từ góc dialog | Đo trên ảnh chụp 3 lần (probe + lần 15 + 16): dialog luôn 1124x822 tại (0,0) |

**Ba bẫy môi trường gặp khi probe (ghi để đợt sau tránh):**

1. `/tmp` là tmpfs 512 MB, **đầy 100%** lúc probe → AppImage giải nén
   sang `$TMPDIR` trên /tmp bị `ENOSPC` → `AppRun: Exec format error`
   (exit 127) / `vcut-studio: Success` (exit 1). Dọn `/tmp/l1-probe`
   (cây giải nén dở ~500 MB) xong /tmp về 5%; probe chuyển sang
   `~/workspace/tmp-l1-probe` (đĩa /home còn 86 GB). Clicktest chính
   không dính vì `TMP_RUN` của nó đã ở `~/workspace/tmp-k7-clicktest`.
2. Bridge mồ côi **thừa kế fd listener CDP 9222** của app đã chết →
   app mới không bind được DevTools (`bind() failed: Address already in
   use`, `Cannot start http server for devtools`) → probe treo vĩnh viễn
   ở `await cdp.ready` (WebSocket CONNECTING, không timeout). Sửa ở
   probe: timeout 30s cho CDP ready + dọn process mồ côi theo cmdline
   trước khi chạy. Clicktest chính đã có sẵn đoạn dọn bridge ở `finally`
   nên không dính.
3. Xvfb :96 chết giữa chừng (không log crash — bị kill từ ngoài, không
   chứng minh được ai kill) → app mất display, chết theo; bridge sống
   thành mồ côi giữ cổng 9222 (xem bẫy 2). Probe chuyển sang display
   :147 (ít va chạm với :97/:98/:99/:100 các luồng khác đang dùng).

## 2. Sửa harness click-test (file duy nhất L1 sửa)

`apps/desktop/scripts/clicktest-ship-full.mjs` — sửa 4 chỗ, đều là
harness test, **không đổi code sản phẩm**:

| # | Sửa | Vì sao (bằng chứng) |
|---|---|---|
| 1 | Helper XTEST: thêm lệnh `tree` (map_state + x/y/w/h); `type` kiểm tra lại focus thật bằng `XGetInputFocus`, focus sai thì báo `FOCUS_FAIL`, **không gõ mù** | Chọn dialog theo tên là sai (tên rỗng, §1); cửa sổ Unmapped gây BadMatch |
| 2 | `typeExportDest`: chọn dialog = cửa sổ **MỚI, Viewable, rộng ≥400px** (lớn nhất nếu nhiều); thử lại 1 lần sau 3s nếu chưa map | Dialog đo thật 1124x822 Viewable; cửa sổ tiện ích đều Unmapped/nhỏ |
| 3 | Helper `type`: map dấu câu sang **tên keysym** (`"/"→slash`, `"-"→minus`, `"."→period`, `"_"→underscore`…); **Ctrl+A** thay Ctrl+L; gõ xong **click nút Save** bằng XTest tại (rộng-40, cao-23) tính từ góc dialog; coi cửa sổ bị huỷ = dialog đã đóng; chặn handler lỗi X mặc định | `XStringToKeysym("/")` trả 0x0 → keycode 204 vô nghĩa: lần 15 gõ `/home/.../export-ui.mp4` thành `homehatchworkspacetmpk7clicktestexportuimp4.mp4` (mất hết `/` và `-`). Ctrl+L không mở location bar riêng (ô Name vẫn là nơi gõ) nên thiếu Ctrl+A sẽ dính đuôi `.mp4` cũ. Enter không đóng dialog (§1) nên phải click Save. Lần 17: Save click đã đóng dialog nhưng helper đọc `GetWindowAttributes` trên cửa sổ đã huỷ → BadWindow → báo sai `DIALOG_STILL_OPEN` (đã sửa: huỷ = đóng) |
| 4 | K7: sau khi render xong + tải về qua bridge, **bấm nút "⬇ Tải xuống MP4"** rồi chờ file về đúng đích native đã chọn (tới 60s), ffprobe cả hai file; PASS chỉ khi **cả download lẫn đích native đều >0 byte và duration >0**; xoá `EXPORT_DEST` cũ từ đầu lượt (tránh dialog hỏi "Replace?") | App **không tự lưu** ra đích: `downloadMp4` → `saveExportNative` chỉ chạy khi user bấm nút tải (`ExportPanel.tsx` ~1319). Lần 17 PASS theo tiêu chí cũ (download 484316 byte) nhưng đích native chưa hề tồn tại — tiêu chí cũ chưa đủ "export qua UI" thật |

Không đổi `serviceManager.js`, `main.ts`, `package-ship.mjs`,
`package.json` (các sửa K7 đã có sẵn, đã verify lại bằng grep — xem §5).
Không đổi code sản phẩm nào khác; không đụng `.github/workflows/*`.

## 3. Kết quả click-test (AppImage K7, sha 0326dccb…)

| Lần chạy | Kết quả | Ghi chú |
|---|---|---|
| 15 (L1) | **8/9** — K7 FAIL | Chưa sửa keysym: path gõ mất `/` và `-` (xem §2 #3); K7b PASS, K8 PASS |
| 16 (L1) | **8/9** — K7 FAIL | Path gõ đúng sau khi sửa keysym, nhưng Enter không đóng dialog; ô Name = `.../export-ui.mp4.mp4` (dính đuôi `.mp4` cũ); K7b PASS, K8 PASS |
| 17 (L1) | **K7 PASS (tiêu chí cũ)** — job `d474faaf52d17bd3` done sau 16s, download 484316 byte, duration 8.0s | Save click đã đóng dialog, job chạy; helper báo sai `DIALOG_STILL_OPEN` (đã sửa, §2 #3); **đích native chưa tồn tại** vì harness chưa bấm nút tải → tiêu chí cũ thiếu, phải siết (§2 #4) |
| **18 (L1)** | **8/8 PASS — allPass:true** | K7 đầy đủ lần đầu: job `e3618881d1e1139f` done sau 22s; download **484316 byte, duration 8.000000s**; đích native **484316 byte, duration 8.000000s**; TYPED_OK ngay lần 1 (`SAVE_CLICK x=1084 y=799`); K8 thoát sạch (app 32366, bridge 32531 chết, pidfile xoá, cổng 8787 trống) |
| **19 (L1)** | **8/8 PASS — allPass:true** | **Lần PASS thứ hai liên tiếp (khẳng định):** job `bded1bc1adfbfedc` done sau 32s; download + đích native **484316 byte, duration 8.000000s**; TYPED_OK ngay lần 1; K8 thoát sạch (app 33261, bridge 33421 chết, pidfile xoá, cổng 8787 trống) |

K1–K6 ổn định cả 5 lần L1 (CDP 20s, bridge healthy 4s sau mount,
import 9s, preview time-display 00:00.0 → 00:04.4/00:04.5).
K7b fallback không cần dùng ở lần 18–19 (K7 UI PASS ngay).
Log: `~/workspace/tmp-k7-clicktest/clicktest-run{15,16,17,18,19}.log`;
report cuối: `~/workspace/tmp-k7-clicktest/clicktest-report.json`
(allPass:true, lần 19). File xuất thật: `export.mp4` +
`export-ui.mp4` (484316 byte mỗi file, ffprobe duration 8.0s).

## 4. Orphan-kill9-relaunch chạy lại (code K7 đã sửa)

Chạy `node scripts/package-ship.mjs --profile full --skip-build`
(AppImage K7 đã build, không build lại), 2 lần liên tiếp:

| Lần | Kết quả | Chi tiết (report JSON + service-manager.log) |
|---|---|---|
| K7 run3 (10/11 19:27, trước L1) | ALL GREEN | Probe 8/8, smoke PASS, orphan PASS |
| K7 run4 (10/11 19:35, trước L1) | ALL GREEN | Probe 8/8, smoke PASS, orphan PASS — bridge cũ 24001 chết, bridge mới 24211 healthy, smoke lần 2 ok (`smokeNote:null`) |
| **L1 run1 (11/11 ~22:01–22:02)** | **ALL GREEN** | Probe 8/8, smoke PASS, orphan PASS — bridge cũ **34846** mồ côi sống + healthy sau kill -9, dọn OK (`pidfile: đã dọn bridge mồ côi pid 34846 (cổng bridge 8787 đã trống, CDP 9222 đã trống)`), bridge mới **35022** healthy, thoát sạch (`smokeOk:true, smokeNote:null`). Log service-manager: `~/workspace/tmp-l1-probe/ship-orphan-l1/service-manager-run1.log`; report: `.../report-run1.json` |
| **L1 run2 (11/11 ~22:03–22:05)** | **ALL GREEN** | Probe 8/8, smoke PASS, orphan PASS — bridge cũ **35777** mồ côi sống + healthy sau kill -9, dọn OK (`pidfile: đã dọn bridge mồ côi pid 35777 (cổng bridge 8787 đã trống, CDP 9222 đã trống)` 22:04:40), bridge mới **35938** spawn 22:04:41 → healthy `bridge state -> running` 22:04:52 (~11s), thoát sạch (`smokeOk:true, smokeNote:null`). Log service-manager: `~/workspace/tmp-l1-probe/ship-orphan-l1/service-manager-run2.log`; report: `.../report-run2.json` |

**Kết luận orphan:** race J8 §5.2 (bridge mới fail healthy sau 31s) và §5.1
(smoke lần 2 timeout) **đã hết**: 4 lần chạy liên tiếp (K7 run3/run4 +
L1 run1/run2) đều PASS, không còn dòng `bridge state -> failed` nào
trong log service-manager; lần 1 chờ healthy tối đa 30s (loadavg 2.74,
mỗi check tính lại theo tải), dọn mồ côi trong <1s sau khi mở lại.
Cơ chế dọn (pidfile H7) + các sửa K7 (`socketConnected`,
timeout health check tính lại mỗi vòng, guard smoke 60s,
poll `healthy2` 120s, fix scoping `pid2`) đã được kiểm chứng
end-to-end trên AppImage thật.

## 5. Kiểm chứng code đã sửa (trước khi kết luận)

- `node --check` clicktest-ship-full.mjs: OK; helper Python trích ra
  compile OK (`python3 -m py_compile`); map keysym đo thật trên Xvfb:
  slash→keycode 61, minus→20, period→60, underscore→20 (MAP-OK).
- Các sửa K7 còn nguyên trong code (grep 11/11): `serviceManager.js`
  có `socketConnected` (dòng 165–185); `main.ts` guard smoke 60000
  (dòng ~290, comment ROUND83-K7); `package-ship.mjs` có
  `let pid2 = null` + poll `healthy2` 120s + assert chỉ đòi dòng
  `spawn bridge: …bin/vcut-node`; `package.json` có script
  `clicktest:ship`; `serviceManager.test.cjs` có test bgremove khóa
  theo thực tế venv (dòng ~176–179, comment ROUND83-K7).
- Suite test serviceManager: K7 đã chạy — lần đầu 9/10 (fail duy nhất
  là tiền đề test cũ `bgremove.available === false`, đã chứng minh sai
  vì venv bgremove có rembg thật); sau khi sửa test theo thực tế,
  **test probe PASS** (23,2s). L1 chạy lại riêng test probe 11/11:
  **PASS (6,0s)** — `node --test --test-name-pattern="probe AI phản
  ánh đúng thực tế máy này"`. L1 không chạy lại toàn suite (không đổi
  code liên quan; ship run + click-test đã kiểm chứng end-to-end đường
  start/probe/smoke/orphan).

## 6. Nợ còn lại / giới hạn

- **Nút Save click theo tọa độ tương đối (heuristic):** harness bấm Save
  tại (rộng-40, cao-23) tính từ góc dialog — đo thật 3 lần đều
  1124x822 tại (0,0) trên VM này (GTK hiện tại). Nếu GTK/theme/màn hình
  khác đổi layout action-area, click có thể trượt (sẽ thấy
  `DIALOG_STILL_OPEN` rồi K7 fail honest, không PASS giả). Chưa có
  fallback bàn phím (Tab tới Save + Space). Xvfb không có window
  manager nên dialog luôn ở (0,0); trên desktop thật có WM, vị trí
  khác nhưng harness tính theo geometry thật của dialog nên vẫn đúng.
- **Đường retry mở dialog thứ hai:** nếu lần gõ đầu fail, harness bấm
  lại nút Xuất bằng CDP (đi xuyên qua dialog native đang mở — CDP
  không bị modal chặn) → `showSaveDialog` thứ hai mở thêm một dialog.
  Với fix hiện tại, lần 18–19 đều TYPED_OK ngay lần 1 nên nhánh này
  chưa chạy; nếu nó chạy, render vẫn đi qua dialog thứ hai nhưng
  dialog đầu còn treo tới lúc K8 kill app — chấp nhận được cho harness,
  không phải lỗi sản phẩm.
- **K6 quirk có sẵn (không phải lỗi L1):** mọi lần chạy 12–19 đều
  `video currentTime đổi=false` trong khi time-display vẫn chạy
  (00:00.0 → 00:04.4) — preview tiến theo đồng hồ hiển thị, không theo
  `currentTime` của thẻ `<video>`. K6 PASS theo tiêu chí time-display
  đổi; chưa điều tra vì sao currentTime đứng yên.
- **K7b fallback vẫn ở trong script:** chỉ chạy khi K7 UI fail, để
  phân biệt lỗi UI export với lỗi render bridge. Không tính là export
  qua UI (tên bước ghi rõ FALLBACK).
- **Bridge mồ côi giữ fd CDP 9222:** chỉ ảnh hưởng harness dùng
  `--remote-debugging-port` (app mới không bind được DevTools, probe
  treo nếu không có timeout). User thường không dùng CDP nên không
  dính; lần mở lại sau crash, pidfile cleanup giết bridge mồ côi nên
  cổng được giải phóng (đã chứng minh ở §4).
- **/tmp tmpfs 512 MB:** AppImage giải nén ~2 GB vào `$TMPDIR`; nếu
  `TMPDIR` trỏ /tmp nhỏ sẽ `ENOSPC` → `Exec format error` khó hiểu
  (gặp ở probe L1, §1). User thường có /tmp lớn hơn, nhưng đây là
  điểm gãy khó chẩn đoán nếu máy ít RAM/tmpfs nhỏ.
- **Sóng EPERM vẫn còn:** K7 run1 dừng vì sóng (icon-192.png bị
  truncate 0 byte rồi tự lành ở run2); L1 kiểm tra ghi node trước mỗi
  lượt chạy đều OK lần này, nhưng sóng có thể quay lại bất cứ lúc nào
  (luật dừng-đúng-luật vẫn giữ).
- **Chưa làm (nợ từ J8 §5.4, giữ nguyên):** `.deb` full chưa build
  (VM thiếu libnotify4/libxtst6/libsecret-1-0 + libfuse2);
  macOS/Windows/arm64 không build được từ Linux; tải model 3,7 GB lần
  đầu trong app chưa đo tốc độ thật; downloader chưa kiểm tra dung
  lượng trống trước khi tải (nợ I5); `VCUT_NODE` override / `bin/node`
  thật chưa ship.
- **File xuất K7 là toàn bộ project mẫu** (3 track/4 clip gồm mau-1,
  mau-2 + clip1.mp4 — 484316 byte), không phải chỉ clip1.mp4 — đúng
  flow người dùng thật (xuất cả timeline), không phải lỗi.

## 7. File trong batch (stage chờ push — text only)

Đổi/thêm (K7 + L1, toàn text — KHÔNG binary, KHÔNG `dist/`/`build/`/
`release/`/AppImage/.deb/venv/model):

| File | Đổi gì |
|---|---|
| `apps/desktop/src/services/serviceManager.js` (K7) | `healthCheck`: `connected=true` khi TCP đã nối (socketConnected); timeout từng health check tính lại mỗi vòng theo tải |
| `apps/desktop/src/main.ts` (K7) | Guard smoke 30s → 60s (`runSmokeCheck`) |
| `apps/desktop/scripts/package-ship.mjs` (K7) | Orphan: poll `healthy2` 120s thay check đơn; bỏ assert log "bridge chạy tại"; `let pid2 = null` ngoài try (fix scoping) |
| `apps/desktop/package.json` (K7) | Thêm script `clicktest:ship` |
| `apps/desktop/src/services/serviceManager.test.cjs` (K7) | Test probe bgremove khóa theo thực tế venv (có → true, không → false + lý do) |
| `apps/desktop/scripts/clicktest-ship-full.mjs` (K7 mới + L1 sửa) | Harness click-test gói thật K1–K8; L1: chọn dialog theo cây X (Viewable ≥400px), keysym dấu câu, Ctrl+A, click Save, verify đóng dialog, bấm nút tải + verify đích native |
| `docs/PHASE9_ROUND84_L1_SHIP_CLICKTEST_FINISH_LIMITS.md` (L1 mới) | File này |

KHÔNG đưa vào batch: AppImage 556 MB + `linux-unpacked/` +
`userdata-*/` + report JSON + log chạy (đều ở `~/workspace/tmp-*`,
giữ ngoài repo để parent đối chiếu), `export*.mp4` (file xuất test),
`~/workspace/tmp-l1-probe/` (probe chẩn đoán + log ship L1).
