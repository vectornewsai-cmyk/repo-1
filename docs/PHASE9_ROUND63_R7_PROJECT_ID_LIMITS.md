# Phase 9 — Đợt 63, luồng R7: projectId ổn định + khóa sổ theo id + lock chặn stale — LIMITS

Ngày: 08/11/2026 (lượt cron 09:35 +07). Phạm vi: đóng nợ đợt 62 R7 §6.2 +
§6.3 + §6.4 (LIMITS: `docs/PHASE9_ROUND62_R7_IDB_XPROJECT_LIMITS.md`):
(a) hai file .vcut trùng tên project chung một khóa sổ (ghi sau thắng);
(b) lock không chặn stale giữa các lượt sync; (c) chưa đo tranh chấp
lock thật giữa 2 tab. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| (a) projectId ổn định trong envelope | **Đã triển khai + kiểm chứng.** UUID sinh lúc tạo project (`crypto.randomUUID`, fallback `proj-<time>-<rand>`), persist trong envelope `.vcut.json` + autosave + archive, giữ trong zustand store (`projectId`, không nằm trong spec). Sổ tham chiếu khóa theo `id:<uuid>` thay cho `name:<tên>`: hai file trùng tên khác id có hai bản ghi riêng — unit C1 + headed T4 chứng minh không còn ghi đè. |
| (b) Migration file cũ | **Đã triển khai + đo bằng test.** File cũ/bare-spec thiếu id hợp lệ → parse sinh id mới (`projectIdMigrated: true`) + warning chuỗi + structured note `projectIdMigrated` (quy ước đợt 31 N4); id được persist ngay vào autosave lúc mở và vào file ở lần lưu sau. Unit B2–B6 (9 test) khóa hành vi. |
| (c) Lock chặn stale (generation/OCC) | **Đã triển khai + đo bằng test + headed 2 tab.** `ProjectRefRecord.generation` tăng 1 mỗi lần ghi thật; `recordProjectRefs` nhận `expectedGeneration` và kiểm tra NGAY TRONG lock `vcut-projrefs`: gen cũ → từ chối `stale: true`, bản ghi giữ nguyên. Unit D1–D5 + E1–E3 (8 test) + headed T3 (2 tab thật) đều xanh. |
| (d) Tranh chấp lock thật 2 tab | **Đã đo headed 6/6.** Tab B xin lock khi tab A giữ 3000ms → đợi 3428ms mới nhận được (T1); ghi sổ thật qua AssetStore trong lúc A giữ lock → mất 3796ms mới ghi xong (T2). Cả hai đều chứng minh tab 2 bị chặn/đợi thật, không chạy song song, không kẹt. |
| Test | Unit mới 27/27 (chạy lại 3 lần đều xanh); hồi quy: projectAssetRefs62R7 28/28, idbCleanup61R9 16/16, assetStore 27/27, projectRepo 10/10, store.idbCleanup61R9 4/4, saveToast31 15/15, loadProject54K1 7/7, binPersist59P1 17/17, textStyle32O6D7 6/6, loadReport 10/10, loadReportPerLine29 14/14, curveFixKeyframe30 21/21, loadReport57N7 + i18nRound56M5 + i18nAudit56M4 xanh qua runner, archiveNested32P4 7/7 qua runner mode esm. |
| tsc | **File của luồng này 0 lỗi.** `tsc` toàn repo còn 1 lỗi ở file của luồng khác đợt 63 đang làm dở (`decoderPlayback63R6.test.ts:130` — lỗi TS2353 của R6, không phải file của luồng này; không sửa file của luồng khác). |
| vite build | **Pass, 13,32 s** (cảnh báo chunk >500 kB có sẵn). |

## 1. Thiết kế (a): projectId ổn định

### 1.1 Sinh + kiểm tra id (`lib/projectId63R7.ts`, module thuần)

- `generateProjectId()`: `crypto.randomUUID()` khi có; fallback
  `proj-<Date.now().toString(36)>-<rand6>` (cùng mẫu `rotateProjectId`
  của projectHistory) khi không có randomUUID (môi trường cũ / không
  secure context).
- `isValidProjectId()`: chấp nhận UUID hoặc dạng fallback `proj-...`;
  TỪ CHỐI id lịch sử `file-<hash>-<tên>` (đổi theo hash spec nên không
  ổn định), tên project, chuỗi rỗng, không phải chuỗi.
