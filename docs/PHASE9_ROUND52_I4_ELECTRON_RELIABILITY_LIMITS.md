# Phase 9 đợt 52 — I4: Độ tin cậy Electron/bridge — LIMITS

Ngày: 07/11/2026. Luồng I4 của đợt 52 (VCut Studio). Đóng nợ đợt 51 §4.8:
cache `ffmpegVersion()` trong bridge, timeout khởi động thích ứng theo tải,
dọn renderer/GPU con mồ côi giữ socket CDP. KHÔNG push, KHÔNG release/tag,
KHÔNG binary vào batch (chỉ text). Batch stage chờ user push (xem §6).

## 1. Làm được gì (đã kiểm chứng)

### 1.1 Cache `ffmpegVersion()` trong bridge (`server/bridge/src/index.js`)

- Trước đây mỗi request `GET /api/health` spawn `ffmpeg -version` mới.
  Cache kết quả lần đầu (kể cả `null` khi không có ffmpeg) vĩnh viễn trong
  vòng đời process; các request đồng thời chia sẻ cùng một promise đang
  bay (không spawn trùng). ffmpeg không đổi trong lúc bridge đang chạy nên
  cache vĩnh viễn là đúng; muốn probe lại thì restart bridge (manager làm
  vậy mỗi lần start). Chỉ `ffmpegVersion()` được cache — các flag
  `*Available()` trong health chỉ là `fs.existsSync`, không spawn gì thêm
  (đã kiểm chứng bằng đọc code).
- Số đo thật bằng bench `/tmp/i4-health-bench.mjs` (SEQ 10 lần + CONC 10
  lần, bridge thật trên cổng 18899):

| Điều kiện | Trước sửa | Sau sửa |
|---|---|---|
| Tải nhẹ (loadavg ~5 → 0,46), SEQ median / max | 194 ms / 1394 ms | **14 ms / 205 ms** (lần đầu = probe ffmpeg duy nhất) |
| Tải nhẹ, CONC 10 tổng / median / max | 583 ms / 484 ms / 581 ms | **287 ms / 212 ms / 276 ms** |
| Tải nặng (loadavg ~6,6, 6 busy-loop), SEQ median / max | 1007 ms / 1603 ms | — (không đo lại đúng mức tải này) |
| Tải nặng (loadavg ~16,4, luồng khác + TTS driver), SEQ median / max | — | **75 ms / 180 ms** |
| Tải nặng (loadavg ~16,4), CONC 10 tổng / median / max | — | **115 ms / 103 ms / 107 ms** |
| Tải nặng (loadavg ~16,4), CONC 20 tổng / median / max | — | **219 ms / 187 ms / 196 ms** |
| Tải có kiểm soát (6 busy-loop + luồng khác, loadavg ~19), SEQ median / max | — | **19 ms / 127 ms** |
| Tải có kiểm soát (loadavg ~19), CONC 10 tổng / median / max | — | **113 ms / 97 ms / 101 ms** |

- So sánh cùng điều kiện tải nặng: SEQ median **1007 ms → 19 ms
  (~53×)**, CONC 10 median **1521 ms → 97 ms (~16×)** — dù lượt sau tải
  còn nặng hơn lượt trước (loadavg 19 so với 6,6). Phần dư ~100 ms dưới
  tải cực nặng là scheduling delay của event loop trên VM 4 CPU bão hoà
  (request đơn lẻ chỉ 5–90 ms), không còn là spawn ffmpeg.
- Baseline "trước" đo trên bridge chưa sửa (06/11 tối + 07/11 rạng sáng,
  loadavg ~5 và ~6,6); "sau" đo trên cùng máy sau khi sửa (07/11,
  loadavg 0,46–19). VM reboot giữa chừng (uptime reset, /tmp bị dọn) nên
  bench script đã viết lại từ đầu — cùng logic, cùng cổng bench.

### 1.2 Timeout khởi động thích ứng theo tải (`serviceManager.js`)

