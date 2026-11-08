# Phase 9 — Đợt 59, luồng P1: Bin media bền qua reload + toast "đã điền style" — LIMITS

Ngày: 07/11/2026 (~21:40–23:05 +07, lượt cron 21:35 +07).
Phạm vi: đóng nợ đợt 58 §6.1 (O2) — (a) thiết kế bin theo spec: media
import rồi xóa hết clip khỏi timeline biến mất khỏi bin sau reload;
(b) toast "đã điền style mặc định cho 1 text clip…" lặp lại mỗi lần
reload. KHÔNG push, KHÔNG release/tag, KHÔNG binary.

## 0. Kết luận tóm tắt

| Hạng mục | Kết luận |
|---|---|
| (a) Bin theo spec | **Đã đổi thiết kế + sửa xong.** Autosave nay mang manifest bin (`binMedia` trong envelope); rehydrate nạp đủ manifest KÈM media trong spec; media chỉ rời bin khi user xóa chủ đích bằng nút ✕ ở MediaBin (có confirm + chặn khi còn clip dùng). Headed B4: xóa 2 clip video + reload → bin vẫn 2 item (trước fix: bin 0 — đo lại bởi O2 A2 trên code cũ). |
| (b) Toast "đã điền style" lặp lại | **Không phải bug lặp trên cùng một autosave.** Đo thật 2 tầng: (1) Node: loadAutosave lần 1 sửa + ghi lại, lần 2 hết fix (probe 3/3 trước khi sửa); (2) Headed B1/B2/B3: reload liên tiếp không toast, seed thiếu style bơm tay thì toast đúng 1 lần rồi tự lành bền vững. **Nguyên nhân gốc của việc toast "cứ xuất hiện":** mẫu + clip chữ mới tạo sinh ra đã thiếu field `italic` nên MỖI seed mới đều toast ở lần reload đầu — đã sửa tại nguồn (sample.ts, store.addTextClip sinh đủ field như DEFAULT_TEXT_STYLE). Toast với file cũ thiếu style vẫn giữ nguyên (hành vi đúng, không tắt mù). |
| Test | Node mới 17/17; headed mới 9/9; hồi quy rehydrate 27/27, projectRepo 10/10, textStyle 6/6 + 6/6, importAsset 8/8, relinkDedup 7/7, store suites 3 + 20 + 38 pass; tsc 0; vite build pass 9.51s. |

## 1. Thiết kế mới (a): manifest bin trong autosave

### 1.1 Vì sao chọn manifest trong envelope autosave

Các phương án đã cân nhắc:

- **Nạp toàn bộ manifest IndexedDB lúc rehydrate (không cần envelope):**
  đơn giản nhất, nhưng bin sẽ hiện cả media của project KHÁC dùng chung
  kho (AssetStore là kho toàn cục theo trình duyệt, không theo project)
  và cả media đã xóa khỏi bin chủ đích (bytes còn mồ côi trong IDB) —
  sai ngữ nghĩa "bin của project này".
- **Manifest bin trong envelope autosave (đã chọn):** bin gắn với
  project đang mở; entry chỉ mang `{ assetId, name }`, bytes/metadata/
  proxy vẫn đọc từ manifest trong AssetStore (không nhân đôi dữ liệu);
  xóa khỏi bin = entry biến mất khỏi envelope ở lần autosave sau.
- **Manifest bin trong file `.vcut.json`:** KHÔNG làm — file là project
  di động, còn manifest trỏ vào AssetStore/IndexedDB của máy này; máy
  khác không có bytes đó. `serializeProject` có tham số `binMedia` tùy
  chọn nhưng `saveProject` (và `archive.ts`, `buildNativeSavePayload`)
  KHÔNG truyền nên file không mang field này — cùng mẫu với `session`
  (chỉ autosave, xem AutosaveSession).

### 1.2 Luồng dữ liệu

```
import/relink/rehydrate → store.media (item có assetId)
        │  App subscribe effect (spec HOẶC media đổi)
        ▼
binMediaFromMedia(media) → autosave/spec envelope: binMedia: [{assetId, name}]
        │  reload
        ▼
loadAutosave → binMedia (null = envelope cũ → fallback chỉ-spec)
        │  App init
        ▼
rehydrateMediaItems(deps, spec, binMedia)
  ├─ planRehydrate(srcs trong spec) như cũ
  └─ planRehydrateBin(binMedia): khớp assetId (via "bin"), fallback khớp
     tên với originalName (via "bin-name"), bỏ qua entry đã được spec
     bao phủ (không nhân đôi), entry không khớp manifest → skippedBin
```

