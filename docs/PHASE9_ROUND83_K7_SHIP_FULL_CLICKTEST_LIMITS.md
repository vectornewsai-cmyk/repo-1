# LIMITS — Phase 9 đợt 83, luồng K7: SHIP FULL — click-test AppImage thật + sửa race orphan-kill9-relaunch

Ngày: 11/11/2026 (lượt cron 00:35 +07). Repo local `~/workspace/repo-1`,
HEAD `5f548ef8`. **CHỈ stage, KHÔNG push, KHÔNG release/tag, KHÔNG binary
vào batch.** (Luồng K7 viết bởi parent từ log luồng
`hidden_files/round83-k7.md` (249 dòng) + log ship/click-test trên đĩa —
luồng hết thời gian cron trước khi tự viết LIMITS/stage. Mọi số dưới đây
đều đọc từ log đó hoặc file log tương ứng, không đoán.)

## 0. Kết luận (đọc trước)

1. **Ship profile `full` ĐÃ BUILD LẠI + VERIFY SẠCH.** AppImage mới
   **556.967.608 byte** (J8: 556.967.568; +40 byte do code K7 + icon
   sinh lại), sha256
   `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c`.
   Probe AI **8/8 available:true** (caption/translate/tts/bgremove/
   reframe venv, silence/scene/beats system) — **false-negative
   bgremove của J8 ĐÃ ĐÓNG** (fix timeout probe 15s → 120s đã vào gói).
2. **Race orphan-kill9-relaunch (J8 §5.2) và smoke lần 2 timeout
   (J8 §5.1) ĐÃ HẾT.** Sau sửa: `--skip-build` chạy lại 2 lần liên
   tiếp, cả hai đều **PASS: smoke-appimage + orphan-kill9-relaunch**
   (ship-run3.log, ship-run4.log).
3. **Click-test gói thật: 8/9 PASS** (run 14, report JSON
   2026-11-10T20:35:10Z). K1–K6 + K8 PASS; **K7 export MP4 qua UI
   FAIL** — hộp thoại lưu native không xử lý được bằng XTEST
   (X_SetInputFocus BadMatch); fallback K7b render smoke qua bridge
   **PASS** (job done sau 5s, 115.869 byte, ffprobe 8,000000s).
4. **Cơ chế thật của 2 race (đính chính giả thuyết J8 §5.2):**
   KHÔNG phải "mỗi /api/health spawn ffmpeg -version" — bridge đã
   cache `ffmpegVersion()` từ đợt 52 I4. Cơ chế là 3 lỗi dồn nhau
   trong `serviceManager.js`: (1) deep probe AI (8 import Python
   nặng) chạy SONG SONG với spawn bridge + chờ healthy → tranh CPU;
   (2) timeout khởi động + timeout từng health check CHỐT MỘT LẦN
   lúc spawn từ loadavg lúc đó — tải do deep probe chỉ lên SAU đó;
   (3) `healthCheck` chỉ tính `connected=true` khi đã nhận xong HTTP
   response → request timeout sau khi TCP đã nối vẫn `connected=false`
   → không được gia hạn +30s đúng lúc cần nhất → fail cứng ở 31s.
5. **Sóng EPERM cắt lần chạy 1** (00:39–~01:15 +07): 5/5 retry fail
   ở `gen-icon.mjs` (PIL save → PermissionError); `icon-192.png` bị
   truncate về 0 byte (18:14) — **tự lành** khi sóng qua (sinh lại
   1271 byte trong run 2). Script fail-fast dừng đúng thiết kế, không
   build AppImage từ cây stage cũ. VM reboot ~18:30 (uptime reset
   1 phút); sau reboot mọi đường ghi OK.

## 1. Sửa race (4 chỗ, đã vào code + AppImage mới)

