# Phase 9 đợt 32, luồng O4 — StructuredNote nốt cho archive + nested blob + errorDetail — GIỚI HẠN

Ngày: 2026-11-01. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop (parent lo). KHÔNG sửa preview.tsx
hay seek.ts (phần luồng khác). Đọc cùng:
`docs/PHASE9_ROUND31_N4_SAVE_TOAST_LIMITS.md` §3 (6 nợ N4 mà đợt này
đóng 4, còn 2 — xem §3).

## 1. Đã làm

### (1) Chuỗi thiếu media của archive sang dạng có cấu trúc — XONG

- `projectRepo.ts` — `archiveMissingNote(kind, missing)` mới + 2 code
  mới `archiveMissingExport` / `archiveMissingImport` (params
  `{ count, shown, extra }`, `shown` = tối đa 5 tên đầu, `extra` =
  "… (+k)" khi thừa). `fallback` byte-identical với chuỗi archive.ts
  cũ (khóa bằng test, kể cả trường hợp 7 media cắt 5 + "… (+2)").
- `archive.ts` — export: note nối sau projNotes, cùng thứ tự với
  warnings chuỗi; import: note nối sau parsed.structuredNotes.
  `buildLoadReport`/`formatNoteLines` trừ fallback sẵn có nên panel
  và toast không hiện trùng, không sửa gì thêm ở loadReport cho mục
  này. Comment cũ ở ProjectMenu ("thiếu media chưa có dạng cấu trúc")
  đã cập nhật theo.
- i18n: 2 key mới cả vi/en (xem §2).

### (2) Blob trong nested được quét đệ quy — XONG, không phá trường hợp khác

- `projectRepo.ts` — `findBlobWarningItems` nay duyệt đệ quy vào
  subSpec của nested (seen-set sao chép theo nhánh, cùng mẫu
  collectSpeedCurveWarnings): clip cấp cao giữ nguyên params
  `{ clipId, trackId }`; clip trong nested mang thêm `path` đầy đủ
  qua `.subSpec.` và trackId là track TRỰC TIẾP chứa clip. Thứ tự
  pre-order (clip ngoài trước khi xuống subSpec của nó).
- Hồi quy 160 xanh (xem §2) — không test cũ nào vỡ vì quét đệ quy:
  projectRepoNested22 7/7, toàn bộ suite save/load/archive liên quan
  giữ nguyên. Test khóa giới hạn đợt 31 ("nested blob không quét")
  trong saveToast31.test.ts đã đảo ngược CÓ CHỦ ĐÍCH thành kỳ vọng
  mới (không phải nới lỏng: hành vi đổi theo đúng brief mục 2, ghi rõ
  ở đây). Trường hợp biên khóa thêm: subSpec dùng chung ở 2 clip anh
  em quét đủ cả hai; subSpec tự trỏ lại (vòng lặp object) không treo.
- Lưu ý phạm vi: chỉ quét blob cho cảnh báo lưu/mở. `collectMediaSrcs`
  của archive.ts vẫn chỉ lấy src cấp cao nên media trong nested mà
  thiếu file gốc vẫn chưa được archive cảnh báo — đó là nợ riêng, xem
  §3.2 (không mở rộng lén trong đợt này vì đổi cả stats export).

### (3) Notes thô trong motionMigrated — XONG BẰNG CÁCH GỌN Ở TẦNG WEB, không refactor video-spec

- Lớp sinh chuỗi: `migrateMotion` trong
  `packages/video-spec/src/motion.ts` (3 chuỗi tiếng Việt hardcode,
  không có tầng i18n; mirror render `server/render/src/motion.js`
  không sinh notes cho UI). Không đụng video-spec.
