# Phase 9 — Đợt 62, luồng R7: Sổ tham chiếu liên project + chặn xóa liên project — LIMITS

Ngày: 08/11/2026 (lượt cron 06:35 +07). Phạm vi: đóng nợ đợt 61 R9 §5.1 +
§5.2 + §5.8 (LIMITS: `docs/PHASE9_ROUND61_R9_IDB_CLEANUP_UI_LIMITS.md`)
về UI "Dọn kho" / IndexedDB cleanup. KHÔNG push, KHÔNG release/tag,
KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| (a) Sổ tham chiếu liên project | **Đã triển khai + kiểm chứng.** Store `projectRefs` mới trong cùng DB `vcut-studio-assets` (DB v1 → v2, nâng cấp giữ nguyên manifests + blobs); ghi tập assetId của project hiện tại mỗi khi spec/media đổi (App effect debounce) + mỗi lần lưu file (`saveCurrentProject`); UI dọn kho đọc sổ ở mỗi lần quét — mục nào project KHÁC còn ghi nhận dùng thì bị khóa như mục đang dùng; `deleteCleanupAsset(s)` đọc tươi sổ trước khi xóa và từ chối `cross-project` (kèm tên project), đọc sổ lỗi thì từ chối `registry-unavailable` (fail-closed). Test 2 project dùng chung bytes: lib 28/28 + headed X1–X5 5/5. |
| (b) Click-test "Chọn tất cả mục mồ côi" + locale en + viewport 390px | **Đã đo headed 9/9** (X0–X7 + H9). Nút chọn-tất-cả bấm thật, chỉ tick đúng mục mồ côi, nút xóa hiện "Delete selected (1)" (tiếng Anh, key đã gộp đợt 61); viewport 390px panel gọn trong viewport (rect left=12 right=378), MediaBin mở qua nút 📁 ở fabbar, chọn-tất-cả + xóa thật bằng chuột đều được. |
| (c) refCount / tab-sync | **Đã triển khai + đo được một phần.** `syncAssetRefCounts` nhận `opts.locks` (`navigator.locks`): toàn bộ lần sync (đọc → tính → ghi) chạy dưới lock liên tab `vcut-refcount-sync`; test D1 đo max concurrent ghi = 1 (đối chứng không locks = 2). Ghi sổ chạy dưới lock `vcut-projrefs`. Panel lắng nghe BroadcastChannel `vcut-projrefs` và tự quét lại khi tab khác đổi sổ/xóa bytes — đo headed thật ở X7 (không cần tab thứ hai: post từ channel khác cùng tab). Giới hạn còn lại xem §5. |
| Test | Lib mới 28/28; hồi quy idbCleanup61R9 16/16 + assetStore 27/27 + binOrphan60Q7 17/17 + store.idbCleanup61R9 4/4; headed mới 9/9; vite build pass 15,11 s. |
| tsc | **File của luồng này 0 lỗi.** `tsc` toàn repo lúc chạy cuối còn 1 lỗi nằm trong file của luồng khác đợt 62 đang làm dở (`src/lib/bridgeErrors62R5.test.ts` — lỗi TS6133 `existsSync` không dùng; lần chạy trước đó là 4 lỗi ở `nestedPreview.ts` + `pauseStall62R6.test.ts` — các luồng khác sửa dần trong lúc chạy song song, không phải lỗi do luồng này; không sửa file của luồng khác). |

## 1. Thiết kế (a): sổ tham chiếu liên project

### 1.1 Khóa sổ theo tên project

- Bản ghi: `{ projectKey, projectName, assetIds: string[], updatedAt: string }`,
  store `projectRefs`, keyPath `projectKey`, trong cùng DB `vcut-studio-assets`.
- Khóa: `name:<tên project>` (`spec.meta.name`, trim; rỗng → "Dự án không tên" —
  khớp fallback của `serializeProject`). Hàm thuần `projectKeyForName` /
  `projectDisplayName` ở `lib/projectAssetRefs62R7.ts`.
- Ghi là REPLACE toàn bộ tập asset của khóa (ghi sau thắng). Project mở lại
  sẽ ghi lại đúng tập hiện tại của nó nên bản ghi không phình; union bị bác
  vì chỉ phình và không bao giờ giải phóng (xem §5.2).
