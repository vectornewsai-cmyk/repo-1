# Phase 9 đợt 43, luồng Y4 — GOP mở rộng: heap file 128 MiB+, moov 16 MiB thật, headed qua bridge Express thật — LIMITS

Ngày: 04/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary/dist vào
batch. Ngưỡng 32 MiB / trần 128 MiB / mặc định GOP TẮT GIỮ NGUYÊN
(kết luận §1.1). Không tự stage paths-loop hay ghi build-loop-log
(parent gộp, như tiền lệ X4).
Đóng nợ đợt 42 §5.5, mục GOP (3 nợ): (1) đo heap browser headed trên
file 128 MiB+ thật để quyết mở lại trần; (2) moov 16 MiB thật; (3)
headed qua route bridge Express thật (harness X4 dùng server
node:http tối giản).

## 0. Kết luận ngắn (không vượt số đo)

1. **GIỮ TRẦN 128 MiB — không đề xuất trần mới.** File thật 141,52 MiB
   (240 s, 7200 sample, 240 GOP) qua đường GOP trên Chromium headed:
   đỉnh transient JS heap = 153,84 MiB (1,087× file, §2.1); sau khi nhả
   outcome + gc chỉ còn dư 0,11 MiB (transient nhả sạch, không leak);
   nhưng sau khi controller decode + vẽ 1 cửa sổ 91 frame, heap vẫn
   giữ 143,72 MiB. Luật scale đã đo được là transient ≈ 1,09× file
   (thấp hơn ước lượng Node 1,5–1,7× của W4, nhưng vẫn > 1×), và T3
   hiện fetch MỌI GOP ngay lượt đầu nên transient tăng tuyến tính
   theo file — file 256 MiB sẽ transient ≈ 279 MiB JS heap trước cả
   frame. Một lần đo under-load, render phần mềm, dưới Xvfb, trên VM
   8 GB, lại không đo được bộ nhớ native của VideoFrame, KHÔNG đủ
   làm giấy phép mở trần cho thiết bị thật (kể cả mobile-web). Muốn
   bàn lại trần phải có trước: T3 streaming (chỉ fetch GOP của cửa sổ,
   phá luật tuyến tính), đo RSS tiến trình + bộ nhớ VideoFrame native,
   và lặp lại ở cửa sổ quiet (§6.3).
2. **Moov 16 MiB thật → GOP fallback đúng, phát vẫn chạy bằng đường
   full-file.** File moov đúng 16.777.216 byte (tạo bằng script §3.1,
   ffprobe vẫn đọc đủ 1800 frame): T3 trả `full-file`, lý do
   `gate: moov-unknown` (không phải `moov-too-large`), chỉ tốn
   HEAD + probe + tiền tố = 525.312 byte, 0 request moov/GOP; headed
   qua bridge: `gopMode = full-file-fallback`, vẽ ngược 91 frame
   missing 0, canvas 100% pixel khác 0. Phát hiện kiến trúc (§3.3):
   với tiền tố mặc định 512 KiB, MỌI moov > 512 KiB đều bị gate chặn
   trước khi tới nhánh fetch moov riêng hay trần 16 MiB của T3 —
   nhánh đó và trần 16 MiB thực tế không bao giờ chạm tới được.
   File moov cuối thật cũng fallback đúng (`moov-unknown`, vì mdat
   khổng lồ cắt dở tiền tố — nhánh `moov-trailing` chỉ gặp khi mdat
   nằm gọn trong tiền tố, xem §3.2).
