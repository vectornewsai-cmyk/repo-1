# PHASE9 ROUND85 M5 — EPERM: nối helper retry vào 66 điểm ghi + watch probe

> Luồng M5, đợt 85 vòng lặp Phase 9 VCut Studio (lượt cron 06:35 +07,
> 11/11/2026; làm việc ~06:39–~07:35 +07). Nhiệm vụ: nối helper retry
> EPERM vào các writeFileSync/writeFile còn lại có rủi ro thật + watch
> probe. KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG workflow.

## 0. Kết quả headline

- **Đã nối helper vào 66 điểm ghi có rủi ro thật** (57 sync + 9 async),
  trong 40 file: server/bridge + render (12), desktop production (8),
  MCP/CLI (8), packaging scripts (7), họ headed-capture + sweep (31).
- **Ba bản helper giờ đồng bộ hợp đồng** (chỉ retry EPERM, verify đủ
  byte, 5 lần × 20 s): gốc `.mjs` (thêm biến thể async) + port CJS mới
  `server/eperm-retry.cjs` + port JS mới `apps/desktop/src/services/
  epermRetry.js` (+ `.d.ts`). Mỗi port có test fault-injection riêng.
- **Test đều xanh:** helper gốc 22/22 (16 cũ + 6 async mới), port CJS
  8/8, port desktop 11/11; tsc desktop 0, tsc mcp-server 0, tsc cli 0;
  self-test gpuencode ALL PASS, proxy 11/11; 3 test service desktop cũ
  exit 0; E2E thật MCP create/save project qua dist PASS; glue chạy
  được cả từ layout src lẫn dist.
- **Sóng EPERM: KHÔNG gặp trong lượt này** (probe M5 #1–#6, 23:41–
  00:31Z, 0 fail) — nhưng KHÔNG tuyên bố "đã hết hẳn" (xem §1).
- **Headed-capture kiểm chứng (r83k4, w1280x800): lần 1 TIMEOUT** ở
  snapshot slov-vp9-1920/noise05 (chờ 120 s, last=null) — flake, không
  phải do nối helper (vite config ghi qua helper đã boot được, 2 nguồn
  đầu pass D1/D3; K4 chạy cùng cửa sổ này 11/11 ngày 10/11). **Lần 2
  PASS 11/11** (00:28:03Z): snaps JSON 4.381.234 byte (đủ 5 nguồn) +
  report JSON 2.235 byte (pass 11/11) đều ghi qua helper, parse được.
- **Quét 0-byte cuối lượt: không file dữ liệu nào 0 byte mới.** Chỉ còn
  5 file placeholder của venv Gradio (third-party) + 1 JSON benchmark
  0 byte từ 06/11 (xem §5).

## 1. Sóng EPERM: probe M5 + bối cảnh

| Mốc (UTC 10–11/11) | Nguồn | Diễn biến |
|---|---|---|
| 20:58:48Z 10/11 | Probe L6 #2 (đợt 84) | **fail 1/2 — /tmp 0 byte lặng** (sóng tái phát trong đợt 84) |
| 22:18Z | Probe L6 #10 | OK cuối cùng; probe CHẾT sau đó, không có dòng `probe end`, process không còn sống — dừng trong khoảng 22:18–22:28Z, TRƯỚC khi VM reboot ~23:28Z (uptime 11 phút lúc 23:39Z). Có thể do phiên spawn bị dọn. Khoảng 22:28Z–23:41Z không có dữ liệu probe. |
| 23:41:54Z | Probe M5 #1 | OK 2/2 (5000 + 5000) |
| 23:51:55Z | Probe M5 #2 | OK 2/2 |
| 00:01:55Z | Probe M5 #3 | OK 2/2 |
| 00:11:55Z | Probe M5 #4 | OK 2/2 |
| 00:21:56Z | Probe M5 #5 | OK 2/2 |
| 00:31:56Z | Probe M5 #6 | OK 2/2 (lúc kết sổ) |
| (tiếp) | Probe M5 | Chạy nền bằng setsid + nohup tới 16 lần (~02:21Z); đọc `hidden_files/round85-m5/eperm-probe.log`. Lưu ý L6: probe nền vẫn có thể chết không rõ lý do — đọc log phải kiểm tra có dòng `probe end` không. |

