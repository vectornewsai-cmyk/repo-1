# Phase 9 đợt 40, luồng V5 — Relink/alias: % cho importFiles thường, click-test panel, đo IDB thật, khoá alias liên tab

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG tạo
> batch paths (theo lệnh luồng: chỉ trả danh sách file + test + nợ).
> Đóng nợ §5 mục 5 của `docs/PHASE9_ROUND39_LIMITS.md`: (a) đưa % vào
> importFiles thường; (b) click-test panel tiến trình trên browser
> thật; (c) đo chi phí ghi đĩa IDB Chromium thật (đợt 39 chỉ đo bằng
> fake IDB); (d) đua alias liên tab.

## 1. Đã làm gì

### 1a. % tiến trình cho importFiles thường (store + MediaBin)

- `store.importFiles(files, onProgress?)`: tham số thứ hai tuỳ chọn.
  Khi có callback, vòng ingest dùng đúng helper đợt 39 T5
  (`ingestImportedItemWithProgress`) và bọc mỗi sự kiện thành
  `ImportFileProgressEvent` (`ingestProgress39T5.ts` mới): thêm
  `fileIndex` (0-based trên danh sách item đã chốt tên),
  `fileCount`, `fileName`. Khi KHÔNG có callback, helper tự fallback
  về ingest thường (WebCrypto nhanh, không tiến trình) — mọi caller
  cũ không đổi hành vi, không đổi chữ ký bắt buộc.
- Ngữ nghĩa pha/% giữ nguyên đợt 39 T5, không bịa số: % chỉ thật ở
  pha hashing; pha storing chỉ báo "đang ghi — bước này không có %".
  File ≤ 64 MiB dùng nhánh WebCrypto: một sự kiện hashing chốt 100%
  (báo "đã băm xong", không phải tiến trình từng lát).
- `MediaBin.tsx`: state `importProgress`, truyền callback vào
  `importFiles`, hiện banner `role="status"` + `data-import-progress`
  (pha hiện tại) với thanh % chỉ ở pha hashing; banner xoá ngay khi
  `importFiles` resolve (trước vòng proxy tự động) để không lẫn hai
  giai đoạn. i18n: thêm section `importProgress`
  (hashing/storing/done) vào `vi.json` + `en.json`, đủ hai ngôn ngữ,
  kiểm tra vi-only = en-only = [].
- Phạm vi UI trung thực: % chỉ hiện ở đường nhập qua MediaBin (đường
  nhập chính). Các caller khác của `importFiles` (ExportPanel,
  StickerPanel, ProjectMenu, TtsButton, BgRemovePanel,
  TemplatePackModal) vẫn gọi không callback nên chưa hiện % — store
  đã sẵn, chỉ cần truyền callback + banner ở các panel đó nếu luồng
  sau muốn mở rộng. Đây là giới hạn hiển thị, không phải thiếu đường
  dữ liệu.

### 1b. Khoá alias liên tab bằng Web Locks (thay cho giới hạn một tab)

- `AssetStore` thêm option `locks?: LockManagerLike | null` (mặc định
  đọc `navigator.locks` nếu có) và `withAliasLock` bọc trong
  `enqueueAliasOp`: mọi thao tác alias (addAlias, addAliases từng
  bước, từng bước cleanup) nay chạy trong
  `locks.request("vcut-alias:<assetId>", op)` — lock theo từng
  assetId, assetId chỉ chứa `a_` + hex nên an toàn làm tên lock.
- Thứ tự lồng: hàng đợi trong-tab trước, lock liên tab trong — op chỉ
  xin lock sau khi op trước cùng instance xong nên cùng một tab
  không tự deadlock; `addAliases` gọi `addAlias` tuần tự nên không
  lồng lock. Web Locks là mutex thật theo origin (mọi tab/iframe/
  worker cùng origin), tự giải phóng khi tab giữ nó đóng/crash — hơn
  hẳn flag localStorage (không có compare-and-set nguyên tử, tab
  crash để lại flag kẹt). Không dùng BroadcastChannel thay thế:
  election bằng message không có mutual exclusion nguyên tử, phức tạp
  hơn mà yếu hơn API có sẵn. Hỗ trợ theo tài liệu công khai: Chrome
  69+, Firefox 96+, Safari 15.4+ (Baseline Widely Available);
  localhost là secure context nên dùng được.
