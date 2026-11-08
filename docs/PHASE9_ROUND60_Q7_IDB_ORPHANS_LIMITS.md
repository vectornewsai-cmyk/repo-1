# Phase 9 — Đợt 60, luồng Q7: Dọn bytes IndexedDB mồ côi + race debounce replaceProject — LIMITS

Ngày: 08/11/2026 (~00:37–01:30 +07, lượt cron 00:35 +07).
Phạm vi: đóng nợ đợt 59 P1 §5.1 (race ghi đè binMedia trong cửa sổ
debounce 5s) + §5.2 (bytes media đã xóa khỏi bin vẫn mồ côi trong
IndexedDB). KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| (a) Dọn bytes IDB mồ côi | **Đã triển khai + kiểm chứng.** Xóa chủ đích khỏi bin (không còn clip nào dùng) thì bytes + manifest bị xóa khỏi IndexedDB thật; 3 chặn an toàn (theo tên đã có + src `asset:` mới + dedup chung assetId). Headed Q2/Q3: bấm ✕ thật trên mau-1 → IDB hết manifest + blob của mau-1 ngay, mau-2 còn nguyên; reload xong mau-1 không hồi lại. |
| (b) Race debounce 5s khi replaceProject | **Race thật, đã tái hiện + sửa tối thiểu.** Test C-R1 đỏ-trước trên code cũ (timer cũ ghi đè envelope mới sau 5s) và xanh-sau. Hai sửa: `autosaveNow` hủy timer debounce đang chờ; đường mở file ghi ngay + ghi lại ngay sau rehydrate kèm binMedia (không lên lịch ghi hoãn thiếu manifest nữa). |
| Test | Lib mới 17/17; store mới 6/6; headed mới 5/5; hồi quy rehydrate 27/27, projectRepo 10/10, saveToast 15/15, binPersist59P1 17/17, projectRepoRound26J5 15/15, projectRepoRound49E4 13/13, loadProject54K1 7/7, textStyle 6/6 + 6/6, relinkDedup 7/7, assetStore 27/27, importAsset 8/8, store.loadSampleDirty54K2 3/3; vite build pass 42.51s. |
| tsc | **File của luồng này 0 lỗi.** `tsc` toàn repo hiện exit 2 với 23 lỗi — TẤT CẢ nằm trong 2 file test của luồng khác đợt 60 đang làm dở (`i18nOrphans60Q4.test.ts` 20 lỗi, `gopTrialDecode60Q5.test.ts` 3 lỗi, chưa có trong tsconfig exclude); không sửa file của luồng khác, ghi lại ở §5.6. |

## 1. Thiết kế (a): dọn bytes khi xóa chủ đích khỏi bin

### 1.1 Quyết định: xóa bytes ngay lúc xóa khỏi bin, KHÔNG sweep định kỳ

Hai phương án đã cân nhắc:

- **Xóa bytes ngay khi user xóa chủ đích khỏi bin (đã chọn):** thời
  điểm xóa có đủ ngữ cảnh để quyết định an toàn (spec hiện tại + bin
  hiện tại). User đã bấm ✕ + confirm nên ý định rõ ràng.
- **Sweep định kỳ lúc mở app (ĐÃ BÁC, có lý do):** AssetStore là kho
  toàn cục theo trình duyệt, không theo project — sweep dựa trên
  project hiện tại sẽ xóa nhầm bytes mà project KHÁC (file .vcut khác)
  còn tham chiếu, và không có sổ nào ghi project nào dùng asset nào.
  Không có cách nào chứng minh "mồ côi toàn cục" từ một project duy
  nhất nên sweep là không an toàn theo thiết kế kho hiện tại.

### 1.2 Ba chặn an toàn (quyết định thuần `planOrphanBytesDeletion`)

`removeMediaFromBin` (store.ts) giữ nguyên chặn theo tên đã có
(59P1: `findMissingAssets` quét theo tên, kể cả nested) rồi hỏi plan
mới; plan bổ sung hai chặn mà chặn theo tên không thấy:

