# PHASE9 ROUND86 N8 — EPERM: nối helper retry vào 1.211 điểm ghi còn lại + probe sóng

> Luồng N8, đợt 86 vòng lặp Phase 9 VCut Studio (lượt cron 09:35 +07,
> 11/11/2026; làm việc ~09:38–~10:15 +07, tức 02:38–03:15Z). Nhiệm vụ:
> đếm lại số writeFileSync/writeFile chưa nối helper + nối một đợt lớn
> tiếp theo (ưu tiên script test/benchmark/probe và server ghi file) +
> probe sóng EPERM nền trong suốt lượt. KHÔNG push, KHÔNG release/tag,
> KHÔNG binary, KHÔNG workflow.

## 0. Kết quả headline

- **Đã nối helper vào 1.211 lần gọi ghi** (1.174 sync + 37 async) trong
  **533 file**: 530 file bằng script có assert + 3 file làm tay
  (2 file packages + 1 file r82j4 còn sót).
- **Số dòng `writeFileSync` còn lại: 1.281 → 126 (−90,2%)**; dòng
  `writeFileEpermRetry`: 175 → 1.917. Dòng `writeFile` async chưa nối:
  41 → 10 — 10 dòng còn lại toàn là helper nội bộ / fake-fs trong test
  / mẫu code trong docs, **không còn đường ghi async production nào
  chưa nối**.
- **Test đều xanh:** helper gốc 22/22, port CJS 8/8, port desktop
  11/11; `node --check` **533/533 file đã nối**; import/require helper
  resolve đúng + ghi thật từ cả 9 độ sâu thư mục (attempts=1, đủ byte);
  chạy thật `gen-transitions-mirror.mjs` qua đường đã nối: regen 82
  types / 82 meta, md5 output khớp bản trước (không đổi nội dung).
- **Sóng EPERM: KHÔNG gặp trong lượt này** (probe N8 #1–#4, 02:39–
  03:09Z, 0 fail) — nhưng KHÔNG tuyên bố "đã hết hẳn" (xem §1).
  Probe nền TIẾP TỤC CHẠY tới ~05:09Z (16 lần); đọc
  `hidden_files/round86-n8/eperm-probe.log` để có đủ mẫu.
- **Không thêm i18n key nào** (luồng này không đụng UI/chuỗi hiển thị).

## 1. Sóng EPERM: probe N8 + bối cảnh

| Mốc (UTC 11/11) | Nguồn | Diễn biến |
|---|---|---|
| 01:21:56Z | Probe M5 #11 (đợt 85) | OK 2/2 — lần cuối trước khi probe CHẾT (không có dòng `probe end`); VM reboot ~02:03Z (uptime 35 phút lúc 02:38Z) nên #12–#16 mất dữ liệu. Đây là lần thứ 2 probe nền chết không rõ lý do (L6 đợt 84 cũng chết sau #10). |
| 02:39:24Z | Probe N8 #1 | OK 2/2 (5000 + 5000) |
| 02:49:24Z | Probe N8 #2 | OK 2/2 |
| 02:59:24Z | Probe N8 #3 | OK 2/2 |
| 03:09:28Z | Probe N8 #4 | OK 2/2 (lúc kết sổ) |
| (tiếp) | Probe N8 | Chạy nền bằng setsid + nohup tới 16 lần (~05:09Z); đọc `hidden_files/round86-n8/eperm-probe.log`. |

**Kết luận: không gặp sóng trong lượt này (4/4 probe OK), nhưng đây
chỉ là "không gặp trong lúc đo".** Sóng đã tái phát 3 lần sau các lần
"đã hết" trước đây, và khoảng mù 01:22Z–02:39Z (probe M5 chết + VM
reboot) không có quan sát nào — không tuyên bố EPERM đã hết hẳn.
Probe nền vẫn có thể chết không rõ lý do (M5, L6): đọc log phải kiểm
tra có dòng `probe end` không.

## 2. Kiểm kê: đếm trước/sau theo thư mục (đếm bằng rg, loại node_modules/dist/release/bundled-server/.venv*/chrome-userdata/.eperm-probe*)

