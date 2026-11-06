# Phase 9 đợt 39, luồng T5 — Relink/alias bền vững: đo ingest file lớn, UI tiến trình, chống mất alias khi đua, dọn alias thừa

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo. Đóng nợ §5 mục 6
> của `docs/PHASE9_ROUND38_LIMITS.md` (nợ đợt 38 U3): (a) chưa đo ingest
> file hàng trăm MB; (b) chưa có UI tiến trình cho relink/ingest;
> (c) hai `addAlias` song song có thể mất một alias; (d) alias thừa
> (trùng tên thật, tạo trước guard) chưa có luồng dọn; (e) project cũ
> ingest trước đợt 38 vẫn Relink một lần rồi mới bền.
>
> Kết quả: test mới 11/11 + test U3 cũ 7/7 + hồi quy xanh (assetStore
> 22/22, importAsset37T3 8/8, rehydrate36S5 19/19) + tsc 0 + vite build
> pass + đo ingest thật trên file MP4 261,0 MiB (xem §2). Panel tiến
> trình mới chỉ được kiểm chứng qua tsc + build, CHƯA click-test trên
> trình duyệt thật — xem §4.

## 1. Đã làm gì

### 1a. Đo ingest file hàng trăm MB thật (§2)

File đo: `slice-16s.mp4`, 273.698.336 byte = 261,0 MiB, video 720p
16,07 s, tạo bằng ffmpeg: render testsrc2 720p 120 s gắn noise
(`testsrc2 + noise=alls=25`, libx264 crf 14) rồi cắt lát 16 s bằng
stream-copy (`-ss 10 -t 16 -c copy`) — vẫn là video thật, ffprobe +
decode 1 frame OK. (Bản render gốc 120 s phình tới 1,8 GB do noise nên
không dùng trực tiếp: RAM máy đo chỉ ~1,3 GB trống; file 1,8 GB đã xoá,
chỉ giữ lát 16 s + script đo ở `~/workspace/t5-measure/`, ngoài repo.)

Script đo: `~/workspace/t5-measure/measure.mjs` (chạy bằng Node 24,
`--expose-gc`, đọc file thành Blob theo chunk để tránh một bản copy
thừa). Kết quả đầy đủ ở §2; tóm tắt: WebCrypto một lần 0,9 s nhưng
cộng +543 MB RSS (ArrayBuffer toàn file); băm tăng dần 9,3 s, không
tốn thêm RSS; ingest có tiến trình trọn vẹn 9,2 s, 35 sự kiện, hash
khớp WebCrypto từng byte.

Lưu ý trung thực: fake IndexedDB trong script đo chỉ giữ tham chiếu
Blob (không copy, giống mẫu test đợt 38 U3) — chi phí ghi đĩa IDB thật
của Chromium CHƯA được đo. Số đo này chứng minh được chi phí băm +
bộ nhớ phía JS, không phải thời gian ghi IDB thật.

### 1b. Băm SHA-256 tăng dần + ingest có tiến trình

Mới: `apps/web/src/lib/ingestProgress39T5.ts`.

- `Sha256Incremental`: SHA-256 thuần JS (FIPS 180-4), `update()` nhiều
  lần rồi `digest()` một lần. Khoá đúng bằng test so với
  `crypto.subtle.digest` trên 11 độ dài (kể cả biên padding 55/56/64)
  và trên blob 25 MB.
- `hashBlobIncremental(blob, onProgress, chunkSize = 8 MiB)`: đọc Blob
  theo lát, báo `IngestProgressEvent { phase: "hashing", bytesDone,
  totalBytes }` sau mỗi lát. Tiến trình đơn điệu, sự kiện cuối đúng
  tổng byte.
- `formatBytes` / `ingestPercent`: hiển thị "123,4 MB", % làm tròn
  xuống; % CHỈ có ý nghĩa ở pha hashing.
- `AssetStore.ingestWithProgress` (assetStore.ts): cùng ngữ nghĩa dedup
  với `ingest` (đã tách `putManifest` dùng chung để hai đường không
  lệch nhau), nhưng băm theo lát rồi báo pha `"storing"` trước khi ghi
  IDB và `"done"` sau khi ghi. Pha storing là một lần `put` nguyên tử
  nên KHÔNG có % theo byte — callback chỉ báo pha, UI hiển thị đúng
  như vậy, không nội suy %.