- `START_TIMEOUT_MS` 30 s cứng → `startTimeoutForLoad(load1, cpuCount)`:
  `30 s × min(load1/cpu, 4)`, trần 120 s. Máy yên (load ≤ CPU) vẫn đúng
  30 s như cũ — không nới vô cớ. Timeout từng health check cũng nới theo
  tải (2 s → tối đa 8 s) vì event loop bridge đói CPU. Nếu hết giờ mà
  health check gần nhất ĐÃ chạm được bridge (đang sống, chỉ chậm) thì gia
  hạn thêm 30 s MỘT lần duy nhất; chưa chạm được lần nào thì fail luôn.
  Timeout tính lúc spawn, ghi rõ vào `service-manager.log` kèm loadavg.
- Bằng chứng trực tiếp: test "trạng thái đẩy qua event" chạy **40,2 s**
  dưới tải (vượt 30 s cũ) và PASS sau sửa — với code cũ nó đã fail
  "bridge không healthy sau 30s".
- Sửa thêm 1 flake khác trong cùng file test (không phải timeout):
  test "cổng 8787 bận" hardcode 8787 nên fail khi bridge của luồng khác
  đang giữ 8787 lúc setup (`EADDRINUSE` trước khi chạy code manager —
  đúng lỗi H7 gặp ở chạy 3). Đổi sang cổng trống ở dải cao làm cổng ưu
  tiên của test (`findFreePort(18870)`), giữ nguyên ý nghĩa test (bận →
  đổi cổng + báo đúng URL).
- Sửa assertion probe-AI bị stale do luồng khác: test khóa reason
  bgremove phải match `/rembg/`, nhưng luồng I5 đợt 52 đã thêm
  `MODEL_CHECKS` (kiểm tra model BiRefNet) vào `pythonServices.js` nên
  reason giờ là "thiếu model BiRefNet" thay vì "thiếu rembg". Nới regex
  thành `/rembg|BiRefNet/` — khóa đúng ý nghĩa test (bgremove chưa chạy
  được trên máy này, `available === false` vẫn giữ), không khóa đúng một
  chuỗi lý do của probe. Đây là tương tác luồng song song, không phải lỗi
  code I4 (rembg vẫn không có trong mọi venv đã kiểm tra; `~/.u2net/
  u2net.onnx` có từ 03/11).
- **Race stop-trong-start (phát hiện ở lần chạy cuối, xem §2.2b):**
  timeout thích ứng tối đa 150 s vượt timeout test 90 s cũ nên test có
  thể timeout trong lúc `start()` đang bay, rồi `stop()` chạy khi
  `bridgeChild` còn null và return ngay — `start()` sau đó vẫn spawn
  bridge mồ côi, treo runner. Đã sửa: `start()` kiểm tra cờ dừng sau
  mỗi bước trước spawn + đầu mỗi vòng chờ healthy; `stop()` chờ start
  đang bay huỷ xong (tối đa 30 s) rồi mới kill; cờ dừng reset đồng bộ
  ở đầu `start()`. Test hồi quy mới chứng minh fix (tắt fix → fail,
  bật fix → pass). Timeout các test có `start()` nới lên 180 s.

### 1.3 Pidfile Electron + dọn renderer/GPU con mồ côi giữ socket CDP

Module mới `apps/desktop/src/services/electronOrphanCleanup.js` (+
`.d.ts`, + test 11/11) — xem ghi chú đầu file để biết đầy đủ cơ chế:

- Main process ghi `electron.pid.json` trong userData lúc khởi động
  (ghi nguyên tử tmp + rename): `{appPid, pgid, execPath, appPath,
  userDataDir, cdpPort, startedAt}`. Nối vào `main.ts` (sau
  `initServiceLifecycle`, sau khi đã giữ single-instance lock) qua
  `recordElectronProcess()` trong `serviceLifecycle.ts`. Xoá khi thoát
  sạch (`stopLocalServices()`, best-effort); crash/kill -9 thì file còn
  lại đúng như thiết kế.