- KHÔNG ghi bản ghi rỗng mới: project chưa dùng asset nào và chưa có bản ghi
  thì bỏ qua (tránh nhiễu lúc App mount với spec mặc định "Dự án mới" trước
  khi mẫu/autosave khôi phục xong — lỗi bắt được ở lần chạy headed đầu, xem
  §3.4). Project đã có bản ghi mà dùng hết asset thì vẫn ghi tập rỗng để gỡ
  bảo vệ cũ (test G4).
- Ghi dưới lock liên tab `vcut-projrefs` (Web Locks, cùng mẫu `withAliasLock`
  của AssetStore; không có locks thì vẫn ghi — giới hạn một tab). Ghi trùng
  tập cũ thì không ghi lại (tránh `updatedAt` churn + broadcast thừa);
  `changed` cho caller biết có cần broadcast không.

### 1.2 Điểm ghi

1. **Effect debounce ở App.tsx** (cùng effect sync refCount đợt 61 R9: 1s sau
   mỗi lần spec/media đổi + 1 lần sau mount 1,5s): `recordCurrentProjectRefs`
   tính tập asset từ spec + bin hiện tại (cùng luật đếm với refCount — xem
   §1.4) rồi ghi; chỉ broadcast `refs-changed` khi tập đổi. Best-effort,
   không chạm zustand, lỗi kho tự nuốt.
2. **`saveCurrentProject` (ProjectMenu.tsx, dùng chung cho nút Lưu + Ctrl+S):**
   sau `saveProject`, ghi sổ fire-and-forget + broadcast khi tập đổi. Điểm
   này quan trọng vì lưu file không đổi spec nên effect debounce không kích
   hoạt lại.
3. **KHÔNG ghi ở đường mở file** (`openProjectFlow`): lúc mở xong, bin media
   chưa rehydrate xong nên tập asset tính được chỉ là tập con (spec-only);
   với ngữ nghĩa replace, ghi tập con lúc đó sẽ ghi đè mất asset bin-only
   của bản ghi cũ. App effect (điểm 1) ghi lại đầy đủ sau khi rehydrate
   xong nên đường mở không cần ghi riêng.

### 1.3 Cổng chặn ở UI dọn kho

- `scanStorageForCleanup(store, spec, media, { registry, currentProjectKey })`:
  đọc sổ ở đầu lần quét; asset nào còn được project KHÁC (khóa khác
  `currentProjectKey`) ghi nhận dùng thì `usedByOther: [tên project...]` và
  `inUse = true` → UI khóa checkbox như mục đang dùng, trạng thái hiện
  "Được project khác dùng: ..." (key `storageCleanup.usedByOther`).
  Bản ghi của CHÍNH project hiện tại được loại khỏi `usedByOther` — project
  hiện tại được bảo vệ bằng refCount tươi, không bằng bản ghi cũ của chính
  nó (test F3).
- `deleteCleanupAsset(s)(..., { registry, currentProjectKey })`: đọc TƯƠI sổ
  trước khi xóa (kể cả tham chiếu liên project xuất hiện SAU lần quét) —
  còn project khác dùng thì từ chối `cross-project` (kèm tên project);
  đọc sổ lỗi thì từ chối `registry-unavailable` (fail-closed: không biết
  thì không xóa). Không truyền registry → hành vi cũ (chỉ lưới refCount,
  test F5).
- Panel liệt kê mục "Project đã ghi trong sổ tham chiếu": từng project (tên
  + số asset + đánh dấu project hiện tại) + nút "Quên" để gỡ ghi nhận của
  project đã xóa khỏi máy. "Quên" CHỈ xóa bản ghi, không xóa bytes; nút
  Quên của project hiện tại bị khóa (App effect sẽ ghi lại nó trong ~1s).
  Sau xóa bytes, panel broadcast `storage-changed` để tab khác quét lại.
- `AssetStore.remove()` KHÔNG kiểm tra sổ (giữ nguyên lưới refCount): nó
  không biết khóa project hiện tại, và đường xóa khỏi bin của project hiện
  tại phải được phép dù sổ còn ghi nhận (bản ghi đó là của chính project
  đang xóa). Cổng sổ chỉ nằm ở đường dọn kho.