- Hybrid (quyết định kỹ thuật, xem §3): file ≤ 64 MiB
  (`INGEST_CHUNKED_THRESHOLD`) dùng WebCrypto một lần cho nhanh,
  callback chỉ nhận một sự kiện hashing chốt 100% (báo "đã băm xong",
  không phải tiến trình từng lát). File lớn hơn mới băm theo lát.
  Nhờ đó relink file nhỏ không phải trả giá băm thuần JS (~10× chậm).
- `ingestImportedItemWithProgress` (importAsset37T3.ts): như helper cũ
  nhưng dùng đường có tiến trình khi store có method, fallback về
  `ingest` thường khi store không có method (`progressUsed = false`),
  không bao giờ throw như helper cũ.

### 1c. UI tiến trình cho relink (không spinner mù)

`RelinkPanel.tsx` + nối dây `App.tsx` + `store.ts`:

- `store.relinkMedia(oldSrc, file, onProgress?)`: tham số thứ ba tuỳ
  chọn; có callback thì ingest bằng đường có tiến trình, không có thì
  giữ đường cũ (WebCrypto nhanh). Chữ ký cũ không đổi hành vi khi
  không truyền callback.
- Panel truyền callback xuống store và hiển thị khối trạng thái sống
  (`role="status"`, `aria-live="polite"`), luôn nêu rõ pha + số liệu:
  - Chưa có sự kiện ingest (đang probe file): "Đang đọc {tên} ({dung
    lượng})…".
  - Pha hashing: "Đang tính mã băm: {đã băm} / {tổng} ({percent}%)" +
    thanh tiến trình thật (chỉ pha này mới có thanh %).
  - Pha storing: "Đang lưu vào kho: {tên} (đã băm xong {tổng}, đang
    ghi — bước này không có %)" — không thanh %, không bịa số.
  - Pha done: "Đã lưu xong {tên} ({tổng})".
  - Lỗi: vẫn dùng khối lỗi cũ (`res.message` hoặc exception) — ingest
    best-effort nên lỗi ingest không làm hỏng relink trong phiên, panel
    không báo lỗi giả cho trường hợp đó (giữ nguyên ngữ nghĩa đợt 38).
- i18n: thêm section `relink` (reading/hashing/storing/done/cleanup/
  cleanupDone/cleanupNone/cleanupError) vào `vi.json` + `en.json`;
  panel dùng `t()` + `useLang()` theo mẫu BgRemovePanel.

### 1d. Chống mất alias khi hai addAlias song song

`AssetStore` thêm hàng đợi tuần tự hoá theo assetId (`aliasQueues`):

- Mọi thao tác alias (`addAlias`, `addAliases`, từng bước của
  `cleanupStaleAliases`) chạy nối tiếp trong cùng instance, đọc
  manifest TƯƠI sau khi thao tác trước đã ghi xong. Hai `addAlias`
  song song cùng asset nay đều sống sót (test race 10 lời gọi gồm
  trùng lặp → đủ 8 alias duy nhất; hai `addAliases` song song → đủ 5).
- Chuỗi chờ luôn resolve (lỗi của thao tác trước không kẹt thao tác
  sau); caller vẫn nhận đúng kết quả/lỗi của chính mình.
- Guard cũ giữ nguyên (từ chối: asset không tồn tại, alias rỗng,
  alias trùng tên chính mình, alias trùng originalName của asset khác)
  — test guard vẫn xanh sau khi tuần tự hoá.
- Mới: `addAliases(assetId, aliases)` — ghi nhiều alias, trả về số
  alias thực sự xuất hiện mới (so snapshot trước/sau; alias đã có /
  bị guard từ chối không tính). Lưu ý: khi hai batch song song, mỗi
  batch chụp snapshot `before` lúc bắt đầu nên cùng một alias có thể
  được cả hai batch đếm là "mới" — đó là đúng ngữ nghĩa theo-batch,
  bất biến quan trọng là tập alias cuối đủ và không trùng (test ghi
  rõ điều này thay vì assert số đếm tuyệt đối dưới đua).
- Giới hạn: khoá chỉ có hiệu lực trong MỘT instance AssetStore (một
  tab). Hai tab cùng mở vẫn có thể đua qua IndexedDB thật — xem §4.

### 1e. Dọn alias thừa + đường relink một lần cho project cũ

