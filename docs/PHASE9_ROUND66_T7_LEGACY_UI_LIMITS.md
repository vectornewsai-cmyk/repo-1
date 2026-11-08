# Phase 9 — Đợt 66, luồng T7: UI nhận mảnh legacy mơ hồ THỦ CÔNG + nối autosave-restore / nhập archive nhận chuỗi legacy — LIMITS

Ngày: 08/11/2026 (lượt cron 18:35 +07). Nợ đợt 65 S9 §5.1 + §5.2 và
LIMITS gộp đợt 65 §8 mục 6: mảnh legacy mơ hồ chưa có UI nhận thủ
công; autosave-restore/nhập archive chưa nhận chuỗi legacy. KHÔNG
push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| UI nhận thủ công | **ĐÃ XONG.** Modal `LegacyHistoryAdoptModal` hiện khi adopt gặp chuỗi/mảnh mơ hồ, mỗi mục hiện đủ bằng chứng (nguồn, loại chuỗi con trỏ/mảnh quét, tên, hash nhúng trong id, hash project đang mở, số version, mốc bản đầu/cuối, lý do mơ hồ) + nút Nhận / Bỏ qua từng mục, Nhận tất cả / Bỏ qua tất cả / Đóng. |
| Nhận thủ công | **ĐÃ XONG.** `adoptLegacyFragmentManually` — quyết định của user thay cho luật hash tự động (không kiểm lại hash/tên), migrate chuỗi về envelope, dọn khóa con trỏ khi nhận chuỗi con trỏ; lỗi kho → reason `error`, không throw. |
| Autosave-restore | **ĐÃ NỐI.** App.tsx sau `replaceProject` gọi `adoptLegacyHistoryChain(auto.projectId, auto.name, { spec: auto.spec })` chạy nền (không chặn rehydrate); mảnh mơ hồ → hàng đợi UI. |
| Nhập archive | **ĐÃ NỐI.** `openArchiveFileFlow` gọi adopt với `(res.projectId, res.name, { spec: res.spec })` sau `replaceProject`; mảnh mơ hồ → hàng đợi UI. |
| Test | Unit mới **16/16** (chạy 2 lần). Hồi quy S9 **43/43** (chạy 2 lần). Headed thật **7/7** (vite dev + Chromium + CDP + Xvfb). |
| tsc | **0 lỗi** (chạy 2 lần; lần cuối log 0 byte). |
| vite build | **Pass** (42,43s, chỉ cảnh báo chunk >500 kB có sẵn). |
| i18n | Fragment riêng **27 key** `legacyAdopt.*` (`apps/web/src/i18n/fragments/round66-t7.json`), vi==en cùng tập key, placeholder khớp, chỉ 1 key vi==en giống hệt (`noHash` "—"). **KHÔNG gộp dict** — dict giữ 2297 key; parent gộp sau (xem §6). |
| r6-i18n-check / orphans | **PASS** / **16/16** (dict không đổi). |

## 1. Thiết kế

### 1.1 Bằng chứng hiển thị (registry — thuần, test được)

- `legacyChainDisplay(chainId, versions)` (`projectNameRegistry64R6.ts`
  §4 mới): tách `namePart` + `embeddedHash` từ id `file-<hash>-<tên>`
  (chuỗi `proj-` → tên "", hash null), đếm version, mốc
  `firstCreatedAt`/`lastCreatedAt` (min/max, null khi chuỗi rỗng).
- `isAmbiguousAdoptionReason(reason)`: chỉ nhận tiền tố `ambiguous-`
  (phân biệt mơ hồ — giữ khóa/dữ liệu — với từ chối hẳn như
  `name-mismatch` / `not-file-chain`).

### 1.2 Kết quả adopt nay mang bằng chứng (projectHistory.ts)

