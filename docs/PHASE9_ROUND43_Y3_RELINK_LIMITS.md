# Phase 9 — Đợt 43, luồng Y3: đóng 3 nợ relink/import progress của đợt 42 §5.4

Ngày: 04/11/2026 (giờ +07). KHÔNG push, KHÔNG tag/release, KHÔNG binary,
KHÔNG dist vào batch. Mọi số timing dưới đây là **headed, under-load**
(nhiều luồng đợt 43 chạy song song trên cùng VM) — không phải số đo máy
trống, cấm dùng làm baseline quiet hay claim fps.

## 1. Phạm vi

Đóng đúng 3 nợ mở của relink/import progress từ đợt 42 (§5.4 của
`docs/PHASE9_ROUND42_LIMITS.md` + §6 của
`docs/PHASE9_ROUND42_X3_RELINK_PANELS_LIMITS.md`):

1. File > 128 MiB: chưa từng đo import/relink thật.
2. Banner min-display cho file ≤ 64 MiB: flash hashing 100% chỉ ~1–25 ms,
   mắt người không đọc được — cần quyết UX + cài đặt.
3. Thông báo done của TtsButton không bao giờ hiện — cần tìm nguyên nhân
   thật, sửa nếu là bug, hoặc ghi quyết UX nếu cố ý.

Chỉ sửa file thuộc phạm vi Y3; file dùng chung chỉ thêm hunk có marker
`ROUND43-Y3` (xem §7). Không sửa semantics selection, không nới cổng
GOP/S4, không đổi ngưỡng nào khác.

## 2. Nợ 1 — File > 128 MiB: đo thật trên Chromium (PASS)

### 2.1. Fixture và phương pháp

- File MP4 thật, tự encode bằng ffmpeg (không phải file giả):
  `testsrc2` 1280×720 30 fps 80 s + tone sine AAC, H.264 16 Mbps.
  Kích thước **141.350.955 byte = 134,8 MiB** (> 128 MiB = 134.217.728),
  đã verify bằng ffprobe (h264 1280×720 + aac, duration 80,000 s).
- Import qua MediaBin thật trên Chromium headed (Xvfb, `--no-sandbox`,
  profile mới, vite dev phục vụ code mới). Ground truth: MutationObserver
  trong trang ghi mọi lần render `[data-import-progress]` + đọc trực
  tiếp IndexedDB thật trong trang sau import và sau reload cùng profile.
- Đường code đo được chính là đường relink dùng chung:
  `importFiles` → `ingestImportedItemWithProgress` →
  `AssetStore.ingestWithProgress` (nhánh chunked, lát 8 MiB). Relink qua
  RelinkPanel dùng cùng `ingestWithProgress` (xem §6, nợ còn lại).

### 2.2. Số đo thật (under-load)

| Chỉ số | Giá trị |
| --- | --- |
| File | 141.350.955 byte (134,8 MiB) |
| Số event hashing (lát) | 17 (16 lát đủ 8 MiB + 1 lát cuối ~7,1 MiB) |
| % từng lát (observer) | 5, 11, 17, 23, 29, 35, 41, 47, 53, 59, 65, 71, 77, 83, 89, 94, 100 |
| Số byte từng lát (observer) | 8,0 → 16,0 → … → 128,0 → 134,8 MB (bước đúng 8,0 MB, lát cuối 134,8) |
| % có đúng từng slice không | **Đúng**: mỗi bước tăng đúng 1 lát 8 MiB, không bỏ lát, không % giả |
| Thời gian băm (first → last hashing event) | **18.940 ms** (~1,11 s/lát, băm SHA-256 thuần JS) |
| storing → banner clear | **2.494 ms** (ghi IDB 141 MB + render done + panel clear) |
| Tổng setFile → banner clear | 25.940 ms |
| Pad min-display (§3) cộng thêm | **0 ms**: băm 18,94 s >> 500 ms nên không pad; storing bắt đầu chỉ 1 ms sau event hashing cuối (chỉ còn yield macrotask của đợt 42 X3) |
| Lỗi trang trong lúc import | 0 |

### 2.3. Ghi IDB thật — verify bằng digest, không chỉ bằng kích thước

- Manifest sau import: `assetId a_b04905e14ca8016d`,
  `sha256 b04905e14ca8016dca3fde955e2044b8a8b0c1de2b6a8ae84ac42eb79226c6e2`,
  `size 141.350.955`, `originalName big-140.mp4`.