- Fallback khi `locks.request` throw (trình duyệt lạ, lock bị abort):
  vẫn chạy op không khoá liên tab thay vì làm hỏng ghi alias — hàng
  đợi trong-tab vẫn giữ, nhưng bảo đảm liên tab của lần gọi đó mất.
  Fallback này được khoá bằng test và ghi rõ ở đây, không giấu.
  Trình duyệt không có `navigator.locks` thì giữ nguyên giới hạn một
  tab của đợt 39 T5 (code không tự bịa lock).
- Cleanup cũng đi qua lock từng asset (đã đọc manifest tươi trong
  hàng đợi từ đợt 39, nay thêm lock nên tab kia ghi alias giữa chừng
  cũng không bị cleanup ghi đè — khoá bằng test hai ngữ cảnh).

### 1c. Click-test panel + đo IDB thật trên Chromium thật

Probe CDP (mẫu đợt 38 U3, script + kết quả JSON ở ngoài repo, xem
§2): bundle probe build riêng ra `~/workspace/tmp-round40-v5/dist`
(KHÔNG đè dist repo), Chrome headless-new Playwright chromium-1248,
profile mới, file MP4 thật 68.485.872 byte = 65,3 MiB (ffmpeg
testsrc2 720p 60 s + noise, crf 14 — vừa vượt ngưỡng chunked 64 MiB
để có 9 lát băm), import qua input file của MediaBin sau khi tắt
proxy tự động, poll banner mỗi ~100 ms. Kết quả: **5/5 check PASS**
(xem §2).

## 2. Số đo thật (Chromium headless, KHÔNG phải baseline quiet)

Điều kiện bắt buộc khi trích số này: máy đang chạy song song các
luồng đợt 40 khác (nhiều Chrome, tải cao) — mọi số dưới đây đều là
số **under-load**, cấm dùng làm baseline quiet hay claim tốc độ
chuẩn. Poll banner 100 ms nên mốc pha có sai số ±~100 ms + một vòng
CDP evaluate.

| Đo | Kết quả | Ghi chú |
|---|---|---|
| Banner hashing, file 65,3 MiB | 8 mẫu: 12% → 24% → 36% → 48% → 61% → 73% → 85% → 97%, đơn điệu, mỗi bước đúng 8,0 MB | % thật theo lát, không nội suy; mẫu đầu ở +5.292 ms (đã gồm probe file trước ingest) |
| Pha hashing (từ mẫu đầu tới storing) | ≈ 14.356 ms | Chậm hơn nhiều so với Node đợt 39 (28 MB/s): băm JS thuần trong tab headless đang tải nặng chỉ ~4–5 MB/s theo khoảng cách giữa các lát (~1,6–2,1 s/lát 8 MiB, có một khoảng 3,4 s). Đây là số under-load, không phải tốc độ Chrome lúc yên |
| Pha storing = IDB put 65,3 MB | ≈ 11.626 ms | **Lần đầu đo ghi đĩa IDB thật** (đợt 39 dùng fake IDB giữ tham chiếu, không đo được). Pha này là một transaction put manifest + blob; banner xoá ngay sau khi importFiles resolve (file này không nameMismatch nên không có addAlias thêm). Sai số poll như trên |
| Tổng import 1 file 65,3 MiB | 31.274 ms (banner xuất hiện → bin có file) | Gồm probe file + băm + ghi IDB |
| Manifest IDB thật sau import | `big-60s.mp4`, size đúng 68.485.872 byte | Đọc bằng getAll trong page thật; 2 manifest mẫu cũ (mau-1/mau-2.webm) không liên quan |
| Web Locks liên tab Chromium thật | PASS: page 1 giữ `vcut-probe-lock` → page 2 xin cùng lock không vào được trong 2 s chờ; nhả lock page 1 → page 2 vào ngay | Chứng minh nguyên thuỷ lock liên tab trên Chromium thật (2 page cùng origin, CDP). Xem §4 về phần chưa chứng minh ở tầng AssetStore |

