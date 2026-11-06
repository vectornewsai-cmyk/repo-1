# Phase 9 đợt 31, luồng N4 — Toast Lưu file có cấu trúc + dịch — GIỚI HẠN

Ngày: 2026-10-31. KHÔNG push, KHÔNG tag/release, KHÔNG binary vào
repo, KHÔNG stage batch paths-loop (parent lo). Đọc cùng:
`docs/PHASE9_ROUND30_LIMITS.md` §3 item 4 và
`docs/PHASE9_ROUND30_M4_I18N_KEYFRAME_LIMITS.md` (nợ mà đợt này
đóng). Không sửa seek/preview, CLI, scripts harness CDP (chỉ THÊM
script click-test mới theo mẫu M4, không sửa script M4), dip, logic
errorDetail bridge.

## 1. Đã làm

### (1) saveProject / đường Lưu file sang dạng kết quả có cấu trúc

- `projectRepo.ts` — kiểu mới `StructuredNote { code, params,
  fallback }` (code + tham số + chuỗi tiếng Việt cũ để fallback):
  - `findBlobWarningItems(spec)` (mới, thuần): quét clip cấp cao tìm
    src blob: → item `blobUrl { clipId, trackId }`.
    `findBlobWarnings` nay suy ra từ items nên chuỗi và item không
    lệch nhau (khóa bằng test).
  - `serializeProject` / `saveProject` nay trả thêm
    `structuredNotes` (hiện chỉ blobUrl); `warnings` chuỗi cũ GIỮ
    NGUYÊN song song để tương thích (test cũ, cổng đọc trực tiếp).
  - `migrateProjectMotion` trả thêm `structuredNotes`
    (`motionMigrated { path, clipId, notes }`, fallback = đúng chuỗi
    cũ); `parseProjectText` dựng đủ 7 code theo đúng thứ tự chuỗi:
    `formatVersionMismatch`, `legacyEnvelope`, `schemaMigrated`,
    `motionMigrated` + `motionMigratedHint`, `textStyleFixed`,
    `blobUrl`. `LoadResult` / `loadAutosave` mang thêm trường này
    (cổng fail đặt `[]`).
  - `loadReport.ts` — `StructuredNoteShape` (kiểu cấu trúc, không
    import runtime projectRepo để giữ test Node type-stripping);
    `LoadReport.structuredNotes`; `buildLoadReport` trừ các chuỗi
    fallback của note khỏi `otherWarnings` BẰNG TẬP FALLBACK (không
    parse chuỗi tiếng Việt — fallback do chính projectRepo sinh nên
    khớp byte-identical); `formatStructuredNote` dịch qua key
    `structuredNotes.<code>`, key thiếu → fallback, không hiện key
    thô; `formatNoteLines` (dịch note + giữ chuỗi lẻ, trừ trùng).
- `ProjectMenu.tsx`:
  - `saveCurrentProject()` nay trả kết quả cấu trúc;
    `saveNotesLines()` (mới, export cho App dùng chung) dịch qua
    `formatNoteLines`. Nút Lưu / Lưu thành: toast lưu ý đã dịch qua
    key `projectMenu.loadNotes` (câu chữ giữ nguyên như warnList cũ);
    không có lưu ý thì không hiện toast (giữ hành vi cũ). Hàm
    `warnList` chuỗi thô đã XOÁ.
  - Toast lỗi mở file / nhập bản nén / xuất bản nén qua key
    `projectMenu.openFileError` / `importArchiveError` /
    `exportArchiveError` — TIỀN TỐ dịch, CHI TIẾT LỖI giữ nguyên
    (cùng mẫu errorDetail bridge: nội dung lỗi là dữ liệu, không
    dịch ẩu).
  - Toast thành công Xuất bản nén qua key `exportArchiveDone` +
    `exportArchiveNotes`; note blob dịch qua structuredNotes từ
    `exportArchive` (nối từ `serializeProject`); chuỗi thiếu media
    chưa có dạng cấu trúc giữ nguyên trong phần lưu ý (xem §3.2).
- `App.tsx`: Ctrl+S dùng chung `saveNotesLines` + key
  `projectMenu.saveNotes` / `saveDone` (câu chữ giữ nguyên như
  trước, chỉ qua key); toast khôi phục autosave thêm
  structuredNotes đã dịch trước otherWarnings.
- `LoadReportPanel.tsx`: mục "lưu ý khác" hiện structuredNotes đã
  dịch trước otherWarnings (panel không còn mất note blob/migration
  sau khi buildLoadReport trừ chuỗi fallback).
- `archive.ts`: `ExportArchiveResult` / `ImportArchiveResult` mang
  thêm `structuredNotes?` (tùy chọn như speedCurveWarnings để đường
  fail không phải sửa); export nối từ serializeProject, import nối
  từ parsed.
- i18n: 14 key mới (7 `structuredNotes.*`, 7 `projectMenu.*`),
  vi = en = 913 key lá (tăng 14 so với 899 đợt 30), 0 key mồ côi
  cả hai chiều (khóa bằng test flatten toàn dict).

### (2) Test thật + click-test browser thật