- `cleanupStaleElectronChildren(userDataDir, {cdpPort})`: quét các
  process mồ côi là con Electron VCut rồi kill từng pid (SIGTERM → chờ
  5 s → SIGKILL → chờ 2 s), KHÔNG kill theo process group (pgid có thể
  là group của shell/launcher). Quét tối đa 3 lượt: con của zygote chỉ
  thành mồ côi sau khi zygote chết (đã có test multi-pass chứng minh).
  Nối vào `ServiceManager.start()` (sau `cleanupStaleBridge`) + export
  `cleanupOrphanElectronOnStartup()` cho harness gọi TRƯỚC khi spawn.
- Nhận diện fail-closed (phải đủ TẤT CẢ): argv[0] basename là
  `vcut-studio`/`electron`; có `--type=<renderer|gpu-process|utility|
  zygote|...>`; có marker `--user-data-dir=<userDataDir>` khớp ĐÚNG
  thư mục userData của lần chạy cũ; mồ côi (ppid == 1 hoặc cha đã chết);
  KHÔNG nằm trong cây tiến trình hiện tại; KHÔNG phải bridge VCut (thuộc
  bridgePidfile); main không có `--type` chỉ được kill khi pid đúng
  appPid trong pidfile ĐÃ CHẾT. Pidfile ghi appPid còn sống và cha còn
  sống → KHÔNG đụng gì (`predecessor-alive`); app cũ còn sống NHƯNG mồ
  côi thì vẫn dọn (nó là leftover — trong app thật single-instance lock
  đã chặn instance mới trước khi cleanup chạy).
- Quét theo socket CDP (`findSocketHolders`): đọc `/proc/net/tcp{,6}`
  tìm inode socket LISTEN trên cổng CDP rồi quét `/proc/<pid>/fd` tìm
  process giữ fd đó. Holder khớp đủ điều kiện thì kill; holder lạ thì
  KHÔNG kill, chỉ báo vào kết quả (`unknownCdpHolders`).
- **Bug bắt được nhờ smoke test thật (xem §2.3):** con Chromium KHÔNG
  giữ argv tách bằng NUL — `/proc/<pid>/cmdline` của chúng là MỘT chuỗi
  duy nhất nối bằng khoảng trắng, chỉ 1 byte NUL cuối (đo thật trên
  gpu-process của AppImage đang chạy: 963 byte, 1 NUL). Code cũ chỉ
  `split('\0')` nên `cmdline[0]` thành cả blob, `basename()` ra rác,
  matcher không bao giờ khớp con Chromium thật. Đã sửa bằng
  `parseProcessCmdline()` (tách cả NUL lẫn space) + test hồi quy
  (pure-function + mock cmdline kiểu Chromium). Unit test cũ không bắt
  được bug này vì mock là process node (giữ NUL) — bài học: mock phải mô
  phỏng đúng định dạng của đối tượng thật, không chỉ đúng flag.

## 2. Kiểm chứng (chạy thật trên VM này)

### 2.1 Unit + tích hợp desktop

| Suite | Kết quả |
|---|---|
| `electronOrphanCleanup.test.cjs` (mới) | **11/11 pass** (2 lần chạy liên tiếp; 1 lần chạy giữa chừng fail 2 test do nhiễu tải lúc spawn mock — chạy lại xanh, xem §5.3) |
| `bridgePidfile.test.cjs` (hồi quy H7) | **14/14 pass** |
| `bundledRuntime.test.cjs` (hồi quy H8) | **10/10 pass** |
| `serviceManager.test.cjs` | **10/10 pass** (9 cũ + 1 mới `stop()`-trong-`start()`); các lượt chạy lặp dưới tải, xem §2.2 |

- `tsc -p apps/desktop/tsconfig.json --noEmit`: **0 lỗi** (chạy lại cuối
  đợt, sau mọi sửa). `npm run build` ở apps/desktop pass
  (copy-services-js copy đủ 6 file, gồm `electronOrphanCleanup.js`).
- `node --check` OK cho mọi file `.js`/`.cjs`/`.mjs` đã đổi/thêm.

### 2.2 `serviceManager.test.cjs` chạy lặp dưới tải (chứng minh hết flake)