- Cách sửa (tầng web only): `projectRepo.motionNoteCases` suy các
  case từ DỮ LIỆU GỐC (motion trước migrate + motion sau migrate),
  KHÔNG parse chuỗi notes tiếng Việt — phân loại khớp đúng điều kiện
  và thứ tự đẩy notes của migrateMotion: blur rỗng → `motionNoteEmpty`
  duy nhất; weights hợp lệ (mảng, dài 2..8, toàn hữu hạn) và frames
  hợp lệ (vắng hoặc nguyên trong [2, 8]) → `motionNoteFrames` khi
  frames vắng/lệch (đẩy trước), rồi `motionNoteWeights` khi có số
  <= 0. Note motionMigrated mang thêm `params.cases` (JSON); `params
  .notes` + `fallback` giữ nguyên chuỗi cũ byte-identical.
- `loadReport.formatStructuredNote` dịch từng case qua key
  `structuredNotes.motionNote*`, ghép bằng "; " vào vị trí {notes} của
  template motionMigrated (dùng sentinel \x01NOTES\x01 khi gọi lookup
  để không đụng chuỗi khác). Key case nào thiếu, cases parse lỗi,
  hoặc cases rỗng → rơi về fallback cũ (khung dịch + notes thô),
  không bịa nửa câu dịch nửa câu gốc. Note cũ không có `cases`
  (test cũ, dữ liệu cũ) giữ đúng hành vi đợt 31.
- i18n: 3 key case mới cả vi/en, template khớp từng chữ với câu cũ
  khi thay số (khóa bằng test vi == fallback cho cả 4 trường hợp:
  rỗng, lệch frames, weights <= 0, cả hai).
- Rủi ro drift (ghi rõ): phân loại này mirror logic migrateMotion
  bằng tay — nếu video-spec thêm case migrate mới, note mới sẽ không
  có case tương ứng và hiển thị rơi về notes thô (an toàn, không sai),
  cho đến khi có người thêm key case. Test 4 trường hợp hiện tại khóa
  sự khớp nhau này.

### (4) i18n parity + hồi quy — XONG

- vi = en = 918 key lá (913 đợt 31 + 5 key mới đợt này: 2 archive +
  3 motion case), 0 key mồ côi cả hai chiều (khóa bằng test flatten
  toàn dict ở cả 2 file test).
- Test mới `structuredNotes32.test.ts`: 12/12 (node trực tiếp).
  Hồi quy (node trực tiếp): saveToast31 15/15, loadReport 10/10,
  loadReportFix28 8/8, loadReportPerLine29 14/14, projectRepo 10/10,
  projectRepoRound26J5 15/15, curveFixKeyframe30 21/21,
  curveFixRound27K2 17/17, projectRepoNested22 7/7, textStyle27K1 6/6,
  projectHistory 15/15, assetStore 22/22 — tổng hồi quy 160 xanh,
  cộng 12 mới = 172 xanh, 0 fail.
- `vite build` (apps/web): pass (10,27s).
- `tsc --noEmit` (apps/web): 3 lỗi — KHÔNG phải của luồng này, xem
  §3.4 (luồng O6 đang sửa cùng file, chưa xong).

### (5) Toast lỗi ProjectMenu click-test được — XONG (đóng nợ N4)

- Phương án khả thi đã chứng minh bằng chạy thật: KHÔNG cần file
  chooser native — harness lái input file ẩn của ProjectMenu bằng
  `DOM.setFileInputFiles` (tiền lệ `check-proxy-auto.mjs` đã dùng
  cho MediaBin), handler onFile/onArchiveFile của React chạy thật
  với File thật, KHÔNG mock code sản phẩm. Dialog window.confirm
  (nếu project dirty) được auto-accept ở tầng harness qua
  `Page.javascriptDialogOpening`.
