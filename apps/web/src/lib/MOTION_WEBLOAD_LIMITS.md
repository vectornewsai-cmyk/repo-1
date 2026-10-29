# MOTION_WEBLOAD_LIMITS.md — Migrate motion ở cổng load web (Phase 9 đợt 12 T4)

## Đã làm gì

Nợ đợt 11 P6: `migrateMotion` (packages/video-spec/src/motion.ts) đã cứu
project cũ mang motionBlur weights 0 / thiếu frames / blur {} nhưng CHỈ nối
vào cổng load của render (server/render/src/validate.js). Đường load project
trên web chưa gọi migrate nên project cũ mở trên web vẫn mang motion lỗi thời.

Đợt này nối migrate vào cổng load web duy nhất: `parseProjectText` trong
apps/web/src/lib/projectRepo.ts (hàm mới `migrateProjectMotion`, chạy SAU
`validateSpecDeep`, TRƯỚC khi trả spec cho editor). Vì `loadProject` (mở file
`.vcut.json`) và `loadAutosave` (khôi phục autosave) đều đi qua
`parseProjectText` nên cả hai cổng web đều được migrate.

Rule set migrate KHÔNG đổi so với P6 (cùng hàm `migrateMotion`, không sửa):
chỉ cứu 4 trường hợp — weights chứa số <= 0 → weights đều; frames vắng mà
weights có mặt → frames = weights.length; frames lệch weights.length →
frames = weights.length; blur rỗng {} → frames = 3. Ngoài ra giữ nguyên để
validate vẫn bắt. Project mới hợp lệ trả về ĐÚNG tham chiếu spec gốc
(không copy, không đổi field nào) — đã có test assert tham chiếu.

## Cổng nào đã có migrate motion

| Cổng | Migrate | Ghi chú |
|---|---|---|
| Web load: mở file `.vcut.json` (`loadProject` → `parseProjectText`) | ✅ đợt 12 T4 | Warning kèm tên clip + note migrate; nhắc lưu lại file để hoàn tất nâng cấp |
| Web load: khôi phục autosave (`loadAutosave` → `parseProjectText`) | ✅ đợt 12 T4 | Cùng code path với mở file, không cần sửa riêng |
| Web load: spec trần không envelope | ✅ đợt 12 T4 | `parseProjectText` xử lý spec trần như mọi file khác |
| Render load: `validateSpec` (server/render/src/validate.js, mirror `normalizeLegacyMotion`) | ✅ đợt 11 P6 | Chạy TRƯỚC `validateMotion`; validate strict vẫn bắt input thô khi gọi trực tiếp |
| Render filter chain: `buildMotionBlurChain` (server/render/src/motion.js) | ✅ đợt 11 P6 | Áp `normalizeLegacyMotion` trước khi dựng chuỗi tmix |
| CLI deep-validate (`cli/src/project.ts` → render `validate.js`) | ✅ gián tiếp qua cổng render | Dùng chung `validateSpec` nên legacy motion được cứu ở bước validate |

## Cổng chưa có migrate (còn nợ, KHÔNG sửa trong đợt này)

- **Khôi phục version lịch sử — `projectHistory.restoreVersion`**
  (apps/web/src/lib/projectHistory.ts): trả spec snapshot từ IndexedDB
  trực tiếp, KHÔNG qua `parseProjectText`, nên không chạy migrate.
  Thực tế giảm nhẹ: snapshot được lưu từ spec đang ở trong bộ nhớ, mà spec
  trong bộ nhớ từ đợt này trở đi đã qua migrate lúc load — chỉ snapshot tạo
  TRƯỚC đợt này mới có thể còn mang motion cũ. Khi export, cổng render vẫn
  cứu (xem bảng trên), nhưng preview web của version khôi phục đó vẫn thấy
  motion cũ. Sửa: gọi `migrateProjectMotion` trong `restoreVersion` (luồng
  khác, ngoài phạm vi T4 — T4 chỉ được sửa migration + projectRepo + test).
- **MCP server**: grep toàn bộ `mcp-server/src` không thấy call nào tới
  `migrateMotion` / `normalizeLegacyMotion` / `validateSpec` — coi như chưa
  có migrate ở tầng MCP. Project đi qua MCP tới render vẫn được cổng render
  cứu, nhưng spec MCP trả về/truyền đi không được chuẩn hoá. Cần luồng khác
  kiểm tra riêng nếu MCP có đường load spec không qua render validate.

## Hành vi ranh giới (đã có test khẳng định, không phải bug)

- Web `validateSpecDeep` KHÔNG kiểm tra motion nên project mang motion mà
  migrate không cứu được (vd frames 9, weights NaN, key lạ) vẫn LOAD ĐƯỢC
  trên web, nguyên vẹn, không warning migrate — và sẽ bị cổng render chặn
  khi export. Đây là thiết kế kế thừa từ P6 (không nới validate), không
  phải là migrate thiếu.
- File hỏng (JSON sai, schema version không hỗ trợ) vẫn fail như cũ:
  migrate motion chạy SAU validate nên không làm file hỏng nào lọt qua.
- `migrateProjectMotion` không mutate spec đầu vào; chỉ clip nào migrated
  mới được thay bằng object mới (spread nông), clip/track khác giữ nguyên
  tham chiếu.

## Kiểm chứng (số thật, 27/10/2026)

- `node apps/web/src/lib/projectRepo.test.ts`: **10 pass, 0 fail** —
  weights 0 → [1,1,1]/frames 3; thiếu frames → frames 3 giữ weights;
  blur {} → frames 3; frames lệch → frames = weights.length giữ weights;
  project mới → spec JSON không đổi, không warning; clip không motion →
  không đổi; nhiều clip → chỉ clip cũ đổi; frames 9 → load nguyên vẹn;
  spec trần → migrate; tham chiếu spec mới giữ nguyên + đầu vào không mutate.
- `node src/test_motion_p6_legacy.js` (dùng lại chứng minh render P6,
  không render lại từ web): **14 pass, 0 fail** — render thật clip cũ
  weights 0 ra MP4 **60 frame / 2s** (cả blur-only lẫn interp + weights 0);
  validateSpec pass 3 dạng project cũ; validateMotion strict vẫn fail
  input thô; chain project mới không đổi.
- `npx tsc --noEmit -p apps/web/tsconfig.json`: file T4 sạch. Toàn app
  còn 1 lỗi duy nhất ở `apps/web/src/preview.tsx` (TS6133, import
  `motionBlurBlendPlan` thừa) — do luồng song song khác đang sửa file đó
  trong cùng đợt 12 (mtime file đổi từng giây lúc kiểm chứng), KHÔNG phải
  do T4 và T4 không được đụng vào (ngoài phạm vi: transitionPreview/ghost
  preview/previewStatus). Cần kiểm chứng lại tsc toàn app sau khi luồng kia
  xong việc.
- Chưa chứng minh: click-test mở project cũ trên browser thật (VM browser
  không tới được dev server — nợ cũ từ trước, không thuộc phạm vi T4);
  đường `loadAutosave` chỉ được chứng minh gián tiếp qua `parseProjectText`
  chung (localStorage không có trong Node test).