- `LegacyFragmentAmbiguous` thêm 5 field hiển thị (`namePart`,
  `embeddedHash`, `versionCount`, `firstCreatedAt`, `lastCreatedAt`) —
  điền ở cả 3 đường: mảnh mơ hồ do `classifyLegacyFragment`, lỗi quét
  (`scan-error`, versionCount 0 khi `listVersions` ném lỗi), và chuỗi
  con trỏ mơ hồ mới.
- `AdoptLegacyHistoryResult` thêm `pointerAmbiguous` (chuỗi con trỏ bị
  từ chối vì mơ hồ, kèm bằng chứng; null khi đã nhận / từ chối hẳn /
  không có con trỏ) và `openedSpecHash` (hash spec đang mở để UI so
  sánh với hash nhúng; null khi không có spec).
- `adoptLegacyFragmentManually(envelopeId, fragmentId, deps?)`:
  kiểm tra id đích hợp lệ → `fragmentId === envelopeId` →
  `isLegacyHistoryId` → `migrateVersions` → dọn khóa legacy khi
  `readLegacyId() === fragmentId`. Reason: `manual-adopted` /
  `manual-adopted-empty` / `invalid-envelope-id` / `same-as-envelope` /
  `not-legacy` / `error` (+ message). Không throw.

### 1.3 Hàng đợi UI (legacyAdoptUi.ts — mới, không import React)

- `collectAmbiguousLegacyItems(result)`: gộp con trỏ + mảnh, khử trùng
  theo `from` (con trỏ trước).
- `queueAmbiguousLegacyItems` / `queueAmbiguousFromAdoptResult`:
  lọc mục đã bỏ qua (localStorage), khử trùng theo `from`.
- `dismissLegacyItem` / `dismissAllLegacyItems`: ghi id vào
  localStorage `vcut:legacy-adopt-dismissed-v1` (JSON array, tối đa
  500 id) + gỡ khỏi hàng đợi. **Dữ liệu trong kho KHÔNG bị xóa.**
- `removeLegacyItem`: gỡ sau khi nhận thành công (không ghi bỏ qua).
- Subscribe/getSnapshot theo mẫu `subscribeLoadReport` cho
  `useSyncExternalStore`; kho "đã bỏ qua" inject được qua
  `setLegacyAdoptDismissedStore` để test Node (localStorage vắng →
  coi như chưa bỏ qua mục nào, không crash; JSON hỏng → rỗng).

### 1.4 Modal (LegacyHistoryAdoptModal.tsx — mới)

- Render trong App.tsx (cạnh `<Toasts />`), `useSyncExternalStore`
  theo dõi hàng đợi; `null` khi hàng đợi rỗng.
- Mỗi mục: bảng bằng chứng 9 dòng (nguồn / loại / tên / hash nhúng /
  hash đang mở / số version / bản đầu / bản cuối / lý do mơ hồ) +
  nút Nhận / Bỏ qua riêng. Footer: Nhận tất cả (tuần tự, mục lỗi ở
  lại + toast lỗi) / Bỏ qua tất cả / Đóng.
- "Đóng" chỉ ẩn lần này; modal hiện lại khi hàng đợi có mục MỚI
  (so `queueKey` từ các `from`).
- Nhận xong: toast `legacyAdopt.adopted` (số version + id nguồn);
  nhận lỗi: toast `legacyAdopt.adoptFailed` (id + message), mục ở lại
  để thử lại.
- Dùng class `.modal-backdrop` / `.modal` sẵn có (z 400, y hệt các
  modal khác — cùng hạn chế S10: backdrop che TopBar khi modal mở).
- `data-testid`: `legacy-adopt-modal`, `legacy-adopt-item`
  (`data-from`), `legacy-adopt-accept` / `-dismiss`.

### 1.5 Ba đường nối adopt

