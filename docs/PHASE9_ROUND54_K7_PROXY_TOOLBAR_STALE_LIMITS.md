# LIMITS — Phase 9, Đợt 54, Luồng K7: nút Proxy bị toolbar phủ + proxy stale

Ngày: 07/11/2026. Repo: `~/workspace/repo-1` (local; KHÔNG push từ phiên nền).
Phạm vi: đóng 2 nợ đợt 53 J5 (docs/PHASE9_ROUND53_J5_PROXY_PREVIEW_LIMITS.md §6):
(1) nút Proxy bị thanh toolbar timeline phủ ở 1440×900 — click chuột thật
trượt (`elementFromPoint` → `tl-toolbar`); (2) proxy stale nếu WORK_ROOT
của bridge bị xóa tay — chưa có cơ chế phát hiện + tạo lại.
KHÔNG đụng phần audio re-seek (luồng K9).

## 1. Nút Proxy bị toolbar phủ — ĐÃ SỬA (headed 10/10, xem §4)

### Chẩn đoán (đo headed thật, không đoán)

Viewport headed Chrome `--window-size=1440,900` trên Xvfb thực tế chỉ còn
**1439×699** (khung trình duyệt chiếm ~201px chiều cao) — tức "1440×900"
của J5 là kích thước cửa sổ, không phải viewport. Số đo hình học trước sửa
(harness K7, `GEO`):

| Khối | rect |
|---|---|
| TopBar (wrap 2 hàng, theo thiết kế D1) | y=0, h=98 |
| editor-main | y=98, h=305 |
| .mediabin | y=98, h=305 |
| .media-grid | y=201, h=152, scrollHeight=152, clientHeight=152 |
| .timeline | y=403, h=296 |
| .tl-toolbar (wrap, hint 2 dòng) | y=404, h=81 |
| Nút Proxy của clip1080p (card hàng 2) | tâm (61, 413.1), 96×30 |

Nguyên nhân gốc KHÔNG phải z-index/position (mọi khối đều `position:
static`, không có phần tử nào phủ bằng CSS): **hàng grid co lại**.
Card clip: `offsetHeight=63`, `scrollHeight=149`, `clientHeight=61` —
nội dung thật của card là thumb 59,1 + tên 22 + nút Thêm 26 (+margin 12)
+ nút Proxy 30 = ~149px, nhưng hàng grid chỉ cao 63px (= đúng
(152 − padding 16 − gap 10) / 2: hai hàng chia đều chiều cao cố định của
container). Tên + 2 nút tràn ra ngoài card, bị `.media-card`
(`overflow: hidden`) và `.mediabin` (`overflow: hidden`) cắt mất — nút
Proxy chỉ còn là hộp layout tại y≈398–428, không được vẽ, không hit-test
được; tại điểm đó phần tử trên cùng được vẽ là `.tl-toolbar` (y=404–485).
Thí nghiệm CSS trực tiếp trên trang (probe-54k7-geo.mjs) khóa cơ chế:

| Thử | cardH | grid scrollH | kết luận |
|---|---|---|---|
| gốc (`auto`) | 63 | 152 | hàng co, nút bị cắt |
| `align-content: normal` | 63 | 152 | không phải do `align-content: start` |
| `grid-auto-rows: minmax(0, max-content)` | 63 | 152 | min 0 vẫn cho co |
| `grid-auto-rows: max-content` | **151,1** | **298** | card đủ cao, grid cuộn |
| `grid-auto-rows: min-content` | 151,1 | 298 | cũng đủ, nhưng max-content là ngữ nghĩa đúng |
| max-content + `scrollIntoView({block:"center"})` | 151,1 | scrollTop=146, nút y=310,1 | **`elementFromPoint` → `BUTTON.media-proxy`** |

### Sửa
- `apps/web/src/styles.css` — `.media-grid` thêm `grid-auto-rows:
  max-content` (1 dòng + chú thích). Card giữ chiều cao tự nhiên
  (~151px), grid cuộn như thiết kế (`overflow-y: auto` đã có sẵn).
