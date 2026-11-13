# Phase 9 — Đợt 67, luồng U6: UI mở lại mảnh legacy đã "Bỏ qua" + xác nhận lần 2 & hoàn tác nhận tay + nhập archive mang chuỗi mới — LIMITS

Ngày: 08/11/2026 (lượt cron ~22:00 +07). Đóng nợ đợt 66 T7
(`docs/PHASE9_ROUND66_T7_LEGACY_UI_LIMITS.md` §5.4/§5.5/§5.6):
"Bỏ qua" mảnh legacy chưa có UI mở lại; nhận tay không xác nhận lần 2
/ không hoàn tác; archive chỉ nhận chuỗi đã có trên máy này; chưa
headed đường nhập archive. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| UI mở lại mảnh đã bỏ qua | **ĐÃ XONG.** HistoryPanel có nút mở danh sách đã bỏ qua (kèm số lượng); modal hiện mục đã bỏ qua kèm bằng chứng, nút Mở lại / Gỡ khỏi danh sách. |
| Xác nhận lần 2 | **ĐÃ XONG.** Bấm Nhận (lẻ / tất cả) hiện bảng xác nhận inline với tóm tắt mảnh sẽ nhận; chỉ sau Xác nhận mới commit vào kho. |
| Hoàn tác nhận tay | **ĐÃ XONG (một mức, lần nhận gần nhất).** Banner sau khi nhận + nút Hoàn tác; trả version về đúng id gốc, khôi phục khóa con trỏ, mục quay lại hàng đợi. |
| Archive mang chuỗi mới | **ĐÃ XONG.** `history.json` đi kèm `.vcut.zip` khi export; nhập archive nhận chuỗi lịch sử chưa có trên máy này; trùng id khác nội dung → xung đột, giữ bản local, không ghi đè. |
| Panel Lịch sử tự làm mới | **ĐÃ XONG (phát hiện trong lúc headed).** Tín hiệu `notifyHistoryChanged` — panel đọc lại khi lịch sử đổi mà không đổi projectId (nhập archive / nhận / hoàn tác). Trước đó panel hiện danh sách cũ tới khi đóng/mở lại. |
| Test | Unit mới **20/20**; archive **6/6**; hồi quy T7 **16/16**, S9 **43/43**, projectHistory **15/15**. Headed thật **8/8** (lần chạy thứ 3; xem §4.3). |
| tsc | **0 lỗi**. |
| vite build | **Pass** (1m 56s — chậm hơn bình thường do nhiều luồng đợt 67 chạy song song trên VM; chỉ cảnh báo chunk >500 kB có sẵn). |
| i18n | Fragment riêng **28 key** (`apps/web/src/i18n/fragments/round67-u6.json`), 0 key vi==en giống hệt. **KHÔNG gộp dict** — dict giữ 2326 key; parent gộp sau (xem §6). |
| r6-i18n-check / orphans / audit | **PASS** / **16/16** / audit P7 **8/8**. |

## 1. Thiết kế

### 1.1 Mở lại mảnh đã bỏ qua (legacyAdoptUi.ts + modal + HistoryPanel)

- Kho "đã bỏ qua" vẫn là localStorage `vcut:legacy-adopt-dismissed-v1`
  (JSON array, tối đa 500 id — từ T7). Mới: `loadDismissedLegacyItems()`
  nạp lại từng id kèm bằng chứng hiển thị qua `legacyChainDisplay`
  (tên / hash nhúng / số version / mốc đầu-cuối); mục không còn dữ
  liệu trong kho → `exists=false`, hiện "chuỗi này không còn dữ liệu
  trong kho" + nút "Gỡ khỏi danh sách".
- `undismissLegacyId(id)` gỡ id khỏi kho bỏ qua + đưa lại vào hàng đợi
  chờ quyết định ("Mở lại"). `requestLegacyAdoptModal()` (cờ module +
  subscribe, cùng mẫu hàng đợi) bắt modal hiện ngay cả khi hàng đợi
  rỗng, mở sẵn mục đã bỏ qua.
- HistoryPanel có nút `legacyAdopt.openDismissed` kèm số lượng
  (`dismissedCount` qua `useSyncExternalStore`) gọi
  `requestLegacyAdoptModal()`.
