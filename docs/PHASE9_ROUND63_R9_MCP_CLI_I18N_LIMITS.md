# LIMITS — Phase 9 đợt 63, luồng R9: mã lỗi ổn định MCP/CLI + i18n preload + runner/webglLut

Đóng nợ: đợt 62 R5 §6.2 (`mcp-server/validate.ts` 89 literal + lỗi CLI,
`apps/desktop/src/preload.ts` 1 literal) và đợt 62 R9 §8.2–8.3 (webglLut
chỉ chạy bundle cjs; warning `empty-import-meta` từ `bridgeUrl.ts:17`).
Không push, không release/tag, không binary, không key nào gộp vào dict
(dict vẫn 2146 — fragment round63-r9 parent gộp sau, xem §7).

## §0. Kết quả — số thật (08/11/2026, Node v24.22.1)

| Hạng mục | Kết quả |
|---|---|
| Kiểm kê lại bằng tokenizer R6 (§1) | `validate.ts` đúng **89** literal (khớp R6); MCP+CLI tổng **393** (MCP 321, CLI 72) |
| Mã lỗi MCP (§2) | **130** điểm `throw new ValidationError` + **24** điểm `fail(msg, code)` đều có mã trong catalog 41 mã; message tiếng Việt **byte-identical 0 khác** (46 case đối chiếu + quét expr toàn bộ 130 điểm) |
| Mã lỗi CLI (§2) | **45** điểm `throw new CliError` đều có mã trong catalog 23 mã |
| Test mã lỗi mới `validateCodes63R9` | **53/53** (46 case message+code+params, catalog, quét tĩnh 130 throw + 24 fail) |
| Wire MCP thật (stdio) `test-error-codes-63r9.mjs` | **6/6** (`[TRANSITION_DURATION_ZERO]`, `[OUT_NOT_AFTER_IN]`, `[ID_INVALID]`, `[NOT_FOUND]`, server còn sống) |
| Hồi quy MCP | roundtrip **130/130**, migrateMotion **8/8**, migrateRender pass, modifyRound51H5 **8/8**, test-new-tools **5**, apply-transition-81 **19/19** |
| CLI `test-cli.sh` | **24/24** (21 cũ + 3 assert mã mới: `PROJECT_READ_FAILED`, `INTEGER_OUT_OF_RANGE`, `ENUM_INVALID`) |
| Preload (§4) | **6/6** (mặc định vi, `setLanguage("en")` → lỗi en cả 2 kênh đọc, về lại vi, bytes thật vẫn đọc được) |
| Runner (§5–§6) | `run-node-test-63r9` **3/3**; webglLut **7/7** + speedcurveTrim **18/18** qua runner, **0 warning** `empty-import-meta` |
| R6 census `i18nServerLiterals61R6` | **4/4** (sau cập nhật snapshot preload, xem §4.1) |
| Desktop tests hồi quy | desktopSaveAs53J4 + desktopMenuActions53J2 pass (mock `DesktopApiLike` không cần sửa — `setLanguage` tùy chọn) |
| `tsc` web / desktop / mcp-server / cli | **0 / 0 / 0 / 0** (web từng đỏ 3 lỗi lúc đầu lượt do luồng round 63 khác đang sửa dở `assetStore.ts`/`projectRepo.ts` — xem §8.1) |
| `vite build` web | **pass, 33,90 s** (chỉ cảnh báo chunk >500 kB có sẵn) |

## §1. Kiểm kê lại (tokenizer R6, chạy 08/11)

| File | Literal VI | Ghi chú |
|---|---|---|
| `mcp-server/src/validate.ts` | **89** | Khớp đúng số R6 (§6.2). 88 điểm `throw new ValidationError` + 1 literal trong comment header (đã sửa — xem §2.1). |
| `mcp-server/src/index.ts` | 76 | Chủ yếu mô tả tool/zod `.describe()` + chuỗi `fail` (không phải lỗi validate). |
| `mcp-server/src/store.ts` | 6 | Toàn `throw new ValidationError`. |
| `mcp-server/src/tools/ai.ts` / `clips.ts` / `common.ts` / `export.ts` / `modify.ts` | 46 / 48 / 4 / 12 / 40 | Mô tả tool + `throw`/`fail` (xem §2.3). |
| `cli/src` (toàn bộ) | **72** | 45 điểm `throw new CliError` + help text/mô tả lệnh + chuỗi `console.error` ở `index.ts`. |
| **Tổng MCP+CLI** | **393** | |