3. **Headed qua bridge Express thật: 14/14 cổng — NHƯNG chỉ sau khi
   sửa 1 bug thật của bridge.** Lần chạy đầu qua bridge: GOP fallback
   với lý do `probe-range-probe-no-content-range` dù bridge trả 206
   đúng. Nguyên nhân (§4.2): web UI thật (vite :5173) fetch bridge
   (:8787) là cross-origin khác port, trình duyệt lọc
   `Accept-Ranges`/`Content-Range` khỏi JS (không nằm trong
   CORS-safelisted headers) trừ khi bridge expose chúng — harness X4
   cùng origin và test Node của W4 đều không lộ lỗi này, nên đường
   GOP từ web UI thật chưa bao giờ kích hoạt được. Sửa: bridge thêm
   `exposedHeaders: ["Accept-Ranges", "Content-Range"]` (hunk
   ROUND43-Y4, §5.2). Sau sửa, headed qua bridge cho số Y HỆT X4:
   63 request đường controller (1 HEAD probe + 62×206),
   37.528.720 byte = 101,16% file, vẽ ngược 91 frame missing 0,
   cửa sổ lặp 0 request / 0 byte. Khác biệt duy nhất so với harness
   tối giản là +1 HEAD do chính bước kiểm tra CORS của harness, và
   byte encoded cao hơn body ~39 KiB (header HTTP).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Mới

- `apps/web/src/lib/gopMoovLarge43Y4.test.ts` — 10 test (§3.4).
- `apps/web/scripts/make-moov-large-fixture-43y4.py` — tạo fixture
  moov ~16 MiB từ file faststart thật (§3.1).
- `apps/web/scripts/gop-headed-heap-43y4.mjs` — harness đo heap (§2).
- `apps/web/scripts/gop-headed-bridge-43y4.mjs` — harness headed qua
  bridge thật (§4).
- `docs/PHASE9_ROUND43_Y4_GOP_LIMITS.md` — file này.

### 1.2 Sửa (mỗi file đúng 1 hunk có marker ROUND43-Y4, trừ tsconfig)

- `server/bridge/src/index.js` — CORS middleware thêm
  `exposedHeaders: ["Accept-Ranges", "Content-Range"]` + chú thích
  ROUND43-Y4 giải thích lỗi và phạm vi an toàn (origin vẫn chỉ
  loopback; chỉ expose metadata range của file caller vốn đã fetch
  được, không mở thêm dữ liệu). Không đổi route, rate-limit, hay
  hành vi sendFile nào khác.
- `apps/web/tsconfig.json` — chỉ +1 dòng exclude cho test mới
  (tiền lệ X4; JSON không viết được comment nên "marker" ở đây là
  chính tên file `gopMoovLarge43Y4.test.ts` trong dòng thêm).

### 1.3 Không đụng (ghi rõ)

Ngưỡng 32 MiB / trần 128 MiB / mặc định TẮT / cache GOP 32 MiB,
`gopRangeFetch39T3.ts`, `reverseRangeGate38U2.ts`, `gopCache40V2.ts`,
`reverseWebcodecs.ts`, `gopSizeProbe41W4.ts`, mọi file luồng khác
đợt 43. Đặc biệt KHÔNG sửa gate/T3 để "cho moov lớn chạy được" —
§3.3 là phát hiện để đợt sau thiết kế lại, không phải thứ sửa lén
trong luồng đo. `apps/web/dist/` build lại lúc kiểm chứng không vào
batch theo tiền lệ. Không tự stage paths-loop hay ghi build-loop-log
(parent gộp).

## 2. Nợ 1 — Heap browser headed trên file 128 MiB+ thật

### 2.1 Giàn đo (để người khác lặp lại được)

- Fixture ffmpeg thật (lệnh chính xác):
  `ffmpeg -f lavfi -i "testsrc2=size=1280x720:rate=30:duration=240"
  -f lavfi -i "sine=frequency=440:duration=240" -map 0:v -map 1:a
  -c:v libx264 -pix_fmt yuv420p -crf 18 -g 30 -bf 3 -c:a aac -b:a
  128k -movflags +faststart big240.mp4`
  → 240 s, 7200 frame, 1280×720, size thật 148.390.934 byte
  (141,52 MiB), 240 GOP, audio AAC xen kẽ.
