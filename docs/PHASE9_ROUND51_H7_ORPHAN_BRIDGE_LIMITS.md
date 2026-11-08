# Phase 9 đợt 51 — H7: PIDFILE + DỌN BRIDGE MỒ CÔI LÚC KHỞI ĐỘNG — LIMITS

Ngày: 06/11/2026. Luồng H7 của đợt 51 (Phase 10 Electron). Đóng nợ mở
Phase 10 trong `docs/PHASE10_LIMITS.md` §5.2: app bị kill -9/crash để lại
bridge mồ côi giữ cổng + kế thừa socket CDP 9222, làm lần chạy sau fail
bind. KHÔNG push, KHÔNG release/tag, KHÔNG binary vào batch (chỉ text).

## 1. Làm được gì (đã kiểm chứng)

### 1.1 Pidfile bridge (`apps/desktop/src/services/bridgePidfile.js`, mới)

- Manager ghi `bridge.pid.json` trong userData (`app.getPath("userData")`)
  mỗi lần bridge được spawn — **ghi NGAY lúc spawn, trước khi chờ
  healthy** (xem §3.2 vì sao), ghi lại lần nữa khi healthy (cập nhật
  `startedAt`), ghi nguyên tử (tmp + rename). Nội dung: `{version: 1,
  pid, port, appPid, bridgeEntry, startedAt}`. `stop()` sạch xoá pidfile;
  `start()` thất bại hẳn cũng xoá; bridge chết hết restart cũng xoá.
- `cleanupStaleBridge(userDataDir, {cdpPort, log})` chạy ở đầu `start()`,
  TRƯỚC khi spawn bridge mới:
  - Không có pidfile → không làm gì (`none`).
  - Pidfile hỏng → xoá file, không kill gì (`invalid-removed`).
  - Pid đã chết → xoá pidfile (`stale-pid-dead`).
  - Pid còn sống nhưng cmdline KHÔNG phải bridge VCut → **KHÔNG kill**
    (fail-closed), chỉ xoá pidfile sai + log cảnh báo
    (`alive-not-vcut`); manager sẽ tự dò cổng trống khác.
  - Pid còn sống và cmdline đúng là bridge VCut → kill cả cây
    (SIGTERM → chờ tối đa 5s → SIGKILL → chờ 2s), chờ cổng bridge +
    cổng CDP trống (tối đa ~2s mỗi cổng), xoá pidfile
    (`orphan-killed`, kèm `healthOk`, `bridgePortFreed`,
    `cdpPortFreed`).
  - Kill thất bại → giữ pidfile để lần sau thử lại (`kill-failed`).
- Nhận diện "đúng bridge VCut": POSIX đọc `/proc/<pid>/cmdline`, phải
  chứa `server/bridge/src/index.js`. Health check `/api/health` trên cổng
  ghi trong pidfile chỉ là bằng chứng phụ (ghi vào kết quả): cmdline khớp
  thì kill kể cả khi health fail; cmdline không khớp thì KHÔNG kill kể
  cả khi health trả ok.
- Kill theo group CHỈ khi pid là group leader (pgrp == pid, đọc từ
  `/proc/<pid>/stat`, fallback `ps`): bridge do manager spawn luôn
  detached nên pgrp == pid. Nếu pgrp != pid (bridge do tay/harness spawn,
  chung group với cha) thì chỉ kill đúng pid — kill cả group có thể giết
  nhầm process cha. Windows: đọc cmdline qua PowerShell Get-CimInstance;
  không đọc được cmdline thì KHÔNG kill (fail-closed). Nhánh Windows là
  best-effort, **chưa test trên máy Windows thật** (Phase 10 chỉ Linux).

### 1.2 Nối vào lifecycle (serviceManager.js + serviceLifecycle.ts)

- `ServiceManager.start()` gọi `cleanupStaleBridge()` sau khi mở log,
  trước khi kiểm tra bridge entry — nên cả app đóng gói thiếu bridge cũng
  dọn pidfile cũ (không hại gì).
