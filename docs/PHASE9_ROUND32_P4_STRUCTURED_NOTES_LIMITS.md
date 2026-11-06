# Phase 9 đợt 32, luồng P4 — StructuredNote: archive quét nested + khảo sát errorDetail — GIỚI HẠN

Ngày: 2026-11-01. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop (parent lo). KHÔNG đụng seek, dip,
CLI, cdp-snapshot, WebCodecs, autosave, preview.tsx, server/bridge.

## 0. Đọc trước: phần lớn brief P4 đã được luồng O4 làm xong

Brief P4 (archive sang cấu trúc + quét blob nested + một trong
errorDetail/motion) trùng với công việc luồng O4 đợt 32 đã hoàn thành
và ghi trong `docs/PHASE9_ROUND32_O4_STRUCTURED_NOTES_LIMITS.md`
(đọc kỹ trước khi merge đợt này):

- Chuỗi thiếu media của archive → `archiveMissingExport` /
  `archiveMissingImport` (code + params, i18n vi/en): O4 XONG.
- Blob trong nested được quét đệ quy (`findBlobWarningItems`): O4 XONG
  (test khóa giới hạn đợt 31 đã đảo ngược có chủ đích).
- Notes motionMigrated sang en (cases suy từ dữ liệu gốc, tầng web):
  O4 XONG.
- Toast lỗi ProjectMenu click-test qua `DOM.setFileInputFiles`: O4
  XONG (11/11) — nợ "file chooser native không click-test được" của
  đợt 31 vì vậy đã đóng, không còn là nợ mở.
- i18n lúc O4 chốt: vi = en = 918 key lá.

Luồng P4 KHÔNG làm lại các mục trên (làm lại sẽ chỉ tạo xung đột
merge, không thêm giá trị). Phần việc mới thật sự của P4 là nợ §3.2
của O4 — mục duy nhất trong mảng archive/quét mà O4 ghi rõ "để đợt
sau, không làm lén" — cộng khảo sát errorDetail để ghi nợ chính xác
(xem §3).

## 1. Đã làm

### (1) `collectMediaSrcs` đệ quy vào nested — XONG

- `apps/web/src/lib/archive.ts` — `collectMediaSrcs` nay duyệt đệ quy
  vào `subSpec` của clip nested, cùng mẫu `findBlobWarningItems`
  của O4: pre-order (clip ngoài trước khi xuống subSpec của nó),
  seen-set sao chép theo nhánh (subSpec dùng chung ở 2 clip anh em
  vẫn quét đủ cả hai; subSpec tự trỏ lại không treo), `blob:` vẫn
  loại như cũ (archive không đóng gói được blob: URL; cảnh báo blob
  thuộc về save/load, không thuộc archive).
- Hệ quả có chủ đích, đã khóa bằng test (không phải tác dụng phụ
  lén): stats export (`mediaFiles`/`mediaBytes`) nay tính cả src
  trong nested khi có file gốc; chuỗi + note thiếu media
  (`archiveMissingExport`/`archiveMissingImport` của O4, không thêm
  key mới) nay bao gồm cả src nested thiếu file gốc — cả chiều
  export lẫn chiều import (import so src của spec đã parse với
  media trong zip, cùng qua `collectMediaSrcs`).
- Không đổi hành vi spec chỉ có clip cấp cao (test khóa riêng);
  `collectMediaSrcs` trước P4 chỉ được dùng trong chính archive.ts
  (export + import) nên không có consumer nào khác bị ảnh hưởng.

### (2) Test thật — 7/7 qua bundle esbuild, code thật, không mock

- Mới `apps/web/src/lib/archiveNested32P4.test.ts`: **7 pass, 0 fail**.
  - collect: cấp cao + nested 1 cấp + 2 cấp đúng thứ tự pre-order;
    trùng tên dedupe 1 lần (kể cả subSpec dùng chung 2 clip anh em);
    blob: trong nested bị loại + cycle không treo; spec cấp cao giữ
    nguyên hành vi cũ.
  - export thật (JSZip thật): nested thiếu gốc → note
    `archiveMissingExport` với `shown` chứa đúng tên nested,
    fallback có trong warnings chuỗi, stats chỉ tính media có gốc.
  - Vòng tròn export→import thật: đủ gốc cả nested → zip chứa media
    nested, import trả đủ mediaFiles (tên nested có mặt), không note
    thiếu; export thiếu nested rồi import lại → import cảnh báo
    `archiveMissingImport` đúng tên nested, mediaFiles chỉ có top.
- Cách chạy (ghi rõ vì khác quy ước test Node trực tiếp): archive.ts
  import `"./projectRepo"` không đuôi nên Node type-stripping trực
  tiếp KHÔNG resolve được — đã chứng minh bằng lệnh import thử
  (`Cannot find module '.../lib/projectRepo'`), lỗi có từ trước,
  không phải của P4. Vì vậy test chạy qua esbuild bundle code thật
  (archive + projectRepo + @repo-1/video-spec + JSZip, không mock):
  `cd ~/workspace/repo-1 && ./node_modules/.bin/esbuild
  apps/web/src/lib/archiveNested32P4.test.ts --bundle --platform=node
  --format=esm --outfile=/tmp/vcut-p4-archive-test.mjs &&
  node /tmp/vcut-p4-archive-test.mjs` (outfile ở /tmp, ngoài repo).