### 1.4 Tập asset ghi vào sổ = tập của refCount

`collectProjectAssetIds` lấy khóa của `computeRefCounts` có tổng > 0, nên
sổ và refCount dùng CÙNG luật đếm: bin item mang assetId, clip `asset:`,
clip tên thô khớp originalName/alias (kể cả nested). Tên thô trùng nhau
vẫn đếm thừa ở cả hai (cố ý, an toàn theo hướng chặn — hồi quy test F6,
không "sửa" thành cho phép xóa).

### 1.5 Nâng cấp DB v1 → v2

`ASSET_DB_VERSION` 1 → 2; `onupgradeneeded` tạo store `projectRefs` nếu
chưa có (manifests + blobs giữ nguyên). Test C1 dựng DB v1 thật bằng
factory thô (chỉ manifests + blobs + 1 manifest cũ) rồi mở bằng AssetStore
v2: manifest cũ còn nguyên (size 777), `listProjectRefs()` trả [], ghi sổ
được. Lưu ý: code mở DB bằng version cũ (harness R9 mở `indexedDB.open(
"vcut-studio-assets", 1)`) sẽ ném `VersionError` trên DB đã lên v2 — harness
mới mở không ghi version; không còn code shipped nào mở DB với version 1
(đã grep).

## 2. Thiết kế (b): click-test chọn-tất-cả + en + 390px

Harness mới `apps/web/scripts/clicktest-62r7-idb-xproject.mjs` (X0–X7 + H9,
vite dev cổng 5620, debug 9720, Xvfb display :174, profile mới tinh):

- **Locale en:** đặt `localStorage["vcut-lang"]="en"` rồi reload (i18n đọc
  key này lúc load module). Nút chọn-tất-cả hiện "Select all orphaned
  items", nút xóa hiện "Delete selected (1)" — hai key này đã gộp vào dict
  từ đợt 61 nên assert được chuỗi tiếng Anh thật. Key MỚI của R7
  (`usedByOther`, `projectsTitle`, ...) chưa gộp nên `t()` trả về chính
  key — harness assert theo `data-testid` / `data-used-by-other` / tên
  file / dung lượng, không theo nhãn mới (cùng cách làm của R9).
- **Chọn-tất-cả:** bấm chuột thật vào nút; assert chỉ tick đúng mục mồ côi
  (mục đang dùng không bị tick), nút xóa mở với nhãn đếm đúng; rồi bấm
  xóa thật (confirm tự accept) và đọc IDB thật.
- **Viewport 390px:** `Emulation.setDeviceMetricsOverride` 390×844
  mobile:true. Hai phát hiện ở lần chạy đầu (đã sửa trong harness, không
  phải bug app): (1) topbar mobile ẨN tên "VCut Studio" nên check mount cũ
  (topbar chứa tên) timeout 240s — check mount ở mobile đổi thành topbar +
  fabbar + splash tắt; (2) MediaBin ở mobile nằm trong bottom-sheet, phải
  bấm nút 📁 ở `.m-fabbar` trước khi bấm Dọn kho. Panel ở 390px: rect
  left=12 right=378 (≤391) — `.modal` có `max-width: calc(100vw - 60px)`
  nên panel 720px co lại đúng, không tràn ngang.

## 3. Thiết kế (c): tab-sync (lock + BroadcastChannel)

- **Web Locks cho sync refCount:** `syncAssetRefCounts(..., { locks })`
  (App.tsx truyền `navigator.locks`); TOÀN BỘ lần sync (đọc manifest →
  tái tính → ghi) chạy dưới lock `vcut-refcount-sync`. Lỗi thiết kế bắt
  được bằng test D1: bản đầu chỉ khóa PHA GHI, còn `list()` đọc NGOÀI
  lock — sync thứ hai dùng snapshot cũ (refCount 0) và bỏ qua ghi cần
  thiết (kết quả a=1, b=1 thay vì một bên thắng). Đã sửa: đưa cả đọc vào
  trong lock; D1 xanh sau sửa. Ghi sổ chạy dưới lock `vcut-projrefs`
  (một tên lock chung cho mọi ghi sổ).
