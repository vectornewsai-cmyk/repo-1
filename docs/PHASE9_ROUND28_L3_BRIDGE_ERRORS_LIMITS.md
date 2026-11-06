# Phase 9 đợt 28, luồng L3 — Bridge hết mù với CLI/MCP — LIMITS

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không sửa App.tsx, preview.tsx, store.ts, i18n (luồng khác đang
sửa). Không đổi ngữ nghĩa render, không đổi validator, không đổi
chuỗi `job.error` cũ.

## 0. Đính chính quan trọng: CLI/MCP KHÔNG đi qua bridge

Kiểm chứng tận tay trước khi code (không đoán theo tên luồng):

- CLI (`cli/src/commands/render.ts`) spawn render worker trực tiếp
  bằng `spawnSync`, không gọi bridge API.
- MCP (`mcp-server/src/tools/export.ts`, tool `export_video`) cũng
  spawn render worker trực tiếp, không gọi bridge API.
- Chỉ web ExportPanel đi qua bridge (`POST /api/render` +
  poll `GET /api/render/:id`).

Vì vậy "bridge hết mù với CLI/MCP" được hiểu đúng là: **một module
canonical duy nhất** (`server/bridge/src/errorDetail.js`) làm 2 việc
— redact stderr + phân loại thành mã có cấu trúc — và **cả 3 đường**
đều dùng nó:

1. Bridge: `jobQueue._onError` tính `errorCode`/`errorDetail` cho mọi
   job lỗi; API trả detail khi caller xin tường minh `?detail=1`.
2. CLI: `render.ts` khi worker fail (chế độ `-q`, stderr thu được)
   ném `CliError(formatRenderFailure(...))` thay cho `slice(-2000)`
   stderr thô như trước.
3. MCP: `export.ts` khi worker fail ném `ValidationError` với chuỗi
   đã format; `handleError` in nguyên văn qua `fail()`.

CLI/MCP load module bridge qua `createRequire`, đúng mẫu sẵn có
(`cli/src/project.ts` load `validate.js`). Không nhân bản logic phân
loại sang TypeScript — 2 file `renderErrors.ts` (CLI, MCP) chỉ là
adapter mỏng + fallback basename-only khi module bridge không load
được (fallback không bao giờ in stderr thô).

Hệ quả cần nói thẳng về trường hợp (a): CLI và MCP **đã chặn sớm**
curve vi phạm trước khi tới worker — CLI dùng chính `validate.js`
của render worker, MCP dùng validator TS riêng (kiểm tra
`SPEED_MIN..SPEED_MAX`). Kiểm chứng thật bằng CLI đã build: project
clip `bad-clip` keyframe `{t: 0, v: 5}` → `vcut validate` và
`vcut render` đều báo
`[tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong
0.25..4 (nhận được: 5)` và từ chối render. Tức với CLI/MCP, lỗi
curve đã không mù ở cửa validate; cái mù thật là (i) bridge API cho
web/bất kỳ caller API nào, và (ii) lỗi ở **tầng worker** của CLI/MCP
(ffmpeg, asset hỏng ở tầng render) vốn trước đây in stderr thô
(vừa mù về cấu trúc, vừa lộ đường dẫn). Cả 2 cửa đó nay đều đi qua
module mới — trường hợp (a) được kiểm chứng ở đúng 2 cửa đó bằng
stderr worker thật của đợt 27 K2 (v=5), xem §4.

## 1. Đã làm

- `server/bridge/src/errorDetail.js` (mới, CommonJS, chỉ node
  builtins):
  - `redactStderr(text)`: bỏ dòng stack trace Node (`    at ...`);
    URL có credential, `Bearer <token>`, `key=value` bí mật
    (api-key/access-token/auth-token/secret/password/passwd/bearer),
    token prefix đã biết (`sk-`, `ghp_`/`gho_`, `AKIA`, `xox*`),
    token mờ dài ≥ 40 ký tự → `<redacted>`/`<token>`; home dir
    (homedir thật + `/home/<user>`, `/Users/<user>`,
    `C:\Users\<user>`) → `<home>` nếu trần, hoặc
    `<path>/<basename>` nếu có file phía sau (callback ăn cả đường
    dẫn, không sót dạng `<home>/projects/secret/...`); mọi đường
    dẫn tuyệt đối còn lại → `<path>/<basename>`; giữ tối đa 20
    dòng cuối / 1500 ký tự (khớp thói quen `slice(-1500)` cũ);
    lũy đẳng (`redact(redact(x)) === redact(x)`).
  - `classifyRenderError(text, {exitCode, signal})` → mã + summary
    + tối đa 5 dòng details + số dòng bị lược. Thứ tự: curve →
    asset thiếu → spec chung → QA → spawn → ffmpeg → worker exit.
  - `buildErrorDetail({stderr, message, exitCode, signal})`: tách
    tail khỏi message kiểu cũ `"... Chi tiết: <tail>"` trước khi
    phân loại; khi không có stderr thì `redactedTail = ""` (không
    lặp lại message vào tail).
  - `formatErrorDetail(detail)`: chuỗi nhiều dòng
    `Render thất bại [CODE]: summary` + từng dòng details, để
    CLI/MCP in/trả nguyên văn.