- KHÔNG tái dùng projectId của `lib/projectHistory.ts`: id đó gắn với
  tên lúc tạo/mở (`proj-...` xoay mỗi lần newProject,
  `file-<hash spec>-<tên file>` đổi mỗi khi spec đổi) nên không ổn định
  theo file — không dùng làm khóa sổ được. Hai hệ id cùng tồn tại, mỗi
  hệ một việc (history = chuỗi version theo phiên; envelope = danh tính
  file); LIMITS này ghi rõ để không ai "gộp" hai hệ sau này.

### 1.2 Envelope + store

- `ProjectEnvelope.projectId?: string` (tùy chọn — file cũ không có
  field vẫn đọc được). `serializeProject(..., projectId?)` chỉ ghi
  field khi id hợp lệ; không truyền/lạ → bỏ field (hành vi cũ).
- `LoadResult` thêm `projectId: string` (luôn có khi ok: true) +
  `projectIdMigrated: boolean`. Cổng fail đặt `projectId: ""`.
- Zustand store thêm `projectId: string` + `setProjectId(id)` (id lạ →
  sinh mới thay vì ghi id rác). Id KHÔNG nằm trong `spec` (spec là
  VideoSpec dùng chung, validate bởi @repo-1/video-spec) — id sống ở
  envelope + state store, hai nơi đồng bộ qua các điểm móc dưới đây.
- `replaceProject(spec, projectId?)`: truyền id hợp lệ thì giữ; không
  truyền/lạ → sinh MỚI (template/archive/sample là project mới nên
  phải có id riêng — giữ id project cũ sẽ làm hai project khác nhau
  chung một khóa sổ, đúng lỗi đang đóng). `newProject()` và
  `loadSample()` xoay id mới. Khôi phục version (HistoryPanel) GIỮ id
  hiện tại (cùng một project). `setProjectId` chỉ dùng khi thật cần
  (hiện không còn caller nào ngoài store — các đường mở đi qua
  replaceProject).
- Mọi đường ghi envelope đều truyền id từ store: `saveProject` (web),
  `buildNativeSavePayload` (native/desktop), `exportArchive` (archive
  giữ id gốc khi nhập lại), `autosave`/`autosaveNow` (debounce + ghi
  ngay sau mở/sửa), `loadAutosave` (trả id + ghi lại O6 kèm id).
  `persistSessionPlayhead` không cần sửa: nó parse + stringify lại
  toàn bộ envelope nên field projectId được giữ nguyên.

### 1.3 Sổ tham chiếu khóa theo id

- Khóa mới `id:<projectId>` (`projectKeyForId`, throw khi id lạ —
  không ghi khóa rác). `ProjectRefRecord` thêm `projectId?: string`
  (persist id vào bản ghi) + `generation: number` (xem §3).
- Điểm ghi (App effect debounce + `saveCurrentProject`) chuyển sang
  `projectKeyForId(st.projectId)` + truyền `projectId` vào
  `recordCurrentProjectRefs`. Panel Dọn kho tính
  `currentProjectKey` theo id; mục sổ hiển thị `rec.projectName` cho
  bản ghi khóa id (hiện UUID ra UI là vô nghĩa), bản ghi legacy khóa
  tên vẫn hiển thị tên từ khóa như cũ.
- `projectKeyForName`/`projectDisplayName` (đợt 62 R7) giữ nguyên cho
  bản ghi legacy — không xóa (xem §2).

## 2. Thiết kế (b): migration + tương thích ngược

### 2.1 Migration file cũ

- `resolveEnvelopeProjectId(raw)`: id hợp lệ → giữ nguyên
  (`migrated: false`); thiếu/không phải chuỗi/id lạ → sinh mới
  (`migrated: true`). KHÔNG suy id từ tên file/tên project/hash spec —
  cả ba đều đổi được (đổi tên, sửa nội dung) nên không ổn định theo
  file; sinh mới là lựa chọn duy nhất đúng, lần lưu sau persist nó.
- `parseProjectText` gắn warning + structured note `projectIdMigrated`
  (code mới trong union `StructuredNoteCode`, key
  `structuredNotes.projectIdMigrated` + `projectRepo.projectIdMigrated`
  trong fragment round63-r7 — parent gộp cuối đợt 63; chưa gộp thì
  fallback VI như mọi key mới). Bare-spec cũng migration như file cũ.
