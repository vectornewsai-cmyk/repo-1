# LIMITS — Phase 9 đợt 66 luồng T9: rà soát BRIDGE_RATE_PERSIST_PATH cho mọi test spawn bridge

Nợ đợt 65 §3b / docs/PHASE9_ROUND65_LIMITS.md §8 mục 8. Chạy cron 18:35
08/11/2026. KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG
cloud/collab/AI-gen/nhạc bản quyền. Chỉ sửa code trong ~/workspace/repo-1.

## 0. Kết quả — số thật

| Hạng mục | Số |
|---|---|
| Site spawn bridge quét thấy (audit test, đếm trực tiếp) | **40 site** (lúc quét) → **41 site** sau khi T8 tạo file mới (xem §5) |
| Site CHƯA cách ly persist trước đợt này | **32 file test/script (35 site spawn — diskstorage/caption/translate mỗi file 2 site; p7-restart 1 site gọi 2 lần)** |
| File đã vá đợt này (persist riêng) | **33 file** (32 test/script + 1 production serviceManager.js — xem §1) |
| Test hồi quy mới (audit tĩnh, khóa quy tắc) | `server/bridge/test/test-bridge-persist-audit.cjs` — **76/76** lúc quét xong (35 inventory + 2 via-manager) |
| File đổi/thêm trong batch stage | **35 file** (33 vá + 1 audit test + LIMITS này) |
| E2E bridge-error (chạy song song 4 suite) | **165/165** |
| E2E rate-limit-global | **40/40** (song song) |
| E2E error-detail-structured | **170/170** (song song) |
| E2E error-detail-cli-proxy | **25/25** (song song; đã sửa 1 literal lệch — xem §4.1) |
| Unit error-protocol / rate-limit | **142/142 / 108/108** |
| GPU bridge S4 | **13/13** |
| Desktop serviceManager / bridgePidfile | **10/10 (lần 1) → 8/10 (lần 2, do tải — đã chạy lại 2 test fail: 2/2 xanh, xem §4.2) / 14/14** |
| Shell test (.sh) | cors **10/10**, luts **5/5**, proxy-q8 **5/5**, diskstorage **7/7**, hardening **16/16**, bridge-queue **12/12**, export-e2e **10/10**, export-progress **5/5**, caption **14/14**, translate **15/15**, p7-restart **14/14 (chạy lại sạch — xem §4.3b)** |
| File persist mặc định sau các suite của T9 | **không tồn tại** (kiểm tra sau từng lượt — xem §3); file xuất hiện lúc 12:09 là của bridge T8 (xem §5) |

## 1. Rà soát — toàn bộ repo (không tin handoff, quét trực tiếp)

Cơ chế rò (đợt 65 S5, `server/bridge/src/rateLimit.js` + `index.js:161`):
mọi bridge không đặt `BRIDGE_RATE_PERSIST_PATH` đều đọc/ghi chung
`~/.cache/vcut/rate-limit.json` và nạp mốc của nhau (cùng IP 127.0.0.1) —
đợt 65 làm e2e tụt 165 → 128. Quy tắc: **mỗi test/instance một file
riêng**. Đợt này quét bằng grep `spawn`/`node … src/index.js` trên
`server/`, `apps/`, `scripts/`, `cli/`, `mcp-server/`, `packages/` (trừ
node_modules/dist/build/release) + kiểm tra từng site bằng tay.

### 1.1 Đã cách ly từ trước (2 file, giữ nguyên — audit khóa lại)

- `server/bridge/test/test-bridge-error-protocol-e2e.cjs` (4 instance A–D,
  vá ở đợt 65 §3b).
- `server/bridge/test/test-rate-limit-global-e2e.cjs` (3 instance A–C, của
  S5; bridge B dùng CHUNG file với A có chủ ý để test persist qua restart
  — đó là hành vi được test, không phải rò).

### 1.2 Chưa cách ly — đã vá đợt này (32 file, 35 site)

Quy tắc đặt tên (ghi rõ để lần sau khỏi đoán):
- Work dir **riêng mỗi lần chạy** (mkdtemp/mktemp): `<workdir>/rate-limit.json`
  — đúng mẫu đợt 65 (e2e, gpu_bridge, luts-r5, proxy-q8, export-e2e,
  export-progress, caption/translate-e2e, structured, cli-proxy).
