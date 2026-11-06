# Phase 9 đợt 37, luồng T5 — Buffer file: đo blob file lớn thật + hủy fetch đang bay khi size tới muộn + click-test fallback full-app — LIMITS

Ngày: 02/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa file của luồng khác, KHÔNG ghi paths-loop hay build-loop-log
(parent gộp).
Luồng này đóng 3 nợ của `docs/PHASE9_ROUND36_S4_FILE_HEAP_LIMITS.md`
§5.1–§5.3 (size tới muộn không hủy được fetch đang bay; chưa đo blob:
với file lớn thật; fallback tầng vẽ full-app chưa click-test). Nợ
Range theo GOP + moov-trước + hợp đồng Range (§5.4 S4, §4 S4) GIỮ
NGUYÊN, không làm trong luồng này.

## 0. Kết luận ngắn (không vượt số đo)

1. **Size tới muộn trong lúc fetch đang bay nay HỦY ĐƯỢC.**
   `ReversePreviewController.load()` chạy dưới 1 AbortController
   riêng; `applyKnownFileSize` vượt ngưỡng hủy lần tải đó trước khi
   khóa fallback. Chứng minh xác định bằng route nhỏ giọt (1 MiB /
   100 ms): abort xong server ngừng gửi byte ngay (lần 1: đã gửi
   đúng 1 MiB rồi đứng yên; lần 2: 0 byte), heap phẳng 0,7 MiB,
   `arrayBuffer` không resolve dữ liệu, `failed` + `largeFileFallback`,
   không tải lại. Unit test 6/6 (HEAD bay, GET bay, trong ngưỡng
   không hủy, fetch phớt lờ signal, registry, dispose).
2. **Đo blob: với file lớn thật: KHÔNG CÓ đỉnh heap nào cho blob:.**
   File noise 419.967.521 byte (400,5 MiB) đưa vào trang bằng input
   file thật (CDP `DOM.setFileInputFiles` — File backed-by-disk,
   không qua JS heap, đúng đường production): cổng S4 (biết size
   trước) cho 0 request, heap 0,8 → 0,6 MiB; KHÔNG biết size trước
   thì HEAD không báo length nhưng **GET của blob: luôn báo
   `content-length` = kích thước thật** (đo được cả 2 lần chạy),
   nên cổng header GET của R3 hủy body trước khi đọc — heap phẳng
   0,7 MiB, `arrayBuffer` chưa từng bắt đầu. Tức với nguồn blob:,
   đỉnh heap 401 MiB của S4 không xảy ra ngay cả khi không biết
   size trước — nhưng đó là nhờ header GET của Chrome cho blob:,
   KHÔNG phải nhờ cơ chế mới của T5. Đừng trích dẫn "blob an toàn"
   thành tính chất chung cho mọi nguồn.
3. **Đỉnh heap http không-header vẫn y nguyên (đối chứng):**
   http chunked không length: heap 0,7 MiB trong lúc tải →
   **401,2 MiB** lúc `arrayBuffer()` → về 0,7 MiB sau **0,5–0,6 s**
   (1 lần `gc()` + chờ 500 ms; nhanh hơn ~3 s của S4 — thời gian
   này phụ thuộc chu kỳ GC, không phải hằng số).
4. **Click-test fallback full-app: PARTIAL, không phải PASS.**
   Routing fallback ĐÚNG (badge ngược 28/28 mẫu, playhead lùi đơn
   điệu 29,8 → 16,5, `wcHits = 0`, `wcMisses = 242`, app không crash),
   nhưng **frame video thật đầu tiên chỉ xuất hiện ở mẫu 18/28
   (~9 s; lần chạy trước: mẫu 24/28, ~12 s)** — trước đó canvas chỉ
   vẽ nền render `#0a0c10` (mean 12,67) vì skip leo tới 125–284
   trong lúc element seek đuổi target trên GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] (guard K4: seek
   chưa khớp thì skip, không vẽ frame cũ mạo nhận). "Vẽ bình
   thường" chỉ đúng từ khi seek đáp xuống: frame đầu hơi cũ ~2 s
   (trong ngưỡng lag 2 s của K4), frame sau khớp mốc, rồi hold giữ.
   Độ trễ này thuộc đường element cũ, có từ trước — KHÔNG phải do
   code T5 (T5 chỉ sửa controller WebCodecs, vốn đã bị bypass ở đây).
   **Bẫy đo đã sửa trong script:** tiêu chí cũ "mean > 20" và
   "không đen" đều qua được với nền 12,67 trong khi canvas chưa hề
   vẽ frame nào — script nay phân biệt nền (12,67 ± 2) với nội dung
   thật và ghi `firstContentIndex`.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Sửa

