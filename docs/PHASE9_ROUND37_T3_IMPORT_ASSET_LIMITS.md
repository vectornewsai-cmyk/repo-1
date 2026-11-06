# Phase 9 đợt 37, luồng T3 — Ingest cho importFiles + rehydrate cho đường mở file .vcut.json

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo. Đóng nợ §5 của
> `docs/PHASE9_ROUND36_S5_REHYDRATE_LIMITS.md`: (a) media user import
> trong phiên cũ vẫn hiện Relink vì bytes chưa từng ingest — đường
> importFiles chưa ingest; (b) mở file `.vcut.json` có src `asset:`
> chưa nối rehydrate (mới nối đường autosave ở đợt 36 S5).
>
> Kết quả kiểm chứng đầy đủ: unit test 8/8 (file test mới) + probe
> trình duyệt thật `allPass = true` (6/6 check, xem §3). KHÔNG claim
> export sau reload qua bridge thật, discard hàng giờ, Safari / máy thật
> — xem §4.

## 1. Đã làm gì

### 1a. Ingest cho importFiles (store.ts)

`importFiles` nay, sau bước làm duy nhất tên và `set()` media (giữ
nguyên tính nguyên tử của bước đó), ingest từng item vào AssetStore
qua helper mới `ingestImportedItem` (module `lib/importAsset37T3.ts`):

- Meta ingest: `name` = tên ĐÃ chốt duy nhất, kèm width/height/
  duration/thumbnail đã probe được từ `fileToMediaItem` — rehydrate
  khớp tên thô theo `originalName` nên ingest trước khi chốt tên sẽ
  ghi sai tên và reload vẫn Relink oan; thứ tự này được khoá bằng test.
- Await đủ trước khi `importFiles` resolve: reload ngay sau import
  vẫn khôi phục được. Media vẫn hiện ngay từ `set()` trước đó nên
  ingest chậm không chặn UI thấy file mới.
- Best-effort tuyệt đối, theo mẫu ingest mẫu của `sample.ts`:
  IndexedDB/crypto.subtle không khả dụng, quota đầy, hay file không
  có `file` (item khôi phục từ rehydrate) → ingest bỏ qua lặng lẽ,
  import trong phiên vẫn thành công, chỉ mất bền vững — panel Relink
  sau reload báo như hành vi cũ thay vì crash lúc import.
- Cùng một đường ingest phục vụ cả import từ MediaBin lẫn nhập bản
  nén `.vcut.zip` (đường archive cũng gọi `importFiles`): media từ zip
  nay cũng bền qua reload, không chỉ có trong phiên nhập.
- Không đổi format spec, không đổi `src` clip (vẫn là tên thô):
  clip tạo từ media import vẫn trỏ `src = item.name` như trước; bước
  rehydrate của S5 khớp tên thô không cần sửa. Hướng chuyển src sang
  `asset:` là việc khác (xem §4).

### 1b. Rehydrate cho đường mở file .vcut.json (ProjectMenu.tsx)

`onFile` nay chạy đúng thứ tự như đường khôi phục autosave ở App.tsx
(đợt 36 S5): `replaceProject` → `setProjectName` → `markSaved` →
`clearAutosave` → `autosave` (debounce) → **rehydrate từ AssetStore**
→ `checkMissingMedia`. Cụ thể:

- `asset:` khớp theo assetId, tên thô khớp theo originalName (cùng
  module `rehydrate36S5` — không viết lại logic, không sửa module S5).
- Item nạp lại mang `file` thật dựng từ blob IndexedDB nên export
  sau mở file dùng được file gốc như media import gốc (chưa kiểm
  chứng end-to-end qua bridge — xem §4).
- Fail-soft y hệt đường autosave: IndexedDB bị chặn → catch → bin
  rỗng → Relink báo như hành vi cũ.
- Không phá đường autosave: khối rehydrate này chỉ chạy trong `onFile`;
  App.tsx, sample.ts, rehydrate36S5.ts, assetStore.ts, projectRepo.ts
  không đụng vào. Đường nhập bản nén không cần thêm rehydrate vì
  media đã đi kèm zip và `importFiles` nay tự ingest.

Quy ước code giữ nguyên từ S5: module mới chỉ import type từ file anh
em (không import value) để test chạy được bằng Node; `store.ts` và
`ProjectMenu.tsx` là file trình duyệt nên import value AssetStore/
rehydrate bình thường như App.tsx đã làm.

