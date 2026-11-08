# LIMITS — Phase 9 đợt 62, luồng R5: giao thức mã lỗi bridge→web

Đóng nợ: `docs/PHASE9_ROUND61_R6_SERVER_LITERALS_LIMITS.md` §4.1 — bridge/server
user-facing chưa nối i18n (server không có hạ tầng `t()`).

## §1. Kiểm kê lại (tokenizer port từ R6, `apps/web/src/lib/i18nServerLiterals61R6.test.ts`)

Số trong brief nhiệm vụ ("~109 bridge + ~24 jobQueue") là ước lượng cũ; đếm
chính xác bằng tokenizer R6 (đã chạy lại 08/11):

| File | Tổng literal VI | API_ERROR | OTHER | LOG |
|---|---|---|---|---|
| `server/bridge/src/index.js` | 139 | 85 → **86**¹ | 6 → **5**¹ | 48 |
| `server/bridge/src/jobQueue.js` | 26 | 12 | 10 | 4 |

¹ Đợt này sửa 1 lỗi phân loại của R6: literal `LIMIT_FILE_SIZE` ở
`multerErrorHandler` (index.js L283) trước đây bị đếm là OTHER vì nằm trong
nhánh `if/else` không nhận diện được; sau khi restructure if/else để nối
`UPLOAD_FILE_TOO_LARGE`, classifier mới (`codedError(`/`apiError(` là tín
hiệu API_ERROR) đếm đúng: API_ERROR 85→86, OTHER 6→5, tổng vẫn 139.
Test R6 đã cập nhật snapshot tương ứng, 4/4 pass.

**Kết quả nối: 91 mã** (xem §3) — bao phủ toàn bộ API_ERROR user-facing của
bridge (index.js 86 + jobQueue 12, trừ các mã jobQueue nội bộ được map, xem
§3.2) cộng validator của 6 module task. Các literal LOG (48 + 4) chỉ log
server, không trả UI — giữ nguyên theo phạm vi.

## §2. Giao thức (đã triển khai, chạy thật end-to-end)

### Shape — mẫu errorDetail.js đợt 28/34: field cũ giữ, field mới cộng thêm

```json
{ "error": "<chuỗi VI cũ, giữ nguyên từng chữ>",
  "errorCode": "<SCREAMING_SNAKE, ổn định>",
  "errorParams": { "<tên>": "<string>" } }
```

- `error` = chuỗi cũ byte-identical → client cũ (không biết mã) hiển thị
  như trước, không hồi quy.
- `errorCode` = mã trong catalog; `errorParams` chỉ kèm khi có tham số, toàn
  string (tên file, số, đuôi file, reason đã redact ở nguồn — KHÔNG bao giờ
  chứa đường dẫn tuyệt đối, token, stack trace).
- Web mới: có code hợp lệ → dịch qua dict `bridgeErrors.<CODE>`; code lạ /
  thiếu code → hiển thị `error` như cũ.

### Ba nơi khóa 1:1:1 (test `bridgeErrors62R5.test.ts` khóa, 9/9)

1. **Server** — `server/bridge/src/errorCodes.js` (mới): `BRIDGE_ERROR_CODES`
   (code → danh sách tên tham số) + helpers `apiError(code, message,
   params)`, `apiErrorFrom(err, fallbackMessage?, fallbackCode?,
   fallbackParams?)`, `codedError(code, message, params)`,
   `isBridgeErrorCode`.
2. **Web** — `apps/web/src/lib/bridgeErrors.ts` (mới): `BRIDGE_ERROR_CODES`
   + `resolveBridgeApiError(body, t, fallback, opts?)`.
3. **Fragment i18n** — `~/workspace/goals/capcut-clone-video-editor/hidden_files/round62-r5-fragment.json`:
   91 key `bridgeErrors.*` vi/en (vi≠en tất cả, placeholder khớp catalog,
   không đụng dict 2044 hay fragment khác). **CHƯA gộp vào vi.json/en.json —
   parent gộp sau** (xem §7).

### Quy ước mã