- Id migration được persist NGAY vào autosave lúc mở
  (`openProjectFileFlow` → `autosaveNow(..., res.projectId)`) và vào
  file ở lần lưu sau — nên kể cả user không lưu file ngay, reload sau
  vẫn giữ đúng id (autosave mang id). Warning chỉ nhắc user lưu FILE
  để file (không chỉ autosave) mang id.
- Trường hợp user KHÔNG lưu file và KHÔNG để autosave ghi (đóng tab
  ngay sau khi mở, trước cả lần autosaveNow đầu): lần mở sau lại sinh
  id khác → sổ có thêm một bản ghi mới cho cùng project (bản ghi cũ
  vẫn còn, chỉ thừa chứ không mất bảo vệ — an toàn theo hướng chặn).
  Cửa sổ này hẹp (autosaveNow chạy ngay sau mở, không chờ debounce)
  nhưng không bằng 0; ghi rõ ở đây, không giấu.

### 2.2 Bản ghi legacy khóa theo tên — hành vi sau đợt 63

- KHÔNG migration xóa/chuyển bản ghi `name:...` cũ: không phân biệt
  được bản ghi đó thuộc file nào trong các file trùng tên, nên xóa là
  mất bảo vệ. Bản ghi legacy và bản ghi id mới cùng tên TỒN TẠI SONG
  SONG (unit C4): scan/delete vẫn chặn xóa như trước (unit F2).
- Hệ quả UI (an toàn nhưng hơi thừa): bản ghi legacy `name:<tên>` của
  CHÍNH project hiện tại không trùng khóa id mới nên panel tạm hiện nó
  như "project khác" (khóa xóa + nút Quên mở). Asset của project hiện
  tại đã được bảo vệ bằng refCount tươi nên chỉ thừa chặn, không sai;
  user bấm Quên để gỡ bản ghi legacy khi chắc chắn project đó đã có
  bản ghi id mới. Đây là nhiễu chuyển đổi một lần, không phải bug —
  nhưng đừng ai "sửa" bằng cách tự động xóa bản ghi legacy khi thấy
  trùng tên (sẽ xóa nhầm bản ghi của file khác cùng tên).

### 2.3 Không tăng version DB

- Không cần tăng `ASSET_DB_VERSION` (vẫn 2): `projectId` +
  `generation` là field cộng thêm trên record, keyPath `projectKey`
  không đổi. Bản ghi legacy thiếu field → đọc như `generation: 0`,
  `projectId: undefined` (code dùng `?? 0` ở mọi nơi đọc generation).
  Test C4 khóa hành vi này.

## 3. Thiết kế (c): generation / optimistic concurrency chặn stale

### 3.1 Cơ chế

- Mỗi lần ghi sổ THÀNH CÔNG tăng `generation` lên 1 (bắt đầu 1 ở lần
  ghi đầu; ghi lại đúng tập thì no-op, generation không tăng).
- `recordProjectRefs(..., opts?: { projectId?, expectedGeneration? })`:
  kiểm tra stale NGAY TRONG lock `vcut-projrefs` (sau khi đọc bản ghi
  hiện tại): `expectedGeneration` khác generation hiện tại → trả
  `{ stale: true, changed: false }`, bản ghi giữ nguyên, generation
  không tăng. Kiểm tra đặt TRƯỚC shortcut "tập không đổi": kết luận
  "không đổi" của caller đọc gen cũ cũng có thể lỗi thời nên không
  được no-op im lặng (unit D3 khóa).
- `recordCurrentProjectRefs` đọc bản ghi của chính khóa mình TRƯỚC khi
  ghi để lấy generation làm `expectedGeneration` (đọc ngoài lock nhưng
  vẫn đúng: kiểm tra thật diễn ra trong lock lúc ghi). Trả thêm
  `stale: boolean` trong report; stale → caller KHÔNG broadcast (App
  effect chỉ broadcast khi `recorded && changed`), lần sync sau (khi
  spec/media đổi) đọc gen tươi và ghi lại. KHÔNG có vòng retry ngay:
  retry ngay trong effect sẽ tranh lock với chính lượt vừa thắng và
  không thêm thông tin mới (tập asset tính từ cùng snapshot cũ) — lần
  sync sau tính lại từ spec tươi mới đúng.