- `ServiceManager` có method public `cleanupStaleBridge()` + option
  `cdpPort` (mặc định 9222); `serviceLifecycle.ts` tự lấy cổng CDP từ
  argv `--remote-debugging-port=<n>` của Electron (hàm `cdpPortFromArgv`)
  và truyền vào manager.
- `serviceLifecycle.ts` export `cleanupOrphanBridgeOnStartup(userDataDir,
  opts?)` — **điểm nối cho H8 (loader mới)**: gọi TRƯỚC khi spawn
  Electron / trước `initServiceLifecycle` nếu loader cần dọn sớm, vì
  Electron bind CDP lúc khởi động, trước khi `main.ts` chạy (xem §5.1).
  Trong app thường thì KHÔNG cần gọi thêm (start() đã dọn).
- `copy-services-js.mjs` KHÔNG cần sửa (copy mọi `*.js` trong
  `src/services/`, đã copy `bridgePidfile.js` → `dist/services/`).
- `verify-desktop.mjs` (harness G6): gọi dọn mồ côi TRƯỚC mỗi lần spawn
  Electron (`launchElectron`, userData dev `~/.config/@repo-1/desktop`,
  AppImage `~/.config/VCut Studio`, đúng cổng CDP của lần launch đó) —
  vì harness từng fail CDP do mồ côi giữ socket. `main.ts` KHÔNG đổi
  (start() đã dọn; tránh sửa file G1).

### 1.3 Hai bug thật phát hiện + sửa trong lúc smoke test (cùng file lifecycle)

**(a) Vòng poll health race với tick 250ms (code G2) — bridge khỏe mà
manager không bao giờ thấy.** `_spawnBridgeOnPort` cũ race mỗi
`healthCheck` với tick 250ms: response chậm hơn 250ms bị vứt, vòng lặp
mở healthCheck mới mỗi tick. Mà `/api/health` spawn `ffmpeg -version`
mỗi request (`server/bridge/src/index.js:641-642` + `ffmpegVersion()`),
nên dưới tải nặng mỗi request chậm. Số đo thật trên VM này (06/11,
loadavg 1,08/6,61/5,61):
- `/api/health` tuần tự: 168, 224, 270, 168, 300, 295 ms (3/6 lần
  > 250ms — tức >250ms là trạng thái thường xuyên, không phải ngoại lệ).
- `ffmpeg -version` spawn riêng: 1895, 981, 604 ms.
- 10 health đồng thời: 2395 ms tổng (vòng poll cũ tự dồn tải lên bridge).
Hậu quả gặp thật 2 lần trong smoke test H7 (lượt 1): bridge in log
"đang chạy tại 8787/8788" nhưng manager chờ đủ 30s rồi báo "bridge
không healthy", app mở nhưng không có bridge. **Sửa:** poll tuần tự —
await từng `healthCheck` (timeout riêng 2s) rồi mới ngủ 250ms; kiểm tra
bridge thoát qua flag `exitedInfo` thay vì race. Sau sửa, fake bridge
trả health chậm 600ms start được trong 3,2s (code cũ fail sau 30s);
manager test thật 4/4 + G2 hồi quy xem §2.

**(b) Pidfile chỉ ghi sau khi healthy — bridge mồ côi "vô hình".**
Trước sửa, `_writeBridgePidfile()` chỉ chạy sau khi spawn thành công +
healthy. App bị kill -9 giữa lúc chờ health (đúng 30s như (a)) để lại
bridge mồ côi KHÔNG có pidfile → lần chạy sau không dọn được. **Sửa:**
ghi pidfile ngay lúc spawn trong `_spawnBridgeOnPort` (trước khi chờ
health); spawn thử lỗi cổng thì lần thử sau ghi đè; `start()` thất bại
hẳn thì catch xoá pidfile. Hệ quả nhỏ đã xử lý: `bridgePort` giờ được
set ngay lúc spawn nên `start()`/`_restartBridge()` thất bại phải reset
`bridgePort = null` (không để snapshot hiện URL cổng đã chết).

## 2. Kiểm chứng (chạy thật trên VM này)

### 2.1 Unit + tích hợp — `bridgePidfile.test.cjs`: 14/14 pass, 0 fail