- Không trùng mã phân loại render của errorDetail.js
  (`SPEED_CURVE_VIOLATION`, `MISSING_ASSET`, `SPEC_VALIDATION`,
  `OUTPUT_QA`, `WORKER_START`, `WORKER_EXIT`, `FFMPEG_ERROR`, `UNKNOWN`) —
  hai họ mã đi chung field `errorCode` ở payload khác nhau (job vs API)
  nên phải phân biệt được.
- Mã jobQueue đã có (`QUEUE_FULL`, `NOT_FOUND`, `BAD_STATE`, `GONE`) được
  MAP sang mã catalog ở route index.js, không đổi code gốc của jobQueue
  (CLI/MCP khác có thể đang dựa vào chúng).
- `apiErrorFrom`: error có code → lấy code+params của nó; error thường →
  dùng fallback code nếu caller cho, còn không thì chỉ trả `{ error }` —
  **không bịa mã**.
- Validator throw bằng `codedError(code, message, params)`: message giữ
  nguyên chuỗi cũ từng chữ (client cũ + log không đổi).

### Resolver web — `resolveBridgeApiError(body, t, fallback, opts?)`

Thứ tự ưu tiên: (1) mã bridgeErrors → `t("bridgeErrors."+code, params)`,
có guard (key trả về nguyên / còn `{var}` / rỗng / kết bằng `:` thì rơi
xuống); (2) `errorDetail.summaryKey` qua `localizedErrorSummary` có sẵn
(trừ khi `opts.useErrorDetailSummary === false`); (3) `error` thô;
(4) fallback của caller. Params ép về string phòng thủ.

**Ngoại lệ poll render (ExportPanel):** poll truyền
`{ useErrorDetailSummary: false }` vì detail panel đã hiển thị summary —
dòng lỗi chính chỉ dịch mã bridgeErrors (vd job phục hồi sau restart),
còn lỗi render-worker vẫn hiển thị `error` cũ. SSE (Caption/Scene) dùng
resolver với summary path bật (không có detail panel riêng ở đó).

**Render-create 429 reorder:** ExportPanel nay đọc body trước rồi resolve;
chỉ rơi về `exportPanel.bridgeBusy` khi 429 không có code (để
`RATE_LIMITED`/`QUEUE_FULL` dịch đúng thay vì chuỗi busy chung).

## §3. 91 mã đã nối — route + status

### 3.1 Rate limit / upload — `index.js` (rateLimit, multerErrorHandler, uploadMiddleware)

| Mã | Route | Status |
|---|---|---|
| `RATE_LIMITED` | mọi route `/api/` (global) + route render | 429 (+ header `Retry-After`) |
| `UPLOAD_FILE_TOO_LARGE` | multer `LIMIT_FILE_SIZE` | 413, param `limitMb` |
| `UPLOAD_TOO_MANY_FILES` | multer `LIMIT_FILE_COUNT` (tối đa 200) | 413 |
| `UPLOAD_INVALID` | multer lỗi khác | 413 |
| `UPLOAD_TOTAL_TOO_LARGE` | tổng upload > giới hạn | 413, param `limitMb` |

### 3.2 Job — `index.js` + `jobQueue.js` (map ở route, không đổi code gốc)

| Mã | Route / nguồn | Status |
|---|---|---|
| `INVALID_JOB_ID` | `validateJobIdParam` (mọi route `:id`) | 400 |
| `JOB_NOT_FOUND` | GET/DELETE/retry render; jobQueue `NOT_FOUND` → map | 404 |
| `JOB_NOT_DONE` | GET output khi job chưa xong | 409, param `status` |
| `JOB_CANCEL_BAD_STATE` | DELETE render khi job đã ở trạng thái cuối | 409, param `status` |
| `JOB_RETRY_BAD_STATE` | POST retry, jobQueue `BAD_STATE` (không phải cancelled) | 409, param `status` |
| `JOB_RETRY_CANCELLED` | POST retry, `BAD_STATE` với `status=cancelled` | 409, param `status` |
| `JOB_GONE` | POST retry, jobQueue `GONE` | 409 |
| `JOB_SPEC_MISSING_AFTER_RESTART` | jobQueue `recover()`: job queued thiếu spec sau restart | (trong job đã phục hồi) |
| `JOB_INTERRUPTED_BY_RESTART` | jobQueue `recover()`: job đang chạy bị restart cắt ngang | (trong job đã phục hồi) |
| `QUEUE_FULL` | jobQueue `enqueue` (`maxQueue`, env `BRIDGE_MAX_QUEUE`) | 429, param `maxQueue` |