- `apps/web/src/lib/reverseWebcodecs.ts` — toàn bộ sửa của luồng:
  - `load()` tạo 1 `AbortController` riêng cho mỗi lần tải; HEAD và
    GET đều nhận `signal` của nó; kiểm tra `aborted` sau HEAD và
    sau khi nhận response GET (kèm `body.cancel()`); kiểm tra
    `largeFile || disposed` sau `arrayBuffer()` để không parse/
    decode buffer đã khóa muộn (phòng tầng fetch phớt lờ signal).
  - `applyKnownFileSize`: size vượt ngưỡng thì
    `abortInFlightLoad()` TRƯỚC khi `rejectLargeFile` khóa; size
    trong ngưỡng không hủy (tải tiếp bình thường).
  - `probeFileSize(signal?)`: nhận signal, truyền xuống fetch HEAD.
  - `dispose()`: hủy fetch đang bay (cùng cơ chế), tránh tải mồ côi.
  - `loadAbort` được xóa trong `finally` của lần tải khi settle, nên
    `applyKnownFileSize` sau đó không hủy nhầm tải cũ.
  - Ghi chú đầu file cập nhật (đợt 37 T5).
- `apps/web/tsconfig.json` — chỉ thêm 1 test mới vào exclude (theo
  tiền lệ R3/S4: test dùng import `.ts` cho Node/esbuild).

### 1.2 Mới

- `apps/web/src/lib/reverseFileCancel37T5.test.ts` — 6 test (xem §3).
- `apps/web/scripts/probe-round37-t5-blob-cancel-pipe.mjs` — probe
  browser đợt này (Chrome thật qua CDP pipe, Xvfb :96 riêng, pattern
  S4; cổng probe 4397 vì 4297 đã có tiến trình khác giữ; profile
  Chrome đặt ở workspace, xem §6).
- `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` —
  click-test full-app đợt này (vite dev cổng 5197, KHÔNG build dist
  để khỏi đua với luồng khác; vite phục vụ source hiện tại gồm sửa
  T5; Xvfb :96).
- `benchmarks/results/v37-t5-blob-cancel.json` — kết quả probe
  (lần chạy cuối, ALL PASS; lần chạy đầu khác ở 2 điểm, xem §2.4).
- `benchmarks/results/v37-t5-fallback-clicktest.json` — kết quả
  click-test (lần chạy cuối, verdict PARTIAL; lần chạy đầu xem §4).
- `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` — file này.

### 1.3 Không đụng (ghi rõ để parent khỏi nghi ngờ)

`preview.tsx` (nhánh element không sửa — chỉ được click-test),
`mp4Demux.ts`, `reversePlayback.ts`, `reverseDecodeAhead.ts`,
`store.ts`, `media.ts`, `assetStore.ts`, mọi harness/probe của luồng
khác, paths-loop, build-loop-log. Dist trên đĩa bị build lại để
kiểm chứng (tài nguyên chia sẻ, không stage dist). File noise chỉ
được đọc từ `~/workspace/tmp-round34-q2/sparse-gop-noise.mp4`
(scratch ngoài repo), không copy vào repo.

## 2. Đo blob file lớn thật + đối chứng http (probe browser, Chrome thật)

### 2.1 Thiết lập đo

- File: `sparse-gop-noise.mp4` của đợt 34 Q2, **419.967.521 byte
  (400,5 MiB)**, h264 1280×720, 30 s, GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'].
- Trình duyệt: Playwright chromium headed qua Xvfb :96, cờ
  `--enable-precise-memory-info` + `--js-flags=--expose-gc`.
- Cờ đường WebCodecs: `window.__vcutReverseWebcodecs = true`;
  đo được `isReverseWebcodecsOptedIn() = true`,
  `resolveReverseEngine() = "webcodecs"`, `VideoDecoder` có sẵn.