## §2. Quyết định hướng: NỐI vào hệ mã lỗi chung (không dịch chuỗi)

### §2.1 Phát hiện làm thay đổi đề bài: chuỗi KHÔNG phải tiếng Anh

Brief nhiệm vụ viết "giữ chuỗi tiếng Anh ổn định" — kiểm chứng cho thấy
**toàn bộ mặt MCP/CLI vốn đã là tiếng Việt**: `validate.ts` 89 literal
tiếng Việt, mô tả tool + zod `.describe()` tiếng Việt, tiền tố `LỖI:`,
help text CLI tiếng Việt. Comment header `validate.ts` ghi "message
tiếng Anh rõ ràng" là **sai so với code** (lệch có sẵn) — đã sửa comment
cho đúng thực tế. Vì vậy phương án "giữ chuỗi tiếng Anh" không áp dụng
được như viết; lựa chọn thật là:

- **(A) Giữ message tiếng Việt byte-identical** (mô tả ổn định cho
  người/agent đọc) **+ (B) thêm mã ổn định máy đọc được** — tức nối vào
  hệ mã lỗi chung theo đúng mẫu bridge R5 (`{error, errorCode,
  errorParams}`), thay vì dịch chuỗi qua dict i18n web.

Lý do không nối dict i18n web (ghi rõ, không phải né việc):

1. MCP server/CLI **không có hạ tầng i18n**: không locale, không `t()`,
   không có user cuối chọn ngôn ngữ. Client là AI agent / script chạy
   terminal — nó đọc message trực tiếp, không qua lớp dịch.
2. Dịch message sang en/vi qua dict sẽ tạo 2 bản message cho cùng một
   lỗi mà không có ai chọn bản nào (agent không gửi locale) — nối giả.
3. Mã ổn định mới là thứ agent/script thật sự cần: khớp lỗi bằng mã
   thay vì parse câu tiếng Việt. Message giữ tiếng Việt cho nhất quán
   với toàn bộ mặt MCP/CLI (đã là tiếng Việt từ đầu).

### §2.2 Thiết kế mã (mirror bridge R5)

```ts
// mcp-server/src/validate.ts
export const VALIDATION_CODES = [ /* 41 mã, đã sắp xếp a-z */ ] as const;
export type ValidationCode = (typeof VALIDATION_CODES)[number];
export type ValidationParams = Record<string, string | number | boolean>;
export class ValidationError extends Error {
  readonly code: ValidationCode;
  readonly params: ValidationParams;
  constructor(code: ValidationCode, message: string, params: ValidationParams = {}) { ... }
}
```

- `code` là tham số ĐẦU TIÊN, bắt buộc (mirror `apiError(code, message,
  params)` của bridge R5) — tsc bắt mọi điểm thiếu mã (không còn đường
  `new ValidationError(message)` cũ).
- `params` chỉ string/number/boolean (JSON-safe), luôn có `field`
  (đường dẫn field lỗi, vd `clip.speed`), cộng `min/max/value/expected/
  allowed/received` khi có sẵn. Message đã chứa giá trị nhận được cho
  người đọc; params là phần máy dùng được.
- Catalog 41 mã (validate.ts): `STRING_REQUIRED`, `STRING_TOO_LONG`,
  `ID_INVALID`, `NUMBER_REQUIRED`, `NUMBER_NEGATIVE`,
  `NUMBER_NOT_POSITIVE`, `INTEGER_OUT_OF_RANGE`, `UNSAFE_PATH`,
  `INVALID_HEX_COLOR`, `ENUM_INVALID`, `ENUM_REQUIRED`, `NOT_AN_OBJECT`,
  `NOT_AN_ARRAY`, `EMPTY_ARRAY`, `TOO_MANY_KEYFRAMES`,
  `NUMBER_OUT_OF_RANGE`, `NOT_A_BOOLEAN`, `DUPLICATE_ID`,
  `DUPLICATE_EFFECT`, `KIND_MISMATCH`, `UNSUPPORTED_TRACK_KIND`,
  `UNSUPPORTED_PROPERTY`, `VERSION_MISMATCH`, `FPS_TOO_HIGH`,
  `OUT_NOT_AFTER_IN`, `TRANSITION_DURATION_ZERO`,
  `INVALID_OUTPUT_PATH`, `INVALID_OUTPUT_NAME`, `MOTION_INVALID`,
  `NOT_FOUND`, `NOT_A_DIRECTORY`, `NOT_A_FILE`, `PROJECT_CORRUPT`,
  `PROJECT_EMPTY`, `RENDER_WORKER_MISSING`, `RENDER_FAILED`,
  `SCRIPT_FAILED`, `NOTHING_TO_UNDO`, `NOTHING_TO_REDO`,
  `WRONG_CLIP_KIND`, `MISSING_INPUT` (chỉ dùng ở `fail()` — xem §2.3).