1. **Có `assetId` không** — item chưa ingest (không có bytes trong
   IDB) thì không có gì để dọn → chỉ xóa khỏi bin.
2. **Còn clip dùng asset qua src `asset:<id>` không** → CHẶN LUÔN
   việc xóa khỏi bin (trả cùng toast `store.toastMediaInUse` kèm số
   clip). Lý do: file .vcut có thể mang src `asset:` (format hỗ trợ,
   `planRehydrate` khớp nó, app không sinh ra nhưng vẫn mở được);
   chặn theo tên không thấy dạng src này — xóa bytes lúc đó sẽ làm
   clip thành "missing" thật. Quét cả nested, đếm theo CLIP (không
   khử trùng theo src: 2 clip cùng trỏ một asset đếm là 2 — test
   bắt được bug này ở lần chạy đầu, xem §3.1).
3. **Còn item khác trong bin dùng chung `assetId` không** (dedup:
   cùng bytes import dưới hai tên khác nhau chỉ có một manifest/blob)
   → chỉ xóa khỏi bin, GIỮ bytes cho item kia.

Lưới an toàn cuối: `AssetStore.remove` tự từ chối khi `refCount > 0`
(hiện refCount luôn 0 vì chưa có code nào duy trì addRef/releaseRef —
xem §5.5). Xóa bytes là fire-and-forget best-effort
(`deleteOrphanBinBytes` không bao giờ throw; `new AssetStore()` ném
khi IndexedDB không khả dụng cũng được bắt) để không bao giờ làm hỏng
thao tác xóa khỏi bin.

### 1.3 Luồng dữ liệu

```
MediaBin bấm ✕ → confirm → store.removeMediaFromBin(id)
  ├─ chặn theo tên (cũ, findMissingAssets) → từ chối + toast
  ├─ planOrphanBytesDeletion (mới)
  │   ├─ block-removal (clip dùng asset:) → từ chối + toast
  │   ├─ keep-bytes (no-asset-id / shared) → chỉ xóa khỏi bin
  │   └─ delete-bytes → xóa khỏi bin + fire-and-forget AssetStore.remove(assetId)
  └─ effect App.tsx (media đổi) → autosave debounce 5s ghi binMedia mới (không còn entry)
        → reload: rehydrate không thấy entry → item không hồi lại
```

### 1.4 Cửa sổ nhỏ còn lại (trung thực)

Xóa bytes là fire-and-forget (vài ms) còn manifest bin trong autosave
chỉ được ghi lại sau debounce 5s. Reload đúng trong cửa sổ đó (bytes
đã xóa, manifest còn liệt kê item) thì rehydrate thấy entry bin nhưng
không lấy được blob → entry rơi vào `skippedBin`, item vắng khỏi bin.
Đây là ĐÚNG ý user đã xóa (không hiện panel Relink vì không clip nào
dùng nó), chỉ là item biến mất sớm hơn manifest — không mất dữ liệu
clip nào. Không sửa bằng cách ghi autosave ngay trong
`removeMediaFromBin` (ngoài phạm vi tối thiểu của luồng này; debounce
5s là thiết kế đã chấp nhận từ 59P1).

## 2. Điều tra + sửa (b): race debounce 5s

### 2.1 Race thật — hai mặt

**Mặt 1 (tái hiện bằng test C-R1, đỏ-trước):** `autosave()` chụp
payload lúc lên lịch; `autosaveNow()` ghi ngay sau đó KHÔNG hủy timer
đang chờ. Timer cũ bắn sau 5s và ghi đè envelope mới bằng payload cũ.
Đường gặp trong app: user đổi spec (timer lên lịch) rồi bấm "Sửa" ở
LoadReportPanel (`afterFix` gọi `autosaveNow`) hoặc `loadAutosave`
ghi lại O6 — reload đúng trong cửa sổ sẽ thấy spec/binMedia cũ (mất
bản sửa, mất manifest bin mới). Đo thật trên code cũ: sau
`autosave("Du an A")` + `autosaveNow("Du an B", binMedia)` rồi chờ
5.6s, envelope quay về `"Du an A"` không binMedia — FAIL đúng như dự
đoán, rồi PASS sau fix.