- **BroadcastChannel `vcut-projrefs`:** `notifyProjectRefsChanged()` sau
  khi ghi/quên sổ (chỉ khi tập đổi), `notifyStorageChanged()` sau khi xóa
  bytes; panel đăng ký `subscribeProjectRefsChanged` và tự quét lại khi
  nhận tin (chỉ khi panel đang ready và không trong lúc xóa, để không
  quét đè mất lựa chọn đang tick). Kênh không có (Node/test) → no-op,
  không throw.
- **Giới hạn còn lại của (c)** — xem §5.3/§5.4.

## 4. Kiểm chứng (số thật)

### 4.1 Test lib mới `apps/web/src/lib/projectAssetRefs62R7.test.ts` — 28/28

Chạy: `node apps/web/src/lib/projectAssetRefs62R7.test.ts` (~2 s).

- A. Khóa project (4): `name:<tên>`, trim, rỗng → fallback "Dự án không tên",
  displayName bỏ tiền tố / khóa lạ giữ nguyên.
- B. Registry CRUD qua AssetStore thật + FakeIDB (7): 2 project dùng chung
  bytes → `getProjectsUsingAsset` trả cả hai (B1); ghi đè tập (B2); ghi lại
  đúng tập → changed=false, updatedAt không đổi (B3); quên project chỉ xóa
  bản ghi, bytes còn (B4); dedupe + loại chuỗi rỗng (B5); 2 instance chung
  factory (2 tab) thấy cùng sổ (B6); khóa rỗng → throw (B7).
- C. Nâng cấp DB v1 → v2 (1): xem §1.5.
- D. Lock liên tab cho sync (3): D1 — 2 sync song song + fake locks chung →
  pha ghi max concurrent = **1** (và một trong hai refCount thắng sau = 1,
  còn lại = 0); D2 đối chứng không locks → max concurrent = **2**; D3
  locks.request throw → sync vẫn chạy không khóa (fallback).
- E. BroadcastChannel (3): notify → subscriber nhận đủ 2 loại tin (fake
  channel); không có BroadcastChannel → no-op không throw; tên kênh đúng
  `vcut-projrefs`.
- F. Scan/delete có registry (6): F1 — asset chỉ B dùng → scan khóa
  (usedByOther=[B]), delete từ chối `cross-project` kèm tên B, bytes còn;
  F2 — batch [cross-project, mồ côi] → xóa 1, skip 1; quên B rồi xóa được;
  F3 — bản ghi của chính project hiện tại không chặn xóa; F4 — đọc sổ lỗi
  → scan `registryError=true` (hiển thị fail-open), delete chặn
  `registry-unavailable` (fail-closed); F5 — không truyền registry → hành
  vi cũ; F6 hồi quy R9 — tên thô trùng 2 manifest thì cả hai đều inUse.
- G. recordCurrentProjectRefs (3): G1 — ghi đúng tập (1 clip + 1 bin = 2),
  changed=true lần đầu; G2 — ghi lại đúng tập → changed=false, bớt clip →
  changed=true, tập thu lại; G3 — `collectProjectAssetIds` cho 2 project
  dùng chung bytes (giao nhau đúng ở asset chung); G4 — project rỗng chưa
  có bản ghi → không tạo bản ghi rỗng, đã có bản ghi thì ghi tập rỗng.

### 4.2 Headed `apps/web/scripts/clicktest-62r7-idb-xproject.mjs` — 9/9

Chạy: `node apps/web/scripts/clicktest-62r7-idb-xproject.mjs` (~40 s).
Report JSON + 6 screenshot: `hidden_files/round62-r7/headed/`.