## 2. Kết quả kiểm chứng

### 2a. Unit test — 8/8, exit 0

`node apps/web/src/lib/importAsset37T3.test.ts` (fake store, không cần
trình duyệt; AssetStore thật đã có test riêng 22/22):

- ingest: meta.name = tên đã chốt duy nhất + meta probe đi kèm.
- ingest: item không có file → không gọi store, manifest null.
- ingest: store throw (giả lập IDB chặn) → null, không throw ra ngoài.
- ingest: dedup cùng bytes dưới tên khác → `nameMismatch = true`
  (khoá giới hạn đã biết ở §4, không giấu).
- mở file: spec có src `asset:` + tên thô đã ingest đều nạp lại được,
  item mang `file` thật, không failed.
- mở file: src `asset:` trong nested cũng nạp lại được (collect quét
  nested, cùng quy ước relink.ts).
- tương thích ngược: project cũ chưa ingest vẫn mở được, src rơi vào
  skipped, không crash, không bịa item.
- đối chứng âm: file thật sự mất vẫn bị `findMissingAssets` liệt kê
  khi bin rỗng, và hết thiếu khi bin đã có tên đó (rehydrate không
  che media thiếu thật).

### 2b. Hồi quy — xanh

- `rehydrate36S5.test.ts`: 19/19 (đường autosave không đổi).
- `assetStore.test.ts`: 22/22.
- `projectRepo.test.ts`: 10/10.
- `tsc --noEmit` (apps/web): exit 0, không lỗi — trước và sau đợt đều
  sạch (khác với ghi chú của S5 về reversePreviewGate.test.ts; tới
  đợt này file đó đã không còn lỗi trong cây hiện tại).

### 2c. Probe trình duyệt thật — allPass = true (6/6)

`apps/web/scripts/probe-round37-t3-import-asset-pipe.mjs`, bundle probe
build riêng ra `/tmp/vcut-t3-dist` (KHÔNG build đè dist của repo;
bundle `assets/index-DAv1Inp2.js`), Chrome headless-new (Playwright
chromium-1248), cổng 4297, profile mới. Kết quả:
`benchmarks/results/v37-t3-import-asset.json` (allPass = true).

- Pha A (import → reload): import PNG `t3-test.png` qua input MediaBin
  (CDP setFileInputFiles), thêm clip vào timeline, autosave chứa clip.
  IndexedDB đọc trực tiếp thấy manifest `originalName = t3-test.png`,
  `assetId = a_c414cd0e204de974`. Sau reload: panel Relink VẮNG,
  media bin chứa `t3-test.png`.
- Pha C (mở file `asset:`): file `.vcut.json` dựng từ autosave với 1
  clip đổi src sang `asset:a_c414cd0e204de974`, mở qua input
  ProjectMenu → panel Relink VẮNG, media bin chứa item
  `asset:a_c414cd0e204de974` (tên item nạp lại = src, đúng quy ước
  rehydrate của S5).
- Pha B (đối chứng âm): sửa autosave đổi clip `asset:` thành
  `file-that-does-not-exist-xyz.mp4` → reload → panel Relink HIỆN và
  liệt kê đúng tên đó (`Media thiếu (1)`, `Video · dùng trong 1 clip`).

Lỗi gặp trong lúc probe (đã sửa, là lỗi probe không phải lỗi app):
lần 1 dùng `await` ở top-level trong `Runtime.evaluate` → bọc lại
thành async IIFE; lần 2 đọc autosave khi key còn trống vì `onFile`
gọi `clearAutosave()` rồi `autosave()` debounce 5s → probe nay chờ
autosave mới chứa `asset:` rồi mới sửa. Ghi chú thêm: chú thích
trong `onFile` nói autosave "ghi ngay" nhưng thực tế `autosave()` là
debounce 5s (chỉ `autosaveNow` mới ghi ngay) — hành vi có sẵn, ngoài
phạm vi đợt này, không sửa chú thích của luồng khác.

## 3. File đổi / thêm (chỉ file text, KHÔNG binary, KHÔNG push)

Mới:

- `apps/web/src/lib/importAsset37T3.ts` — helper ingest thuần,
  best-effort, Node-testable (fake store).
- `apps/web/src/lib/importAsset37T3.test.ts` — 8 test.
- `apps/web/scripts/probe-round37-t3-import-asset-pipe.mjs` — probe
  pha A + C + B (CDP WebSocket, không cần package playwright).