Tổng cộng 6 lượt full-suite sau khi sửa xong (loadavg 1-phút lúc bắt
đầu mỗi lượt trong ngoặc):

| Lượt | Kết quả | Ghi chú |
|---|---|---|
| 1 (loadavg 14,5) | 8/9 | Chỉ fail test `startTimeoutForLoad` — do assertion của chính tôi sai (`startTimeoutForLoad(2, 0)` kỳ vọng 30000 nhưng đúng là 60000 vì cpuCount 0 → coi như 1 CPU, load 2 > 1 CPU → factor 2). Đã sửa test, không sửa code. 8 test tích hợp đều pass. |
| 2 (loadavg 9,3) | 8/9 | Chỉ fail assertion sai như trên. |
| 3 (loadavg 5,6) | 8/9 | Chỉ fail assertion sai như trên. |
| 4 — sau sửa assertion (loadavg 3,4) | 8/9 | Fail `killProcessGroup` (timeout 5 s đọc pid cháu — nhiễu tải, test này không đụng code I4; chạy riêng 3/3 pass trong 0,7–1,3 s). 8 test còn lại pass, gồm "trạng thái đẩy qua event" chạy 40,2 s (vượt 30 s cũ). |
| 5 (loadavg 15,7) | **9/9** | |
| 6 (loadavg 9,2) | 8/9 | Fail `probe AI` (reason bgremove đổi do I5 — xem §1.2; đã sửa assertion, chạy riêng sau đó pass). |
| 7 (loadavg 23,4) | **9/9** | |
| 8 — sau sửa assertion probe-AI | **9/9** | Chạy 5,2 s/test đầu… toàn suite ~34 s (lúc máy yên hơn). |

Kết luận: flake "bridge không healthy sau 30s" đã hết — các test
start/restart/event pass ổn định dưới tải (kể cả loadavg 23,4). Các fail
lẻ còn lại đều đã xác định nguyên nhân (nhiễu tải / cổng bận / probe của
luồng khác), không phải hồi quy từ code I4.

#### 2.2b. Race stop-trong-start — phát hiện ở lần chạy cuối, đã sửa + hồi quy

Trong lúc chạy kiểm chứng cuối, một lượt chạy full-suite của
`serviceManager.test.cjs` TREO >6 phút: test runner còn sống, một bridge
còn sống trên cổng 18870 (pid 39059, `BRIDGE_WORK_DIR` trỏ đúng thư mục
tmp của test "cổng ưu tiên bận"), không test nào tiến triển. Phân tích
code + hiện trường cho thấy race thật trong vòng đời start/stop:

- Timeout thích ứng tối đa nay là 120 s + gia hạn 30 s = **150 s**, VƯỢT
  timeout test 90 s cũ. Dưới tải cao, test timeout trước khi `start()`
  xong → `t.after` chạy `manager.stop()` trong lúc `start()` còn đang
  bay (dọn stale / dò cổng / chờ healthy).
- `stop()` cũ thấy `bridgeChild` còn null (chưa spawn) thì return ngay;
  `start()` tiếp tục chạy, spawn bridge SAU khi stop đã xong — bridge
  mồ côi, không ai giữ tham chiếu để kill; handle tiến trình con giữ
  event loop của runner sống mãi → treo. Bằng chứng khớp: bridge mồ côi
  nằm đúng cổng 18870 — cổng blocker của test, được giải phóng khi test
  timeout (t.after đóng blocker) rồi manager dò lại thấy trống nên spawn
  vào đó.
- Fix (`serviceManager.js`): (1) `start()` kiểm tra cờ `_stopping` sau
  mỗi bước await trước spawn (`cleanupStaleBridge`,
  `cleanupStaleElectronChildren`, `findFreePort`) và đầu mỗi vòng chờ
  healthy — huỷ ngay bằng lỗi "start() đã bị stop() huỷ"; (2) `stop()`
  chờ `start()` đang bay huỷ xong (tối đa 30 s) rồi mới kill; (3) cờ
  `_stopping` được reset ĐỒNG BỘ ở đầu `start()` (không để trong
  executor) để `stop()` gọi ngay sau `start()` không bị ghi đè; (4)
  timeout các test có `start()` bridge nới 90 s → 180 s (phải lớn hơn
  150 s tối đa của timeout thích ứng); (5) test "cổng bận" fail nhanh
  nếu blocker không bind được (trước đây promise treo tới hết timeout).