| Case | Kết quả đo (lượt chạy cuối, 08/11 ~00:19 +07) |
|---|---|
| X0 setup | Mẫu tự load 3 clip; bin 2 item mau-1/mau-2.webm (file thật 486080/589876 byte — kích thước mẫu khác nhau giữa các lần chạy do file mẫu được sinh lại, xem §5.7); autosave binMedia 2 entry; IDB thật: manifests 2 + blobKeys 2, refCount cả hai = 2 |
| X1 ghi sổ tự động | Store `projectRefs` có đúng 1 bản ghi `name:Dự án mẫu` liệt kê đủ 2 assetId (mau-1/mau-2), ghi bởi App effect (không seed tay) |
| X2 locale en + seed B | `vcut-lang=en`, reload xong (3 clip + bin 2); IDB: manifest + blob `cu-xoa-truoc.webm` 4321 byte (refCount 0) + bản ghi `name:Dự án B` → [orphan]; tổng 3 manifest + 3 blob |
| X3 chặn liên project | Panel 3 hàng: mồ côi inUse=1, usedByOther="Dự án B", checkbox khóa; nút "Select all orphaned items" (tiếng Anh) disabled (0 mục mồ côi thật); mục sổ liệt kê 2 project, nút Quên của project hiện tại bị khóa, của B mở |
| X4 quên B bằng UI | Bấm nút Quên thật + confirm → sổ chỉ còn 1 bản ghi (project hiện tại), hàng mồ côi inUse=0, checkbox mở, nút chọn-tất-cả mở; bytes mồ côi vẫn còn trong IDB |
| X5 chọn-tất-cả + xóa thật | Bấm "Select all orphaned items" thật → chỉ tick mồ côi, nút xóa hiện "Delete selected (1)"; xóa xong IDB hết manifest/blob của mục đó, mau-1/mau-2 còn nguyên, bản ghi sổ project hiện tại còn đủ 2 assetId, panel còn 2 hàng, bin vẫn 2 item |
| X6 viewport 390px | Panel rect left=12 right=378 (≤391); MediaBin mở qua nút 📁 ở fabbar; bấm chọn-tất-cả thật → tick đúng mục `cu-xoa-390.webm` 2048 byte, nút xóa mở; xóa xong IDB hết manifest/blob của nó, mau-1/mau-2 còn nguyên |
| X7 tab-sync | Mở panel: hàng `cu-xoa-bc.webm` bị khóa vì Dự án C dùng; xóa bản ghi C bằng IDB thô + post `refs-changed` qua BroadcastChannel thật → panel TỰ quét lại, hàng thành chọn được (inUse=0, checkbox mở), bytes vẫn còn trong IDB |
| H9 0 lỗi trang | Không có window.onerror/unhandledrejection qua 3 lần reload |

### 4.3 Bug thật bắt được trong lúc làm (đã sửa)

1. **Lock chỉ bao pha ghi, không bao pha đọc (test D1 đỏ trước):** 2 sync
   song song, sync sau dùng snapshot `list()` cũ nên bỏ qua ghi cần thiết
   (a=1, b=1). Sửa: đưa toàn bộ lần sync vào trong lock. Xem §3.
2. **Bản ghi rỗng cho project mặc định lúc mount (headed lần 1):** App
   effect chạy lần đầu khi spec vẫn là "Dự án mới" rỗng → sổ có thêm bản
   ghi `name:Dự án mới` với `assetIds: []` (làm X2/X3/X4 fail vì đếm sai
   số bản ghi). Sửa: không tạo bản ghi mới khi tập rỗng (test G4). Bản
   ghi rỗng không chặn xóa gì (tập rỗng) nên chỉ là nhiễu UI, không phải
   mất an toàn — nhưng vẫn sửa cho sổ sạch.
3. **Harness X6 timeout 240s ở lần chạy đầu:** không phải bug app — check
   mount cũ đòi topbar chứa "VCut Studio" trong khi topbar mobile ẩn tên
   đó, và MediaBin ở mobile nằm sau nút fab. Đã sửa harness (check mount
   theo fabbar + mở sheet media trước). Xem §2.

### 4.4 Hồi quy + build (chạy lại độc lập sau khi sửa)

- `tsc` apps/web: file của luồng này **0 lỗi**; toàn repo còn 1 lỗi ở file
  của luồng khác đợt 62 (xem §0).
- `vite build` apps/web: **pass, 15,11 s** (cảnh báo chunk >500 kB có sẵn).
- Test chạy lại bằng `node` trực tiếp: projectAssetRefs62R7 28/28,
  idbCleanup61R9 16/16, assetStore 27/27, binOrphan60Q7 17/17.