| File | Sửa | Lý do |
|---|---|---|
| `apps/desktop/src/services/serviceManager.js` | `healthCheck`: `connected=true` khi TCP đã nối được (theo dõi `req.on('socket')` + `connect`), kể cả khi HTTP response timeout | Bridge sống-chỉ-chậm thì vòng chờ được gia hạn +30s |
| `apps/desktop/src/services/serviceManager.js` | `_spawnBridgeOnPort`: timeout từng health check tính LẠI mỗi vòng từ `currentLoadFactor()` (trần 8000ms như cũ), không chốt lúc spawn | Tải do deep probe chỉ lên sau spawn |
| `apps/desktop/src/main.ts` | Guard smoke 30s → 60s (`runSmokeCheck`) | Đường probe xấu nhất đã ~30s; J8 §5.1 gợi ý tăng 60s |
| `apps/desktop/scripts/package-ship.mjs` | Orphan: `healthy2` check đơn → poll `waitFor(httpOk, 120s, 2s)` như healthy1 | Một lần GET 2s timeout không kết luận được bridge chết |
| `apps/desktop/scripts/package-ship.mjs` | Smoke: bỏ yêu cầu log "bridge chạy tại", chỉ đòi dòng `spawn bridge: …bin/vcut-node` | Smoke mode quit trước khi deep probe xong → assert cũ fail oan dù smoke ok:true |
| `apps/desktop/scripts/package-ship.mjs` | Orphan: `let pid2 = null` ngoài try | Latent J8: ReferenceError ngay dòng log thành công khi mọi check pass |
| `apps/desktop/package.json` | Thêm script `clicktest:ship` | Chạy click-test gói thật bằng 1 lệnh |

KHÔNG đổi `startTimeoutForLoad` (test assert 30s/60s/90s/120s vẫn giữ),
KHÔNG đổi thứ tự probe/bridge trong `start()` (probe song song là thiết
kế có chủ đích; sửa timeout + connected đã đủ theo bằng chứng log).

## 2. Hai lỗi script lộ ra khi race đã sửa (sửa trong K7)

Cả hai đều là lỗi của `package-ship.mjs` (J8), chỉ lộ ra khi sản phẩm
đã chạy đúng — lần chạy 2 K7 là lần đầu orphan đi hết flow nên mới gặp:

1. **Smoke assert quá chặt:** bước smoke đòi log có cả `bin/vcut-node`
   VÀ `bridge chạy tại`. Dòng sau chỉ ghi khi `start()` hoàn thành
   (sau deep probe AI), còn smoke mode quit app ngay khi probe renderer
   xong → app có thể thoát trước khi probe sâu xong dù bridge đã healthy.
   Sửa: chỉ đòi dòng `spawn bridge: …bin/vcut-node`; bridge healthy đã
   chứng minh bởi chính kết quả smoke (`ok:true`,
   `bridgeFromRenderer:"ok"`).
2. **Orphan `pid2 is not defined` (latent J8):** `const pid2` khai trong
   `try`, dòng `console.log` thành công sau `try/finally` dùng
   `pid2.pid` ngoài scope → ReferenceError ngay khi mọi check đều pass.
   Sửa: `let pid2 = null` ngoài try, gán trong try. (Bằng chứng trên
   đĩa: ship-run2.log ghi `FAIL: orphan-kill9-relaunch: pid2 is not
   defined` dù report JSON cho thấy orphan về chức năng PASS hoàn toàn
   — oldBridgePid 16289, newBridgePid 16858, healthy:true.)

## 3. Kiểm chứng code đã sửa (trước khi build lại)

- `node --check` package-ship.mjs + serviceManager.js +
  pythonServices.js: OK.
- tsc apps/desktop: **0 lỗi**; `dist/main.js` có guard 60000; sau
  `copy-services-js`: `dist/services/pythonServices.js` có 120000,
  `dist/services/serviceManager.js` có `socketConnected`.