**Kết luận: không gặp sóng trong lượt này (6/6 probe OK), nhưng đây
chỉ là "không gặp trong lúc đo".** Sóng đã tái phát 3 lần sau các lần
"đã hết" trước đây, và khoảng mù 22:28Z–23:41Z không có quan sát nào —
không tuyên bố EPERM đã hết hẳn.

## 2. Kiểm kê: còn bao nhiêu điểm chưa nối (đếm cuối lượt)

Đếm bằng grep trên cây source (loại node_modules, dist/, release/,
build/bundled-server — các bản copy generated):

- `writeFileSync` còn lại: **1.201 dòng** (đếm theo dòng, không phải số
  lần gọi). Phân bổ:
  - `apps/web/scripts`: 761 — script đo một lần (xem §6: bỏ qua có lý do).
  - `server/render/src`: 267 — gần hết là `test_*.js` / `measure_*.js`
    (fixture + kết quả đo chạy lại được).
  - `server/bridge/test`: 57 — test.
  - `server/render` (ngoài src): 38 — script test ở gốc render.
  - `apps/desktop/src/services`: 22 — gồm test `.test.cjs` + các dòng
    `writeFileSync` trong fake-fs của test mới (không phải điểm ghi thật).
  - `apps/desktop/scripts`: 19 — clicktest/e2e (script đo, chạy lại được).
  - `benchmarks/render`: 9, `server` (gốc): 5 (port CJS + test của nó),
    `packages/video-spec/scripts`: 5, `apps/web/src/lib`: 5 (toàn test),
    `server/bridge` (ngoài src/test): 3, `apps/web/e2e`: 3,
    `apps/desktop/src`: 3 (toàn test), `benchmarks`: 2,
    `server/bridge/src`: 1 (`outputQA.js:216` — fixture self-test),
    `mcp-server/src`: 1 (`migrateRender.test.ts:85` — test).
- `writeFile` async còn lại: **38 dòng**, nhưng trong các thư mục
  production (`mcp-server/src`, `cli/src`, `apps/desktop/src`,
  `apps/web/src`, `server/bridge/src`, `server/render/src`) chỉ còn
  **1 dòng — chính là `await f.writeFile(...)` bên trong
  `writeFileEpermRetryAsync` của port desktop** (điểm gốc mà helper
  bọc lại, đương nhiên không tự nối vào chính nó). Toàn bộ đường ghi
  async dữ liệu người dùng đã nối xong; 37 dòng còn lại nằm ở test /
  script đo.

Lưu ý về số đếm: đầu lượt đếm 877 dòng (chưa gồm server/benchmarks);
cuối lượt 1.201 dòng (đã gồm server/benchmarks). Số tuyệt đối tăng
không phải vì nối ít đi — trong lượt này các luồng song song khác của
đợt 85 cũng thêm script mới vào repo, và test mới của M5 chứa các dòng
`writeFileSync` giả lập (fake-fs) mà grep đếm vào. Con số đáng tin là
**66 điểm đã nối** (đếm theo điểm sửa, xem §3), không phải hiệu số
grep.

## 3. Đã nối: 66 điểm / 40 file

### 3.1 Helper: 1 mở rộng + 2 port mới (giữ đồng bộ hợp đồng)

- `apps/web/scripts/eperm-retry.mjs` (sửa): thêm
  `writeFileEpermRetryAsync` + `sleepAsync` (ngủ bằng setTimeout, không
  block event loop — dùng cho MCP/CLI/desktop file-io). Bản sync không
  đụng. Test K8 mở rộng §11 (fault-injection async + đường thật):
  **22/22 PASS** (16 cũ + 6 mới).
- `server/eperm-retry.cjs` (mới): port CJS của helper gốc (chỉ bản
  sync). Vì sao không require thẳng `.mjs` gốc: server/bridge +
  render là CommonJS, chạy cả từ repo lẫn từ AppImage (bundle chỉ copy
  cây server/, KHÔNG có apps/web/scripts) — require xuyên cây sẽ gãy
  trong app đóng gói. Test riêng `server/eperm-retry.test.cjs`:
  **8/8 PASS** (fault-injection + đường thật).