- `parseBinMedia` (projectRepo.ts): envelope cũ / không phải mảng →
  null; `[]` → [] (bin trống có chủ đích); entry xấu (thiếu/không phải
  chuỗi assetId/name, trùng assetId) bị loại lặng lẽ; trần 500 entry.
- `binMediaFromMedia`: chỉ item có `assetId` (item chưa ingest không có
  bytes trong IndexedDB nên rehydrate không khôi phục được — loại khỏi
  manifest thay vì ghi entry chết).
- Item bin-only dựng lại mang `file` thật (`new File([blob], name)`) và
  `file.name == item.name` (bất biến như via "alias" của đợt 38 U3);
  proxy/proxyStale xử lý chung đường với candidate spec (K7).
- Tương thích ngược: envelope cũ không có `binMedia` → `loadAutosave`
  trả `binMedia: null` → App truyền `undefined` → rehydrate chỉ theo
  spec như hành vi cũ (test "không truyền binMedia → hành vi cũ" khóa).
  Project cũ tự "nâng cấp" sau 1 lần reload + autosave: rehydrate khôi
  phục media theo spec → media đổi → effect autosave ghi binMedia.

### 1.3 Mọi đường ghi envelope đều đã kèm binMedia (kẻo ghi đè mất)

Rà soát toàn bộ call site `autosave`/`autosaveNow`/`serializeProject`:

| Call site | Xử lý |
|---|---|
| `App.tsx` subscribe effect (spec/media đổi) | Kèm `binMediaFromMedia(s.media)`; kích hoạt cả khi chỉ media đổi (import media rồi chưa thêm clip nào vào timeline cũng phải autosave — trước đây chỉ spec đổi mới ghi). |
| `App.tsx` afterFix (ghi ngay sau sửa curve) | Kèm `binMediaFromMedia(after.media)` — ghi ngay không kèm sẽ ghi đè mất field. |
| `projectRepo.loadAutosave` ghi lại O6 khi sửa style | Kèm `binMedia` đã đọc từ envelope thô — nếu không, reload đầu tiên sau khi sửa style sẽ ghi đè mất manifest bin (hồi quy đúng nợ đang đóng; có test khóa). |
| `openProjectFlow` đường archive | Kèm `binMediaFromMedia(...)` (media đã settle sau importFiles). |
| `openProjectFlow` đường mở file thường | KHÔNG kèm (giữ nguyên lời gọi): lúc đó rehydrate chưa chạy, media còn rỗng; effect autosave ở App.tsx sẽ ghi lại manifest đúng sau khi restoreMediaBin. Xem §5.2. |
| `saveProject` / `archive.ts` / `buildNativeSavePayload` | KHÔNG kèm, có chủ đích (§1.1): file di động không mang manifest máy-local. |

### 1.4 UI xóa media khỏi bin (MediaBin)

- Nút ✕ góc trên-phải mỗi card (`.media-remove`, chỉ rõ khi hover
  card) → `window.confirm` (chuỗi `mediabin.removeConfirm`) → gọi
  `store.removeMediaFromBin(id)` → toast `mediabin.removed`.
- `removeMediaFromBin` chặn khi còn clip dùng tên đó: dùng
  `findMissingAssets` với tập tên đã trừ item này để đếm clip còn trỏ
  tới nó (quét cả nested, cùng luật với `checkMissingMedia`) —
  clipCount > 0 thì trả `{ ok: false, message }` (key
  `store.toastMediaInUse`, kèm số clip), không xóa. Lý do chặn: xóa
  khỏi bin lúc đó sẽ làm clip thành "missing" và hiện panel Relink oan.
- Xóa xong revoke blob: URL của item (chỉ `blob:`) để khỏi rò rỉ; bytes
  trong IndexedDB giữ nguyên (mồ côi, không tự hiện lại — như hành vi
  cũ khi xóa clip); file gốc trên máy user không bị đụng tới.
- Xóa KHÔNG undo được (media bin không nằm trong history của spec —
  như import). Không tìm thấy item → `{ ok: false }` lặng lẽ.