- `AssetStore.cleanupStaleAliases()`: quét mọi manifest, xoá alias
  trùng originalName của bất kỳ manifest nào (loại alias chỉ tồn tại
  khi được ghi trước guard đợt 38, hoặc khi tên thật xuất hiện SAU
  khi alias đã ghi — test dựng đúng kịch bản này: ghi alias
  "nick.mp4" khi chưa có asset tên đó, rồi ingest bytes khác dưới tên
  "nick.mp4" → alias cũ thành thừa → cleanup xoá đúng nó, giữ alias
  lành, lần cleanup thứ hai không xoá thêm). Trả về báo cáo
  `{ scanned, cleaned, removed: [{ assetId, alias }] }`. Từng bước dọn
  chạy qua hàng đợi alias của asset nên không đua với `addAlias` đang
  bay trong cùng instance.
- UI: nút "🧹 Dọn alias thừa" ở chân RelinkPanel (chỉ hiện khi App
  nối `onCleanupAliases`), gọi `store.cleanupStaleAliases()` (toast
  kết quả) và hiển thị báo cáo bằng chữ trong panel. Nút disabled
  trong lúc relink/cleanup đang chạy. Chỉ chạy khi không có
  import/relink đang bay (panel vốn chỉ mở khi user đang xử lý media
  thiếu — đúng ngữ cảnh project cũ).
- Đường relink một lần cho project cũ: `relinkMedia` nay, ngoài alias
  cho tên mới `n`, còn ghi thêm alias cho tên cũ `oldSrc` khi khác
  `n` (best-effort). Nhờ đó project khác dùng chung kho mà vẫn trỏ
  tên cũ cùng bytes cũng bền từ lần relink này; guard từ chối nếu
  `oldSrc` là tên thật của asset khác nên không che tên thật, và clip
  trong project hiện tại đã được `relinkAsset` đổi sang `n` nên alias
  cũ không ảnh hưởng project này. Test legacy mô phỏng trọn vẹn:
  ingest trước đợt 38 (không alias) → plan không khớp tên cũ → relink
  một lần (ingest lại cùng bytes + alias) → plan khớp qua alias.
- `planRehydrate` vốn đã ưu tiên tên thật nên alias thừa không bao giờ
  che asset khác — cleanup chỉ làm sạch manifest, không sửa hành vi
  khớp (không đổi rehydrate36S5.ts).

## 2. Số đo ingest thật (file 261,0 MiB)

Máy đo: VM Linux, Node v24.22.1, RAM 8 GB (lúc đo còn ~1,3 GB trống).
File: `slice-16s.mp4`, 273.698.336 byte, 720p, 16,07 s, ffmpeg
testsrc2 + noise, stream-copy. Hash SHA-256 của file:
`59d5d63217fcd23cfa914c0b456dfdc261f31c286a2f59c48d1ee0ae0861fa5b`
(khớp nhau ở cả ba đường đo — bằng chứng băm tăng dần đúng).

| Đường đo | Thời gian | Tốc độ | Bộ nhớ (RSS) | Sự kiện tiến trình |
|---|---|---|---|---|
| WebCrypto một lần (`sha256Hex`, đường ingest cũ) | 889 ms | 293,6 MB/s | +543 MB (ArrayBuffer toàn file) | không có |
| Băm tăng dần 8 MiB (`hashBlobIncremental`) | 9.333 ms | 28,0 MB/s | −292 MB sau GC (không bản copy toàn file) | 33 sự kiện hashing, chốt đúng 273.698.336 byte |
| `ingestWithProgress` trọn vẹn (băm + fake IDB put) | 9.186 ms | 28,4 MB/s | +0 MB (put giữ tham chiếu Blob) | 35 sự kiện, pha hashing → storing → done, manifest khớp hash, `list()` = 1 |

Đọc thêm từ số đo:

- Giá của % thật là ~10× thời gian băm (28 vs 294 MB/s) — đó là lý
  do có ngưỡng hybrid 64 MiB (§1b): file nhỏ dùng WebCrypto, chỉ file
  lớn mới trả giá này. Với tốc độ này, file 1 GB băm theo lát mất
  ~36 s — panel hiển thị % thật trong suốt thời gian đó, không phải
  spinner mù, nhưng user vẫn phải chờ (không có cách nào nhanh hơn mà
  vẫn băm tăng dần bằng JS thuần trong trình duyệt hiện tại — xem §4).