`BAD_ID`/`DUP_ID` của jobQueue không tới được API (id do server sinh) —
giữ nguyên, không map. Fallback cuối của route retry (`{ error: e.message }`
không code, index.js L1555) chỉ chạy với lỗi jobQueue lạ chưa từng thấy —
cố ý không bịa mã.

### 3.3 Tạo render job — POST `/api/render`

| Mã | Status | Ghi chú |
|---|---|---|
| `MISSING_SPEC` | 400 | thiếu field `spec` |
| `SPEC_TOO_LARGE` | 413 | param `limitMb` |
| `ASSETMAP_NOT_OBJECT` / `ASSETMAP_BAD_VALUE` (`key`) / `ASSETMAP_INVALID` (`detail`) | 400 | `ASSETMAP_INVALID` là fallback khi `JSON.parse` assetMap lỗi, giữ tiền tố `assetMap không hợp lệ: …` |
| `SPEC_NOT_JSON` / `SPEC_NO_TRACKS` | 400 | |
| `DISK_LOW` | 507 | param `freeMb` |
| `JOB_CREATE_FAILED` | 500 | lỗi máy chủ khi tạo job |
| `QUEUE_FULL` | 429 | xem §3.2 |

### 3.4 Export preset — `parsePreset` (index.js)

`PRESET_NOT_JSON`, `PRESET_NOT_OBJECT`, `PRESET_CRF_RANGE`,
`PRESET_X264_INVALID` (param `allowed` — danh sách x264 preset),
`PRESET_BITRATE_RANGE`, `PRESET_NORMALIZE_INVALID`,
`PRESET_NORMALIZE_TARGET_RANGE`, `PRESET_NORMALIZE_TP_RANGE`,
`PRESET_NORMALIZE_LRA_RANGE` — tất cả 400, throw `codedError` từ
validator, route bắt qua `apiErrorFrom`.

### 3.5 Tên file / magic bytes — `sanitizeFilename`, `checkMagicBytes`

`INVALID_FILENAME` (`name`), `INVALID_FILENAME_OR_TYPE` (`name`),
`MAGIC_TOO_SMALL` (`name`), `MAGIC_MISMATCH` (`name`, `ext`),
`MAGIC_UNREADABLE` (`name`) — tất cả 400. Magic rules đã khóa bằng test:
`.mp4` cần `ftyp` ở byte 4–12; `.wav` cần RIFF+WAVE; `.png` cần
`0x89 'PNG'`. `checkMagicBytes` nay trả `{ code, message, params }`
thay vì throw string.

### 3.6 Lưu file / spec / đọc output

`SAVE_FILE_FAILED` (500), `SAVE_SPEC_FAILED` (500), `READ_OUTPUT_FAILED`
(500, GET output).

### 3.7 Tác vụ — thiếu file / sai loại file (400)

`MISSING_MEDIA`, `MISSING_VIDEO`, `MISSING_AUDIO_VIDEO`,
`CAPTION_NEEDS_AV`, `TRANSLATE_NEEDS_AV`, `SILENCE_NEEDS_AV`,
`REFRAME_NEEDS_VIDEO` / `SCENE_NEEDS_VIDEO` / `BGREMOVE_NEEDS_VIDEO` /
`BEATS_NEEDS_AV` (param `exts`).

### 3.8 Tác vụ chưa sẵn sàng — model/script thiếu (503, param `reason`)

`CAPTION_NOT_READY`, `REFRAME_NOT_READY`, `BEATS_NOT_READY`,
`BGREMOVE_NOT_READY`, `SILENCE_NOT_READY`, `SCENE_NOT_READY`,
`TRANSLATE_NOT_READY`, `TTS_NOT_READY`. `reason` là dữ liệu (vd
`Không tìm thấy beat.py (…)`), không phải mã.

### 3.9 Validator tham số — throw `codedError` ở module tương ứng (400)