- Đo blob: file đưa vào trang bằng CDP `DOM.setFileInputFiles`
  trên `<input type=file>` thật của trang probe → `File.size`
  đọc được đúng 419.967.521, `URL.createObjectURL` như production.
  Cách này giải quyết vấn đề S4 §5.2 nêu (tạo blob 400 MB trong
  trang sẽ tự tốn heap đo): File backed-by-disk không qua JS heap.
- Đo kép: `performance.memory.usedJSHeapSize` (mẫu 50 ms) +
  `gc()` ép buộc; KHÔNG dùng RSS làm claim (S4 đã chứng minh nhiễu).

### 2.2 Kết quả theo phase (lần chạy cuối — số dùng để claim)

| Phase | Thời gian | HEAD / GET | Header GET | arrayBuffer | Heap JS | failed / fallback | retained |
|---|---|---|---|---|---|---|---|
| blob-gate (biết size trước) | 1 ms | 0 / 0 | — | chưa bắt đầu | 0,8 → 0,6 MiB (phẳng) | true / true | 0 |
| blob-naked (không biết size) | 88 ms | 1 / 1 | **"419967521"** | chưa bắt đầu | 0,7 MiB (phẳng) | true / true | 0 |
| http-nohead (chunked, không length) | 17,6 s | 1 / 1 | null | resolve đủ | 0,7 → **401,2** → 0,7 MiB | true / true | 0 |

- blob-gate chứng minh cổng S4 cho scheme blob: bằng số đo thật
  (0 request), không còn là suy luận từ code như S4 §5.2.
- blob-naked chứng minh: Chrome báo `content-length` ở response
  GET của blob: URL (HEAD thì không báo) nên cổng header GET của
  R3 chặn trước khi đọc body. Đây là hành vi của Chrome với blob:,
  chưa đo Safari/Firefox — đừng khái quát thành "mọi trình duyệt".
- http-nohead tái lập đỉnh S4 (401,2 MiB) và đo thời gian hạ:
  **0,6 s** (series `[401,2, 0,7]`: 1 lần `gc()` + chờ 500 ms).
  Lần chạy đầu: 0,5 s. Nhanh hơn ~3 s của S4 — khác biệt này là
  nhiễu chu kỳ GC (S4 chờ 300 ms sau 1 lần gc rồi gc lặp cách nhau
  1 s), không phải cải tiến code: code vứt buffer không đổi, chỉ
  cách đo thời gian hạ khác (poll 500 ms + gc mỗi vòng).

### 2.3 Late-cancel trên route nhỏ giọt (bằng chứng xác định)

Route `/noise-slow.mp4`: server nhỏ giọt 1 MiB / 100 ms (~42 s cho
hết file) để tạo cửa sổ fetch-đang-bay đủ dài. Controller không
biết size; runner chờ GET bắt đầu rồi mới gọi
`applyKnownFileSize(419967521)` (mô phỏng size tới muộn):

| Lần chạy | Server đã gửi lúc abort | Sau 2 s chờ | arrayBuffer | Heap tối đa | failed / fallback |
|---|---|---|---|---|---|
| 1 | 1.048.576 byte (1 MiB, đúng 1 chunk) | 1.048.576 (đứng yên, socket đã đóng) | bắt đầu chờ, **không resolve** | 0,7 MiB | true / true |
| 2 | **0 byte** (abort tới trước chunk đầu) | 0 (đứng yên) | chưa bắt đầu | 0,7 MiB | true / true |

Cả 2 lần: `aborted = true`, `knownFileSizeBytes = 419967521`,
`retainedFileBytes = 0`, không tải lại. Kết luận: abort dừng phía
client thật — body chưa đọc không vào heap, và server ngừng gửi
(đo bằng byte server đã gửi, không phải suy luận từ promise).

### 2.4 Lần chạy đầu của probe (ghi để khỏi ai hỏi vì sao số lệch)

- blob-late lần 1: cổng header GET thắng cuộc đua (GET báo length
  trước khi poll 5 ms trong trang kịp apply) → `applied = false`,
  `arrayBuffer` chưa bắt đầu, heap phẳng. Lần 2: poll kịp →
  `applied = true`, `abortResult = true`, `aborted = true`. Cả 2
  kết cục đều an toàn (không đọc body, heap phẳng) — chỉ khác nhau
  cổng nào thắng cuộc đua trên blob (vì blob GET báo length ngay).