- `server/bridge/src/publicJob.js` (mới, tách từ `index.js` để test
  được mà không khởi động server): giữ nguyên mọi field cũ, thêm
  `errorCode` luôn kèm (enum an toàn), `errorDetail` CHỈ kèm khi
  `includeDetail=true`. `_stderrTail` thô, `proc`, `_killTimer`
  không bao giờ serialize (như cũ).
- `server/bridge/src/jobQueue.js`: `enqueue` thêm
  `errorCode/errorDetail = null`; `serializeJobState` +
  `restoreRecord` (P7) lưu/khôi phục 2 field (job.json cũ thiếu
  field → `null`, tương thích ngược); `retry` reset cả 3 field
  lỗi; `_onError` giữ nguyên `job.error` (tách `" Chi tiết:"` và
  `" (file lỗi"` như cũ) và tính thêm `errorCode`/`errorDetail`
  từ message (kể cả message có tail kiểu cũ). Log server
  (`console.error`) vẫn giữ stderr thô — đó là log local của máy
  chạy bridge, không phải kênh API.
- `server/bridge/src/index.js`: dùng `publicJob` từ module mới;
  `GET /api/render/:id` thêm `?detail=1` hoặc `?error_detail=1`
  mới kèm `errorDetail`; `GET /api/render` (danh sách) không đổi
  (không bao giờ kèm detail); cập nhật comment API + ghi chú
  trong `server/bridge/API.md` (không sửa `openapi.yaml` — xem §5).
- `cli/src/paths.ts` (+`BRIDGE_ERROR_DETAIL_JS`),
  `cli/src/renderErrors.ts` (mới, adapter + fallback),
  `cli/src/commands/render.ts`: worker fail ở chế độ `-q` (stderr
  thu được) → `CliError` với chuỗi đã format; nếu `r.error` có
  thì format nó; nếu không thu được gì (chế độ inherit, xem §5)
  thì báo rõ exit code + hướng dùng `-q`, không bịa chi tiết.
- `mcp-server/src/tools/renderErrors.ts` (mới, adapter +
  fallback), `mcp-server/src/tools/export.ts`: worker fail →
  `ValidationError` với chuỗi đã format thay cho `slice(-2000)`
  stderr thô.
- `server/bridge/test/test-error-detail.cjs` (mới, 56 assert):
  xem §4.

## 2. Mã lỗi có cấu trúc

| Mã | Khi nào | Summary ví dụ |
|---|---|---|
| `SPEED_CURVE_VIOLATION` | stderr chứa `speedKeyframes` | `Vi phạm speed-curve: 1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)` |
| `MISSING_ASSET` | `không tìm thấy asset/file`, `No such file or directory` (kể cả của ffmpeg) | `Thiếu asset/file đầu vào: ...` |
| `SPEC_VALIDATION` | `Spec không hợp lệ` nhưng không phải curve | `Spec không hợp lệ: 1. ...` |
| `OUTPUT_QA` | `Kiểm tra chất lượng output thất bại` (hậu tố nội bộ `(file lỗi...)` đã lược khỏi summary) | nguyên dòng QA đã lược |
| `WORKER_START` | `Không khởi động được render worker` / `Lỗi spawn` / `spawnJob phải trả về` | nguyên message gốc |
| `FFMPEG_ERROR` | pattern ffmpeg (`Invalid argument`, `Unknown encoder`, `Error opening`, `Failed to`, `Permission denied`, `Conversion failed`, ...) | `Lỗi ffmpeg: <dòng khớp cuối cùng>` |
| `WORKER_EXIT` | exit code/signal, hoặc thoát mã 0 mà không có file output | `Render worker thoát với mã 1.` |
| `UNKNOWN` | không khớp pattern nào, không có exit code | dòng đầu đã redact, hoặc câu chung |