- Mới `saveToast31.test.ts`: **15 pass, 0 fail** (node trực tiếp):
  blob items (code/params/fallback byte-identical), nested blob
  không quét (khóa giới hạn kế thừa), serialize 1-1, migrate khớp
  chuỗi, parse đủ 7 code + fallback đều có trong warnings chuỗi,
  buildLoadReport trừ đúng fallback, format vi khớp từng chữ cả 7
  code, en không rò key/vi (trừ notes thô của motion — xem §3.1),
  formatNoteLines không trùng, parity 913 = 913 + 14 key mới.
- Hồi quy (node trực tiếp): loadReport **10/10**,
  loadReportFix28 **8/8**, loadReportPerLine29 **14/14**,
  projectRepo **10/10**, projectRepoRound26J5 **15/15**,
  curveFixKeyframe30 **21/21**, curveFixRound27K2 **17/17**,
  projectRepoNested22 **7/7**, textStyle27K1 **6/6**,
  projectHistory **15/15**, assetStore **22/22** — tổng hồi quy
  145, cộng 15 mới = **160 xanh, 0 fail**. Chỉ một chỗ test cũ phải
  sửa theo field mới (không nới lỏng kiểm tra): literal LoadReport
  trong loadReportFix28.test.ts thêm `structuredNotes: []`.
- `npx tsc --noEmit` (apps/web): **0 lỗi**.
- `npx vite build` (apps/web): **pass** (6.88s).
- Click-test mới `scripts/clicktest-n4-round31-pipe.mjs` (tái dùng
  infra M4, display :97 / port 4199 / scratch tmp-round31-n4 riêng
  để không đụng luồng đợt 31 khác): **7/7 pass** trên browser thật
  (log ở `~/workspace/tmp-round31-n4/v31-n4-clicktest.json`,
  ngoài repo, không stage):
  - V1 vi: reload → toast autosave chứa note blob vi đầy đủ.
  - V2 vi: click nút Lưu thật → toast "Đã xong, nhưng có lưu ý: "
    + note blob vi (đường Lưu file đã dịch thật, không còn chuỗi
    thô như nợ đợt 30).
  - V3 vi: click Xuất bản nén thật → toast "Đã xuất bản nén (0
    media, 0.0 MB). Lưu ý: " + note blob vi + chuỗi thiếu media
    còn thô (đúng thiết kế §3.2).
  - V4 vi: 0 exception. E1 en: toast autosave en đầy đủ, không rò
    key/vi. E2 en: click Lưu → toast "Done, with notes: " + note
    blob en, không rò key/vi. E3 en: 0 exception.
  - Bài học harness trong lượt (ghi rõ, không giấu): lần chạy đầu
    V2/V3/E2 FAIL "không có toast" dù click không báo lỗi — nguyên
    nhân là RelinkPanel mở LẠI sau reload (media seed thiếu) và
    overlay modal che TopBar nên click CDP trúng modal thay vì nút
    Lưu/Xuất. Sửa script: đóng relink sau mỗi reload trước mọi
    realClick → chạy lại 7/7. Lần chạy đầu không phải lỗi sản phẩm
    (toast autosave V1/E1 vẫn hiện đúng qua cùng đường code).

### (3) Tự sửa 2 lỗi do chính luồng gây ra (trung thực)

- Lúc sửa nhánh else của parseProjectText đã làm mất dòng
  `spec = data;` khiến file không-envelope load fail với
  "version=undefined" — test mới bắt được ngay (1 fail), đã sửa
  lại và chạy lại 15/15. Đây là lỗi của luồng, không phải hồi quy
  từ đợt trước.
- Lúc sửa tsconfig.json đã làm hỏng JSON (dấu ngoặc kép thừa do
  old_text khớp một phần dòng) khiến tsc/vite lỗi — đã sửa, JSON
  parse OK, tsc 0, build pass. Cả hai lỗi đều nằm trong lượt này
  và đã sửa xong trước khi báo cáo, không để lọt vào batch.

## 2. Kết quả kiểm chứng (chạy thật, 31/10/2026)

- saveToast31 **15/15**; hồi quy **145 xanh**; tsc **0 lỗi**; vite
  build **pass**; click-test **7/7** (vi + en, browser thật).
- JSON vi/en đã parse kiểm chứng sau khi sửa (không vỡ cú pháp);
  parity flatten toàn dict 913 = 913, 0 mồ côi.

## 3. Chưa làm / giới hạn trung thực

1. **Nội dung `notes` bên trong motionMigrated vẫn tiếng Việt thô**
   ở bản en: khung câu đã dịch ("legacy motion normalized") nhưng
   notes là chuỗi của `migrateMotion` (packages/video-spec, ngoài
   phạm vi luồng này — muốn dịch phải cấu trúc hoá notes ở đó).
   Toast en vì vậy có thể lẫn câu tiếng Việt trong phần notes của
   đúng code này (không phải key thô, không phải lỗi dịch sai).