## 3. Quyết định kỹ thuật (ghi để luồng sau khỏi làm lại)

1. **importFiles giữ đường nhanh khi không cần %.** Callback là tuỳ
   chọn để các đường gọi không-UI (template pack, TTS, bg-remove…)
   không phải trả giá băm JS thuần ~10× chậm chỉ để lấy % mà không
   ai xem.
2. **Web Locks, không BroadcastChannel, không localStorage-flag.**
   Lý do ở §1b. Lock theo assetId (hạt mịn) thay vì một lock toàn
   cục: hai asset khác nhau không chặn nhau.
3. **Lock throw thì chạy tiếp không lock, không fail ghi alias.**
   Alias là best-effort trong import/relink (lỗi chỉ mất bền vững,
   không hỏng import trong phiên) nên fail-closed ở đây sẽ làm hại
   user nhiều hơn là cứu; giới hạn được ghi rõ thay vì giấu.
4. **Số đo under-load không được trích làm baseline.** Mọi số §2 đều
   gắn điều kiện tải nặng; phiên quiet sau này phải đo lại trước khi
   chốt ngưỡng hay claim hiệu năng.

## 4. Cái gì chưa làm / chưa chứng minh (trung thực)

- **Đua alias tầng AssetStore giữa 2 tab Chromium thật CHƯA chứng
  minh end-to-end.** Đã chứng minh được hai mắt xích riêng: (i) unit
  test: AssetStore đi qua `locks.request` đúng tên lock, 2 instance
  chung DB + chung fake lock thì 4 alias xen kẽ đều sống sót; (ii)
  browser thật: Web Locks tuần tự hoá thật giữa 2 page cùng origin.
  Nhưng chưa có probe 2 tab app thật cùng addAlias một asset (cần điều
  khiển 2 tab app cùng lúc qua cùng một AssetStore IDB — nặng hơn
  probe lock nguyên thuỷ). Vì vậy giới hạn một tab của đợt 39 được
  coi là **thu hẹp, chưa đóng hẳn**: trên trình duyệt có Web Locks
  thì cơ chế đã có, nhưng bằng chứng end-to-end vẫn thiếu.
- **Fake IDB không tái hiện được mất alias khi không lock** (đối
  chứng trong test mới): 2 store chung DB, không lock, 4 addAlias
  xen kẽ → đủ 4/4, ổn định cả 5 lần chạy. Kết quả này KHÔNG chứng
  minh an toàn khi không lock — lịch microtask của fake IDB đã tuần
  tự hoá ngầm đường đọc-ghi trong harness này — mà cũng không tái
  hiện được bug gốc. Nó chỉ cho thấy harness fake không đủ sức làm
  bằng chứng cho đua liên tab; lý do thêm lock là thiết kế
  đọc-sửa-ghi không nguyên tử của `addAlias`, không phải một lần
  mất alias quan sát được trên fake.
- **Safari / máy thật / Firefox chưa kiểm chứng lock.** Web Locks
  được claim hỗ trợ từ Safari 15.4+ theo tài liệu công khai, nhưng
  luồng này chỉ chạy Chromium Linux headless — Safari thật, Firefox
  thật, máy yếu chưa đo.
- **% ở các panel nhập khác chưa có** (xem §1a): chỉ MediaBin hiện
  banner; các caller importFiles khác chưa truyền callback.
- **File > 128 MiB, bridge thật, tab ẩn hàng giờ, quota IDB bị
  evict:** kế thừa giới hạn đợt 39 T5 — chưa đo trong luồng này.
  File đo lớn nhất ở đây là 65,3 MiB (vừa đủ vượt ngưỡng chunked).