- Không đổi TopBar (98px, 2 hàng theo D1), không đổi chiều cao Timeline
  (296px), không đổi z-index/pointer-events ở đâu — cả hai đều thuộc
  layout chung, sửa sẽ ảnh hưởng toàn editor; vấn đề thực sự là hàng
  grid co, không phải toolbar phủ.
- Harness K7 cập nhật `clickProxyReal`: cuộn nút vào giữa grid
  (`scrollIntoView`) trước khi đo tọa độ + bấm CDP — y hệt thao tác
  người dùng thật khi nút nằm dưới nếp gấp của panel cuộn được.

### Hệ quả đo được sau sửa (harness run 2)
- Grid: scrollHeight **298** (trước 152), clientHeight 152 — grid cuộn được.
- Nút Proxy sau cuộn: tâm (61, 325), `elementFromPoint` →
  `[BUTTON.media-proxy, DIV.media-card, DIV.media-grid]`; click chuột
  thật qua CDP: text `"Proxy 720p" → "…"`, proxy tạo thành công
  (proxyUrl về store sau ~7 s, file 101.013 byte).
- Ở viewport thật 900px (trừ khung trình duyệt ~80px → ~820): TopBar 98 +
  Timeline 296 → editor-main ~426, grid ~373 — đủ chứa 2 hàng card
  (~338px) nên không cần cuộn; ở viewport 699px (harness) vẫn cần cuộn
  1 lần — đó là hành vi bình thường của panel cuộn, không phải lỗi.

## 2. Proxy stale khi WORK_ROOT bị xóa tay — ĐÃ SỬA (headed 10/10)

### Thiết kế
- `lib/proxy.ts` — mới `checkProxyAlive(proxyUrl, fetchFn?)` → tri-state
  `"alive" | "missing" | "unknown"`, HEAD (không tải bytes):
  2xx/3xx → alive; **404 → missing (chỉ trạng thái này mới được coi là
  chết chắc)**; mọi thứ khác (bridge chưa chạy / mất mạng / fetch không
  có / status khác) → unknown. Bridge GET `/api/proxy/file/:name` phục
  vụ HEAD qua handler GET của Express (đo thật: file còn → 200, file đã
  xóa → 404).
- `lib/rehydrate36S5.ts` — dep tùy chọn mới `checkProxyUrl?` (không
  truyền → coi như "unknown", giữ proxy như cũ để caller cũ/test không
  truyền vẫn chạy đúng hành vi cũ). Khi manifest có proxyPath: HEAD kiểm
  tra; `"missing"` → item bị gỡ proxyUrl/Height/SizeBytes, đánh dấu
  `proxyStale: true`, ghi vào `RehydrateResult.staleProxies[]`
  (`{assetId, proxyPath, name}`); `"alive"`/`"unknown"` → giữ proxy như
  cũ. Kiểm tra tuần tự từng item (thường 0–1 item có proxy).
- `media.ts` — mới `MediaItem.proxyStale?: boolean`.
- `App.tsx` (đường autosave) + `lib/openProjectFlow.ts` (đường mở file)
  — nối `checkProxyUrl: checkProxyAlive` (+ `proxyBaseUrl: BRIDGE_URL`
  cho openProjectFlow, trước đây đường này dùng mặc định 8787) và sau
  rehydrate: với mỗi stale entry, `AssetStore.setProxy(assetId, null)`
  để xóa proxyPath chết khỏi manifest (lần sau khỏi kiểm tra lại đường
  dẫn chết) + 1 toast báo rõ tên file, hướng dẫn bấm nút Proxy tạo lại.
- `store.ts` — `setMediaProxy` nay ghi thêm `proxyStale: false`: proxy
  mới tạo lại sau khi stale thì item hết stale ngay.
