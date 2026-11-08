# PHASE 9 — ĐỢT 63, LUỒNG R5: SERVER LITERALS + RATE LIMITER — LIMITS

Ngày: 2026-11-08. Luồng R5, đóng nợ đợt 62 §4 mục 5 (phần server).
KHÔNG push (stage batch chờ user nhắn "push đi" từ main chat), KHÔNG release/tag.

## 0. Tóm tắt những gì đã nối

| Hạng mục | Trước | Sau |
|---|---|---|
| `server/render/src/validate.js` (159 literal) | chuỗi VI thô trong `errors`/`warnings` | 108 mã `validation.*` qua classifier `validateCodes.js` + fragment round63-r5; chuỗi cũ giữ nguyên từng byte cho client cũ |
| `taskErrorPayload` fallback (11 chuỗi) | chuỗi VI fallback khi task error không có message | 11 mã `TASK_*` (catalog bridge 91 → **102**) |
| SSE phase tách cảnh (2 chuỗi) | `SCENE_PHASE_LABELS` hardcode VI trong `index.js` | `scene.phase.*` qua `scenePhase63R5.ts` (mẫu R1) |
| `jobQueue` recover note | chuỗi note VI, không có mã | `noteCode: JOB_RECOVERED_RESTART` qua API (`publicJob`), fragment `jobNote.recoveredRestart` (web chưa tiêu thụ — xem §6) |
| Rate limiter | 1 Map bucket theo IP; 1 request qua 2 middleware đếm 2 lần | bucket tách theo scope (`${scope}:${ip}`); mỗi request đếm 1 lần/middleware |
| Bug thật tìm được trong lúc làm | — | (a) `validate.js` warn `hidden` track audio in ra `... undefined`; (b) `validateSpec` crash (`TypeError`) khi track/clip là `null`; (c) resolver `validationErrors.ts` trả `"[] "` cho entry hoàn toàn rỗng |

## 1. Kiểm kê số thật (tokenizer đợt 61 R6, chạy lại 2026-11-08)

| File | Tổng literal VI | Phân loại (classifier R6) |
|---|---|---|
| `server/render/src/validate.js` | **159** | API_ERROR 5, OTHER 152, VALIDATION 2 (classifier gán sai — thực chất cả 159 đều là message validation; xem §2) |
| `server/bridge/src/index.js` | **139** | API_ERROR 86, OTHER 5, LOG 48 |
| `server/bridge/src/jobQueue.js` | **25** (đợt 62: 26) | LOG 4, API_ERROR 12, OTHER 9 |
| `server/render/src/validateCodes.js` (mới) | 36 | OTHER 36 — là **regex pattern** của classifier (chứa chữ VI trong mẫu regex), KHÔNG phải literal user-facing chưa nối; không tính vào nợ |
| `server/bridge/src/taskError.js` (mới, tách từ `index.js`) | 0 | — |

- jobQueue 26 → 25: +2 literal note ở 2 nhánh recover (`restoreRecord` cho queued-thiếu-spec và running→interrupted) rồi −3 nhờ gom 4 chỗ lặp chuỗi note về 1 hằng `RECOVER_NOTE` (xem §5). Snapshot R6 đã cập nhật 247 → 246, test R6 4/4 xanh.
- validate.js 159 và index.js 139 **không đổi** sau đợt này — đúng thiết kế đợt 62 R5: server GIỮ chuỗi cũ từng byte (client cũ vẫn đọc được), việc "nối" là thêm lớp mã + fragment dịch, không xóa chuỗi.

## 2. validate.js — cách nối + giới hạn