- Đường cũ tốn thêm một ArrayBuffer toàn file (+543 MB cho file 261
  MB): trên máy yếu, relink file ~1 GB bằng đường cũ có thể chạm trần
  RAM; đường có tiến trình tránh được bản copy này (chỉ giữ Blob gốc
  + lát 8 MB).
- Tốc độ băm thuần JS trong trình duyệt thật sẽ khác Node (V8 giống
  nhau về engine nhưng JIT + tải tab khác nhau) — số trên là số Node,
  không claim là số Chrome.

## 3. Quyết định kỹ thuật (ghi để luồng sau khỏi làm lại)

1. **Tiến trình chỉ cho pha hashing, không bịa % cho pha storing.**
   IDB `put` là nguyên tử, không có callback theo byte — UI nào hiển
   thị % mượt trong lúc ghi đều là bịa. Panel nêu rõ "đang ghi — bước
   này không có %" thay vì thanh % giả.
2. **Hybrid 64 MiB, không phải lúc nào cũng băm theo lát.** Dưới
   ngưỡng, WebCrypto nhanh tới mức tiến trình từng lát vô nghĩa
   (64 MiB ≈ 0,2 s); trên ngưỡng, % thật đáng giá hơn 10× thời gian.
   Ngưỡng nằm ở `INGEST_CHUNKED_THRESHOLD`, đổi một chỗ là đổi cả
   đường relink.
3. **Khoá alias theo instance, không khoá toàn cục.** IndexedDB không
   có lock liên tab sẵn dùng cho việc này mà không thêm BroadcastChannel
   / Web Locks (Web Locks không có trên mọi trình duyệt mục tiêu và
   thêm độ phức tạp); các đường gọi trong app đều qua một instance
   store mỗi lần import/relink nên khoá theo instance đã đóng được nợ
   đợt 38. Đua liên tab còn mở — xem §4.
4. **Cleanup xoá alias trùng tên thật, không xoá alias "lạ".** Alias
   không khớp tên thật nào vẫn có thể là tên bí danh hợp lệ của
   project cũ (đó chính là mục đích của alias) — chỉ alias trùng tên
   thật mới chắc chắn thừa.
5. **Relink ghi thêm alias cho tên cũ.** Rẻ (một lần put best-effort),
   an toàn nhờ guard, và tăng bền cho project khác dùng chung kho.
6. **Import đuôi `.ts` trong code app mang `@ts-ignore` có chủ đích**
   (tiền lệ nestedPreview.ts): Node strip-types cần đuôi `.ts`, tsc
   bundler không bật `allowImportingTsExtensions` nên báo TS5097.
   Test file thì thêm vào tsconfig exclude như mọi test khác (đợt này
   thêm `relink39T5.test.ts`).

## 4. Cái gì chưa làm / chưa chứng minh (trung thực)

- **Panel tiến trình chưa click-test trên trình duyệt thật:** mới qua
  tsc + vite build. Cần một probe như đợt 38 U3 (import/relink file
  lớn qua UI thật, chụp nhãn pha + thanh % ở giữa chừng) trước khi
  claim UI chạy đúng trên Chrome thật.
- **Ghi đĩa IDB thật chưa đo:** script đo dùng fake IDB giữ tham
  chiếu; thời gian `put` 261 MB vào IndexedDB Chromium thật (structured
  clone + ghi đĩa) chưa biết, có thể cộng thêm giây đáng kể sau pha
  hashing — và trong lúc đó panel chỉ hiện "đang ghi" không %.
- **Đua alias liên tab:** khoá chỉ trong một instance; hai tab cùng
  mở, cùng addAlias một asset vẫn có thể mất alias (IDB thật không có
  transaction đọc-ghi nguyên tử kiểu này ở tầng AssetStore). Cần Web
  Locks / BroadcastChannel nếu muốn đóng triệt để.
- **Quota IDB bị evict / Safari / máy thật / tab ẩn hàng giờ:** kế thừa
  giới hạn đợt 38 U3 — alias + manifest mất cùng nhau thì Relink như
  cũ, không có cơ chế phục hồi.
- **Tốc độ băm trên Chrome thật / máy yếu:** số §2 là số Node; file
  1 GB băm theo lát ~36 s là ngoại suy từ 28 MB/s, chưa đo.