- "Gỡ khỏi danh sách" chỉ gỡ id khỏi danh sách bỏ qua — dữ liệu trong
  kho không đổi; lần adopt/quét sau có thể hỏi lại chuỗi đó.
- `openedSpecHash` cho mục đã bỏ qua tính bằng `specHash` từ
  `projectRepo` (cùng thuật toán FNV-1a + `stableStringify` với
  `specHash` nội bộ của `projectHistory` — đã kiểm trùng bằng test).

### 1.2 Xác nhận lần 2 (modal)

- Bấm "Nhận" ở một mục → bảng xác nhận inline trong mục đó: tóm tắt
  số version + id nguồn + lưu ý "có thể hoàn tác ngay sau khi nhận",
  nút [Xác nhận nhận] / [Hủy]. Bấm Nhận (chưa xác nhận) **không đổi
  kho** — đã kiểm bằng test (O6).
- "Nhận tất cả" cũng có bảng xác nhận riêng: tổng version + số chuỗi,
  lưu ý chỉ hoàn tác được lần nhận gần nhất.
- "Bỏ qua" / "Bỏ qua tất cả" không cần xác nhận lần 2 (quyết định bền
  nhưng không mất dữ liệu, mở lại được theo §1.1).

### 1.3 Hoàn tác (một mức) — projectHistory.ts

- `adoptLegacyFragmentManually` nay trả thêm `movedVersions:
  [{fromId, toId}]` (id gốc → id migrate; id gốc KHÔNG suy ra được từ
  id migrate vì `makeVersionId` dùng hậu tố ngẫu nhiên) +
  `wasPointerChain` (chuỗi đã nhận có phải con trỏ không).
- `undoManualAdopt(record, deps?)` trả version về đúng id gốc qua
  `HistoryStore.rekeyVersions` (chỉ chuyển đúng id trong bảng;
  `parentId` trong tập chuyển được remap, ngoài tập giữ nguyên /
  dangling như prune), khôi phục khóa con trỏ nếu chuỗi đã nhận là
  con trỏ (`writeLegacyHistoryProjectId`, qua `deps.writeLegacyId`
  tùy chọn).
- Banner "Đã nhận {n} phiên bản từ {from}" + [Hoàn tác] / [Ẩn] trong
  modal sau khi nhận; sau undo, mục quay lại hàng đợi chờ quyết định.
- `rekeyVersions` chấp nhận cả id đích envelope lẫn id legacy
  (`isLegacyHistoryId`) — lần đầu chỉ chấp nhận id envelope nên undo
  lỗi, test O1 bắt được, đã sửa.

### 1.4 Archive mang lịch sử — archive.ts + projectHistory.ts + openProjectFlow.ts

- Export: `exportArchive(spec, name, mediaSources, projectId?,
  history?)` ghi `history.json` (định dạng `HistoryExport`
  `vcut-history` v1, đã có sẵn) khi có version; `isAllowedEntry`
  chấp nhận `history.json`. `ProjectMenu.doExportArchive` lấy version
  qua `getHistoryStore().listVersions` + `exportHistory` và truyền
  vào; toast thêm "(kèm {n} phiên bản lịch sử)".
- Import: `importArchive` parse `history.json` (hỏng / không phải
  object → `historyError` chuỗi VI trực tiếp, import vẫn tiếp tục —
  `history.json` là entry phụ, không hỏng cả archive).
- `HistoryStore.importArchiveHistory(data, expectedProjectId, lookup?)`
  → `ArchiveHistoryImportResult` (kế thừa `HistoryImportDetail` +
  `skippedReason: "project-mismatch" | "too-many" |
  "version-project-mismatch" | null` + `skippedDetail`). Lệch
  projectId / version lẻ lệch projectId / quá 500 version
  (`ARCHIVE_HISTORY_MAX_VERSIONS = 500`) → **trả lý do, KHÔNG throw**
  (để caller bỏ qua lịch sử mà không hỏng lần nhập archive); chỉ lỗi
  định dạng (`validateImport`) mới throw. `importHistoryDetailed` đếm
  imported/skipped/conflicts: cùng id khác nội dung → xung đột, **giữ
  bản local, không ghi đè**.
- `openArchiveFileFlow` nhập lịch sử sau adopt, ghi note vào báo cáo
  tải (`structuredNotes.archiveHistoryImported` /
  `.archiveHistorySkipped` + fallback VI; câu VI giải thích lý do do
  `archiveHistorySkippedMessage` dựng trong `openProjectFlow.ts`).
  `importHistory` cũ giữ nguyên hành vi (trả số lượng).