- Mã theo **loại lỗi** (kind), không theo từng điểm throw: vd mọi kiểm
  tra khoảng số đều `NUMBER_OUT_OF_RANGE` với `min/max/value` riêng —
  catalog nhỏ (~40 mã) phủ 130 điểm, thêm mã mới phải thêm vào catalog
  + battery test (test quét tĩnh bắt ngay).

### §2.3 Phạm vi đã nối (đủ 3 tầng MCP + CLI)

| Tầng | Điểm | Cách nối |
|---|---|---|
| `validate.ts` helpers + throw trực tiếp | 88 | Mã theo kind (mapping trong log `round63-r9.md`); helper `reqString/reqId/req*Num/reqSafeSrc/reqHexColor/optEnum` mang mã theo loại lỗi của chính nó |
| `index.ts` + `store.ts` (MCP core) | 11 + 6 | `NOT_FOUND`, `KIND_MISMATCH`, `DUPLICATE_ID`, `PROJECT_EMPTY`, `RENDER_WORKER_MISSING`, `RENDER_FAILED`, `UNSAFE_PATH`, `NOT_A_DIRECTORY`, `PROJECT_CORRUPT`, `INVALID_OUTPUT_PATH` |
| `tools/ai.ts, clips.ts, common.ts, export.ts, modify.ts` | 25 | `SCRIPT_FAILED`, `INVALID_OUTPUT_NAME`, `OUT_NOT_AFTER_IN`, `NOTHING_TO_UNDO/REDO`, `WRONG_CLIP_KIND`, `NOT_A_FILE`, … |
| `fail()` ở tool handler (`clips.ts` 11 + `modify.ts` 13) | 24 | `fail(msg, code)` — text MCP thành `LỖI: [MÃ] message`; `fail()` không mã vẫn giữ `LỖI: message` (zod / lỗi lạ) |
| `handleError` 2 nơi (`index.ts`, `tools/common.ts`) | 2 | `fail(e.message, e.code)` cho `ValidationError` |
| CLI: `CliError` + 45 điểm throw | 45 | `CliError(code, message)`, catalog `CLI_CODES` 23 mã (cùng quy ước đặt tên với MCP, catalog riêng); `cli/src/index.ts` in `Lỗi [MÃ]: ...` |

### §2.4 Bằng chứng message không đổi

- Chụp 46 message gốc TRƯỚC khi sửa (SPEC 0.2.0 — lưu ý: script chụp
  lần đầu dùng nhầm "0.1.0" nên mọi case spec đều chết ở version check;
  đã sửa thành "0.2.0" và chụp lại đúng) → đối chiếu sau sửa: **0 khác**.
- Quét expr message của toàn bộ 130 điểm trước/sau (trích bằng parser
  cân bằng ngoặc): message expr giữ nguyên từng ký tự — script áp mã
  chỉ chèn `"MÃ", ` trước và `, {...}` sau expr gốc (2 điểm có dấu phẩy
  cuối đã xử lý đúng).
- Test `validateCodes63R9.test.ts` khóa 46 message + 46 mã + params
  JSON-safe + quét tĩnh toàn `mcp-server/src`.

### §2.5 Chưa nối / nợ mở (trung thực)

- **Zod schema errors**: `handleError` nhánh `z.ZodError` vẫn trả text
  tiếng Anh của zod (`input không đúng định dạng: ...`) KHÔNG có mã —
  zod chặn trước validate nên nhiều lỗi input tới agent qua đường này
  (vd type transition lạ ở R8). Nối mã cho zod cần map `issue.code`
  của zod sang catalog — việc riêng, chưa làm.
- **`render/validate.js` — 159 literal**: giữ nguyên theo R62 §6.2
  (nối từng dòng detail là việc riêng). CLI `vcut validate` vẫn trả
  chuỗi detail của file này (không mã) — `VALIDATION_FAILED` chỉ là mã
  cho "có N lỗi validation" ở `render.ts`, không thay từng dòng.
