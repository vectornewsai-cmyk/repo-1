# PHASE 9 — Đợt 54 — Luồng K1: Sửa bug `loadProject` không lấy `meta.name` từ bare-spec (LIMITS)

Ngày: 2026-11-07. Repo local `~/workspace/repo-1`.
Luồng K1: sửa bug sản phẩm phát hiện ở đợt 53 (J3 §4.2, LIMITS tổng hợp đợt 53 §4.2).
**Không push, không release/tag, không code giả.**

## 0. Tóm tắt

| Hạng mục | Kết quả |
|---|---|
| Bug gốc | bare-spec `.vcut` (chỉ có `meta.name`) load xong tên kẹt "Dự án không tên" |
| Fix | `parseProjectText` nhánh bare-spec nay đọc `spec.meta.name` |
| Test mới `loadProject54K1.test.ts` | **7/7 PASS** |
| Fixture H9 thật trên đĩa | `H9-Fixture.vcut` → "H9 Doubleclick", `H9-SecondInstance.vcut` → "H9 Second" |
| Hồi quy `projectRepo.test.ts` | **10/10 PASS** |
| Hồi quy `projectRepoRound49E4.test.ts` | **13/13 PASS** |
| `tsc --noEmit` apps/web | **0 lỗi** |
| `vite build` apps/web | **pass** (17,39 s) |

## 1. Bug (đọc code, khớp chữ ký đợt 53 J3)

- `openProjectFromPath` (`apps/web/src/desktop.ts:135`) → `openProjectFileFlow`
  (`apps/web/src/lib/openProjectFlow.ts:96`) → `loadProject` → `parseProjectText`
  (`apps/web/src/lib/projectRepo.ts`). Desktop không có `loadProject` riêng —
  nó dùng chung code web qua renderer, nên điểm sửa duy nhất là `parseProjectText`.
- Trong `parseProjectText`, nhánh envelope đọc `data.name`, nhưng nhánh bare-spec
  (file không có envelope, chỉ là video-spec trần) không đọc gì cả — `name` giữ
  mặc định `"Dự án không tên"` rồi trả về ở `:1155`.
- Fixture H9 (`hidden_files/h9/fixtures/H9-Fixture.vcut`, tạo bởi
  `make-fixture.mjs`) là bare-spec với `meta: { name: "H9 Doubleclick", ... }`
  — đúng trường hợp này. M7/D2b đợt 53 fail đúng chữ ký: `onOpenFile: true`,
  `currentPath` đúng, tên sai.

## 2. Fix (1 chỗ duy nhất trong logic sản phẩm)

`apps/web/src/lib/projectRepo.ts`, nhánh `else` (bare-spec) của `parseProjectText`:

- Nếu `data.meta.name` là chuỗi khác rỗng (sau `trim`) thì `name = data.meta.name`.
- Thiếu/rỗng/không phải chuỗi → giữ mặc định `"Dự án không tên"` (fallback cũ).
- An toàn với migrate: `migrate()` trong `packages/video-spec/src/migrations.ts`
  chỉ deep-clone + bump version, không đổi `meta`; tên đọc trước migrate vẫn đúng
  sau migrate (test 7 chứng minh với spec 0.1.0).
- Không đổi nhánh envelope: envelope có `name` thì envelope thắng `meta.name`;
  envelope thiếu `name` vẫn fallback `"Dự án không tên"` như cũ.
- `validateSpecDeep` vốn đã yêu cầu `meta.name` là chuỗi khác rỗng
  (`projectRepo.ts:577-579`), nên mọi bare-spec hợp lệ đều có `meta.name` thật —
  không có trường hợp "bare-spec hợp lệ nhưng không có name" để fallback.

## 3. Test mới — `apps/web/src/lib/loadProject54K1.test.ts` (7/7 PASS)

Chạy: `node apps/web/src/lib/loadProject54K1.test.ts` — số thật:

1. bare-spec `meta.name "H9 Doubleclick"` → tên đúng + warning legacyEnvelope — PASS
2. `loadProject(File bare-spec "H9 Second")` → tên đúng (đúng hàm desktop/web dùng) — PASS
3. bare-spec `meta.name` rỗng → load fail ở validate, không trả tên rác — PASS
4. bare-spec thiếu `meta.name` → load fail ở validate — PASS
5. envelope không có `name` → fallback cũ `"Dự án không tên"` — PASS
6. envelope có `name "Đã đổi tên"` + `meta.name` khác → envelope thắng — PASS
7. bare-spec version 0.1.0 → migrate xong vẫn giữ `meta.name` — PASS

Đỏ-trước: trước fix, test 1/2/7 fail (trả `"Dự án không tên"`) — suy ra trực tiếp
từ code cũ (nhánh bare-spec không gán `name` bao giờ); không chạy lại bản cũ vì
repo-1 không phải git repo, không revert được bằng git.

Hồi quy trên cùng cây (không đụng logic khác, chỉ đối chiếu):
- `projectRepo.test.ts`: 10/10 PASS.
- `projectRepoRound49E4.test.ts`: 13/13 PASS.

## 4. File đã chạm

- `apps/web/src/lib/projectRepo.ts` — fix (1 khối `if` trong nhánh bare-spec).
- `apps/web/src/lib/loadProject54K1.test.ts` — test mới (7 test).
- `apps/web/tsconfig.json` — thêm `src/lib/loadProject54K1.test.ts` vào `exclude`
  (file chung, bắt buộc theo quy ước repo: mọi file `*.test.ts` dùng
  type-stripping đều nằm trong `exclude`; không sửa thì `tsc --noEmit` báo lỗi
  TS5097 ở file test mới. Chỉ thêm 1 dòng, không đổi option nào).
- `docs/PHASE9_ROUND54_K1_LOADPROJECT_LIMITS.md` — file này.

Không chạm: `apps/desktop` (không có code `loadProject` riêng), dict i18n,
`package.json`, logic save/serialize.

## 5. Nợ mở (cho đợt sau, không thuộc K1)

1. **D1 argv double-click** (J3 §6.1): argv `.vcut` lúc khởi động không tới
   renderer (`onOpenFile: false`, log không có dòng argv) — khác đường
   second-instance (D2b) vốn hoạt động. K1 chỉ sửa tên sau khi file đã load,
   không đụng argv parse / thời điểm gửi `vcut:open-file`.
2. **Dialog discard-confirm `window.confirm`** (J3 §5): vẫn treo nếu project
   dirty khi mở file — harness phải trả lời chủ động; không phải việc K1.
3. **GTK typing M4/M5/D2a** (J1): nợ riêng, không liên quan tên project.
4. Chưa kiểm chứng headed/Electron thật: fix nằm ở tầng parse thuần (đã đo bằng
   fixture thật trên đĩa), nhưng M7/D2b click-test trên AppImage phải chạy lại
   ở đợt harness sau mới xác nhận đường menu/recent hết kẹt tên.

## 6. Stage

Batch K1 (file text, NUL-delimited — xem
`~/workspace/repo-1-push/paths-loop/phase9-round54-k1-loadproject.txt`):

- `apps/web/src/lib/projectRepo.ts`
- `apps/web/src/lib/loadProject54K1.test.ts`
- `apps/web/tsconfig.json`
- `docs/PHASE9_ROUND54_K1_LOADPROJECT_LIMITS.md`

Bằng chứng đo đạc (log test/build): `~/workspace/goals/capcut-clone-video-editor/hidden_files/round54-k1-loadproject-evidence.log` — không stage.