- `apps/desktop/src/services/epermRetry.js` + `epermRetry.d.ts` (mới):
  port JS thuần (sync + async) cho Electron main. File `.js` được
  `copy-services-js.mjs` copy nguyên vẹn sang dist/services/ nên cả 2
  đường load (dist và src fallback) đều `require("./epermRetry")`
  được; `.d.ts` theo đúng mẫu `bridgePidfile.d.ts` để TS import có
  kiểu. Test riêng `epermRetry.test.cjs`: **11/11 PASS** (sync + async).
- **Quy tắc đồng bộ** (ghi trong header cả 3 file): mọi thay đổi hợp
  đồng (số lần retry, nhịp delay, luật chỉ retry EPERM, verify đủ
  byte) phải sửa cả 3 file.

### 3.2 Nhóm A — server/bridge + render: 12 điểm / 8 file (port CJS)

| File | Điểm | Vì sao nối |
|---|---|---|
| `server/bridge/src/index.js` | 3: `moveUploadTo` fallback (729), `spec.json` (921), `asset-map.json` (923) | File media user upload + spec render job — dữ liệu người dùng thật, ghi 0-byte lặng = job hỏng lặng. |
| `server/bridge/src/jobQueue.js` | 1: `job.json` tmp+rename (93) | Trạng thái job bền vững; ghi hỏng → job mất dấu sau restart bridge. |
| `server/bridge/src/rateLimit.js` | 1: state tmp+rename (149) | Trạng thái rate-limit bền vững. |
| `server/bridge/src/aiDownload.js` | 1: `meta.json` (80) | Meta download AI của user (token → file). |
| `server/bridge/src/clonedVoices.js` | 2: registry tmp+rename (126), ref audio khôi phục từ backup (472) | Registry giọng đã clone + file mẫu — dữ liệu TTS voice cloning; điểm 472 đã có check sha256 sau ghi (bắt 0-byte rồi throw), nối helper để retry thay vì fail thẳng. |
| `server/render/src/render.js` | 2: `.ass` typewriter (432), karaoke (493) | File ASS tạm cho ffmpeg; 0-byte → ffmpeg lỗi subtitle, render fail. |
| `server/render/src/gpuencode.js` | 1: probe cache tmp+rename (231) | Cache probe GPU; ghi hỏng lặng → probe lại mỗi lần (chậm), nay có retry. |
| `server/render/src/proxy.js` | 1: sidecar JSON (158) | Manifest proxy (M8 đợt 85); 0-byte → proxy mất dấu. |

Kiểm chứng: `node --check` 8/8 file OK; `require()` trực tiếp
jobQueue + proxy load được; `gpuencode.js --self-test` ALL PASS
(bài cache MISS/HIT/TTL/file hỏng đều đúng — đường ghi cache đã nối
được chạy qua); `proxy.js --self-test` **11/11 pass**. Mô phỏng layout
bundle (temp dir, copy `eperm-retry.cjs` + consumer require
`../../eperm-retry.cjs` từ bridge/src và render/src): cả 2 đều OK.

### 3.3 Nhóm B — desktop production: 8 điểm / 8 file (port JS)

| File | Điểm | Ghi chú |
|---|---|---|
| `services/bridgePidfile.js` | 1 (110) | Pidfile bridge tmp+rename; helper throw sau retry → hàm trả false như cũ (không chặn app). |
| `services/electronOrphanCleanup.js` | 1 (147) | Pidfile Electron tmp+rename; tương tự. |
| `services/modelDownloader.js` | 1 (500) | Marker `.complete`; đã có try/catch nuốt lỗi — helper chỉ thêm retry + verify, không đổi ngữ nghĩa. |
| `settings.ts` | 1 (105) | `settings.json` userData, tmp+rename. |
| `windowState.ts` | 1 (55) | `window-state.json`; lỗi sau retry vẫn nuốt lặng như cũ (không chặn quit). |
| `native-files.ts` | 1 (205) | `vcut-last-dirs.json`; tương tự. |
| `main.ts` | 1 (370) | Screenshot smoke-test; đã có try/catch. |
| `file-io.ts` | 1 async (173) | `writeProjectFile` — file `.vcut` của người dùng, tmp+rename. Bản async không block event loop. |