- Harness `gop-headed-heap-43y4.mjs` (từ gốc repo, fixture mặc định
  `/tmp/round43-y4/big240.mp4`): server node:http tối giản 3 path
  cùng 1 file (Range thật, log request); Chromium headed thật từ
  cache ms-playwright (chromium-1248), dưới Xvfb, `--disable-gpu`
  (công thức X4) + `--enable-precise-memory-info` +
  `--js-flags=--expose-gc` để page gọi `window.gc()` và
  `performance.memory` chính xác. Harness poll `performance.memory`
  mỗi 100 ms trong lúc promise chạy để bắt đỉnh transient, không chỉ
  đo trước/sau. Số heap ở đây là JS heap (`usedJSHeapSize`) —
  KHÔNG bao gồm bộ nhớ native của VideoFrame đã decode; khi kết luận
  phải cộng thêm phần đó (chưa đo được), không đọc JS heap thành
  tổng bộ nhớ tiến trình.
- Ba bước trong cùng page (path riêng để kế toán sạch):
  (1) T3 trực tiếp `fetchVideoTrackByGopRange`, giữ outcome trong
  window (mọi chunk GOP) rồi nhả + gc;
  (2) Controller GOP + `largeFileBytes` override 512 MiB — CHỈ TRONG
  HARNESS ĐO, KHÔNG đổi mặc định production (override test-only
  này là cách duy nhất để đo đường GOP trên file > 128 MiB mà không
  đụng trần S4);
  (3) Đối chứng production: controller GOP bật, trần MẶC ĐỊNH
  128 MiB, cùng file.

### 2.2 Số đo thật (JSON đầy đủ tại `/tmp/round43-y4/heap-result.json`
— scratch, không vào batch)

| Đo | Số thật |
|---|---|
| T3 trực tiếp | mode `gop-range`, 7200 sample, 240 GOP, 243 request (1 HEAD + 242×206 = probe + tiền tố + 240 GOP), 148.533.060 byte = 100,10% file; `totalGopRangeBytes` 148.007.748, `totalSampleBytes` = chunk data tổng 144.288.638 (khớp từng byte, max GOP 639.156 byte), 0 GET toàn file |
| Baseline sau gc | JS heap used 0,68 MiB, gc có sẵn (`window.gc === true`) |
| T3: đỉnh transient | 154,52 MiB; delta so với baseline **153,84 MiB = 1,087× file** |
| T3: lúc giữ outcome | 154,57 MiB (delta 153,89 MiB = 1,087× file) |
| T3: sau nhả + gc | 0,79 MiB (delta chỉ **0,11 MiB** — transient nhả sạch, không leak ở tầng giữ chunk) |
| Controller override 512 MiB | `gop-range`, probe `{head, 148390934}`, drawn 91, missing 0, canvas 100% pixel khác 0, retainedFileBytes 2.458.589 (chỉ chunk GOP của cửa sổ, đúng thiết kế V2); đỉnh 154,44 MiB (delta 153,76 MiB = 1,091× file) — đỉnh controller ≈ đỉnh T3, vì decode chạy sau khi transient T3 đã nhả |
| Controller override: sau decode + vẽ | JS heap **143,72 MiB** — vẫn giữ lớn sau cửa sổ (frame cache 91 frame + chunk cửa sổ + bộ nhớ decoder); đây là trạng thái ổn định sau decode, không phải transient thoáng qua |
| Đối chứng mặc định 128 MiB | ensure=false, failed=true, largeFileFallback=true, `gopMode=off`, probe `{head, 148390934}`; path đối chứng chỉ 1 HEAD, **0 GET toàn file, 0 byte body** — khóa S4 vẫn chặn đúng trên file 128 MiB+ thật, không tải body rồi mới khóa |
| Wiring (page, cùng size) | mặc định: `gop-large-file-locked: 148390934 > 134217728`; override 512 MiB: `gop-range` |

### 2.3 Đọc đúng + quyết định giữ trần