- `MediaBin.tsx` — nút Proxy của item stale hiện **"Proxy mất, tạo lại"**
  (title + aria-label riêng); bấm vào chạy đúng đường `makeProxy` cũ
  (POST bridge → `setMediaProxy` → ghi manifest mới). Không tự tạo lại
  lúc load: item rehydrate có sẵn `file` (dựng từ blob) nên tạo lại bằng
  tay luôn khả thi; tự tạo lại lúc khởi động sẽ gây tải CPU/bridge bất
  ngờ và khó phân biệt với bridge đang tắt — quyết định sản phẩm: báo rõ
  + nút tạo lại (đúng phương án cho phép của nhiệm vụ).
- Preview khi proxy chết giữa chừng (không reload): `MediaPool.videoFor`
  vẫn fallback về bản gốc bằng error handler cũ (không đổi).

### Đo thật (harness K7 run 2, bridge + vite dev + Xvfb Chromium + CDP)
- T2a: xóa file proxy khỏi đĩa → HEAD proxyUrl → **404**.
- T2b sau reload: item `proxyUrl=null, proxyStale=true`, nút hiện
  `"Proxy mất, tạo lại"`.
- T2c: manifest `proxyPath=null` (đã dọn đường dẫn chết).
- T2d: click chuột thật vào "Proxy mất, tạo lại" →
  `atPoint=[BUTTON.media-proxy, ...]`, text → `"…"`, proxy mới về
  store, `proxyStale=false`.
- T2e: file proxy mới trên đĩa (101.013 byte, mtime mới) + manifest
  `proxyPath=/api/proxy/file/clip1080p__proxy_720p.mp4`.
- T2f (chống gỡ oan): reload lần nữa khi file còn → proxy được GIỮ
  (`proxyUrl` đúng, `proxyStale=false`, nút `"✓ PROXY 720p"`).

## 3. Kiểm chứng

### Unit (Node `--experimental-strip-types`, gốc repo)
- `proxyAuto.test.ts`: **20/20** (13 cũ + 7 mới `checkProxyAlive`:
  200/204/301 → alive, 404 → missing, 500 → unknown, fetch throw →
  unknown, fetch không phải hàm → unknown, URL rỗng → unknown).
- `rehydrate36S5.test.ts`: **27/27** (22 cũ + 5 mới K7: 404 → gỡ +
  stale + entry; alive → giữ; unknown → giữ; không truyền dep → giữ;
  dep throw → giữ).
- `assetStore.test.ts`: **27/27** (hồi quy, không đổi).
- Hồi quy cùng đợt (không đổi): `audioEngine52I2` 15/15,
  `audioEngine44Z2` 6/6, `previewEngine` 14/14, `previewEngine51H6`
  15/15, `playheadPacingRound29L2` 10/10, `projectRepoRound49E4` 13/13.
- `npx tsc --noEmit` (apps/web): **0 lỗi**. `npm run build`: **pass**
  (7,5 s; chỉ cảnh báo chunk > 500 kB có sẵn từ trước).

### Headed — `apps/web/scripts/clicktest-54k7-proxy-toolbar-stale.mjs`
**10/10 PASS** (run 2, 07/11/2026 ~00:15 +07; run 1 trước sửa: 5/10,
tái hiện đúng T1 FAIL + T2b/T2c/T2e FAIL). A0 load sample; P0 import
clip 1080p thật (testsrc 1920×1080 30fps 8 s, 164.381 byte) + thêm
timeline; T1 click thật tạo proxy; T2a–T2f stale như §2; T3 0 lỗi
console trong phiên (window errors 0, CDP exceptions 0).
Bằng chứng: `~/workspace/goals/capcut-clone-video-editor/hidden_files/round54-k7-proxy-toolbar-stale/`
(`proxy-result.json`, `proxy-log.txt`, `geo-log.txt` kèm thí nghiệm CSS,
`harness-run2-stdout.txt`); scratch harness
`~/workspace/tmp-round54-k7/proxy/`.

## 4. File đã chạm (đợt này)