- Work dir **cố định giữa các lần chạy** (`/tmp/roundXX-…`, `~/scratch-…`):
  `<workdir>/rate-limit-${PID}.json` — khác process thì khác file (tránh
  mốc của lần chạy trước rò sang lần sau trong cửa sổ 60s, nhất là khi
  global cap mặc định chỉ 600); cùng process restart vẫn cùng file nên
  giữ đúng ngữ nghĩa restart (64r8/65s10, p7-restart.sh dùng `$$`).
- Không có work dir: file theo PID dưới `os.tmpdir()` (check-proxy-auto,
  probe-round38, verify-desktop, test_hardening.sh dùng `$$`).

Danh sách đầy đủ (31 file):

| Nhóm | File | Cách vá |
|---|---|---|
| bridge e2e .cjs (2) | `test-error-detail-structured.cjs`, `test-error-detail-cli-proxy.cjs` | `path.join(bwork, "rate-limit.json")` (bwork đã là mkdtemp) |
| bridge test .sh (6) | `test-bridge-queue.sh`, `test-cors.sh`, `test-diskstorage.sh` (2 site), `test-luts-r5.sh`, `test-p7-bridge-restart.sh` (start_bridge gọi 2 lần, cùng file `$$`), `test-proxy-q8.sh` | xem quy tắc trên |
| bridge e2e .sh (5) | `test-export-e2e.sh`, `test_hardening.sh`, `test-export-progress.sh`, `test-caption-e2e.sh` (2 site, cùng file — restart), `test-translate-e2e.sh` (2 site, cùng file — restart) | như trên |
| render test (1) | `server/render/src/test_round65_s4_gpu_bridge.js` | `path.join(work, "rate-limit.json")` (work mkdtemp) |
| headed/probe .mjs (17) | `check-proxy-auto.mjs` (mkdtemp + dọn file ở finally), `probe-round38-u3-relink-dedup-pipe.mjs` (trước đây KHÔNG có env — kế thừa env cha; nay thêm env + persist), `gop-headed-bridge-43y4.mjs`, `gop-headed-bridge-44z4.mjs`, `gopHeaded46B4.mjs`, `gopHeaded47C5.mjs`, `gopHeaded48D4.mjs`, `gopHeaded49E2.mjs`, `gopTail45A4-headed.mjs`, `probe-54k7-geo.mjs`, `clicktest-53j5-proxy-persist.mjs`, `clicktest-54k7-proxy-toolbar-stale.mjs`, `clicktest-62r10-headed-gaps.mjs`, `clicktest-62r10-proxy-redo.mjs`, `clicktest-63r1-modal-headed.mjs`, `clicktest-64r8-job-note-headed.mjs` (helper startBridge), `clicktest-65s10-job-note-locale-headed.mjs` (helper startBridge) | PID-unique trong BRIDGE_WORK_DIR/BRIDGE_WORK cố định |
| desktop (1) | `apps/desktop/scripts/verify-desktop.mjs` | PID-unique dưới os.tmpdir() |

### 1.3 Không spawn bridge — không sửa (đã kiểm tra từng file)

- Unit test bridge (`test-bridge-error-protocol.cjs`, `test-rate-limit.cjs`,
  `test-caption/translate/silence/scene/reframe/progress/jobqueue/p7-queue-persist/error-detail/error-detail-cli-caption-tts.cjs`):
  fake proc / gọi module trực tiếp, không spawn bridge.
- `test-error-detail-ui.cjs`: chỉ đọc source `index.js`, không spawn.
- `server/render/src/test_*.js` còn lại (motion/nested/parity/gpu-probe-cache/
  gpu-fallback…): spawn `render.js`/ffmpeg/python, không spawn bridge.
- `clicktest-61r5-modal-headed.mjs`, `clicktest-round39-t4-proxy-click-q3-pipe.mjs`:
  KHÔNG spawn bridge (chờ bridge ngoài ở 8787) — ngoài phạm vi "spawn".
- `apps/desktop/src/services/electronOrphanCleanup.test.cjs`: chỉ spawn
  process mock (`node -e` sleep) với argv giả — không spawn bridge thật.
- `apps/desktop/src/services/bundledRuntime.test.cjs`: không spawn gì.
- `mcp-server` / `cli` / `packages/plugin-api` test: không spawn bridge
  (CLI render đi qua `render.js`, không qua bridge).
