# PHASE9_ROUND62_R9 — Runner test chuẩn: đóng nợ đợt 61 §5.11

Luồng R9, đợt 62 (08/11/2026). Đóng nợ runner đợt 61 §5.11: `speedcurveTrim`
crash lúc thoát do `createRequire(import.meta.url)` trong bundle CJS.
Không push, không release/tag, không binary, không key i18n mới.

## 0. Kết quả — số thật

- `speedcurveTrim.test.ts`: **18/18 pass, exit 0, cả 3 cách chạy**
  (node trực tiếp ×3, bundle cjs ×3, bundle esm ×3) + qua runner ×2.
  Trước sửa: bundle cjs chỉ chạy được 14/14 rồi crash exit 1, 4 test
  validator + legacy không bao giờ chạy.
- `webglLut.test.ts`: **7/7 pass, exit 0** qua runner ×2 (bundle cjs —
  cách chạy đã đúng từ đợt 58 O7, không đổi code; MAE 0.4510/0.5058,
  max 1/2, khớp số đo 24/10).
- `importProgress41W3.test.ts` (cùng họ lỗi, phát hiện khi kiểm chứng):
  **4/4 pass, exit 0** qua runner ×2. Trước sửa: file này KHÔNG chạy
  được bằng cách nào (cjs crash lúc load, node trực tiếp gãy import
  không đuôi) — xem §5.
- Họ validate.js qua runner, tất cả xanh, exit 0:
  `splitPatch.store` **12 pass**, `nestedStore.store` **8 pass**,
  `i18nAudit56M3` **13/13**, `seek` (nhánh esm, top-level await)
  **15 passed**, `projectRepo` **10 pass**.
- Runner mới `scripts/run-node-test.mjs`: chọn đúng mode cho cả 5 họ
  trên (cjs/esm/direct) + chạy được từ `apps/web` với đường dẫn tương
  đối theo cwd; `--mode` ép mode đã kiểm chứng (esm cho speedcurveTrim
  18/18).
- Hồi quy: `tsc` apps/desktop **0 lỗi**; `vite build` apps/web trực tiếp
  **pass, 23,29 s** (chỉ cảnh báo chunk >500 kB có sẵn). `tsc` apps/web
  ĐỎ tại thời điểm kiểm chứng — không phải do R9, xem §6.

## 1. Gốc rễ — đã tái hiện cả 3 cách chạy (trước sửa)

### 1a. Bundle CJS: `import.meta` bị esbuild để trống

```
./node_modules/.bin/esbuild apps/web/src/components/speed/speedcurveTrim.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/...cjs
▲ [WARNING] "import.meta" is not available with the "cjs" output format
  and will be empty [empty-import-meta]
    apps/web/src/components/speed/speedcurveTrim.test.ts:198:33
```

Trong bundle, esbuild biến `import.meta` thành `{}` nên
`import.meta.url` là `undefined`, và `createRequire(undefined)` ném
ngay lúc đánh giá module — sau khi 14 test đầu đã in ✓, trước 3 test
validator + 1 test legacy:

```
TypeError [ERR_INVALID_ARG_VALUE]: The argument 'filename' must be a file
URL object, file URL string, or absolute path string. Received undefined
    at createRequire (node:internal/modules/cjs/loader:2142:11)
```

Exit 1. Đợt 61 §5.11 ghi "crash lúc thoát" — nói chính xác hơn là crash
giữa chừng lúc load module (14/14 pass rồi chết), không phải lúc thoát
tiến trình. Không phải lỗi sản phẩm: `speedcurve.ts` và `validate.js`
đều đúng; lỗi ở cách test load validator trong file được bundle sang CJS.

### 1b. Bundle ESM cũng không cứu được

`--format=esm`: `import.meta.url` lúc này trỏ về bundle ở `/tmp`, nên
require tương đối `../../../../../server/render/src/validate.js` gãy:

```
Error: Cannot find module '../../../../../server/render/src/validate.js'
Require stack: - /tmp/.../speedcurveTrim.test.mjs
```

Muốn giữ `import.meta.url` thì bundle phải nằm đúng độ sâu
`apps/web/src/components/speed/` trong repo (tạo artifact trong cây
source) — không chấp nhận được. Cùng kết luận với O7 §2c.

### 1c. Node trực tiếp chạy được — nhưng không phải cách chuẩn chung

