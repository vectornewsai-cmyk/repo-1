# Phase 9 đợt 29, luồng L3 — Web hiện errorDetail + bridge hết mù nốt — LIMITS

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop, KHÔNG ghi build-loop-log (parent
lo). Không sửa App.tsx, preview.tsx, LoadReportPanel.tsx, file i18n
json (luồng khác sở hữu). Không đổi ngữ nghĩa render, không đổi
validator, không đổi chuỗi `job.error` cũ.

Nối tiếp đợt 28 L3 (xem `docs/PHASE9_ROUND28_L3_BRIDGE_ERRORS_LIMITS.md`):
module canonical `server/bridge/src/errorDetail.js` đã có sẵn; đợt này
đưa nó lên web + dọn nốt các route bridge còn trả tail stderr thô +
cập nhật OpenAPI + chạy bridge server thật end-to-end qua HTTP.

## 1. Đã làm

### 1a. Web hiện errorDetail (ExportPanel.tsx — file duy nhất của web)

- Poll render đổi sang `GET /api/render/:id?detail=1` (trước đây không
  kèm query). Job không lỗi thì field `errorDetail` vắng — không đổi
  hành vi đường done/running/cancelled.
- State mới `renderErrorDetail` (type `RenderErrorDetail` nội bộ file:
  `code/summary/details/detailsOmitted/redactedTail`). Khi job lỗi:
  `renderError` vẫn lấy `data.error` cũ làm thông báo mặc định (không
  đổi), detail chỉ là khối mở rộng bên dưới: `Chi tiết lỗi [CODE]:
  summary` + tối đa 5 dòng `details` + dòng `… và N dòng lỗi khác đã
  lược bớt` khi `detailsOmitted > 0` + `<pre>` redactedTail chỉ khi
  không có dòng details nào. `renderErrorDetail` được reset về null
  cùng mọi lần reset `renderError` (bắt đầu render mới, chặn curve,
  thiếu media, nút sửa curve).
- Chuỗi UI mới (`Chi tiết lỗi […]`, `… và N dòng lỗi khác đã lược
  bớt.`) dùng chuỗi cứng tạm trong file — KHÔNG thêm key vào
  `apps/web/src/i18n/*.json` theo luật sở hữu. Luồng i18n bổ sung key
  sau rồi thay chuỗi cứng bằng key (ghi rõ ở §5).

### 1b. Route bridge còn lại trả errorDetail canonical (index.js + worker)

- `server/bridge/src/errorDetail.js`: thêm `buildTaskError({message,
  stderr, exitCode, signal})` — tách exit code từ message dạng
  `thoát mã N` / `(exit N)` / `exit N`; `error` = chuỗi ngắn đã redact
  (giữ tiền tố tên script + exit code, ≤ ~500 ký tự, giữ đầu + đuôi);
  `errorCode` enum; `errorDetail` canonical từ `buildErrorDetail`.
- `server/bridge/src/index.js`: thêm `taskErrorPayload(e, fallback)` →
  `{error, errorCode, errorDetail}` và dùng ở cả 10 catch tác vụ:
  caption (NDJSON `type:"error"`), caption/translate (NDJSON),
  reframe, reframe/analyze, beats/analyze, bgremove, silence, scene
  (NDJSON), tts, tts/clone. Phòng thủ 2 lớp: worker module đã redact
  tail ở nguồn (§1c), nhưng kể cả module nào còn sót tail thô thì
  payload ra API vẫn qua `redactStderr` ở đây.
- Khác biệt có chủ ý so với render job: route tác vụ đồng bộ trả LUÔN
  `errorCode` + `errorDetail` trong cùng payload lỗi (one-shot, không
  poll lặp, toàn bộ đã redact nên an toàn). Render job giữ nguyên luật
  đợt 28: `errorCode` luôn kèm, `errorDetail` chỉ khi `?detail=1`;
  danh sách job không bao giờ kèm detail.