**Mặt 2 (cửa sổ pattern cũ, test C-R2 khóa lại):** `openProjectFileFlow`
gọi `autosave(spec, name)` KHÔNG kèm binMedia TRƯỚC khi rehydrate
chạy xong. Rehydrate chậm hơn 5s → lần ghi hoãn đó đáp xuống trước,
effect sau restore mới ghi lại đúng — reload trong cửa sổ ~5s đó thấy
envelope thiếu binMedia (media bin-only vắng 1 lần reload rồi tự hồi
ở autosave sau — như LIMITS 59P1 §5.1 đã mô tả; lần này đo được cửa
sổ bằng timer thật: 0.3s sau khi lên lịch ghi corrective, envelope
vẫn thiếu binMedia).

### 2.2 Sửa tối thiểu (2 chỗ, không đổi chữ ký API nào)

1. **`projectRepo.ts` — `autosaveNow` hủy timer debounce đang chờ.**
   Lần ghi ngay luôn mới hơn mọi lần ghi hoãn đang chờ (payload của
   timer chụp từ lúc lên lịch) nên hủy là an toàn. Đường gọi duy nhất
   tự hủy là chính callback của timer (đã đặt `autosaveTimer = null`
   trước khi gọi tới đây) nên không có đệ quy/hủy nhầm. Mọi call site
   `autosaveNow` hiện có đều ghi trạng thái hiện tại mới hơn timer
   (afterFix, ghi lại O6 trong loadAutosave, mở file mới) — không có
   call site nào trông chờ timer cũ vẫn bắn sau.
2. **`openProjectFlow.ts` — đường mở file không lên lịch ghi hoãn
   thiếu manifest nữa.** Thay `autosave(res.spec, res.name)` bằng
   `autosaveNow(res.spec, res.name)` ngay sau `clearAutosave()` (ghi
   ngay để reload trong lúc rehydrate vẫn khôi phục đúng spec; bin
   fallback theo spec — đúng với file vừa mở vì bin lúc đó chỉ có
   media trong spec) + `autosaveNow(..., binMediaFromMedia(media))`
   ngay sau `await rehydrateAfterOpen(...)` (manifest đúng ngay, không
   chờ thêm một chu kỳ debounce). Đường archive đã kèm binMedia nên
   không đổi. Đường khôi phục autosave ở App.tsx không có lần ghi
   hoãn thiếu binMedia nào (subscribe effect đăng ký sau init effect)
   nên không đổi.

## 3. Kiểm chứng (số thật)

### 3.1 Test Node mới `apps/web/src/lib/binOrphan60Q7.test.ts` — 17/17

Chạy: `node apps/web/src/lib/binOrphan60Q7.test.ts` (~19s, chủ yếu 3
test timer thật 5.6s mỗi cái). Đỏ-trước: chạy trên code chưa sửa,
C-R1 FAIL (`envelope sau 5s vẫn là bản mới — nhận "Du an A", muốn
"Du an B"`) và 1 test plan FAIL (đếm clip trong nested nhận 1, muốn
2 — do `collectClipSrcs` khử trùng theo src; đã sửa bằng cách đếm
theo clip qua `countClipsWithSrc`, test sau đó xanh).

- plan (10): delete-bytes đúng assetId; không assetId / assetId rỗng
  → keep-bytes; clip dùng `asset:` cấp cao → block-removal đếm 1;
  clip dùng `asset:` trong nested → block-removal đếm 2; clip dùng
  `asset:` khác → không chặn nhầm; 2 item chung assetId → keep-bytes
  shared; mediaId lạ → not-found; clip dùng tên thô không bị plan
  chặn (chặn theo tên nằm ở store); collectClipSrcs quét đủ + khử trùng.