- **Đường importFiles thường (không qua relink) vẫn dùng ingest cũ
  không tiến trình:** nhiệm vụ đợt này là UI tiến trình cho
  relink/ingest, nhưng importFiles hàng loạt file lớn vẫn không hiện
  % (chỉ relink panel mới có). Luồng sau có thể nối
  `ingestImportedItemWithProgress` vào importFiles nếu muốn — code đã
  sẵn, chỉ cần UI nhận callback theo từng file.

## 5. Kết quả kiểm chứng

- Test mới `relink39T5.test.ts`: **11/11, exit 0** — băm tăng dần ==
  WebCrypto (11 độ dài, lát lẻ 7 byte); tiến trình đơn điệu + chốt
  đúng tổng byte (blob 5 MB, 6 sự kiện); hybrid file nhỏ (1 MB, 1 sự
  kiện hashing chốt 100%); chunked file 65 MiB (9 lát); dedup qua
  ingestWithProgress; race 10 addAlias song song (đủ 8 alias duy nhất);
  hai addAliases song song (đủ 5 alias); guard sau tuần tự hoá;
  cleanup alias thừa + lần 2 rỗng; legacy một lần khớp qua alias;
  helper có tiến trình + fallback store cũ.
- Test cũ đợt 38 U3: **7/7** (`relinkDedup38U3.test.ts`, chạy lại sau
  mọi sửa — addAlias nay đi qua hàng đợi nhưng vẫn xanh).
- Hồi quy: `assetStore.test.ts` 22/22, `importAsset37T3.test.ts` 8/8,
  `rehydrate36S5.test.ts` 19/19.
- `tsc --noEmit` (apps/web): **0 lỗi** (lỗi `reverseWebcodecs.ts`
  của luồng khác thấy ở lần chạy đầu đã biến mất ở lần chạy cuối —
  luồng khác tự sửa, luồng này không đụng file đó).
- `vite build` (ra /tmp, không đè dist repo): pass.
- Đo file lớn: xem §2 (script + file lát ở `~/workspace/t5-measure/`,
  ngoài repo; file render gốc 1,8 GB đã xoá).

## 6. File đổi / thêm (chỉ file text, KHÔNG binary, KHÔNG push)

Mới:

- `apps/web/src/lib/ingestProgress39T5.ts` — SHA-256 tăng dần, kiểu
  sự kiện tiến trình, `formatBytes`/`ingestPercent`, ngưỡng hybrid.
- `apps/web/src/lib/relink39T5.test.ts` — 11 test (§5).

Sửa:

- `apps/web/src/lib/assetStore.ts` — `putManifest` dùng chung cho hai
  đường ingest; `ingestWithProgress` (+ hybrid 64 MiB); hàng đợi alias
  `aliasQueues`/`enqueueAliasOp`; `addAlias` tuần tự hoá;
  `addAliases`; `cleanupStaleAliases` + kiểu `StaleAliasReport`/
  `StaleAliasRemoval`; import đuôi `.ts` kèm `@ts-ignore` (xem §3.6).
- `apps/web/src/lib/importAsset37T3.ts` — thêm
  `ingestImportedItemWithProgress` (+ kiểu store có method tiến
  trình); helper cũ không đổi hành vi.
- `apps/web/src/store.ts` — `relinkMedia` nhận thêm `onProgress?`
  (đường có tiến trình khi có callback, đường cũ khi không) + ghi
  thêm alias cho tên cũ `oldSrc`; thêm action `cleanupStaleAliases`
  (toast kết quả).
- `apps/web/src/components/RelinkPanel.tsx` — khối tiến trình sống
  (pha + byte + % + thanh chỉ ở pha hashing), khối báo cáo cleanup,
  nút "Dọn alias thừa", prop `onPick` nhận thêm callback tiến trình,
  prop `onCleanupAliases?` mới.
- `apps/web/src/App.tsx` — nối RelinkPanel: `onPick` truyền callback
  tiến trình xuống `relinkMedia`, `onCleanupAliases` nối tới store.
- `apps/web/src/i18n/vi.json` + `apps/web/src/i18n/en.json` — thêm
  section `relink` (8 key, vi + en).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (mẫu
  chung, như đợt 38 U3).

Không đụng: `rehydrate36S5.ts`, `relink.ts`, `projectRepo.ts`,
`MediaBin.tsx`, `ExportPanel.tsx`, mọi file của luồng khác. Script đo
và file MP4 đo nằm ở `~/workspace/t5-measure/` (ngoài repo), bundle
build nằm ở /tmp — không vào repo, không vào batch push.