- Luật scale đo được: transient JS heap ≈ **1,09× kích thước file**
  (chunk data 137,6 MiB + 1 GOP buffer đang cắt 0,61 MiB + ~15 MiB
  overhead fetch/runtime — cao hơn kế toán chunk thuần, thấp hơn
  khoảng Node 1,5–1,7× của W4 vì Node đo gộp cả rác undici chưa GC).
  Ngoại suy tuyến tính (T3 fetch mọi GOP lượt đầu): file 192 MiB →
  transient ≈ 209 MiB JS heap; file 256 MiB → ≈ 279 MiB JS heap,
  chưa tính frame decode và chưa tính bộ nhớ native VideoFrame.
- Vì sao vẫn GIỮ 128 MiB dù đỉnh 154 MiB "vừa" trong ngân sách
  320 MiB của S4 trên VM này: (a) chỉ 1 lần đo under-load (các luồng
  đợt 43 khác đang chạy), render phần mềm, Xvfb — không phải bằng
  chứng an toàn cho thiết bị thật; (b) JS heap không phải tổng bộ
  nhớ: sau decode heap vẫn 143,72 MiB mà chưa kể native VideoFrame,
  nên tổng thật cao hơn số này; (c) T3 tuyến tính theo file — mở
  trần mà không sửa T3 chỉ dời điểm vỡ, không hết vỡ; (d) máy đích
  không xác định (có cả mobile-web), VM 8 GB không đại diện cho
  máy yếu. Không có trần mới nào được đề xuất từ đợt này.
- Điểm sáng trung thực: transient nhả sạch (dư 0,11 MiB sau gc) và
  khóa mặc định chặn trước cả body — hai tính chất này làm cho
  đường GOP hiện tại an toàn ở trần cũ, chỉ chưa đủ để nới trần.

## 3. Nợ 2 — Moov 16 MiB thật + moov cuối file

### 3.1 Tạo file moov 16 MiB thật (không bịa moov)

Script `make-moov-large-fixture-43y4.py` (trong repo, chạy ngoài
đợt đo): lấy file faststart thật 60 s (base60.mp4, 37.100.156 byte,
moov gốc 64.629 byte), chèn 1 box `free` làm con cuối của moov để
moov phình tới đúng target, rồi cộng delta vào mọi entry stco/co64
(vì moov đứng trước mdat nên chunk offset tuyệt đối dịch đúng bằng
delta). Script tự fail nếu không dịch được entry nào.
Kết quả: moov **64.629 → 16.777.216 byte (đúng 16,00 MiB)**,
delta 16.712.587, 3.598 entry stco/co64 đã dịch, file
37.100.156 → 53.812.743 byte. Kiểm chứng file vẫn hợp lệ:
ffprobe đọc duration 60 s, video 1800 frame, audio 2585 frame như
gốc; demux toàn file bằng `parseMp4VideoTrack` cho cùng 1800 sample,
mọi offset = gốc + delta, size/key khớp từng sample.

### 3.2 Số đo thật (Node qua HTTP Range thật + headed qua bridge)

| File | T3 (Node, Range thật) | Headed qua bridge (GOP bật) |
|---|---|---|
| moovlarge60 (moov 16 MiB, 53.812.743 B) | `full-file`, lý do `gate: moov-unknown: chưa xác định được vị trí moov từ tiền tố đã đọc`; request HEAD + probe 1024 B + prefix 524.288 B = **525.312 byte**, 0 request moov/GOP, không fetch thừa | `gopMode = full-file-fallback`, cùng lý do gate; rồi load full-file vẽ ngược **91 frame, missing 0, canvas 100%**; path GOP: 6 request (HEAD kiểm tra CORS 1 + probe HEAD 1 + probe 206 + prefix 206 + load HEAD 1 + full GET 1), body 54.338.055 = 100,98% file |
| trailing60 (không faststart, 37.100.156 B; thứ tự box ftyp, free, mdat, moov) | `full-file`, lý do `gate: moov-unknown` (cùng lý do — xem §3.3 vì sao không phải `moov-trailing`); request và byte y hệt 525.312 byte | `gopMode = full-file-fallback`, cùng lý do; vẽ ngược **91 frame, missing 0, canvas 100%**; đường mặc định trên cùng file: vẽ ngược 91 frame missing 0 (xem lưu ý flake dưới) |