- Hồi quy (node trực tiếp, các suite liên quan save/load/archive):
  saveToast31 15/15, structuredNotes32 12/12, projectRepo 10/10,
  projectRepoNested22 7/7, projectRepoRound26J5 15/15, loadReport
  10/10, loadReportFix28 8/8, loadReportPerLine29 14/14, assetStore
  22/22, projectHistory 15/15, textStyle27K1 6/6, textStyle32O6D7
  6/6, curveFixKeyframe30 21/21, curveFixRound27K2 17/17 — tổng
  hồi quy **178 xanh**, cộng 7 mới = **185 xanh, 0 fail**.
- `npx vite build` (apps/web): **pass** (4.39s).
- i18n: **không thêm key mới** (dùng lại 2 key archiveMissing* của
  O4) nên parity giữ nguyên vi = en = **918 key lá**; test parity
  của structuredNotes32 (12/12) vẫn xanh, không cần sửa.

## 2. Kết quả kiểm chứng (chạy thật, 01/11/2026)

- archiveNested32P4 **7/7** (bundle esbuild, code thật); hồi quy
  **178 xanh**; vite build **pass**; i18n **918 = 918**.
- tsc: **6 lỗi, KHÔNG lỗi nào thuộc file P4** (xem §3.4).

## 3. Chưa làm / giới hạn trung thực

1. **errorDetail của bridge CHƯA sang cấu trúc/i18n** (mục 3 của
   brief, phần P4 chọn khảo sát thay vì làm dở): rào cản đã xác
   định cụ thể, không phải "khó chung chung":
   - Bridge (đợt 28 L3) đã trả `code` có cấu trúc, nhưng `summary` /
     `details` nhúng nguyên dòng stderr thô: dòng ffmpeg tiếng Anh,
     dòng validator tiếng Việt từ render worker, tên file đã redact.
     Chỉ một thiểu số summary là câu đóng khung dịch được (WORKER_EXIT
     thoát mã 0, bị kill bởi signal, thoát với mã N, UNKNOWN) — dịch
     riêng nhóm này ở tầng web sẽ cho UI nửa dịch nửa thô, tệ hơn
     giữ nguyên và dễ gây hiểu lầm là đã dịch xong.
   - Cách sửa đúng là bridge phát thêm `summaryKey` + params (cùng
     lúc phân loại trong `server/bridge/src/errorDetail.js`), rồi web
     dịch qua key theo code; nhưng đó là đổi contract bridge +
     consumer CLI/MCP (`formatErrorDetail`) + suite
     `server/bridge/test/test-error-detail.cjs` — ngoài phạm vi file
     của brief P4 (chỉ toast/StructuredNote, archive, quét blob,
     i18n, test, LIMITS này) nên P4 KHÔNG đụng vào. Để đợt sau có
     phạm vi bridge làm, không claim đã xong.
   - Phần web đã dịch được từ trước vẫn nguyên: tiêu đề
     `exportPanel.errorDetailTitle` (mã) + dòng
     `exportPanel.errorDetailMore` (số dòng lược) — chỉ summary /
     details thô là dữ liệu, giữ nguyên theo đúng mẫu đợt 31.
2. **Không có click-test browser mới cho P4**: luồng này là subagent
   nên không có live-browser delegation; wiring archive mới được
   khóa bằng test bundle Node (export/import thật qua JSZip) +
   vite build, không bằng click-test. Toast lỗi ProjectMenu thì O4
   đã click-test 11/11 (xem §0) — P4 không claim lại thành tích đó.
3. **Không có test render React** cho ProjectMenu/App/panel (như mọi
   đợt trước, không chạy được bằng Node type-stripping).
4. **tsc 6 lỗi thuộc luồng khác, P4 không sửa** (tránh xung đột
   merge): `apps/web/src/lib/mp4Demux.ts` (TS6133 `view` thừa +
   3× TS18047 `chunkBox` possibly null) và
   `apps/web/src/lib/reverseWebcodecs.ts` (2× TS2339 `message` trên
   `{}`) — đều là file WebCodecs/demux, ngoài phạm vi cấm đụng của
   brief P4. Không lỗi tsc nào ở `archive.ts`,
   `archiveNested32P4.test.ts`, `tsconfig.json` hay vùng code O4.
   Parent kiểm tra lại tsc sau khi luồng sở hữu 2 file đó sửa xong.
5. **dist đã build lại tại chỗ** trong lượt (vite build):
   `apps/web/dist/` chỉ phục vụ kiểm chứng, không tính là file đổi
   của đợt, không đưa vào batch (parent lo stage).
6. **Chạy song song với luồng đợt 32 khác**: các file O4/O6 đã chốt
   trên đĩa trước lượt P4 (918 key, test O4/O6 đều xanh trong hồi
   quy trên); P4 chỉ sửa `archive.ts` (hàm collectMediaSrcs) +
   thêm 1 test + 1 dòng tsconfig exclude, không sửa code O4/O6.

## 4. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/archive.ts` (chỉ `collectMediaSrcs` đệ quy vào
  nested + comment đợt P4; export/import/note thiếu media/i18n giữ
  nguyên của O4)
- `apps/web/src/lib/archiveNested32P4.test.ts` (mới, 7 test)
- `apps/web/tsconfig.json` (thêm archiveNested32P4.test.ts vào
  exclude, theo quy ước repo)
- `docs/PHASE9_ROUND32_P4_STRUCTURED_NOTES_LIMITS.md` (mới, file này)

Không đụng: `server/bridge/**`, CLI, `preview.tsx`, seek, dip,
`projectRepo.ts`, `loadReport.ts`, `ProjectMenu.tsx`, `App.tsx`,
i18n (0 key mới), script click-test O4, code của luồng O6 hay bất kỳ
luồng nào khác. Không push, không tag, không binary, không file
paths-loop (parent lo stage).