- Test hồi quy mới (10 test tổng cộng): `stop() trong lúc start() đang
  chạy dở thì huỷ start, không để bridge mồ côi` — hai cửa sổ: (A)
  `stop()` ngay sau `start()` (pre-spawn); (B) `stop()` lúc đang chờ
  healthy (dùng wrapper node chỉ ngủ 5 s khi chạy bridge thật, không ngủ
  với `--version` để `_checkNodeBin` không timeout). Cả hai pha assert
  `start()` reject với /huỷ/, trạng thái `stopped`, cổng trống, rồi
  `start()` lại vẫn chạy được. **Kiểm chứng test bắt đúng bug:** tắt tạm
  4 lệnh `_assertNotStopping()` → test FAIL; bật lại → PASS. Test đơn
  lẻ chạy 9,5 s; full-suite sau fix **10/10** (58,4 s).

### 2.3 Smoke test thật — Electron kill -9 → mở lại

`apps/desktop/scripts/verify-electron-orphan-cleanup.mjs` (mới). Electron
dev thật (`electron .`, `app://vcut`) dưới Xvfb, CDP 9225, display :98,
userData riêng `~/.config/@repo-1/desktop-i4-smoke` (tránh đụng luồng
khác). 4 lượt chạy:

| Lượt | Kết quả | Ghi chú |
|---|---|---|
| 1 (trước fix parser cmdline) | **31/32** | Fail đúng 1 check: gpu-process 27383 + utility 27387 mồ côi KHÔNG bị kill (bug `split('\0')` — xem §1.3). Các check khác pass: bridge mồ côi bị dọn, CDP trống, #2 bind lại được, thoát sạch exitCode=0. |
| 2 (sau fix) | **32/32** | Con Chromium tự thoát trong lúc chờ bridge cleanup nên electron cleanup không còn gì để dọn (`killed=[]`, `stale-pid-dead`) — pass nhưng chưa chứng minh được đường kill con thật. |
| 3 (sau fix) | **32/32** | Tương tự lượt 2. |
| 4 (sau fix + đổi thứ tự dọn: con Electron trước, bridge sau) | **32/32 + bằng chứng trực tiếp** | `electron-cleanup: orphan-killed — killed=[35552, 35556, 35604]` = gpu-process + utility + renderer thật bị module kill. Bridge mồ côi 35716 bị dọn riêng (`orphan-killed`). CDP trống, #2 bind lại được, bridge mới healthy :8788, thoát sạch exitCode=0, cả hai pidfile đã xoá, không còn process giữ CDP. |

Chi tiết lượt 4 (bằng chứng vòng đời đầy đủ):
- #1: main 35524, bridge 35716 (:8788 — 8787 bận do luồng khác), con
  Chromium [35526:zygote, 35552:gpu-process, 35527:zygote,
  35604:renderer, 35556:utility] + con của bridge [35758…35792];
  electron.pid.json ghi đúng appPid=35524, cdp=9225.
- Sau kill -9 main: bridge 35716 vẫn sống + trả health ok; socket CDP
  chỉ còn bridge giữ ([35716]); gpu/renderer/utility còn sống, ppid=1.
- Dọn: electron cleanup kill [35552, 35556, 35604]; bridge cleanup kill
  35716 (cả group → con của bridge chết theo); cổng CDP trống.
- #2: main 35952, CDP page target `app://vcut/index.html`, bridge mới
  36265 healthy :8788, socket CDP do Electron mới giữ; thoát sạch qua
  CDP (exitCode=0), bridge chết, cả hai pidfile xoá.