- caption.js: `UNSUPPORTED_LANG` (`lang`, `langs`), `UNSUPPORTED_TARGET_LANG`
  (`lang`, `langs`). `CAPTION_LANGS` = vi, en, auto, zh, ja, ko, th, id, ms,
  fr, de, es.
- reframe.js: `UNSUPPORTED_ASPECT` (`aspect`, `aspects`).
- tts.js: `TTS_TEXT_EMPTY`, `TTS_TEXT_TOO_LONG` (`length`, `max`),
  `TTS_REF_AUDIO_MISSING`, `TTS_REF_AUDIO_TOO_LARGE` (`sizeMb`),
  `TTS_REF_AUDIO_TYPE` (`exts`), `UNSUPPORTED_VOICE` (`voice`, `voices`).
- bgremove.js: `BGREMOVE_SESSION_FORBIDDEN` (`session`, `fallback`),
  `BGREMOVE_SESSION_INVALID` / `BGREMOVE_TEMPORAL_INVALID` /
  `BGREMOVE_FEATHER_INVALID` (`value`). `DEFAULT_SESSION` =
  `birefnet-general`.
- silence.js: `SILENCE_NOISE_INVALID` / `SILENCE_MINDUR_INVALID`
  (`min`, `max`, `value`). Noise dB [-80, 0], minDur [0.1, 10].
- scene.js: `SCENE_THRESHOLD_INVALID` (`value`, `min`, `max`, `def`),
  `SCENE_START_INVALID` / `SCENE_END_INVALID` (`value`),
  `SCENE_RANGE_INVALID`. Threshold [0.05, 0.95], mặc định 0.4.
- beats (index.js): `BPM_INVALID` (`value`), `BPM_RANGE_INVALID`.
  Lưu ý: beats validate BPM **sau** avail check — test e2e cần stub
  `BEATS_PY` hợp lệ mới tới được validator.

### 3.10 TTS chạy xong / chuẩn bị

`TTS_NO_WAV` (500), `TTS_PREPARE_FAILED` (500).

### 3.11 Proxy / LUT / API chung

`PROXY_MISSING_FILE` (400), `PROXY_BAD_HEIGHT` (400),
`PROXY_INVALID_NAME` (400), `PROXY_NOT_FOUND` (404),
`INVALID_LUT_ID` (400), `LUT_NOT_FOUND` (404), `API_NOT_FOUND` (404),
`INTERNAL_ERROR` (500, global handler), `OPENAPI_READ_FAILED` (500).

## §4. Web đã nối (resolver ở mọi chỗ đọc `error` của bridge)

| File | Chỗ nối |
|---|---|
| `apps/web/src/ExportPanel.tsx` | reframe analyze, reframe, render create, render poll (poll opt-out summary, §2) |
| `apps/web/src/components/CaptionModal.tsx` | HTTP + SSE (`NdjsonEvent` mở rộng `errorCode`/`errorParams`/`errorDetail`) |
| `apps/web/src/components/SceneModal.tsx` | HTTP + SSE (như trên) |
| `apps/web/src/components/BgRemovePanel.tsx` | HTTP |
| `apps/web/src/components/BeatSyncModal.tsx` | HTTP |
| `apps/web/src/components/SilenceModal.tsx` | HTTP |
| `apps/web/src/MediaBin.tsx` | proxy create ×2 |
| `apps/web/src/components/TtsButton.tsx` | HTTP |
| `apps/web/src/components/onboarding/TemplatePackModal.tsx` | HTTP |

Không thêm literal VI mới ở các file đã quét; mọi `t()` fallback cũ giữ
nguyên. `tsc` web 0 lỗi, `vite build` pass (5.81s).

## §5. Kiểm chứng (số thật, chạy 08/11)