- bridgePidfile test: **14/14 PASS** (210,2s) với code đã sửa.
- serviceManager test: lần 1 fail 1/10 — test `probe AI phản ánh đúng
  thực tế máy này` assert `bgremove.available === false` (tiền đề "máy
  này không có venv bgremove"). Kiểm tra tay 11/11: `server/bgremove/
  .venv` CÓ rembg (`import rembg` OK) + `~/.u2net/birefnet-general.onnx`
  có → probe `available:true` là ĐÚNG thực tế. Nguyên nhân: venv
  bgremove đã có từ đợt 53 J8 + fix probe 120s của J8 làm import sâu
  hoàn thành thay vì timeout 15s; test trước đây pass nhờ
  false-negative. KHÔNG phải do sửa K7 (K7 không đụng probe). Sửa
  test: bgremove khóa theo thực tế (venv có → true + pythonSource
  venv; không → false + lý do rembg/BiRefNet). Chạy lại riêng test
  probe: **PASS** (23,2s).

## 4. Ship lại profile full (run K7)

**Lần chạy 1 (11/11 ~01:05–01:15 +07): DỪNG SỚM do sóng EPERM — KHÔNG
phải lỗi code.** Log: `~/workspace/tmp-k7-clicktest/ship-run.log`.

- build-desktop: **PASS**. prepackage: icon OK, web dist copy OK,
  slim venv caption OK (453.597.096 byte, khớp J8), tts OK
  (306.872.496 byte, khớp J8); đang build slim venv reframe thì sóng
  EPERM tới → 5/5 retry đều fail ở `gen-icon.mjs` → script fail-fast
  dừng đúng thiết kế.
- Sóng vẫn BẬT lúc 18:15: probe node `writeFileSync` → EPERM trực
  tiếp; python `open(...,'w').write('x')` in "ok" nhưng file chỉ 0
  byte (flush lúc thoát fail lặng — bẫy: python "ok" không có nghĩa
  ghi được; chỉ tin khi `stat` size + đọc lại đúng).
- VM reboot ~18:30; sau reboot mọi đường ghi đều OK có kiểm size
  (node/py × /tmp/repo). **Lần chạy 2 (18:31–19:17, log
  `ship-run2.log`): build-desktop PASS, prepackage PASS, electron-
  builder PASS, verify PASS, probe 8/8.**

**Lần chạy 2 (ship run2, AppImage MỚI — BUILD LẠI, không tái dùng J8):**

- AppImage: **556.967.608 byte**, sha256
  `0326dccb2dee92237890320fac00d7a3fa46f15b008c3cefbb6c3a54386bd12c`.
  Backup AppImage J8 giữ tại
  `~/workspace/tmp-j8-electron/ship/ship-full-j8-backup/`.
- build-desktop PASS, prepackage PASS, electron-builder PASS,
  verify-packaged-tree PASS (đủ 4 venv).
- **Probe AI: 8/8 available:true.**
- Smoke: kết quả renderer **ok:true** (`bridgeFromRenderer:"ok"`,
  `textLen:4161`, title "VCut Studio — Trình dựng video", url
  app://vcut/index.html) nhưng script báo FAIL ở assert log — xem
  §2.1 (assert quá chặt, không phải lỗi sản phẩm).
- Orphan: **về chức năng PASS hoàn toàn** (report JSON):
  `oldBridgePid 16289, oldBridgeDeadAfterRelaunch:true,
  newBridgePid 16858, newBridgePort 8787, newBridgeHealthy:true,
  smokeOk:true, smokeNote:null`. Log manager: lần 1 chờ healthy tối
  đa 66,6s (loadavg 8,88, mỗi check 4440ms — timeout thích ứng +
  tính lại theo tải, code K7 đã vào gói); dọn mồ côi 16289 OK; bridge
  mới 16858 chờ tối đa 30s (loadavg 3,68) → healthy ~9s, **KHÔNG còn
  dòng "bridge state -> failed"**, dừng sạch SIGTERM 19:16:34.
  **Race §5.2 và §5.1 ĐÃ HẾT trong lần chạy này.** Script vẫn báo
  FAIL do lỗi latent `pid2 is not defined` ở dòng log thành công
  (xem §2.2).
- Kết luận lần 2: SHIP-EXIT=1 chỉ vì 2 lỗi script (assert smoke +
  scoping pid2), không phải lỗi sản phẩm. Sửa cả hai rồi chạy lại
  `--skip-build` 2 lần liên tiếp (ship-run3.log, ship-run4.log):
  **cả hai đều PASS: smoke-appimage + orphan-kill9-relaunch**
  (AppImage 556.967.608 byte, sha 0326dccb…).

## 5. Click-test gói thật (script mới)

Script: `apps/desktop/scripts/clicktest-ship-full.mjs` (CDP 9222 +
Xvfb, kế thừa mẫu CDP của J10 nhưng đọc state qua DOM + autosave
localStorage vì gói production không có /src/*; export verify độc lập
từ Node qua GET /api/render/:id/download + ffprobe). Work dir:
`~/workspace/tmp-k7-clicktest/` (report JSON + shots + export.mp4).

**3 lỗi harness tìm được khi chạy (đều lỗi script test, không phải lỗi
app):** (1) `sleep` viết sai `(r) => setTimeout(res, ms)` → sửa thành
`(res) => setTimeout(res, ms)`; (2) lỗi chết giữa các bước không ghi
fail → report allPass:true với chỉ 1 bước (exit 0 giả) → sửa: `allPass`
chỉ khi đủ 8 bước K1–K8 và mọi bước ok; (3) `onmessage` của class CDP
**thiếu khối resolve pending** (chép từ J10 bị sót) → `Page.enable`
timeout 60s × 3 dù CDP HTTP vẫn trả lời — sửa: thêm khối
`if (msg.id && this.pending.has(msg.id))` như J10.

**Kết quả cuối (run 14, report JSON 2026-11-10T20:35:10Z): 8/9 PASS.**

| Bước | Kết quả |
|---|---|
| K1 mở app + CDP lên | PASS (Chrome/156.0.8078.80, CDP sau 24s) |
| K2 UI mount | PASS (#root 1 con, textLen=4216) |
| K3 bridge healthy từ renderer | PASS (healthy sau 4s, HTTP 200) |
| K4 import clip mẫu | PASS (clip1.mp4 104.028 byte vào bin; autosave binMedia khớp) |
| K5 thêm clip vào timeline | PASS (.tl-clip 3→4; clipCount=3) |
| K6 preview play | PASS (time-display 00:00.0→00:04.5 / 00:08.0) |
| K7 export MP4 qua UI | **FAIL** — timeout chờ job render xuất hiện (`.render-progress[data-job-id]`); hộp thoại lưu native không xử lý được bằng XTEST (X_SetInputFocus BadMatch) |
| K7b render smoke qua bridge (fallback) | **PASS** — job done sau 5s; 115.869 byte; ffprobe duration=8,000000s |
| K8 thoát sạch | PASS (app pid 6320 chết, bridge pid 6463 chết, pidfile đã xóa, cổng 8787 trống) |

Các lần chạy trước: run 9 đạt 7/9 (K7 FAIL do nút Xuất nằm dưới nếp
gấp — đo rect không scrollIntoView; K7b FAIL MISSING_ASSET do file
mẫu sinh trong bộ nhớ app); run 13–14 đều 8/9 (K7 FAIL duy nhất do
hộp thoại native). Run 8 dở do VM reboot giữa K7.

## 6. Nợ còn lại / giới hạn

1. **K7 export MP4 qua UI FAIL** — hộp thoại lưu native không xử lý
   được bằng XTEST. Cần hướng khác: mock dialog, dùng `--save-dialog`
   headless, hoặc export qua bridge làm đường chính (K7b đã PASS).
   Đây là nợ UI-test, không phải lỗi sản phẩm (render qua bridge
   chạy đúng, 115.869 byte, 8,000000s).
2. **Orphan-kill9-relaunch chạy lại 2 lần liên tiếp: ĐÃ CÓ** (ship-
   run3.log + ship-run4.log, cả hai PASS) — mục §6 của log luồng để
   trống nhưng bằng chứng đã có trên đĩa; parent xác nhận tại đây.
3. **K9 regression (đợt 83):** WebKitGTK không khởi động được trên VM
   hiện tại (kernel 7.0.0-43→44, plugin GStreamer biến mất, thiếu
   lib) — số WebKit cũ chỉ còn hồ sơ. Không ảnh hưởng K7 (click-test
   chạy trên Chromium/CDP).
4. **AppImage + linux-unpacked KHÔNG stage** — chỉ ở
   `~/workspace/tmp-j8-electron/ship/` và
   `~/workspace/tmp-k7-clicktest/` ngoài repo (binary 557 MB).
5. **Release gate giữ nguyên:** KHÔNG release/tag cho đến khi ngang/hơn
   CapCut thật.