- Không truyền `expectedGeneration` → ghi luôn như trước (tương thích
  caller cũ / đường test cũ — unit D4).

### 3.2 Phạm vi bảo vệ — trung thực

- OCC chỉ bảo vệ BẢN GHI SỔ THAM CHIẾU (một projectId = một luồng ghi
  logic). RefCount trên manifest KHÔNG có generation: hai tab sửa hai
  project khác nhau rồi sync refCount thì lượt sau vẫn thắng (mỗi lượt
  tính từ spec của chính tab mình — không có "đúng/sai" toàn cục để
  OCC phân xử). Đây là giới hạn đã biết từ đợt 62 R7 §5.3, đợt này
  KHÔNG claimed là đã sửa — chỉ sổ tham chiếu mới được chặn stale.
  Muốn refCount đúng liên tab thì phải tổng hợp theo từng project
  (việc lớn, ngoài phạm vi).
- Stale chỉ được phát hiện khi hai lượt sync CHỒNG NHAU (cùng đọc một
  generation rồi ghi nối nhau). Lượt sync chạy tuần tự sau lượt khác
  (đọc gen tươi) thì ghi bình thường — đúng, vì dữ liệu của nó mới.
- Lock `vcut-projrefs` vẫn là mutex duy nhất serialize ghi sổ; OCC
  thêm lớp chặn stale trên nó chứ không thay nó. Không có locks
  (trình duyệt lạ) thì ghi không khóa như trước — OCC vẫn chạy được
  một phần trong-tab (hai lượt chồng nhau trong cùng tab vẫn bị chặn
  vì generation check không phụ thuộc lock), nhưng không bảo đảm liên
  tab. Ghi rõ, không giấu.

## 4. Kiểm chứng (số thật)

### 4.1 Unit mới `apps/web/src/lib/projectId63R7.test.ts` — 27/27 (chạy 3 lần)

Chạy: `node apps/web/src/lib/projectId63R7.test.ts` (~3 s).

- A. projectId thuần (5): UUID sinh ra hợp lệ + 100 id phân biệt (A1);
  `file-...`/rỗng/số/UUID thiếu đoạn đều không hợp lệ (A2); khóa
  `id:<uuid>`, id lạ throw (A3); phân giải khóa id/name/lạ (A4);
  migration giữ id hợp lệ, sinh mới khi thiếu/lạ, hai lần migration
  khác nhau (A5).
- B. Envelope qua projectRepo thật (8): serialize có id → parse giữ
  nguyên, migrated=false, 0 warning migration (B1); không truyền id →
  envelope thiếu field, parse migrated + warning + structured note
  `projectIdMigrated` (B2); envelope cũ viết tay → migrated (B3); id
  lạ `file-...` trong envelope → serialize không ghi, parse thay id
  mới (B4); spec trần → migrated (B5); 2 vòng serialize/parse giữ
  nguyên id (B6); file hỏng → ok=false, projectId "" (B7); autosave
  giữ id / thiếu id thì migration (B8, localStorage fake).
- C. Sổ khóa theo id (4): hai file TRÙNG TÊN khác id → 2 bản ghi
  riêng, ghi B không đè tập A (C1 — lỗi gốc đợt 62); generation 1 ở
  lần ghi đầu, ghi lại đúng tập không tăng (C2); đổi tập tăng 1→2→3
  (C3); legacy + mới cùng tên cùng tồn tại (C4).
- D. OCC ở recordProjectRefs (5): gen đúng → ghi, gen+1 (D1); gen cũ
  → stale, bản ghi giữ nguyên tập + gen (D2); gen cũ + tập trùng →
  vẫn stale (D3); không truyền expected → ghi luôn (D4); chưa có bản
  ghi → ghi được, gen=1 (D5).
- E. Hai lượt sync chồng nhau qua recordCurrentProjectRefs (3): khác
  tập → đúng 1 thắng + 1 stale, gen chỉ tăng 1, tập cuối = của lượt
  thắng (E1); sau stale, lượt sau đọc gen tươi → ghi được, gen+1
  (E2); cùng tập mới → 1 thắng + 1 stale; cùng tập cũ → cả hai no-op,
  không stale, gen không tăng (E3).