- http-nohead lần 1: tải 13,7 s (thay vì 17,6 s), hạ heap 0,5 s
  (thay vì 0,6 s). Thời gian tải/hạ là nhiễu hệ thống, KHÔNG claim;
  heap đỉnh 401,2 MiB và số request giống hệt cả 2 lần.

### 2.5 Mini-check blob-late (tổng hợp 2 lần chạy)

Late-abort trên blob CÓ THỂ thắng cuộc đua (lần 2) nhưng KHÔNG
CẦN THIẾT để an toàn: nếu nó tới muộn hơn header GET thì cổng GET
của R3 đã chặn trước (lần 1). Vì vậy với nguồn blob:, late-abort
là lớp phòng thủ thứ hai, không phải lớp duy nhất — khác với nguồn
http không-header, nơi late-abort là lớp duy nhất cứu được đỉnh
heap (và đã chứng minh ở §2.3).

## 3. Kiểm chứng (test mới + hồi quy)

### 3.1 Test mới — 6/6 pass

```
./node_modules/.bin/esbuild apps/web/src/lib/reverseFileCancel37T5.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r37t5.test.cjs \
  && node /tmp/r37t5.test.cjs
```

| Test | Chứng minh gì |
|---|---|
| HEAD bay | size lớn tới muộn lúc HEAD bay → hủy HEAD, GET = 0, arrayBuffer = 0, gọi lại không tải lại |
| GET bay | size lớn tới muộn lúc GET bay → arrayBuffer bị reject, không decode, cache = 0, GET vẫn = 1 (không tải lại) |
| Trong ngưỡng tới muộn | size 100 tới muộn lúc HEAD bay → KHÔNG hủy, tải + decode bình thường, cache 2, GET = 1 |
| Fetch phớt lờ signal | buffer fixture hợp lệ resolve SAU khi khóa → vẫn không decode (cache = 0, ready = false) nhờ kiểm tra sau arrayBuffer |
| Registry | size lớn tới muộn qua `getReversePreviewController` → hủy tải của controller đã tạo trước, cùng instance, GET = 0 |
| Dispose | dispose lúc HEAD bay → hủy tải, ensure = false, GET = 0 |

Fixture MP4 dựng tay + fake decoder/fetch sao chép công thức R3/S4;
test chạy TUẦN TỰ như R3/S4. Test KHÔNG cấp phát file lớn thật:
ngưỡng test 1024 byte, size "lớn" là con số 5000 — cùng cách S4
chứng minh cổng production bằng số byte mà không cần file thật.

### 3.2 Bảng trường hợp size tới muộn (hợp đồng đầy đủ sau T5)

| Thời điểm size tới | Hành vi sau T5 | Bằng chứng |
|---|---|---|
| Trước lần fetch đầu | Cổng S4: khóa ngay, 0 request | Probe blob-gate (§2.2) |
| Lúc HEAD đang bay | Abort HEAD, không phát GET | Unit test 1 |
| Lúc GET/body đang bay | Abort, arrayBuffer không resolve dữ liệu | Unit test 2 + probe nhỏ giọt (§2.3) |
| Sau khi HEAD đã trả size nhỏ (known đã set) | First-wins: giữ size HEAD, bỏ qua size muộn | Thiết kế (xem §5.1): HEAD là nguồn có thẩm quyền cho chính URL đó; size muộn mâu thuẫn bị coi là caller sai |
| Sau khi tải xong | Bỏ qua (S4, không đổi) | Test S4 "size tới muộn" vẫn xanh |
| Sau khi arrayBuffer resolve (fetch phớt lờ signal) | Không parse/decode, vứt buffer; đỉnh heap đã xảy ra, không hủy ngược được | Unit test 4 |
| Lúc dispose | Abort tải đang bay | Unit test 6 |

### 3.3 Hồi quy — vẫn xanh

- `tsc --noEmit -p apps/web/tsconfig.json`: exit 0.
- `npm --prefix apps/web run build` (tsc + vite build): pass, 5,84 s.
- `reverseFileHeap36S4`: 6/6 (cổng S4 không bị sửa chạm).
- `reverseFileBuffer35R3`: 10/10 (cổng R3 không bị sửa chạm).
- Probe chạy 2 lần, kết luận giống nhau (xem §2.4).

## 4. Click-test fallback full-app (PARTIAL — đọc kỹ trước khi trích dẫn)

### 4.1 Thiết lập