2. **Chuỗi thiếu media của archive vẫn thô** (cả toast xuất và
   panel): "Thiếu file gốc của N media…" / "Archive thiếu N media…"
   chưa có dạng cấu trúc (code + tham số) nên giữ nguyên ở cả vi
   lẫn en — đã chứng minh bằng V3 (toast xuất hiện cả note blob đã
   dịch lẫn chuỗi thiếu media thô). Muốn dịch phải thêm
   structuredNotes cho archive ở exportArchive/importArchive.
3. **Nội dung errorDetail của bridge vẫn tiếng Việt**: ngoài phạm
   vi luồng này theo đúng brief (chỉ dịch phía web khi đã có key;
   tiêu đề + dòng "… và N dòng khác" đã qua key từ đợt 30 M4).
   Summary/details từ bridge muốn theo locale phải dịch ở bridge.
4. **Toast lỗi ProjectMenu KHÔNG click-test được**: cần chọn file
   qua file chooser native của browser, pipe CDP không lái được.
   Chỉ khóa bằng: key có mặt cả vi/en + tsc + cùng đường pushToast
   với các toast đã click-test (V2/V3/E2). Không claim đã
   click-test toast lỗi.
5. **Blob trong nested không được quét**: `findBlobWarningItems`
   kế thừa giới hạn của `findBlobWarnings` cũ (chỉ clip cấp cao) —
   khóa bằng test để không ai tưởng đã sửa; sửa cần duyệt đệ quy
   qua subSpec (phạm vi khác).
6. **"Không sinh undo" / hành vi nút Lưu không đổi**: đợt này chỉ
   đổi dạng toast, không đụng store action hay luồng lưu — không có
   gì mới để chứng minh về undo; click-test khẳng định toast sau
   click Lưu (V2/E2) chứ không khẳng định nội dung file đã tải
   xuống (download không đọc lại trong harness).
7. **Không có test render React** cho ProjectMenu/App/panel (không
   chạy được bằng Node type-stripping, như mọi đợt trước). Wiring
   khóa bằng tsc 0 lỗi + vite build pass + click-test 7/7.
8. **Click-test bấm nút bằng CDP thay user thật** (ghi rõ như M4):
   thao tác bấm là harness thực hiện qua Input.dispatchMouseEvent;
   nội dung toast được assert đầy đủ nên việc này không làm giảm
   giá trị kiểm chứng.
9. **dist đã build lại tại chỗ** trong lượt (vite build + snapshot
   click-test): `apps/web/dist/` chỉ phục vụ kiểm chứng, không tính
   là file đổi của đợt, không đưa vào batch (parent lo stage).
10. **Chạy song song với luồng đợt 31 khác**: một luồng khác đang
    chạy ffmpeg/browser cùng lúc trên máy; click-test dùng
    display/port/scratch riêng (:97/4199/tmp-round31-n4) và snapshot
    dist tại thời điểm chạy nên không bị ảnh hưởng — nhưng số đo
    thời gian build (6.88s) đo dưới tải chung, không dùng làm
    benchmark.

## 4. File đổi/thêm (tương đối từ repo root)

- `apps/web/src/lib/projectRepo.ts` (StructuredNote,
  findBlobWarningItems, migrate/parse/serialize/save/autosave mang
  structuredNotes; chuỗi warnings cũ giữ nguyên)
- `apps/web/src/lib/archive.ts` (Export/ImportArchiveResult mang
  structuredNotes?; nối từ serializeProject / parsed)
- `apps/web/src/lib/loadReport.ts` (StructuredNoteShape, LoadReport
  .structuredNotes, buildLoadReport trừ fallback, formatStructuredNote,
  formatNoteLines; buildHistoryLoadReport đặt structuredNotes [])
- `apps/web/src/components/project/ProjectMenu.tsx`
  (saveCurrentProject trả cấu trúc, saveNotesLines, toast lưu/xuất/
  lỗi qua key; XOÁ warnList chuỗi thô)
- `apps/web/src/App.tsx` (Ctrl+S + toast autosave qua structuredNotes)
- `apps/web/src/components/project/LoadReportPanel.tsx` (mục lưu ý
  khác hiện structuredNotes đã dịch)
- `apps/web/src/i18n/vi.json` (14 key mới; 899 → 913 key)
- `apps/web/src/i18n/en.json` (như vi, parity 1–1)
- `apps/web/tsconfig.json` (thêm saveToast31.test.ts vào exclude,
  theo quy ước repo)
- `apps/web/src/lib/loadReportFix28.test.ts` (literal LoadReport
  thêm structuredNotes [] — thích ứng field mới, không nới kiểm tra)
- `apps/web/src/lib/saveToast31.test.ts` (mới, 15 test)
- `apps/web/scripts/clicktest-n4-round31-pipe.mjs` (mới, click-test
  CDP 7/7; log ở `~/workspace/tmp-round31-n4/v31-n4-clicktest.json`
  — thư mục tmp ngoài repo, không đưa vào batch)
- `docs/PHASE9_ROUND31_N4_SAVE_TOAST_LIMITS.md` (mới, file này)

Không đụng: `server/bridge/**`, CLI, `preview.tsx`, seek, dip,
logic poll `?detail=1` của L3, handler per-line/fix-all/keyframe cũ,
store action cũ, script clicktest M4. Không push, không tag, không
binary, không file paths-loop (parent lo stage).