`node apps/web/src/components/speed/speedcurveTrim.test.ts` (Node
v24.22.1, type-stripping mặc định): **18/18, exit 0**. Vì vậy nợ này
chỉ cắn đường chạy bundle cjs — đúng đường mà harness kiểm chứng của
parent dùng cho mọi suite. Sửa test để chạy được cả 3 cách thì harness
không còn phải nhớ ngoại lệ.

### 1d. webglLut KHÔNG cùng họ lỗi này

- `webglLut.test.ts` không dùng `createRequire`/`import.meta.url`
  (O7 đã bỏ từ đợt 58) → bundle cjs **7/7, exit 0** từ trước, không cần
  sửa. Chỉ còn warning `empty-import-meta` vô hại từ `bridgeUrl.ts:17`
  (`import.meta.env` → undefined, đúng thiết kế).
- Node trực tiếp vẫn gãy `ERR_MODULE_NOT_FOUND .../lib/bridgeUrl`
  (import không đuôi trong `webglLut.ts:1`) — khác họ lỗi, và O7 đã
  quyết KHÔNG sửa import trong code sản phẩm (thêm đuôi `.ts` thì tsc
  gãy TS5097). Giữ nguyên: suite này chỉ chạy bằng bundle cjs.
- Vì vậy "cùng cách" cho webglLut = cùng runner chọn mode cjs, không
  phải cùng một sửa code.

## 2. Cách sửa đã chọn (theo đúng mẫu O7)

Chỉ sửa **file test**, không đụng code sản phẩm, không đụng tsconfig,
không cài thêm dependency:

1. `speedcurveTrim.test.ts` — bỏ `createRequire(import.meta.url)` +
   require tương đối; thay bằng `findValidateJs()` resolve từ
   `process.cwd()` (gốc repo hoặc `apps/web`, 2 ứng viên, lỗi rõ ràng
   nếu không tìm thấy) rồi `createRequire(ĐƯỜNG DẪN TUYỆT ĐỐI)` +
   `requireCjs(ĐƯỜNG DẪN TUYỆT ĐỐI)`. Đường dẫn tuyệt đối nên cả 3
   cách chạy đều đúng. Không đổi assert nào — 3 test validator vẫn gọi
   `validateSpec` thật của `server/render`. Cập nhật header: lệnh chạy
   chuẩn là runner.
2. `importProgress41W3.test.ts` — bỏ `fileURLToPath(import.meta.url)`
   ở dòng 20 (xem §5); `findSrc()` đi lên từ `process.cwd()` thay vì
   vị trí file; bỏ import `node:url` (file này đã exclude khỏi tsc
   nhưng bỏ import thừa cho sạch). Cập nhật header + comment.
3. Mới: `scripts/run-node-test.mjs` — runner chuẩn (xem §3).
4. `docs/DEVELOPER.md` §12 — ma trận chọn mode + lệnh runner (xem §4).

## 3. Runner mới `scripts/run-node-test.mjs`

Một file Node thuần, không dependency ngoài esbuild có sẵn trong repo.
Bundle tạm ở `/tmp/vcut-run-test-XXXXXX/`, xóa sau mỗi lượt (trừ
`--keep`); không tạo file trong cây repo. Luôn chạy test với
cwd = gốc repo (để các test resolve từ `process.cwd()` đúng).

Chọn mode theo file (in lý do ra stdout):

1. Marker tường minh trong header: `@runner direct|cjs|esm` — ưu tiên
   cao nhất (chưa file nào dùng; dành cho ngoại lệ tương lai).
2. Nội dung file (đã bỏ comment): có `import.meta.url` → `direct`
   (node type-stripping, Node ≥ 22.18); có top-level await (await ở
   cột 0) → `esm`.
3. Mặc định → `cjs`.

```bash
node scripts/run-node-test.mjs <test-file...> [--repeat N] [--keep] [--mode direct|cjs|esm]
```

Đường dẫn file tương đối ưu tiên cwd của lần gọi (chạy từ `apps/web`
với `src/lib/x.test.ts` vẫn được), rồi mới tới gốc repo.

## 4. Ma trận chạy chuẩn (đã kiểm chứng, xem §7)