Lưu ý phân loại: lỗi kết hợp `speedKeyframes + reverse` (validator
ghi `speedKeyframes không dùng chung được với reverse=true`) xếp
vào `SPEED_CURVE_VIOLATION` vì chứa `speedKeyframes` — đúng nhóm
curve, dù nguyên nhân là kết hợp. `No such file` của ffmpeg xếp
vào `MISSING_ASSET` (file đầu vào thiếu), không phải `FFMPEG_ERROR`.

## 3. Bảng redact — trường nào được phép đi qua, trường nào bị chặn

Được phép đi qua `errorDetail` (sau redact):

- Mã enum `errorCode` (không chứa dữ liệu user).
- Đường dẫn clip trong spec: `[tracks[0].clips[0]]`, kể cả qua
  `.subSpec.` (validator in dạng này, không phải đường dẫn file).
- Keyframe index + giá trị vi phạm: `keyframes[0].v`, `5`,
  khoảng cho phép `0.25..4`, tên easing/bezier (đã là dữ liệu
  project của chính caller).
- Basename file: `<path>/clip.mp4`, `<path>/final.mp4` (đủ để
  caller nhận ra file của mình, không khôi phục được cây thư mục).
- Dòng lỗi ffmpeg đã redact: `Invalid argument`,
  `Error opening output file <path>/final.mp4.`
- Tên asset trong message validator: `intro.mp4` (từ message
  `không tìm thấy asset "intro.mp4"`).

Bị chặn (không bao giờ xuất hiện trong `errorDetail`, kể cả
`redactedTail`):

- Mọi đường dẫn tuyệt đối: `/home/<user>/...`, `/tmp/...`,
  `/var/...`, `/workspace/...`, `C:\Users\<user>\...`,
  `C:\...` — kể cả phần đuôi sau home (`/projects/secret/...`).
- Tên user/home dir: `tranhai`, `/home/tranhai`, `TranHai`.
- Secret/token: `Bearer <jwt>`, `api_key=sk-...`, `ghp_...`,
  `AKIA...`, `xox...`, token mờ ≥ 40 ký tự, URL có credential
  (`https://user:pass@...` → `https://<redacted>@...`).
- Dòng stack trace Node (`    at ...`) — bỏ cả dòng.
- Hậu tố nội bộ của bridge: `(file lỗi đã bị giữ lại, không trả
  cho người dùng)` — lược khỏi summary/details (chỉ còn trong
  log server).
- `_stderrTail` thô, `proc`, `_killTimer` — không serialize.

Giới hạn redact (trung thực): basename file vẫn là thông tin
(tên file của caller, không phải bí mật hệ thống); dòng
`<path>/render.js:1302` (file nội bộ + số dòng, không phải stack)
có thể còn sót nếu worker in lỗi dạng đó ngoài stack trace —
đường dẫn tuyệt đối thì đã mất, nhưng tên file nội bộ thì còn.
`LONG_TOKEN_RE` (≥ 40 ký tự) có thể redact oan một chuỗi dài hợp
lệ không phải secret (ví dụ hash) — chấp nhận vì chuỗi đó không
cần cho việc sửa lỗi render.

## 4. Kết quả test (số thật)

- Mới `server/bridge/test/test-error-detail.cjs`: **56 pass, 0
  fail** — redact mẫu độc hại (mất home/token/stack/cây thư mục,
  còn basename + dòng validator), curve K2 (code + clip +
  keyframe + giá trị 5 trong summary/details/format), curve lẫn
  trong stderr độc hại (toàn bộ detail sạch), ffmpeg (code +
  dòng cuối có ích + basename output), spec chung / asset thiếu /
  QA / spawn / exit lạ, jobQueue fake proc (job.error giữ nguyên
  `"Render worker thoát với mã 1."` + errorCode/errorDetail đúng
  + không leak), publicJob (mặc định không detail, `false` không
  detail, `true` có detail, job không detail thì opt-in không bịa
  field), retry reset cả 3 field lỗi.
- Hồi quy `server/bridge/test/test-jobqueue.cjs`: **52 pass, 0
  fail** (không đổi hành vi FIFO/cancel/retry/recover).
- Adapter CLI/MCP qua dist đã build (`/tmp/l3-adapter-check.mjs`,
  không nằm trong repo): **20 pass, 0 fail** — cả 2 adapter đều
  format đúng stderr curve K2 (mã + clip + keyframe + giá trị),
  không leak home, missing-asset → `MISSING_ASSET` + basename,
  ffmpeg → `FFMPEG_ERROR` không leak `/tmp` path.