- Worker module redact tail ở nguồn (thay `slice(-300)`/`slice(-500)`
  trên stderr thô bằng `redactStderr(...)` rồi mới cắt):
  caption.js (dùng chung cho caption + translate), reframe.js (2 chỗ),
  silence.js, beats.js, tts.js, bgremove.js (`stderrAll` + `stderrTail`
  đính kèm error đều đã redact), scene.js (dòng `[scene] LỖI:`).

### 1c. MCP probeVideo + render_video (ngoài bridge nhưng cùng nợ đợt 28)

- `mcp-server/src/tools/renderErrors.ts`: thêm `redactProbeStderr()`
  (dùng `redactStderr` của bridge khi load được, fallback basename-only
  khi không; tối đa 3 dòng cuối, ≤ 500 ký tự).
- `mcp-server/src/tools/export.ts` + `mcp-server/src/index.ts`: cả 2
  bản `probeVideo` đều dùng `redactProbeStderr` thay cho
  `slice(0, 500)` stderr thô.
- `mcp-server/src/index.ts` tool `render_video`: bỏ tail
  `slice(-2000)` thô, dùng `formatRenderFailure` (cùng adapter như
  `export_video` từ đợt 28).

### 1d. OpenAPI

- `server/bridge/openapi.yaml`: thêm schema `ErrorCode` (enum 8 mã),
  `ErrorDetail` (`code/summary/details/detailsOmitted/redactedTail`),
  mở rộng schema `Error` chung (thêm `errorCode` + `errorDetail` —
  mọi response lỗi 500 dùng chung schema này nên tự cập nhật),
  `RenderJob` thêm `errorCode` (luôn kèm) + `errorDetail` (chỉ khi
  `?detail=1`), `GET /api/render/{id}` thêm query `detail`, và đoạn
  quy ước lỗi có cấu trúc ở phần intro. Spec được serve trực tiếp ở
  `GET /api/openapi.json` nên sửa yaml là đủ (đã kiểm chứng qua HTTP
  ở §4).

## 2. Bảng route: xong / còn thô (trung thực)

| Đường | Trước đợt 29 | Sau đợt 29 |
|---|---|---|
| Bridge render job (`GET /api/render/:id`) | `errorCode` luôn kèm, detail chỉ `?detail=1` (đợt 28) | Không đổi luật; web nay poll `?detail=1` + hiển thị |
| Bridge caption / translate (NDJSON error) | `error` = message chứa tail thô | Canonical: `error` redact + `errorCode` + `errorDetail` |
| Bridge silence / reframe / reframe-analyze / beats / scene / bgremove / tts / tts-clone | `error` = tail stderr thô | Canonical như trên |
| MCP probeVideo (2 bản) | `slice(0, 500)` stderr thô | `redactProbeStderr` |
| MCP render_video | `slice(-2000)` stderr thô | `formatRenderFailure` đã redact |
| MCP export_video | Đã xong đợt 28 | Không đổi |
| CLI `-q` (stderr thu được) | Đã xong đợt 28 | Không đổi |
| CLI không-quiet (mặc định, `stdio: inherit`) | In stderr worker trực tiếp ra terminal | **CÒN — xem §5**. Không sửa trong đợt này. |
| Bridge `/api/proxy` | `error: e.message` thô | **CÒN THÔ — xem §5**. Ngoài danh sách route của đợt này. |
| Log server (`console.error` trong `_onError` + catch) | stderr thô | **CỐ TÌNH GIỮ** — log local của máy chạy bridge, không phải kênh API (quyết định từ đợt 28, giữ nguyên). |

## 3. Kết quả test (số thật)