Kiểm chứng: `tsc --noEmit` desktop exit 0 (import `./services/
epermRetry.js` từ TS resolve qua `.d.ts` đúng như thiết kế); `node
--check` 3 file `.js` OK; test service cũ exit 0 cả 3
(`bridgePidfile.test.cjs`, `electronOrphanCleanup.test.cjs`,
`modelDownloader.test.cjs` — chạy qua đường ghi đã nối).

### 3.4 Nhóm C — MCP/CLI: 8 điểm async / 5 file + 2 glue

- Glue `mcp-server/src/epermRetry.ts` + `cli/src/epermRetry.ts`
  (mới, giống hệt nhau ngoài docstring): tìm repo root bằng walk-up
  tới khi thấy `apps/web/scripts/eperm-retry.mjs` (theo đúng tiền lệ
  `findRepoRoot` trong `migrateRender.test.ts` — layout dist khác
  layout src, hard-code đã từng làm spawn ENOENT), dynamic-import
  helper gốc (cache 1 lần), export `writeFileEpermRetryAsync`. Helper
  chỉ load khi có thao tác ghi (lazy) — server/CLI vẫn khởi động được
  khi file helper chưa có.
- Điểm nối: `mcp-server/src/store.ts` ×4 (createProject project +
  meta, saveProject project + meta — **đây là đường ghi project của
  người dùng qua MCP, ưu tiên cao nhất**), `mcp-server/src/index.ts`
  ×1 (tmp spec render), `mcp-server/src/tools/export.ts` ×1 (tmp spec
  export), `cli/src/project.ts` ×1 (saveProject CLI),
  `cli/src/commands/render.ts` ×1 (tmp spec render).
- Kiểm chứng: `tsc` mcp-server exit 0, cli exit 0 (glue đã build ra
  dist). E2E thật qua dist: `createProject` ghi 137 byte + meta đúng,
  `saveProject` rồi `loadProject` đọc lại khớp tên mới — **PASS**.
  Glue từ layout src (strip-types): ghi 11 byte, attempts=1 — **PASS**.
  Lưu ý: `store.ts` ghi trực tiếp (không tmp+rename) — helper chỉ thêm
  retry + verify, không làm cho ghi thành nguyên tử; crash giữa chừng
  vẫn có thể để lại file dở (nợ mở, xem §6).

### 3.5 Nhóm D — packaging scripts: 7 điểm / 4 file (helper gốc)

| File | Điểm |
|---|---|
| `copy-bundled-server.mjs` | 1: `MANIFEST.json` (335) + **rule copy mới** `server/eperm-retry.cjs` → `bundled-server/server/eperm-retry.cjs` (mục 1) + cập nhật header liệt kê |
| `gen-model-manifest.mjs` | 1: model manifest (277) |
| `build-slim-venv.mjs` | 2: sửa shebang venv (289), `SLIM_VENV.json` (400) |
| `package-ship.mjs` | 3: report early-stop (111), report chính (471), report fatal (488) |

Lý do nối: MANIFEST/model-manifest/SLIM_VENV.json ghi 0-byte lặng sẽ
đóng gói kèm app hỏng mà không ai hay; report ship 0-byte làm mất dấu
vết đóng gói. `node --check` 4/4 OK, 0 `writeFileSync` còn lại trong
4 file (import thừa đã dọn). Chưa chạy lại toàn bộ
`copy-bundled-server.mjs` trong lượt này (sẽ xóa + tạo lại cả cây
bundled-server, quấy các luồng song song khác đang dùng nó) — rule
copy mới đã verify bằng mô phỏng layout bundle (§3.2); lần package
tới sẽ mang file theo.

### 3.6 Nhóm E — họ headed-capture + sweep: 31 điểm / 15 file

Nối theo đúng mẫu r82j4 đã nối ở L6 (import + 3 điểm vite-config /
snaps / report; sweep 1 điểm JSON), bằng script có assert
(`/tmp/m5-wire-family.py` — kiểm tra số điểm trước/sau từng file,
dừng ngay nếu lệch):

- 8 file headed-capture × 3: r71y2, r74b1, r78f7, r79g6, r80h4, r81i4,
  r82j5, r83k4 (r82j4 đã nối ở L6).
- 7 file sweep × 1: r79g6, r80h4, r81i4, r82j5, r83k4 (dạng chuẩn) +
  r81i4-merge-sweep (ghi `A`/`merged`) + r81i4-unrounded-sweep (dạng
  `flush = () => ...`).