**Cách nối (không sửa ~130 call-site):** module mới `server/render/src/validateCodes.js` — bảng 108 regex phân loại chuỗi đã tạo sẵn thành `{where, code, params}` (tiền lệ đợt 34 Q4: `parseCurveViolationLine`/`quotedName`). `err()`/`warn()` trong `validateSpec`/`validateMedia` giữ chuỗi cũ và ghi thêm entry có cấu trúc; `render.js` in thêm 1 dòng `VCUT_VALIDATION_JSON {...}` làm dòng CUỐI stderr (≤1200 ký tự, lược warnings trước rồi errors, đếm `omitted`); `errorDetail.js` bóc dòng này ra thành `errorDetail.validationDetails` + `validationDetailsOmitted` (đã redact đường dẫn tuyệt đối → `<path>/basename`, tối đa 20 entry, entry hỏng hình dạng bị bỏ). Web `ExportPanel` dịch từng entry qua `validationErrors.ts` (`validation.<CODE>`), hiển thị tối đa 5 dòng + số lược.

**Khóa test:** `server/render/src/test_validate_codes.js` — **1572 pass, 0 fail**, gồm: 3 chiều classifier↔fragment↔template (108 mã, placeholder khớp), battery spec thật qua `validateSpec` (hit 70+ mã cụ thể — ngưỡng khóa 70), battery media thật bằng ffmpeg (video có/không audio, ảnh tĩnh, audio, file rỗng, thư mục làm src — 10 mã MEDIA), `validationJsonLine` ≤1200 + marker khớp, round-trip qua `buildErrorDetail`.

**Chưa nối (generic `VALIDATION_DETAIL` — web hiện nguyên văn chuỗi VI cũ qua template `validation.detail`, không mất thông tin):**
- ~19 vòng passthrough của sub-validator (mask/chroma/effects/enhance/image/track/adjustment/motion): message của các module con, tách mã cần làm riêng trong từng file chủ của chúng. Đã đếm và khóa bằng allowlist tiền tố trong test (`mask.`, `chromaKey.`, `effects `, `enhance.`, `motion.`, `track: `, `image "...": `, `adjustment layer.`).
- `HEX_COLOR`: `style.color` gốc có "(#rgb hoặc #rrggbb)" nhưng `backgroundColor`/`highlightColor` không có; 1 template chung giữ phần ngoặc ở cả vi/en (thừa chữ ở 2 trường sau, chấp nhận được).

**Bug sửa trong lúc làm:**
- (a) `validate.js` warn `hidden` track audio dùng `warn(...)` 1 tham số → in ra `"[tracks[0]: hidden không có tác dụng…] undefined"`. Đã sửa thành `warn(tw, "...")` (verify bằng chạy thật). Không test nào phụ thuộc chuỗi lỗi này.
- (b) `validateSpec` **crash** (`TypeError: Cannot read properties of null`) khi spec chứa track `null` (vòng tính tổng thời lượng) hoặc clip `null` (vòng chồng lấn + vòng ghép transition). Trước đây cả validate vỡ thay vì trả errors. Đã thêm guard `!t || typeof t !== "object"` / `!clip` ở 3 vòng; test battery khóa lại (spec `tracks:[null]`, `clips:[null]` trả lỗi đúng, không crash).
- (c) `validationErrors.ts`: entry hoàn toàn rỗng (where + detail đều trống) trả `"[] "` thay vì `""` (template `"[{where}] {detail}"` trim vẫn còn `"[]"`). Test mới bắt được; đã sửa (trả `""` ngay ở nhánh generic khi cả 2 trống).

## 3. taskErrorPayload — 11 mã TASK_*