- 4 key i18n mới nằm ở fragment
  `hidden_files/round59-p1-fragment.json` (parent gộp, KHÔNG sửa trực
  tiếp vi.json/en.json): `mediabin.removeTitle`, `mediabin.removeConfirm`,
  `mediabin.removed`, `store.toastMediaInUse`. Chưa gộp nên headed B5/B6
  thấy toast hiện đúng key thô (`mediabin.removed`,
  `store.toastMediaInUse`) — hành vi tạm thời đúng mẫu các đợt trước
  (O3/O5). Sau khi parent gộp: dict 1942 → **1946 key lá**; các test
  snapshot khóa số key 1942 phải được bump theo (như đợt 58 closing).

## 2. Điều tra toast "đã điền style" (b): nguyên nhân gốc

### 2.1 Kết quả đo — KHÔNG lặp trên cùng một autosave

**Tầng Node** (probe `/tmp/probe-toast59P1.test.ts`, chạy TRƯỚC khi sửa
gì — 3/3 pass; nay hợp nhất vào `binPersist59P1.test.ts`):

- Seed autosave mang text clip thiếu `italic` → `loadAutosave` lần 1:
  warnings có "Đã điền style…", envelope ghi lại mang `italic:false`.
- `loadAutosave` lần 2 trên cùng autosave: 0 cảnh báo sửa style.
- `parseProjectText` trực tiếp trên seed đã đủ `italic`: 0 fix.
- `normalizeTextStyle` trên style thiếu `italic` thì đổi (điền
  `italic:false`); trên style đủ field thì idempotent.

Nghĩa là cơ chế O6 (đợt 32, ghi lại autosave ngay khi sửa style) vẫn
chạy đúng ở tầng projectRepo — không có bug "ghi lại không dính".

**Tầng headed** (harness mới, 5 lần reload trong một phiên):

| Case | Kết quả |
|---|---|
| B1 reload #1 sau khi mẫu tự load | bin 2, 3 clip, toasts `[]` — KHÔNG toast style |
| B2 reload #2 (không sửa gì) | bin 2, 3 clip, toasts `[]` — KHÔNG toast lặp |
| B3a bơm seed thiếu style rồi reload | Toast CÓ đúng 1 lần: "Khôi phục autosave, có lưu ý: Đã điền style mặc định cho 1 text clip thiếu style (tracks[1].clips[0] (clip \"c_x4jmfk4\")) — lưu lại file để hoàn tất."; autosave ghi lại: textItalic=false, binMedia vẫn 2 entry |
| B3b reload nữa sau khi seed đã lành | bin 2, 3 clip, toasts `[]` — KHÔNG còn toast style |

### 2.2 Nguyên nhân gốc thật: seed mới sinh ra đã thiếu style

`normalizeTextStyle` điền `italic: false` cho mọi style thiếu field
này, nên BẤT KỲ style nào được sinh ra mà không có `italic` cũng sẽ
toast ở lần load đầu tiên sau đó. Hai nơi trong app sinh style thiếu
`italic` (đối chiếu `DEFAULT_TEXT_STYLE` — đủ field, có `italic: false`):

1. `sample.ts` `buildSampleProject` — style text clip mẫu thiếu
   `italic` → MỖI lần tạo/tải lại project mẫu đều toast ở reload đầu.
   (Đây đúng là điều O2 thấy ở screenshot A1: lần reload đầu sau khi
   mẫu tự load.)
2. `store.ts` `addTextClip` — style clip chữ mới tạo thiếu `italic` →
   MỖI clip chữ user tạo mới đều toast ở reload đầu sau đó.

Trong một phiên làm việc mà user liên tục tạo mẫu/clip chữ mới, toast
cứ xuất hiện sau mỗi lần reload — nhìn như "lặp lại mỗi lần reload",
nhưng thực chất là mỗi lần một seed mới thiếu style. Quan sát N9 §7
cũng khớp: N9 xóa clip rồi reload đúng lúc autosave mang spec từ mẫu
vừa tạo (thiếu `italic`) nên toast xuất hiện 1 lần đó.

### 2.3 Sửa tại nguồn (không tắt toast mù)

- `sample.ts`: thêm `italic: false` vào style text clip mẫu.
- `store.ts` `addTextClip`: thêm `italic: false` vào style clip mới.
- `CAPTION_DEFAULT_STYLE` (captions.ts) và `DEFAULT_TEXT_STYLE`
  (projectRepo.ts) đã có `italic: false` từ trước — không đụng.