- **`packages/plugin-api/src/validate.ts`**: validator riêng của plugin,
  không nằm trong phạm vi brief — chưa đụng.
- **CLI `basicValidate` fallback** (`cli/src/project.ts`): chuỗi lỗi
  fallback khi không load được `validate.js` — giữ nguyên (đường này
  chỉ chạy khi deep-validate lỗi).
- **MCP `fail()` trong `handleError` cho lỗi lạ** (không phải
  ValidationError/zod): không mã theo thiết kế (không bịa mã cho lỗi
  chưa phân loại — cùng quy ước R5 `apiErrorFrom`).

## §3. Warning `empty-import-meta` từ `bridgeUrl.ts:17` — ĐÃ TRIỆT THẬT

Gốc rễ (đã đo, không phải đoán): esbuild bundle `--format=cjs` biến
`import.meta` thành `{}` nên `import.meta.env` là `undefined` — đúng
thiết kế (BRIDGE_URL về mặc định), nhưng esbuild vẫn cảnh báo mỗi lần
bundle file nào import `bridgeUrl`.

Cách triệt (đợt 63 R9): runner truyền thêm
`--define:import.meta.env={}` khi build cjs — cho `import.meta.env`
một GIÁ TRỊ thật thay vì để esbuild bỏ trống. **Không phải giấu log**
(`--log-level` vẫn `warning`; `--log-level=error` đã cân nhắc và loại
vì đó mới là giấu).

Bằng chứng đo bằng probe `BRIDGE_URL` (bundle `bridgeUrl.ts` rồi in):

| Cách bundle | Warning | `BRIDGE_URL` |
|---|---|---|
| cjs, không define (trước sửa) | có `empty-import-meta` | `http://127.0.0.1:8787` |
| cjs + `--define:import.meta.env={}` | **không** | `http://127.0.0.1:8787` (giống hệt) |
| esm | không | `http://127.0.0.1:8787` |
| cjs + define có giá trị `{"VITE_BRIDGE_URL":"http://127.0.0.1:9999"}` | không | `http://127.0.0.1:9999` (define inject được giá trị — không dùng, chỉ đo) |

Áp dụng: `scripts/run-node-test.mjs` (chỉ mode cjs; bundle esm giữ
`import.meta` thật, không define). Hồi quy: `run-node-test-63r9`
**3/3** — webglLut + speedcurveTrim qua runner đều mode=cjs, xanh,
không còn warning. `import.meta.url` vẫn gãy ở cjs như cũ (define chỉ
phủ `.env`) — test nào dùng `import.meta.url` vẫn phải chạy direct
(mẫu R9 giữ nguyên).

## §4. Preload — plumbing lang renderer→preload (đóng nợ R5 §6.2)

### §4.1 Đã làm

- `preload.ts`: thêm `IPC_NOT_BYTES_TEXT` (vi/en) + biến `preloadLang`
  (mặc định `"vi"`) + method `setLanguage(lang)` ĐỒNG BỘ trên
  `DesktopApi` (không qua IPC — renderer gọi trực tiếp). `asArrayBuffer`
  nay throw `IPC_NOT_BYTES_TEXT[preloadLang]` thay cho literal cứng.
- `desktop.ts` (`initDesktopMenuBridge`): gọi `api.setLanguage(lang)`
  mỗi lần đổi ngôn ngữ + lúc khởi động (cùng chỗ gọi
  `notifyLanguageChanged`); có `typeof` check nên preload cũ không có
  method vẫn chạy. Chiều menu→renderer cũng đi qua đường này
  (`onLanguageChanged` → `setLang` → `onLangChange` → `setLanguage`).
- `vite-env.d.ts` + `DesktopApiLike`: thêm `setLanguage?` (tùy chọn).
- Fragment `apps/web/src/i18n/fragments/round63-r9.json`: 1 key
  `desktop.preloadIpcNotBytes` vi/en. **CHƯA gộp vào dict** (parent
  gộp sau — dict vẫn 2146; sau gộp cập nhật khóa P7 2146→2147, xem §7).
- Test `preload63R9.test.ts` **6/6** (bundle preload thật với electron
  stub qua `--alias:electron`): mặc định vi → en → về vi; cả 2 kênh
  `readProjectFile`/`readMediaFile`; bytes thật vẫn đọc được.