### 1.5 Vì sao không dùng trKey mới trong `projectHistory.ts`

Audit i18n P7 (`i18nAudit59P7.test.ts`) quét 36 file (gồm
`lib/projectHistory.ts`, `lib/projectRepo.ts`,
`components/project/ProjectMenu.tsx`): mọi `trKey()` phải trỏ key đã
có trong dict hoặc fragment R6, và literal VI mới phải khớp giá trị
dict / substring / fallback đã nối. Lần chạy audit đầu đỏ 6/8 vì 4 key
trKey mới. Đã sửa đúng luật audit (không sửa dict, không sửa test
audit): `rekeyVersions` dùng lại key dict
`projectHistory.migrateVersionsNeedsProjectId` với fallback là phần
đuôi của đúng giá trị dict; `importArchiveHistory` trả `skippedReason`
thay vì throw chuỗi VI. Chuỗi VI của lý do bỏ qua lịch sử nằm ở
`openProjectFlow.ts` (không nằm trong 36 file audit quét).

### 1.6 Panel tự làm mới (phát hiện nhờ headed U5)

- `notifyHistoryChanged()` / `subscribeHistoryChanged()` /
  `getHistoryChangedSeq()` trong `projectHistory.ts` (cùng mẫu
  subscribe/getSnapshot của `loadReport`).
- HistoryPanel subscribe số thứ tự này, đưa vào deps của effect đọc
  lại danh sách (`[projectId, historySeq]`).
- Caller gọi notify sau khi kho đổi thật: `openProjectFlow` khi
  `importArchiveHistory` imported > 0; modal sau adopt (`moved > 0`)
  và sau undo (`movedBack > 0`).

### 1.7 Modal viết lại (LegacyHistoryAdoptModal.tsx)

- Giữ nguyên data-testid cũ (`legacy-adopt-modal`,
  `legacy-adopt-item`, `legacy-adopt-accept`, `legacy-adopt-dismiss`).
- Thêm: `legacy-adopt-confirm` (+ `data-from`),
  `legacy-adopt-confirm-accept`, `legacy-adopt-confirm-cancel`,
  `legacy-adopt-confirm-all`, `legacy-adopt-confirm-all-accept`,
  `legacy-adopt-confirm-all-cancel`, `legacy-adopt-last-adopt`,
  `legacy-adopt-undo`, `legacy-adopt-undo-hide`,
  `legacy-adopt-dismissed-toggle`, `legacy-adopt-dismissed-section`,
  `legacy-adopt-dismissed-list`, `legacy-adopt-dismissed-item`
  (+ `data-from`), `legacy-adopt-reopen`, `legacy-adopt-forget`,
  `legacy-adopt-close` (nút ✕).
- Pre-merge, chuỗi dịch hiện đúng key thô (như tiền lệ T7); headed
  test chỉ assert cấu trúc/dữ liệu qua data-testid + số version dạng
  số trong bảng bằng chứng, không assert chuỗi dịch.

## 2. Thay đổi hành vi (cần biết)

- Trước đợt này: "Bỏ qua" là quyết định bền không đường quay lại
  (chỉ xóa tay key localStorage); nhận tay bấm 1 lần là commit ngay,
  không hoàn tác; archive không mang lịch sử theo. Nay cả ba đều có
  đường quay lại / xác nhận / mang theo — xem §1.
- Panel Lịch sử đang mở nay tự đọc lại khi nhập archive mang lịch
  sử mới hoặc khi nhận/hoàn tác legacy trong modal (trước đó hiện
  danh sách cũ tới khi đóng/mở lại).
- Export archive nay kèm `history.json` khi project có version lịch
  sử (toast ghi rõ số version kèm theo). Archive cũ (không có
  `history.json`) nhập bình thường, không đổi.
- Nhập archive có lịch sử của project khác: bỏ qua lịch sử, import
  project vẫn tiếp tục, báo cáo tải ghi note giải thích (không throw,
  không hỏng lần nhập).
- Nhập archive trùng version (cùng id, khác nội dung): giữ bản local,
  đếm conflicts, báo cáo tải ghi note — không ghi đè lặng lẽ.