- Toast + normalize (K1) + ghi lại O6 được GIỮ NGUYÊN cho file cũ thật
  sự thiếu style (mở file .vcut cũ, autosave cũ): đó là hành vi đúng,
  kèm hướng dẫn "lưu lại file để hoàn tất". Không có đường nào tắt
  toast hay nuốt warning.

### 2.4 Đỏ-trước / xanh-sau (headed)

- Đỏ-trước cho B4: O2 A2 (cùng thao tác — xóa 2 clip video + reload —
  trên code cũ, đợt 58) đo bin **0**; B4 trên code mới đo bin **2**.
- Đỏ-trước cho B1: O2 A1 (code cũ, mẫu thiếu `italic`) screenshot còn
  toast "Đã điền style…"; B1 trên code mới: toasts `[]`.
- Xanh-sau: harness mới 9/9 (xem §3). Test Node 17/17 xanh-sau; trước
  khi sửa, file test không import được (module thiếu export
  `binMediaFromMedia`/`parseBinMedia` — đỏ ở tầng import), và probe
  toast chạy trước khi sửa đã khóa hành vi O6 (3/3).

## 3. Kiểm chứng (số thật)

### 3.1 Test Node mới `apps/web/src/lib/binPersist59P1.test.ts` — 17/17

Chạy: `node apps/web/src/lib/binPersist59P1.test.ts` (Node type-stripping,
có top-level await — chạy trực tiếp như rehydrate36S5.test.ts).

- rehydrate + binMedia (7): bin-only khôi phục đủ 2 (có file thật +
  assetId); entry trùng spec không nhân đôi; entry trùng `asset:` không
  nhân đôi; assetId chết → skippedBin 1, không crash; khớp theo tên khi
  assetId lạ; không truyền binMedia → hành vi cũ; tên entry khác
  originalName (đổi tên do trùng) → giữ tên bin + `file.name == item.name`.
- envelope autosave (7): parseBinMedia (hợp lệ / legacy null / rỗng [] /
  loại entry xấu + dedupe + trần 500); binMediaFromMedia (chỉ item có
  assetId); autosaveNow ghi + loadAutosave đọc lại; legacy → null;
  serializeProject không binMedia → không ghi field (.vcut sạch);
  ghi lại O6 khi sửa style PHẢI giữ binMedia.
- toast (3): load #1 sửa + ghi lại → load #2 hết fix; style thiếu
  `italic` không ổn định qua normalize; style đủ `italic` → 0 fix.

### 3.2 Headed `apps/web/scripts/clicktest-59p1-bin-persist-toast.mjs` — 9/9

Chạy: `node apps/web/scripts/clicktest-59p1-bin-persist-toast.mjs`
(vite dev HMR tắt + Chromium headed qua Xvfb display :164 + CDP, profile
mới tinh; cổng dev 5490/debug 9590 tự chọn). Exit 0 khi 9/9 pass.
Report JSON + 8 screenshot: `hidden_files/round59-p1/headed/`.

| Case | Kết quả đo |
|---|---|
| B0 setup | Mẫu tự load 3 clip; bin 2 item mau-1/mau-2.webm (file thật 359871/588581 byte, blob: URL); autosave binMedia 2 entry; textItalic=false |
| B1 reload #1 | Reload 6575ms; bin 2, 3 clip, missing null; toasts `[]` |
| B2 reload #2 | Reload 3208ms; bin 2, 3 clip; toasts `[]` |
| B3a seed thiếu style (bơm tay) | Toast "Đã điền style…" đúng 1 lần; ghi lại: textItalic=false, binMedia vẫn 2; reload 4750ms |
| B3b seed đã lành + reload nữa | Reload 4800ms; bin 2, 3 clip; toasts `[]` |
| B4 xóa 2 clip video + reload | Autosave lúc xóa: srcs 0, binMedia 2; reload 3435ms → timeline 1 chữ, bin vẫn 2 item (file thật, blob: URL), missing null |
| B5 bấm ✕ xóa mau-1 khỏi bin | Sau bấm: bin còn mau-2, toast key `mediabin.removed` (fragment chưa gộp), autosave binMedia 1 entry; reload 3028ms → bin vẫn 1 (mau-1 không hồi lại), missing null |
| B6 chặn xóa media đang dùng | Thêm mau-2 vào timeline (1 clip video) → bấm ✕ → bin vẫn 1, clip còn nguyên, toast lỗi key `store.toastMediaInUse` (fragment chưa gộp) |
| H9 0 lỗi trang | Không có window.onerror/unhandledrejection qua 5 lần reload |