Lưu ý flake (trung thực, không giấu): lần chạy headed trailing ĐẦU
tiên, bước mặc định trả ensure=false, drawn=0, và CDP không ghi
được response nào cho path mặc định (encoded 0) — trong khi đường
GOP-fallback trên cùng file, cùng lần chạy, vẽ đủ 91 frame và
demux Node parse file tốt. Chạy lại y hệt lần thứ hai: bước mặc
định PASS đủ (drawn 91, missing 0, full GET đúng 1). Kết luận:
flake under-load (mất event CDP / hiccup socket nhất thời), KHÔNG
phải bug xác định của file trailing — bằng chứng là lần chạy lại
pass và mọi đường khác trên cùng file đều pass cả hai lần. Số
trailing mặc định được ghi nhận là kết quả lần chạy lại; lần flake
được giữ lại trong log `/tmp/round43-y4/bridge-trailing.log` để
đối chiếu, không xóa.

### 3.3 Phát hiện kiến trúc: trần moov 16 MiB không bao giờ chạm tới

Chuỗi chặn với tiền tố mặc định 512 KiB (đọc code, không đoán):
`detectMoovPosition` duyệt box top-level trong tiền tố; gặp box moov
cắt dở ở cuối tiền tố thì DỪNG mà chưa đánh dấu `seenMoov` → trả
`unknown` → gate từ chối trước mọi bước sau. `scanTopBoxes` cũng
dừng ở box cắt dở nên `moovBox` chỉ tồn tại khi moov nằm GỌN trong
tiền tố. Hệ quả:
- Mọi moov > 512 KiB (kể cả 600 KiB, dưới trần 16 MiB) đều fallback
  `moov-unknown`, không bao giờ tới nhánh `moov-too-large` hay
  nhánh fetch moov riêng (bước 5 của T3, nhánh `moovBox.start +
  moovBox.size > prefix.length` là nhánh chết với cùng 1 buffer
  tiền tố cho cả gate và scan).
- Nhánh `moov-trailing` chỉ gặp khi mdat nằm GỌN trong tiền tố rồi
  mới tới moov — file không faststart thật (mdat hàng chục MB) luôn
  cho `moov-unknown`, không phải `moov-trailing`; cả hai đều fallback
  an toàn với cùng chi phí 525.312 byte, chỉ khác chuỗi lý do.
- "Init chunk / moov fetch có đúng không?" — trả lời thẳng: với
  moov > 512 KiB thì KHÔNG CÓ moov fetch nào xảy ra (đúng vì gate
  chặn trước, không sai dữ liệu; sai nếu ai claim T3 đã fetch moov
  riêng). Muốn GOP chạy được trên moov lớn phải đổi thiết kế ở đợt
  sau: đọc header moov (size) rồi fetch range moov TRƯỚC khi gate
  kết luận, hoặc tăng tiền tố — và phải đo lại từ đầu, không sửa
  lén trong luồng đo này.

### 3.4 Test mới khóa hành vi (10/10 ngay lần chạy đầu)

