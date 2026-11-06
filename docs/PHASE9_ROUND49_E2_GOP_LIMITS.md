# Phase 9 đợt 49, luồng E2 — Sửa gate GOP để bật trên blob: URL + i18n nút "Phát ngược" — LIMITS

Ngày: 06/11/2026 (giờ +07). Đóng nợ D4 §6.1 (GOP không bao giờ bật
cho file import local), §6.2 (chưa đo đỉnh heap khi fallback tải toàn
file blob 37 MiB) và §6.3 (nút "Phát ngược" K4 hardcode tiếng Việt).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào
batch. Không tự stage paths-loop hay ghi build-loop-log (parent gộp,
như tiền lệ B4/C5/D4). Trần 128 MiB / trần moov 16 MiB / tiền tố
512 KiB / gate U2 GIỮ NGUYÊN trừ đúng phần gate blob URL ở §2.
Trần S4, wiring V2, tail-scan A4/B4/C5 (cửa sổ đuôi 16 MiB, hậu tố
được chấp nhận) KHÔNG đổi.

## 0. Kết luận ngắn (không vượt số đo)

1. **Gate GOP đã sửa và BẬT TRÊN BLOB: URL trong app thật.**
   File trailing 37 MiB import local → phát ngược: `gopActive=true`,
   `__vcutReverseWc.hits +477` (chạy 2) / `+391` (chạy 3), playhead
   lùi 72 → 42,5 s trong 30 s quan sát, 50 frame canvas khác nhau,
   **0 GET toàn file** (CDP Network: 194–195 request blob:, 100%
   mang header Range; resource-timing blob: 0 entry). T3 trực tiếp
   trên blob: URL thật: `gop-range`, **2160 sample / 72 GOP**,
   requests probe + prefix + tail (16.777.216 byte) + 72 GOP, toàn
   206. Controller trực tiếp: `gopMode=gop-range`, `ready=true`,
   `cacheSize=31`, `retainedFileBytes=1.068.846` (~1 MiB), 504,7 ms.
   Test khóa đỏ-trước/xanh-sau: 4/8 → **8/8**.
2. **Đỉnh heap khi fallback tải toàn file blob 37 MiB (nợ D4 §6.2)
   — ĐÃ ĐO THẬT:** đường load() cũ của controller (gopRangeEnabled:
   false, probe trực tiếp): baseline 41,55 MiB → **đỉnh 81,08 MiB,
   delta +37,70 MiB** (≈ đúng kích thước file 37,19 MiB — chữ ký
   của 1 arrayBuffer toàn file) → settled 80,66 MiB; dispose +
   revoke blob + gc rơi 38,43 MiB về 40,36 MiB (không leak, chỉ
   giữ khi controller còn sống). So sánh trong app thật (cùng máy,
   cùng file): đường GOP peak 102,62 MiB (delta +81,56) / settled
   39,56 MiB; đường element (toggle TẮT) peak 37,33–40,17 MiB
   (delta +16,31/+18,93) / settled ~22,5 MiB. **GOP có đỉnh JS-heap
   transient CAO HƠN đường tải toàn file** (tail 16,7 MiB + chunk
   ~37 MiB giữ cùng lúc trong lúc T3) — xem §4.3, không giấu.
3. **i18n nút "Phát ngược" K4: XONG.** 2 key mới
   `topbar.reversePlayback*` vi + en, parity toàn file **973/973**,
   test E2 3/3, nút trên app thật hiện đúng aria-label/title qua
   i18n. Snapshot đếm key đã bump 971 → **973** ở cả 6 file test
   (B6, Z6, D4, saveToast31, structuredNotes32, errorDetail34Q4
   comment) — các test này trước đây đỏ vì snapshot cũ, nay xanh
   trở lại (B6 8/8, Z6 10/10, saveToast31 15/15).