- Mới `server/bridge/test/test-error-detail-ui.cjs`: **51 pass, 0
  fail** — buildTaskError trên message độc hại (mất home/token/stack/
  đường dẫn tuyệt đối, giữ basename + tiền tố script), phân loại
  FFMPEG_ERROR / MISSING_ASSET / UNKNOWN, exit code tách từ message,
  stderr riêng kiểu bgremove, kiểm tra tĩnh worker đã redact + index.js
  dùng taskErrorPayload ở đủ 10 route + chỉ còn 1 catch 500 thô
  (proxy), openapi có đủ schema, ExportPanel poll `?detail=1` + hiển
  thị detail mà vẫn giữ error cũ.
- Hồi quy: `test-error-detail.cjs` **56 pass, 0 fail**,
  `test-jobqueue.cjs` **52 pass, 0 fail**.
- `node --check`: pass cho `errorDetail.js`, `index.js` và 7 worker
  module đã sửa.
- MCP: `npm run build` (tsc) pass, exit 0 (dist build lại, gitignored,
  không đưa vào batch).
- Web: `npx tsc --noEmit` trong `apps/web` báo **2 lỗi, đều ở
  `src/lib/curveFix.ts`** (dòng 332 `reasonKey`, dòng 415 thiếu
  `changes`) — **không phải file của luồng này, luồng này không đụng
  tới**; `ExportPanel.tsx` không có lỗi tsc nào. Vite build không chạy
  vì tsc đã chặn ở file khác (luồng sở hữu curveFix cần sửa trước).
  Ghi rõ để parent không nhầm là hồi quy của đợt này.

## 4. Kiểm chứng bridge server thật end-to-end qua HTTP (đợt 28 còn nợ)

Chạy server thật (`BRIDGE_PORT` riêng, work dir tạm, ffmpeg 8.1.2):

- Job lỗi có chủ đích 1 — spec thiếu `version` (worker từ chối ở kiểm
  tra tối thiểu): `GET` không detail → có `error` cũ + `errorCode`
  `UNKNOWN`, KHÔNG có field `errorDetail`; `GET ?detail=1` → thêm
  `errorDetail` (`code: UNKNOWN`, summary + details nêu đúng lý do
  thiếu version); `GET /api/render` (danh sách) → không có
  `errorDetail`.
- Job lỗi có chủ đích 2 — spec hợp lệ, clip `src: missing.mp4` không
  có file: `?detail=1` → `error` giữ nguyên `Render worker thoát với
  mã 1.`, `errorCode`/`errorDetail.code` = `MISSING_ASSET`, summary
  `Thiếu asset/file đầu vào: 1. [clip "c1" (src: missing.mp4)] không
  tìm thấy file: <path>/missing.mp4` — đường dẫn tuyệt đối đã thành
  `<path>/basename`, không còn cây thư mục.
- Route đồng bộ qua HTTP thật với file mp4 hỏng (chỉ có header ftyp,
  không có moov): scene → event NDJSON `type:"error"` kèm `errorCode`
  `UNKNOWN` + `errorDetail`, đường dẫn file thành `<path>/corrupt.mp4`;
  silence → JSON lỗi `errorCode: FFMPEG_ERROR` + `errorDetail` với
  4 dòng details đã redact; beats → lần đầu bị rate-limit 429 (giới
  hạn chung cửa tác vụ nặng, không phải lỗi code mới), thử lại sau
  30s → JSON lỗi `errorCode: FFMPEG_ERROR` + `errorDetail` đã redact.
- `GET /api/openapi.json` từ server đang chạy → chứa schema
  `ErrorDetail` + `ErrorCode` với đủ 8 enum (xác nhận yaml mới được
  serve, không cần restart sau khi sửa yaml nhờ cache theo mtime).
- Server đã tắt sau kiểm chứng; không còn process bridge test chạy.

## 5. Chưa làm / nợ còn lại (trung thực)