**Production:**
- `apps/web/src/styles.css` — `.media-grid`: `grid-auto-rows: max-content`.
- `apps/web/src/lib/proxy.ts` — `ProxyLiveness`, `checkProxyAlive`.
- `apps/web/src/media.ts` — `MediaItem.proxyStale?`.
- `apps/web/src/lib/rehydrate36S5.ts` — dep `checkProxyUrl?`,
  `RehydrateResult.staleProxies`, logic gỡ proxy chết.
- `apps/web/src/App.tsx` — nối check + dọn manifest stale + toast
  (file chung, sửa tối thiểu: 1 import + dep + 1 khối sau restore).
- `apps/web/src/lib/openProjectFlow.ts` — như App cho đường mở file
  (+ `proxyBaseUrl: BRIDGE_URL`, trước đây mặc định 8787).
- `apps/web/src/store.ts` — `setMediaProxy` ghi `proxyStale: false`
  (file chung, 1 field trong patch).
- `apps/web/src/MediaBin.tsx` — nút stale "Proxy mất, tạo lại".

**Test:** `apps/web/src/lib/proxyAuto.test.ts`,
`apps/web/src/lib/rehydrate36S5.test.ts`.

**Harness headed** (Node + vite dev + bridge thật + Xvfb Chromium + CDP,
mẫu J5; cổng/dev/display tự chọn dải riêng K7 để khỏi đụng luồng song
song: dev 5301–5319, debug 9491–9509, bridge 8801–8819, display :100–:119):
`apps/web/scripts/clicktest-54k7-proxy-toolbar-stale.mjs`,
`apps/web/scripts/probe-54k7-geo.mjs` (chẩn đoán hình học + thí nghiệm
CSS, giữ lại theo tiền lệ probe trong `scripts/`).

**Không đưa vào batch:** `apps/web/dist/` (build ghi ra), scratch
`~/workspace/tmp-round54-k7/` (fixture/clip/log/result — ngoài repo;
bản copy bằng chứng đã đưa vào goal hidden_files).

## 5. Nợ mở (trung thực)
- Proxy bị xóa SAU khi load (không reload): chưa phát hiện cho tới lần
  reload sau — preview vẫn fallback về gốc nhờ MediaPool (đúng), nhưng
  nút vẫn hiện "✓ PROXY 720p" cho tới khi reload. Phát hiện lúc phát
  (hook vào error handler của MediaPool → báo store) là hướng đợt sau,
  cần nối MediaPool với store nên không làm trong đợt này.
- Không tự tạo lại proxy lúc load (quyết định có chủ đích, xem §2) —
  nếu user muốn tự động, cần thêm cờ riêng (mặc định tắt) + đo tải
  bridge lúc khởi động.
- Chưa đo trên máy thật / Safari / màn hình lớn hơn (chỉ Chromium headed
  trên VM này; viewport harness 1439×699, viewport thật 900px suy ra
  từ số đo layout, chưa chạy headed ở viewport 900 thật vì Chrome
  headed trên Xvfb lấy viewport = cửa sổ trừ khung trình duyệt).
- Nút `.media-proxy` vẫn không có rule CSS riêng (nút mặc định của
  trình duyệt) — mỹ quan có sẵn từ trước, không thuộc phạm vi đợt này.
- Toast báo proxy mất trong App/openProjectFlow dùng chuỗi tiếng Việt
  cứng (theo mẫu toast sẵn có trong MediaBin), chưa qua i18n — nếu cần
  dịch thì thêm key locale ở đợt i18n.

## 6. Môi trường / ghi chú vận hành
- VM 2vCPU/8GB, nhiều luồng đợt 54 chạy song song: 1 lần probe CDP
  timeout `Runtime.enable` 60 s lúc VM nặng (chạy lại thì qua ngay);
  1 lần `tsc`/`vite` có thể fail thoáng qua do luồng song song — chạy
  lại 1 lần là xanh (quy ước của nhiệm vụ).
- Harness tự chọn cổng trống (dev 5301–5319, debug 9491–9509, bridge
  8801–8819, clip 5401–5419, Xvfb :100–:119) vì nhiều luồng chạy cùng lúc.