- `apps/web/src/lib/*.test.ts` (bridgeErrors62R5, gpuProbe65S4…): chỉ parse
  source / mock fetch.
- `apps/web/scripts/test-*.sh`, `bench-preview-perf.sh`: chỉ trỏ
  video-spec, không spawn bridge.

### 1.4 Production — 1 thay đổi duy nhất (có chủ ý, xem §6)

- `apps/desktop/src/services/serviceManager.js` (`_spawnBridgeOnPort`):
  thêm `BRIDGE_RATE_PERSIST_PATH: path.join(this.userDataDir,
  'rate-limit.json')`. `BRIDGE_WORK_DIR` vốn đã suy ra từ userDataDir
  nên đây là cùng một nguyên tắc: mỗi app/test một file riêng. Test
  desktop dùng userDataDir là mkdtemp → tự động cách ly, không cần sửa
  từng test. Đồng thời sửa luôn rò tiềm ẩn ngoài test: trước đây app
  desktop và bridge dev chia sẻ `~/.cache/vcut/rate-limit.json` (cùng
  máy) — nay tách ra. App thật vẫn persist qua restart (cùng userDataDir
  = cùng file; mốc chỉ sống trong cửa sổ 60s nên việc đổi vị trí file
  không ảnh hưởng user).
- KHÔNG đổi: `scripts/start.sh` (dev server — một instance sống lâu, persist
  mặc định CHÍNH LÀ tính năng; audit đưa vào allowlist có lý do).
  `server/bridge/src/index.js` không đổi (mặc định vẫn
  `~/.cache/vcut/rate-limit.json` cho bridge chạy tay — đúng thiết kế S5).

## 2. Test hồi quy mới — `server/bridge/test/test-bridge-persist-audit.cjs`

Test TĨNH (không spawn bridge, chạy ~3–40s tùy tải), 3 phần:
1. **Inventory (35 file):** mỗi file phải chứa `BRIDGE_RATE_PERSIST_PATH`
   trong code (không tính dòng comment nguyên dòng) VÀ thật sự spawn bridge
   (heuristic — xem header file).
2. **Via-manager (2 file):** `serviceManager.test.cjs`,
   `bridgePidfile.test.cjs` — spawn bridge thật chỉ qua ServiceManager
   (điểm cách ly tập trung ở serviceManager.js); audit khẳng định chúng
   không spawn bridge trực tiếp.
3. **Discovery:** quét lại repo; file spawn bridge nào ngoài
   inventory/via-manager/allowlist/false-positive → FAIL, bắt người thêm
   test mới phải cách ly persist rồi đăng ký.

Kết quả lúc quét xong: **76 pass, 0 fail** (quét thấy 40 site: 35 inventory
+ 2 via-manager + 1 allowlist + 2 false-positive đã xác minh bằng tay:
`bridgePidfile.js` chỉ nhận diện bridge qua cmdline, không spawn;
`electronOrphanCleanup.test.cjs` chỉ spawn mock với argv giả).

**Giá trị đã chứng minh ngay trong đợt này (xem §5):** chạy lại audit sau
khi T8 tạo file mới thì audit FAIL đúng 1 chỗ, chỉ đúng file mới
(`clicktest-66t8-resume-job-headed.mjs`) — cơ chế khóa hoạt động thật,
không phải test trang trí.

Hạn chế trung thực: heuristic nhận diện bằng chuỗi
(`server/bridge/src/index.js` / `BRIDGE_ENTRY` / `bridgeEntry` / dạng
`path.join("server", "bridge", …)` / dạng cwd). File spawn bridge bằng
cách khác (đường dẫn lắp từ biến lạ, spawn qua helper ngoài repo) sẽ
không bị phát hiện — rà soát tay vẫn cần khi thêm cách spawn mới.

## 3. Kiểm chứng — cách làm + bằng chứng không còn rò

- **Đối chứng âm (file mặc định):** trước đợt này `~/.cache/vcut/` chỉ có
  `gpu-probe.json` + `vidstab-cache` (không có `rate-limit.json`). Sau
  từng lượt suite của T9 (e2e 165, rate 40, structured 170, cli-proxy 25,
  gpu_bridge 13, unit 142/108, audit 76) kiểm tra lại: **vẫn không có
  `rate-limit.json`** — không test nào của T9 chạm file mặc định.