| Đường | Gọi adopt | Tên truyền | Ghi chú |
|---|---|---|---|
| Mở file (`openProjectFileFlow`) | có sẵn từ S9, nay lấy kết quả + queue | `file.name` | Không đổi luật nhận, chỉ thêm queue |
| Nhập archive (`openArchiveFileFlow`) | **mới** sau `replaceProject` | `res.name` (tên project) | Lịch sử file gốc không đi theo `.vcut.zip`; chỉ nhận chuỗi legacy đã có trên máy NÀY (xem §5.2) |
| Autosave-restore (App.tsx) | **mới**, chạy nền sau `markSaved` | `auto.name` (tên project) | Không chặn rehydrate; `void … .catch(()=>{})` để lỗi kho không hỏng khởi động |

## 2. Thay đổi hành vi (cần biết)

- Trước đợt này, mảnh mơ hồ chỉ nằm trong kết quả trả về mà caller bỏ
  qua (mở file) hoặc không chạy adopt (autosave/archive) — user không
  bao giờ thấy chúng. Nay chúng hiện modal sau mỗi lần mở/khôi phục/
  nhập khi còn mơ hồ và chưa bị bỏ qua.
- "Bỏ qua" là quyết định BỀN (ghi localStorage theo id chuỗi): lần mở
  sau không hỏi lại chuỗi đó nữa. Muốn hỏi lại thì xóa key
  `vcut:legacy-adopt-dismissed-v1` trong localStorage (xem §5.4).
- Nhận thủ công là quyết định KHÔNG HOÀN TÁC bằng một nút bấm:
  version đã chuyển sang chuỗi envelope (nội dung version giữ nguyên,
  chỉ đổi khóa); muốn tách lại phải xóa tay từng version trong
  HistoryPanel. Modal hiện đủ bằng chứng trước khi user bấm Nhận để
  giảm rủi ro bấm nhầm — nhưng không có bước xác nhận lần 2.
- Modal hiện ngay sau khi mở file/khôi phục autosave/nhập archive nếu
  có mục mơ hồ — kể cả khi user chỉ định mở file nhanh rồi làm việc
  khác. Nút Đóng / Bỏ qua tất cả để dẹp trong 1 bấm; không có chế độ
  "không bao giờ hỏi về chuỗi legacy nữa" ngoài Bỏ qua từng chuỗi.
- `adoptLegacyHistoryChain` nay trả thêm 2 field (`pointerAmbiguous`,
  `openedSpecHash`) và `fragmentsAmbiguous` có thêm 5 field — caller
  cũ (chỉ đọc `adopted`/`moved`/`reason`) không ảnh hưởng; test S9
  43/43 vẫn xanh không sửa expectation (trừ không có).