4. **Hồi quy GOP đủ bộ xanh + tsc 0 + vite build pass** (xem §6).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopBlobUrl49E2.test.ts` — test khóa đỏ-trước/
  xanh-sau (gate + T3 + controller trên mock blob: URL, fixture
  ffmpeg thật). 8/8 pass (đỏ-trước 4/8, xem §3).
- `apps/web/src/lib/reversePlaybackI18n49E2.test.ts` — test parity
  i18n vi/en + nội dung 2 key mới của nút K4 + TopBar dùng đúng key
  (mẫu D4). 3/3 pass.
- `apps/web/scripts/gopHeaded49E2.mjs` — harness headed E2E app thật
  (kế thừa D4, thêm: 2 mode gop/fallback, lấy mẫu heap + RSS mỗi
  500 ms, CDP Network log request blob:, chẩn đoán controller qua
  `E2_DIAG=1`). GOP 16/16 (2 lần chạy), fallback 17/17.
- `docs/PHASE9_ROUND49_E2_GOP_LIMITS.md` — file này.

### 1.2 Sửa (marker ROUND49-E2)

- `apps/web/src/lib/reverseRangeGate38U2.ts` — thêm
  `rangeSupportEstablished()` + field tùy chọn
  `rangeProvenByVerifiedProbe` cho `resolveRangeGopFetch` (xem §2).
  Không đổi luật moov, không đổi lý do fallback cũ, không đổi
  `acceptsByteRanges`.
- `apps/web/src/lib/gopRangeFetch39T3.ts` — T3 truyền bằng chứng 206
  vào cả 2 lần gọi gate + cửa tail-scan dùng `rangeSupportEstablished`
  (xem §2); bỏ import `acceptsByteRanges` không còn dùng.
- `apps/web/src/TopBar.tsx` — nút "Phát ngược" K4 dùng `t(...)`
  thay cho chuỗi Việt trực tiếp; giá trị vi giữ nguyên "Phát ngược"
  nên selector harness `[aria-label="Phát ngược"]` không đổi.
- `apps/web/src/i18n/vi.json`, `apps/web/src/i18n/en.json` — +2 key
  `topbar.reversePlayback`, `topbar.reversePlaybackHint` (xem §5).
- `apps/web/tsconfig.json` — +2 dòng exclude 2 test mới (mẫu D4).
- Snapshot đếm key 971 → 973: `reverseBadge46B6.test.ts`,
  `reverseCompat44Z6.test.ts`, `saveToast31.test.ts`,
  `structuredNotes32.test.ts`, `reverseToggleI18n48D4.test.ts`,
  `errorDetail34Q4.test.ts` (chỉ comment). Ghi chú: các file này
  trước đợt này đã đỏ vì snapshot 971/968/931 lỗi thời (D4 §5.2);
  E2 bump lên số đúng 973 nên nay xanh trở lại — không đổi logic
  test nào.

### 1.3 Không đụng (ghi rõ)

`reverseWebcodecs.ts` (controller — không cần sửa, xem §4.1),
`gopTail45A4/46B4/47C5.ts`, `gopCache40V2.ts`, `gopSizeProbe41W4.ts`,
`reversePlayback.ts`, `preview.tsx`, `MediaBin.tsx`, `store.ts`,
`server/bridge/src/index.js`, mọi file luồng khác đợt 49 (E1/E3/E4/
E5/E6 đang chạy song song — E2 không sửa file của họ; snapshot 973
là số đúng tại thời điểm E2 chạy test cuối, nếu luồng khác cùng đợt
thêm key i18n thì parent gộp bump lại theo tổng thực tế).
Probe chẩn đoán chỉ nằm ở `~/scratch-round49-e2/probeBlob49E2.mjs`
+ `probe-entry.ts`/`probe-bundle.mjs` (ngoài repo, không đưa vào
batch). Fixture headed tái dùng `~/scratch-round47-c5/
trailing-real37.mp4` (KHÔNG đưa vào batch).

## 2. Quyết định thiết kế gate blob URL (đối chiếu nguyên tắc U2 "không giả định")

### 2.1 Vấn đề (bằng chứng D4 §2.3, không đoán lại — E2 đo lại, khớp)

- Cùng bytes fixture trailing 37 MiB, cùng Chrome: T3 qua HTTP
  (có `Accept-Ranges: bytes`) ra `gop-range`, 2160 sample / 72 GOP;
  T3 qua blob: URL ra `full-file`, lý do `gate: moov-unknown`,
  chỉ 2 request (probe 206 + prefix 206), KHÔNG fetch đuôi.
- Đo trực tiếp trên blob: URL (probe E2, đúng bytes fixture):
  HEAD ném `TypeError: Failed to fetch`; Range 0-0 trả **206**,
  `Content-Range: bytes 0-0/38996431`, `accept-ranges: null`,
  first byte `0x00` (đầu box ftyp) — khớp D4 §2.3 từng chữ.
- Rào cản thật là cửa vào tail-scan ở T3 đòi
  `acceptsByteRanges(acceptRanges)` — header này trên blob: URL
  không bao giờ có, nên tail-scan bị bỏ qua dù Range đã chứng minh
  là chạy. Với file faststart trên blob thì gate cũng chặn ở cùng
  lý do `accept-ranges-unknown` (test đỏ-trước §3).

### 2.2 Quyết định: bằng chứng 206 đã kiểm chứng thay cho header VẮNG — không thay cho header KHẲNG ĐỊNH "không hỗ trợ"

Ba trường hợp, rạch ròi theo LOẠI bằng chứng (cài trong
`rangeSupportEstablished`, gate U2 + T3 cùng dùng một hàm):

1. Header là chuỗi `"bytes"` → đủ (đường cũ, không đổi).
2. Header là chuỗi khác `"bytes"` (vd `"none"`) → KHÔNG đủ, **dù
   đã có probe 206**. Server đã tuyên bố rõ ràng là không hỗ trợ
   Range; một response 206 mâu thuẫn với tuyên bố đó không đủ sức
   bác tuyên bố — tin tuyên bố là phía an toàn. Test khóa T3
   "Accept-Ranges none dù Range vẫn 206 → full-file" giữ nguyên
   ý nghĩa (vẫn xanh, xem §6).
3. Header **VẮNG** (null/undefined — vd blob: URL: Chrome không
   gửi header này, HEAD còn ném lỗi) + đã có ít nhất một response
   Range 206 **KIỂM CHỨNG NGHIÊM NGẶT** (status 206 +
   Content-Range khớp đúng range đã xin + khớp tổng đã biết, qua
   `checkRangeProbeResponse`) → đủ. Đây KHÔNG phải giả định: bằng
   chứng là chính response đó — server phớt lờ Range trả 200,
   server trả 206 lệch range/tổng đều bị `checkRangeProbeResponse`
   loại (test khóa §3: Range bị phớt lờ → full-file ở probe).

Không có trường hợp riêng theo loại URL: không sniff `blob:` hay
bất kỳ scheme nào; cùng một luật áp cho mọi URL. T3 chỉ được
truyền `rangeProvenByVerifiedProbe: true` sau khi probe VÀ tiền tố
đều đã qua kiểm chứng nghiêm ngặt (cờ bật sau prefix check, ngay
trước lần gọi gate đầu tiên); bước nào hỏng cũng đã fallback trước
khi tới gate.

### 2.3 Vì sao không vi phạm U2 "không giả định"

- U2 cấm: suy Range từ loại URL (vd "là proxyUrl của bridge nên
  chắc hỗ trợ"), từ quy trình tạo file (faststart lúc encode), từ
  header vắng mặt (coi vắng = được). E2 không làm điều nào trong
  ba điều đó: bằng chứng là response 206 đã đo trên ĐÚNG URL đang
  fetch, đúng range đã xin, đúng tổng file đã biết — cùng loại
  bằng chứng mà chính U2 đã dùng cho lần Range đầu tiên
  (`checkRangeProbeResponse`).
- Cờ chứng minh KHÔNG làm yếu kiểm chứng sau đó: tail fetch vẫn
  qua `fetchRangeChecked` (206 + Content-Range khớp mới nhận body);
  từng GOP vẫn qua `fetchRangeChecked`; GOP nào lỗi → toàn bộ
  fallback (không chunk nửa vời). Bằng chứng sai ở đuôi vẫn
  fallback an toàn.
- Hành vi cũ giữ nguyên khi không có bằng chứng: header vắng +
  `rangeProvenByVerifiedProbe` false/missing → vẫn fallback
  `accept-ranges-unknown` (test khóa §3); header `"none"` → vẫn
  fallback `accept-ranges-unsupported` (test khóa T3 cũ).
- Lý do gate thành công ghi rõ nguồn bằng chứng
  (`Range đã chứng minh bằng probe/prefix 206 (không có header
  Accept-Ranges)`) để log/debug phân biệt với đường header.

### 2.4 Cái gì KHÔNG đổi (để khỏi tưởng gate đã nới lỏng chung)

- Thứ tự kiểm tra của gate: moov trước, rồi Range, rồi size.
  File moov-trailing nhỏ (moov nằm gọn trong tiền tố) vẫn fallback
  `moov-trailing` trước khi tới kiểm tra header (B4 giữ nguyên).
- Trần 128 MiB (wiring S4), trần moov 16 MiB, tiền tố 512 KiB,
  cửa sổ đuôi = trần moov: không đổi. File > 128 MiB vẫn khóa S4.
- Z4 (moov tràn tiền tố, faststart chứng minh từ thứ tự box) vẫn
  yêu cầu cùng luật Range mới qua gate — không nới riêng.

## 3. Test khóa đỏ-trước/xanh-sau (blob URL, mock đúng hành vi Chrome)

Test mới `gopBlobUrl49E2.test.ts` (8 test). Mock `blobLikeFetch`
mô phỏng đúng D4 §2.3: HEAD ném `TypeError: Failed to fetch`,
Range → 206 + Content-Range KHÔNG có header Accept-Ranges,
GET không Range → 200 toàn file (để khóa "không bao giờ gọi").
Fixture ffmpeg thật: faststart 320×240 2 s (131.989 byte) +
trailing lớn 640×360 10 s -g 30 (1.542.934 byte, moov ngoài tiền tố
512 KiB — test khóa tiền điều kiện `detectMoovPosition = unknown`
để không khóa nhầm nhánh moov-trailing của file nhỏ).

| Test | Đỏ-trước | Xanh-sau |
|---|---|---|
| gate: faststart + header VẮNG + probe 206 → range-gop-attempt | FAIL (`full-file`) | PASS |
| gate: header `"none"` + probe 206 → VẪN full-file | PASS | PASS |
| gate: header VẮNG + KHÔNG bằng chứng → full-file như cũ | PASS | PASS |
| gate: header `"bytes"` như cũ → range-gop-attempt | PASS | PASS |
| T3 blob faststart → gop-range, 0 GET toàn file | FAIL (`gate: accept-ranges-unknown`) | PASS (60 sample / 6 GOP) |
| T3 blob trailing lớn → gop-range qua tail-scan, 0 GET toàn file | FAIL (`gate: moov-unknown`) | PASS (300 sample / 10 GOP, có tail 206) |
| T3 blob Range bị phớt lờ (200) → full-file ở probe | PASS | PASS |
| controller blob trailing lớn → gopMode gop-range, ready | FAIL (`full-file-fallback`, lý do `gate: moov-unknown`) | PASS |

Đỏ-trước chạy 4/8 (đúng 4 test hành vi mới rớt, đúng lý do cũ);
xanh-sau **8/8**. Mock đã sửa 1 lỗi fidelity trong lúc chạy đỏ:
response mock thiếu trường `ok` nên đường load() fallback của
controller trả false (không liên quan gate); đã thêm `ok: true`
cho mọi response mock trước khi chạy xanh.

## 4. Headed E2E app thật + đo heap (vite :5173 + bridge :8787)

Harness mới `gopHeaded49E2.mjs` (kế thừa D4: fixture trailing
37 MiB thật, import qua input file MediaBin, thêm clip, End về
cuối, bấm "Phát ngược", quan sát 30 s). Thêm so với D4: 2 mode
(`E2_MODE=gop|fallback`), lấy mẫu heap (performance.memory +
RSS cây Chrome qua ps, mẫu Z4) mỗi 500 ms, CDP Network log
request blob:, chẩn đoán controller (`E2_DIAG=1`).

Lưu ý về giàn: vite :5173 đang chạy là vite mồ côi từ lần chạy
đầu của chính E2 (lần đó bridge không lên trong 30 s nên script
thoát trước khối finally, vite không bị kill — E2 đã kiểm chứng
vite này phục vụ đúng code mới: `curl …/gopRangeFetch39T3.ts`
có 5 lần `rangeProvenByVerifiedProbe`, TopBar có
`reversePlaybackHint`; các lần chạy sau dùng SHARED theo đúng
thiết kế D4, không spawn/kill). Lần chạy đầu bridge không lên là
sự cố khởi động một lần (log bridge cho thấy đã chạy nhưng HEAD
probe 30 s không trả 200; lần sau HEAD trả 200 bình thường) —
không phải lỗi app; E2 không sửa bridge.

### 4.1 GOP bật trên blob trong app thật — 16/16 (2 lần chạy)

| Chạy | gopActive | wc hits | playhead | canvas distinct | heap peak (delta) | settled |
|---|---|---|---|---|---|---|
| gop #1 (run C) | **true** | +477 | 72 → 42,5 s | 50 | 102,62 MiB (+81,56) | 39,56 MiB |
| gop #2 (run D) | **true** | +391 | (tương tự) | 50 | 102,28 MiB (+81,12) | 39,13 MiB |

Cả 2 lần: `gopFallbackReasons=[]`, 0 GET toàn file (CDP Network:
194–195 request blob:, 100% mang header Range; resource-timing
blob: 0 entry — Chrome không tạo resource-timing entry cho fetch
blob:, ghi rõ để khỏi tưởng "0 entry = 0 request"), 0 uncaught
exception, 0 console error. Nút K4 trên app thật: aria-label
"Phát ngược", title đúng key i18n mới. Toggle GOP mặc định BẬT
(aria-pressed=true, localStorage null).

**Một lần chạy flake KHÔNG tái hiện (run B, 14/16):** gopActive
false, hits +0, misses +146, fetches +0, playhead chỉ lùi 13,6 s
trong 30 s, baseline heap 58,11 MiB (cao bất thường so với ~21
MiB các lần chạy yên). E2 đã tách nguyên nhân bằng probe trực
tiếp (§4.2): T3 + controller CHẠY ĐƯỢC trên blob: URL thật nên
run B không phải lỗi gate/fix. Giả thuyết còn lại (chưa chứng
minh dứt điểm): lần decode cửa sổ đầu bị đói tài nguyên dưới tải
nặng song song (nhiều luồng đợt 49 chạy headed cùng lúc; run B
chỉ lấy được 28 mẫu/30 s so với 51 mẫu các lần sau — chính vòng
lấy mẫu cũng chậm). 2 lần chạy sau đều 16/16 với số gần như nhau
nên E2 kết luận đây là nhiễu tải, không phải hồi quy — ghi rõ để
đợt sau nếu thấy lại thì điều tra theo hướng decode-window đói
tài nguyên, không phải hướng gate.

### 4.2 Probe trực tiếp T3 + controller trên blob: URL thật (chẩn đoán run B)

Probe ngoài repo `~/scratch-round49-e2/probeBlob49E2.mjs`
(bundle esbuild từ đúng module repo, Chrome headed, blob: URL
tạo từ đúng bytes fixture — không qua vite/bridge/app):

- Hành vi blob: URL: HEAD ném `TypeError: Failed to fetch`;
  Range 0-0 → 206, Content-Range đúng, accept-ranges null,
  first byte `0x00` — khớp D4 §2.3.
- T3 trực tiếp: `gop-range`, 2160 sample / 72 GOP; requests probe
  + prefix + tail (16.777.216 byte) + 72 GOP, toàn 206; fetch calls
  HEAD=1 (ném, bắt gọn), GET Range=75, **GET không Range=0**.
- Controller trực tiếp: ok=true, ready=true,
  `gopMode=gop-range`, fallback null, cacheSize=31,
  `retainedFileBytes=1.068.846` (~1 MiB), 504,7 ms.
- Kết luận probe: T3 + controller chạy được trên blob: URL thật —
  vấn đề run B không nằm ở T3/controller.

### 4.3 Đỉnh heap — nợ D4 §6.2 (đo thật, 3 đường)

| Đường (cùng file 37,19 MiB, Chrome headed, --expose-gc) | baseline JS heap | đỉnh JS heap (delta) | settled (sau gc) | đỉnh RSS (delta) |
|---|---|---|---|---|
| GOP trong app thật (toggle BẬT) — 2 lần | 21,06 / ~21 MiB | **102,62 / 102,28 MiB (+81,56 / +81,12)** lúc t≈4 s | 39,56 / 39,13 MiB | 2408,61 / 2197,61 MiB (+650,80 / +441,48) |
| Element trong app thật (toggle TẮT → engine=element) — 2 lần | 21,02 / ~21 MiB | **37,33 / 40,17 MiB (+16,31 / +18,93)** | 22,44 / 22,54 MiB | 1985,65 / 1986,75 MiB (+250,25 / +227,59) |
| Controller load() cũ (probe trực tiếp, gopRangeEnabled: false) | 41,55 MiB* | **81,08 MiB (+37,70)** | 80,66 MiB | (không đo) |

\* Baseline probe cao hơn app (~41,55 so với ~21) vì probe tạo
Blob từ ArrayBuffer đã fetch (byte fixture nằm trong JS heap của
chính trang probe) — artifact của probe, không phải của controller;
delta +37,70 MiB mới là số có nghĩa (bằng đúng kích thước file).

Đọc số trung thực (không tô hồng GOP):
- **Đỉnh JS-heap transient của đường GOP (+81,5 MiB) CAO HƠN cả
  đường tải toàn file (+37,7 MiB).** Nguyên nhân: T3 giữ cùng lúc
  tail 16,7 MiB + chunk mọi GOP (~37 MiB) + prefix trước khi cửa
  sổ đầu tiên xong và transient rơi khỏi scope; đường load() chỉ
  giữ 1 arrayBuffer 37 MiB. Lợi ích thật của GOP không phải "đỉnh
  heap thấp hơn" mà là: (a) **không có GET toàn file** (Range từng
  GOP, làm việc được trước khi đủ dữ liệu — quan trọng cho file
  lớn/remote), (b) **retention sau đó có trần** (retainedFileBytes
  ~1 MiB, cache GOP ≤ 32 MiB; settled app 39,6 MiB so với load()
  settled 80,7 MiB trong probe — nhưng so sánh settled này lệch
  baseline probe, chỉ dùng làm hướng), (c) decode cửa sổ nhanh
  (~1× realtime, hits +477/+391).
- Đường element (toggle TẮT) có đỉnh JS-heap thấp nhất (+16–19
  MiB) vì video element decode native (bộ nhớ nằm ở RSS, delta
  RSS +228–250 MiB) — nhưng không dùng được lợi ích GOP và phụ
  thuộc element-seek (hold nhiều: draw +137–168 / hold +733–872
  so với GOP draw +68–69 / hold +357–428).
- Đỉnh RSS chênh lớn giữa các lần chạy (+441 vs +651 MiB ở GOP)
  vì máy chạy nhiều Chrome song song (RSS gồm cả baseline trình
  duyệt + VideoFrame native); chỉ DELTA so với baseline cùng lần
  chạy mới có nghĩa, và số RSS không dùng để kết luận trần.
- **Chưa đo:** Safari, máy thật, GPU thật, baseline quiet/fps
  (toàn bộ headed là Chromium Linux + Xvfb + render phần mềm,
  under-load). Tốc độ lùi ~1× realtime ở các lần chạy yên không
  phải baseline quiet.

Phát hiện phụ trong lúc đo fallback (đã sửa harness, không phải
lỗi app): toggle TẮT khiến `resolveReverseEngine()` = `"element"`
nên preview KHÔNG gọi `frameAt`/controller — `wc hits/misses`
= 0/0 và `gopFallbackReasons=[]` là đúng theo thiết kế. Harness
ban đầu khóa sai 2 cổng này ở mode fallback (đòi reasons non-empty
+ hits ≥ 10); đã sửa cổng cho đúng thiết kế rồi chạy lại:
fallback **17/17**.

## 5. i18n nút "Phát ngược" K4

2 key mới, đặt trước `reverseWebcodecs` (thứ tự alphabet):

| Key | vi | en |
|---|---|---|
| `topbar.reversePlayback` | Phát ngược | Reverse playback |
| `topbar.reversePlaybackHint` | Phát ngược (phím J) — playhead chạy lùi từng frame, không có audio đồng bộ | Reverse playback (J key) — playhead steps backward frame by frame, no synced audio |

- Parity toàn file **vi = en = 973 key** (971 của D4 + 2 key mới),
  test E2 3/3, test D4 3/3 (đã bump 971 → 973).
- Giá trị vi của aria-label giữ nguyên "Phát ngược" như bản
  hardcode cũ — selector harness `[aria-label="Phát ngược"]`
  không đổi; harness headed E2 đã bấm đúng nút này và đọc đúng
  title i18n trên app thật (cổng `app-k4-i18n-label` pass cả 3 lần
  chạy headed).
- Snapshot đếm key bump 971 → 973 ở B6/Z6/D4/saveToast31/
  structuredNotes32/errorDetail34Q4 (chỉ comment) — xem §1.2.

## 6. Kiểm chứng + hồi quy

```
# Test mới E2 (đỏ-trước/xanh-sau)
./node_modules/.bin/esbuild apps/web/src/lib/gopBlobUrl49E2.test.ts \
  --bundle --platform=node --format=cjs --outfile=<scratch>/e2.test.cjs \
  && node <scratch>/e2.test.cjs