- Đọc blob từ IDB trong trang, băm lại bằng WebCrypto
  (`crypto.subtle.digest`) → digest **khớp chính xác** manifest sha256.
  Tức bytes trong IDB đúng từng byte với file gốc, không chỉ đúng size.
- Reload trang cùng profile, đọc lại IDB: manifest + blob + digest vẫn
  khớp chính xác → bytes đã bền, không phải chỉ nằm trong bộ nhớ phiên.

### 2.4. Có chạm trần/khóa nào của đường GOP/S4 không?

- **Đường import/relink: KHÔNG có trần nào.** `ingestWithProgress`
  không kiểm tra kích thước tối đa; file 134,8 MiB import xong bình
  thường, không lỗi, không fallback.
- **Đường GOP (preview ngược) thì CÓ khóa — và khóa đó giữ nguyên,
  không bị đo này phá vỡ.** `resolveGopRangeWiring` với
  `enabled=true, knownSizeBytes=140 MiB` trả
  `useGop=false, reason="gop-large-file-locked: … (cổng S4 giữ nguyên)"`
  (test mới §5); đối chứng file 100 MiB vẫn `useGop=true`. Tức file
  > 128 MiB import/relink được, nhưng preview ngược vẫn fallback về
  element như cũ — quyết mở lại > 128 MiB cho GOP vẫn thuộc nợ của
  luồng sở hữu GOP (đợt 42 §5.5), không phải của luồng này, và không
  được suy ra từ đo import này.
- Không có trần bộ nhớ nào bị chạm trong lúc đo: import chạy hết,
  không crash, không page error.

## 3. Nợ 2 — Banner min-display cho file ≤ 64 MiB: quyết UX + cài đặt (PASS)

### 3.1. Quyết định

**Giữ banner ở pha hashing tối thiểu 500 ms** (tính từ sự kiện tiến
trình đầu tiên tới khi chuyển sang pha storing), cài tập trung trong
`AssetStore.ingestWithProgress` — mọi panel dùng đường này đều hưởng,
không cần sửa từng panel.

Lý do chọn 500 ms và chọn vị trí này:

- 500 ms đủ để mắt người đọc một dòng trạng thái ngắn ("đang tính mã
  băm: 2,5 MB / 2,5 MB (100%)") mà vẫn không gây cảm giác chờ: file
  ≤ 64 MiB băm WebCrypto vốn đã ~0,2 s, nên chi phí cộng thêm tối đa
  ~0,5 s cho file nhỏ nhất; file lớn băm lâu hơn 500 ms thì pad = 0,
  không chậm thêm (đo §2.2 chứng minh pad = 0 cho file 134,8 MiB).
- Đo từ **sự kiện đầu tiên**, không đo từ lúc bắt đầu băm: nhánh
  one-shot chỉ bắn event đầu tiên khi băm xong, trước đó banner chưa
  hề xuất hiện nên pad tính từ đó mới đúng ý nghĩa "hiển thị".
- Phương án bị loại: giữ banner sau khi done thêm 500 ms rồi mới clear
  — phải sửa từng panel, và nếu component unmount giữa chừng (đúng
  trường hợp TtsButton §4) thì timer clear trở nên vô nghĩa. Pad trước
  storing thì nằm trong chính quá trình ingest, có giới hạn, không
  phụ thuộc vòng đời component.
- Không pad đường thất bại: lỗi trong lúc băm throw trước dòng pad nên
  không giữ banner; panel MediaBin clear banner trong `finally`
  (`MediaBin.tsx` `onFiles`) nên banner không kẹt kể cả khi import lỗi.

### 3.2. Cài đặt (marker ROUND43-Y3)

- `ingestProgress39T5.ts`: hằng mới `IMPORT_BANNER_MIN_DISPLAY_MS = 500`
  kèm giải thích.
- `assetStore.ts` (`ingestWithProgress`): bọc callback để ghi thời điểm
  event đầu tiên; sau khi băm xong (cả hai nhánh one-shot và chunked),
  nếu chưa đủ 500 ms thì chờ nốt rồi mới bắn event storing. Chỉ pad khi
  có callback (đường ingest không UI không chậm thêm).

### 3.3. Click-test headed chứng minh (PASS)

File nhỏ thật `clip2.mp4` (2,5 MB, nhánh one-shot) qua MediaBin, profile
mới, observer làm chuẩn:

| Chỉ số | Trước sửa (đợt 42 X3) | Sau sửa (đợt 43 Y3) |
| --- | --- | --- |
| hashing 100% → storing | ~1–25 ms (flash) | **500 ms đúng** |
| Banner tổng (hashing → clear) | ~1–25 ms + storing nhanh | **518 ms** |
| Banner có clear không | có | có (clear sau storing 18 ms, không kẹt) |
| Bin có file sau import | có | có |

So sánh "trước" lấy từ đo thật của đợt 42 X3 (§4.1/§4.3: flash ~2 ms
cho file 29,5 MB), không đo lại bản cũ cho min-display vì cùng một
cơ chế đã được X3 chứng minh; bản sửa được đo trực tiếp ở trên.

## 4. Nợ 3 — Thông báo done của TtsButton: bug thật, đã sửa (PASS)

### 4.1. Nguyên nhân thật (không phải quyết UX cố ý)

Chuỗi sự kiện trong `TtsButton.speak()` (đọc code + tái hiện live):

1. `importFiles` xong → `setImportProgress(null)`.
2. `addMediaAtPlayhead(item.id)` → `addMediaToTrack` →
   `execCommand(…, [{ trackId, clipId: clip.id }])` — tức **đặt selection
   sang clip audio mới**.
3. Inspector render theo selection: rời nhánh text → **TtsButton unmount**.
4. `setMsg(i18nT("tts.done"))` chạy sau bước 2, trên component đã
   unmount → setState không còn render → thông báo done **không bao
   giờ hiện**.

Đây là bug (thông báo được code với ý định hiện, key `tts.done` tồn
tại, nhưng đường chạy khiến nó không thể hiện), không phải quyết UX
cố ý — không có comment hay tài liệu nào nói "cố tình không hiện".

### 4.2. Sửa (marker ROUND43-Y3)

Giữ nguyên semantics selection (người dùng vẫn thấy clip audio mới
được chọn — cùng mẫu với TemplatePackModal) và báo done bằng **toast
toàn cục** (`pushToast(…, "success")`): component `Toasts` gắn ở App
root nên sống sót qua lần unmount của TtsButton. Msg cục bộ vẫn dùng
cho busy/lỗi (xảy ra khi component còn mounted). Không đổi key i18n,
không thêm key mới.

### 4.3. Click-test headed trước–sau (cùng script, cùng tiêu chí)

Cả hai lần đều: chọn clip text "Xin chào" → bấm "🔊 Đọc thành tiếng" →
TTS thật qua bridge (model đã warm; WAV warm 99.884 byte, HTTP 200).
Tiêu chí: timeline có audio clip `tts-*` + toast done xuất hiện.

|  | Trước sửa (code đợt 42, tạm revert để đo) | Sau sửa |
| --- | --- | --- |
| Timeline có clip `tts-*` | có (42.318 ms) | có (22.069 ms) |
| Toast "✅ Đã thêm giọng đọc vào timeline." | **không có** (`toasts: []`) | **có** |
| `.tts-msg` done sau khi xong | không có (đúng như X3 §4.8 chẩn đoán) | không có (đã định: msg cục bộ không còn là kênh báo done) |
| Kết luận | Bug tái hiện đúng | **PASS** |

Lưu ý trung thực: lần chạy sau sửa, toast không kèm số giây
("(…s)") vì header `X-TTS-Duration` của lần chạy đó trống (dur = 0) —
cùng key `tts.done`, chỉ thiếu hậu tố thời lượng, không phải lỗi khác.
File TTS sau hai lần đo đã được khôi phục đúng bản sửa (diff với bản
lưu trước khi revert = rỗng) và vite dev serve lại bản có `pushToast`
(đã verify qua module đã transform).

### 4.4. Ghi chú harness TTS

Bridge phải chạy với `TTS_PYTHON=<repo>/server/tts/.venv2/bin/python`
(python hệ thống không có package `vieneu` → POST /api/tts trả 500).
Đây là ghi chú môi trường chạy test, không phải sửa repo.

## 5. Kiểm chứng hồi quy (số thật, chạy lại sau mọi sửa)

- `tsc --noEmit` trong `apps/web`: **0 lỗi** (sau khi thêm test mới vào
  exclude của tsconfig — xem §7; các file test khác của đợt 43 đã có
  sẵn trong exclude).
- `vite build`: **pass** (5,97 s, chỉ cảnh báo chunk > 500 kB cũ).
- Test mới `ingestMinDisplay43Y3.test.ts` (bundle esbuild ra /tmp rồi
  chạy, như tiền lệ đợt 42 cho file import không đuôi): **5/5**
  - hằng min-display = 500 ms;
  - one-shot: hashing giữ **501–503 ms** trước storing, manifest + blob
    đúng (tổng ingest ~507–578 ms);
  - không callback: ingest **2–8 ms** (không bị pad);
  - băm lỗi: reject sau **0 ms** (không chờ pad);
  - GOP/S4: file 140 MiB `useGop=false` + reason `gop-large-file-locked`,
    đối chứng 100 MiB `useGop=true`.
- Hồi quy đợt 42 chạy lại: relink40V5 6/6, relink39T5 11/11,
  relinkDedup38U3 7/7, assetStore 22/22, importAsset37T3 8/8,
  rehydrate36S5 19/19, importProgress41W3 4/4 (bundle ESM ra /tmp; chạy
  trực tiếp dạng CJS lỗi `import.meta` rỗng như đợt 42 đã ghi — lỗi
  cách chạy, không phải code) — **tổng 77/77**.
- i18n không chạm: vi = en = **962 key**, vi-only = en-only = 0.
- Click-test headed: big-file PASS (§2), min-display PASS (§3),
  TTS trước FAIL đúng bug / sau PASS (§4).

## 6. Nợ còn lại (trung thực, không claim)

- **RelinkPanel với file > 128 MiB chưa click-test riêng**: đo §2 đi qua
  MediaBin `importFiles`, dùng cùng `ingestWithProgress` mà RelinkPanel
  dùng, nhưng chưa bấm relink một asset > 128 MiB thật qua UI Relink
  (cần project + rehydrate IDB + thao tác relink — chưa làm trong
  luồng này).
- **Safari / Firefox / máy thật**: chưa kiểm chứng (toàn bộ đo trên
  Chromium headed của VM).
- **Mở lại > 128 MiB cho đường GOP**: vẫn khóa theo thiết kế (S4);
  quyết mở lại cần đo heap browser headed riêng — thuộc luồng GOP,
  không suy ra từ đo import này.
- **Toast TTS thiếu hậu tố giây** khi bridge không trả
  `X-TTS-Duration`: chỉ là hiển thị, không ảnh hưởng tính đúng của
  thông báo done.
- Mọi số timing trong tài liệu này đều under-load (đợt 43 nhiều luồng
  song song) — cấm dùng làm baseline quiet.

## 7. File đã đổi/thêm (đường dẫn tương đối repo, chỉ text, chưa push)

Đổi (hunk mới đều mang marker `ROUND43-Y3`, trừ dòng exclude tsconfig
mà JSON không cho đặt comment — tên file test đã chứa `43Y3`):

1. `apps/web/src/lib/ingestProgress39T5.ts` — hằng
   `IMPORT_BANNER_MIN_DISPLAY_MS = 500` (§3.2).
2. `apps/web/src/lib/assetStore.ts` — bọc callback ghi thời điểm event
   đầu tiên + pad tới 500 ms trước storing trong `ingestWithProgress`
   (§3.2). Không đổi ngữ nghĩa dedup, putManifest, hay đường không
   callback.
3. `apps/web/src/components/TtsButton.tsx` — báo done bằng toast toàn
   cục thay vì `setMsg` sau `addMediaAtPlayhead` (§4.2).
4. `apps/web/tsconfig.json` — thêm `src/lib/ingestMinDisplay43Y3.test.ts`
   vào exclude (tiền lệ: mọi file test của repo đều nằm trong exclude).

Thêm:

5. `apps/web/src/lib/ingestMinDisplay43Y3.test.ts` — test mới 5/5 (§5).
   Fake IndexedDB trong file chỉ implement đúng surface đường
   `putManifest` dùng; đo IDB thật nằm ở click-test headed §2, không
   mạo nhận fake là IDB thật.
6. `docs/PHASE9_ROUND43_Y3_RELINK_LIMITS.md` — chính tài liệu này.

Không đổi: file i18n JSON, `MediaBin.tsx`, `store.ts`, mọi file panel
khác, `apps/web/dist/` (build lúc kiểm chứng, không stage), mọi binary.
Probe click-test (`probe-y3.mjs`), fixture MP4 134,8 MiB và kết quả
JSON chỉ nằm ở `~/workspace/tmp-round43-y3/` (ngoài repo) và không
được stage.