- bytes thật qua AssetStore + FakeIDB (4): ingest → xóa → getBlob/
  get/list/stats đều hết + instance mới trên cùng factory (mô phỏng
  reload) vẫn hết; xóa 1 trong 2 asset → asset còn lại nguyên vẹn
  (blob 14 byte `"bytes-hai-khac"` đủ, manifest + stats 1 asset); xóa
  asset không tồn tại → false; store ném lỗi → false, không throw.
- race timer thật (3): C-R1 envelope mới thắng sau 5s; C-R2 pattern cũ
  để lại cửa sổ thiếu binMedia ~5s (khóa hành vi cửa sổ, PASS cả
  trước/sau fix — ghi lại để khỏi ai tái dùng pattern đó); C-R3 dãy
  mới (autosaveNow × 2) không timer chờ nào ghi đè sau 5s.

### 3.2 Test store mới `apps/web/src/store.binOrphan60Q7.test.ts` — 6/6

Chạy bằng esbuild bundle `--format=cjs` + `.cjs` (mẫu 54K2):
`node_modules/.bin/esbuild apps/web/src/store.binOrphan60Q7.test.ts
--bundle --platform=node --format=cjs --outfile=/tmp/store.binOrphan60Q7.test.cjs
&& node /tmp/store.binOrphan60Q7.test.cjs` (~2.6s). Store thật +
AssetStore thật + FakeIDB cài lên globalThis (đường `new
AssetStore()` trong `removeMediaFromBin` dùng đúng fake này).

- S1: xóa bin-only có assetId → ok:true, bin hết item, bytes biến mất
  khỏi IDB (poll instance mới `getBlob` → null, `get` → null, `list`
  rỗng).
- S2: clip dùng theo tên → chặn (ok:false, có message), item + bytes còn.
- S3: clip dùng qua src `asset:` → chặn (ok:false), item + bytes còn.
- S4: 2 item chung assetId → xóa 1 được, item kia còn trong bin, bytes
  còn (getBlob + get đều non-null sau 300ms).
- S5: item không assetId → xóa được, không crash, IDB vẫn 0 asset.
- S6: `binMediaFromMedia` sau xóa chỉ còn entry của item chưa xóa.

### 3.3 Headed `apps/web/scripts/clicktest-60q7-idb-orphans.mjs` — 5/5

Chạy: `node apps/web/scripts/clicktest-60q7-idb-orphans.mjs`
(vite dev HMR tắt + Chromium headed qua Xvfb display :172 +
CDP, profile mới tinh; cổng dev 5590/debug 9690 tự chọn). Exit 0 khi
5/5 pass. Report JSON + 4 screenshot:
`hidden_files/round60-q7/headed/`.

| Case | Kết quả đo |
|---|---|
| Q0 setup | Mẫu tự load 3 clip; bin 2 item mau-1/mau-2.webm (file thật 311697/313048 byte, blob: URL); autosave binMedia 2 entry; IDB thật: manifests 2 + blobKeys 2 (`a_94c9316dfa334dce`, `a_cf888bcac0d78565`) |
| Q1 xóa 2 clip video | Click + Shift+click + Delete thật; timeline chỉ còn 1 clip chữ; autosave srcs 0, binMedia vẫn 2 |
| Q2 bấm ✕ xóa mau-1 khỏi bin | Toast thật "Đã xóa “mau-1.webm” khỏi thư viện."; bin còn mau-2; autosave binMedia 1 entry; IDB thật (poll tới khi hết, <5s): manifests chỉ còn mau-2, blobKeys chỉ còn `a_cf888bcac0d78565` — manifest + blob của mau-1 đều hết |
| Q3 reload | Reload 5899ms; boot ổn định; bin vẫn 1 (mau-2, file thật), timeline 1 chữ, missing null; IDB sau reload vẫn không có manifest/blob mau-1, mau-2 còn nguyên |
| H9 0 lỗi trang | Không có window.onerror/unhandledrejection qua 1 lần reload |

### 3.4 Hồi quy + build (chạy lại độc lập sau khi sửa)