`gopMoovLarge43Y4.test.ts` (fake fetch + buffer tổng hợp, không cần
fixture 16 MiB trong repo — tiền tố tổng hợp byte-identical với
tiền tố file thật ở 512 KiB đầu nên gate/scan cho cùng kết quả):
gate moov 16 MiB cắt dở → unknown; biên 512 KiB + 1 byte cũng
unknown; scan tiền tố moov 16 MiB chỉ thấy ftyp; T3 moov 16 MiB →
full-file `moov-unknown`, request chỉ head/probe/prefix, không fetch
vượt tiền tố; T3 moov 600 KiB → vẫn `moov-unknown`, KHÔNG rơi vào
`moov-too-large` (khóa trần 16 MiB không chạm tới được); gate mdat
nhỏ + moov sau → trailing; gate mdat khổng lồ cắt dở → unknown;
T3 moov cuối (mdat nhỏ) → `moov-trailing`, không GOP; wiring file
140 MiB → `gop-large-file-locked`; wiring file 51 MiB → đủ điều
kiện (gate mới là rào cản).

## 4. Nợ 3 — Headed qua route bridge Express thật

### 4.1 Giàn đo (khác X4 ở đúng chỗ cần khác)

Harness `gop-headed-bridge-43y4.mjs` (fixture mặc định
`/tmp/round43-y4/base60.mp4`, cùng công thức X4: 60 s, B-frame +
audio AAC, faststart, 37.100.156 byte):
- Bridge THẬT: chạy nguyên vẹn `server/bridge/src/index.js` (chỉ
  khác 1 hunk CORS §5.2) trên cổng 8943 với
  `BRIDGE_WORK_DIR=/tmp/round43-y4/bridge-work`,
  `BRIDGE_RATE_GENERAL=5000` (tiền lệ W4). Fixture đặt sẵn vào
  `<work>/proxies/` dưới 2 tên (bridge-a.mp4, bridge-b.mp4) rồi
  phục vụ qua route thật `GET /api/proxy/file/:name` (Express
  sendFile, hỗ trợ Range sẵn) — đúng cách W4 đã dùng; KHÔNG qua
  POST /api/proxy (route đó transcode ra proxy nhẹ, không phải file
  đo). Page/bundle serve từ server harness riêng trên loopback
  (bridge không có route static cho page) — origin loopback nên
  CORS bridge cho phép; đây cũng chính là cấu hình cross-origin
  của web UI thật (vite :5173 → bridge :8787).
- Kế toán phía BROWSER bằng CDP Network (requestWillBeSent +
  responseReceived + loadingFinished) vì bridge không log request:
  body byte suy từ Content-Range/Content-Length của header response
  (HEAD = 0 — harness từng tính sai HEAD = Content-Length ở lần
  chạy đầu, đã sửa và ghi rõ ở §4.3).
- Chromium headed thật, công thức X4 (Xvfb, `--disable-gpu`,
  target type=page). Không mạo nhận màn hình vật lý / GPU thật.

### 4.2 Lần chạy đầu THẤT BẠI — và bug thật tìm được

Lần chạy đầu qua bridge (trước sửa CORS): GOP fallback, lý do
`probe-range-probe-no-content-range: 206 nhưng thiếu Content-Range
hợp lệ`, path GOP có 1 full GET, vẽ ngược vẫn 91 frame (bằng đường
full-file). Chẩn đoán: từ page cross-origin, `fetch` HEAD/Range tới
bridge trả status đúng nhưng `headers.get("content-range")` và
`headers.get("accept-ranges")` đều null — vì hai header này không
nằm trong CORS-safelisted headers, trình duyệt lọc khỏi JS trừ khi
server gửi `Access-Control-Expose-Headers`. Kiểm chứng chéo:
cùng lúc đó, HEAD/Range từ Node (không qua CORS) thấy đủ
`Content-Length` + `Accept-Ranges: bytes` + `Content-Range`
đúng — nên W4 (Node) và X4 (cùng origin) không thể lộ lỗi này.
Hệ quả production: web UI thật fetch bridge cross-origin khác port,
nên đường GOP chưa bao giờ kích hoạt được từ UI thật — luôn
fallback ở bước probe của T3. Đây là bug, không phải giới hạn đo.

### 4.3 Số đo thật sau sửa CORS (14/14 cổng)