## 3. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/projectNameRegistry64R6.ts` | Sửa | §4 mới: `LegacyChainDisplay`, `legacyChainDisplay`, `isAmbiguousAdoptionReason` |
| `apps/web/src/lib/projectHistory.ts` | Sửa | `LegacyFragmentAmbiguous` +5 field hiển thị; `AdoptLegacyHistoryResult` +`pointerAmbiguous`/`openedSpecHash`; `ambiguousFragmentEntry`; `adoptLegacyFragmentManually` (+`ManualAdoptResult`); import thêm 2 helper |
| `apps/web/src/lib/legacyAdoptUi.ts` | Mới | `AmbiguousLegacyItem`, `collectAmbiguousLegacyItems`, hàng đợi subscribe/getSnapshot, kho "đã bỏ qua" localStorage (inject được) |
| `apps/web/src/components/project/LegacyHistoryAdoptModal.tsx` | Mới | Modal nhận thủ công (bằng chứng 9 dòng/mục, Nhận/Bỏ qua, Nhận tất cả/Bỏ qua tất cả/Đóng) |
| `apps/web/src/lib/openProjectFlow.ts` | Sửa | Mở file: lấy kết quả adopt + queue; nhập archive: adopt + queue sau `replaceProject` |
| `apps/web/src/App.tsx` | Sửa | Autosave-restore: adopt nền + queue; render `<LegacyHistoryAdoptModal />` |
| `apps/web/src/i18n/fragments/round66-t7.json` | Mới | Fragment 27 key `legacyAdopt.*` (vi+en) — KHÔNG gộp dict |
| `apps/web/src/lib/legacyAdopt66T7.test.ts` | Mới | Unit 16 test (K/L/M/N) |
| `apps/web/scripts/clicktest-66t7-legacy-adopt-ui.mjs` | Mới | Headed 7 case (T0–T6) |
| `apps/web/tsconfig.json` | Sửa | Thêm `src/lib/legacyAdopt66T7.test.ts` vào exclude (theo mẫu mọi test node strip-types — nếu không tsc báo TS5097) |
| `docs/PHASE9_ROUND66_T7_LEGACY_UI_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): log chi tiết
`hidden_files/round66-t7.md`; fragment paths
`hidden_files/round66-t7-fragment.txt`; headed evidence
`hidden_files/round66-t7/headed/` (report.json, 2 screenshot PNG,
log vite/chrome — PNG là evidence test, không phải asset sản phẩm);
scratch `/tmp/round66-t7/` (log tsc, bundle test i18n).

Stage: `paths-loop/phase9-round66-t7-legacy-ui.txt` — 11 entry,
verify bằng read-back. KHÔNG push, KHÔNG release/tag.

## 4. Kiểm chứng (số thật)

### 4.1 Unit mới `apps/web/src/lib/legacyAdopt66T7.test.ts` — 16/16 (chạy 2 lần)

Chạy: `node apps/web/src/lib/legacyAdopt66T7.test.ts` (~2 s).

- K. Bộ hiển thị thuần (3): K1 tách tên/hash + đếm version + mốc
  đầu/cuối (kể cả thứ tự createdAt lộn xộn); K2 chuỗi `proj-` không
  tên/hash + chuỗi rỗng mốc null; K3 `isAmbiguousAdoptionReason` chỉ
  nhận tiền tố `ambiguous-` (cả `scan-error` cũng KHÔNG tính là mơ hồ
  theo nghĩa này — scan-error vẫn vào UI qua `fragmentsAmbiguous`).
- L. Adopt trả bằng chứng (4):
  - L1 **[REPRO đường UI]**: con trỏ mơ hồ (tên khớp, hash lệch) →
    `pointerAmbiguous` đủ 9 field, `openedSpecHash` đúng hash spec
    đang mở, chuỗi còn nguyên 2 version, khóa giữ nguyên, envelope 0.
  - L2: tên lệch VÀ hash lệch → từ chối hẳn `name-mismatch`,
    `pointerAmbiguous` null. (Lưu ý: chỉ lệch tên mà hash khớp thì
    vẫn nhận theo luật S9 F4 — test đầu viết sai setup này đã bắt đúng
    luật, đã sửa setup.)
  - L3: mảnh mơ hồ kèm đủ bằng chứng (tên/hash/số version/mốc đầu =
    mốc cuối khi 1 version); con trỏ đã nhận thì `pointerAmbiguous`
    null.
  - L4: không đưa spec → `openedSpecHash` null nhưng
    `pointerAmbiguous` vẫn có (`ambiguous-no-content-evidence`,
    versionCount 1), `fragmentsSkipped: "no-spec"`.
- M. Nhận thủ công (5):
  - M1: nhận tay mảnh mơ hồ → moved 1, mảnh rỗng, envelope 2 version
    (1 con trỏ + 1 mảnh, đúng hash mảnh); khóa con trỏ KHÔNG bị dọn.
    (Test đầu assert sai — adopt trước đó đã dọn khóa — đã sửa bằng
    deps mới để kiểm chứng riêng.)
  - M2: nhận tay chuỗi con trỏ mơ hồ → moved 1 + dọn khóa.
  - M3: chuỗi rỗng → moved 0, `manual-adopted-empty`, vẫn dọn khóa.
  - M4: từ chối id không hợp lệ (UUID khác → `not-legacy`; chính
    envelope → `same-as-envelope`; đích sai → `invalid-envelope-id`),
    kho không đổi, không throw. (Thứ tự check đã đổi để
    `same-as-envelope` được kiểm trước `not-legacy`.)
  - M5: backend hỏng → reason `error` kèm message, không throw, giữ
    khóa.
- N. Hàng đợi UI (4): N1 collect gộp con trỏ + mảnh, khử trùng theo
  `from`; N2 queue lọc mục đã bỏ qua + khử trùng, dismiss ghi nhớ +
  gỡ khỏi hàng đợi, `queueAmbiguousFromAdoptResult` với mục đã bỏ qua
  → 0 mục mới; N3 `removeLegacyItem` sau nhận KHÔNG ghi bỏ qua,
  `dismissAllLegacyItems` ghi nhớ mục còn lại; N4 kho bỏ qua JSON hỏng
  → coi như chưa bỏ qua, queue vẫn chạy.

### 4.2 Hồi quy (chạy lại sau mọi sửa)

- S9 `projectNameRegistry64R6.test.ts` **43/43** (chạy 2 lần, không sửa
  expectation).
- projectHistory **15/15**, projectId63R7 **27/27**, idbCleanup61R9
  **16/16**, projectAssetRefs62R7 **28/28**, projectRepo **10/10**,
  saveToast31 **15/15**, loadProject54K1 **7/7** (chạy trực tiếp Node).
- r6-i18n-check **PASS** (vi=en=2297, 585 literal key, 458 key R6).
- i18n orphans Q4 **16/16** (bundle esbuild ra `/tmp/round66-t7/`,
  chạy Node).
- `tsc` apps/web: **0 lỗi** (chạy 2 lần; lần cuối log 0 byte).
  Trong lúc làm: lần chạy đầu báo 3 lỗi TS5097 ở file test mới (import
  đuôi `.ts`) + 2 lỗi TS6133 ở `ExportPanel.tsx` — lỗi ExportPanel
  BIẾN MẤT ở lần chạy sau (luồng khác đợt 66 đang sửa file đó song
  song, không phải file luồng này, không sửa); TS5097 của luồng này đã
  sửa đúng mẫu (thêm test vào exclude của tsconfig.json — S9 test đã
  có trong exclude từ trước).
- `vite build` apps/web: **pass** (42,43s; `index-*.js` 1.510,62 kB /
  gzip 446,31 kB; chỉ cảnh báo chunk >500 kB có sẵn).

### 4.3 Headed thật `apps/web/scripts/clicktest-66t7-legacy-adopt-ui.mjs` — 7/7 (lần đầu)

Chạy: `node apps/web/scripts/clicktest-66t7-legacy-adopt-ui.mjs`
(~90 s; vite dev :5650, Chromium 1254 qua Xvfb :177, profile mới).
Report: `hidden_files/round66-t7/headed/report.json`.

- T0: app projectId envelope là UUID thật (`d6cd5f8c-…`).
- T1: seed autosave spec A (2 clip) + mảnh `file-11e2c5ac-…` (spec B)
  + con trỏ `file-c96e3078-…` (spec C), cả hai mơ hồ (cùng tên, hash lệch).
- T2: reload → autosave-restore chạy adopt → modal hiện **2 mục**,
  mỗi mục hiện đúng hash nhúng (screenshot `legacy-adopt-modal.png`).
- T3: bấm Nhận ở mục mảnh (UI thật): modal còn đúng 1 mục (con trỏ),
  chuỗi mảnh rỗng, envelope có version mang hash B.
- T4: bấm Bỏ qua ở mục con trỏ (UI thật): modal đóng, chuỗi con trỏ
  còn nguyên 1 version, id đã ghi vào danh sách bỏ qua.
- T5: reload lần nữa → modal **KHÔNG** hiện lại; mở panel Lịch sử
  bằng UI thật → đúng **1 hàng** (version mảnh đã nhận tay).
- T6: **0** window.onerror/unhandledrejection trong suốt phiên.

### 4.4 i18n fragment (kiểm bằng node, không qua dict)

- `apps/web/src/i18n/fragments/round66-t7.json`: **27 key lá**,
  vi==en cùng tập key, placeholder khớp từng key, không key rỗng,
  chỉ 1 key vi==en giống hệt (`legacyAdopt.noHash` = "—", hiển nhiên).

## 5. Nợ mở / giới hạn (trung thực)

1. **Modal hiện key thô cho tới khi parent gộp fragment.** Key
   `legacyAdopt.*` chưa có trong `vi.json`/`en.json` nên `t()` trả về
   đúng key (vd tiêu đề hiện `legacyAdopt.title`) cho tới lúc parent
   gộp fragment vào dict — đúng tiền lệ S2/S4/S6/S8 đợt 65 (fragment
   riêng, parent gộp sau). Headed test T2–T5 vì vậy chỉ assert cấu
   trúc/dữ liệu qua `data-testid` + `data-from`, không assert chuỗi
   dịch; chuỗi dịch đã kiểm bằng node ở §4.4. Sau khi parent gộp,
   modal hiện tiếng Việt/Anh đầy đủ, không cần sửa code.
2. **Nhập archive: lịch sử file gốc không đi theo `.vcut.zip`.**
   Nối adopt ở đường archive chỉ nhận được chuỗi legacy ĐÃ CÓ trên máy
   này (mở file trước đó / lưu ra từ máy này) — đúng như LIMITS S9
   §5.2 đã ghi, không đổi. Mang project sang máy khác vẫn chỉ mang
   spec, không mang chuỗi lịch sử IndexedDB.
3. **Autosave/archive truyền TÊN PROJECT, không phải tên file.**
   Autosave envelope và archive đều không lưu tên file `.vcut` gốc
   nên adopt nhận tên project (`auto.name` / `res.name`) làm `fileName`.
   Hệ quả: nhận CHẮC CHẮN theo hash không ảnh hưởng (hash khớp thì
   nhận bất kể tên — luật S9); chỉ PHÂN LOẠI MƠ HỒ theo tên là
   best-effort — một mảnh cùng tên file gốc nhưng khác tên project có
   thể bị xếp `no-signal` (bỏ qua lặng lẽ) thay vì `ambiguous` (hiện
   UI). Muốn chính xác hơn thì envelope autosave / archive phải lưu
   thêm tên file gốc — việc cho đợt sau, không làm trong luồng này để
   khỏi đổi định dạng envelope.
4. **"Bỏ qua" bền theo id chuỗi, không có UI mở lại.** User bấm Bỏ qua
   nhầm thì chuỗi đó không hiện lại nữa cho tới khi xóa key
   localStorage `vcut:legacy-adopt-dismissed-v1` (xóa tay trong DevTools
   → Application → Local Storage). Dữ liệu vẫn còn trong IndexedDB
   dưới id cũ, không mất. Chưa có nút "Hiện lại các mục đã bỏ qua"
   trong modal — việc nhỏ cho đợt sau nếu cần.
5. **Nhận thủ công không có xác nhận lần 2 và không hoàn tác bằng
   nút bấm** (xem §2). Modal hiện đủ bằng chứng để giảm rủi ro, nhưng
   user bấm Nhận nhầm thì phải xóa tay version trong HistoryPanel.
   Chưa đo tỉ lệ bấm nhầm (cần user thật).
6. **Chưa có test đường nhập archive thật trên UI** (chỉ nối code +
   unit qua `adoptLegacyHistoryChain` chung). Headed test chỉ phủ
   đường autosave-restore (T2) + modal (T3–T5). Đường archive dùng
   cùng hàm adopt + queue nên rủi ro thấp, nhưng click-test nhập
   `.vcut.zip` có chuỗi legacy mơ hồ vẫn chưa đo — nợ cho đợt sau.
7. **Modal dùng chung backdrop z 400 nên che TopBar khi mở** (cùng
   hạn chế S10 đã ghi: nút ngôn ngữ TopBar không bấm được khi modal
   mở). Đổi locale giữa chừng khi modal mở phải đóng modal trước —
   chấp nhận, nhất quán với mọi modal khác.
8. **`IndexedDBBackend.listProjectIds` vẫn chưa có test Node**
   (nối tiếp nợ S9 §5.5 — Node không có IndexedDB). Headed test T2
   chạy quét mảnh trên IndexedDB thật nên đường này đã được đo gián
   tiếp (mảnh `file-…` được liệt kê + phân loại đúng).
9. **Cây chung có nhiều luồng đợt 66 sửa song song:** trong lúc làm,
   một lần chạy tsc báo 2 lỗi TS6133 ở `ExportPanel.tsx` rồi tự hết ở
   lần chạy sau (luồng khác đang sửa file đó) — luồng này không đụng
   file đó. Kiểm chứng cuối (tsc 0, build pass, unit/headed xanh)
   chạy trên cây tại thời điểm kết thúc luồng; parent gộp cần chạy lại
   sau khi gộp như tiền lệ đợt 65.

## 6. Ghi chú cho parent gộp (theo lệnh task)

- **Fragment cần gộp:** `apps/web/src/i18n/fragments/round66-t7.json`
  — **27 key** `legacyAdopt.*`. Sau gộp dict: vi = en = **2297 + 27 =
  2324 key lá**; key vi==en giống hệt: **51 + 1 = 52**
  (`legacyAdopt.noHash` "—").
- **Test khóa số key cần cập nhật số 2297 → 2324** (và 51 → 52 ở
  chỗ assert vi==en): `i18nAudit59P7.test.ts`,
  `i18nOrphans60Q4.test.ts`, `i18nRound57N4.test.ts`,
  `reverseBadge46B6.test.ts`, `reverseCompat44Z6.test.ts`,
  `reversePlaybackI18n49E2.test.ts`, `reverseToggleI18n48D4.test.ts`,
  `saveToast31.test.ts`, `structuredNotes32.test.ts`,
  `errorDetail34Q4.test.ts` (xem comment lịch sử trong từng file —
  chỉ dòng assert/tên test/mô tả trạng thái hiện tại mới đổi, comment
  lịch sử giữ nguyên số cũ, theo bài học đợt 64 §7). Luồng này KHÔNG
  tự sửa các file đó (không gộp dict).
- **KHÔNG sửa `vi.json`/`en.json`** trong luồng này (đã kiểm: dict
  vẫn 2297/2297, r6-i18n-check PASS).
- Modal dùng `t` (không dùng bí danh `i18nT`) nên r6-i18n-check không
  báo thiếu key trước lúc gộp; chuỗi key đầy đủ viết literal trong
  modal + fragment JSON nên test orphan quét được sau khi gộp.

## 7. Môi trường chạy

- VM này, không GPU. /tmp tmpfs 512M (lúc chạy còn 458M trống).
- Lệnh chạy (từ gốc repo):
  `node apps/web/src/lib/legacyAdopt66T7.test.ts` — exit 0 khi 16/16 pass.
  `node apps/web/src/lib/projectNameRegistry64R6.test.ts` — hồi quy S9 43/43.
  Các test hồi quy §4.2 — chạy trực tiếp Node.
  `node apps/web/scripts/r6-i18n-check.cjs` — PASS.
  `node apps/web/scripts/clicktest-66t7-legacy-adopt-ui.mjs` — headed 7/7.
- `tsc` chạy từ `apps/web` (`npx tsc --noEmit`).
- `vite build` chạy từ `apps/web`.