- R6 census: literal preload chuyển từ `throw` trực tiếp vào dict nên
  classifier ±2 dòng đếm OTHER thay vì API_ERROR (tổng vẫn 1) — đã cập
  nhật snapshot trong `i18nServerLiterals61R6.test.ts` kèm giải thích
  (tiền lệ R5 §1); test **4/4**.

### §4.2 Giới hạn trung thực của cách làm này

- Preload **không import được dict i18n của web** (sandbox, cấm import
  tương đối — cùng lý do `openFileQueue` phải inline). 2 chuỗi giữ
  inline trong preload và được KHÓA BẰNG TEST với fragment (đổi một chữ
  ở bên nào test cũng đỏ) — fragment là bản mirror để audit, không
  phải nguồn preload đọc lúc chạy. Nếu parent đổi fragment khi gộp mà
  không đổi preload, test đỏ và báo ngay.
- Chỉ 1 literal này đi qua dict. Các `error` khác từ preload
  (`err.message` của main: `file-io.ts`/`native-files.ts`) vẫn là
  chuỗi tiếng Việt của main process — đã nối ở đợt 61 R6 bằng `trKey`,
  không thuộc đợt này.
- Test preload KHÔNG chạy qua `run-node-test.mjs` (runner không truyền
  `--alias:electron` nên bundle lấy package electron thật và crash lúc
  import) — chạy bằng lệnh esbuild trong header test; đã ghi rõ.

## §5. webglLut — đường ESM khả thi, GIỮ quyết định cjs

Đã thử thật (không đoán): bundle `--format=esm` + node cho
`webglLut.test.ts` → **7/7 pass, exit 0, MAE 0.4510/0.5058, max 1/2 —
giống hệt cjs** (số đo 24/10 vẫn đúng). Không còn lỗi O7 nữa vì file
không dùng `import.meta.url` và không import `validate.js` (2 lý do
khiến ESM gãy ở các họ file khác không áp dụng ở đây).

Quyết định: **GIỮ cjs** (mặc định của runner, đã chứng minh từ O7).
Lý do: sau §3, lợi ích duy nhất của ESM (hết warning) đã đạt được ở
cjs bằng define; chuyển sang ESM chỉ để thêm một ngoại lệ theo file
mà không có lợi ích đo được. Runner đã chọn đúng mode=cjs cho
webglLut (khóa bằng test `run-node-test-63r9` assert `mode=cjs`).
Node trực tiếp vẫn gãy import không đuôi (quyết định O7 giữ nguyên —
không sửa import trong code sản phẩm vì tsc gãy TS5097).

## §6. Runner — thay đổi duy nhất + hồi quy

- `scripts/run-node-test.mjs`: thêm `--define:import.meta.env={}` cho
  build cjs + cập nhật header comment (§3). Không đổi logic chọn mode.
- Mới `scripts/run-node-test-63r9.test.mjs` (chạy `node --test`):
  webglLut mode=cjs 7/7 + speedcurveTrim mode=cjs 18/18 + ESM webglLut
  7/7 với MAE khớp — **3/3**.
- `docs/DEVELOPER.md` §12: ghi chú define + kết quả thử ESM.

## §7. Bảo trì fragment (đọc trước khi gộp)

- Fragment `apps/web/src/i18n/fragments/round63-r9.json` (1 key
  `desktop.preloadIpcNotBytes` vi/en) — **parent gộp vào vi.json/en.json**.
  Sau gộp: dict 2146 → **2147 key**; cập nhật khóa P7
  (`i18nAudit59P7.test.ts`) 2146→2147. Test preload assert key "có
  trong fragment" — sau gộp KHÔNG cần đảo assertion (nó không assert
  "chưa có trong dict" như R5; chỉ khóa fragment == chuỗi preload).
  Nếu parent sửa chuỗi fragment khi gộp mà không sửa preload, test
  preload63R9 sẽ đỏ — sửa cả hai bên cùng lúc.
- Thêm mã MCP/CLI mới sau này: thêm vào catalog (`VALIDATION_CODES` /
  `CLI_CODES`) + battery test — test quét tĩnh bắt lệch ngay (đếm tối
  thiểu 130 throw / 24 fail / 45 CliError).

## §8. Chưa xanh / nợ mở — KHÔNG phải do luồng này (ghi rõ để parent định tuyến)

### §8.1 `tsc` web từng đỏ lúc đầu lượt — đã tự hết