- F. Scan/delete (2): asset chỉ project khác (khóa id) dùng → scan
  khóa + delete `cross-project`, bytes còn (F1); bản ghi legacy khóa
  tên vẫn chặn như trước (F2).
- 2 test đỏ-trước khi sửa test (E1/E3 lần chạy đầu): bản ghi nền đặt
  sai — nền là tập [a] nên lượt 1 thành no-op và lượt 2 ghi hợp lệ
  (cả hai đều stale=false, đúng theo ngữ nghĩa OCC — không phải bug
  code). Đã sửa test: nền dùng tập thứ ba [c] để cả hai lượt đều thực
  sự muốn đổi; xem ghi chú trong test.

### 4.2 Headed 2 tab `apps/web/scripts/clicktest-63r7-project-id-2tab.mjs` — 6/6

Chạy: `node apps/web/scripts/clicktest-63r7-project-id-2tab.mjs` (~43 s).
Chromium headed qua Xvfb display :175, vite dev cổng 5630, CDP 9730,
profile mới tinh, 2 tab cùng origin. Report JSON + 1 screenshot:
`hidden_files/round63-r7/headed/`.

| Case | Kết quả đo (lượt chạy 08/11 ~03:08 +07) |
|---|---|
| T0 setup | Hai tab mount xong; projectId tab A `36823511-...-a4e1e`, tab B `676bea6e-...-5730` — khác nhau, mỗi tab một project riêng |
| T1 lock thô | Tab A giữ `vcut-projrefs` 3000ms; tab B xin cùng lock → **chờ 3428ms** mới nhận được (v=ok) — bị chặn thật, không chạy song song, không kẹt |
| T2 ghi sổ thật chờ lock | Tab A giữ lock 3000ms; tab B ghi sổ qua AssetStore thật → **mất 3796ms** mới ghi xong (changed=true, stale=false); bản ghi `id:123e4567-...-0001` đúng tập `[a_t2]`, generation=1, projectId persist đúng |
| T3 stale liên tab | B đọc gen 1; A ghi bằng gen 1 → gen 2, tập `[a_tabA]`; B ghi bằng gen 1 → **stale=true**; bản ghi cuối tập `[a_tabA]`, generation=2 |
| T4 trùng tên | Tab B ghi 2 bản ghi cùng tên "Dự án trùng tên" khác id; tab A đọc IDB thấy đủ cả hai: X=[a_x1,a_x2], Y=[a_y1] |
| H9 0 lỗi trang | Không có window.onerror/unhandledrejection trong suốt phiên 2 tab |

Lưu ý đo: T1 chờ 3428ms và T2 mất 3796ms, đều VƯỢT mức giữ nominal
3000ms khoảng 0,4–0,8s — phần vượt là chi phí lập lịch/CDP + các lần
ghi sổ của chính App effect (debounce 1s) cũng xếp hàng chờ cùng lock
trước/sau lần đo, không phải lock bị giữ thêm lần nữa. Ngưỡng PASS
2400–6000ms đã tính phần vượt này; điểm quyết định là thời gian chờ
≈ thời gian giữ (bị chặn), không phải ≈0ms (chạy song song). Đừng siết
ngưỡng về sát 3000ms để "cho đẹp" — số vượt là thật, đã đo.

### 4.3 Hồi quy + build (chạy lại sau mọi sửa)

- projectAssetRefs62R7 28/28, idbCleanup61R9 16/16, assetStore 27/27,
  projectRepo 10/10, store.idbCleanup61R9 4/4 (runner), saveToast31
  15/15, loadProject54K1 7/7, binPersist59P1 17/17, textStyle32O6D7
  6/6, loadReport 10/10, loadReportPerLine29 14/14,
  curveFixKeyframe30 21/21, loadReport57N7 + i18nRound56M5 +
  i18nAudit56M4 xanh qua runner, archiveNested32P4 7/7 qua runner
  mode esm (xem §5.2).
- `tsc` apps/web: file của luồng này **0 lỗi**; toàn repo còn 1 lỗi ở
  file của luồng khác đợt 63 đang làm dở (`decoderPlayback63R6.test.ts:130`
  TS2353 của R6 — không sửa file của luồng khác).
- `vite build` apps/web: **pass, 13,32 s** (cảnh báo chunk >500 kB có sẵn).

### 4.4 Hai fail bắt được trong lúc làm (đã sửa, đều là lỗi thật do đổi hành vi)

