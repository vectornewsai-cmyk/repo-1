# Phase 9 — Đợt 61, luồng R9: UI dọn kho IndexedDB + refCount thật — LIMITS

Ngày: 08/11/2026 (lượt cron 03:35 +07). Phạm vi: đóng nợ đợt 60 §5.9
(Q7 IDB orphan bytes: bytes mồ côi từ TRƯỚC đợt 60 vẫn ở lại kho + `refCount`
của AssetStore chưa được duy trì). KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| (a) UI dọn kho | **Đã triển khai + kiểm chứng.** Panel "Dọn kho" trong MediaBin liệt kê MỌI asset trong IndexedDB kèm dung lượng từng mục; mục đang được project hiện tại dùng bị khóa không cho chọn; mục "có thể mồ côi" chỉ xóa khi user tick chọn + xác nhận; xóa thật qua AssetStore (manifest + blob). Headed 7/7: mục mồ côi 4321 byte ghi thẳng bằng IDB thô đã bị xóa thật, mau-1/mau-2 còn nguyên, reload không hồi lại. |
| (b) refCount thật | **Đã triển khai + kiểm chứng.** `syncAssetRefCounts` tái tính từ spec + bin hiện tại (bin item +1, clip `asset:` +1/clip, clip tên thô khớp originalName/alias +1/clip, không âm); gọi ở effect debounce App.tsx, `importFiles`, `removeMediaFromBin` (mọi nhánh xóa), đầu mỗi lần quét. Đỏ-trước: script `/tmp/red-before-61r9.mjs` trên code cũ — `remove()` trả true và xóa bytes dù clip còn tham chiếu (refCount luôn 0). Xanh-sau: test D1 — sau sync, `remove()` từ chối khi còn clip, chỉ xóa khi hết tham chiếu. |
| Test | Lib mới 16/16; store mới 4/4; headed mới 7/7; hồi quy Q7 17/17 + store 6/6 + rehydrate 27/27 + projectRepo 10/10 + binPersist59P1 17/17 + assetStore 27/27; vite build pass 23,80 s. |
| tsc | **File của luồng này 0 lỗi.** `tsc` toàn repo hiện có 4 lỗi — TẤT CẢ nằm trong file của luồng khác đợt 61 đang làm dở (`src/lib/cssClasses61R4.test.ts` 1 lỗi, `src/lib/gopTrialDecode61R7.test.ts` 1 lỗi, `src/preview.tsx` 2 lỗi); không sửa file của luồng khác. |

## 1. Thiết kế (a): UI dọn kho — liệt kê + chọn xóa, không tự xóa

### 1.1 Tuân thủ quyết định sweep của Q7 (§1.1 LIMITS Q7)

Q7 đã bác sweep định kỳ theo project hiện tại vì AssetStore là kho toàn
cục theo trình duyệt: sweep đó sẽ xóa nhầm bytes mà project KHÁC (file
.vcut khác) còn tham chiếu, và không có sổ nào ghi project nào dùng asset
nào. UI mới tuân thủ đúng quyết định đó bằng cách:

- **Không sweep, không tự xóa bất cứ thứ gì.** Panel chỉ LIỆT KÊ.
- Trạng thái `inUse = false` chỉ có nghĩa là "project HIỆN TẠI không tham
  chiếu" — panel in cảnh báo liên project ngay đầu (`storageCleanup.
  crossProjectWarning`): kho dùng chung cho mọi project, một file .vcut
  khác vẫn có thể đang dùng chung bytes; chỉ xóa mục chắc chắn không còn
  cần ở bất kỳ project nào; đã xóa thì không hoàn tác, muốn lấy lại phải
  import lại file gốc.
- Chỉ xóa khi user tick chọn TỪNG mục (hoặc "chọn tất cả mục mồ côi") +
  bấm xóa + xác nhận qua `window.confirm` (hiện số mục + tổng bytes).
- Mục đang được project hiện tại dùng (`inUse = true`) thì checkbox bị
  khóa cứng — không chọn được dù user muốn.
- Trước khi xóa từng mục, `deleteCleanupAsset` đọc TƯƠI manifest và từ
  chối khi `refCount > 0` (kể cả tham chiếu xuất hiện SAU lần quét); lưới
  thứ hai: `AssetStore.remove` tự nó cũng từ chối khi `refCount > 0`.

### 1.2 Luồng dữ liệu

```
MediaBin bấm "Dọn kho" → StorageCleanupPanel mở
  ├─ scanStorageForCleanup(new AssetStore(), spec, media)
  │   ├─ syncAssetRefCounts trước (refCount tươi, xem §2)
  │   └─ list() mọi manifest → hàng {tên, size, refCount, binItems, clips, inUse}
  │       (mồ côi lên đầu, rồi theo size giảm dần)
  ├─ user tick chọn mục mồ côi → window.confirm (số mục + bytes)
  └─ deleteCleanupAssets → từng mục: get tươi → refCount>0 thì skip,
      không thì remove() → quét lại danh sách (giữ dòng kết quả) + toast