- `node --check` 15/15 OK, 0 `fs.writeFileSync` còn lại trong 15 file.

Kiểm chứng chạy thật: xem §4.

## 4. Kiểm chứng chạy thật: headed-capture r83k4 (w1280x800)

Mục đích: chứng minh 3 điểm ghi đã nối (vite config + snaps + report)
hoạt động qua đường thật. Chạy với scratch riêng
`hidden_files/round85-m5/headed-w1280x800` (không đụng dữ liệu K4).

- **Lần 1 (00:16–00:20Z): TIMEOUT.** Vite config ghi qua helper lúc
  00:16 (248 byte), vite boot ngay ("ready in 1617 ms"), 2 nguồn đầu
  pass D1/D3 (slov-vp9-orig, slov-h264-1920). Dừng ở snapshot
  slov-vp9-1920/noise05: `HARNESS LỖI: timeout chờ vòng preview ngủ
  (snapshot slov-vp9-1920/noise05 @1) (last=null)` sau 120 s chờ.
  Log chrome chỉ có noise headless thường gặp (dbus, Vulkan
  incompatible driver, X connection error lúc thoát) — không có lỗi
  ghi file hay EPERM. **Kết luận: flake, không phải hồi quy do nối
  helper** — K4 chạy đúng cửa sổ này ngày 10/11 được 11/11 (gồm D1/D3
  slov-vp9-1920); lần này VM đang chạy 8–10 luồng song song của đợt
  85, preview loop nhiều khả năng bị đói CPU/seek webm kẹt. Snaps +
  report chưa kịp ghi (chạy fail trước khi tới bước ghi cuối) nên 2
  điểm ghi này chưa được chứng minh qua đường thật trong lần 1.
- **Lần 2: PASS 11/11** (00:26–00:28Z, cùng lệnh/scratch). Snaps JSON
  4.381.234 byte (đủ 5 nguồn, parse được) + report JSON 2.235 byte
  (pass 11/11, parse được) đều ghi qua helper lúc 00:28:03Z, không
  dòng retry nào trong log (ghi thành công ngay lần đầu — đúng kỳ vọng
  khi không có sóng). Kích thước khớp đúng file K4 ngày 10/11 (2.235 +
  4.381.234). Kết luận: lần 1 là flake (VM tải nặng vì 8–10 luồng
  song song), 3 điểm ghi đã nối của r83k4 hoạt động qua đường thật.

## 5. Quét file 0-byte cuối lượt

Quét toàn repo (loại node_modules, chrome-userdata, cache): **6 file
0-byte**, không file dữ liệu nào mới:

- 5 file trong `server/tts/.venv2/.../gradio/` (2 file `.js` template
  frontend + 3 file `.txt` test_data) — placeholder của package
  Gradio third-party, trạng thái bình thường, không phải nạn nhân EPERM.
- 1 file `benchmarks/results/preview-fps-r52-medium-prod-timer.json`
  (0 byte, từ 06/11 19:03Z — 5 ngày trước, thời round 52). File kết
  quả đo cũ bị bỏ trống, không phải do lượt này; không chạy lại
  benchmark trong luồng EPERM này để sinh lại.

## 6. Giới hạn trung thực / nợ mở

1. **EPERM KHÔNG hết hẳn** — chỉ là không gặp trong 5 probe của lượt
   này + khoảng mù 22:28Z–23:41Z không có quan sát. Mọi kết luận "hết"
   đều sai cho đến khi có chuỗi probe dài không fail.
2. **Retry 5×20 s KHÔNG qua được sóng dài ~15 phút** (luật K8 giữ
   nguyên). Helper chỉ cứu sóng ngắn/lần fail lẻ. Bản sync dùng
   `Atomics.wait` nên block event loop tới 100 s trong sóng dài nếu
   gọi từ server — các đường nóng đã dùng bản async (MCP/CLI/
   file-io); bridge/render vẫn dùng bản sync vì code đó vốn đồng bộ
   (chấp nhận block, ghi chú ở đây để luồng sau cân nhắc).
3. **Ba bản helper phải giữ đồng bộ tay** (`.mjs` gốc, `.cjs` server,
   `.js` desktop) — không có test tự động nào bắt lệch hợp đồng giữa
   3 file. Test của mỗi port chỉ kiểm tra chính nó.