Node kiểm tra bridge (không qua browser): HEAD → 200 +
`Content-Length: 37100156` + `Accept-Ranges: bytes`; Range 0-0 →
206 + `Content-Range: bytes 0-0/37100156`. Từ page: fetch HEAD
thành công, đọc được `Accept-Ranges: bytes` (nhờ expose); lưu ý
`Access-Control-Allow-Origin` đọc từ JS vẫn null — ĐÚNG luật
browser (ACAO không safelisted/không exposed), không phải lỗi CORS:
bằng chứng CORS cho phép là fetch thành công và đọc được
status/length (fetch bị chặn CORS sẽ reject, không trả 200).

| Đo (qua bridge thật) | Số thật | So với X4 (node:http tối giản) |
|---|---|---|
| GOP: gopMode / probe | `gop-range`, probe `{head, 37100156}`, fallback null | giống hệt |
| GOP: request đường controller | 63 = 1 HEAD probe + 62×206 (probe + tiền tố + 60 GOP) | giống hệt 63 của X4 |
| GOP: byte lượt đầu | **37.528.720 = 101,16% file** (thừa 428.564 byte = tiền tố + probe) | giống hệt từng byte với X4 |
| GOP: frame ngược | drawn 91, missing 0, canvas 921.600/921.600 pixel khác 0 (100%) | giống hệt |
| Cửa sổ lặp cùng mốc | **0 request / 0 byte** (tiết kiệm đúng 37.100.156 byte) | giống hệt |
| Mặc định | `off`, probe null, 1 HEAD (load probe) + 1 GET toàn file = 37.100.156 byte, drawn 91, missing 0 | giống hệt |
| Kế toán CDP (thêm) | encoded bytes đường GOP 37.568.093 (hơn body ~39 KiB = header HTTP); path GOP tổng cộng trong log CDP là 64 request vì gồm cả 1 HEAD kiểm tra CORS của chính harness — không phải request của controller | X4 đếm log server nên không có 2 số này |

Khác biệt thật duy nhất giữa bridge và harness tối giản: (a) trước
sửa CORS, bridge làm GOP fallback hoàn toàn (lỗi đã sửa); (b) sau
sửa, hành vi byte/request của route sendFile khớp từng byte với
server tối giản — không có overhead hay lệch pha nào khác. Sửa
kế toán harness: HEAD tính body 0 (lần đầu tính nhầm thành
Content-Length, làm path GOP phình 4× file — chỉ sai số kế toán,
không sai hành vi).

## 5. Kiểm chứng + hồi quy

```
# Test mới Y4 + hồi quy (esbuild bundle, như T3/V2/W4/X4)
./node_modules/.bin/esbuild apps/web/src/lib/gopMoovLarge43Y4.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r43y4-moov.test.cjs \
  && node /tmp/r43y4-moov.test.cjs
```

| Nhóm | Kết quả thật |
|---|---|
| Y4 mới `gopMoovLarge43Y4` | **10/10** ngay lần chạy đầu |
| Hồi quy W4 `gopSizeProbe41W4` | **15/15** |
| Hồi quy T3 `gopRangeFetch39T3` | **10/10** |
| Hồi quy V2 `gopWiring40V2` | **16/16** |
| Hồi quy X4 `gopSharedProbe42X4` | **10/10** |
| Headed heap (file 141,52 MiB) | **9/9** cổng (§2.2) |
| Headed bridge (file 35,38 MiB) | **14/14** cổng sau sửa CORS (§4.3); trước sửa: 10/14 (3 cổng GOP + 1 cổng expose trượt, đúng signature của bug CORS) |
| Headed bridge, moovlarge60 | fallback đúng + vẽ 91 frame (§3.2); 2 cổng "gop-mode"/"gop-no-full-get" của harness trượt là ĐÚNG kỳ vọng cho fixture này (harness viết cho file faststart lành), không phải lỗi — exit 1 của harness ở 2 lần chạy này là tín hiệu fallback, đã ghi rõ, không sửa cổng cho vừa fixture |
| Headed bridge, trailing60 | fallback đúng + vẽ 91 frame cả hai lần chạy (§3.2, kèm flake bước mặc định lần 1 đã ghi) |
| `vite build` | pass (35,19 s under-load, chỉ cảnh báo chunk > 500 kB cũ) |
| `tsc --noEmit -p apps/web/tsconfig.json` | còn lỗi NHƯNG 0 lỗi ở file Y4 hay file production: toàn bộ 12 dòng log đều từ `src/lib/ingestMinDisplay43Y3.test.ts` của luồng song song khác đợt 43 (chưa exclude/sửa xong lúc Y4 kiểm tra) — parent gộp chạy lại sau khi luồng đó xong, không gán cho Y4. Lỗi TS5097 của chính file Y4 đã hết sau khi thêm dòng exclude (§1.2) |

