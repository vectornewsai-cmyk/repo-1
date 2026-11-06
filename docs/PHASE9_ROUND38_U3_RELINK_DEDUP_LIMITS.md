# Phase 9 đợt 38, luồng U3 — Relink tay ingest + dedup cùng bytes khác tên qua alias

> KHÔNG push, KHÔNG tag/release, KHÔNG binary vào repo. Đóng nợ §3 mục 5
> của `docs/PHASE9_ROUND37_LIMITS.md`: (a) đường relink tay chưa ingest;
> (b) dedup cùng bytes khác tên vẫn Relink đúng sau reload; (c) chưa chứng
> minh export sau reload qua bridge thật.
>
> Kết quả: unit test mới 7/7 + hồi quy xanh + probe trình duyệt thật
> `allPass = true` (14/14 check, xem §3) + export sau reload qua bridge
> thật ra file MP4 hợp lệ (ffprobe: h264 1920×1080, aac, đúng 8,0 s,
> 2.279.135 bytes). KHÔNG claim discard hàng giờ, Safari / máy thật,
> thời gian ingest file lớn, quota IDB bị evict — xem §4.

## 1. Đã làm gì

### 1a. Relink tay nay ingest (store.ts `relinkMedia`)

Trước đợt này `relinkMedia` chỉ probe file user chọn, làm duy nhất tên,
đổi src clip và thêm item vào phiên — không ingest nên lần reload sau
lại hiện Relink cho đúng clip vừa relink (nợ đợt 37 T3 §4).

Nay, sau khi `relinkAsset` xác nhận còn clip dùng src cũ (giữ nguyên
ngữ nghĩa early-return cũ: `updatedCount === 0` vẫn trả lỗi, không
ingest mồ côi), hàm ingest item bằng đúng helper đợt 37 T3
(`ingestImportedItem`) với tên đã chốt, **await đủ trước khi resolve**,
best-effort tuyệt đối: lỗi ingest chỉ mất bền vững, relink trong phiên
vẫn thành công, panel vẫn đóng như cũ.

### 1b. Dedup cùng bytes khác tên: sửa bằng alias, KHÔNG đổi src clip

Vấn đề gốc: `AssetStore.ingest` dedup theo SHA-256 nên import cùng nội
dung lần 2 dưới tên khác chỉ trả về manifest cũ (originalName = tên
đầu). Rehydrate khớp tên thô theo originalName nên tên thứ hai không
bao giờ khớp → Relink đúng sau reload. Hướng "chuyển src clip sang
`asset:`" đã được loại từ đợt 37 vì chạm addMediaToTrack / export /
render — đợt này KHÔNG làm hướng đó, mà làm hướng an toàn hơn:

- `AssetStore` thêm field tuỳ chọn `AssetManifest.aliases?: string[]`
  (không đổi schema/version DB, manifest cũ không có field vẫn đọc
  bình thường) và method mới `addAlias(assetId, alias)`:
  - Ghi tên bí danh vào manifest của asset đã dedup.
  - Từ chối khi: asset không tồn tại, alias rỗng, alias trùng
    originalName của chính asset, alias trùng originalName của MỘT
    asset khác (tránh che tên thật).
  - Alias đã có → trả true, không nhân đôi.
  - Hai `addAlias` song song cùng asset có thể làm mất một alias
    (đọc → ghi không khoá); các đường gọi trong app đều await tuần
    tự nên chấp nhận được — ghi rõ để luồng sau không gọi song song.
- `importFiles` (store.ts): sau mỗi ingest, nếu `nameMismatch` thì ghi
  alias cho tên item (best-effort, lỗi bỏ qua). Dùng chung một instance
  `AssetStore` cho cả ingest lẫn alias trong một lần import.
- `relinkMedia`: như trên, nếu ingest dedup (`nameMismatch`) thì ghi
  alias cho tên relink, đồng thời trả message + toast info nêu rõ nội
  dung trùng với file nào đã lưu (note UI/log theo yêu cầu (a) của
  nhiệm vụ).