## 3. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/projectHistory.ts` | Sửa | `rekeyVersions`, `undoManualAdopt`, `importHistoryDetailed`, `importArchiveHistory`, `ManualAdoptResult` +2 field, `ARCHIVE_HISTORY_MAX_VERSIONS`, tín hiệu `notify/subscribe/getHistoryChangedSeq` |
| `apps/web/src/lib/legacyAdoptUi.ts` | Sửa | Dismissed subscribe/snapshot, `undismissLegacyId`, cờ mở modal `requestLegacyAdoptModal`, `loadDismissedLegacyItems` |
| `apps/web/src/components/project/LegacyHistoryAdoptModal.tsx` | Sửa | Viết lại: xác nhận lần 2, banner + hoàn tác, mục đã bỏ qua (mở lại / gỡ) |
| `apps/web/src/components/project/HistoryPanel.tsx` | Sửa | Nút mở mục đã bỏ qua (kèm số lượng); subscribe `historyChangedSeq` |
| `apps/web/src/lib/archive.ts` | Sửa | `ARCHIVE_HISTORY_FILE`, export/import `history.json` |
| `apps/web/src/lib/openProjectFlow.ts` | Sửa | Nhập lịch sử archive + note báo cáo, `archiveHistorySkippedMessage`, notify khi imported > 0 |
| `apps/web/src/lib/projectRepo.ts` | Sửa | Thêm 2 `StructuredNoteCode`: `archiveHistoryImported`, `archiveHistorySkipped` |
| `apps/web/src/components/project/ProjectMenu.tsx` | Sửa | Export kèm lịch sử (`exportHistory` + truyền vào `exportArchive`) |
| `apps/web/src/lib/legacyAdopt66T7.test.ts` | Sửa | Cập nhật expectation M3: thêm `movedVersions: []`, `wasPointerChain: true` |
| `apps/web/tsconfig.json` | Sửa | Exclude 2 test mới (mẫu mọi test node strip-types) |
| `apps/web/src/i18n/fragments/round67-u6.json` | Mới | Fragment 28 key (vi+en) — KHÔNG gộp dict |
| `apps/web/src/lib/legacyAdopt67U6.test.ts` | Mới | Unit 20 test (O/P/Q/R) |
| `apps/web/src/lib/archiveHistory67U6.test.ts` | Mới | Archive 6 test (A1–A6, chạy qua esbuild bundle) |
| `apps/web/scripts/clicktest-67u6-legacy-reopen.mjs` | Mới | Headed 8 case (U0–U7) |
| `docs/PHASE9_ROUND67_U6_LEGACY_REOPEN_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): log chi tiết
`hidden_files/round67-u6.md`; headed evidence
`hidden_files/round67-u6/headed/` (report.json, 3 screenshot PNG,
log vite/chrome — PNG là evidence test, không phải asset sản phẩm);
scratch `/tmp/round67-u6/` (bundle test i18n, log tsc).

Stage: `paths-loop/phase9-round67-u6-legacy-reopen.txt` — 15 entry,
verify bằng read-back. KHÔNG push, KHÔNG release/tag.

## 4. Kiểm chứng (số thật)

### 4.1 Unit mới `apps/web/src/lib/legacyAdopt67U6.test.ts` — 20/20

Chạy: `node apps/web/src/lib/legacyAdopt67U6.test.ts` (~2 s).

- O. Nhận tay + hoàn tác (7): O1 `rekeyVersions` chuyển đúng id +
  remap `parentId` trong tập, ngoài tập giữ nguyên; O2 undo trả
  version về id gốc, khôi phục khóa con trỏ; O3 undo chuỗi không phải
  con trỏ không chạm khóa; O4 undo khi kho đã đổi (version gốc bị
  xóa) → movedBack 0, không throw; O5 adopt trả `movedVersions`
  đúng bảng id gốc → id migrate; O6 bấm Nhận chưa xác nhận không đổi
  kho (kiểm logic cờ xác nhận ở modal qua hàm thuần); O7 adopt
  pointer chain dọn khóa + `wasPointerChain` true.
- P. Mở lại mảnh đã bỏ qua (4): P1 `loadDismissedLegacyItems` trả
  đủ bằng chứng (tên/hash/số version/mốc); P2 mục không còn dữ liệu
  → `exists=false`; P3 `undismissLegacyId` đưa lại hàng đợi, gỡ khỏi
  kho bỏ qua; P4 kho bỏ qua JSON hỏng → rỗng, không crash.
- Q. Tín hiệu lịch sử (1): Q5 subscribe nhận notify, số thứ tự tăng,
  hủy đăng ký thì không nhận nữa.
- R. `rekeyVersions` chọn lọc (3): R1 đích legacy hợp lệ; R2 đích
  envelope hợp lệ; R3 id đích thật sự không hợp lệ (`khong-phai-id`)
  → throw. Lưu ý: `file-xyz` vẫn tính là id legacy theo định nghĩa
  codebase (`isLegacyFileHistoryId` chỉ cần tiền tố `file-`) nên test
  đầu dùng `file-xyz` làm id sai đã sửa lại.
- Trong lúc làm: O1/O2/O4/O6 đỏ do `rekeyVersions` từ chối đích
  legacy (đã sửa thành chấp nhận cả envelope lẫn legacy); R3 đỏ do
  tiền đề test sai về `file-xyz` (đã sửa test).

### 4.2 Archive `apps/web/src/lib/archiveHistory67U6.test.ts` — 6/6

Chạy qua esbuild bundle (`archive.ts` import `./projectRepo` không
đuôi nên Node strip-types không resolve được — mẫu lệnh trong header
file test): bundle ra `/tmp/vcut-u6-archive-test.mjs`, chạy Node.

- A1: export kèm history → zip có `history.json`, parse đúng
  `HistoryExport` (projectId + 2 version).
- A2: export không history → không có `history.json`.
- A3: import archive có history → `history` đúng object.
- A4: archive không có history → `history: null` (không phải
  `undefined`).
- A5: `history.json` hỏng / là array → `historyError` chuỗi VI,
  import vẫn tiếp tục (đỏ lần đầu do `isRecord` nhận cả array — đã
  sửa `archive.ts` thêm `!Array.isArray(raw)`).
- A6: `isAllowedEntry` chấp nhận `history.json`, vẫn chặn entry lạ.

### 4.3 Hồi quy (chạy lại sau mọi sửa)

- T7 `legacyAdopt66T7.test.ts` **16/16** (đã cập nhật expectation M3
  theo field mới của `ManualAdoptResult`).
- S9 `projectNameRegistry64R6.test.ts` **43/43**.
- `projectHistory.test.ts` **15/15**.
- i18n audit P7 **8/8** (esbuild bundle `/tmp/round67-u6/p7.test.cjs`,
  chạy Node; lần đầu đỏ 6/8 vì 4 key trKey mới — đã sửa đúng luật
  audit, xem §1.5).
- i18n orphans Q4 **16/16** (bundle `/tmp/round67-u6/q4.test.cjs`).
- `r6-i18n-check` **PASS**.
- `tsc` apps/web: **0 lỗi** (một lần chạy mất 284s do nhiều luồng
  đợt 67 chạy song song trên VM).
- `vite build` apps/web: **pass** (1m 56s; `index-*.js` 1.535,80 kB /
  gzip 452,95 kB; chỉ cảnh báo chunk >500 kB có sẵn).

### 4.4 i18n fragment (kiểm bằng node, không qua dict)

- `apps/web/src/i18n/fragments/round67-u6.json`: **28 key lá**,
  vi==en cùng tập key, placeholder khớp từng key, không key rỗng,
  **0 key vi==en giống hệt**.
- i18nAudit59P7 / i18nOrphans60Q4 KHÔNG chạy trực tiếp bằng Node được
  (import extensionless) — phải bundle esbuild `--format=cjs` rồi
  chạy (xem header mỗi file).

### 4.5 Headed thật `apps/web/scripts/clicktest-67u6-legacy-reopen.mjs` — 8/8 (lần chạy thứ 3)

Chạy: `node apps/web/scripts/clicktest-67u6-legacy-reopen.mjs`
(~100 s; vite dev :5660, Chromium qua Xvfb :178, profile mới).
Report: `hidden_files/round67-u6/headed/report.json`.

- U0: app projectId envelope là UUID thật (`d9a23e7a-…`).
- U1: seed autosave spec A (2 clip) + mảnh `file-11e2c5ac-…` (spec B)
  + con trỏ `file-c96e3078-…` (spec C), cả hai mơ hồ.
- U2: xác nhận lần 2 bằng UI thật — bấm Nhận rồi Hủy → kho không
  đổi; bấm Nhận rồi Xác nhận → mảnh rỗng, envelope có version mang
  hash B, banner Hoàn tác hiện (screenshot
  `legacy-adopt-confirm-undo.png`).
- U3: bấm Hoàn tác bằng UI thật → mảnh về lại modal, chuỗi gốc 1
  version, envelope sạch hash B; rồi Bỏ qua → id mảnh ghi nhớ.
- U4: mở lại từ HistoryPanel bằng UI thật — mục đã bỏ qua hiện đủ
  bằng chứng, Mở lại đưa về hàng đợi (modal 2 mục), danh sách bỏ qua
  hết id mảnh (screenshot `legacy-adopt-dismissed.png`).
- U5: nhập archive qua **input file thật** (DataTransfer + change,
  không dùng fallback gọi thẳng flow): tên "Archive Test", kho Q có
  2 version (chuỗi mới từ archive), note imported 2/skipped
  0/conflicts 0, panel Lịch sử 2 hàng, modal không hiện lại
  (screenshot `history-after-archive-import.png`).
- U6: nhập lại cùng archive → skipped 2; archive sửa 1 version
  (cùng id, spec khác, hash tính lại) → skipped 1/conflicts 1, bản
  local giữ nguyên hash gốc, kho Q vẫn 2 version.
- U7: **0** window.onerror/unhandledrejection trong suốt phiên.

**Lịch sử 3 lần chạy (trung thực):** lần 1 **3/8** — U2 FAIL do harness
(`CLICK_ITEM_FN` thừa `()` cuối so với mẫu T7) kéo theo U3/U4, U5
timeout đếm 2 hàng Lịch sử; lần 2 **6/8** — U5 FAIL do race thật
(tên project đổi ở `replaceProject` TRƯỚC khi nhập history.json nên
poll theo tên dừng quá sớm) và U6 FAIL do harness (`${SPEC_FN}(...)`
gán arrow function thay vì gọi nó — mẫu đúng là
`const spec = ${SPEC_FN}; spec(...)` như SEED_FN); lần 3 **8/8** sau
khi sửa cả hai + thêm tín hiệu `notifyHistoryChanged` cho panel
(phát hiện nhờ U5: panel không tự đọc lại sau nhập archive là lỗi
thật của sản phẩm, không chỉ của test).

## 5. Nợ mở / giới hạn (trung thực)

1. **Modal hiện key thô cho tới khi parent gộp fragment.** Key mới
   chưa có trong `vi.json`/`en.json` nên `t()` trả về đúng key cho tới
   lúc parent gộp fragment vào dict — đúng tiền lệ T7. Headed test
   vì vậy chỉ assert cấu trúc/dữ liệu qua `data-testid`, không assert
   chuỗi dịch; chuỗi dịch đã kiểm bằng node ở §4.4.
2. **Hoàn tác chỉ một mức, chỉ lần nhận gần nhất.** Nhận lần 2 ghi đè
   bản ghi hoàn tác của lần 1; nhận "tất cả" cũng chỉ hoàn tác được
   lần nhận cuối trong loạt (banner ghi rõ). Muốn undo nhiều mức thì
   cần stack bản ghi — việc cho đợt sau nếu cần.
3. **Version lưu mới vào envelope sau khi nhận mà trỏ cha tới version
   đã nhận thì `parentId` vẫn trỏ id đã migrate (dangling)** — cùng
   hành vi prune cũ: `rekeyVersions` chỉ remap `parentId` của version
   trong tập chuyển, version ngoài tập giữ nguyên.
4. **Nhập archive: giới hạn 500 version, bỏ qua lặng lẽ theo lý do.**
   Archive có >500 version lịch sử hoặc lịch sử của project khác →
   bỏ qua toàn bộ lịch sử, chỉ ghi note vào báo cáo tải (user không
   mở báo cáo thì không thấy lý do). Không có UI riêng báo "lịch sử
   trong archive bị bỏ qua vì…".
5. **"Gỡ khỏi danh sách" không phải xóa vĩnh viễn.** Chỉ gỡ id khỏi
   danh sách bỏ qua; lần adopt/quét sau có thể hỏi lại chuỗi đó.
   Muốn không bao giờ hỏi nữa thì bấm Bỏ qua lại.
6. **Bảng xác nhận chỉ tóm tắt số version + id, không hiện diff nội
   dung spec.** User xác nhận dựa trên bảng bằng chứng (tên/hash/số
   version/mốc), không xem được từng clip trong version sẽ nhận.
7. **Modal dùng chung backdrop z 400 nên che TopBar khi mở** (cùng
   hạn chế S10 đã ghi ở T7 §5.7). Đổi locale giữa chừng khi modal mở
   phải đóng modal trước.
8. **Headed script dùng display :178 + port vite 5660–5669 + debug
   9760–9769 riêng** (tránh đụng luồng khác đợt 67), dọn socket X mồ
   côi khi Xvfb cũ đã chết; chạy song song 2 luồng headed cùng dải
   port vẫn có thể đụng nhau — tiền lệ T7 dùng :177/:5650.
9. **Cây chung có nhiều luồng đợt 67 sửa song song:** kiểm chứng cuối
   (tsc 0, build pass, unit/headed xanh) chạy trên cây tại thời điểm
   kết thúc luồng; parent gộp cần chạy lại sau khi gộp như tiền lệ
   đợt 66.

## 6. Ghi chú cho parent gộp (theo lệnh task)

- **Fragment cần gộp:** `apps/web/src/i18n/fragments/round67-u6.json`
  — **28 key**. Sau gộp dict: vi = en = **2326 + 28 = 2354 key lá**;
  key vi==en giống hệt giữ **52** (không đổi — fragment không có key
  vi==en).
- **Test khóa số key cần cập nhật số 2326 → 2354** (số vi==en 52
  không đổi): `i18nAudit59P7.test.ts`, `i18nOrphans60Q4.test.ts`,
  `i18nRound57N4.test.ts`, `reverseBadge46B6.test.ts`,
  `reverseCompat44Z6.test.ts`, `reversePlaybackI18n49E2.test.ts`,
  `reverseToggleI18n48D4.test.ts`, `saveToast31.test.ts`,
  `structuredNotes32.test.ts`, `errorDetail34Q4.test.ts` (xem comment
  lịch sử trong từng file — chỉ dòng assert/tên test/mô tả trạng thái
  hiện tại mới đổi, comment lịch sử giữ nguyên số cũ, theo bài học
  đợt 64 §7). Luồng này KHÔNG tự sửa các file đó (không gộp dict).
- **KHÔNG sửa `vi.json`/`en.json`** trong luồng này (đã kiểm: dict
  vẫn 2326/2326, r6-i18n-check PASS).
- Lưu ý khi gộp: 2 `StructuredNoteCode` mới
  (`archiveHistoryImported`, `archiveHistorySkipped`) dùng trong
  `openProjectFlow.ts` + `projectRepo.ts`; key `projectMenu.*` cho
  toast export kèm lịch sử và các key `legacyAdopt.*` mới nằm trong
  fragment (không thêm trKey mới vào 36 file audit P7 quét — chuỗi VI
  của lý do bỏ qua lịch sử nằm ở `openProjectFlow.ts`, ngoài phạm vi
  quét).
- Modal dùng `t` (không dùng bí danh `i18nT`) nên r6-i18n-check không
  báo thiếu key trước lúc gộp; chuỗi key đầy đủ viết literal trong
  modal + fragment JSON nên test orphan quét được sau khi gộp.

## 7. Môi trường chạy

- VM này, không GPU. /tmp tmpfs 512M.
- Lệnh chạy (từ gốc repo):
  `node apps/web/src/lib/legacyAdopt67U6.test.ts` — exit 0 khi 20/20 pass.
  `node apps/web/src/lib/archiveHistory67U6.test.ts` — chạy qua esbuild
  bundle (xem header file test).
  `node apps/web/src/lib/legacyAdopt66T7.test.ts` — hồi quy T7 16/16.
  `node apps/web/src/lib/projectNameRegistry64R6.test.ts` — hồi quy S9 43/43.
  `node apps/web/scripts/r6-i18n-check.cjs` — PASS.
  `node apps/web/scripts/clicktest-67u6-legacy-reopen.mjs` — headed 8/8.
- `tsc` chạy từ `apps/web` (`npx tsc --noEmit`).
- `vite build` chạy từ `apps/web`.