```

### 1.3 Bug thật bắt được ở lần chạy headed đầu (đã sửa)

Lần chạy headed đầu: R4 FAIL — xóa xong nhưng dòng kết quả biến mất
(`hasResult=false`) vì `deleteSelected` gọi `runScan()` mà `runScan`
luôn `setResult(null)` đầu hàm. Đây là bug UI thật (user bấm xóa xong
không thấy mình vừa xóa bao nhiêu). Sửa: `runScan({ keepResult: true })`
khi quét lại sau xóa; quét tay (nút Quét lại / mở panel) vẫn xóa kết quả
cũ. Chạy lại: headed 7/7.

## 2. Thiết kế (b): refCount thật

### 2.1 Luật đếm (`computeRefCounts`, thuần — `idbCleanup61R9.ts`)

- Bin item mang `assetId`: +1/item (bin giữ một tham chiếu — khớp chặn
  dedup "giữ bytes cho item kia" của Q7; hai item chung assetId → 2).
- Clip có src `asset:<id>`: +1/clip, kể cả trùng src (cùng luật đếm của Q7).
- Clip có src tên thô khớp `originalName` hoặc alias của manifest: +1/clip
  cho MỖI manifest khớp tên. Một tên khớp nhiều manifest (hai file khác
  nội dung, trùng tên) thì đếm cho cả hai — đếm thừa chỉ chặn xóa nhầm,
  không bao giờ xóa nhầm (an toàn theo hướng chặn).
- Quét cả nested (canonical `subSpec.tracks` / legacy `tracks`, chống vòng
  lặp, sâu tối đa 64 — cùng quy ước binOrphan60Q7.ts).
- Không âm: clamp ≥ 0 ở `AssetStore.setRefCount`.

### 2.2 Đồng bộ là tái tính toàn bộ (reconcile), không tăng/giảm từng bước

`syncAssetRefCounts` tính lại từ spec + bin hiện tại rồi ghi đè (chỉ ghi
khi khác). Nhờ đó MỌI đường đổi spec/bin đều được phủ mà không cần móc
vào từng action của store (thêm/xóa clip, undo/redo, mở file, load
sample, relink, xóa khỏi bin). Điểm gọi:

1. **Effect debounce 1s ở App.tsx** (mọi thay đổi spec/media) + 1 lần sau
   mount 1,5s (refCount cũ từ phiên trước được tính lại). Chỉ ghi
   IndexedDB, không chạm zustand → không tạo vòng lặp. Best-effort, lỗi
   kho tự nuốt.
2. **`importFiles`** (sau khi assetId đã ghi lên item): item mới vào bin
   là một tham chiếu.
3. **`removeMediaFromBin`** — LUÔN sync sau mỗi lần xóa khỏi bin, kể cả
   nhánh keep-bytes: xóa 1 trong 2 item chung assetId thì refCount phải
   giảm 2 → 1 (phát hiện trong lúc viết test R2: bản đầu chỉ sync ở
   nhánh delete-bytes nên nhánh này không cập nhật — đã sửa thành sync
   chung rồi mới rẽ nhánh xóa bytes). Nhánh delete-bytes thì cổng thêm:
   chỉ xóa bytes khi refCount tươi == 0.
4. **Đầu mỗi lần quét** ở UI dọn kho (số liệu tươi ngay cả khi effect
   debounce chưa kịp chạy).

`addRef`/`releaseRef` giữ nguyên cho đường tăng/giảm từng bước (nếu luồng
sau cần), nhưng nguồn thật là lần đồng bộ.

## 3. Kiểm chứng (số thật)

### 3.1 Đỏ-trước (bug tái hiện trên code cũ)

Script `/tmp/red-before-61r9.mjs` (không stage — ngoài repo): ingest 1
asset bằng AssetStore thật + FakeIDB, spec giả lập có 1 clip dùng src
`asset:<id>`, gọi `remove()` trên code CHƯA sửa → `remove()` trả **true**,
`getBlob` null — xóa bytes dù clip còn tham chiếu (refCount lúc ingest =
0, không ai duy trì). Exit 1 (đỏ). Đây là đúng bug LIMITS 60 Q7 §5.5 mô tả.

### 3.2 Test lib mới `apps/web/src/lib/idbCleanup61R9.test.ts` — 16/16

Chạy: `node apps/web/src/lib/idbCleanup61R9.test.ts` (~1,5 s).

- compute (5): bin item +1 / 2 item chung assetId → 2; clip `asset:` đếm
  theo clip (2 ngoài + 1 nested = 3); tên thô khớp originalName/alias
  (2 clip) / tên lạ → 0; một tên khớp 2 manifest → đếm cả hai; rỗng → map rỗng.
- setRefCount (1): ghi 3 → 3; clamp -5 → 0; asset lạ → null.
- sync (3): clip (tên) + bin item đều tăng (A=1 clip, B=1 bin, updated=2);
  clip rời spec → A về 0, B giữ 1; item rời bin → 0, sync lại updated=0.
- cổng remove() (2): D1 — đúng kịch bản đỏ-trước: sau sync refCount=1,
  `remove()` trả false, bytes còn; clip rời + sync → 0, `remove()` trả
  true, blob + manifest hết thật. D2 — addRef ×2 rồi releaseRef ×5 → 0
  (không âm).
- scan (1): 3 asset, tổng bytes đúng, 1 mồ côi lên đầu (refCount 0), A có
  1 clip, B có 1 bin item.
- delete (4): còn dùng → từ chối in-use, bytes còn; mồ côi → xóa thật,
  freedBytes = size; asset lạ → not-found; batch hỗn hợp [dùng, mồ côi,
  lạ] → xóa 1, bỏ qua 2, freedBytes đúng.

### 3.3 Test store mới `apps/web/src/store.idbCleanup61R9.test.ts` — 4/4

Chạy bằng esbuild bundle `--format=cjs` + `.cjs` (mẫu Q7, ~2,4 s).

- R1: xóa bin-only có assetId → ok, bytes biến mất khỏi IDB (poll <3s),
  VÀ refCount của asset còn lại trong bin thành **1** (sync chạy trong
  đường xóa — trước đợt này kẹt 0).
- R2: 2 item chung assetId → xóa 1 được, bytes giữ cho item kia, refCount
  về **1** (chứng minh sync chạy cả nhánh keep-bytes).
- R3/R4: clip dùng theo tên / qua src `asset:` → chặn, bytes còn (hồi quy Q7 S2/S3).

### 3.4 Headed `apps/web/scripts/clicktest-61r9-idb-cleanup-ui.mjs` — 7/7

Chạy: `node apps/web/scripts/clicktest-61r9-idb-cleanup-ui.mjs` (vite dev
HMR tắt + Chromium headed qua Xvfb display :173 + CDP, profile mới tinh;
cổng dev 5610/debug 9710 tự chọn). Exit 0 khi 7/7 pass. Report JSON +
5 screenshot: `hidden_files/round61-r9/headed/`.

| Case | Kết quả đo (lượt chạy cuối, 08/11 ~03:58 +07) |
|---|---|
| R0 setup | Mẫu tự load 3 clip; bin 2 item mau-1/mau-2.webm (file thật 269744/310996 byte — kích thước mẫu khác nhau giữa các lần chạy do file mẫu được sinh lại, xem §5.7); autosave binMedia 2 entry; IDB thật: manifests 2 + blobKeys 2, refCount cả hai đã = 2 (bin item + clip) |
| R1 tạo mồ côi | Ghi thẳng manifest + blob `cu-xoa-truoc.webm` 4321 byte, refCount 0 bằng API IDB thô → IDB 3 manifest + 3 blob |
| R2 mở panel | Bấm nút "Dọn kho" thật; panel liệt kê 3 hàng: mồ côi (4,2 KB, checkbox mở), mau-1/mau-2 đang dùng (checkbox khóa); nút xóa đang disabled khi chưa chọn |
| R3 refCount | Đọc IDB thật sau quét: mau-1 = 2, mau-2 = 2, mồ côi = 0 |
| R4 xóa thật | Tick checkbox mồ côi + bấm xóa thật (confirm tự accept) → IDB hết manifest + blob của mục đó; mau-1/mau-2 còn nguyên manifest + blob; panel quét lại còn 2 hàng; bin vẫn 2 item |
| R5 reload | Reload 5408 ms; boot ổn định; bin vẫn 2, timeline 3 clip, missing null; IDB sau reload vẫn không có manifest/blob của mục mồ côi |
| H9 0 lỗi trang | Không có window.onerror/unhandledrejection qua 1 lần reload |

### 3.5 Hồi quy + build (chạy lại độc lập sau khi sửa)

- `tsc` apps/web: file của luồng này **0 lỗi**; toàn repo có 4 lỗi nằm
  trong file của luồng khác đợt 61 (xem §0/§5.6).
- `vite build` apps/web: **pass, 23,80 s** (cảnh báo chunk >500 kB có sẵn).
- Test chạy lại bằng `node` trực tiếp: idbCleanup61R9 16/16,
  binOrphan60Q7 17/17, rehydrate36S5 27/27, projectRepo 10/10,
  binPersist59P1 17/17, assetStore 27/27.
- Test chạy bằng esbuild bundle: store.idbCleanup61R9 4/4,
  store.binOrphan60Q7 6/6.
- Không chạy lại: các suite headed/test của luồng khác trong đợt 61
  (đang chạy song song) — chỉ đối chiếu LIMITS của chúng ở bước gộp.

## 4. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/idbCleanup61R9.ts` | Mới | `computeRefCounts`, `syncAssetRefCounts`, `scanStorageForCleanup`, `deleteCleanupAsset(s)`; tự chứa, không import value từ file anh em |
| `apps/web/src/lib/idbCleanup61R9.test.ts` | Mới | Test Node 16/16 (compute + setRefCount + sync + cổng remove + scan + delete) |
| `apps/web/src/store.idbCleanup61R9.test.ts` | Mới | Test store thật 4/4 qua esbuild bundle |
| `apps/web/src/lib/assetStore.ts` | Sửa | `setRefCount` (ghi đè, clamp ≥ 0) + cập nhật doc comment field `refCount` |
| `apps/web/src/store.ts` | Sửa | `removeMediaFromBin`: luôn sync refCount sau xóa + cổng xóa bytes bằng refCount tươi; `importFiles`: sync sau khi assetId ghi lên item |
| `apps/web/src/App.tsx` | Sửa | Effect debounce 1s đồng bộ refCount mỗi khi spec/media đổi + 1 lần sau mount |
| `apps/web/src/MediaBin.tsx` | Sửa | Nút "Dọn kho" + mount `StorageCleanupPanel` |
| `apps/web/src/components/StorageCleanupPanel.tsx` | Mới | Panel dọn kho: quét, liệt kê, chọn xóa có xác nhận, giữ dòng kết quả sau xóa |
| `apps/web/scripts/clicktest-61r9-idb-cleanup-ui.mjs` | Mới | Harness headed R0–R5 + H9 (7/7) |
| `apps/web/tsconfig.json` | Sửa | Thêm exclude 2 file test mới |
| `docs/PHASE9_ROUND61_R9_IDB_CLEANUP_UI_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): fragment i18n 18 key
`hidden_files/round61-r9-fragment.json` (vi == en, cùng tập key —
parent gộp vào dict ở cuối đợt 61, theo quy định luồng không sửa trực
tiếp vi.json/en.json); evidence headed `hidden_files/round61-r9/headed/`
(report JSON, vite/chrome log, 5 screenshot); script đỏ-trước
`/tmp/red-before-61r9.mjs`.

Stage: `paths-loop/phase9-round61-r9-idb-cleanup-ui.txt` — 11 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.

## 5. Nợ mở / giới hạn (trung thực)

1. **Xóa bytes ở project này vẫn có thể ảnh hưởng file .vcut khác dùng
   chung bytes.** refCount chỉ đếm được tham chiếu trong project HIỆN
   TẠI (spec + bin mà app đang mở) — kho là toàn cục và không có sổ tham
   chiếu liên project. UI dọn kho đã cảnh báo rõ + chỉ xóa theo lựa chọn
   + xác nhận của user, nhưng rủi ro này không thể triệt tiêu bằng code
   trong app hiện tại: muốn chặn chắc thì cần sổ tham chiếu liên project
   (vd: mỗi lần mở/lưu .vcut ghi lại assetId nó dùng — việc lớn, ngoài
   phạm vi luồng này). Khôi phục bằng cách import lại file gốc (dedup
   theo hash nên không nhân đôi bytes).
2. **refCount chỉ đúng trong một tab tại một thời điểm.** Hai tab cùng
   origin cùng sync có thể đua đọc-ghi (giới hạn đã có từ `bumpRef` —
   `setRefCount` không dùng hàng đợi alias/lock liên tab; sync chỉ ghi
   khi khác giá trị cũ nên cửa sổ đua nhỏ nhưng không phải bằng 0).
   `remove()` từ chối theo refCount đọc được lúc đó — tab khác thêm
   tham chiếu đúng lúc xóa vẫn có thể lọt (cùng lớp rủi ro với §1).
3. **Tên thô trùng nhau vẫn đếm thừa (cố ý, an toàn theo hướng chặn).**
   Hai manifest khác nội dung nhưng trùng `originalName` (hoặc alias
   trùng tên thật của manifest khác) thì một clip dùng tên đó đếm cho
   cả hai — cả hai đều bị coi là "đang dùng" và không xóa được khỏi UI
   dọn kho. Đây là cùng sự nhập nhằng mà `findMissingAssets` đã có;
   muốn hết thì phải đổi clip sang src `asset:` (app hiện không sinh
   dạng src này).
4. **Nhãn UI hiện là key thô cho tới khi parent gộp fragment.** 18 key
   `storageCleanup.*` (vi == en) nằm ở
   `hidden_files/round61-r9-fragment.json`, chưa có trong dict nên `t()`
   trả về chính key (panel vẫn dùng được, chỉ hiện key thay cho nhãn;
   harness headed assert theo data-testid/tên file/dung lượng, không
   theo nhãn). Parent gộp fragment vào dict ở cuối đợt 61 như mọi đợt.
5. **Cửa sổ nhỏ giữa xóa bytes và ghi lại manifest (kế thừa Q7 §1.4,
   không đổi):** xóa khỏi bin vẫn fire-and-forget, manifest bin trong
   autosave chỉ ghi lại sau debounce 5s. Reload đúng trong cửa sổ đó thì
   item vắng khỏi bin (đúng ý user). Riêng đường xóa trong UI dọn kho:
   xóa bytes KHÔNG chạm bin nên không có cửa sổ này — manifest bin không
   đổi, chỉ kho nhẹ đi.
6. **`tsc` toàn repo hiện không xanh do luồng khác.** 4 lỗi đều nằm trong
   `src/lib/cssClasses61R4.test.ts` (1), `src/lib/gopTrialDecode61R7.test.ts`
   (1) và `src/preview.tsx` (2) — file của luồng khác đợt 61 đang làm dở
   song song. Không sửa file của luồng khác; `vite build` vẫn pass (build
   không chạm file test). Parent gộp nên chạy lại `tsc` sau khi các luồng
   đó xong.
7. **Kích thước file mẫu khác nhau giữa các lần chạy headed** (mau-1:
   173710 → 251751 → 269744 byte qua 3 lần chạy; mau-2 tương tự) — file
   mẫu được sinh lại mỗi lần load (không phải file cố định trên đĩa);
   số đo headed là của cây + mẫu tại thời điểm chạy, không phải hằng số.
8. **Chưa có test headed cho nút "Chọn tất cả mục mồ côi"** (chỉ có
   tick từng mục ở R4) và chưa đo headed ở locale en / viewport nhỏ —
   logic chọn-tất-cả là một dòng `setSelected(new Set(...))` đã phủ bằng
   test lib cho `deleteCleanupAssets` batch, nhưng đường bấm nút chưa
   được click-test.
9. **Không có sweep / dọn kho tự động** (quyết định có chủ đích, kế thừa
   Q7 §1.1 + §1.1 ở trên) — đừng ai thêm sweep theo project hiện tại mà
   tưởng là an toàn.

## 6. Môi trường chạy

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1248`
  (headed qua Xvfb display riêng `:173`, 1440×900).
- Vite dev cổng 5610, CDP debug 9710, TMPDIR `/tmp/round61-r9/tmp`.
- Lệnh chạy (từ gốc repo):
  `node apps/web/scripts/clicktest-61r9-idb-cleanup-ui.mjs`
  — exit 0 khi 7/7 pass, 1 khi có FAIL, 2 khi harness lỗi.
- Test Node chạy trực tiếp (type-stripping); test store chạy bằng
  esbuild bundle `--format=cjs` + outfile `.cjs` (mẫu Q7/54K2).