- **Chạy song song (bằng chứng chính):** 4 suite e2e bridge chạy đồng thời
  (mỗi suite spawn 1–4 bridge): **165/165 + 40/40 + 170/170 + 25/25**,
  tất cả exit 0. Trước đợt 65, chỉ riêng e2e với 4 instance chung file đã
  tụt 165 → 128.
- **Lặp lại:** e2e bridge-error chạy 2 lần riêng lẻ đều 165/165.
- Cú pháp: `node --check` 22 file JS + `bash -n` 11 file .sh — tất cả pass.
- `tsc`/`vite build` không chạy lại (không đổi code sản phẩm ngoài 1 dòng
  env ở serviceManager.js; desktop test chạy thật đã kiểm chứng thay cho
  build — xem §4.2; web không đụng).

## 4. Ba lỗi tìm thấy trong lúc kiểm chứng (không phải do persist — đã sửa/xác minh)

### 4.1 cli-proxy: literal test lệch từ đợt 63 R5 (đã sửa, test-only)

Chạy lần đầu: **24 pass, 1 fail** — `index.js: /api/proxy dùng taskErrorPayload`.
Nguyên nhân: assert tĩnh so chuỗi chính xác
`taskErrorPayload(e, "Tạo proxy thất bại.")`, nhưng code hiện tại gọi
`taskErrorPayload(e, "Tạo proxy thất bại.", "TASK_PROXY_FAILED")`
(`index.js:1767`, thêm mã enum khi tách module taskError ở đợt 63 R5).
Hành vi vẫn đúng (proxy dùng taskErrorPayload; toàn bộ check HTTP trực
tiếp [d] đều xanh). Sửa test-only: cập nhật literal cho khớp call hiện
tại + comment ghi rõ nguồn lệch. Chạy lại: **25/25**.

### 4.2 serviceManager.test.cjs: 2 fail do tải máy, không phải do sửa (đã xác minh)

Lần 1 (chạy trực tiếp, cùng code đã sửa): **10/10, fail 0** (148s).
Lần 2 (`node --test`, lúc loadavg 25,46/4 CPU): **8/10**, 2 fail đều là
timeout, không liên quan env persist:
- `bridge khởi động được…`: `bridge không healthy sau 35s trên cổng 8787
  (timeout thích ứng 30s)` — bridge không kịp healthy vì health check
  spawn `ffmpeg -version` (604–1895 ms/lần dưới tải, xem comment I4).
- `probe AI…`: `Thiếu module "faster_whisper" … Lỗi: timeout sau 15000ms`
  — probe `python -c "import faster_whisper"` timeout dưới tải, nên
  `ai.caption.available=false`.
Cùng một code, lần 1 xanh / lần 2 đỏ vì tải → kết luận flake do tải.
**Xác minh thêm:** chạy lại đúng 2 test fail bằng `--test-name-pattern`
lúc tải đã hạ: **2/2 xanh** (18s + 16s), exit 0.
`bridgePidfile.test.cjs`: **14/14** (88s).

### 4.3 Shell test: 3 race khởi động + 1 race đọc trạng thái (đã sửa, test-only)

Đo thật: bridge từ lúc spawn tới `/api/health` 200 mất **~4,2s lúc load
~16**; các script dùng `sleep 2`/`sleep 3` cố định rồi check ngay nên
check đầu race-fail (không phải lỗi CORS/bridge):
- `test-cors.sh`: lần 1 **7/10**, lần 2 **3/10** (chỉ [1] localhost:5173
  fail — sau khi lên thì `curl -H "Origin: http://localhost:5173"` trả
  đúng `200 + ACAO`). Sửa: poll `/api/health` tối đa 30s thay `sleep 2`.
  Chạy lại: **10/10**.
- `test-proxy-q8.sh`: lần 1 **0/5** (bridge chưa lên, log rỗng). Sửa:
  poll health thay `sleep 3`. Chạy lại: **5/5**.
- `test-luts-r5.sh`: lần 1 **5/5** (may mắn) nhưng cùng mẫu `sleep 3` —
  sửa phòng ngừa giống proxy-q8. Chạy lại: **5/5**.
- `test_hardening.sh`: cùng mẫu `sleep 2` — sửa phòng ngừa giống cors.
  Chạy lại: **16/16**.
