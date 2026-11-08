# PHASE9_ROUND58_O7 — webglLut.test.ts chạy được: giới hạn & phương pháp

Luồng O7, đợt 58 (07/11/2026). Đóng nợ đợt 57 §6.7: `webglLut.test.ts`
lỗi có sẵn, không chạy được bằng esbuild cjs lẫn Node type-stripping.
N8 không sửa vì ngoài phạm vi. Tài liệu này nói trung thực: vì sao
2 cách chạy cũ gãy, cách sửa đã chọn, lệnh chạy mới, và nợ còn lại.

## 1. Kết quả

- `webglLut.test.ts` nay chạy xanh bằng **MỘT lệnh có thể lặp lại**
  (esbuild bundle `--format=cjs` + node, chạy từ gốc repo):
  `./node_modules/.bin/esbuild apps/web/src/lib/webglLut.test.ts --bundle --platform=node --format=cjs --outfile=/tmp/round58-o7/webglLut.test.cjs && node /tmp/round58-o7/webglLut.test.cjs`
  → **7/7 pass, exit 0**.
- Số thật: parse `.cube` 17³ (vcut-cinematic) ✓; domain tùy chỉnh +
  TITLE ✓; từ chối rỗng/thiếu size/sai số dòng/LUT 1D ✓; trilinear
  identity passthrough ✓; domain co giãn + clamp ✓;
  CPU trilinear ≈ FFmpeg lut3d: **vcut-cinematic MAE=0.4510, max=1**;
  **cartcut-teal-orange MAE=0.5058, max=2** (khớp số đo thật 24/10:
  MAE ~0.45–0.51, max ≤ 2).
- Chạy từ `apps/web` cũng 7/7 (đường dẫn resolve được cả 2 cwd).
- Hồi quy: `i18nAudit57N8.test.ts` **8/8**; `i18nAudit56M2.test.ts`
  **13/14** — 1 check đỏ là nợ có sẵn, không do luồng này (xem §5);
  `tsc --noEmit` apps/web: **0 lỗi**.

## 2. Nguyên nhân gốc của 2 cách chạy cũ gãy (đã tái hiện cả 2)

### 2a. esbuild `--format=cjs`: `fileURLToPath(import.meta.url)` gãy

Test dùng `path.dirname(fileURLToPath(import.meta.url))` để tìm
thư mục chứa fixture + gốc repo. esbuild cảnh báo khi bundle cjs:

> `"import.meta" is not available with the "cjs" output format and will be empty`

và chạy bundle cjs gãy thật:

> `TypeError [ERR_INVALID_ARG_TYPE]: The "path" argument must be of type string or an instance of URL. Received undefined`
> `at fileURLToPath (.../webglLut.test.cjs:361:79)`

`import.meta.url` là `undefined` trong CJS nên `fileURLToPath`
nhận `undefined`. Đây là lỗi ở **test** (dùng `import.meta.url`
trong file được bundle sang cjs), không phải lỗi `webglLut.ts`.

### 2b. Node type-stripping: `ERR_MODULE_NOT_FOUND .../lib/bridgeUrl`

Chạy `node --experimental-strip-types src/lib/webglLut.test.ts`
(Node v24.22.1) gãy ngay lúc load:

> `Error [ERR_MODULE_NOT_FOUND]: Cannot find module '.../src/lib/bridgeUrl' imported from '.../src/lib/webglLut.ts'`

Nguyên nhân: `webglLut.ts:1` import `./bridgeUrl` **không đuôi**.
Node type-stripping (ESM loader thật, không bundler) bắt buộc
import tương đối phải có đuôi file rõ ràng; esbuild/vite tự
resolve được nên app chạy bình thường, chỉ đường chạy Node thuần
mới gãy. Sửa đuôi `.ts` vào import này thì `tsc` lại gãy **TS5097**
(`allowImportingTsExtensions` không bật trong tsconfig, và
`webglLut.ts` nằm trong `include` của tsc — khác các file test
đã exclude). Vì vậy **không sửa import trong code sản phẩm**;
type-stripping vẫn là đường chạy không hỗ trợ cho suite này.

### 2c. Bẫy phụ: bundle ESM ra /tmp thì `import.meta.url` trỏ sai chỗ

Thử nghiệm trong luồng: bundle `--format=esm` ra `/tmp/o7/*.mjs`
chạy được tới bước đọc file rồi gãy `ENOENT ... /assets/filters/...`
vì `import.meta.url` lúc này là bundle output (`/tmp/o7`), không
còn là file test gốc — `REPO` tính ra thành `/`. Muốn giữ
`import.meta.url` thì bundle phải nằm đúng độ sâu
`apps/web/src/lib/` trong repo, tức tạo artifact trong cây source —
không chấp nhận được. Đây là lý do cách sửa cuối cùng bỏ hẳn
`import.meta.url` thay vì chỉ đổi format bundle.