- App thật qua vite dev cổng 5197 (source hiện tại, gồm sửa T5),
  Chrome thật headed Xvfb :96, seed project rỗng qua autosave (mẫu
  K4), import file noise 420 MB qua input file thật của MediaBin
  (card + duration hiện sau ~4 s), tắt toggle "Tự tạo proxy" trước
  khi import để clip phát bản gốc (đúng điều kiện cổng S4: preview
  chỉ truyền `item.file.size` khi không có proxyUrl), bật cờ
  WebCodecs bằng `window.__vcutReverseWebcodecs = true`, bấm Thêm →
  End (playhead 30,0) → Phát ngược, đo 28 mẫu / 14 s.

### 4.2 Kết quả (lần chạy cuối — verdict PARTIAL)

- Routing fallback ĐÚNG: badge ngược 28/28 mẫu; playhead lùi đơn
  điệu 29,8 → 16,5; `wcHits = 0`, `wcMisses = 242` (mọi lần hỏi
  WebCodecs đều miss — controller khóa fallback file lớn, app dùng
  đường element); app vẫn đáp evaluate sau khi dừng (không crash).
- Nội dung video: mẫu 0–17 canvas chỉ vẽ nền render `#0a0c10`
  (mean đúng 12,67 = (10+12+16)/3), skip leo tới 125, draw = 0 —
  element đang seek đuổi target ngược trên GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'], guard K4 chặn
  draw khi seek chưa khớp nên không có frame nào được vẽ (đúng
  thiết kế guard, nhưng nghĩa là người dùng nhìn nền trống ~9 s).
- Mẫu 18 (playhead 21,0): frame thật đầu tiên, centerMean 181,8 —
  khớp khung hình thật quanh t ≈ 23 s (ground truth ffmpeg §4.3),
  tức frame cũ hơn playhead ~2 s, trong ngưỡng lag 2 s mà K4 cho
  phép (`stepDrawAllowed`). Mẫu 20: draw thứ hai, mean 168,8–169,2
  (khớp t ≈ 20–21), rồi hold giữ tới hết (hold 116, maxHoldAge
  1,8 s — hold frame thật, đúng thiết kế K4).
- Lần chạy đầu (logic tiêu chí cũ, từng ghi PASS — nay đính chính):
  cùng hình dạng: frame thật đầu ở mẫu 24/28 (~12 s, playhead
  16,8, mean 148,1 khớp t ≈ 17–18), draw 1, hold 54, skip 284,
  misses 338, playhead 29,4 → 15,2. Nhãn PASS cũ là SAI vì tiêu chí
  cũ không phân biệt nền với nội dung (xem §4.4) — verdict đúng
  của cả 2 lần chạy là PARTIAL.

### 4.3 Ground truth nội dung (ffmpeg, trích frame PNG + PIL)

Center 100×100 (RGB mean) của file noise theo thời gian — độ sáng
TĂNG dần theo thời gian (file "nhiễu thời gian"):

| t (s) | 0 | 15 | 17 | 20 | 25 | 29 |
|---|---|---|---|---|---|---|
| centerMean | 35,2 | 125,7 | 140,5 | 162,3 | 194,4 | 214,4 |

Đối chiếu: 12,67 (mẫu 0–17 click-test) không khớp bất kỳ mốc nào
→ đó là nền, không phải frame; 148,1 (lần 1, playhead 16,8) và
181,8/168,8 (lần 2, playhead 21,0/20,5) đều nằm trong dải nội dung
thật → đó là frame video thật (lần 2: frame đầu cũ ~2 s, frame sau
khớp mốc). Không có mẫu nào là đen (0) — nhưng "không đen" không
đồng nghĩa "có nội dung" (xem §4.4).

### 4.4 Bẫy đo đã phát hiện và sửa (quan trọng cho luồng sau)

