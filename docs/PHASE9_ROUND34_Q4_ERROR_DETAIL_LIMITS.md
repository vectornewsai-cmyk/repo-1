# Phase 9 đợt 34, luồng Q4 — errorDetail bridge sang có cấu trúc — GIỚI HẠN

Ngày: 2026-11-01. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo. Luồng DUY NHẤT được đụng i18n trong đợt này. KHÔNG đụng seek.ts,
reverseWebcodecs.ts, previewRafHook.ts, reversePlayback.ts, scripts/*
của luồng khác.

## 0. Bối cảnh

Đợt 33 §3 mục 6 + LIMITS P4 đợt 32 §3.1 để lại nợ: errorDetail của
bridge chỉ có `code` có cấu trúc, còn `summary`/`details` nhúng dòng
stderr thô (ffmpeg tiếng Anh, validator tiếng Việt, tên file đã
redact). Dịch riêng vài câu đóng khung ở tầng web sẽ cho UI nửa dịch
nửa thô. Đợt này làm đúng cách sửa mà P4 đã chỉ ra: bridge phát thêm
`summaryKey` + `summaryParams`, web dịch khung câu theo key qua i18n.

## 1. Contract mới (ADDITIVE — không có điểm vỡ)

Payload errorDetail nay là:

```json
{
  "code": "SPEED_CURVE_VIOLATION",
  "summary": "Vi phạm speed-curve: 1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)",
  "summaryKey": "speedCurveViolation",
  "summaryParams": { "clip": "tracks[0].clips[0]", "field": "speedKeyframes.keyframes[0].v", "range": "0.25..4", "value": "5" },
  "details": ["1. [tracks[0].clips[0]] speedKeyframes.keyframes[0].v phải trong 0.25..4 (nhận được: 5)"],
  "detailsOmitted": 0,
  "redactedTail": ""
}
```

- KHÔNG field nào bị đổi tên, đổi kiểu hay bỏ đi; `summary` cũ giữ
  nguyên từng chữ (khóa bằng test cũ + test mới). Vì vậy:
  - Consumer cũ + payload mới: KHÔNG vỡ. `formatErrorDetail`
    (CLI/MCP) chỉ đọc code/summary/details nên bỏ qua 2 field mới,
    output in ra không đổi dạng (khóa bằng test).
  - Consumer mới + payload cũ (thiếu summaryKey): KHÔNG vỡ. Web
    fallback về summary thô (khóa bằng test: payload cũ, key lạ,
    thiếu param, detail rỗng đều về summary thô).
  - `publicJob` mặc định vẫn KHÔNG kèm errorDetail; `?detail=1` mới
    kèm, và kèm nguyên 2 field mới (luật opt-in cũ không đổi).
  - `jobQueue` không cần sửa: nó lưu nguyên object errorDetail nên
    2 field mới tự đi qua persist/retry (retry vẫn reset cả detail).
  - Route tác vụ đồng bộ (`buildTaskError`) lộ cùng contract vì nó
    đi qua `buildErrorDetail`.
- 13 summaryKey (export `ERROR_SUMMARY_KEYS` từ errorDetail.js để
  test khóa, không hardcode ở 2 nơi):

  | summaryKey | params | mức dịch |
  |---|---|---|
  | speedCurveViolation | clip, field, range, value (parse từ dòng validator) | dịch trọn khung |
  | speedCurveViolationRaw | detail (dòng thô, khi không parse được) | dịch khung, giữ dòng dữ liệu |
  | missingAsset | asset (tên trong ngoặc kép) | dịch trọn khung |
  | missingAssetRaw | detail (dòng thô, vd ffmpeg "No such file") | dịch khung, giữ dòng dữ liệu |
  | specValidation | detail (dòng validator) | dịch khung, giữ dòng dữ liệu |
  | outputQa | detail (dòng QA đã tách tiền tố) | dịch khung, giữ phần dữ liệu |
  | workerStart | detail (thông điệp spawn đa dạng) | passthrough `{detail}` |
  | workerExitNoOutput | (không param) | dịch trọn vẹn |
  | workerExitSignal | signal | dịch trọn vẹn |
  | workerExitCode | exitCode (string) | dịch trọn vẹn |
  | ffmpegError | detail (dòng ffmpeg, thường đã là tiếng Anh) | dịch khung, giữ dòng dữ liệu |
  | unknownDetail | detail (dòng lạ) | passthrough `{detail}` |
  | unknown | (không param) | dịch trọn vẹn |

## 2. Đã làm

- `server/bridge/src/errorDetail.js`: mọi nhánh `classifyRenderError`
  kèm summaryKey + summaryParams (toàn string, đã redact vì lấy từ
  chuỗi đã redact); `buildErrorDetail` lộ 2 field ra ngoài (trước đây
  nó liệt kê field tường minh nên 2 field mới đã từng bị chặn ở đây
  — đã vá và khóa bằng test); `formatErrorDetail` CỐ TÌNH không đổi
  (CLI/MCP không có hệ i18n, in summary thô như cũ).
- `apps/web/src/i18n/vi.json` + `en.json`: thêm section
  `errorDetail.summary` với đủ 13 key cả hai bên → parity
  **vi = en = 931 key lá** (918 cũ + 13 mới), **0 key mồ côi**.
  Suite mới khóa cả hai chiều: mọi key bridge phát ra đều có
  template ở cả vi lẫn en, và mọi template đều được phát ra bởi
  ít nhất 1 fixture (không template thừa).
- `apps/web/src/lib/errorDetailSummary.ts` (mới, hàm thuần):
  `localizedErrorSummary(detail, t)` — dịch qua
  `errorDetail.summary.<summaryKey>`; fallback về summary thô khi:
  payload cũ (không key), key lạ, còn sót `{var}` (thiếu param),
  kết quả rỗng hoặc kết thúc lửng bằng ":" (param detail rỗng).
- `apps/web/src/ExportPanel.tsx`: `RenderErrorDetail` thêm 2 field
  optional; dòng summary render qua `localizedErrorSummary` thay vì
  in `summary` thô. `details`/`redactedTail` vẫn in nguyên văn như
  trước — chúng là dữ liệu, không phải chuỗi UI.
- `cli/src/renderErrors.ts` + `mcp-server/src/tools/renderErrors.ts`:
  interface thêm 2 field optional + export mới `buildRenderErrorDetail`
  (passthrough mỏng sang bridge; fallback khi module bridge không
  load được trả summaryKey `"unknown"` — CLI/MCP vẫn không dịch vì
  không có hệ i18n, chỉ lộ field cho caller cần). `formatRenderFailure`
  không đổi.
- `server/bridge/openapi.yaml`: schema ErrorDetail thêm summaryKey +
  summaryParams (mô tả additive + liệt kê 13 key).
- Test (xem §3): suite mới `test-error-detail-structured.cjs`,
  section [e] mới trong `test-error-detail.cjs`, cập nhật assertion
  tĩnh trong `test-error-detail-ui.cjs` (literal
  `{renderErrorDetail.summary}` cũ → `localizedErrorSummary(...)`),
  test web mới `errorDetail34Q4.test.ts`, cập nhật 2 test parity
  hardcode 918 → 931 (`structuredNotes32`, `saveToast31`) + 1 dòng
  exclude tsconfig cho test web mới.

## 3. Kết quả kiểm chứng (chạy thật, 01/11/2026)

- `test-error-detail.cjs`: **64 pass, 0 fail** (56 cũ + 8 mới Q4).
- `test-error-detail-structured.cjs` (mới): **150 pass, 0 fail** —
  ma trận đủ 13 key + params đúng từng field, i18n vi/en 931 key
  0 mồ côi hai chiều, placeholder template ⊆ params, publicJob
  opt-in, consumer cũ, payload cũ, bridge thật qua HTTP
  (`/api/proxy?detail=1` → summaryKey `ffmpegError`, không rò
  đường dẫn tuyệt đối), CLI thật qua dist (buildRenderErrorDetail
  + render clip corrupt thật → exit 1, stderr vẫn `[FFMPEG_ERROR]`,
  khối lỗi không rò work dir/home, không nhắc summaryKey),
  MCP thật qua dist (summaryKey/params đúng).
- `test-error-detail-ui.cjs`: **52 pass, 0 fail** (sau khi cập nhật
  assertion tĩnh theo contract mới; trước cập nhật nó fail đúng 1
  mục vì literal cũ đã được thay bằng localizedErrorSummary).
- `test-error-detail-cli-proxy.cjs`: **25 pass, 0 fail**.
- `test-error-detail-cli-caption-tts.cjs`: **27 pass, 0 fail**.
- Web: `errorDetail34Q4.test.ts` **35 pass, 0 fail**;
  `structuredNotes32` **12 pass, 0 fail**; `saveToast31`
  **15 pass, 0 fail**.
- `node --check` errorDetail.js/publicJob.js pass; openapi.yaml parse
  được (PyYAML).
- CLI (`cli/`) và MCP (`mcp-server/`) đã build lại bằng tsc để test
  qua dist thật; dist là output build, KHÔNG đưa vào batch.
- esbuild transform ExportPanel.tsx + errorDetailSummary.ts pass
  (cú pháp/JSX OK).

## 4. Chưa làm / giới hạn trung thực

1. **tsc toàn project CHƯA về 0 — nhưng 0 lỗi nào thuộc Q4.**
   `npx tsc --noEmit` (apps/web) còn 3 lỗi, tất cả ở
   `src/lib/reverseWebcodecs.ts` (TS6133 `lastDecodeRange` thừa,
   TS2322 `Promise<boolean>` vs `Promise<void>`, TS2531 possibly
   null) — file của luồng khác trong đợt 34, brief Q4 cấm đụng nên
   Q4 KHÔNG sửa. File của Q4 (ExportPanel, errorDetailSummary,
   test web mới, renderErrors CLI/MCP) không có lỗi tsc nào.
2. **vite build CHƯA pass — cũng vì file luồng khác.**
   `npx vite build` (apps/web) fail tại
   `src/preview.tsx:2282` — symbol `engine` khai báo trùng
   (preview.tsx đang được luồng khác sửa dở trong đợt 34, Q4 không
   đụng). Vì vậy wiring ExportPanel chưa được khóa bằng vite build
   mà bằng tsc (0 lỗi ở file Q4) + esbuild transform pass. Parent
   chạy lại vite build sau khi luồng preview chốt.
3. **Dịch chưa trọn vẹn theo nghĩa đen:** chỉ khung câu đóng
   (exit code, signal, no-output, curve parse được, asset có tên)
   mới dịch trọn vẹn. Các dòng validator/ffmpeg/QA/spawn đa dạng
   vẫn là dữ liệu tiếng Việt/Anh thô trong `details` và trong phần
   `{detail}` của template — đúng như cảnh báo của P4: dịch nửa vời
   bằng template sẽ tệ hơn giữ nguyên. Muốn dịch trọn vẹn nhóm này
   cần validator/QA phát mã lỗi riêng có tham số (không phải chuỗi
   câu), đó là việc của tầng render worker, ngoài phạm vi đợt này.
   LIMITS này không claim "đã dịch xong errorDetail".
4. **CLI/MCP vẫn in summary thô** (không dịch): 2 consumer này
   không có hệ i18n; dịch ở đó cần thêm hạ tầng locale cho CLI/MCP,
   ngoài phạm vi. Chúng đã lộ đủ summaryKey/params để đợt sau dịch
   được mà không đổi contract bridge nữa.
5. **Không có click-test browser mới cho Q4**: subagent không có
   live-browser delegation; wiring web khóa bằng test Node thuần +
   tsc + esbuild transform (xem mục 2). Người dùng đổi ngôn ngữ
   sang en sẽ thấy khung tóm tắt dịch ngay khi bridge mới trả
   summaryKey; payload bridge cũ vẫn hiển thị summary thô như trước.
6. **Một assertion đã phải sửa cho đúng bản chất trong lúc test:**
   ở test CLI thật, stderr render chứa dòng echo đường dẫn output
   do chính user truyền (`[vcut] render … → <output>`) — đó không
   phải leak từ stderr worker nên assertion đã thu hẹp về khối lỗi
   (`Lỗi: Render thất bại…` trở đi) + kiểm tra home dir riêng, thay
   vì cấm mọi đường dẫn tuyệt đối trong toàn bộ stderr. Ghi rõ ở
   đây để không ai hiểu nhầm là nới lỏng redact.

## 5. File đổi/thêm (tương đối từ repo root)

- `server/bridge/src/errorDetail.js` (summaryKey/summaryParams mọi
  nhánh + lộ qua buildErrorDetail + export ERROR_SUMMARY_KEYS)
- `server/bridge/openapi.yaml` (schema ErrorDetail: 2 field mới)
- `server/bridge/test/test-error-detail.cjs` (thêm section [e] Q4)
- `server/bridge/test/test-error-detail-structured.cjs` (mới, 150 test)
- `server/bridge/test/test-error-detail-ui.cjs` (cập nhật assertion
  tĩnh theo contract mới)
- `apps/web/src/i18n/vi.json` (+13 key errorDetail.summary)
- `apps/web/src/i18n/en.json` (+13 key errorDetail.summary)
- `apps/web/src/lib/errorDetailSummary.ts` (mới)
- `apps/web/src/lib/errorDetail34Q4.test.ts` (mới, 35 test)
- `apps/web/src/ExportPanel.tsx` (interface + render qua
  localizedErrorSummary)
- `apps/web/src/lib/structuredNotes32.test.ts` (parity 918 → 931)
- `apps/web/src/lib/saveToast31.test.ts` (parity 918 → 931)
- `apps/web/tsconfig.json` (exclude test web mới)
- `cli/src/renderErrors.ts` (interface + buildRenderErrorDetail)
- `mcp-server/src/tools/renderErrors.ts` (interface +
  buildRenderErrorDetail)
- `docs/PHASE9_ROUND34_Q4_ERROR_DETAIL_LIMITS.md` (mới, file này)

Không đụng: `server/bridge/src/index.js`, `server/bridge/src/jobQueue.js`
(không cần sửa — passthrough nguyên object), `preview.tsx`,
`seek.ts`, `reverseWebcodecs.ts`, `previewRafHook.ts`,
`reversePlayback.ts`, `scripts/*`, code của luồng khác. Không push,
không tag, không binary, không file paths-loop (parent lo stage).