# Test i18n K4 mới
./node_modules/.bin/esbuild apps/web/src/lib/reversePlaybackI18n49E2.test.ts \
  --bundle --platform=node --format=esm --outfile=<scratch>/e2i18n.test.mjs \
  && node <scratch>/e2i18n.test.mjs
# Hồi quy (esbuild bundle, format esm trừ U2/T3/V2 dùng cjs)
# Headed E2E app thật
node apps/web/scripts/gopHeaded49E2.mjs
E2_MODE=fallback node apps/web/scripts/gopHeaded49E2.mjs
# Probe chẩn đoán blob trực tiếp (ngoài repo, không đưa vào batch)
node ~/scratch-round49-e2/probeBlob49E2.mjs
```

| Nhóm | Kết quả thật |
|---|---|
| E2 mới `gopBlobUrl49E2` | **8/8** (đỏ-trước 4/8, xem §3) |
| E2 mới `reversePlaybackI18n49E2` | **3/3** |
| Hồi quy U2 `reverseRangeGate38U2` | **20/20** |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** (gồm test khóa "Accept-Ranges none dù Range vẫn 206") |
| Hồi quy V2 `gopWiring40V2` | **16/16** |
| Hồi quy A4 `gopTail45A4` | **18/18** |
| Hồi quy B4 `gopTail46B4` | **13/13** |
| Hồi quy C5 `gopTail47C5` | **11/11** |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Hồi quy Z4 `gopMoovHeader44Z4` | **19/19** |
| Hồi quy Y4 `gopMoovLarge43Y4` | **10/10** |
| Hồi quy `reversePlayback` | **10/10** |
| Hồi quy `reversePreviewGate` | **12/12** |
| Hồi quy A6 `reverseBadge45A6` | **12/12** |
| Hồi quy Y6 `reverseCompat43Y6` | **11/11** |
| Hồi quy D4 `reverseToggleI18n48D4` | **3/3** (đã bump 971 → 973) |
| Hồi quy B6 `reverseBadge46B6` | **8/8** (trước đây 7/8 — đã bump 971 → 973) |
| Hồi quy Z6 `reverseCompat44Z6` | **10/10** (trước đây 9/10 — đã bump 971 → 973) |
| Hồi quy `saveToast31` | **15/15** (trước đây 14/15 — đã bump 971 → 973) |
| Hồi quy `structuredNotes32` | **12/12** |
| Hồi quy `errorDetail34Q4` | **35/35** |
| Headed E2E `gopHeaded49E2` mode=gop | **16/16** (2 lần chạy; + 1 lần flake 14/16 không tái hiện, xem §4.1) |
| Headed E2E `gopHeaded49E2` mode=fallback | **17/17** (sau khi sửa 2 cổng harness khóa sai thiết kế) |
| Probe blob trực tiếp `probeBlob49E2` | T3 gop-range 2160/72 GOP; controller gop-range; load() delta heap +37,70 MiB |
| `tsc --noEmit -p apps/web/tsconfig.json` | **Sạch, exit 0** |
| `vite build` (từ `apps/web/`, outDir /tmp) | **pass (7,60 s)**, chỉ cảnh báo chunk > 500 kB cũ |

## 7. Giới hạn còn lại và nợ follow-up (trung thực)

1. **Đỉnh JS-heap transient của GOP (+81,5 MiB) cao hơn đường tải
   toàn file (+37,7 MiB)** — xem §4.3. Nếu muốn giảm đỉnh này,
   hướng là T3 streaming (chỉ fetch GOP của cửa sổ, không fetch
   mọi GOP lượt đầu) — CHƯA làm trong E2; trần 128 MiB giữ nguyên,
   không đề xuất mở trần.
2. **Một lần chạy headed flake (run B, 14/16) không tái hiện** —
   gopActive false + hits +0 dưới tải nặng song song; 2 lần chạy
   sau đều 16/16. Chưa chứng minh dứt điểm; đợt sau nếu thấy lại
   thì điều tra hướng decode-window đói tài nguyên (kèm số mẫu lấy
   được/30 s + baseline heap làm chỉ báo tải), không phải hướng gate.
3. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, baseline
   quiet / fps.** Toàn bộ headed ở đây là Chromium Linux + Xvfb +
   render phần mềm, under-load. Tốc độ lùi ~1× realtime ở các lần
   chạy yên không phải baseline.
4. **Harness phụ thuộc fixture ngoài repo:** fixture headed chỉ nằm
   ở `~/scratch-round47-c5/trailing-real37.mp4` (encode thật đợt 47,
   KHÔNG đưa vào repo/batch); script E2 kiểm tra đúng 38.996.431
   byte, nếu mất thì encode lại y hệt tham số C5. Probe chẩn đoán
   chỉ nằm ở `~/scratch-round49-e2/` (ngoài repo).
5. **Snapshot 973 là số đúng tại thời điểm E2 chạy test cuối.**
   Các luồng khác đợt 49 đang chạy song song; nếu luồng nào thêm
   key i18n sau thời điểm này thì parent gộp bump lại theo tổng
   thực tế (parity vi==en + đủ key mới mới là khóa cứng).
6. **Lưu ý nhỏ về harness (kế thừa D4):** selector
   `.media-card .media-dur` lấy card đầu tiên (card mẫu 4 s) nên số
   media-dur trong log không phải của file 37 MiB — không ảnh hưởng
   cổng nào (cổng dùng duration project).
7. **Bridge khởi động chậm một lần:** lần chạy headed đầu của E2,
   bridge không trả HEAD 200 trong 30 s chờ (log cho thấy đã chạy)
   nên script thoát trước khối finally và để lại vite mồ côi (E2 đã
   dùng SHARED sau đó, không kill vite của luồng khác). Không phải
   lỗi app; nhưng harness các đợt sau nên tăng thời gian chờ bridge
   hoặc dọn vite mồ côi khi throw trước try.

## 8. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/gopBlobUrl49E2.test.ts` (mới, 8 test)
- `apps/web/src/lib/reversePlaybackI18n49E2.test.ts` (mới, 3 test)
- `apps/web/scripts/gopHeaded49E2.mjs` (mới, harness headed E2E)
- `apps/web/src/lib/reverseRangeGate38U2.ts` (sửa: `rangeSupportEstablished` + field `rangeProvenByVerifiedProbe`)
- `apps/web/src/lib/gopRangeFetch39T3.ts` (sửa: truyền bằng chứng 206 vào gate + cửa tail-scan)
- `apps/web/src/TopBar.tsx` (sửa: nút K4 dùng i18n; marker ROUND49-E2)
- `apps/web/src/i18n/vi.json` (sửa: +2 key `topbar.reversePlayback*`)
- `apps/web/src/i18n/en.json` (sửa: +2 key `topbar.reversePlayback*`)
- `apps/web/tsconfig.json` (sửa: +2 dòng exclude test mới)
- `apps/web/src/lib/reverseBadge46B6.test.ts` (sửa: bump snapshot 971 → 973)
- `apps/web/src/lib/reverseCompat44Z6.test.ts` (sửa: bump snapshot 971 → 973)
- `apps/web/src/lib/saveToast31.test.ts` (sửa: bump snapshot 971 → 973)
- `apps/web/src/lib/structuredNotes32.test.ts` (sửa: bump snapshot 971 → 973)
- `apps/web/src/lib/reverseToggleI18n48D4.test.ts` (sửa: bump snapshot 971 → 973)
- `apps/web/src/lib/errorDetail34Q4.test.ts` (sửa: chỉ comment đếm key 971 → 973)
- `docs/PHASE9_ROUND49_E2_GOP_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch ngoài repo: `~/scratch-round49-e2/` (profile Chrome +
bridge work-dir + probe chẩn đoán — KHÔNG đưa vào batch). Fixture
tái dùng: `~/scratch-round47-c5/trailing-real37.mp4` (KHÔNG đưa
vào batch).