| Suite | Kết quả |
|---|---|
| Web `bridgeErrors62R5.test.ts` (khóa 3 chiều, resolver vi/en, backward-compat, errorDetail path, poll opt-out) | **9/9** |
| Bridge unit `test-bridge-error-protocol.cjs` (catalog/helpers, validator giữ nguyên message cũ, jobQueue QUEUE_FULL/retry/recover) | **95/95** |
| Bridge e2e HTTP `test-bridge-error-protocol-e2e.cjs` (2 bridge thật: A `BRIDGE_MAX_QUEUE=0` + stub beats; B `BEATS_PY` trỏ path không tồn tại + budget 4; ~30 case incl. rate limit + Retry-After; resolver web thật trên payload live, assert chuỗi vi/en cuối) | **138/138** |
| R6 census `i18nServerLiterals61R6.test.ts` | **4/4** |
| P7 audit `i18nAudit59P7.test.ts` (dict vẫn 2044 — fragment chưa gộp) | **8/8** |
| Orphans `i18nOrphans60Q4.test.ts` | **16/16** |
| errorDetail `errorDetail34Q4.test.ts` | **35/35** |
| Bridge hồi quy: jobqueue, error-detail, error-detail-cli-caption-tts, error-detail-cli-proxy, caption, reframe, reframe-analyze, scene, silence, translate, progress, p7-queue-persist, bgremove-fallback, bgremove-smooth | **pass hết** |
| errorDetail structured `test-error-detail-structured.cjs` | **150/150** (xem §6.1) |
| errorDetail UI `test-error-detail-ui.cjs` | **52/52** (xem §6.1) |
| CLI `test-cli.sh` | **21/21** |
| `tsc` web / desktop / mcp-server / cli | **0 / 0 / 0 / 0** |
| `vite build` web | **pass** |

E2E chạy trên Node v24.22.1 (global fetch/FormData/Blob). Instance A cần
nới limiter (`BRIDGE_RATE_RENDER=1000`, `BRIDGE_RATE_GENERAL=1000`) vì
~35 request vượt RATE_MAX_RENDER mặc định 20/phút — đó là cấu hình test,
không phải hành vi test.

## §6. Chưa nối / nợ mở (trung thực)

### 6.1 Hai test error-detail đã stale từ trước, đã sửa assertion (giữ nguyên intent)

- `test-error-detail-structured.cjs`: khóa dict 931 key lá ("918 + 13 mới",
  đợt 34) — dict nay 2044 (P7 khóa). Đổi 931→2044, khóa chính vẫn là P7.
- `test-error-detail-ui.cjs`: assert `setRenderError(data.error ||
  "Render thất bại (không rõ lý do).")` — chuỗi đó đã chuyển thành
  `t("errorDetail.summary.unknown")` từ đợt sau đó nên assert đã fail
  trước đợt này. Đổi sang assert resolver giữ đúng fallback
  (`resolveBridgeApiError(data, t, t("errorDetail.summary.unknown"),
  { useErrorDetailSummary: false })`).
- Cả hai đều fail trước khi R5 động vào (xác minh: vi.json/en.json không
  bị R5 sửa; ExportPanel trước R5 đã dùng `t(...)` thay vì literal).
  Không sửa hành vi sản phẩm, chỉ cập nhật snapshot/assertion theo tiền
  lệ P8/R6.

### 6.2 Không nối trong đợt này (ghi rõ, không giấu)

- **10 chuỗi fallback của `taskErrorPayload`** ("Caption thất bại." v.v.
  trong index.js) — chỉ dùng khi chính `buildTaskError` throw; lỗi chạy
  tác vụ thật đi qua giao thức errorDetail đã có (summaryKey/params),
  không qua đây.
- **SSE phase labels** (caption/scene `PHASE_LABELS`, index.js L1336–1337)
  — nhãn tiến độ, không phải lỗi.
- **Lỗi chạy worker-module** bên trong caption/reframe/tts/bgremove/
  silence/scene — chảy qua giao thức errorDetail classification có sẵn
  (đợt 28/34), không đổi.
- **`render/validate.js` — 159 literal**: các dòng detail của validator
  là dữ liệu; khung summary đã dịch qua errorDetail. Nối từng dòng detail
  là việc riêng, chưa làm.
- **`mcp-server/validate.ts` — 89 literal + lỗi `cli/`**: MCP/CLI không có
  hạ tầng i18n; CLI in summary thô theo thiết kế. Hồi quy MCP tsc 0 +
  CLI test 21/21 vẫn xanh.