| Thư mục | writeFileSync đầu lượt (02:40Z) | Cuối lượt (03:10Z) | Đã nối trong lượt |
|---|---|---|---|
| apps/web/scripts | 794 | 43 | 751 dòng (369 file) |
| server | 372 | 11 | 361 dòng (153 file) |
| apps/desktop | 55 | 36 | 22 lần gọi sync + 31 lần gọi async (12 file) |
| mcp-server | 1 | 1 | 0 (test, xem §4) |
| cli | 0 | 0 | 0 |
| packages | 5 | 0 | 5 dòng (2 file, làm tay) |
| benchmarks | 16 | 0 | 16 dòng (7 file) |
| apps/web/src | 5 | 5 | 0 (test, xem §4) |
| apps/web/e2e | 3 | 0 | 3 dòng (3 file) |
| **Tổng writeFileSync** | **1.281** | **126** | **1.155 dòng (−90,2%)** |
| writeFileEpermRetry | 175 | 1.917 | +1.742 dòng |
| writeFile async chưa nối | 41 | 10 | 31 dòng async |

Lưu ý về số đếm (trung thực): đầu lượt đếm 1.281 (tăng từ 1.201 cuối
đợt 85 — các luồng đợt 86 khác thêm script mới trong lúc đếm); cuối
lượt 126. Hiệu số 1.155 dòng KHÔNG khớp đúng số lần gọi đã nối
(1.211) vì: (a) đếm theo dòng, một dòng có thể chứa 2 lần gọi; (b)
các luồng đợt 86 khác thêm/xóa file trong lúc N8 làm việc (vd 2 file
r86n7 mới xuất hiện sau lúc quét — xem §4); (c) 530 file script +
3 file tay có assert trước/sau từng file nên con số đáng tin là
**1.211 lần gọi đã nối**, không phải hiệu số grep. Số dòng
`writeFileEpermRetry` +1.742 gồm 1.211 lần gọi + 532 dòng import/
require mới (530 file script + 2 file packages; r82j4 nối vào import
đã có sẵn nên không thêm dòng).

### Còn lại 126 dòng — thành phần (đếm cuối lượt, liệt kê theo file)