## 3. Cách sửa đã chọn (ít xâm lấn nhất)

Chỉ sửa **file test** `apps/web/src/lib/webglLut.test.ts`
(không đụng `webglLut.ts`, không đụng `bridgeUrl.ts`, không đụng
tsconfig, không cài thêm dependency — repo không có vitest và
không cần thêm):

1. Bỏ `fileURLToPath(import.meta.url)`; resolve đường dẫn từ
   `process.cwd()` theo đúng mẫu đã có trong repo
   (`silenceModal57N1.test.ts`): thử `apps/web/src` rồi `src`,
   nhận diện bằng `existsSync(<dir>/lib/webglLut.ts)`, lỗi rõ
   ràng nếu chạy sai cwd.
2. `HERE = <SRC_DIR>/lib` (fixture `__fixtures__-webglLut.json`
   nằm cùng thư mục test); `REPO = <SRC_DIR>/../../..`
   (lưu ý: `SRC_DIR` là `apps/web/src` nên repo root phải lên
   **3 cấp**, không phải 2 — bản sửa đầu lên 2 cấp đã sai và
   được bắt ngay khi chạy thử: `ENOENT .../apps/assets/...`).
3. Cập nhật header comment của test: lệnh chạy mới + ghi rõ vì
   sao type-stripping và `import.meta.url` không dùng được
   (để luồng sau không quay lại 2 đường gãy này).

Cảnh báo esbuild còn lại khi bundle là vô hại: `import.meta`
trong `bridgeUrl.ts:17` (đọc `import.meta.env?.VITE_BRIDGE_URL`)
bị để trống ở format cjs → `undefined` → fallback mặc định
`http://127.0.0.1:8787`. Test không gọi bridge nên không ảnh
hưởng kết quả.

## 4. Lệnh chạy (ghi rõ, lặp lại được)

Chạy từ **gốc repo** `~/workspace/repo-1`:

```sh
./node_modules/.bin/esbuild apps/web/src/lib/webglLut.test.ts \
  --bundle --platform=node --format=cjs \
  --outfile=/tmp/round58-o7/webglLut.test.cjs \
  && node /tmp/round58-o7/webglLut.test.cjs
```

Chạy từ `apps/web` cũng được (đổi `./node_modules/.bin/esbuild`
thành `../../node_modules/.bin/esbuild`, outfile giữ nguyên).
Kết quả kỳ vọng: `== KẾT QUẢ: 7 pass ==`, exit 0.

## 5. Hồi quy & nợ mở

- `i18nAudit57N8.test.ts` (chạm `parseCube` userLut + LUT):
  **8/8 pass**.
- `i18nAudit56M2.test.ts`: **13/14**, check đỏ duy nhất là
  `fragment: đủ 156 key ... key exportPanel.bridgeError đã tồn tại
  trong vi.json` — nợ **có sẵn, không do luồng này**: M2 không
  import/đọc `webglLut.test.ts` (grep `webglLut` trong file M2 = 0
  kết quả); check này so trạng thái fragment round56-m2 với
  `vi.json` (key đã merge vào dict nên assert "chưa tồn tại" lỗi
  thời). Cần luồng i18n riêng cập nhật assert M2 sang ngữ nghĩa
  post-merge (cùng mẫu N4 đợt 57 §4).
- `tsc --noEmit` apps/web: **0 lỗi** (test đã exclude khỏi tsc
  từ trước, sửa trong test không ảnh hưởng).
- `vite build` không chạy lại: không file nào trong app bundle
  bị đụng (chỉ sửa file test đã exclude); build đợt 57 vẫn pass
  5.75s.
- Nợ còn lại của suite này: **Node type-stripping vẫn không chạy
  được** `webglLut.test.ts` (import `./bridgeUrl` không đuôi trong
  code sản phẩm). Muốn mở đường đó thì phải hoặc bật
  `allowImportingTsExtensions` (đổi tsconfig toàn repo — ngoài
  phạm vi, cần cân nhắc tác động), hoặc thêm vitest/vite runner
  (repo chưa có vitest). Đường esbuild cjs hiện tại đã đủ và theo
  đúng mẫu các test lib khác, nên không làm thêm.
- Phần GPU (shader WebGL thật) vẫn chỉ kiểm chứng bằng Playwright
  headed như trước (xem R5_LIMITS.md) — suite này chỉ khóa phần
  CPU parse/trilinear.

## 6. File đã đổi/thêm (stage, KHÔNG push)

- `apps/web/src/lib/webglLut.test.ts` (sửa: bỏ `import.meta.url`,
  resolve đường dẫn từ `process.cwd()`, cập nhật header)
- `docs/PHASE9_ROUND58_O7_WEBGLLUT_TEST_LIMITS.md` (file này)

Stage: `~/workspace/repo-1-push/paths-loop/phase9-round58-o7-webgllut-test.txt`
(NUL-delimited, verify read-back) — 2 entry.
