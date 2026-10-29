# Phase 9 đợt 13 C4 — Migrate cho restoreVersion + MCP (LIMITS)

> Ngày: 2026-10-27 (đợt lớn Phase 9 đợt 13, luồng C4). KHÔNG push.
> Nợ đóng: docs/PHASE9_ROUND12_LIMITS.md §3 — "Migrate chưa có ở
> `projectHistory.restoreVersion` (snapshot IndexedDB bypass `parseProjectText`)
> và MCP server (grep không thấy call migrate/validate)".

## 1. Đã nối (đường nào, bằng chứng nào)

### 1a. Web — `restoreVersion` migrate trên bản sao, snapshot gốc giữ nguyên

- `apps/web/src/lib/projectHistory.ts`: thêm `migrateHistorySpec()` (cùng
  rule set với `projectRepo.migrateProjectMotion` đợt 12 T4 và cổng render
  đợt 11 P6 — chỉ clip migrated=true mới thay bằng object mới, project mới
  hợp lệ trả đúng tham chiếu gốc, không mutate input) và gọi nó trong
  `HistoryStore.restoreVersion()` **sau khi deep-copy** snapshot.
- Hệ quả ghi rõ: snapshot gốc trong backend **không bị ghi đè**
  (hash/spec giữ nguyên, lần khôi phục sau vẫn migrate lại từ gốc);
  migration chỉ bền vững khi editor lưu lại thành version mới — đúng như
  cổng mở file của đợt 12 T4. HistoryPanel vốn đã save snapshot "trước khi
  khôi phục" trước khi gọi restore nên không mất trạng thái hiện tại.
- Test `apps/web/src/lib/projectHistory.test.ts`: **15/15** (10 cũ + 5 mới):
  weights 0 → frames=3/weights=[1,1,1]; blur {} → frames=3 cùng snapshot với
  weights [1,2] thiếu frames → frames=2/giữ weights; snapshot gốc vẫn
  weights [0,0,0] + hash không đổi sau khi sửa cả spec trả về; motion mới
  hợp lệ không đổi; không cần migrate → đúng tham chiếu gốc.
- Hồi quy: `projectRepo.test.ts` 10/10, `tsc` web 0 lỗi, `vite build` pass.

### 1b. MCP — migrate nằm trong `validateVideoClip`, phủ mọi cổng

- Phát hiện khi làm: MCP không chỉ "thiếu migrate" mà còn tệ hơn — trước
  đợt này `validateVideoClip` **không đọc `v["motion"]` nên mọi spec qua MCP
  đều LẶNG LẼ LÀM MẤT motion**: `loadProject` trả spec không motion,
  `saveProject` ghi đè file mất motion, `render_video` ghi spec tạm không
  motion cho render worker nên cổng render cũng không còn gì để cứu.