- **docs/*.md: ~30 dòng** — mẫu code trong tài liệu LIMITS các đợt
  trước, không phải code chạy.
- **Launcher sinh code con: 22 dòng** — 5 file measure-*-launcher
  (`fs.writeFileSync` nằm trong string/template sinh script con;
  nối vào sẽ làm code con gọi helper mà không import → gãy). Bỏ qua
  có lý do.
- **Test fake-fs / fixture cố tình: ~40 dòng** — `*.test.cjs`/
  `*.test.ts` trong desktop/src/services + server (fake `fsImpl`
  cho test helper, mock), `outputQA.js:216` (fixture cắt nửa file
  cố tình), `gpuencode.js:422` (ghi "{json hỏng" cố tình trong
  self-test), `test-qa-failpath.js` / `test-qa-integration.js`
  (fixture fail-path).
- **Helper nội bộ: 4 dòng** — chính `writeFileSync` bên trong
  `eperm-retry.mjs` / `eperm-retry.cjs` / `epermRetry.js` (điểm gốc
  mà helper bọc lại, đương nhiên không tự nối vào chính nó).
- **Bản copy generated: 10 dòng** — `apps/desktop/release-round55-l4/
  linux-unpacked/...` (bản unpack đóng gói, không phải source).
- **Shell script: 6 dòng** — `.sh` chứa chuỗi "writeFileSync" trong
  text (không phải code JS).
- **File luồng khác mới tạo: 2 dòng** — `r86n7-weights-analyze.mjs`,
  `r86n7-phase-analyze.mjs` (luồng N7 tạo lúc 02:55/03:04Z, vẫn đang
  sửa — không đụng để tránh đè; để đợt sau).
- **Test TS: 5 dòng** — `apps/web/src/lib` (2 file) + `mcp-server/src/
  migrateRender.test.ts` (1 dòng) + 2 file `seek-*-retry-probe.ts`
  (chưa nối vì là .ts — import helper .mjs từ test TS cần kiểm riêng;
  để đợt sau).
- **r82j4-media-build1920.mjs: 1 dòng → đã nối tay trong lượt này**
  (xem §3.4) nên không còn trong 126.

### writeFile async còn lại: 10 dòng, toàn bộ không phải production

`test_round83_k8_eperm_retry.mjs` (4, fake fsImpl) +
`epermRetry.test.cjs` (3, fake fsImpl) + `eperm-retry.mjs` (1, chính
helper) + `epermRetry.js` (1, chính helper) + 1 dòng mẫu code trong
`docs/PHASE9_ROUND85_M5_EPERM_WIRING_LIMITS.md`. **Không còn đường ghi
async production nào chưa nối** — khớp kết luận của M5 đợt 85.

## 3. Đã nối: 1.211 lần gọi / 533 file

### 3.1 Phương pháp: script nối có assert (`/tmp/n8-wire.py`, lưu bản sao kèm log)

Không nối tay 530 file. Script quét từng file, chỉ nối khi MỌI lần
gọi trong file đều khớp mẫu an toàn, rồi assert từng file:

- **Mẫu an toàn:** `fs.writeFileSync(path, data)` 2 đối số, hoặc 3 đối
  số với đối số 3 là literal `"utf8"`/`"utf-8"` hoặc object chỉ có key
  `encoding`; đối số 1 không phải fd/số; đối số 2 không phải số.
  Đối số 3 dạng string được giữ nguyên khi truyền vào helper (helper
  đọc `opts.tries ?? 5` nên string không làm lệch nhịp retry).
- **Chỉ đổi tên callee** (`fs.writeFileSync(` → `writeFileEpermRetry(`,
  `fs.writeFile(` → `writeFileEpermRetryAsync(`) + chèn 1 dòng
  import/require sau dòng import `fs`. KHÔNG đổi logic ghi, không đổi
  đường dẫn, không đổi thứ tự ghi.
- **Bỏ qua file** nếu: đã import helper; chứa mock/fake-fs
  (`jest.`, `vi.fn`, `sinon`, `memfs`, `expect(fs.writeFileSync`,
  `fsImpl`, …); có lần gọi trong comment / trong string literal /
  trong template literal sinh code con; có đối số 3 là flag/mode/
  options object khác; không tìm được dòng import `fs`; đuôi `.sh`/`.ts`.
- **Assert từng file:** số lần gọi mới == số lần gọi cũ; còn 0
  `fs.writeFileSync(`; đúng 1 dòng import helper; mtime không đổi
  giữa lúc quét và lúc ghi (tránh đè file luồng khác đang sửa — 0 file
  bị skip vì lý do này).
- **Bẫy đã bắt được trước khi apply:** (1) `"esm-async".endswith
  ("sync")` là True trong Python — nhánh sync đã nuốt cả nhóm async ở
  dry-run đầu (0 file async); đã sửa thành so sánh kind chính xác.
  (2) Quét template-literal toàn file bắt được `freeze-dist.test.mjs`
  (1 lần gọi trong template `MUTATOR` sinh script con) — loại khỏi
  đợt nối. (3) Trailing comma sau đối số 2 (`fs.writeFileSync(\n a,\n
  b,\n)`) bị tính thành đối số 3 rỗng — đã sửa, cứu được
  `test_v11/v12_parity.js`.

### 3.2 Nhóm script: 530 file / 1.207 lần gọi

| Nhóm | File | Lần gọi | Helper dùng |
|---|---|---|---|
| server/render/src (CJS) | 106 | 266 | `require("../../eperm-retry.cjs")` |
| server/render gốc (CJS) | 26 | 38 | `require("../eperm-retry.cjs")` |
| server/bridge/test (CJS) | 19 | 57 | `require("../../eperm-retry.cjs")` |
| benchmarks/*.cjs (CJS) | 2 | 2 | `require("../server/eperm-retry.cjs")` |
| **CJS sync tổng** | **153** | **363** | port `server/eperm-retry.cjs` |
| apps/web/scripts (ESM) | 348 | 769 | `import ... from "./eperm-retry.mjs"` |
| benchmarks/render (ESM) | 14 | 19 | `.../apps/web/scripts/eperm-retry.mjs` |
| apps/desktop/scripts (ESM sync) | 5 | 22 | `.../web/scripts/eperm-retry.mjs` |
| apps/web/e2e (ESM) | 3 | 3 | `../scripts/eperm-retry.mjs` |
| **ESM sync tổng** | **370** | **813** | helper gốc |
| apps/desktop/scripts (ESM async) | 7 | 31 | `writeFileEpermRetryAsync` |
| **Tổng script** | **530** | **1.207** | |

Chi tiết từng file: `hidden_files/round86-n8/wire-results.json`
(530 entry + 15 file bỏ qua có lý do).

### 3.3 Nhóm làm tay: 3 file / 4 lần gọi

- `packages/video-spec/scripts/sync-catalog-mirror.mjs` (2 gọi) +
  `gen-transitions-mirror.mjs` (1 gọi): dùng bare
  `import { readFileSync, writeFileSync } from "node:fs"` nên script
  không xử lý được — sửa import thành `readFileSync` + helper, đổi
  tên callee. **Lỗi do N8 ghi tay:** lúc đầu ghi sai đường dẫn tương
  đối (`../../apps/...` thay vì `../../../apps/...` — từ
  `packages/video-spec/scripts` phải lên 3 cấp mới tới repo root);
  lỗi bị bắt ngay bởi test import thật (§5) và đã sửa + verify lại
  (import OK, ghi thật 80 byte). Bài học: đường dẫn tương đối phải
  verify bằng import thật, không tính nhẩm.
- `apps/web/scripts/r82j4-media-build1920.mjs` (1 gọi): M5 đợt 83 đã
  nối `ff()` qua `runSyncEpermRetry` nhưng sót 1 dòng
  `fs.writeFileSync(plainPath, plain1280)` (dòng 132); nối vào import
  helper đã có sẵn (`import { runSyncEpermRetry, writeFileEpermRetry
  }`), `node --check` OK.

### 3.4 Không đụng (ghi rõ để đợt sau không nối trùng)

Xem §2 (126 dòng còn lại) + §3.1 (luật bỏ qua). Riêng 2 file r86n7
của luồng N7: mới tạo trong lúc N8 làm việc, mtime 02:55/03:04Z —
không đụng để tránh đè file đang sửa.

## 4. Kiểm chứng đã làm (số thật)

- **Test helper (không sửa helper, chỉ chạy lại):** gốc 22/22,
  port CJS 8/8, port desktop 11/11 — ALL PASS, exit 0.
- **`node --check`: 533/533 file đã nối OK** (530 file script chạy
  batch — 530/530, không fail file nào; 2 file packages + 1 file r82j4
  check tay). Batch check chạy ~10 phút (mỗi lần gọi node ~1 s).
- **Import/require resolve + ghi thật từ cả 9 độ sâu:** dynamic
  import/require helper từ apps/web/scripts, benchmarks/render,
  apps/desktop/scripts (cả sync + async), apps/web/e2e,
  server/render/src, server/render, server/bridge/test, benchmarks,
  packages/video-spec/scripts — tất cả resolve đúng và ghi thật đủ
  byte (40–100 byte, attempts=1, không retry — đúng kỳ vọng khi
  không có sóng). File chứng minh: `/tmp/n8-resolve-*` (9 file,
  40–100 byte).
- **Chạy thật 1 script đã nối end-to-end:**
  `gen-transitions-mirror.mjs` → regen `transitions.js` (82 types,
  82 meta entries), exit 0, md5 output
  `65830986e6c2a13330c7df0b6915010b` KHỚP bản trước khi chạy — ghi qua
  helper nhưng nội dung không đổi nên file này KHÔNG đưa vào batch
  stage (chỉ đổi mtime).
- **Quét template-literal sau nối:** không còn `writeFileEpermRetry`
  nào nằm trong text template sinh code con (chỉ còn file đã loại
  `freeze-dist.test.mjs` + 5 launcher — đều không nối).
- **Không chạy lại các test/measure script đã nối** (530 file — chạy
  hết là không khả thi trong một luồng; mỗi file đã qua `node --check`
  + helper đã qua fault-injection + import resolve từng độ sâu).
  Các script đo chạy lại trong đợt sau sẽ tự chứng minh đường ghi đã
  nối khi chúng ghi kết quả.

## 5. Giới hạn trung thực / nợ mở

1. **EPERM KHÔNG được tuyên bố là đã hết.** Probe N8: 0 fail (4/4
   tới lúc kết sổ), nhưng sóng đã tái phát sau 2–3 lần "đã hết" trước
   đây; khoảng mù 01:22Z–02:39Z không có quan sát. Probe nền tiếp tục
   tới ~05:09Z — parent đọc log để có đủ 16 lần.
2. **Probe nền chết 2 lần liên tiếp** (L6 sau #10, M5 sau #11 — đều
   không có dòng `probe end`, đều trước VM reboot). Nguyên nhân chưa
   rõ (có thể phiên spawn bị dọn); probe N8 dùng cùng cách chạy
   (setsid + nohup) nên cũng có thể chết giữa chừng — đọc log phải
   kiểm tra dòng `probe end`.
3. **Retry 5×20 s KHÔNG qua được sóng dài ~15 phút** (luật K8 giữ
   nguyên). Helper chỉ cứu sóng ngắn/lần fail lẻ.
4. **Chưa nối:** 126 dòng còn lại (xem §2) — phần lớn là docs mẫu,
   fake-fs trong test, fixture cố tình, bản copy generated, code sinh
   ra trong string/template, 2 file r86n7 của luồng khác, 5 dòng test
   TS. Không còn đường ghi production nào chưa nối trong các thư mục
   đã quét, ngoại trừ `store.ts` ghi không nguyên tử (nợ từ M5, không
   làm trong luồng này).
5. **Đồng bộ 3 bản helper** vẫn là việc tay (`.mjs` gốc, `.cjs`
   server, `.js` desktop) — không có test tự động bắt lệch hợp đồng.
   Luồng này KHÔNG sửa helper nên không thêm rủi ro lệch.
6. **Rủi ro va chạm luồng song song:** 8–10 luồng đợt 86 cùng sửa
   cây; script nối có kiểm tra mtime trước khi ghi (0 file bị skip vì
   lý do này) nhưng vẫn có cửa sổ đua nhỏ giữa lúc đọc và lúc ghi.
   Parent ở closing nên kiểm tra lại các file chung nếu luồng khác
   báo xung đột. 2 file r86n7 mới xuất hiện sau lúc quét là bằng
   chứng các luồng khác vẫn đang thêm file.
7. **TTS 39:** không đụng (cấm kiểm lại mỗi đợt).
8. **Không thêm i18n key** — không cần bump test khóa số key.

## 6. File của đợt (stage, KHÔNG push)

- 530 file script (xem `hidden_files/round86-n8/wire-results.json`).
- 2 file packages làm tay + 1 file r82j4 sửa tay.
- Docs: `docs/PHASE9_ROUND86_N8_EPERM_WIRING_LIMITS.md` (file này).

Batch stage: `~/workspace/repo-1-push/paths-loop/phase9-round86-n8-eperm-wiring.txt`
(NUL-delimited; 534 entry — 533 file code + 1 LIMITS; verify bằng
cách đọc lại: mọi entry tồn tại và là text).

Dữ liệu thô (KHÔNG stage): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round86-n8/`
(log luồng `../round86-n8.md`; `eperm-probe.log` + `probe-eperm.sh` —
probe nền vẫn chạy tới ~05:09Z; `wire-results.json`).
Script nối: `/tmp/n8-wire.py` (không stage — công cụ một lần; logic
ghi trong LIMITS §3.1 để đợt sau tái dùng).