- `planRehydrate` (rehydrate36S5.ts): thêm via `"alias"` — thứ tự khớp
  cho tên thô là: originalName (tên thật) → alias. Alias chỉ có hiệu
  lực khi nó không phải originalName của bất kỳ manifest nào, nên tên
  thật luôn thắng alias trùng tên (khóa bằng test). Nhờ đó clip giữ
  nguyên src, media bin khôi phục item đúng tên clip, export/render
  map theo tên không đổi gì.
- `rehydrateMediaItems`: candidate via alias dựng `File` với
  `file.name = src` (thay vì originalName) để giữ bất biến
  `file.name == item.name == src clip` mà export/render dựa vào; bytes
  là bytes gốc của asset (cùng SHA-256) nên đúng nội dung. Các via còn
  lại không đổi hành vi.

Hệ quả đo được: import cùng bytes hai lần chỉ tạo 1 manifest, manifest
đó mang cả hai tên (originalName + aliases); relink bằng file cùng
bytes dưới tên thứ ba cũng chỉ thêm alias thứ ba vào cùng manifest.
Không còn trường hợp dedup nào Relink oan sau reload — với điều kiện
alias đã được ghi (đường import/relink từ bản này trở đi; project cũ
ingest trước đợt này mà chưa có alias thì vẫn Relink một lần như cũ,
xem §4).

### 1c. Export sau reload qua bridge thật — ĐÃ CHỨNG MINH (pha E)

Project sau reload (bin đã rehydrate, không Relink) → mở ExportPanel →
render preset 1080p qua bridge 127.0.0.1:8787 thật → "Render xong!" →
tải MP4 về, ffprobe xác nhận file hợp lệ. Chi tiết ở §3 pha E.

## 2. Kết quả kiểm chứng

### 2a. Unit test mới — 7/7, exit 0

`node apps/web/src/lib/relinkDedup38U3.test.ts` (fake IndexedDB gọn chỉ
implement surface AssetStore dùng; SHA-256 thật bằng Web Crypto):

- plan: src bí danh khớp qua aliases (via `"alias"`).
- plan: tên thật thắng alias trùng tên (không che asset khác).
- plan: tên lạ không alias vẫn skipped (không che media thiếu thật).
- plan: `asset:` và bare-name không đổi khi có alias.
- rehydrate alias: item.name == src, file.name == src, file.size đúng
  bytes.
- AssetStore thật + fake IDB: ingest cùng bytes dưới tên khác trả cùng
  assetId + manifest cũ; `addAlias` bền qua `list()`; addAlias lặp
  không nhân đôi; plan dùng manifest từ `list()` khớp qua alias;
  sha256 manifest == hash thật của bytes test.
- `addAlias` từ chối: alias trùng tên thật của asset khác, asset không
  tồn tại, alias trùng tên chính mình, alias rỗng.

### 2b. Hồi quy — xanh (chạy sau mọi sửa code của luồng)

- `rehydrate36S5.test.ts`: 19/19.
- `assetStore.test.ts`: 22/22.
- `projectRepo.test.ts`: 10/10.
- `importAsset37T3.test.ts`: 8/8.
- `tsc --noEmit` (apps/web): 0 lỗi (lần chạy tsc đầu đợt còn thấy 2 lỗi
  ở `reverseWebcodecs.ts` của luồng khác; tới lần chạy cuối đã sạch —
  luồng khác tự sửa, luồng này không đụng file đó).
- `vite build` (ra /tmp probe dist, không đè dist repo): pass.

### 2c. Probe trình duyệt thật — allPass = true (14/14)

`apps/web/scripts/probe-round38-u3-relink-dedup-pipe.mjs`, bundle probe
build riêng ra `/tmp/vcut-u3-dist`, Chrome headless-new (Playwright
chromium-1248), cổng 4298, profile mới. Kết quả:
`benchmarks/results/v38-u3-relink-dedup.json` (allPass = true).

- Pha A (hồi quy T3): import `u3-dup-a.mp4` → clip → reload → không
  Relink, bin có file.