| Họ file | direct node | bundle cjs | bundle esm | Runner chọn |
|---|---|---|---|---|
| Mặc định: import `validate.js`, dùng `react-dom/server`, import không đuôi | gãy (extensionless) | ✅ | gãy (`Dynamic require of "child_process"`) | cjs |
| Dùng `import.meta.url` (trước sửa) | ✅ | ❌ crash sau 14/14 | ❌ `MODULE_NOT_FOUND` từ /tmp | direct |
| `speedcurveTrim` **sau sửa** | ✅ 18/18 | ✅ 18/18 | ✅ 18/18 | cjs (mặc định) |
| `webglLut` (extensionless, không `import.meta.url`) | ❌ `ERR_MODULE_NOT_FOUND` bridgeUrl | ✅ 7/7 | chưa thử (không cần) | cjs |
| Top-level await (`seek.test.ts`) | ✅ (header ghi) | ❌ esbuild lỗi build | ✅ 15 passed | esm |
| `importProgress41W3` **sau sửa** | ❌ (extensionless) | ✅ 4/4 | chưa thử (không cần) | cjs |

Quy tắc cho tác giả test mới (ghi vào DEVELOPER.md §12): đừng dùng
`import.meta.url` trong test — resolve từ `process.cwd()` và require
file CJS bằng đường dẫn tuyệt đối (mẫu O7), để file chạy được cả 3 cách.

## 5. Phát hiện thêm khi kiểm chứng: `importProgress41W3` + audit lệch

### 5a. Cùng họ lỗi, nặng hơn: file không chạy được bằng cách nào

`importProgress41W3.test.ts:20` dùng
`path.dirname(fileURLToPath(import.meta.url))`:

- Bundle cjs: crash ngay lúc load, **0 test chạy được**:
  `TypeError [ERR_INVALID_ARG_TYPE]` tại `fileURLToPath` (nhận
  `undefined`). `findSrc()` có fallback từ cwd nhưng không bao giờ
  tới được vì dòng `HERE` ném trước.
- Node trực tiếp: gãy `ERR_MODULE_NOT_FOUND
  .../lib/importProgressText41W3` (import không đuôi).

Đã sửa bằng đúng mẫu O7 (§2.2): bỏ `import.meta.url`, đi lên từ
`process.cwd()`. Sau sửa: bundle cjs **4/4, exit 0** (×2 lượt).

### 5b. Sửa xong thì lòi 1 test audit đỏ có sẵn (không phải do R9)

Chạy được rồi, test kiểm toán tĩnh fail 1/4:

```
components/project/ProjectMenu.tsx phải gọi importFiles
```

Nguyên nhân thật (đã kiểm chứng độc lập bằng grep, không qua test):
`ProjectMenu.tsx` KHÔNG chứa literal `importFiles(` — nhưng nó ĐÃ nối
tiến trình thật qua đường khác: `openArchiveFileFlow(f, (ev) =>
setImportProgress(ev))` (dòng 214) + render banner `data-import-progress`
(dòng 267); flow `openProjectFlow.ts:180` chuyển `onImportProgress`
thẳng vào `st.importFiles(res.mediaFiles, onImportProgress)`. Literal
`importFiles(` biến mất từ refactor Phase 10 G4 (đường mở dùng adapter
chung), còn hành vi nối tiến trình vẫn nguyên.

Cách xử lý: đính chính audit (không bỏ panel khỏi audit, không sửa
product): entry ProjectMenu nay assert bằng chứng gọi tương đương
`openArchiveFileFlow(f, (ev) => setImportProgress(ev))` kèm comment
giải thích G4; 6 panel còn lại vẫn assert literal `importFiles(` như cũ.
Sau đính chính: **4/4 pass**. Đây là lệch audit ↔ code có sẵn từ G4,
chỉ lộ ra vì trước đây file test không chạy được bằng cách nào (§5a).

## 6. Hồi quy

- `tsc` apps/desktop: **exit 0, 0 lỗi**.
- `vite build` apps/web (chạy trực tiếp `npx vite build`, bỏ qua cổng
  tsc): **exit 0, built 23,29 s**, chỉ cảnh báo chunk >500 kB có sẵn.