Mọi số headed đều under-load (các luồng đợt 43 khác đang chạy, có
lúc 2 Chrome khác cùng sống) — cấm dùng làm baseline quiet hay
claim fps; số frame vẽ được là bằng chứng chức năng, không phải
tốc độ. Mọi headed đều Chromium Linux + Xvfb + `--disable-gpu` —
không claim Safari / máy thật / màn hình vật lý / GPU thật.

## 6. Giới hạn còn lại và nợ follow-up (trung thực)

1. **CHƯA MỞ: trần 128 MiB giữ nguyên.** Không có trần mới nào được
   đề xuất từ đợt này (§2.3). Muốn bàn lại cần đủ 3 điều kiện: T3
   streaming (chỉ fetch GOP của cửa sổ), đo RSS + bộ nhớ VideoFrame
   native, lặp lại ở cửa sổ quiet.
2. **CHƯA SỬA: moov > 512 KiB vẫn fallback.** Nhánh fetch moov riêng
   của T3 + trần 16 MiB là code chết với tiền tố mặc định (§3.3);
   sửa cần thiết kế lại (đọc header moov → fetch range moov trước
   gate, hoặc tăng tiền tố) + đo lại toàn bộ, thuộc đợt sau.
3. **CHƯA ĐO: Safari, máy thật, màn hình vật lý, GPU thật, baseline
   quiet / fps ngược.** Toàn bộ headed ở đây là Chromium Linux +
   Xvfb + render phần mềm, under-load.
4. **CHƯA ĐO: heap trên file vừa vượt 128 MiB ở biên (vd 129 MiB) và
   trên file 256 MiB+** — chỉ có 1 điểm đo 141,52 MiB; luật 1,09× là
   ngoại suy từ 1 điểm + kế toán chunk, chưa phải đường cong đã
   chứng minh qua nhiều kích thước.
5. **CHƯA ĐO: GOP qua bridge ở production thật (vite :5173 → bridge
   :8787)** — harness đo bridge :8943 từ origin harness :8920, cùng
   luật loopback CORS; cần click-test trên app thật để khẳng định
   lần cuối, dù luật CORS là như nhau.
6. **Harness phụ thuộc fixture ngoài repo:** mọi fixture (base60,
   trailing60, moovlarge60, big240) chỉ nằm ở `/tmp/round43-y4/`
   (tmpfs, từng bị xóa sạch giữa các lượt ở đợt 42); muốn chạy lại
   harness phải tạo fixture trước bằng đúng lệnh trong LIMITS này,
   script tự fail rõ khi thiếu. `/tmp/round43-y4/` cũng giữ
   `heap-result.json`, `bridge-result.json`,
   `bridge-moovlarge-result.json`, `bridge-trailing-result.json`,
   log các lần chạy, bundle/profile Chrome — không thứ nào vào batch.
7. **Flake headed lần 1 trên trailing** (§3.2) chưa rõ nguyên nhân
   gốc (mất event CDP hay hiccup socket nhất thời dưới tải song
   song) — đã ghi lại, cần để ý nếu lặp lại ở đợt sau thay vì coi
   là xong.