1. **Warning migration không có StructuredNote** (saveToast31 14/15):
   warning chuỗi mới rơi vào `otherWarnings` của buildLoadReport,
   phá invariant "mọi warning đều có dạng cấu trúc" (đợt 31 N4). Sửa
   đúng quy ước: thêm code `projectIdMigrated` vào union
   `StructuredNoteCode` + push structured note song song với warning
   (projectRepo.ts), key `structuredNotes.projectIdMigrated` trong
   fragment. Sau sửa: saveToast31 15/15.
2. **Note migration làm lệch assert danh sách note** (saveToast31, test
   "blob + motion"): helper `envelopeJson` của test tạo envelope
   không có projectId (envelope cũ) nên parse thêm note
   `projectIdMigrated` vào cuối danh sách. Sửa: helper thêm
   `projectId` cố định (envelope thật do serializeProject ghi luôn
   mang id); migration đã có test riêng ở projectId63R7.test.ts B2/B3.

## 5. Nợ mở / giới hạn (trung thực)

1. **RefCount liên tab vẫn last-writer-wins** (xem §3.2): OCC chỉ bảo
   vệ sổ tham chiếu; hai tab sửa hai project khác nhau rồi sync
   refCount thì lượt sau thắng. Muốn đúng hẳn cần tổng hợp refCount
   theo từng project — việc lớn, ngoài phạm vi.
2. **Bản ghi legacy khóa theo tên hiện như "project khác"** (xem
   §2.2): nhiễu chuyển đổi một lần, user bấm Quên để gỡ. Đừng tự động
   xóa bản ghi legacy trùng tên.
3. **Id migration mất bền vững nếu đóng tab ngay sau khi mở** (xem
   §2.1): cửa sổ hẹp (autosaveNow chạy ngay sau mở) nhưng không bằng
   0 — sổ chỉ thừa thêm bản ghi, không mất bảo vệ.
4. **Không có vòng retry ngay khi stale**: lượt thua chỉ thử lại ở lần
   sync sau (khi spec/media đổi). Tab thua stale mà user không sửa gì
   thêm thì bản ghi của nó vẫn là bản của lượt thắng (mới hơn) — đúng,
   không cần retry; nhưng nếu lượt thắng ghi tập LỖI THỜI theo góc
   nhìn của tab thua (tab thua có spec mới hơn nhưng sync sau) thì
   phải đợi lần đổi spec tiếp theo mới ghi lại — cửa sổ này bằng
   debounce effect (~1s + lần đổi tiếp theo), chấp nhận được.
5. **Key i18n mới chưa gộp**: 2 key (`projectRepo.projectIdMigrated`,
   `structuredNotes.projectIdMigrated`, vi+en thật) nằm ở fragment
   `apps/web/src/i18n/fragments/round63-r7.json` — parent gộp vào dict
   cuối đợt 63 như mọi đợt. Trước lúc gộp, warning migration hiện
   fallback VI ở cả hai locale (trKey/formatStructuredNote trả
   fallback khi key vắng).
6. **Không đo headed đường mở file cũ thật**: migration envelope được
   đo bằng unit qua projectRepo thật (B2–B6) + autosave (B8); headed
   chỉ đo lock/sổ (T1–T4). Mở file .vcut cũ bằng UI thật rồi kiểm tra
   id trong autosave chưa được click-test — lần sau nên có.
7. **Chưa đo tranh chấp lock khi tab giữ lock bị đóng/crash giữa chừng**:
   Web Locks tự giải phóng khi tab chết (API chuẩn) — chỉ là khẳng
   định theo spec, chưa đo bằng cách kill tab giữa lúc giữ lock.
8. **Tiền lệ phát hiện khi chạy**: `archiveNested32P4.test.ts` chạy
   mặc định (runner mode cjs) LỖI BUNDLE — file có top-level await
   trong `for...of` ở cột 2 nên heuristic "await ở cột 0" của runner
   nhận sai mode (lỗi có sẵn, không do luồng này: bundle fail trước
   khi chạy code nào). Chạy đúng mode esm thì 7/7 xanh. Ghi lại để
   parent biết — không sửa runner trong luồng này.