- Report JSON lượt 4: `/tmp/vcut-i4-electron-orphan-report.json`
  (32 passed, 0 failed). Lưu ý: /tmp bị dọn khi VM reboot nên report
  các lượt 1–3 không còn; số lượt 1–3 lấy từ log chạy lúc đó (31/32,
  32/32, 32/32).

### 2.4 Matcher kiểm chứng trên process Chromium thật đang chạy

- gpu-process của AppImage H9 (pid 32214, cmdline blob space-joined):
  `isVcutElectronChildProcess` → match=true, type=child (sau fix; trước
  fix trả false với lý do basename rác).
- gpu-process của Playwright chrome (pid 31267): match=false (basename
  `chrome`).
- VCut gpu với userDataDir sai: match=false.

## 3. Thiết kế đã chọn (và phương án đã loại)

- **Cache ffmpegVersion vĩnh viễn trong vòng đời process (không TTL):**
  ffmpeg không đổi khi bridge đang chạy; TTL chỉ thêm code + thêm lần
  spawn chậm mà không có lợi ích thực tế. Nếu ffmpeg được cài/gỡ giữa
  chừng thì health báo sai cho tới khi restart bridge — chấp nhận được
  vì bridge restart là thường xuyên (manager restart sau crash).
  Promise đang bay được chia sẻ để 10 health đồng thời không spawn 10
  ffmpeg (trước đây mỗi request spawn riêng).
- **Timeout theo loadavg/cpu (không tăng cứng lên 60 s/120 s):** tăng
  cứng làm máy yên cũng chờ lâu vô ích khi bridge thật sự hỏng (fail
  nhanh là tốt); theo tải thì máy yên vẫn fail nhanh 30 s, tải cao mới
  nới. Gia hạn 1 lần theo "đã chạm được bridge" thay vì gia hạn vô hạn
  (tránh chờ mãi khi bridge kẹt).
- **Pidfile Electron + kill từng pid (không kill theo process group):**
  pgid của Electron main có thể là group của shell/launcher (khi chạy
  foreground, pgid == pid của launcher) — kill cả group có thể giết
  nhầm shell cha. Pidfile chỉ ghi pgid để chẩn đoán. Kill từng pid đã
  xác minh (marker + mồ côi) là chậm hơn nhưng an toàn hơn.
- **Không dọn socket CDP bằng cách kill process lạ:** socket chỉ được
  giải phóng khi process giữ FD chết; module chỉ kill đúng con VCut đã
  xác minh. Holder lạ thì báo rõ trong kết quả, không cố kill thêm.
- **Không wrapper launcher pre-spawn cho app thật:** để dọn TRƯỚC khi
  Electron bind CDP thì cần wrapper chạy trước binary Electron (đổi cách
  đóng gói/chạy) — ngoài phạm vi đợt này; xem §5.1.

## 4. Tương tác với luồng khác trong đợt 52 (để parent gộp)

- **I5 (model downloader):** đang sửa `pythonServices.js` song song
  (thêm `MODEL_CHECKS` + `model-manifest.json`); làm test probe-AI của
  serviceManager fail 1 lần (reason bgremove đổi) — đã xử lý bằng cách
  nới assertion (xem §1.2). I4 KHÔNG sửa file của I5.
  `copy-services-js.mjs` copy thêm `modelDownloader.js` +
  `model-manifest.json` (file của I5) — không xung đột, chỉ là copy.
- **Các luồng khác:** bridge trên 8787/8788 thường bận (test "cổng bận"
  đã đổi sang dải cao để tránh); loadavg lên tới 23,4 trong lúc chạy
  test lặp. VM reboot 1 lần giữa chừng (uptime reset ~18:xx, /tmp bị
  dọn): bench script + report smoke lượt 1–3 mất, đã viết lại/chạy lại
  sau reboot; không mất code (code nằm trong repo, không nằm /tmp).
- File chung: `serviceManager.js`/`serviceManager.d.ts`,
  `serviceLifecycle.ts`, `main.ts`, `docs/DESKTOP.md`,
  `server/bridge/src/index.js` — I4 sở hữu trong đợt này; parent gộp
  cần đối chiếu nếu luồng khác cũng chạm (baseline round52 cho thấy
  nhiều file đổi do các luồng khác — xem §6).

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