- `test-bridge-queue.sh`: lần 1 **10/12**, lần 2 **11/12** — job2 đọc
  `status` rồi mới đọc `queuePosition` bằng 2 curl riêng; render 2s
  xong giữa 2 lần đọc nên job2 đã `running` (`queuePosition=null`).
  Sửa 2 bước: (a) đọc cả 2 field trong CÙNG một response; (b) fixture
  2s → **10s** (đủ cửa sổ kiểm tra; download chỉ assert duration
  non-empty, poll 60s vẫn dư). Chạy lại: **12/12**.

Các script còn lại đã poll health sẵn (bridge-queue, diskstorage,
p7-restart, export-e2e, export-progress, caption/translate-e2e) — không
cần sửa phần chờ. Kết quả: diskstorage **7/7**, export-e2e **10/10**,
export-progress **5/5**, caption **14/14**, translate **15/15**.

#### 4.3b p7-restart — lần 1 fail 7/7 do bridge mồ côi của chính T9 (đã sửa bằng cách dọn + chạy lại)

Lần 1: **7 pass, 7 fail** — job2 `done` thay vì `queued`, `job.json`
không có trên đĩa, job1 sau restart `running` thay vì `interrupted`.
Nguyên nhân (truy vết, không phải lỗi sản phẩm): cổng cố định 18799 đã
bị chiếm bởi bridge mồ côi pid 20654 — chính là bridge T9 spawn bằng tay
lúc đo thời gian khởi động cho §4.3 (lệnh đo kết thúc bằng `kill $BPID`
nhưng bridge không chết, thành mồ côi PPID 1, vẫn giữ cổng 18799).
`start_bridge` của p7 không kiểm tra cổng trống trước (khác export-e2e
có fail-fast) nên bridge mới fail EADDRINUSE lặng lẽ, mọi request rơi
vào bridge mồ côi (MAX_JOBS mặc định 2, work dir khác) → job2 chạy song
song và xong trước, job nằm sai work dir nên mọi check file fail theo.
Xử lý: kill bridge mồ côi (SIGTERM, kiểm tra cổng đã trống), dọn file
tạm của probe, chạy lại p7-restart: **14/14, exit 0** (đủ các bước:
job2 queued, job.json running trước restart, interrupted sau restart,
spec còn nguyên, retry chạy lại được).
Bài học vận hành: bridge spawn bằng tay trong exec phải kiểm tra đã chết
thật (cổng/process) sau `kill` — `kill` + `2>/dev/null` không đủ; và
test dùng cổng cố định nên fail-fast khi cổng đã có người giữ (nợ §7.7).

## 5. Phát hiện ngoài phạm vi: file mới của luồng T8 (KHÔNG sửa — đang chạy)

Lúc 12:09, `~/.cache/vcut/rate-limit.json` xuất hiện (694 byte → 2598
byte lúc 12:10) — KHÔNG phải do test của T9 (kiểm tra sau từng lượt
đều sạch). Truy vết: bridge pid 17182, cổng 8950, env chỉ có
`BRIDGE_PORT=8950` (không có `BRIDGE_RATE_PERSIST_PATH`), parent là
`node apps/web/scripts/clicktest-66t8-resume-job-headed.mjs` (luồng T8,
đang chạy, started 12:07:36) — file mới T8 tạo SAU lúc audit của T9 quét
xong. Spawn site: dòng 397–399, helper giống 64r8/65s10:
`env: { ...process.env, BRIDGE_PORT: String(port), BRIDGE_WORK_DIR: workDir }`
— thiếu persist. Cách vá (1 dòng, để parent/T8 áp): thêm
`BRIDGE_RATE_PERSIST_PATH: path.join(workDir, \`rate-limit-${process.pid}.json\`)`
vào env của helper đó.

T9 KHÔNG sửa file này: T8 đang chạy nó (process sống), sửa giữa chừng
dễ xung đột với luồng đang làm việc. Audit test đã bắt đúng trường hợp
này: chạy lại audit → **75 pass, 1 fail**, fail duy nhất chỉ đúng file
T8 (`quét thấy 41 site`). Audit sẽ xanh lại ngay khi file T8 được vá +
đăng ký vào inventory (hoặc T8 tự vá theo mẫu 64r8/65s10).