9. **`i18nOrphans60Q4.test.ts` còn 1 fail có sẵn** (15/16): key mồ côi
   `speed.warnTooShort` — nợ đợt 62 (R10: nhánh chết, cần quyết xóa
   hay giữ), không phải key của luồng này và không do luồng này gây
   ra. Không sửa (cần quyết của main thread).

## 6. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/projectId63R7.ts` | Mới | Sinh/kiểm tra projectId, khóa `id:<uuid>`, migration envelope |
| `apps/web/src/lib/projectId63R7.test.ts` | Mới | Test Node 27/27 (A–F) |
| `apps/web/src/lib/projectRepo.ts` | Sửa | Envelope `projectId?`, LoadResult `projectId`/`projectIdMigrated`, serialize/save/autosave/loadAutosave truyền id, union + note `projectIdMigrated` |
| `apps/web/src/lib/assetStore.ts` | Sửa | `ProjectRefRecord` += `projectId?` + `generation`; `recordProjectRefs` opts + kiểm tra stale trong lock |
| `apps/web/src/lib/idbCleanup61R9.ts` | Sửa | `ProjectRefRecordLike` += field; `recordCurrentProjectRefs` đọc gen + truyền expectedGeneration, report += `stale` |
| `apps/web/src/lib/projectAssetRefs62R7.ts` | Không sửa | (giữ nguyên — khóa theo tên + kênh BroadcastChannel vẫn dùng cho legacy) |
| `apps/web/src/store.ts` | Sửa | State `projectId` + `setProjectId`; `replaceProject(spec, projectId?)`, `newProject`/`loadSample` xoay id |
| `apps/web/src/App.tsx` | Sửa | Khôi phục autosave + autosave effect + afterFix + registry effect truyền projectId, khóa sổ theo id |
| `apps/web/src/components/project/ProjectMenu.tsx` | Sửa | `saveCurrentProject` lưu + ghi sổ theo id; export archive truyền id |
| `apps/web/src/lib/openProjectFlow.ts` | Sửa | Mở file/archive giữ id; autosave/native payload truyền id |
| `apps/web/src/lib/archive.ts` | Sửa | `exportArchive(..., projectId?)`; `ImportArchiveResult.projectId` |
| `apps/web/src/components/project/HistoryPanel.tsx` | Sửa | Khôi phục version giữ projectId hiện tại |
| `apps/web/src/components/StorageCleanupPanel.tsx` | Sửa | Khóa hiện tại theo id; hiện tên project cho bản ghi khóa id |
| `apps/web/src/i18n/fragments/round63-r7.json` | Mới | 2 key vi+en (`projectRepo.projectIdMigrated`, `structuredNotes.projectIdMigrated`) |
| `apps/web/scripts/clicktest-63r7-project-id-2tab.mjs` | Mới | Harness headed 2 tab T0–T4 + H9 (6/6) |
| `apps/web/src/lib/saveToast31.test.ts` | Sửa | Helper `envelopeJson` thêm `projectId` cố định (xem §4.4.2) |
| `apps/web/tsconfig.json` | Sửa | Thêm exclude 1 file test mới |
| `docs/PHASE9_ROUND63_R7_PROJECT_ID_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): evidence headed
`hidden_files/round63-r7/headed/` (report JSON, vite/chrome log, 1
screenshot); log chi tiết `hidden_files/round63-r7.md`.

Stage: `paths-loop/phase9-round63-r7-project-id.txt` — 17 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.

## 7. Môi trường chạy

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1254`
  (harness tự tìm 1254 → 1248 → 1187; bản 1248 trong LIMITS đợt 62
  đã không còn trên VM này — harness R7 cũ hardcode 1248 sẽ lỗi nếu
  chạy lại; ghi lại để parent biết).
- Vite dev cổng 5630, CDP debug 9730, Xvfb display :175 (riêng),
  TMPDIR `/tmp/round63-r7/tmp`.
- Lệnh chạy (từ gốc repo):
  `node apps/web/src/lib/projectId63R7.test.ts` — exit 0 khi 27/27 pass.
  `node apps/web/scripts/clicktest-63r7-project-id-2tab.mjs`
  — exit 0 khi 6/6 pass, 1 khi có FAIL, 2 khi harness lỗi.
- Test Node chạy trực tiếp (type-stripping); test store chạy bằng
  `scripts/run-node-test.mjs` (mặc định cjs; archiveNested32P4 phải
  `--mode esm` vì top-level await — xem §5.8).