Tiêu chí click-test cũ ("centerMean > 20 là sáng", "không có mẫu
< 5 là không đen") đều qua được với nền `#0a0c10` (mean 12,67):
nền không đen (12,67 > 5) nhưng cũng không phải nội dung. Script
nay phân biệt nền (12,67 ± 2) với nội dung thật và ghi
`firstContentIndex` (lần cuối: 18; lần đầu: 24). Mọi click-test sau
đo canvas preview phải trừ nền render ra trước khi kết luận "đã
vẽ" — mean > 0 không chứng minh được gì.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **Size muộn sau khi HEAD đã trả size nhỏ thì bị bỏ qua
   (first-wins).** Đây là lựa chọn thiết kế có chủ ý (HEAD là nguồn
   có thẩm quyền cho URL đó), nhưng nếu server báo HEAD sai (nhỏ
   hơn thật) thì cổng muộn không cứu được — chỉ còn cổng header
   GET và cổng sau-tải (kèm đỉnh heap) đỡ. Trường hợp server báo
   sai chưa có test/probe (cần server cố tình báo sai — chưa làm).
2. **Abort không thu hồi phần body tầng network đã đệm.**
   Đo được server ngừng gửi (0 → 0, 1 MiB → 1 MiB), nhưng phía
   client, phần body đã vào socket buffer trước abort vẫn được
   giải phóng theo chu kỳ riêng của network stack — không đo được
   bằng JS heap và không claim "0 byte lãng phí tuyệt đối".
3. **Range theo GOP vẫn chưa làm (nợ đứng từ R3/S4).**
   Moov-trước + hợp đồng Range cho mọi nguồn preview vẫn còn
   nguyên; file > 128 MiB vẫn fallback element trong mọi phase đo.
   Dữ kiện mới của T5 (blob: GET báo length) chỉ giúp cổng chặn
   sớm cho blob:, không thay thế demux mảnh.
4. **Nguồn http/proxy KHÔNG được claim hộ.**
   Late-abort chứng minh trên route http tự dựng (nhỏ giọt) và
   blob: local. Proxy bridge thật (hợp đồng Range/header của nó,
   bridge không nằm trong repo này) chưa đo — preview khi có
   proxyUrl còn không truyền `item.file.size` nên cổng S4 không áp
   dụng, chỉ còn cổng HEAD/GET của R3 + late-abort nếu caller nào
   đó truyền size muộn.
5. **Click-test PARTIAL là nợ của đường element cũ, không phải T5.**
   Frame thật đầu tiên tới muộn ~9–12 s trên file GOP 30 [đính chính 46-B5: trước đây ghi 'GOP thưa'] 420 MB
   (skip 125–284, canvas nền trong lúc đó). Muốn "vẽ bình thường"
   ngay từ giây đầu trên file này cần cải tiến đường element
   (prefetch/seek) — thuộc luồng sở hữu preview, không làm lén ở
   đây. Forward-play ấm trước rồi mới reverse có thể cho frame sớm
   hơn, nhưng chưa chạy nên không claim.
6. **Chưa đo:** Safari / Firefox (blob: GET có báo length không?),
   máy thật / dpr > 1, fps ngược sau sửa (R3 §5.5 vẫn mở),
   `Cache-Control: no-store` có làm heap hạ nhanh hơn không (S4
   §5.5 vẫn mở).
7. **Bài học harness (đã sửa trong script đợt này):** /tmp là tmpfs
   512M — 1 lần probe file 420 MB đã phình profile Chrome tới
   **476M** và làm đầy /tmp (ffmpeg trích frame báo "No space left
   on device") cho tới khi dọn tay. Cả 2 script đợt này nay đặt
   profile Chrome ở workspace (`tmp-round37-t5-chrome-*`) và tự dọn
   khi xong; probe sau với file lớn phải làm theo, không dùng
   `os.tmpdir()` cho profile Chrome nữa.

## 6. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/reverseWebcodecs.ts` (sửa)
- `apps/web/src/lib/reverseFileCancel37T5.test.ts` (mới)
- `apps/web/tsconfig.json` (sửa, chỉ thêm 1 exclude)
- `apps/web/scripts/probe-round37-t5-blob-cancel-pipe.mjs` (mới)
- `apps/web/scripts/clicktest-round37-t5-fallback-pipe.mjs` (mới)
- `benchmarks/results/v37-t5-blob-cancel.json` (mới)
- `benchmarks/results/v37-t5-fallback-clicktest.json` (mới)
- `docs/PHASE9_ROUND37_T5_BLOB_CANCEL_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Fixture noise 419.967.521 byte nằm ngoài repo tại
`~/workspace/tmp-round34-q2/sparse-gop-noise.mp4` — KHÔNG đưa vào
batch. Profile Chrome probe/click-test đã tự dọn (không còn thư mục
`tmp-round37-t5-chrome-*` trong workspace sau khi chạy).