- Mã mới trong `errorCodes.js` (catalog 91 → **102**): `TASK_CAPTION_FAILED`, `TASK_REFRAME_FAILED`, `TASK_REFRAME_ANALYZE_FAILED`, `TASK_BEATS_FAILED`, `TASK_BGREMOVE_FAILED`, `TASK_SILENCE_FAILED`, `TASK_SCENE_FAILED`, `TASK_TRANSLATE_FAILED`, `TASK_TTS_FAILED`, `TASK_TTS_CLONE_FAILED`, `TASK_PROXY_FAILED`.
- Ngữ nghĩa (khóa ở `test-bridge-error-protocol.cjs` mục [4]): mã TASK_* chỉ gắn khi error KHÔNG có message thật (message rỗng/trắng → `buildTaskError` ra UNKNOWN và `error` chính là chuỗi fallback) hoặc khi `buildTaskError` ném (nhánh catch). Khi error CÓ message thật — dù phân loại được (vd `MISSING_ASSET`) hay UNKNOWN — GIỮ NGUYÊN code/message của `buildTaskError`, không để mã generic nuốt thông điệp cụ thể.
- `taskErrorPayload` tách từ `index.js` sang `server/bridge/src/taskError.js` (hàm thuần) để test đơn vị được mà không khởi động bridge (`index.js` listen ngay khi require). 11 call site trong `index.js` không đổi tên hàm. Test UI cũ kiểm tra dạng gọi 2 tham số đã cập nhật sang dạng 3 tham số.
- Web: 11 mã đã vào tập `BRIDGE_ERROR_CODES` + fragment; test `bridgeErrors62R5` cập nhật 91 → 102 (fragment = hợp của round62-r5 91 mã + round63-r5 bridgeErrors.* 11 mã).

## 4. Rate limiter — quirk đã sửa

- Quirk (R1-040): global middleware (`app.use("/api/", rateLimit(general))`) + per-route middleware dùng chung 1 Map bucket key theo IP → 1 request qua 2 middleware đếm 2 lần vào budget general.
- Sửa: bucket key thành `` `${scope}:${ip}` ``, scope `general` (global), `render` (10 route `RATE_MAX_RENDER` dùng chung 1 budget render — giữ nguyên ngữ nghĩa cũ), `silence` (route silence dùng giá trị `RATE_MAX_GENERAL` nhưng bucket riêng).
- Hệ quả hành vi (ghi rõ): route silence trước đây đếm 2× vào budget general; nay đếm 1× general + 1× bucket silence riêng (tức có thêm budget riêng bằng giá trị `RATE_MAX_GENERAL`). Đây là thay đổi có chủ đích, khóa bằng test.
- Số học e2e mới (instance B, `BRIDGE_RATE_GENERAL=4`): health poll #1 (general 1) + beats POST (general 2, render 1) + health h2 (3, 200) + health h3 (4, 200) + health h4 (5 → 429 `RATE_LIMITED` + `Retry-After`). Số học cũ (beats đếm 2, h3 → 429) đã sai sau khi sửa quirk.

## 5. index.js 139 + jobQueue 25 — phần còn lại

- **index.js OTHER 5** = 3 literal magic-bytes (đã nối từ R62 qua `checkMagicBytes` trả `{code,message,params}` — classifier đếm sót) + 2 giá trị `SCENE_PHASE_LABELS` (`upload`/`scan`) — nay nối qua `scenePhase63R5.ts` + fragment (theo mẫu R1: fragment import trực tiếp lúc chạy, không qua `t()`).
- **index.js LOG 48**: log server-only, giữ nguyên (không tới UI).
- **jobQueue OTHER 9** (sau refactor): 5 đã nối qua `err.code` (`QUEUE_FULL`, `NOT_FOUND`, `BAD_STATE`, `GONE`); 2 nội bộ không tới được từ API (`BAD_ID`, `DUP_ID` — id do server tự sinh); 1 chuỗi dữ liệu trong lỗi đã phân loại (`bị kill bởi signal ${signal}`); 1 hằng `RECOVER_NOTE` (chuỗi note, đã có mã `noteCode` đi kèm).
- **jobQueue LOG 4 / API_ERROR 12**: không đổi, ngoài phạm vi đợt này.
- `noteCode` được set ở cả 4 nhánh recover (2 nhánh `enqueue` + 2 nhánh `restoreRecord` cho queued-thiếu-spec và running→interrupted — 2 nhánh sau là chỗ R5 bổ sung trong đợt này vì trước đó note/noteCode đều `null` ở đó), lưu bền trong `job.json` (`serializeJobState`/`restoreRecord`), `publicJob` lộ ra API, `retry()` xóa note + noteCode. Fragment có key `jobNote.recoveredRestart` cho UI sau này.
- **Chưa có UI tiêu thụ `noteCode`**: web hiện không hiển thị `job.note` ở đâu (đã grep verify). Đây là nền tảng cho đợt sau, không claim đã hiện UI.