Chạy: `node --test apps/desktop/src/services/bridgePidfile.test.cjs`
(49s). Mock process là tiến trình node THẬT (`node -e sleep` với argv
chứa đúng bridge entry → `/proc/<pid>/cmdline` khớp như bridge thật).

| # | Test | Kết quả |
|---|---|---|
| 1 | pidfile ghi/đọc/xoá round-trip | pass |
| 2 | không có pidfile → action none | pass |
| 3 | pidfile hỏng → xoá, không kill gì | pass |
| 4 | pid đã chết → stale-pid-dead | pass |
| 5 | `isVcutBridgeProcess`: mock khớp, process lạ không khớp | pass |
| 6 | **AN TOÀN: pid sống không phải bridge VCut → KHÔNG kill, chỉ xoá pidfile** (process lạ vẫn sống sau cleanup) | pass |
| 7 | mock bridge detached (group leader) → orphan-killed, pid chết | pass |
| 8 | mock bridge non-leader (chung group với cha) → chỉ kill đúng pid, test runner vẫn sống | pass |
| 9 | manager: start ghi pidfile đúng pid/cổng, stop xoá pidfile | pass |
| 10 | manager: start dọn pidfile stale (pid chết) rồi chạy bridge mới | pass |
| 11 | manager: start kill bridge mồ côi mock rồi spawn bridge mới | pass |
| 12 | manager: start KHÔNG kill process lạ trong pidfile | pass |
| 13 | **hồi quy (a): bridge trả health chậm 600ms vẫn start được** (3,2s; code cũ fail sau 30s) | pass |
| 14 | **hồi quy (b): pidfile có NGAY khi spawn, trước khi healthy** (fake bridge không bao giờ healthy; kill fake → start() reject "thoát sớm" ngay, pidfile được catch xoá) | pass |

### 2.2 Hồi quy G2 — `serviceManager.test.cjs`

- Chạy 1 (trước sửa poll): **8/8 pass**.
- Chạy 2 (sau sửa poll, lúc tải đỉnh loadavg ~6,6): 2 fail — test restart
  "bridge không healthy sau 30s trên cổng 8788" + 1 fail ở test probe AI
  (dòng 129). Cả hai đều là nhiễu tải (xem §5.4), không tái hiện ở chạy 3.
- Chạy 3 (sau sửa poll): **7/8 pass**. Fail duy nhất: test "cổng 8787
  bận" — chính blocker của test không bind được 8787 (`EADDRINUSE` ngay
  lúc setup, trước khi chạy code manager) vì bridge của luồng khác đang
  giữ 8787 (đã xác minh bằng `ss`: pid 30298, `node .../server/bridge/
  src/index.js`, chạy 4m38s). Đây là nhiễu môi trường song song, không
  phải lỗi code. Test restart đã pass lại trong chạy 3 (9,6s).
- Chạy: `node --test apps/desktop/src/services/serviceManager.test.cjs`.

### 2.3 Typecheck

- `tsc -p apps/desktop/tsconfig.json --noEmit`: **0 lỗi** (chạy lại
  cuối đợt, sau mọi sửa). `node --check` OK cho `bridgePidfile.js`,
  `serviceManager.js`, `verify-desktop.mjs`,
  `verify-orphan-cleanup.mjs`.

### 2.4 Smoke test thật — Electron kill -9 → mở lại
`apps/desktop/scripts/verify-orphan-cleanup.mjs` (mới). 3 lần chạy
Electron thật (production, `app://vcut`) dưới Xvfb, CDP 9224, display
:97 riêng (tránh 9222/9223 + :99 của harness G6). Chỉ kill đúng Electron
do script spawn + bridge trong pidfile của userData này.

- **Lượt 1 (trước sửa §1.3): 11 pass / 12 fail** — phát hiện (a)+(b):
  Electron #1 mở UI nhưng bridge không healthy sau 30s, không có
  pidfile; bridge mồ côi 26136 giữ 8787 + socket CDP 9224 (đã xác minh
  `ss` + `/proc/26136/cmdline` = bridge thật, health ok, uptime 203s).
  Đã dọn tay 26136 sau lượt này.