- `tsc` apps/web: file của luồng này **0 lỗi**; toàn repo exit 2
  với 23 lỗi toàn nằm ở file test của luồng khác (xem §0/§5.6).
- `vite build` apps/web: **pass, 42.51s** (cảnh báo chunk >500kB có sẵn).
- Test chạy lại bằng `node` trực tiếp: binOrphan60Q7 17/17,
  binPersist59P1 17/17, rehydrate36S5 27/27, projectRepo 10/10,
  saveToast31 15/15, projectRepoRound26J5 15/15,
  projectRepoRound49E4 13/13, loadProject54K1 7/7, textStyle27K1 6/6,
  textStyle32O6D7 6/6, relinkDedup38U3 7/7, assetStore 27/27.
- Test chạy bằng esbuild bundle: importAsset37T3 8/8 (esm + `.mjs`),
  store.loadSampleDirty54K2 3/3 (cjs), store.binOrphan60Q7 6/6 (cjs).
- Không chạy lại: các suite headed/test của luồng khác trong đợt 60
  (đang chạy song song) — chỉ đối chiếu LIMITS của chúng ở bước gộp.

## 4. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/binOrphan60Q7.ts` | Mới | `collectClipSrcs`, `planOrphanBytesDeletion` (3 chặn), `deleteOrphanBinBytes` (best-effort, không throw); tự chứa, không import value từ file anh em |
| `apps/web/src/lib/binOrphan60Q7.test.ts` | Mới | Test Node 17/17 (plan + bytes thật + race timer thật) |
| `apps/web/src/store.binOrphan60Q7.test.ts` | Mới | Test store thật 6/6 qua esbuild bundle |
| `apps/web/src/store.ts` | Sửa | `removeMediaFromBin`: hỏi plan Q7, chặn khi clip dùng `asset:`, fire-and-forget xóa bytes IDB khi plan cho phép |
| `apps/web/src/lib/projectRepo.ts` | Sửa | `autosaveNow` hủy timer debounce đang chờ (đóng race mặt 1) |
| `apps/web/src/lib/openProjectFlow.ts` | Sửa | Đường mở file: `autosave()` → `autosaveNow()` ngay + `autosaveNow` kèm binMedia sau rehydrate (đóng race mặt 2) |
| `apps/web/tsconfig.json` | Sửa | Thêm exclude 2 file test mới |
| `apps/web/scripts/clicktest-60q7-idb-orphans.mjs` | Mới | Harness headed Q0–Q3 + H9 (5/5) |
| `docs/PHASE9_ROUND60_Q7_IDB_ORPHANS_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): evidence headed
`hidden_files/round60-q7/headed/` (report JSON, vite/chrome log, 4
screenshot). KHÔNG có fragment i18n mới — luồng này không thêm key
nào (tái dùng `store.toastMediaInUse` + `mediabin.removed` đã có
trong dict sau gộp đợt 59).

Stage: `paths-loop/phase9-round60-q7-idb-orphans.txt` — 9 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.

## 5. Nợ mở / giới hạn (trung thực)

1. **Bytes mồ côi từ TRƯỚC đợt này vẫn ở lại kho.** Chỉ media bị xóa
   khỏi bin TỪ đợt này trở đi mới được dọn bytes. Bytes mồ côi từ
   đợt 59 trở về trước (xóa khỏi bin khi chưa có dọn dẹp, xóa hết
   clip, mẫu cũ đã tỉa tên nhưng còn bytes lạ) không có đường dọn tự
   động — cần một UI "dọn kho" có xác nhận của user trong tương lai
   (liệt kê asset không thuộc spec/bin hiện tại cho user chọn, KHÔNG
   tự xóa — vì kho là toàn cục, xem §1.1).
2. **Xóa bytes ở project này có thể ảnh hưởng project KHÁC dùng chung
   bytes.** AssetStore là kho toàn cục theo trình duyệt; một file
   .vcut khác có thể tham chiếu cùng assetId (cùng bytes) qua src
   `asset:` hoặc tên thô. Xóa khỏi bin ở project A sẽ làm project B
   đó mất bytes sau reload (clip hiện panel Relink). Đây là giới hạn
   của mô hình kho toàn cục không có sổ tham chiếu liên project — đã
   cân nhắc và chấp nhận vì: (a) app là single-autosave, một project
   tại một thời điểm; (b) user xóa CHỦ ĐÍCH khỏi bin (có confirm);
   (c) khôi phục được bằng cách import lại file gốc (dedup theo hash
   nên không nhân đôi bytes). Ghi lại để khỏi ai tưởng là bug; nếu
   muốn chặn chắc thì cần duy trì `refCount` liên project (xem §5.5).
3. **Cửa sổ nhỏ giữa xóa bytes và ghi lại manifest** (xem §1.4):
   reload đúng trong ~5s sau khi xóa khỏi bin thì item vắng khỏi bin
   (đúng ý user) nhưng rehydrate ghi `skippedBin` — không hiện UI
   nào cho entry này (App không toast skippedBin). Hành vi đúng,
   chỉ ghi lại để khỏi ai tưởng là mất dữ liệu.
4. **Xóa khỏi bin không undo được** (như import, giữ nguyên từ 59P1)
   — nay kèm theo bytes cũng mất; user bấm nhầm thì phải import lại
   file (dedup theo hash nên không nhân đôi bytes).
5. **Chưa duy trì `refCount` của AssetStore.** Không có code nào gọi
   `addRef`/`releaseRef` (chỉ có định nghĩa) nên `refCount` luôn 0 và
   lưới an toàn cuối trong `remove()` hiện không có tác dụng thực tế.
   Duy trì refCount đúng (tăng khi thêm clip, giảm khi xóa clip,
   quét cả nested + cả src `asset:`) là việc lớn hơn, ngoài phạm vi
   tối thiểu của luồng này; khi làm xong thì `remove()` sẽ tự từ chối
   khi còn clip dùng — lúc đó chặn ở store vẫn giữ như lưới thứ hai.
6. **`tsc` toàn repo hiện không xanh do luồng khác.** 23 lỗi đều nằm
   trong `src/lib/i18nOrphans60Q4.test.ts` (20) và
   `src/lib/gopTrialDecode60Q5.test.ts` (3) — file test của luồng Q4/Q5
   đợt 60 đang làm dở song song, chưa có trong tsconfig exclude.
   Không sửa file của luồng khác; `vite build` vẫn pass (build không
   chạm file test). Parent gộp nên chạy lại `tsc` sau khi các luồng
   đó xong.
7. **Headed chạy cùng lúc với các luồng đợt 60 khác:** vite dev tắt
   HMR nhưng mỗi lần reload vẫn fetch module mới từ cây đang được các
   luồng khác sửa — boot marker ổn định trong lần reload duy nhất của
   đợt này (không phát hiện reload lén), nhưng không loại trừ hoàn
   toàn nhiễu chéo; số đo headed là của cây tại thời điểm chạy
   (07/11 ~18:01–18:02 UTC). Không click-test headed cho chặn xóa khi
   clip dùng src `asset:` (dạng src này app không sinh ra; chỉ có
   test Node + test store cho chặn đó).
8. **Không có sweep / dọn kho tự động** (quyết định có chủ đích, xem
   §1.1) — đừng ai thêm sweep theo project hiện tại mà tưởng là an
   toàn.

## 6. Môi trường chạy

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1248`
  (headed qua Xvfb display riêng `:172`, 1440×900).
- Vite dev cổng 5590, CDP debug 9690, TMPDIR `/tmp/round60-q7/tmp`.
- Lệnh chạy (từ gốc repo):
  `node apps/web/scripts/clicktest-60q7-idb-orphans.mjs`
  — exit 0 khi 5/5 pass, 1 khi có FAIL, 2 khi harness lỗi.
- Test Node chạy trực tiếp (type-stripping); test store chạy bằng
  esbuild bundle `--format=cjs` + outfile `.cjs` (mẫu 54K2).