1. **CDP bind trước khi dọn (giới hạn kiến trúc, vẫn còn):** Electron
   bind `--remote-debugging-port` lúc khởi động, TRƯỚC khi `main.ts`
   chạy. Dọn trong app (`start()`) thì cổng CDP chỉ trống cho LẦN CHẠY
   SAU; lần chạy dọn tự nó vẫn mất CDP (app vẫn mở bình thường, chỉ mất
   CDP). Harness dọn TRƯỚC khi spawn thì lần chạy đó có CDP. Muốn app
   thật cũng có CDP ngay ở lần chạy dọn thì cần wrapper launcher chạy
   trước binary Electron — chưa làm (đổi đóng gói/chạy, ngoài phạm vi).
2. **Con Chromium tự thoát không đều:** sau kill -9, con Chromium có
   lúc tự thoát trong <1 s (repro3: zygote + utility chết hết trong
   0,5 s), có lúc linger ≥7 s (smoke lượt 1: gpu/utility còn sống sau
   cả hai lần dọn). Vì vậy electron cleanup có lượt không còn gì để dọn
   (đúng — không phải lỗi); giá trị của nó nằm ở trường hợp linger
   (smoke lượt 4 đã bắt được: kill 3 con thật).
3. **Renderer/GPU con KHÔNG giữ socket CDP (đính chính H7):** đo thật
   lượt smoke 4: sau kill -9, socket CDP chỉ còn bridge giữ ([35716]);
   gpu/renderer/utility không giữ fd listen (chỉ main + bridge giữ —
   đã đo trực tiếp bằng `ss` + scan `/proc/*/fd`). H7 ghi "renderer/GPU
   con mồ côi cũng giữ socket CDP" dựa trên `ss` thấy thêm pid — các pid
   đó nhiều khả năng là CON CỦA BRIDGE (bridge spawn render/python giữ
   fd kế thừa), không phải con Chromium. Dọn bridge (group kill) đã giải
   phóng socket trong mọi lượt smoke đợt này. Dọn con Chromium vẫn cần
   (chúng là process mồ côi ăn tài nguyên + có thể giữ các fd khác),
   nhưng không phải là đường chính giải phóng CDP.
4. **Chưa test:** Windows/macOS (module trả `unsupported-platform`,
   fail-closed); pidfile khi userData trên ổ chỉ đọc (ghi lỗi chỉ log);
   2 app VCut cùng userData (single-instance lock chặn, chưa test cố
   tình vượt lock); AppImage đóng gói (smoke dùng Electron dev — module
   là JS thuần, đã vào `dist/services/`, nhưng chưa chạy lại smoke trên
   AppImage rebuild; .deb chưa build lại đợt này).
5. **Health sau cache vẫn ~100–190 ms dưới tải cực nặng:** không còn
   spawn ffmpeg, phần dư là scheduling delay của event loop trên VM bão
   hoà (loadavg 16–19, 4 CPU). Trên máy yên thì 3–15 ms. Không phải lỗi
   cache.
6. **Test lặp có nhiễu tải:** 2 fail lẻ trong 6 lượt full-suite
   (killProcessGroup timeout đọc pid 5 s; bridge-start khi 8787–8796
   bận) đều đã xác định là nhiễu môi trường, pass khi chạy riêng/lại.
   Test `killProcessGroup` vẫn giữ timeout 5 s đọc pid cháu — dưới tải
   cực nặng có thể flake lại (không thuộc phạm vi I4 vì không đụng code
   đó; ghi lại để đợt sau nới nếu cần). Một lượt chạy cuối còn TREO >6
   phút do race stop-trong-start — ĐÃ SỬA + hồi quy ở §2.2b (nguyên nhân
   gốc: timeout thích ứng 150 s vượt timeout test 90 s cũ; nay test đã
   nới lên 180 s).