- **`apps/desktop/src/preload.ts` — 1 literal**: `"Dữ liệu file qua IPC
  không phải bytes."` — vẫn nợ, cần plumbing lang từ renderer sang
  preload, ngoài phạm vi đợt này, KHÔNG đụng.
- **`.github/workflows/ci-security.yml` vẫn 403** khi push (App thiếu quyền
  workflows:write) — nợ cũ từ trước, không thuộc đợt này; repo vẫn chưa
  có CI chạy thật.

### 6.3 Quirk phát hiện khi test e2e (có sẵn, ngoài phạm vi — KHÔNG sửa)

- **Rate limiter dùng chung 1 Map bucket theo IP**: `rateLimit()` global
  (`RATE_MAX_GENERAL`) và per-route (`RATE_MAX_RENDER`, và silence dùng
  `RATE_MAX_GENERAL` làm route limiter) chia sẻ cùng `rateBuckets` — 1
  request đi qua 2 middleware đếm 2 lần vào cùng budget. E2E đã tính
  đúng quirk này (budget B=4: health poll 1 + beats POST 2 + health 1
  OK, health tiếp → 429). Hành vi giới hạn vẫn đúng (chỉ đếm thừa),
  không sửa trong đợt này.
- **`server/beats/beat.py` TỒN TẠI** (find cũ của R5 bỏ sót do `-o`
  precedence) — beats sẵn sàng theo mặc định. Test `BEATS_NOT_READY`
  live phải trỏ `BEATS_PY` sang path không tồn tại (e2e đã làm vậy).

## §7. Bảo trì fragment (quan trọng — đọc trước khi gộp)

- Fragment `round62-r5-fragment.json` (91 key `bridgeErrors.*`) nằm ở
  `hidden_files/`, **parent gộp vào vi.json/en.json**. Sau khi gộp:
  1. Dict lên 2044 + 91 = **2135 key** — cập nhật khóa P7
     (`i18nAudit59P7.test.ts`) và khóa 2044 ở
     `test-error-detail-structured.cjs` (§6.1) lên 2135.
  2. **Đảo assertion trong `bridgeErrors62R5.test.ts`**: test hiện assert
     91 key "chưa có trong dict" (pre-merge). Sau gộp phải assert ngược
     lại (đã có trong dict) — nếu không test sẽ fail.
  3. Kiểm tra không key nào trong fragment trùng key dict hiện có (test
     R5 đã kiểm pre-merge; kiểm lại sau gộp bằng P7 audit).
- Thêm mã mới sau này: thêm vào cả 3 nơi (catalog server, tập mã web,
  fragment/dict) — test khóa 3 chiều sẽ bắt lệch ngay.

## §8. File thay đổi (batch stage `phase9-round62-r5-bridge-errors.txt`)

Server (mới): `server/bridge/src/errorCodes.js`,
`server/bridge/test/test-bridge-error-protocol.cjs`,
`server/bridge/test/test-bridge-error-protocol-e2e.cjs`.
Server (sửa): `server/bridge/src/index.js`, `jobQueue.js`, `caption.js`,
`reframe.js`, `tts.js`, `bgremove.js`, `silence.js`, `scene.js`;
`server/bridge/test/test-error-detail-structured.cjs`,
`server/bridge/test/test-error-detail-ui.cjs` (chỉ cập nhật assertion stale,
§6.1).
Web (mới): `apps/web/src/lib/bridgeErrors.ts`,
`apps/web/src/lib/bridgeErrors62R5.test.ts`.
Web (sửa): `apps/web/src/ExportPanel.tsx`,
`apps/web/src/components/CaptionModal.tsx`,
`apps/web/src/components/SceneModal.tsx`,
`apps/web/src/components/BgRemovePanel.tsx`,
`apps/web/src/components/BeatSyncModal.tsx`,
`apps/web/src/components/SilenceModal.tsx`, `apps/web/src/MediaBin.tsx`,
`apps/web/src/components/TtsButton.tsx`,
`apps/web/src/components/onboarding/TemplatePackModal.tsx`,
`apps/web/src/lib/i18nServerLiterals61R6.test.ts` (classifier + snapshot).
Doc này. Fragment KHÔNG nằm trong batch (ở `hidden_files/`, parent gộp).