- Test chạy bằng esbuild bundle: store.idbCleanup61R9 4/4.
- Không chạy lại: các suite headed/test của luồng khác trong đợt 62 (đang
  chạy song song) — chỉ đối chiếu LIMITS của chúng ở bước gộp.

## 5. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/assetStore.ts` | Sửa | DB v1 → v2 + store `projectRefs`; `ProjectRefRecord`, `recordProjectRefs` / `listProjectRefs` / `getProjectsUsingAsset` / `forgetProjectRefs` (lock `vcut-projrefs`) |
| `apps/web/src/lib/idbCleanup61R9.ts` | Sửa | `collectProjectAssetIds`, `recordCurrentProjectRefs`, `CleanupRegistryOpts` (scan/delete có sổ), `CleanupLockManagerLike` + lock cho `syncAssetRefCounts` (toàn bộ lần sync trong lock) |
| `apps/web/src/lib/projectAssetRefs62R7.ts` | Mới | `projectKeyForName` / `projectDisplayName`, kênh `vcut-projrefs`, `notifyProjectRefsChanged` / `notifyStorageChanged` / `subscribeProjectRefsChanged` |
| `apps/web/src/lib/projectAssetRefs62R7.test.ts` | Mới | Test Node 28/28 (khóa + registry CRUD + nâng cấp v1→v2 + lock + BroadcastChannel + scan/delete có sổ + record) |
| `apps/web/src/components/StorageCleanupPanel.tsx` | Sửa | Quét/xóa có sổ + `currentProjectKey`; mục sổ tham chiếu + nút Quên; trạng thái "Được project khác dùng"; lắng nghe BroadcastChannel tự quét lại |
| `apps/web/src/App.tsx` | Sửa | Effect sync refCount: truyền `navigator.locks` + ghi sổ tham chiếu (broadcast khi tập đổi) |
| `apps/web/src/components/project/ProjectMenu.tsx` | Sửa | `saveCurrentProject`: ghi sổ sau khi lưu file (+ broadcast khi tập đổi) |
| `apps/web/scripts/clicktest-62r7-idb-xproject.mjs` | Mới | Harness headed X0–X7 + H9 (9/9) |
| `apps/web/tsconfig.json` | Sửa | Thêm exclude 1 file test mới |
| `docs/PHASE9_ROUND62_R7_IDB_XPROJECT_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): fragment i18n 9 key
`hidden_files/round62-r7-fragment.json` (vi/en thật, khác nhau — parent
gộp vào dict ở cuối đợt 62, theo quy định luồng không sửa trực tiếp
vi.json/en.json); evidence headed `hidden_files/round62-r7/headed/`
(report JSON, vite/chrome log, 6 screenshot); script probe 390px
`/tmp/r7-probe-390.mjs`.

Stage: `paths-loop/phase9-round62-r7-idb-xproject.txt` — 10 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.

## 6. Nợ mở / giới hạn (trung thực)

1. **Sổ chỉ biết các project đã mở/lưu trên trình duyệt này.** Project chưa
   từng mở/lưu ở đây (vd: file .vcut chép từ máy khác, mở lần đầu bằng
   trình duyệt khác) thì sổ không có bản ghi → không được bảo vệ. Cảnh báo
   cũ trong panel vẫn đúng cho trường hợp đó; panel đã thêm đoạn
   `storageCleanup.registryProtection` giải thích rõ (key mới, chưa gộp).
2. **Hai file .vcut khác nhau mà trùng tên project chung một khóa sổ
   (ghi sau thắng).** Vd: A tên "Dự án mới" dùng X; mở B cũng tên "Dự án
   mới" không dùng X → bản ghi của A bị ghi đè bằng tập của B → X mất bảo
   vệ. Đây là lỗ hổng thật theo hướng KHÔNG an toàn (ngược với đếm thừa
   tên thô). Giảm nhẹ: UI hiện tên project trong mục sổ để user nhận ra
   trùng tên; muốn hết hẳn thì phải thêm projectId ổn định vào envelope
   `.vcut.json` (đổi format file + App state + đường mở/lưu — việc lớn,
   ngoài phạm vi luồng này). Khuyến nghị user đặt tên project khác nhau
   khi lưu các file khác nhau.
3. **Lock liên tab không chặn stale giữa các lượt sync.** Lock chỉ tuần tự
   hoá từng lần sync (đọc → tính → ghi); hai tab đổi spec xen kẽ rồi sync
   sau vẫn thắng (last-writer-wins theo lượt sync). RefCount trong kho có
   thể lỗi thời giữa hai lần sync (tối đa ~1s + debounce) — lưới xóa đọc
   tươi refCount + sổ trước khi xóa nên cửa sổ này hẹp nhưng không bằng 0.
4. **Chưa đo tranh chấp lock thật giữa hai tab trình duyệt.** Lock serialize
   được đo bằng fake locks (D1/D2) và BroadcastChannel được đo headed ở
   X7 (post từ channel khác cùng tab → panel tự quét lại); hai tab thật
   cùng giữ lock / cùng mở panel chưa được click-test (cần 2 CDP target
   chung origin — chưa làm trong luồng này). Web Locks + BroadcastChannel
   đều là API chuẩn của trình duyệt nên rủi ro còn lại là nhỏ.
5. **Tên thô trùng nhau vẫn đếm thừa (cố ý, an toàn theo hướng chặn) —
   không đổi.** Hai manifest khác nội dung nhưng trùng `originalName`
   (hoặc alias trùng tên thật của manifest khác) thì một clip dùng tên đó
   đếm cho cả hai — cả hai đều bị coi là "đang dùng". Muốn hết thì phải
   đổi clip sang src `asset:` (app hiện không sinh dạng src này).
6. **Nhãn UI mới hiện là key thô cho tới khi parent gộp fragment.** 9 key
   `storageCleanup.*` mới (danh sách ở fragment) chưa có trong dict nên
   `t()` trả về chính key (panel vẫn dùng được, chỉ hiện key thay cho
   nhãn; harness headed assert theo data-testid/`data-used-by-other`/tên
   file/dung lượng, không theo nhãn mới). Parent gộp fragment vào dict ở
   cuối đợt 62 như mọi đợt. Lưu ý: fragment lần này vi ≠ en (dịch thật
   cả hai phía), khác với fragment R9 (vi == en).
7. **Kích thước file mẫu khác nhau giữa các lần chạy headed** (mau-1:
   275822 → 486080 → 508020 → 533564 byte qua các lần chạy; mau-2 tương
   tự) — file mẫu được sinh lại mỗi lần load (không phải file cố định
   trên đĩa); số đo headed là của cây + mẫu tại thời điểm chạy, không
   phải hằng số.
8. **`tsc` toàn repo hiện không xanh do luồng khác.** 1 lỗi lúc chạy cuối
   nằm trong `src/lib/bridgeErrors62R5.test.ts` (luồng R5 đợt 62 đang làm
   dở song song; lần chạy trước đó là 4 lỗi ở `nestedPreview.ts` +
   `pauseStall62R6.test.ts` — các luồng khác sửa dần). Không sửa file của
   luồng khác; `vite build` vẫn pass (build không chạm file test). Parent
   gộp nên chạy lại `tsc` sau khi các luồng đó xong.
9. **Không có sweep / dọn kho tự động** (quyết định có chủ đích, kế thừa
   Q7 §1.1 + R9 §5.9) — đừng ai thêm sweep theo project hiện tại mà tưởng
   là an toàn; sổ tham chiếu giảm rủi ro chứ không biến sweep thành an
   toàn (project chưa ghi sổ vẫn lọt, xem §6.1).

## 7. Môi trường chạy

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1248`
  (headed qua Xvfb display riêng `:174`, 1440×900; X6 đổi metrics
  390×844 mobile:true).
- Vite dev cổng 5620, CDP debug 9720, TMPDIR `/tmp/round62-r7/tmp`.
- Lệnh chạy (từ gốc repo):
  `node apps/web/src/lib/projectAssetRefs62R7.test.ts` — exit 0 khi 28/28 pass.
  `node apps/web/scripts/clicktest-62r7-idb-xproject.mjs`
  — exit 0 khi 9/9 pass, 1 khi có FAIL, 2 khi harness lỗi.
- Test Node chạy trực tiếp (type-stripping); test store chạy bằng
  esbuild bundle `--format=cjs` + outfile `.cjs` (mẫu Q7/54K2).