- Pha B (dedup import): import `u3-dup-b.mp4` CÙNG BYTES (ffmpeg render
  1 lần rồi copy ra 3 tên) → clip → reload → không Relink cho cả hai
  tên; IndexedDB chỉ có 1 manifest cho cặp này:
  `originalName = u3-dup-a.mp4, aliases = ["u3-dup-b.mp4"]`.
- Pha C (relink tay + dedup): sửa autosave đổi clip thành
  `missing-u3.png` → reload → Relink HIỆN đúng tên đó → chọn lại bằng
  `u3-relink-c.mp4` (cùng bytes, tên mới) → chờ autosave bền spec
  relink → reload → Relink VẮNG, bin có `u3-relink-c.mp4`, manifest
  nay có `aliases = ["u3-dup-b.mp4", "u3-relink-c.mp4"]` (bằng chứng
  relinkMedia đã ingest + dedup + ghi alias thật).
- Pha D (đối chứng âm): sửa autosave đổi 1 clip thành tên không tồn
  tại → reload → Relink HIỆN đúng tên đó (rehydrate/alias không che
  media thiếu thật).
- Pha E (export sau reload qua bridge thật): bridge 127.0.0.1:8787
  khởi động thật (`/api/health` ok) → khôi phục clip về
  `u3-relink-c.mp4` → reload → không Relink → mở ExportPanel đúng nút
  TopBar (`button[data-tour="export"]`) → bấm "🎬 Xuất MP4
  (1920×1080)" → "Render xong!" → tải về
  `vcut-faa987d1b9280d5d.mp4`, 2.279.135 bytes; ffprobe: h264
  1920×1080 + aac, duration đúng 8,000 s (khớp thời lượng project mẫu
  8 s).

Hai lần chạy probe đầu FAIL đã sửa và ghi rõ nguyên nhân (không giấu):

1. Lần 1, pha C fail sau reload dù alias đã ghi: probe reload ngay sau
   khi panel relink đóng, trước khi autosave debounce 5 s kịp ghi spec
   relink — autosave cũ (còn `missing-u3.png`) thắng, spec relink mất.
   Đây là lỗi timing của probe, không phải lỗi app: probe nay chờ
   autosave chứa tên relink rồi mới reload. Bài học này giống ghi chú
   của T3 về `autosave()` debounce vs `autosaveNow`.