- **Lượt 2 (sau sửa §1.3): 20 pass / 7 fail** — cơ chế lõi chạy thật:
  pidfile ghi đúng (bridge 2469 :8787), kill -9 để lại mồ côi giữ CDP,
  lần chạy #2 **dọn chết bridge cũ, bridge mới healthy lại đúng cổng
  8787**. 7 fail còn lại đều là giới hạn CDP bind-trước-khi-dọn (§5.1)
  + kỳ vọng thoát sạch sau killTree (xem §5.2).
- **Lượt 3: 27 pass / 10 fail** — dưới tải đỉnh loadavg 40,00: manager
  của #2 khởi động muộn >70s nên check của script chạy trước khi manager
  kịp start (fail giả). Bằng chứng trong
  `service-manager.log`: #2 dọn chết 5754 trong ~300ms (12:17:09) và
  bridge mới 6396 healthy 12:17:20 — code đúng, script chờ chưa đủ.
  Đã sửa script (gate chờ pidfile đổi 180s, gate chờ CDP trống trước #3).
- **Lượt 4 (script đã sửa): 24 pass / 12 fail — pha #3 XANH TOÀN BỘ,
  đây là bằng chứng vòng đời đầy đủ:**
  - CDP page target (bind lại cổng CDP OK): `app://vcut/index.html` ✓
  - Bridge mồ côi trước đó ĐÃ CHẾT (8735, do manager của #3 dọn) ✓
  - Pidfile mới trỏ bridge mới (8943 :8788) ✓, bridge mới healthy ✓
  - Socket CDP do Electron mới giữ (pids gồm 8814, không còn 8735) ✓
  - Thoát sạch: electron #3 thoát, **exitCode=0** ✓, bridge mới đã
    chết ✓, pidfile đã xoá ✓, không còn electron giữ CDP ✓
  - 12 fail của lượt 4 đều đã phân tích, KHÔNG phải lỗi sản phẩm:
    `vite build apps/web` fail (lỗi tsc của luồng H1/H2 — xem §5.4);
    pha #1 fail toàn bộ vì Electron #1 đói CPU dưới tải nặng, không
    khởi động kịp trong 60s+30s (không tạo được mồ côi để test — kịch
    bản kill -9 đã chứng minh ở lượt 2/3); 2 check "vacuous pass" ở
    pha #2 (pidfile trỏ bridge mới / bridge cũ đã chết — pass trên
    `pid=undefined` vì #1 không tạo bridge; xem §5.3); check "bridge
    mồ côi còn sót" fail vì killTree của #2 đã giết bridge 8735 qua
    đường SIGTERM → before-quit (xem §5.2).
- Report JSON lượt 4: `/tmp/vcut-h7-orphan-report.json` (24 passed,
  12 failed). Log: `/tmp/vcut-h7-smoke4.log`.

### 2.5 AppImage rebuild + smoke (12:41 06/11)

- Build lại AppImage-only (bỏ qua .deb/fpm; dùng dist-web hiện có vì
  tsc web đang bị H1/H2 làm vỡ — xem §5.4): **147.915.646 byte**,
  sha256 `5210a7d34b8e87bded5e877bdc22bff1bc88b38c64e800af07a0cfb3d894d074`
  (bản Phase 10 cũ: 128.102.744 byte, sha `6e6fd2fb…` — to hơn vì H8
  bundle thêm server 60,4 MiB; xem §4).
- Asar đã kiểm chứng chứa code H7 (`bridgePidfile.js` cả 2 đường
  `dist/services/` và fallback `src/services/`) + thư mục
  `resources/vcut-server` của H8.
- Smoke AppImage (`VCUT_DESKTOP_SMOKE=1`, Xvfb, `APPIMAGE_EXTRACT_AND_RUN=1`,
  `TMPDIR` ra đĩa): **`VCUT_SMOKE_RESULT ok:true`** —
  `bridgeFromRenderer:"ok"`, `bridgeUrl:"http://127.0.0.1:8787"`,
  `textLen:2709`, `rootChildren:1`, `secureContext:true`,
  `hasPreloadApi:true`, `hasNativeFileApi:true`. Lưu ý: có 1 dòng
  `VCUT_SMOKE_RESULT {"error":"timeout","ok":false}` in TRƯỚC dòng
  ok:true — guard 30s của smoke mode nổ trong lúc probe đang chờ dưới
  tải nặng, probe in kết quả thật ngay sau đó (race của harness smoke,
  không phải lỗi app; xem §5.4).
- Pidfile trong app đóng gói: ghi lúc spawn 12:43:43.811 + lúc healthy
  12:43:56.386 (bridge pid 12029 :8787, chạy bằng binary Electron dạng
  node — loader H8), xoá khi thoát sạch 12:44:14–15 (`dừng bridge ...
  SIGTERM cả process group` → `stopped`). Kiểm chứng qua
  `~/.config/@repo-1/desktop/logs/service-manager.log`.
- **Phát hiện phụ (đính chính tài liệu cũ):** AppImage dùng userData
  `~/.config/@repo-1/desktop` — giống hệt chạy dev — vì tên app lấy từ
  `name` trong `package.json` (`@repo-1/desktop`), KHÔNG phải
  productName "VCut Studio". `docs/DESKTOP.md` §7 từng ghi bản đóng gói
  dùng `~/.config/VCut Studio/` là **sai** — đã sửa trong đợt này.

## 3. Thiết kế đã chọn (và phương án đã loại)

- **Pidfile lúc khởi động, không phải daemon/watchdog:** kill -9 thì
  không handler nào chạy được — dọn dẹp PHẢI xảy ra ở lần chạy sau.
  Không dùng lock file + flock (pidfile JSON đủ vì single-instance lock
  đã chặn 2 app cùng userData).
- **Kill mồ côi thay vì nhận lại (adopt) bridge khỏe:** theo đúng yêu
  cầu luồng; bridge khỏe từ lần chạy crash bị kill và spawn mới — job
  dở trong `bridge-jobs` còn trên đĩa, bridge mới đọc lại được (hành vi
  này không thuộc phạm vi test đợt này).
- **Không dọn socket CDP bằng cách kill process lạ:** socket chỉ được
  giải phóng khi process đang giữ FD chết; module chỉ kill đúng bridge
  VCut đã xác minh. Nếu process khác (vd: renderer mồ côi của Electron
  cũ — gặp thật: `ss` sau kill -9 thấy thêm pid 2482/2481/6196 giữ socket
  cùng bridge) cũng giữ socket thì cổng vẫn bận — ngoài phạm vi pidfile,
  ghi trong §5.1.

## 4. Tương tác với luồng khác trong đợt 51 (để parent gộp)

- **H8 (loader + packaging) KHÔNG chạm file của H7.** H8 làm file riêng:
  `apps/desktop/src/services/bundledRuntime.ts` (+ test),
  `apps/desktop/scripts/copy-bundled-server.mjs`, sửa `prepackage.mjs`
  (thêm bước copy server 1024 file / 60,4 MiB → `build/bundled-server`)
  và config packaging. H8 đang build `.deb` song song (process
  electron-builder riêng, tmp `~/workspace/tmp-h8-electron/`, cùng ghi
  `release/` với build AppImage của H7 — 2 build chạy đồng thời, cần
  parent lưu ý khi gộp/verify gói).
- AppImage H7 build chứa cả code H8 đang làm dở (bundled server) — số
  đo AppImage ở §2.5 là của cây chung lúc build (12:41), không phải
  riêng code H7. Điểm nối H7 để lại cho H8:
  `cleanupOrphanBridgeOnStartup(userDataDir)` trong
  `serviceLifecycle.ts` (gọi trước khi spawn Electron nếu loader cần
  dọn sớm hơn `start()`).
- **H1/H2 đang làm dở `apps/web`:** `ttsEstimate51H1.test.ts` /
  `ttsEstimate51H2.test.ts` import module `./ttsEstimate51H1` /
  `./ttsEstimate51H2` chưa tồn tại → `tsc -p apps/web` lỗi (hàng chục
  lỗi TS6133/TS2307/TS7006), `npm run build --workspace=@repo-1/web`
  fail cả 2 lần thử trong smoke test. H7 KHÔNG sửa file của họ. Vì vậy
  AppImage đợt này build bằng dist-web hiện có (không rebuild web mới).
- H9 cũng đang chạy smoke AppImage song song (thư mục
  `~/workspace/.tmp-h9/`, bridge riêng trên 8788 lúc kiểm tra).

## 5. Giới hạn — chưa làm được / chưa test (trung thực)

1. **Kill -9 / crash: không handler nào chạy được lúc chết.** Pidfile
   lúc khởi động mới là lưới an toàn. Bridge mồ côi vẫn tồn tại cho tới
   lần chạy app sau (và chỉ được dọn khi lần chạy sau đó `start()`
   services). Nếu user không bao giờ mở lại app, mồ côi ở đó mãi.
2. **CDP bind trước khi dọn (giới hạn kiến trúc, đã biết):** Electron
   bind `--remote-debugging-port` lúc khởi động, TRƯỚC khi `main.ts`
   chạy. Lần chạy dọn mồ côi thì chính nó mất CDP (app vẫn mở bình
   thường, chỉ mất CDP); cổng chỉ trống cho LẦN CHẠY SAU. Đã chứng
   minh: lượt smoke 2/3 — #2 mất CDP, #3 (sau khi cổng trống) bind
   được; log run3: `bind() failed: Address already in use (98)` +
   `Cannot start http server for devtools` ở lần chạy dọn. Harness
   `verify-desktop.mjs` đã được nối dọn TRƯỚC khi spawn nên không gặp
   vấn đề này. Với user thường (không dùng CDP) thì giới hạn này vô hại.
3. **Renderer/GPU con mồ côi cũng giữ socket CDP:** sau kill -9, `ss`
   thấy ngoài bridge còn 1–2 pid khác giữ socket (vd: lượt 2
   pids=[2482,2481,2469], lượt 3 pids=[6196,5754]) — nhiều khả năng là
   con của Electron cũ kế thừa FD. Pidfile chỉ dọn bridge; các process
   này tự thoát khi IPC với main đứt (chậm dưới tải nặng). Nếu chúng
   còn giữ socket thì lần chạy sau vẫn có thể fail bind CDP dù bridge
   đã dọn — chưa có cơ chế dọn chúng (không dám kill bừa process
   Electron lạ). Nợ mở: xác định chính xác 6196 là gì (chưa kịp — nó đã
   thoát trước khi kiểm tra `/proc`), cân nhắc dọn theo PPID/group của
   Electron cũ.
4. **Vòng poll health vẫn có thể fail dưới tải cực nặng:** sau sửa,
   mỗi healthCheck được tối đa 2s; đo được `ffmpeg -version` spawn tới
   1895ms dưới tải. Nếu MỌI request health đều >2s trong 30s (loadavg
   >6 kéo dài) thì `start()` vẫn fail "không healthy" dù bridge đang
   chạy — gặp 1 lần ở hồi quy G2 chạy 2 (sau đó pass lại ở chạy 3).
   Nợ mở: cache `ffmpegVersion()` trong bridge (hiện spawn lại mỗi
   request health) hoặc tăng `HEALTH_TIMEOUT_MS` — thuộc về bridge,
   không sửa trong đợt này.
5. **Số đo smoke test nhiễu bởi tải song song:** các lượt smoke chạy
   giữa lúc 8–10 luồng đợt 51 cùng build/test (loadavg lên tới
   40,00/19,74/9,20). Hệ quả đã gặp: Electron khởi động >60–70s;
   `vite build apps/web` fail do file H1/H2 dở (xem §4); smoke mode in
   dòng `{"error":"timeout","ok":false}` trước dòng `ok:true` (guard
   30s nổ trong lúc probe chờ); 2 check "vacuous pass" ở lượt smoke 4
   pha #2 (pass trên `pid=undefined` vì pha #1 không tạo được bridge —
   không được tính là bằng chứng dọn mồ côi; bằng chứng thật là pha #3
   và lượt 2/3).
6. **SIGTERM và thoát app — hành vi chưa chốt hẳn:** tài liệu Phase 10
   ghi "SIGTERM không làm Electron thoát". Trong smoke 4, `killTree`
   (SIGTERM group → chờ 8s → SIGKILL) làm bridge 8735 chết TRƯỚC khi
   SIGKILL tới — nhiều khả năng SIGTERM đã kích hoạt đường shutdown của
   Chromium → `before-quit` → `stopLocalServices()` giết bridge, nhưng
   process chính vẫn treo tới lúc SIGKILL (exitCode=null). Tức là
   SIGTERM có thể dọn bridge nhưng không thoát được app — cần kiểm
   chứng riêng (không thuộc phạm vi H7; `killTree` trong script này
   KHÔNG tương đương kill -9, đã ghi chú trong code).
7. **Chưa test:** Windows (nhánh PowerShell chưa chạy thật); macOS;
   pidfile khi userData trên ổ chỉ đọc (ghi lỗi chỉ log, không chặn
   app — hành vi này chưa test thật); 2 app VCut cùng userData (bị
   single-instance lock chặn, chưa test cố tình vượt lock); bridge
   mồ côi giữ cổng nhưng cmdline đã bị sửa (không xảy ra thực tế).
8. **Nợ mở từ Phase 10 vẫn còn (không thuộc H7):** app đóng gói giờ
   đã chạy được bridge bundle (nhờ H8) nhưng Python AI/venv trong gói
   chưa rõ (bridge probe AI trong AppImage chưa kiểm chứng); cài .deb
   trên máy sạch; click-test menu/dialog; double-click .vcut thật.

## 6. File trong batch (stage chờ push — toàn text, không binary)

Đổi/sửa (6 file):

- `apps/desktop/src/services/serviceManager.js` — nối pidfile +
  cleanup vào start/stop/restart; sửa vòng poll health tuần tự; ghi
  pidfile lúc spawn; reset `bridgePort` khi start/restart fail; export
  lại helper pidfile.
- `apps/desktop/src/services/serviceManager.d.ts` — thêm `cdpPort?`,
  `cleanupStaleBridge()`.
- `apps/desktop/src/serviceLifecycle.ts` — lấy cổng CDP từ argv;
  export `cleanupOrphanBridgeOnStartup()` (điểm nối H8).
- `apps/desktop/scripts/verify-desktop.mjs` — dọn mồ côi trước mỗi lần
  launch Electron (harness G6).
- `docs/DESKTOP.md` — §4 bảng sở hữu (+3 dòng), §7 thêm
  `bridge.pid.json` + mục §7.1 pidfile/dọn mồ côi, đính chính userData
  bản đóng gói (`~/.config/@repo-1/desktop`, không phải `~/.config/VCut
  Studio/`).
- `docs/PHASE9_ROUND51_H7_ORPHAN_BRIDGE_LIMITS.md` — file này.

Thêm mới (4 file):

- `apps/desktop/src/services/bridgePidfile.js` — module pidfile +
  nhận diện cmdline + kill cây an toàn + cleanup.
- `apps/desktop/src/services/bridgePidfile.d.ts` — kiểu cho module trên.
- `apps/desktop/src/services/bridgePidfile.test.cjs` — 14 test (unit +
  tích hợp manager thật + 2 hồi quy).
- `apps/desktop/scripts/verify-orphan-cleanup.mjs` — smoke test thật
  (kill -9 Electron → mở lại 2 lần, kiểm chứng dọn mồ côi + bind lại
  CDP + thoát sạch).

KHÔNG stage: `dist/`, `dist-web/`, `release/` (AppImage/.deb/
linux-unpacked — AppImage rebuild 12:41 chỉ để smoke test),
`build/bundled-server/` (H8), `node_modules/`, `~/workspace/.tmp-h7/`
(TMPDIR build + giải nén AppImage để kiểm tra asar, đã dọn phần giải
nén), `/tmp/vcut-h7-*.log` + `/tmp/vcut-h7-orphan-report.json` (log
chạy, không phải deliverable).