### 3.3 Hồi quy + build (chạy lại độc lập sau khi sửa)

- `tsc` apps/web: **0 lỗi** (chạy 2 lần: sau khi sửa + cuối đợt).
- `vite build` apps/web: **pass, 9.51s** (cảnh báo chunk >500kB có sẵn).
- Test chạy lại bằng `node` trực tiếp: binPersist59P1 17/17,
  rehydrate36S5 27/27, projectRepo 10/10, textStyle27K1 6/6,
  textStyle32O6D7 6/6, projectRepoRound26J5 15/15,
  projectRepoRound49E4 13/13, loadProject54K1 7/7, saveToast31 15/15,
  structuredNotes32 12/12, relinkDedup38U3 7/7.
- Test chạy bằng esbuild bundle `--format=esm` + `.mjs` (file có
  top-level await + directory import): importAsset37T3 8/8,
  store.loadSampleDirty54K2 3/3, store.nestedCurve19 20/20,
  store.nestedToast22A 38/38.
- Không chạy lại: các suite headed của luồng khác trong đợt 59 (đang
  chạy song song) — chỉ đối chiếu LIMITS của chúng ở bước gộp.

## 4. File đổi/mới (stage, KHÔNG push)

| File | Đổi/mới | Nội dung |
|---|---|---|
| `apps/web/src/lib/projectRepo.ts` | Sửa | `BinMediaEntry`, `parseBinMedia`, `binMediaFromMedia`, `MAX_BIN_MEDIA_ENTRIES`; `ProjectEnvelope.binMedia` (autosave-only); `serializeProject`/`autosave`/`autosaveNow` nhận `binMedia?`; `loadAutosave` trả `binMedia` + ghi lại O6 giữ binMedia |
| `apps/web/src/lib/rehydrate36S5.ts` | Sửa | `planRehydrateBin`, via `"bin"`/`"bin-name"`, `rehydrateMediaItems(deps, spec, binMedia?)`, result thêm `restoredFromBin`/`skippedBin`; file.name giữ bất biến cho via bin |
| `apps/web/src/lib/binPersist59P1.test.ts` | Mới | Test Node 17/17 (rehydrate + envelope + toast) |
| `apps/web/src/store.ts` | Sửa | `removeMediaFromBin` (interface + impl, chặn khi còn clip dùng, revoke blob: URL); `addTextClip` thêm `italic: false` |
| `apps/web/src/sample.ts` | Sửa | Style text clip mẫu thêm `italic: false` |
| `apps/web/src/App.tsx` | Sửa | Truyền `auto.binMedia` cho rehydrate; autosave khi spec HOẶC media đổi + kèm binMedia; afterFix ghi ngay kèm binMedia |
| `apps/web/src/lib/openProjectFlow.ts` | Sửa | Đường archive ghi autosave kèm binMedia (media đã settle) |
| `apps/web/src/MediaBin.tsx` | Sửa | Nút ✕ xóa khỏi bin (confirm + toast) trên mỗi card |
| `apps/web/src/styles.css` | Sửa | `.media-remove` (góc trên-phải card, đỏ khi hover) |
| `apps/web/tsconfig.json` | Sửa | Thêm exclude `src/lib/binPersist59P1.test.ts` |
| `apps/web/scripts/clicktest-59p1-bin-persist-toast.mjs` | Mới | Harness headed B0–B6 + H9 (9/9) |
| `docs/PHASE9_ROUND59_P1_BIN_PERSIST_LIMITS.md` | Mới | Tài liệu này |

KHÔNG stage (ngoài repo / evidence): fragment i18n
`hidden_files/round59-p1-fragment.json` (4 key mới, parent gộp vào
dict); evidence headed `hidden_files/round59-p1/headed/` (report JSON,
vite/chrome log, 8 screenshot); probe tạm `/tmp/probe-toast59P1.test.ts`
(không stage, nội dung đã hợp nhất vào test chính).