2. Lần 1, pha E fail: probe dùng clip PNG trên video track — render
   worker từ chối hợp lệ ("ảnh tĩnh — video clip yêu cầu file video,
   dùng image track cho ảnh tĩnh", P0-03); đồng thời probe bấm nhầm nút
   tour "Bắt đầu" do chọn nút theo text /xuất|export/. Probe nay dùng
   MP4 thật cho mọi file test, bấm đúng nút TopBar và nút render trong
   dialog Xuất video. Render worker đã nhận đủ file rehydrate (lỗi lần
   1 chứng minh đường upload từ item rehydrate tới được bridge và bị
   chặn ở bước validate nội dung, không phải ở bước thiếu file).

## 3. File đổi / thêm (chỉ file text, KHÔNG binary, KHÔNG push)

Mới:

- `apps/web/src/lib/relinkDedup38U3.test.ts` — 7 test (mục 2a).
- `apps/web/scripts/probe-round38-u3-relink-dedup-pipe.mjs` — probe pha
  A–E (CDP WebSocket, không cần package playwright).
- `docs/PHASE9_ROUND38_U3_RELINK_DEDUP_LIMITS.md` — file này.
- `benchmarks/results/v38-u3-relink-dedup.json` — kết quả probe
  (allPass = true).

Sửa:

- `apps/web/src/lib/assetStore.ts` — `AssetManifest.aliases?` +
  method `addAlias` (cộng thêm, không đổi ingest/get/list/remove hay
  version DB).
- `apps/web/src/lib/rehydrate36S5.ts` — via `"alias"` trong plan +
  file.name = src cho candidate alias (không đổi via asset/bare-name).
- `apps/web/src/lib/importAsset37T3.ts` — chỉ sửa chú thích header:
  `nameMismatch` nay được caller ghi alias (đợt 38 U3), không còn là
  giới hạn tuyệt đối; đường gọi cũ bỏ qua cờ thì giới hạn cũ vẫn đúng.
- `apps/web/src/store.ts` — `importFiles` ghi alias khi dedup;
  `relinkMedia` ingest + ghi alias + toast/message nêu tên trùng.
- `apps/web/tsconfig.json` — thêm 1 dòng exclude cho test mới (mẫu
  chung). Lưu ý va chạm với luồng khác trong đợt: một luồng khác cũng
  sửa file này cùng lúc khiến JSON hỏng tạm thời (dòng của luồng đó
  thừa dấu `"`); luồng đó đã tự sửa trước khi probe build chạy lại —
  luồng này chỉ giữ dòng exclude của mình và không sửa dòng của luồng
  khác; JSON đã verify parse OK trước khi build.

Không đụng: `App.tsx`, `ProjectMenu.tsx`, `RelinkPanel.tsx`,
`relink.ts`, `projectRepo.ts`, `sample.ts`, `MediaBin.tsx`,
`ExportPanel.tsx`, mọi file của luồng khác. Bundle probe, MP4 test và
MP4 tải về nằm ở `/tmp` (vcut-u3-dist, vcut-u3-downloads), không vào
repo. Script diagnostic dùng một lần ở `/tmp/u3-export-diag.mjs` cũng
không vào repo.

## 4. Cái gì chưa làm / chưa chứng minh (trung thực)

Chưa chứng minh (không claim hộ):

- **Discard thật dưới áp lực bộ nhớ / tab ẩn hàng giờ / bfcache /
  Safari / máy thật / dpr > 1:** probe chỉ reload có chủ ý trên
  Chromium Linux, kế thừa giới hạn R6/S5/T3. Alias không đổi gì về
  mặt này — nó chỉ là thêm một khóa tra cứu trong manifest đã bền.
- **Ingest file lớn:** ingest tính SHA-256 toàn file + ghi thêm một
  bản vào IndexedDB (nhân đôi dung lượng đĩa, như T3 đã ghi);
  `relinkMedia` nay await ingest nên relink file lớn sẽ thấy panel
  đóng chậm hơn (đánh đổi để reload ngay sau relink vẫn bền). Chưa đo
  thời gian ingest với video hàng trăm MB, chưa có UI tiến trình.
- **Quota IndexedDB bị evict:** manifest + alias mất cùng nhau →
  Relink như cũ, không có cơ chế phục hồi.
- **Export sau reload ở preset khác:** pha E chỉ chứng minh preset
  1080p mặc định trên project mẫu 8 s + 2 clip video test; preset
  720p/4K, project dài, clip có hiệu ứng/mask chưa chạy qua đường
  này trong luồng.

Nợ còn lại (đúng, không phải bug mới):

- **Project cũ ingest trước đợt này:** bytes đã ingest nhưng chưa có
  alias (vì alias chỉ ghi lúc import/relink từ bản này trở đi) → tên
  bí danh cũ vẫn Relink một lần; user relink lại một lần thì từ đó bền
  (alias được ghi ngay trong lần relink đó).
- **Hai `addAlias` song song cùng asset:** có thể mất một alias (xem
  §1b); các đường gọi hiện tại đều await tuần tự.
- **Alias trùng tên thật được tạo trước khi có guard:** `planRehydrate`
  ưu tiên tên thật nên không che asset khác, nhưng alias thừa đó vẫn
  nằm trong manifest cho tới khi có luồng dọn dẹp (không ảnh hưởng
  hành vi).
- **Đường mở file từ máy khác / clip `blob:` cũ:** giữ nguyên giới
  hạn T3/S5 (manifest chỉ sống ở IndexedDB máy đã ingest; `blob:` của
  phiên cũ đã chết vĩnh viễn, chỉ relink tay cứu được — nay relink
  tay đã bền qua reload nhờ ingest + alias).