- `tsc` CLI: pass. `tsc` MCP: pass.
  (`npm run build` ở cả 2 package, exit 0.)
- `node --check`: pass cho `errorDetail.js`, `publicJob.js`,
  `jobQueue.js`, `index.js` (bridge).
- Kiểm chứng thật bằng CLI đã build (project clip `bad-clip`,
  keyframe v=5): `vcut validate` và `vcut render` đều từ chối với
  đúng dòng validator nêu clip/keyframe/giá trị (cửa validate đã
  chặn sớm, xem §0). Render MP4 thật sau khi sửa curve không nằm
  trong phạm vi luồng này (đã có ở đợt 27 K2 §5).

## 5. Chưa làm / nợ còn lại (trung thực)

- ExportPanel (web) vẫn poll `GET /api/render/:id` KHÔNG kèm
  `?detail=1`, nên web vẫn hiển thị `error` cũ như trước — cố
  tình giữ vậy để không hồi quy và không đụng file của luồng
  khác; muốn web hiển thị detail thì một luồng web riêng chỉ cần
  thêm `?detail=1` vào poll + hiển thị `errorDetail.summary`
  (đã có sẵn, đã redact).
- CLI chế độ không quiet (`stdio: inherit`, mặc định) vẫn in
  stderr worker trực tiếp ra terminal local trong lúc render —
  đó là terminal của chính user chạy CLI (không phải kênh API),
  nhưng là kẽ leak duy nhất còn lại ở đường CLI: lỗi có cấu trúc
  chỉ áp dụng khi stderr thu được (`-q`, hoặc `r.error`). Muốn
  chặn hẳn phải chuyển CLI sang spawn pipe + stream qua bộ lọc
  redact theo dòng — việc riêng, ngoài phạm vi luồng này.
- MCP `probeVideo` (ffprobe sau export thành công) vẫn dùng
  `slice(0, 500)` stderr thô — không phải đường render worker,
  ngoài phạm vi; nếu ffprobe fail thì message đó vẫn có thể lộ
  đường dẫn. Tương tự các route bridge khác (caption, silence,
  reframe, tts, beats, scene, bgremove) vẫn trả tail stderr thô
  theo kiểu cũ — luồng này chỉ sửa đường render.
- Chưa chạy bridge server thật end-to-end (chỉ fake proc +
  publicJob unit): `index.js` khởi động server thật chưa được
  kiểm chứng với `?detail=1` qua HTTP. Gating đã kiểm chứng ở
  tầng `publicJob` + code route, nhưng một lần chạy server thật
  + curl vẫn là bước xác nhận cuối trước khi coi API là xong.
- `openapi.yaml` chưa cập nhật field `errorCode`/`errorDetail`
  và query `detail` — API.md đã ghi chú, spec OpenAPI là nợ.
- Fallback của 2 adapter (khi module bridge không load được) chỉ
  redact basename/token prefix, không phân loại mã chi tiết
  (trả `UNKNOWN`/`WORKER_EXIT`) — chỉ kích hoạt khi file bridge
  bị di chuyển, bình thường không dùng tới.
- `dist/` của CLI/MCP được build lại để test (gitignored, không
  đưa vào batch) — xem §6.

## 6. File đổi/thêm (tương đối từ repo root, KHÔNG gồm dist)

- `server/bridge/src/errorDetail.js` (mới)
- `server/bridge/src/publicJob.js` (mới)
- `server/bridge/src/jobQueue.js` (sửa: errorCode/errorDetail +
  serialize/restore/retry/_onError)
- `server/bridge/src/index.js` (sửa: dùng publicJob, route
  `GET /api/render/:id` thêm `?detail=1`/`?error_detail=1`)
- `server/bridge/API.md` (sửa: ghi chú lỗi có cấu trúc)
- `server/bridge/test/test-error-detail.cjs` (mới)
- `cli/src/paths.ts` (sửa: thêm `BRIDGE_ERROR_DETAIL_JS`)
- `cli/src/renderErrors.ts` (mới)
- `cli/src/commands/render.ts` (sửa: lỗi worker đã format/redact)
- `mcp-server/src/tools/renderErrors.ts` (mới)
- `mcp-server/src/tools/export.ts` (sửa: lỗi worker đã format/redact)
- `docs/PHASE9_ROUND28_L3_BRIDGE_ERRORS_LIMITS.md` (mới, file này)

Không đụng: `apps/web/src/App.tsx`, `preview.tsx`, `store.ts`,
i18n, validator, render worker, ExportPanel.