## 6. i18n / fragment / dict

- Fragment mới `apps/web/src/i18n/fragments/round63-r5.json`: **123 key** (validation 109 = 108 mã + `validation.detail`; bridgeErrors 11 TASK_*; scene.phase 2; jobNote 1). KHÔNG sửa trực tiếp `vi.json`/`en.json`.
- Trạng thái dict: **2146 key lá** (2044 + 91 đợt 62 R5 + 11 của các luồng đợt 63 khác). 123 key R5 **CHƯA gộp** vào dict — test `validationErrors63R5` assert chưa có trong dict (parent gộp xong thì sửa thành "đã có", mẫu R5 LIMITS §7). Test `bridgeErrors62R5` cũng phân biệt: 91 mã gốc phải có trong dict, 11 TASK_* phải chưa có.
- `validation.*` truy cập động qua template literal (`validation.${code}` trong `validationErrors.ts`) → đã thêm `"validation."` vào `DYNAMIC_PREFIXES` của cả 2 test `i18nAudit59P7` và `i18nOrphans60Q4` (bài học đợt 62). `scene.phase.*` truy cập qua import fragment trực tiếp (mẫu R1) nên không cần prefix.
- Ngoại lệ `validation.detail`: template `"[{where}] {detail}"` giống nhau ở vi/en (cấu trúc, không phải bản dịch) — test khóa rõ ngoại lệ này. Mọi template `validation.*` đều bắt đầu `"[{where}] "` (giữ định dạng chuỗi cũ).
- `test-error-detail-structured.cjs` mục [b]: khóa dict 2044 → **2146** (P7 audit mới là khóa chính; số này có thể dịch nếu luồng khác gộp key trong lúc test chạy).

## 7. Kiểm chứng (số thật, chạy 2026-11-08)

| Test | Kết quả |
|---|---|
| `server/render/src/test_validate_codes.js` | **1572 pass, 0 fail** |
| `server/bridge/test/test-bridge-error-protocol.cjs` (unit) | **142 pass, 0 fail** (gốc 95/95) |
| `server/bridge/test/test-bridge-error-protocol-e2e.cjs` (HTTP thật, 3 bridge) | **153 pass, 0 fail** |
| `server/bridge/test/test-error-detail-structured.cjs` | **170 pass, 0 fail** (gốc 148 pass, 2 fail — 2 fail cũ là khóa dict 2044, đã sửa) |
| `server/bridge/test/test-error-detail-ui.cjs` | **52 pass, 0 fail** |
| `apps/web/src/lib/validationErrors63R5.test.ts` (mới) | **8/8 pass** |
| `apps/web/src/lib/bridgeErrors62R5.test.ts` | **9/9 pass** (102 mã) |
| `apps/web/src/lib/captionPhase63R1.test.ts` | **10/10 pass** |
| `apps/web/src/lib/i18nServerLiterals61R6.test.ts` (census) | **4/4 pass** |
| `server/render/src/test_k1.js` (render thật qua render.js) | **21 pass, 0 fail** |
| `cli/test-cli.sh` | **24 pass, 0 fail** |
| `tsc` web / desktop / mcp-server / cli | **0 lỗi** (web từng có 1 lỗi do test mới — `null` trong mảng `ValidationDetailEntry[]` — đã sửa bằng `null as never`; 2 lỗi sibling ở baseline đã được chính họ sửa) |
| `vite build` (apps/web) | **pass** (20.61s) |