- **CLI không-quiet CÒN in stderr worker thô**: `cli/src/commands/
  render.ts` dùng `stdio: "inherit"` ở chế độ mặc định nên stderr
  worker in trực tiếp ra terminal local trong lúc render, trước khi
  `CliError` có cấu trúc được ném. Đây là terminal của chính user
  chạy CLI (không phải kênh API, không tới được caller khác), nhưng
  là kẽ leak duy nhất còn lại ở đường CLI. Muốn chặn hẳn phải chuyển
  CLI sang spawn pipe + stream qua bộ lọc redact theo dòng — việc
  riêng, ngoài phạm vi đợt này (đợt 28 đã ghi nợ, đợt này xác nhận
  vẫn còn, không claim là đã hết).
- **Bridge `/api/proxy` CÒN thô**: catch duy nhất còn lại trả
  `e.message` trực tiếp. Ngoài danh sách route của đợt này
  (caption/silence/reframe/tts/beats/scene/bgremove); proxy chạy
  `generateProxy` local, message lỗi thường là lý do skip/ffmpeg —
  vẫn nên bọc `taskErrorPayload` ở đợt sau cho đồng bộ.
- **i18n**: chuỗi UI mới trong ExportPanel đang là chuỗi cứng tạm
  (`Chi tiết lỗi […]`, `… và N dòng lỗi khác đã lược bớt.`). Luồng
  i18n cần thêm key vào `apps/web/src/i18n/*.json` rồi thay chuỗi
  cứng — luồng này cố tình không đụng file i18n.
- **`tsc` web chưa xanh toàn cục** vì 2 lỗi sẵn có ở `curveFix.ts`
  (không phải file luồng này) — xem §3. ExportPanel thì sạch.
- **Giới hạn redact kế thừa từ đợt 28, vẫn đúng**: basename file vẫn
  là thông tin (tên file của caller); dòng `file nội bộ + số dòng`
  ngoài stack trace có thể còn tên file; địa chỉ con trỏ ffmpeg dạng
  `0x…` trong details là địa chỉ bộ nhớ tạm, không phải secret hay
  đường dẫn — chấp nhận giữ (đủ để đối chiếu log ffmpeg).
- `dist/` của MCP được build lại để test (gitignored, không đưa vào
  batch) — giống đợt 28 với CLI/MCP.

## 6. File đổi/thêm (tương đối từ repo root, KHÔNG gồm dist)

- `apps/web/src/ExportPanel.tsx` (sửa: poll `?detail=1` + hiển thị errorDetail)
- `server/bridge/src/errorDetail.js` (sửa: thêm `buildTaskError`)
- `server/bridge/src/index.js` (sửa: `taskErrorPayload` + 10 catch tác vụ)
- `server/bridge/src/caption.js` (sửa: redact tail)
- `server/bridge/src/reframe.js` (sửa: redact tail, 2 chỗ)
- `server/bridge/src/silence.js` (sửa: redact tail)
- `server/bridge/src/scene.js` (sửa: redact dòng `[scene] LỖI`)
- `server/bridge/src/beats.js` (sửa: redact tail)
- `server/bridge/src/tts.js` (sửa: redact tail)
- `server/bridge/src/bgremove.js` (sửa: redact tail + stderrTail)
- `server/bridge/openapi.yaml` (sửa: ErrorCode/ErrorDetail, RenderJob, query detail)
- `server/bridge/test/test-error-detail-ui.cjs` (mới)
- `mcp-server/src/tools/renderErrors.ts` (sửa: thêm `redactProbeStderr`)
- `mcp-server/src/tools/export.ts` (sửa: probeVideo redact)
- `mcp-server/src/index.ts` (sửa: probeVideo redact + render_video dùng formatRenderFailure)
- `docs/PHASE9_ROUND29_L3_ERRORDETAIL_UI_LIMITS.md` (mới, file này)

Không đụng: `apps/web/src/App.tsx`, `preview.tsx`, `LoadReportPanel.tsx`,
`apps/web/src/i18n/*.json`, validator, render worker, `job.error` cũ,
luật opt-in `?detail=1` của render job.