- **Tốc độ băm/ghi lúc máy yên chưa có:** số §2 là under-load; cấm
  trích làm baseline quiet.

## 5. Kết quả kiểm chứng

- Test mới `relink40V5.test.ts`: **6/6, exit 0** — đua liên ngữ cảnh
  + lock (4 alias xen kẽ đủ, tên lock đúng, mỗi addAlias xin lock 1
  lần); cleanup liên ngữ cảnh (tab này dọn đúng alias thừa sau khi
  tab kia ingest tên thật); đối chứng không lock (ghi rõ quan sát
  4/4 trên fake IDB, xem §4); lock throw → vẫn ghi đủ nhờ hàng đợi
  trong-tab; guard qua lock vẫn từ chối alias trùng tên thật; helper
  tiến trình cho importFiles (2 file tuần tự, file 2 dedup báo
  nameMismatch + đủ pha hashing → storing → done, chỉ 1 manifest).
- Hồi quy chạy lại sau mọi sửa: T5 `relink39T5.test.ts` **11/11**,
  U3 `relinkDedup38U3.test.ts` **7/7**, `assetStore.test.ts`
  **22/22**, `importAsset37T3.test.ts` **8/8**,
  `rehydrate36S5.test.ts` **19/19**.
- `tsc --noEmit` (apps/web): **file của luồng này 0 lỗi** (grep
  tsc theo tên file luồng: trống). Tsc toàn repo hiện vẫn báo lỗi ở
  file của luồng khác đang sửa dở trong đợt 40 (duplicate
  `gopFallbackReason` trong `reverseWebcodecs.ts`, TS5097 ở test
  V4/V6) — không thuộc luồng này, không đụng vào (tránh xung đột
  song song); luồng sau chạy lại tsc toàn repo khi các luồng kia
  xong.
- `vite build` (ra `~/workspace/tmp-round40-v5/dist`, không đè dist
  repo): **pass (5,67 s)**; cảnh báo chunk > 500 kB cũ, không mới.
- Click-test + đo IDB + lock liên tab trên Chromium thật: **5/5
  PASS**, JSON tại `~/workspace/tmp-round40-v5/v5-click-idb.json`
  (ngoài repo, kèm chuỗi banner đầy đủ).

## 6. File đổi / thêm (chỉ file text, KHÔNG binary, KHÔNG push, KHÔNG batch paths)

Mới:

- `apps/web/src/lib/relink40V5.test.ts` — 6 test (§5).
- `docs/PHASE9_ROUND40_V5_RELINK_LIMITS.md` — file này.

Sửa:

- `apps/web/src/lib/assetStore.ts` — option `locks` + kiểu
  `LockManagerLike`, `withAliasLock` trong `enqueueAliasOp`, cập
  nhật chú thích giới hạn một tab thành giới hạn có điều kiện (§1b).
- `apps/web/src/lib/ingestProgress39T5.ts` — thêm
  `ImportFileProgressEvent` + `ImportFileProgressCallback`.
- `apps/web/src/store.ts` — `importFiles` nhận thêm `onProgress?`
  tuỳ chọn, dùng `ingestImportedItemWithProgress` khi có callback
  (đường cũ không đổi khi không có callback).
- `apps/web/src/MediaBin.tsx` — state + banner tiến trình import
  (`data-import-progress`, thanh % chỉ ở pha hashing).
- `apps/web/src/i18n/vi.json` + `apps/web/src/i18n/en.json` — thêm
  section `importProgress` (3 key, đủ vi + en).
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (mẫu
  chung).

Không đụng: `preview.tsx`, controller GOP, solo runner, CPU gate,
`RelinkPanel.tsx`, `rehydrate36S5.ts`, mọi file của luồng khác.
Scratch ngoài repo: `~/workspace/tmp-round40-v5/` (dist probe, file
MP4 đo, script probe, JSON kết quả, profile Chrome) — không vào
repo, không vào batch push.