- `mcp-server/src/validate.ts` (điểm duy nhất dựng lại video clip):
  `migrateMotion` rồi mới `validateMotion` (throw → `ValidationError`).
  Vì `store.loadProject`, `store.saveProject` và mọi tool (index, tools/*)
  đều đi qua `validateVideoSpec` nên một chỗ này phủ hết: load, save,
  get_project, render_video, export preset. `store.ts` chỉ thêm ghi chú
  (không đổi logic) để rõ đường dây.
- `mcp-server/src/migrateMotion.test.ts`: **8/8** — 3 dạng cũ (weights 0,
  thiếu frames, blur {}) đều migrate; motion mới giữ nguyên; clip không
  motion không bị thêm motion; lỗi ngoài phạm vi migrate (weights dài 1,
  frames 9, shape cũ interpolation none + targetFps) → `ValidationError`.
- `mcp-server/src/migrateRender.test.ts`: **PASS** — project cũ weights 0
  qua `validateVideoSpec` → ghi file tạm đúng như `render_video` làm →
  render worker ra **MP4 đúng 60 frame / 2s @ 30fps**.
- Hồi quy: render gate đợt 11 P6 `test_motion_p6_legacy.js` **14/14**;
  MCP `tsc -p tsconfig.json` 0 lỗi.
- **Thay đổi hành vi, ghi rõ**: motion không cứu được nay throw ở cổng
  load thay vì lặng lẽ rơi mất như trước — nhất quán với cổng render
  (validate.js cũng fail các shape đó). Kiểm chứng ngày 27/10: **không
  project MCP nào đã lưu chứa motion** (grep `mcp-server/projects/*.json`
  = 0 file) nên thay đổi này không vỡ dữ liệu cũ.
- Load MCP **không tự ghi đè file đĩa**: migration chỉ bền vững khi một
  thao tác sau đó `saveProject` (vd add_clip load rồi save sẽ lưu luôn bản
  đã migrate). `get_project`/`render_video` không ghi đĩa — render dùng
  spec tạm đã migrate, file gốc giữ nguyên.

## 2. Chưa xong / còn thiếu (trung thực)

- `listVersions` / `exportHistory` vẫn trả spec gốc chưa migrate — **cố ý**:
  export giữ nguyên bản gốc để hash kiểm chứng import còn khớp; migrate
  xảy ra lúc restore (đã test). `importHistory` cũng không migrate lúc
  nhập — version nhập vào vẫn được migrate khi restore sau đó.
- Motion trên clip **không phải video** trong MCP validate vẫn bị lặng lẽ
  bỏ (validateAudioClip/TextClip/StickerClip/ImageClip không đọc `motion`):
  theo spec motion chỉ dùng cho video nên clip đó vốn không hợp lệ, nhưng
  MCP hiện drop thay vì throw như nhánh video mới làm — nợ nhỏ, ngoài
  phạm vi đợt này (cần quyết định: throw hay giữ drop cho mọi kind).
- `roundtrip.test.ts` của MCP: **60/61** — 1 fail là kỳ vọng cũ
  "effect glitch bị từ chối", trong khi `glitch` nay đã là EFFECT_TYPE hợp
  lệ (packages/video-spec/src/effects.ts). Test đó không dùng motion nên
  không liên quan tới đợt này; kỳ vọng cần cập nhật ở đợt khác, không sửa
  lén trong đợt này.
- Ghi chú chạy test MCP: header `roundtrip.test.ts` ghi chạy bằng
  `node --experimental-strip-types src/...` nhưng trên Node 24.22 ở đây
  route đó vỡ (`ERR_MODULE_NOT_FOUND` cho `./validate.js` — file .js không
  map sang .ts). Route chạy được là biên dịch rồi chạy dist
  (`npx tsc -p tsconfig.json && node dist/mcp-server/src/*.test.js`);
  2 test mới của đợt này đã ghi đúng route dist trong header.
- Chưa có click-test trình duyệt cho nút khôi phục version (HistoryPanel):
  logic restore đã test bằng MemoryBackend; IndexedDB thật trên trình
  duyệt vẫn chỉ được bảo chứng bởi test Q7 cũ, như mọi đợt trước.
- Chưa đo lại FPS/ảnh hưởng hiệu năng: migrate chỉ chạy một lần lúc load/
  restore, không nằm trong vòng render nên không đo thêm.

## 3. Batch stage (KHÔNG push)

- `~/workspace/repo-1-push/paths-loop/phase9-round13-c4-migrate.txt`
  (7 file text, NUL-delimited, không binary, không dist):
  `apps/web/src/lib/projectHistory.ts`,
  `apps/web/src/lib/projectHistory.test.ts`,
  `mcp-server/src/validate.ts`, `mcp-server/src/store.ts`,
  `mcp-server/src/migrateMotion.test.ts`,
  `mcp-server/src/migrateRender.test.ts`,
  `docs/PHASE9_ROUND13_C4_MIGRATE_LIMITS.md` (file này).
- Không stage: `mcp-server/dist/*` và `apps/web/dist/*` (build output tạo
  ra khi chạy tsc/vite để kiểm chứng).