Lưu ý cho parent khi gộp: file `~/.cache/vcut/rate-limit.json` hiện trên
đĩa là của bridge T8 (đang chạy); xóa lúc này vô ích (bridge sẽ ghi lại
sau ≤5s) và có thể làm lệch test của T8 — để T8 dọn khi xong, hoặc xóa
sau khi không còn bridge nào dùng file mặc định.

## 6. Thay đổi production duy nhất — serviceManager.js (1 dòng env + comment)

`BRIDGE_RATE_PERSIST_PATH: path.join(this.userDataDir, 'rate-limit.json')`
trong `_spawnBridgeOnPort`. Hệ quả:
- App desktop: persist chuyển từ `~/.cache/vcut/rate-limit.json` sang
  `<userDataDir>/rate-limit.json`. File cũ thành mồ côi vô hại (chỉ còn
  mốc đã hết hạn trong 60s; bridge dev vẫn dùng file cũ — nay 2 bên
  không còn chia sẻ trạng thái, đúng ý).
- Test desktop: userDataDir là mkdtemp → tự cách ly, không sửa test.
- Kiểm chứng: serviceManager 10/10 (lần 1), bridgePidfile 14/14; 2 fail
  lần 2 đã xác minh là timeout do tải (§4.2), không phải do dòng này
  (dòng này chỉ đổi đường dẫn file; bridge vẫn lên/health/log bình
  thường ở 8 test còn lại).
- Rủi ro còn lại: nếu một ngày ServiceManager spawn bridge mà
  `userDataDir` chưa set, `path.join(undefined, …)` throw — nhưng
  `BRIDGE_WORK_DIR` ở dòng ngay trên đã dùng `this.userDataDir` từ trước
  nên không thêm rủi ro mới.

## 7. Nợ mở cho đợt sau

1. **File T8** (`apps/web/scripts/clicktest-66t8-resume-job-headed.mjs`
   :397–399): vá persist + đăng ký vào inventory của audit test (xem §5).
   Audit hiện 75/76 vì file này — không phải lỗi của batch T9.
2. **Audit heuristic chưa bao phủ mọi cách spawn**: file spawn bridge bằng
   đường dẫn lắp từ biến lạ / helper ngoài repo sẽ lọt. Khi thêm cách
   spawn mới, rà soát tay + cập nhật `mentionsBridgeEntry` nếu cần.
3. **Các headed script (.mjs) chỉ kiểm chứng cú pháp** (`node --check`),
   không chạy lại toàn bộ (cần Chrome/Xvfb + render dài, máy đang tải
   nặng vì nhiều luồng song song). Sửa của chúng chỉ là thêm 1 key env —
   rủi ro thấp, nhưng chưa có lần chạy headed nào sau vá.
4. `clicktest-61r5-modal-headed.mjs` + `clicktest-round39-t4-…` dùng bridge
   ngoài (không spawn): nếu bridge ngoài đó chạy bằng file mặc định thì
   vẫn rò — ngoài phạm vi đợt này (cần quy ước chung cho bridge dev dùng
   tay: đặt `BRIDGE_RATE_PERSIST_PATH` khi chạy `scripts/start.sh` hoặc
   chấp nhận rò cho dev).
5. `ci-security.yml` vẫn chờ quyền workflows (nợ từ Phase 6, không thuộc
   đợt này).
6. Flake do tải máy vẫn còn: serviceManager 2 fail timeout (§4.2) và các
   race `sleep` cố định đã sửa ở §4.3 — các test render dưới tải cao
   (loadavg >15) vẫn có thể flake ở những chỗ chưa vá (poll loop đã có
   nhưng timeout 30s có thể không đủ lúc tải cực cao).
7. `test-p7-bridge-restart.sh` (và các test cổng cố định khác: cors 18799,
   diskstorage 18797, hardening/export-e2e 18787, caption 18791,
   translate 18792, luts 8795, proxy-q8 8793) nên fail-fast khi cổng đã
   có bridge khác giữ (kiểu export-e2e đã làm) — lần này p7 fail 7/7 chỉ
   vì cổng bị bridge mồ côi chiếm mà script không phát hiện (§4.3b).

## 8. Batch stage (KHÔNG push)

File paths: `~/workspace/repo-1-push/paths-loop/phase9-round66-t9-bridge-persist.txt`
(35 entry, NUL-delimited, text only, verify read-back — xem log luồng).
HEAD vẫn e2cb35e1 (đợt 50). KHÔNG push.