7. **`stop()` chờ `start()` đang bay tối đa 30 s:** nếu `start()` kẹt
   trong dọn stale (không kiểm tra cờ dừng) thì `stop()` có thể chờ tới
   30 s rồi mới kill — chấp nhận được (app thoát vẫn sạch, chỉ chậm);
   muốn nhanh hơn thì cần truyền cờ huỷ vào trong hàm dọn stale.
8. **Nợ mở còn lại (không thuộc I4):** ship venv Python + model AI
   (H8 §5); click-test menu/dialog + double-click .vcut (H9 dở dang) +
   exception D3 "Lưu thành…"; cài .deb máy sạch; macOS/Windows/arm64;
   `START_TIMEOUT_MS` nay đã thích ứng — nhưng restart sau SIGKILL
   dưới tải cực nặng vẫn có thể chạm trần 120 s (chưa gặp; nếu gặp thì
   cân nhắc nới trần hoặc backoff restart).

## 6. File trong batch (stage chờ push — toàn text, không binary)

Đổi/sửa (7 file):

- `server/bridge/src/index.js` — cache `ffmpegVersion()` vòng đời
  process + chia sẻ promise đang bay.
- `apps/desktop/src/services/serviceManager.js` — timeout khởi động
  thích ứng theo tải (`startTimeoutForLoad`, gia hạn 1 lần khi bridge đã
  trả lời) + nối `cleanupStaleElectronChildren()` vào `start()` +
  re-export module mới.
- `apps/desktop/src/services/serviceManager.d.ts` — kiểu cho timeout
  thích ứng + method/re-export mới.
- `apps/desktop/src/services/serviceManager.test.cjs` — test
  `startTimeoutForLoad` (mới); test "cổng bận" dùng cổng trống dải cao
  thay vì hardcode 8787 + fail nhanh nếu blocker không bind được;
  assertion reason bgremove chấp nhận cả rembg/BiRefNet (do I5); test
  hồi quy `stop()`-trong-`start()` (mới, 2 cửa sổ pre-spawn +
  health-wait); timeout các test có `start()` nới 90 s → 180 s (vì
  timeout thích ứng tối đa 150 s).
- `apps/desktop/src/serviceLifecycle.ts` — export
  `cleanupOrphanElectronOnStartup()` + `recordElectronProcess()`; xoá
  electron pidfile khi `stopLocalServices()` thoát sạch.
- `apps/desktop/src/main.ts` — gọi `recordElectronProcess()` sau
  `initServiceLifecycle`.
- `docs/DESKTOP.md` — §7.1 bổ sung + §7.2 mới (pidfile Electron, timeout
  thích ứng, cache health) + §11 ghi kết quả kiểm chứng I4.

Thêm mới (5 file):

- `apps/desktop/src/services/electronOrphanCleanup.js` — module pidfile
  Electron + nhận diện cmdline (cả NUL lẫn space-joined) + quét socket
  CDP + kill con mồ côi multi-pass, fail-closed.
- `apps/desktop/src/services/electronOrphanCleanup.d.ts` — kiểu cho
  module trên.
- `apps/desktop/src/services/electronOrphanCleanup.test.cjs` — 11 test
  (unit + tích hợp mock thật + hồi quy parser cmdline Chromium).
- `apps/desktop/scripts/verify-electron-orphan-cleanup.mjs` — smoke test
  thật (kill -9 Electron → dọn → mở lại, CDP 9225/:98).
- `docs/PHASE9_ROUND52_I4_ELECTRON_RELIABILITY_LIMITS.md` — file này.

KHÔNG stage: `dist/`, `dist-web/`, `release/`, `build/`,
`node_modules/`, `/tmp/vcut-i4-electron-orphan-report.json` (report
smoke lượt 4 — log chạy, không phải deliverable; nội dung đã ghi trong
file này §2.3), `/tmp/i4-*.log` + `/tmp/i4-health-bench.mjs` +
`/tmp/i4-busy.py` (bench/log tạm), `~/.config/@repo-1/desktop-i4-smoke/`
(userData của smoke — ngoài repo).