Stage: `paths-loop/phase9-round59-p1-bin-persist.txt` — 12 entry,
NUL cuối, toàn text. KHÔNG push, KHÔNG release/tag.

## 5. Nợ mở / giới hạn (trung thực)

1. **Race ghi đè binMedia trong cửa sổ debounce 5s (hiếm, chưa đo
   thấy):** `replaceProject` reset media về [] rồi rehydrate khôi phục
   lại — nếu một lần autosave debounce kịp ghi đúng lúc media đang []
   (vd: mở file: `autosave()` ở openProjectFileFlow không kèm binMedia
   nên ghi envelope KHÔNG có field, rồi effect ghi lại sau khi
   restoreMediaBin), reload đúng trong cửa sổ đó sẽ thấy binMedia thiếu
   hoặc rỗng. Thực tế không mất dữ liệu: spec vẫn khôi phục media có
   clip; chỉ media bin-only (không clip) mới có nguy cơ vắng 1 lần
   reload rồi tự hồi ở autosave sau. Chưa sửa vì cần đổi thứ tự
   autosave/replaceProject — để đợt sau nếu đo thấy thật.
2. **Bytes mồ côi trong IndexedDB:** xóa media khỏi bin (hoặc xóa hết
   clip) không xóa bytes/manifest khỏi AssetStore — bin không hiện lại
   (đúng thiết kế), nhưng kho phình dần. Chưa có UI/dọn dẹp "quét rác"
   kho (nợ chung từ S5, không phải của đợt này).
3. **Bin là theo project-autosave, không theo file `.vcut.json`:**
   mở file .vcut ở máy khác / sau khi xóa autosave thì bin chỉ khôi
   phục media trong spec (hành vi cũ) — media bin-only không đi theo
   file. Đây là quyết định thiết kế có chủ đích (§1.1), ghi lại để
   khỏi ai tưởng là bug.
4. **Xóa khỏi bin không undo được** (như import) — user bấm nhầm thì
   phải import lại file (dedup theo hash nên không nhân đôi bytes;
   alias giữ tên cũ nếu trùng tên — xem U3).
5. **`binMedia` không tính media `http:`/`data:`/sticker chưa ingest:**
   item không có `assetId` không vào manifest (không có bytes để nạp
   lại) — bin vẫn hiển thị chúng trong phiên như cũ, chỉ không bền qua
   reload (hành vi cũ, không đổi).
6. **Headed chạy cùng lúc với các luồng đợt 59 khác:** vite dev tắt
   HMR nhưng mỗi lần reload vẫn fetch module mới từ cây đang được các
   luồng khác sửa — boot marker ổn định trong cả 5 lần reload của đợt
   này (không phát hiện reload lén), nhưng không loại trừ hoàn toàn
   nhiễu chéo; số đo headed là của cây tại thời điểm chạy
   (07/11 ~15:01–15:02 UTC).
7. **Fragment i18n chưa gộp:** 4 key mới chỉ nằm ở
   `hidden_files/round59-p1-fragment.json`; tới khi parent gộp, UI nút
   ✕/toast xóa hiện key thô (`mediabin.removed`,
   `store.toastMediaInUse`). Sau khi gộp, dict 1942 → 1946 key lá và
   các test snapshot khóa 1942 phải bump theo (parent làm ở bước gộp,
   mẫu đợt 58 closing).
8. **Không click-test headed cho đường mở file .vcut/archive với
   binMedia:** đường archive chỉ kiểm chứng ở tầng Node (autosave kèm
   binMedia) + suy luận thứ tự; chưa đo headed archive có media
   bin-only có bền qua reload không.

## 6. Môi trường chạy

- VM này, không GPU. Chromium `~/.cache/ms-playwright/chromium-1248`
  (headed qua Xvfb display riêng `:164`, 1440×900).
- Vite dev cổng 5490, CDP debug 9590, TMPDIR `/tmp/round59-p1/tmp`.
- Lệnh chạy (từ gốc repo):
  `node apps/web/scripts/clicktest-59p1-bin-persist-toast.mjs`
  — exit 0 khi 9/9 pass, 1 khi có FAIL, 2 khi harness lỗi.
- Test Node chạy trực tiếp (type-stripping); file có top-level await
  thì bundle esbuild `--format=esm` + outfile `.mjs` (bundle cjs gãy).