4. **`mcp-server/src/store.ts` ghi không nguyên tử** (ghi trực tiếp
   project/meta, không tmp+rename): helper thêm retry + verify nhưng
   crash giữa chừng vẫn để lại file dở. Muốn bền vững hẳn thì đổi sang
   tmp+rename như `file-io.ts` — việc riêng, không làm trong luồng này.
5. **Chưa nối:** `fs.openSync` ghi vite/chrome log trong headed-capture
   (fd-based, khác API); `run-all-*.sh` redirect `>>` (log tổng hợp,
   bản session log đã cứng hóa là chính); `outputQA.js:216` (fixture
   self-test, cố tình cắt nửa file); `gpuencode.js:422` (ghi "{json
   hỏng" cố tình trong self-test); toàn bộ `test_*` / `measure_*`
   (xem §2: 1.201 dòng còn lại, phần lớn là test/script đo một lần —
   chạy lại được, nối máy móc không có ích, đúng quy định "không nối
   máy móc vào test một lần").
6. **Headed-capture lần 2 đã xong: PASS 11/11** (xem §4) — không còn
   nợ kiểm chứng chạy thật cho nhóm E.
7. **Chưa chạy lại `copy-bundled-server.mjs` toàn bộ** trong lượt này
   (sẽ tái tạo cả cây bundled-server giữa lúc các luồng khác đang dùng
   nó) — rule copy `server/eperm-retry.cjs` mới chỉ verify bằng mô
   phỏng layout; lần package tới phải kiểm tra file có mặt trong bundle
   thật.
8. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).

## 7. File của đợt (stage, KHÔNG push)

Mới:
- `server/eperm-retry.cjs` — port CJS helper (server).
- `server/eperm-retry.test.cjs` — test port CJS, 8/8.
- `apps/desktop/src/services/epermRetry.js` — port JS helper (desktop).
- `apps/desktop/src/services/epermRetry.d.ts` — kiểu cho TS.
- `apps/desktop/src/services/epermRetry.test.cjs` — test port JS, 11/11.
- `mcp-server/src/epermRetry.ts` — glue dynamic-import (MCP).
- `cli/src/epermRetry.ts` — glue dynamic-import (CLI).
- `docs/PHASE9_ROUND85_M5_EPERM_WIRING_LIMITS.md` (file này).

Sửa:
- `apps/web/scripts/eperm-retry.mjs` — thêm biến thể async.
- `apps/web/scripts/test_round83_k8_eperm_retry.mjs` — thêm §11, 22/22.
- Server (8): `server/bridge/src/index.js`, `jobQueue.js`,
  `rateLimit.js`, `aiDownload.js`, `clonedVoices.js`;
  `server/render/src/render.js`, `gpuencode.js`, `proxy.js`.
- Desktop (8): `apps/desktop/src/services/bridgePidfile.js`,
  `electronOrphanCleanup.js`, `modelDownloader.js`;
  `apps/desktop/src/settings.ts`, `windowState.ts`, `native-files.ts`,
  `main.ts`, `file-io.ts`.
- MCP/CLI (5): `mcp-server/src/store.ts`, `index.ts`,
  `tools/export.ts`; `cli/src/project.ts`, `commands/render.ts`.
- Packaging (4): `apps/desktop/scripts/copy-bundled-server.mjs`,
  `gen-model-manifest.mjs`, `build-slim-venv.mjs`, `package-ship.mjs`.
- Headed-capture + sweep (15): `apps/web/scripts/r71y2-`,
  `r74b1-`, `r78f7-`, `r79g6-`, `r80h4-`, `r81i4-`, `r82j5-`,
  `r83k4-headed-capture.mjs`; `r79g6-`, `r80h4-`, `r81i4-`,
  `r81i4-merge-`, `r81i4-unrounded-`, `r82j5-`, `r83k4-sweep.mjs`.

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round85-m5-eperm-wiring.txt`
(NUL-delimited; verify bằng cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round85-m5/`
(log luồng `../round85-m5.md`; `eperm-probe.log` + `probe-eperm.sh` —
probe nền vẫn chạy tới ~02:21Z; 2 log headed-capture r83k4 + thư mục
`headed-w1280x800/`).
