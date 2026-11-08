# Phase 9 Đợt 61 R6 — Server/Desktop literals + diagnostic i18n: LIMITS

Ngày: 2026-11-08. Luồng R6 đợt 61. Đóng nợ đợt 60 §5.6 (Q4 server/desktop
literals + diagnostic). Repo: `~/workspace/repo-1`, branch main.
Fragment web R6: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round61-r6-fragment.json`
(50 key, NGOÀI repo — parent gộp vào `vi.json`/`en.json` sau, như P8 đợt 59).

## 1. Kiểm kê (a) — số đếm thật

### 1.1 Phương pháp đếm

Tokenizer tự viết (trong test `apps/web/src/lib/i18nServerLiterals61R6.test.ts`,
port từ `/tmp/r61-scan4.mjs`): tách comment ngoài string, xử lý `${...}`
lồng nhau, mỗi template tính 1 lần, chỉ đếm literal chứa dấu tiếng Việt.
Scanner naive (regex, kể cả chuỗi trong comment) cho số cao hơn — chênh lệch
là chuỗi trong comment + template đếm gộp, không phải literal thật.

### 1.2 8 file P7 — 247 literal (P7: 253)

| File | P7 | R6 (tokenizer) | Thay đổi |
| --- | --- | --- | --- |
| `server/bridge/src/index.js` | 134 | 139 | +5 (luồng khác thêm log/lỗi) |
| `apps/desktop/src/main.ts` | 42 | 23 | −19 (R6 nối dialog/model/about) |
| `server/bridge/src/jobQueue.js` | 22 | 26 | +4 (luồng khác thêm lỗi job) |
| `apps/desktop/src/services/modelDownloader.js` | 21 | 21 | 0 |
| `server/render/src/motion.js` | 19 | 23 | +4 (luồng khác thêm validate) |
| `server/render/src/speedramp.js` | 14 | 14 | 0 |
| `apps/desktop/src/preload.ts` | 1 | 1 | 0 |
| **Tổng** | **253** | **247** | **−6 ròng** |

Naive regex đếm 8 file = 277 (chênh 30 do chuỗi trong comment). Số 253 của P7
là đếm naive-trừ-comment kiểu cũ, không sai — chỉ khác phương pháp.

### 1.3 Phân loại theo sink (classifier ±2 dòng, khóa trong test kiểm kê)

| File | LOG (nội bộ) | API_ERROR (trả về UI) | VALIDATION | DIALOG | OTHER (đã soi tay) |
| --- | --- | --- | --- | --- | --- |
| bridge index.js | 48 | 85 | 0 | 0 | 6 |
| jobQueue.js | 4 | 12 | 0 | 0 | 10 |
| main.ts | 19 | 2 | 0 | 1* | 1* |
| preload.ts | 0 | 1 | 0 | 0 | 0 |
| modelDownloader.js | 1 | 14 | 0 | 0 | 6 |
| motion.js | 0 | 3 | 20 | 0 | 0 |
| speedramp.js | 3 | 11 | 0 | 0 | 0 |

\* Hai điểm classifier sai, đã soi tay: main.ts "DIALOG 1" thực ra là dòng
`log()` kề `dialog.showMessageBox` (L729); "OTHER 1" là phần nối của template
`log()` ở L704–706. Cả hai đều là log nội bộ, không phải dialog/literal lẻ.

OTHER đã soi tay (đều là user-facing qua API/job, chưa nối — xem nợ §4.1):
- bridge 6: 3 return lỗi validate file upload, 1 mảnh lỗi multer quá giới
  hạn, 2 nhãn tiến độ scene-scan (SSE progress).
- jobQueue 10: 8 chuỗi `job.error` (queue đầy, id sai/trùng, không tìm thấy
  job, retry sai trạng thái, thư mục job đã dọn), 2 note "Phục hồi sau khi
  server restart", 1 mảnh `bị kill bởi signal …`.
- modelDownloader 6: 4 lần `Đã huỷ tải model.`, 1 timeout 60s, 2 câu nối
  tiếp của lỗi dung lượng/checksum — tất cả là `throw` trả về main → UI.

### 1.4 Toàn production — 3217 literal (tokenizer), 127 file

Phạm vi: `server/`, `apps/desktop/src/`, `mcp-server/src/`, `cli/src/`,
`packages/plugin-api/src/`, `packages/video-spec/src/` (trừ `node_modules`,
`dist`, `.venv`, `__pycache__`, `release*`, file test/measure/demo, `.js`
trùng `.ts`). Naive regex: 3335–3336 (chạy 2 lần lệch 1 do luồng khác sửa
file giữa chừng — snapshot lấy theo tokenizer 3217).

Top file (chủ yếu là DỮ LIỆU, không phải chuỗi UI — xem §1.5):
`video-spec/lut.ts` 296, `sticker.ts` 235, `render/lut.js` 178,
`render/transitions.js` 169, `video-spec/transitions.ts` 163,
`render/validate.js` 159, `bridge/index.js` 139, `render/nested.js` 127,
`desktop/i18n-desktop.ts` 95 (= chính dict desktop), `mcp-server/validate.ts`
89, `mcp-server/index.ts` 76, `bridge/tts.js` 71, `bridge/errorDetail.js` 44,
`video-spec/adjustment.ts` 44.

### 1.5 Miễn trừ có lý do (không nối)

- **Log nội bộ** (`console.*`/`log(`): bridge 48, main.ts 19, speedramp 3,
  jobQueue 4, modelDownloader 1 — chỉ dev đọc, nối bừa làm loãng dict.
- **Dữ liệu catalog** trong `packages/video-spec` (tên/mô tả LUT, sticker,
  transition, effect, textfx ~1000 literal) và `server/render/*.js` tương ứng:
  là dữ liệu nội dung, dịch cần thiết kế content-i18n riêng, không phải
  nối `t()` từng chuỗi.
- **Tên giọng TTS** (mỗi giọng đếm 3× name/gender/desc): tên riêng, không dịch.
- **Tên ngôn ngữ** `"Tiếng Việt"` (menu.ts:253): tên riêng, đúng là không dịch.
- **Mã ASCII / passthrough động**: `decode-ok`, `tail-scan-*`,
  `exception: {msg}`, `probe-error: {msg}`, `demux-moov: <parser error>`,
  `tail-scan: {msg}`, `gop-exception: {msg}` — mã máy đọc hoặc message
  động từ parser/lỗi hệ thống, dịch phần trong đã làm ở §2 (parser nay dịch).
- **TypeError lỗi lập trình** (`fetchSingleGopRange: url…`,
  `discoverSizeBytes: url…`, `fetchVideoTrackByGopRange: …`): không tới
  tay user bình thường.
- **Ternary song ngữ tại chỗ** (menu.ts:169 "Không tìm thấy file dự án này
  nữa." / "This project file no longer exists."): đã song ngữ, không cần key.

## 2. Đã nối trong lượt này

### 2.1 Diagnostic web (b) — 50 key fragment, 6 file lib

Fragment `round61-r6-fragment.json`: 50 key lá vi/en, placeholder khớp,
không va chạm dict web (1972 key) và không va chạm fragment luồng R61-R2.
Nhóm: `gop.gate.*` 7, `gop.probe.*` 5, `gop.range.*` 4, `gop.controller.*` 2,
`gop.cache.*` 7, `gop.sizeprobe.*` 2, `gop.demux.*` 23.

Wiring (mẫu Q4: `I18nLookup` + `trKey(lookup, key, vars, fallback)`, fallback
= đúng từng chữ chuỗi VI cũ, không lookup → hành vi cũ nguyên vẹn):
- `lib/reverseRangeGate38U2.ts` — `resolveRangeGopFetch` (6 lý do + evidence
  probe), `checkRangeProbeResponse` (5 lý do).
- `lib/mp4Demux.ts` — `avcCodecString`, `parseMp4VideoTrack` (7 throw),
  `validateAvccSample` (8), `validateSampleLayout` (3),
  `validateSampleTimestamps` (5). Hằng `SPS_VUI_FPS_TOLERANCE = 0.02`.
- `lib/gopRangeFetch39T3.ts` — 4 key trực tiếp + truyền lookup xuống gate/
  probe/demux/validate (kể cả wrapper `${kind}-${check.reason}` nhờ đó dịch
  cả phần trong).
- `lib/gopCache40V2.ts` — `resolveGopRangeWiring` (5), `fetchSingleGopRange`
  (2 + `gop-${check.reason}` lồng).
- `lib/gopSizeProbe41W4.ts` — `discoverSizeBytes` (2).
- `lib/reverseWebcodecs.ts` — 2 chuỗi exception `gop.controller.*` qua
  `this.gopI18nLookup`; truyền lookup tới parse/track/wiring/sizeprobe.

3 key gần như không tới được trong thực tế (test chỉ khóa presence + ghi
đây): `avccNoNal` (data ≥ 5 byte thì vòng NAL luôn chạy ≥ 1 lần),
`size-too-small` (knownSize > 0 nên probeEnd < 0 không xảy ra),
`moov-missing-after-gate` (code comment "thực tế không bao giờ").

### 2.2 Desktop (a) — 36 key mới trong `i18n-desktop.ts` (59 → 95 lá)

`common.close`; `dialogs.*` 8 (projectFilter/Long, allFiles, openProject,
saveProject, mediaFilter, addMedia, exportVideo); `menu.openGithub`;
`ffmpeg.*` 3 (notFoundTitle, installHint, stillUsable); `crash.reasonLine`;
`about.logHint` + 4 dòng nhãn (repo/docs/settings/versionLine);
`fileIo.*` 5; `nativeFiles.*` 5; `models.*` 7 (allReady, missing,
checkFailed, noRoot, emptyId, alreadyDownloading, noDownload — chuỗi IPC
model trong main.ts).

Call site đã nối: main.ts (helper `desktopLabels()` đọc lang từ settings
lúc mở dialog, không cache + `mt(key, vars)`; 4 dialog IPC, dialog ffmpeg
thiếu, `registerExportFileIpc(..., getLang)`), menu.ts (dialog flow nhận
`labels`, `openGithub`), about.ts (3 ternary "Đóng" + logHint + 4 nhãn),
crash.ts (`reasonLine`), ffmpeg-check.ts (`ffmpegInstallHint(lang)`),
file-io.ts (`readFileBytes`/`writeProjectFile` + `FileIoLookup`/`trKey`),
native-files.ts (`projectDialogFilters(lang)`, `saveExportFile` + lookup).

Sau nối: about.ts 0 literal, crash.ts 0, menu.ts chỉ còn 2 miễn trừ (§1.5),
ffmpeg-check.ts 1 (log nội bộ), file-io 6 + native-files 5 (đều là fallback
`trKey` đã nối — scanner vẫn đếm vì fallback VI nằm trong source, đúng
thiết kế), main.ts 23 (log + 2 throw khởi động + 1 dòng log kề dialog).

### 2.3 Test P7 phải sửa để theo kịp fragment (không phải sửa code sản phẩm)

Test `i18nAudit59P7.test.ts` kiểm tra mọi `trKey()` trong 36 file trỏ tới key
có trong dict. 50 key R6 chỉ có trong fragment (parent gộp sau, như P8 đợt
59) nên P7 đỏ 5/7 sau khi nối. Sửa test theo đúng tiền lệ P8 của chính file
này (đọc fragment từ `hidden_files`):
- Load fragment R6 (nếu có) làm nguồn key hợp lệ thứ hai, sau dict.
- `classifyLit`: key trong fragment → so fallback với giá trị VI fragment,
  cùng luật tail như dict (fallback = chuỗi VI cũ từng chữ nên khớp).
- Regex trKey tổng quát: arg đầu có thể là `lookup` hoặc
  `this.gopI18nLookup` (reverseWebcodecs).
- Thêm test khóa fragment R6: 50 key vi/en, placeholder khớp, chưa trùng
  dict; sau khi parent gộp, dict phải khớp từng giá trị fragment.
- P7 nay 8/8 (7 cũ + 1 mới). **Lưu ý bảo trì:** sau khi parent gộp fragment
  R6 vào dict, assertion "key chưa có trong dict" trong test R6 mới phải bỏ
  (key lúc đó đã ở cả hai nơi, vẫn pass phần còn lại).

## 3. Kiểm chứng

- Test mới R6 diagnostic `apps/web/src/lib/i18nDiagnostic61R6.test.ts`: **22/22**
  (fragment 50 key; gate/probe/cache/sizeprobe/avcc/layout/timestamps/parser/T3
  cả EN qua lookup lẫn VI fallback).
- Test mới R6 kiểm kê `apps/web/src/lib/i18nServerLiterals61R6.test.ts`: **4/4**
  (8 file 247 + phân loại sink; desktop about/crash 0, menu 2, file-io/native-files
  đúng tập fallback; quét production 127 file, tổng trong ±5% snapshot 3217).
- Test mới R6 desktop `apps/desktop/src/i18nDesktop61R6.test.ts`: **9/9**
  (95 lá vi/en, 36 key mới, `tDesktopVars`, dialog filters, ffmpeg hint,
  saveExportFile/file-io EN + VI fallback).
- Hồi quy: Q4 `i18nOrphans60Q4` **16/16**; P7 `i18nAudit59P7` **8/8** (sau sửa
  §2.3); GOP: gopRangeFetch39T3 10/10, gopWiring40V2 16/16, gopSizeProbe41W4
  15/15, gopBlobUrl49E2 8/8, gopTail 18/18 + 13/13 + 11/11 + 8/8,
  trialDecode 55L8 23/23, 56M10 28/28, 57N10 17/17, 58O6 18/18, 59P6 16/16,
  60Q5 15/15, 57N6 32/32 (tổng 155/155; chạy esm vì top-level await — cjs
  bundle lỗi, không phải lỗi test); desktop native-files 8/8, openFileQueue 4/4.
  (gopTrialDecode61R7 của luồng R61-R7 cũng xanh 6/6 — kiểm tra chéo, không
  phải việc R6.)
- `tsc` apps/desktop **0 lỗi**; `tsc` apps/web **0 lỗi** (đã sửa 3 lỗi do test
  mới: `sample()` thiếu offset/size ở 2 chỗ trong test diagnostic, import
  `statSync` thừa trong test kiểm kê); `vite build` **pass** (18.29s).
- Lỗi tsc desktop gặp giữa chừng: interface `about` thiếu 4 trường sau khi
  nối (đã thêm `docsLine`/`repoLine`/`settingsLine`/`versionLine`).

## 4. Nợ mở

### 4.1 Lớn — bridge/server user-facing chưa nối (cần thiết kế, không làm trong 1 luồng)

Toàn bộ literal API_ERROR/VALIDATION ở server trả về UI qua HTTP/job/IPC
chưa qua i18n (bridge ~109 incl. OTHER đã soi, jobQueue ~24, caption progress
labels, `errorDetail.js` 44, `render/validate.js` 159, `motion.js` 23,
`speedramp.js` 14, `mcp-server/validate.ts` 89, lỗi `cli/`). Server không có
hạ tầng `t()` như web — nối thật cần giao thức mã lỗi bridge→web (server trả
mã + tham số, web dịch bằng dict) thay vì nối từng chuỗi. Không claim đã xong.

### 4.2 Nhỏ

- `apps/desktop/src/preload.ts` 1 literal: `"Dữ liệu file qua IPC không phải
  bytes."` ném về renderer qua `{ok:false, error}` — user-facing nhưng cần
  plumbing lang từ renderer xuống preload (preload không đọc settings).
- Sau khi parent gộp fragment R6: cập nhật test P7 (§2.3, bỏ assertion
  "chưa có trong dict").
- Test kiểm kê khóa snapshot 247/3217 — luồng khác sửa file thì cập nhật
  snapshot (mẫu P7→Q4).
- Nợ cũ còn mở: `.github/workflows/ci-security.yml` vẫn 403 (App thiếu
  `workflows:write`), repo không có CI chạy thật; test `i18nAudit56M3` đỏ
  sẵn 7/13 từ trước đợt 60 (không liên quan R6, không đụng).

## 5. Batch đã stage (KHÔNG push)

`~/workspace/repo-1-push/paths-loop/phase9-round61-r6-server-literals.txt`
(NUL-delimited, text only). 19 file:

Web (10): `apps/web/src/lib/{reverseRangeGate38U2,mp4Demux,gopRangeFetch39T3,
gopCache40V2,gopSizeProbe41W4,reverseWebcodecs}.ts`,
`apps/web/src/lib/{i18nDiagnostic61R6,i18nServerLiterals61R6}.test.ts`,
`apps/web/src/lib/i18nAudit59P7.test.ts`,
`docs/PHASE9_ROUND61_R6_SERVER_LITERALS_LIMITS.md` (file này).

Desktop (9): `apps/desktop/src/{i18n-desktop,main,menu,about,crash,
ffmpeg-check,file-io,native-files}.ts`, `apps/desktop/src/i18nDesktop61R6.test.ts`.

Fragment JSON nằm NGOÀI repo (hidden_files) — không đưa vào batch, parent
gộp sau.