- `docs/PHASE9_ROUND37_T3_IMPORT_ASSET_LIMITS.md` — file này.
- `benchmarks/results/v37-t3-import-asset.json` — kết quả probe
  (allPass = true).

Sửa (giữ tối thiểu để khỏi đụng luồng khác trong đợt 37):

- `apps/web/src/store.ts` — `importFiles` thêm vòng ingest sau `set()`
  (không đổi logic làm duy nhất tên, không đổi action khác);
  thêm 2 import (AssetStore, ingestImportedItem).
- `apps/web/src/components/project/ProjectMenu.tsx` — `onFile` thêm
  khối rehydrate trước `checkMissingMedia` (không đổi đường lưu,
  đường archive, hay thứ tự khác); thêm 2 import.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (mẫu
  chung của mọi `.test.ts`).

Không đụng: `App.tsx`, `sample.ts`, `rehydrate36S5.ts`,
`assetStore.ts`, `projectRepo.ts`, `relink.ts`, `MediaBin.tsx`.
Bundle probe, PNG test và file `.vcut.json` dựng cho probe nằm ở
`/tmp` (vcut-t3-dist, vcut-t3-open.vcut.json), không vào repo.

## 4. Cái gì chưa chứng minh + nợ còn lại

Chưa chứng minh (không claim hộ):

- **Export sau reload / sau mở file qua bridge thật:** File dựng từ
  blob là thật và đúng tên gốc, nhưng đường upload lên bridge render
  chưa được chạy thử trong probe này (bridge không chạy) — giống giới
  hạn S5 đã ghi.
- **Discard thật dưới áp lực bộ nhớ / tab ẩn hàng giờ / bfcache /
  Safari / máy thật / dpr > 1:** probe chỉ reload có chủ ý trên
  Chromium Linux, kế thừa giới hạn R6/S5.
- **File lớn:** ingest tính SHA-256 toàn file + ghi thêm một bản vào
  IndexedDB (nhân đôi dung lượng đĩa cho media đó); chưa đo thời gian
  ingest với video hàng trăm MB, chưa có UI tiến trình — import file
  lớn sẽ thấy `importFiles` resolve chậm hơn (đánh đổi để reload ngay
  sau import vẫn bền; xem §1a).
- **Quota IndexedDB bị evict giữa chừng:** manifest mất → Relink như
  cũ, không có cơ chế phục hồi.

Nợ còn lại (đúng, không phải bug mới):

- **Dedup cùng bytes, khác tên (đã khoá bằng test):** import cùng
  nội dung hai lần với tên khác nhau (`anh.png` rồi `anh (1).png`)
  → ingest lần 2 trả về manifest cũ mang `originalName = anh.png`
  → rehydrate khớp tên thô không cứu được `anh (1).png` sau reload
  → clip đó hiện Relink (đúng, không im lặng sai bytes). Hướng sửa
  triệt để: chuyển src clip sang `asset:` lúc tạo clip (chạm
  addMediaToTrack / export / render mapping) — ngoài phạm vi đợt này.
  Trường hợp thường gặp (mỗi file một tên, nội dung khác nhau) không
  vướng.
- **Đường relink tay chưa ingest:** `relinkMedia` (RelinkPanel) tạo
  item từ file user chọn nhưng chưa gọi ingest — media relink xong
  vẫn mất sau reload tiếp theo, cùng một bug class. Nên nối ingest
  vào `relinkMedia` ở đợt sau (cùng helper `ingestImportedItem`, chỉ
  cần gọi sau khi tên relink đã chốt).
- **Project mẫu cũ / project cũ chưa ingest:** bytes chưa từng ingest
  thì AssetStore trống → reload vẫn Relink một lần như trước (tương
  thích ngược đã test: mở được, không crash, báo thiếu đúng).
- **Clip `blob:` trong spec cũ:** URL phiên đã chết vĩnh viễn, không
  cứu được bằng cơ chế nào (chỉ relink tay) — như S5 đã ghi.
- **Đường mở file từ máy khác:** manifest chỉ sống ở IndexedDB máy
  đã ingest; file `.vcut.json` mang src `asset:` mở ở máy khác vẫn
  Relink — muốn mang đi máy khác phải dùng bản nén `.vcut.zip`
  (đường archive, nay đã ingest nên bền ở máy nhập).