**Không xanh do luồng khác đang làm dở (KHÔNG phải của R5, không đụng vào):**
- `i18nAudit59P7.test.ts`: **5/8** — 3 fail đều của luồng khác: `speed.warnTooShort` thành mồ côi (luồng R10 xóa nhánh dùng nhưng chưa gộp việc xóa key khỏi dict — file test của họ ghi rõ "đỏ chờ gộp"), `projectRepo.ts` 2 fail (`projectIdMigrated` trKey chưa vào dict + literal chưa nối).
- `i18nOrphans60Q4.test.ts`: **15/16** — 1 fail là `projectRepo.projectIdMigrated` của luồng projectRepo (baseline 16/16, fail xuất hiện sau khi luồng đó sửa file).
- E2E section [8] đã verify bằng bridge thật trước khi đưa vào test (POST spec `start:-1` → job error `SPEC_VALIDATION`, `validationDetails[0].code NUMBER_MIN_0`, resolver vi/en đúng chữ).

## 8. Nợ mở (mới + cũ, chưa đóng)

1. **Sub-validator modules** (mask/chroma/effects/enhance/image/track/adjustment/motion): literal của chúng vẫn generic `VALIDATION_DETAIL`. Cần đợt riêng làm trong từng file chủ.
2. **MCP/CLI validate**: 89 literal (đợt 62 §4) — MCP/CLI không có hệ i18n, chưa có phương án nối; ngoài phạm vi đợt này.
3. **`job.note`/`noteCode` chưa có UI**: web chưa hiển thị note của job ở đâu. Cần đợt UI riêng nếu muốn hiện "Phục hồi sau restart…" cho user.
4. **`.github/workflows/ci-security.yml` vẫn 403** (App thiếu quyền workflows:write) — repo vẫn không có CI chạy thật. Nợ cũ, không đổi.
5. **Desktop preload 1 literal**: luồng R63 R9 đã nối qua dict (`IPC_NOT_BYTES_TEXT`); không phải việc của R5.
6. **Release gate giữ nguyên**: KHÔNG release/tag cho đến khi ngang/hơn CapCut thật.

## 9. File đổi/thêm (stage batch `phase9-round63-r5-server-literals.txt`, 27 file)

Mới (8): `server/render/src/validateCodes.js`, `server/render/src/test_validate_codes.js`, `server/bridge/src/taskError.js`, `apps/web/src/i18n/fragments/round63-r5.json`, `apps/web/src/lib/validationErrors.ts`, `apps/web/src/lib/validationErrors63R5.test.ts`, `apps/web/src/lib/scenePhase63R5.ts`, `docs/PHASE9_ROUND63_R5_SERVER_LITERALS_LIMITS.md`.
Sửa (19): `server/render/src/validate.js`, `server/render/src/render.js`, `server/bridge/src/errorDetail.js`, `server/bridge/src/index.js`, `server/bridge/src/errorCodes.js`, `server/bridge/src/jobQueue.js`, `server/bridge/src/publicJob.js`, `server/bridge/test/test-error-detail-structured.cjs`, `server/bridge/test/test-bridge-error-protocol.cjs`, `server/bridge/test/test-bridge-error-protocol-e2e.cjs`, `server/bridge/test/test-error-detail-ui.cjs`, `apps/web/src/lib/bridgeErrors.ts`, `apps/web/src/lib/bridgeErrors62R5.test.ts`, `apps/web/src/lib/errorDetailSummary.ts`, `apps/web/src/lib/i18nAudit59P7.test.ts`, `apps/web/src/lib/i18nOrphans60Q4.test.ts`, `apps/web/src/lib/i18nServerLiterals61R6.test.ts`, `apps/web/src/ExportPanel.tsx`, `apps/web/src/components/SceneModal.tsx`.