Lúc bắt đầu kiểm chứng, `tsc` web exit 2 với 3 lỗi ở `assetStore.ts`
(`RecordProjectRefsResult` thiếu `stale`/`generation`) và
`projectRepo.ts` (TS5097) — toàn file của luồng round 63 khác đang sửa
dở (tiền lệ R9 §6). Chạy lại sau khi các luồng kia xong: **exit 0**.
R9 không đụng file của luồng khác.

### §8.2 `bridgeErrors62R5` 5/9 — luồng round 63 khác đang thêm mã TASK_*

Một luồng round 63 khác đã thêm **11 mã `TASK_*_FAILED`** vào
`server/bridge/src/errorCodes.js` (mtime 03:08) + tập mã web
`bridgeErrors.ts` (03:13) mà chưa cập nhật test/fragment/dict (vẫn
91): `TASK_CAPTION_FAILED`, `TASK_REFRAME_FAILED`,
`TASK_REFRAME_ANALYZE_FAILED`, `TASK_BEATS_FAILED`,
`TASK_BGREMOVE_FAILED`, `TASK_SILENCE_FAILED`, `TASK_SCENE_FAILED`,
`TASK_TRANSLATE_FAILED`, `TASK_TTS_FAILED`, `TASK_TTS_CLONE_FAILED`,
`TASK_PROXY_FAILED`. Test R5 khóa 3 chiều nên đỏ 4/9 (catalog 102 vs
91; 2 test render/param crash theo vì thiếu template). Tái hiện bằng
cả cách bundle cũ (không qua runner) — **không liên quan thay đổi
runner của R9**. R9 không sửa (đây là phần việc của luồng kia — có vẻ
đang đóng nợ R5 §6.2 "10 chuỗi fallback taskErrorPayload"; tiền lệ R9:
không sửa file luồng khác). Cần luồng đó (hoặc parent lúc gộp) thêm
11 key vào fragment/dict + cập nhật khóa 91→102 trong test R5.

### §8.3 P7 audit 5/8 + Q4 orphans 15/16 — luồng round 63 khác

- P7: `projectRepo.ts` có key mới `projectRepo.projectIdMigrated`
  (chưa có trong dict lẫn fragment R6) + 1 mẫu tồn đọng — file của
  luồng khác đang sửa dở (cùng file gây tsc đỏ ở §8.1).
- Q4: key mồ côi `speed.warnTooShort` — nợ "nhánh chết" đợt 62 §4,
  luồng khác dường như đã gỡ chỗ dùng (key thành mồ côi) mà chưa xóa
  key khỏi dict.
- Cả hai đều không nằm trong file R9 đụng; R9 không sửa. Cần parent
  định tuyến cho luồng sở hữu.

### §8.4 Nợ mở khác

- `.github/workflows/ci-security.yml` vẫn 403 (nợ cũ, ngoài phạm vi).
- Zod errors chưa có mã (§2.5); `render/validate.js` 159 literal chưa
  nối (§2.5); `plugin-api/validate.ts` chưa đụng (§2.5).

## §9. File thay đổi (batch stage `phase9-round63-r9-mcp-cli-i18n.txt`)

MCP (mới): `mcp-server/src/validateCodes63R9.test.ts`,
`mcp-server/test-error-codes-63r9.mjs`.
MCP (sửa): `mcp-server/src/validate.ts`, `index.ts`, `store.ts`,
`tools/ai.ts`, `tools/clips.ts`, `tools/common.ts`, `tools/export.ts`,
`tools/modify.ts`.
CLI (sửa): `cli/src/args.ts`, `project.ts`, `index.ts`,
`commands/addClip.ts`, `addText.ts`, `applyFilter.ts`,
`applyTransition.ts`, `caption.ts`, `create.ts`, `render.ts`,
`setSpeed.ts`, `tts.ts`, `test-cli.sh`.
Desktop (mới): `apps/desktop/src/preload63R9.test.ts`,
`apps/desktop/test/electron-stub-63r9.ts`.
Desktop (sửa): `apps/desktop/src/preload.ts`.
Web (mới): `apps/web/src/i18n/fragments/round63-r9.json`.
Web (sửa): `apps/web/src/desktop.ts`, `vite-env.d.ts`,
`lib/i18nServerLiterals61R6.test.ts` (chỉ snapshot preload, §4.1).
Runner/docs (mới): `scripts/run-node-test-63r9.test.mjs`.
Runner/docs (sửa): `scripts/run-node-test.mjs`, `docs/DEVELOPER.md`.
Tài liệu này.
Không key i18n nào gộp vào dict — fragment chờ parent gộp (§7).