- `tsc` apps/web: **exit 2 — ĐỎ tại thời điểm kiểm chứng, KHÔNG phải
  do R9**. Bằng chứng: chạy 2 lần cách nhau ~20 phút cho 2 tập lỗi
  khác nhau, toàn file của luồng round 62 khác đang sửa dở:
  lần 1 `gopRangeFetch39T3.ts` TS6133 + `gopTrialDecode62R4.test.ts`
  TS5097 ×2; lần 2 `enhancePreview61R3.test.ts` TS2724 (thiếu export
  `ENHANCE_PREVIEW_BLUR_MAX_PX`) + `nestedPreview.ts` TS5097; lần 3
  (`npm run build`) `projectAssetRefs62R7.test.ts` TS6133 ×4 +
  `preview.tsx` TS6133. Không lần nào có lỗi ở file R9 (cả 2 file test
  R9 sửa đều đã nằm trong exclude của tsconfig; runner là `.mjs`,
  không qua tsc). Cần parent chạy lại tsc khi các luồng round 62 khác
  xong — R9 không tự sửa file của luồng khác để tránh xung đột.
- `npm run build` apps/web vì vậy cũng fail ở bước `tsc` (chưa tới
  vite); `vite build` trực tiếp thì pass (xem trên).

## 7. Kiểm chứng chi tiết (số thật, Node v24.22.1)

| Suite | Cách chạy | Kết quả |
|---|---|---|
| speedcurveTrim | node trực tiếp ×3 | 18/18, exit 0 mỗi lần |
| speedcurveTrim | bundle cjs ×3 | 18/18, exit 0 mỗi lần |
| speedcurveTrim | bundle esm ×3 | 18/18, exit 0 mỗi lần |
| speedcurveTrim | runner ×2 | 18/18, exit 0 (mode cjs) |
| speedcurveTrim | runner `--mode esm` | 18/18, exit 0 |
| webglLut | runner ×2 | 7/7, exit 0 (MAE 0.4510/0.5058, max 1/2) |
| importProgress41W3 | runner ×2 | 4/4, exit 0 |
| splitPatch.store | runner | 12 pass, 0 fail |
| nestedStore.store | runner | 8 pass, 0 fail |
| i18nAudit56M3 | runner | 13/13 pass ("M3 i18n audit round 56: 13/13 pass" trong log) |
| seek | runner (esm) | 15 passed |
| projectRepo | runner | 10 pass, 0 fail |
| Runner từ `apps/web` (đường dẫn cwd) | runner | webglLut 7/7 + speedcurveTrim 18/18, exit 0 |

Ghi chú: mọi số trong bảng đều đọc từ log chạy của lượt này (file log
thô ở /tmp/r62r9/, đã xóa sau khi đối chiếu — số đã ghi vào tài liệu
này là bản chính).

## 8. Nợ mở (cho đợt sau / parent)

1. **tsc apps/web đỏ do luồng round 62 khác** (xem §6) — parent chạy
   lại sau khi các luồng kia xong; R9 không đụng file của luồng khác.
2. `webglLut` vẫn chỉ chạy bằng bundle cjs (node trực tiếp gãy import
   không đuôi) — đúng quyết định O7, không phải nợ cần sửa, chỉ ghi
   nhận: runner đã mã hóa ngoại lệ này bằng mode mặc định cjs.
3. Warning `empty-import-meta` từ `bridgeUrl.ts:17` vẫn hiện mỗi lần
   bundle cjs (vô hại: `import.meta.env` → undefined theo thiết kế) —
   có thể dập bằng `--log-level=error` ở runner, nhưng giữ warning để
   lần sau ai thêm `import.meta.url` vào test sẽ thấy ngay. Không đổi.
4. Runner chỉ detect top-level await bằng regex await ở cột 0 sau khi
   bỏ comment — đủ cho các test hiện tại; file nào lệch dùng marker
   `@runner` trong header.
5. `ci-security.yml` 403 chưa lên GitHub (nợ cũ, ngoài phạm vi R9).

## 9. Stage (KHÔNG push)

Batch: `~/workspace/repo-1-push/paths-loop/phase9-round62-r9-test-runner.txt`
(NUL-delimited, verify read-back):

- `apps/web/src/components/speed/speedcurveTrim.test.ts` (bỏ
  `import.meta.url`, resolve validate.js từ cwd)
- `apps/web/src/lib/importProgress41W3.test.ts` (bỏ `import.meta.url`,
  đính chính audit ProjectMenu qua `openArchiveFileFlow`)
- `scripts/run-node-test.mjs` (mới — runner chuẩn)
- `docs/DEVELOPER.md` (§12: ma trận + lệnh runner)
- `docs/PHASE9_ROUND62_R9_TEST_RUNNER_LIMITS.md` (tài liệu này)

Không key i18n mới → không có file fragment (parent không cần gộp gì
cho R9).