- Script mới `apps/web/scripts/clicktest-o4-round32-pipe.mjs` (tái dùng
  infra N4, display :96 / port 4198 / scratch tmp-round32-o4 riêng;
  log ở `~/workspace/tmp-round32-o4/v32-o4-clicktest.json`, ngoài
  repo, không stage): **11/11 pass** trên browser thật, lần chạy đầu
  (không cần fallback dispatch change — setFileInputFiles đã fire
  change thật):
  - V1 vi: reload → toast autosave chứa note blob vi + motion vi.
  - V2 vi: click Xuất bản nén → toast chứa note blob vi + note
    thiếu media vi ("Thiếu file gốc của 2 media…: PLAIN.mp4,
    MOTION.mp4").
  - V3 vi: set file .vcut.json hỏng → toast "Không mở được file:
    File không phải JSON hợp lệ."
  - V4 vi: set file .vcut.zip hỏng → toast "Không nhập được bản
    nén: Không đọc được file zip: …".
  - V5 vi: set archive zip thật (A.mp4 có, B.mp4 thiếu; media A là
    clip mp4 thật `server/render/examples/media/clip1.mp4`) → toast
    nhập chứa note thiếu media vi ("Archive thiếu 1 media…: B.mp4").
  - V6 vi: 0 exception. E1 en: toast autosave chứa blob en + motion
    en đã dịch đủ ("…weights contains a number <= 0 ([0,0,0]) →
    uniform weights (3 frames…"), không rò key/vi. E2 en: toast xuất
    chứa blob en + note thiếu media en, không rò tiếng Việt. E3 en:
    toast nhập chứa note thiếu media en, không rò tiếng Việt. E4 en:
    toast lỗi mở file, tiền tố "Could not open file:" (chi tiết lỗi
    là dữ liệu, giữ tiếng Việt theo mẫu errorDetail — chỉ assert tiền
    tố). E5 en: 0 exception.
  - Lưu ý harness: Xvfb :96 đã có sẵn (luồng khác đang dùng chung)
    nhưng không gây nhiễu — các case vẫn pass; snapshot dist xác
    minh bundle chứa nhãn O4 (archiveMissingExport, motionNoteEmpty,
    "Missing source files for") trước khi chạy.
  - Wiring archive.ts (không import được bằng Node type-stripping do
    import "./projectRepo" không đuôi — xem ghi chú trong test) được
    khóa bằng chính click-test này (V2/V5/E2/E3 chạy qua exportArchive
    /importArchive thật) + tsc/vite (trừ lỗi O6, xem §3.4).

## 2. Kết quả kiểm chứng (chạy thật, 01/11/2026)

- structuredNotes32 **12/12**; hồi quy **160 xanh**; vite build
  **pass**; click-test O4 **11/11** (vi + en, browser thật).
- JSON vi/en đã parse kiểm chứng qua test (không vỡ cú pháp);
  parity flatten toàn dict 918 = 918, 0 mồ côi.
- tsc: 3 lỗi, toàn bộ thuộc luồng O6 đang chạy song song (xem §3.4)
  — không có lỗi nào ở vùng code O4 (projectRepo vùng blob/archive/
  motion, loadReport, archive.ts, ProjectMenu, i18n, script O4).

## 3. Chưa làm / giới hạn trung thực

1. **Nội dung errorDetail của bridge vẫn tiếng Việt**: KHÔNG đụng
   trong đợt này (ngoài phạm vi brief — muốn theo locale phải dịch ở
   bridge, như LIMITS đợt 31 §3.3 đã ghi). Toast lỗi ProjectMenu đã
   dịch tiền tố qua key (đợt 31) và nay đã click-test được (đợt này);
   chỉ phần chi tiết lỗi (dữ liệu) vẫn giữ nguyên.
2. **Media trong nested thiếu file gốc chưa được archive cảnh báo**:
   `collectMediaSrcs` (archive.ts) vẫn chỉ quét clip cấp cao, trong
   khi cảnh báo blob nay đã quét đệ quy. Muốn đóng phải mở rộng
   collectMediaSrcs sang subSpec (đổi cả stats export + chuỗi thiếu
   media khi nested có src) — để đợt sau, không làm lén trong đợt này.
3. **Drift motionNoteCases vs migrateMotion**: xem §1(3) — thêm case
   migrate mới ở video-spec mà không thêm key case thì note đó rơi
   về notes thô (an toàn, không sai, nhưng chưa dịch).
4. **tsc 3 lỗi do luồng O6 đang chạy song song**: file
   `apps/web/src/lib/textStyle32O6D7.test.ts` (luồng O6, D7 autosave)
   chưa nằm trong tsconfig exclude (TS5097 ở dòng import) và khối
   autosave mới của O6 trong `loadAutosave` (projectRepo.ts dòng
   ~1051, kèm comment D7/M5) truy cập `res.textStyleFixes` optional
   (TS18048, lặp ở cả test O6). O4 KHÔNG sửa code O6 đang làm dở
   (tránh xung đột merge) — parent kiểm tra lại tsc sau khi O6 xong
   và đã exclude test của họ; vùng code O4 không có lỗi tsc nào.
5. **Không có test render React** cho ProjectMenu/App/panel (không
   chạy được bằng Node type-stripping, như mọi đợt trước). Wiring
   khóa bằng tsc (trừ lỗi O6) + vite build pass + click-test 11/11.
6. **Click-test bấm nút bằng CDP thay user thật** (ghi rõ như N4):
   thao tác bấm là harness thực hiện qua Input.dispatchMouseEvent;
   việc chọn file là harness thực hiện qua DOM.setFileInputFiles
   (không qua file chooser native); nội dung toast được assert đầy
   đủ nên việc này không làm giảm giá trị kiểm chứng.
7. **dist đã build lại tại chỗ** trong lượt (vite build + snapshot
   click-test): `apps/web/dist/` chỉ phục vụ kiểm chứng, không tính
   là file đổi của đợt, không đưa vào batch (parent lo stage).
8. **Chạy song song với luồng đợt 32 khác**: O6 đang sửa cùng
   projectRepo.ts (vùng loadAutosave, không trùng vùng O4) và dùng
   chung Xvfb :96 — không ghi nhận xung đột trong lượt này, nhưng
   parent khi stage cần đối chiếu hunk chung của file này với O6.

## 4. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/projectRepo.ts` (2 code archive mới,
  archiveMissingNote, findBlobWarningItems đệ quy, motionNoteCases,
  note motionMigrated mang params.cases; chuỗi warnings cũ giữ nguyên)
- `apps/web/src/lib/loadReport.ts` (formatStructuredNote dịch case
  motion qua sentinel; đường fallback cũ giữ nguyên)
- `apps/web/src/lib/archive.ts` (export/import nối note thiếu media
  có cấu trúc; chuỗi warnings cũ giữ nguyên)
- `apps/web/src/components/project/ProjectMenu.tsx` (chỉ cập nhật 2
  comment cũ về thiếu media — không đổi logic)
- `apps/web/src/i18n/vi.json` (5 key mới; 913 → 918 key)
- `apps/web/src/i18n/en.json` (như vi, parity 1–1)
- `apps/web/tsconfig.json` (thêm structuredNotes32.test.ts vào
  exclude, theo quy ước repo)
- `apps/web/src/lib/saveToast31.test.ts` (đảo ngược có chủ đích khóa
  nested blob + parity 913 → 918; không nới kiểm tra nào khác)
- `apps/web/src/lib/structuredNotes32.test.ts` (mới, 12 test)
- `apps/web/scripts/clicktest-o4-round32-pipe.mjs` (mới, click-test
  CDP 11/11; log ở `~/workspace/tmp-round32-o4/v32-o4-clicktest.json`
  — thư mục tmp ngoài repo, không đưa vào batch)
- `docs/PHASE9_ROUND32_O4_STRUCTURED_NOTES_LIMITS.md` (mới, file này)

Không đụng: `server/bridge/**`, CLI, `preview.tsx`, seek, video-spec
(không refactor), `collectMediaSrcs` (xem §3.2), code của luồng O6
(xem §3.4). Không push, không tag, không binary, không file
paths-loop (parent lo stage).
