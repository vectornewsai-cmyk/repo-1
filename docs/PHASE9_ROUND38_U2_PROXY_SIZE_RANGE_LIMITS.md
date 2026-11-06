# Phase 9 đợt 38, luồng U2 — Buffer file cho nguồn http/proxy: đường truyền size proxy qua cổng S4 + hợp đồng Range theo GOP — LIMITS

Ngày: 02/11/2026 (giờ +07).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo,
KHÔNG sửa file của luồng khác, KHÔNG ghi paths-loop hay build-loop-log
(parent gộp). Luồng này đóng nợ §3.4 của `docs/PHASE9_ROUND37_LIMITS.md`
("Buffer file: Range theo GOP + moov-trước + hợp đồng Range cho nguồn
http/proxy vẫn đứng; nguồn http/proxy thật chưa đo (khi có proxyUrl,
preview không truyền `item.file.size` nên cổng S4 không áp dụng); size
muộn sau HEAD đã trả size nhỏ thì first-wins bỏ qua").

## 0. Kết luận ngắn (không vượt số đo)

1. **Đường truyền size proxy nay có thật, qua đúng cổng S4 cũ (không
   sửa controller).** Bridge POST /api/proxy nay trả `proxySizeBytes`
   (kích thước của chính file proxy, đo bằng `fs.statSync` lúc tạo);
   MediaBin truyền nó qua `setMediaProxy` → `MediaItem.proxySizeBytes`
   → preview gọi `knownSizeBytesForPreview(item)` thay cho ternary cũ.
   Khi proxy có size thật thì cổng S4 áp dụng y như file gốc: proxy
   > 128 MiB sẽ khóa fallback từ constructor, 0 request. Khi proxy
   chưa biết size (bridge cũ không trả trường này, hoặc item tạo
   trước đợt này) thì preview truyền `undefined` — KHÔNG rơi về
   `item.file.size` — và các cổng HEAD/GET của R3 + late-abort của T5
   vẫn làm việc như trước. Đây là sửa đúng điểm đã biết, không phải
   mở đường WebCodecs cho file lớn.
2. **Hợp đồng Range cho nguồn http/proxy nay được khóa bằng code +
   test, ở mức cổng/kiểm tra — KHÔNG phải fetch theo GOP thật.**
   Module mới `reverseRangeGate38U2.ts` quyết định "được THỬ Range"
   chỉ khi đủ cả 3: moov-trước + `Accept-Ranges: bytes` + đã biết
   size; và lần Range đầu vẫn phải qua `checkRangeProbeResponse`
   (chỉ 206 + Content-Range khớp đúng range mới tiếp tục). Mọi
   trường hợp còn lại fallback về tải toàn file (đường cũ). Test
   20/20 khóa ma trận cho phép/chặn/fallback (xem §3).
3. **Đã đo trên bridge proxy thật (chạy local), không bịa số.**
   File proxy Q8 thật của đợt 37 T6 (noise-4k-6s 4K → proxy 720p,
   10.230.557 byte) qua bridge GET /api/proxy/file: HEAD báo
   `Accept-Ranges: bytes` + `Content-Length: 10230557` (khớp kích
   thước file); Range `bytes=0-99` → 206 + `Content-Range:
   bytes 0-99/10230557`, nhận đúng 100 byte; moov trước mdat
   (ftyp 32, moov 1674, free 8, rồi mdat) — cổng gate chạy trên
   chính file này cho `faststart` → `range-gop-attempt` →
   probe-check `range-ok`. POST /api/proxy với file testsrc2 720p
   mới: trả `proxySizeBytes: 167943` = đúng kích thước file proxy
   trên đĩa, sidecar mới cũng ghi `proxySize: 167943`. Chi tiết số
   ở `benchmarks/results/v38-u2-proxy-size-range.json`.
4. **Cái CHƯA làm vẫn ghi rõ (§5):** Range theo GOP thật trên file
   lớn (cần demux mảnh: parse moov từ tiền tố/đuôi rồi fetch từng
   đoạn sample — chưa viết, cổng gate chưa được code nào gọi để
   fetch); size muộn sau HEAD (server báo HEAD sai rồi
   proxySizeBytes mới tới — first-wins bỏ qua, thiết kế có chủ ý
   được giữ nguyên, không đổi lén); click-test full-app cho clip
   proxy có proxySizeBytes.

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Sửa

- `apps/web/src/media.ts` — thêm field `proxySizeBytes?` vào
  `MediaItem` (kích thước của chính file proxy; vắng = chưa biết,
  cấm thay bằng `file.size`).
- `apps/web/src/lib/proxy.ts` — thêm `proxyKnownSizeBytes(item)`
  (chỉ nhận số hợp lệ > 0) và `knownSizeBytesForPreview(item)`:
  điểm duy nhất quyết định size truyền vào controller — có proxyUrl
  thì chỉ proxySizeBytes, không proxyUrl thì `file.size` như cũ.
- `apps/web/src/store.ts` — `setMediaProxy` thêm tham số tùy chọn
  thứ tư `proxySizeBytes?`; chỉ ghi khi số hợp lệ, bridge cũ không
  trả thì giữ nguyên (không xóa size đã biết bằng undefined).
- `apps/web/src/MediaBin.tsx` — cả 2 đường tạo proxy (bấm tay +
  tự động) đều truyền `data.proxySizeBytes` khi là số.
- `apps/web/src/preview.tsx` — 1 điểm gọi reverse: dùng
  `knownSizeBytesForPreview(item)` thay ternary cũ
  `item.proxyUrl ? undefined : item.file?.size`; comment cập nhật
  (S4 + U2). Không sửa nhánh element, không sửa logic draw nào khác.
- `apps/web/tsconfig.json` — chỉ thêm 1 test mới vào exclude (theo
  tiền lệ R3/S4/T5).
- `server/render/src/proxy.js` — sidecar (manifest proxy) thêm
  trường `proxySize` (stat file proxy lúc tạo; cộng thêm, `findProxy`
  không kiểm tra trường này nên sidecar cũ/mới đều đọc được).
- `server/bridge/src/index.js` — POST /api/proxy trả thêm
  `proxySizeBytes` (stat file proxy; stat lỗi thì bỏ trường, client
  coi như chưa biết size).

### 1.2 Mới

- `apps/web/src/lib/reverseRangeGate38U2.ts` — cổng Range (xem §2;
  KHÔNG được code fetch nào gọi — gate chờ demux mảnh đợt sau).
- `apps/web/src/lib/reverseRangeGate38U2.test.ts` — 20 test (§3).
- `benchmarks/results/v38-u2-proxy-size-range.json` — số đo bridge
  thật (§4).
- `docs/PHASE9_ROUND38_U2_PROXY_SIZE_RANGE_LIMITS.md` — file này.

### 1.3 Không đụng (ghi rõ để parent khỏi nghi ngờ)

`reverseWebcodecs.ts` (cổng S4/T5 dùng nguyên — luồng này chỉ thêm
nguồn size mới cho caller, không sửa thứ tự ưu tiên first-wins),
`mp4Demux.ts` (không viết demux mảnh), `reversePlayback.ts`,
`reverseDecodeAhead.ts`, `reversePreviewGate.ts`, mọi harness/probe
của luồng khác, paths-loop, build-loop-log. Bridge chỉ chạy local
tạm thời để đo rồi đã dừng (port 8787 đã free sau khi đo); file
proxy đo là file Q8 thật của đợt 37 T6 trong scratch ngoài repo,
không copy vào repo.

## 2. Hợp đồng Range (thiết kế đã khóa bằng code, không phải ý tưởng)

### 2.1 Ba điều kiện CÙNG đúng mới được THỬ Range

| Điều kiện | Vì sao bắt buộc | Khi thiếu thì sao |
|---|---|---|
| moov-trước (faststart) | Demux cần moov để biết offset/size từng sample (`Mp4Sample.offset`) rồi mới tính byte-range của 1 GOP | Moov-cuối → fallback: cần probe đuôi với kích thước moov chưa biết (nhiều lượt Range thăm dò) — chưa cài đặt |
| `Accept-Ranges: bytes` | Bằng chứng server hỗ trợ Range cho chính URL này | Vắng/khác "bytes" → fallback; KHÔNG giả định chỉ vì URL là proxyUrl của bridge |
| Đã biết tổng size (> 0, hữu hạn) | Tính range đuôi + kiểm tra Content-Range có khớp tổng không | Chưa biết → fallback |

`resolveRangeGopFetch` trả `range-gop-attempt` (được THỬ) chứ không
trả "range đã chạy": lần Range đầu tiên vẫn phải qua
`checkRangeProbeResponse`. Server quảng cáo Accept-Ranges vẫn có thể
trả 200 toàn file (Range thất bại âm thầm — cảnh báo R3): chỉ 206 +
Content-Range khớp ĐÚNG start/end đã xin (+ khớp tổng đã biết) mới
được tiếp tục; 200/206 lệch/416/thiếu Content-Range đều fallback
về tải toàn file, không thử Range lại mù.

### 2.2 detectMoovPosition — xác định vị trí moov bằng bằng chứng

Quét box top-level trong tiền tố đã đọc (size 32-bit, size==1 thì
largesize 64-bit, size==0 thì tới hết tiền tố; box cắt dở thì dừng):
moov trước mdat → `faststart`; mdat trước moov → `trailing`; không
thấy moov trong tiền tố → `unknown` (moov có thể nằm ngoài tiền tố
— không đoán). Đặc biệt: KHÔNG suy faststart từ việc proxy được tạo
bằng `-movflags +faststart` — đó là kỳ vọng về quy trình tạo file,
không phải bằng chứng về file đang fetch (bài học T6: `has_b_frames`
không phải bằng chứng B-frame; tương tự, cờ tạo file không phải
bằng chứng vị trí moov).

### 2.3 First-wins được giữ nguyên — và hệ quả còn lại

Thứ tự ưu tiên của S4/T5 không đổi: size đã biết (HEAD, header GET,
hay caller truyền trước) thì size tới sau bị bỏ qua, kể cả
proxySizeBytes tới muộn. Hệ quả phải ghi rõ: nếu HEAD của proxy trả
size nhỏ SAI trước khi proxySizeBytes tới thì cổng muộn không cứu
được — chỉ còn cổng header GET và cổng sau-tải đỡ (giống hệt trường
hợp file gốc ở LIMITS T5 §5.1, và trường hợp server báo sai vẫn chưa
có test/probe). Luồng này KHÔNG đổi thiết kế đó lén thành
"size muộn thắng" — đổi đó sẽ phá tính chất "HEAD là nguồn có thẩm
quyền cho chính URL đó" mà T5 đã chốt.

### 2.4 Vì sao gate chưa được nối vào controller

Fetch theo GOP thật cần 2 thứ chưa có: (a) demux mảnh — parse moov
từ tiền tố (faststart) hoặc đuôi (trailing) mà không tải toàn file,
rồi mới parse sample; `parseMp4VideoTrack` hiện nhận 1 ArrayBuffer
hoàn chỉnh; (b) ánh xạ GOP → byte-range từ offset/size sample rồi
fetch từng đoạn và ghép cho decoder. Nối gate vào controller khi
chưa có (a)+(b) sẽ chỉ là code chết hoặc đường fetch nửa vời — nên
gate đứng riêng, đã khóa bằng test, chờ đợt demux mảnh gọi nó. Mọi
claim "Range theo GOP" trước đợt đó đều là nói quá.

## 3. Kiểm chứng (test mới + hồi quy)

### 3.1 Test mới — 20/20 pass

```
./node_modules/.bin/esbuild apps/web/src/lib/reverseRangeGate38U2.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/r38u2.test.cjs \
  && node /tmp/r38u2.test.cjs
```

| Nhóm | Chứng minh gì |
|---|---|
| detectMoovPosition (5) | faststart / trailing / chỉ thấy mdat → unknown / tiền tố rỗng-cắt dở → unknown / chỉ moov → faststart |
| resolveRangeGopFetch (7) | đủ 3 → attempt; trailing → fallback dù server hỗ trợ + biết size; unknown → fallback; thiếu Accept-Ranges (null/undefined) → fallback; "none" → fallback; "Bytes"/khoảng trắng → vẫn thử; thiếu size (null/0/NaN) → fallback |
| parse + probe check (3) | parse đúng/sai dạng (kể cả `bytes */total` → null); 206 khớp → range-ok; 200 → fallback; 206 lệch range/tổng, 416 → fallback |
| Đường truyền size proxy (5) | có proxy + proxySizeBytes → truyền size proxy (không phải file.size); có proxy nhưng chưa biết → undefined, KHÔNG rơi về file.size; proxySize rác (0/âm/NaN) → chưa biết; không proxy → file.size như cũ |

Test thuần, không fetch thật, không cấp phát file lớn: phép đo
header thật trên bridge thuộc §4, không thuộc test này.

### 3.2 Hồi quy — vẫn xanh

- `reverseFileHeap36S4`: 6/6 (cổng S4 không bị sửa chạm — đúng, vì
  `reverseWebcodecs.ts` không đổi).
- `reverseFileCancel37T5`: 6/6 (late-abort + dispose không đổi).
- `reverseFileBuffer35R3`: 10/10 (cổng HEAD/GET/sau-tải không đổi).
- `node --check` cho `server/bridge/src/index.js` và
  `server/render/src/proxy.js`: pass.
- `tsc --noEmit -p apps/web/tsconfig.json`: exit 0 ở lần kiểm tra
  cuối (ghi chú trung thực: giữa buổi, một lần chạy tsc báo 6 lỗi
  nhưng tất cả đều thuộc `apps/web/src/lib/relinkDedup38U3.test.ts`
  của luồng khác đang chạy song song, 0 lỗi ở file của U2; lần chạy
  cuối sau đó sạch hoàn toàn — luồng khác đã sửa file của họ trong
  lúc đó, không phải U2 sửa hộ).
- `npm --prefix apps/web run build` (tsc + vite build): pass,
  built trong 39,37 s (cảnh báo chunk > 500 kB và dynamic-import
  userLut đã có từ trước, không phải do đợt này).

## 4. Đo trên nguồn proxy thật (bridge local, file proxy Q8 thật)

Thiết lập: bridge chạy tạm thời (BRIDGE_WORK_DIR =
`~/workspace/tmp-round38-u2`, port 8787, dùng node_modules hoisted
ở gốc repo — bridge không có node_modules riêng); file đo là proxy
720p Q8 thật của đợt 37 T6 (`noise-4k-6s__proxy_720p.mp4`,
10.230.557 byte, 4K nguồn → proxy 720p), đặt trong `proxies/` của
WORK_DIR tạm; bridge đã dừng sau khi đo xong (port 8787 free).
Kết quả (JSON đầy đủ ở `benchmarks/results/v38-u2-proxy-size-range.json`):

| Phép đo | Kết quả |
|---|---|
| HEAD `/api/proxy/file/noise-4k-6s__proxy_720p.mp4` | 200, `Accept-Ranges: bytes`, `Content-Length: 10230557` = đúng kích thước file |
| GET + `Range: bytes=0-99` | 206, `Content-Range: bytes 0-99/10230557`, nhận đúng 100 byte |
| Vị trí moov (quét box độc lập bằng Python, không dùng code gate) | ftyp 32, moov 1674, free 8, rồi mdat → moov trước mdat = faststart |
| Gate chạy trên chính file + header đo được | `faststart` → `range-gop-attempt` → probe-check 206 `range-ok` |
| POST /api/proxy (file testsrc2 720p 2 s tự tạo, height=480) | Trả `proxySizeBytes: 167943` = đúng kích thước file proxy trên đĩa; sidecar mới ghi `proxySize: 167943` |

Đọc đúng: bridge (Express `res.sendFile`) HỖ TRỢ Range thật cho
đường proxy — nhưng hợp đồng trong code vẫn kiểm tra header từng
lần (không hard-code "bridge thì được Range"), vì server khác hoặc
proxy URL ngoài bridge có thể không hỗ trợ. Moov-trước của proxy
này khớp kỳ vọng faststart của Q8, nhưng gate vẫn xác định bằng
quét box, không suy từ cờ tạo file.

## 5. Giới hạn còn lại và nợ follow-up (trung thực)

1. **Range theo GOP thật trên file lớn CHƯA làm.** Cần demux mảnh
   (§2.4) + fetch từng đoạn GOP + ghép cho decoder; gate hiện chưa
   được code nào gọi. File > 128 MiB vẫn fallback element trong mọi
   đường đo, kể cả khi proxy đã biết size (cổng S4 khóa sớm hơn,
   không mở đường WebCodecs cho file lớn).
2. **Size muộn sau HEAD vẫn first-wins (thiết kế giữ nguyên).**
   Server báo HEAD sai (nhỏ hơn thật) rồi proxySizeBytes mới tới
   thì cổng muộn không cứu — chưa có test/probe cho server cố tình
   báo sai (kế thừa từ T5 §5.1, áp dụng cả cho proxy).
3. **Chưa click-test full-app cho clip proxy có proxySizeBytes.**
   Đường truyền size chỉ kiểm chứng ở tầng unit (proxy.ts) + tầng
   controller cũ (S4/T5 xanh, không đổi code controller). Cần luồng
   sở hữu preview click-test: import file lớn → tạo proxy → phát
   ngược với cờ bật, xác nhận controller khóa 0 request khi proxy
   > 128 MiB (cần proxy thật > 128 MiB — proxy 720p thường nhỏ hơn
   ngưỡng nên case này hiếm trong thực tế, nhưng cổng phải đúng).
4. **Chưa đo:** Safari/Firefox cho header proxy; proxy trên máy thật
   (không phải VM này); proxy URL không qua bridge (server tĩnh
   ngoài — hợp đồng Range phải đo từng nguồn, gate đã chuẩn bị cho
   việc đó); proxy > 128 MiB thật (xem mục 3).
5. **Proxy tạo trước đợt này không có proxySizeBytes.** Item đã gắn
   proxy từ trước (store cũ, autosave cũ) sẽ đi đường chưa-biết-size
   cho tới khi tạo lại proxy — hành vi an toàn (cổng R3/T5 đỡ),
   chỉ mất lợi ích khóa-sớm-0-request. Không tự ghi đè size cho
   item cũ bằng cách đoán từ file gốc.
6. **Bridge chạy đo đã dừng; node_modules bridge vẫn hoisted ở gốc
   repo như trước** (không cài thêm gì vào repo ngoài code đã liệt
   kê; `npm install` trong server/bridge báo "up to date" vì
   workspace hoist — không tạo thư mục node_modules mới).

## 6. Batch của luồng này (để parent stage — KHÔNG push)

File text, không binary, không dist:

- `apps/web/src/lib/reverseRangeGate38U2.ts` (mới)
- `apps/web/src/lib/reverseRangeGate38U2.test.ts` (mới)
- `apps/web/src/lib/proxy.ts` (sửa)
- `apps/web/src/media.ts` (sửa)
- `apps/web/src/store.ts` (sửa)
- `apps/web/src/MediaBin.tsx` (sửa)
- `apps/web/src/preview.tsx` (sửa, 1 điểm gọi + import)
- `apps/web/tsconfig.json` (sửa, chỉ thêm 1 exclude)
- `server/render/src/proxy.js` (sửa, sidecar thêm proxySize)
- `server/bridge/src/index.js` (sửa, POST /api/proxy thêm proxySizeBytes)
- `benchmarks/results/v38-u2-proxy-size-range.json` (mới)
- `docs/PHASE9_ROUND38_U2_PROXY_SIZE_RANGE_LIMITS.md` (mới, file này)

Đường dẫn đầy đủ (từ `~`): `~/workspace/repo-1/` + các đường dẫn
trên. Scratch đo (bridge WORK_DIR tạm + file proxy copy) nằm ở
`~/workspace/tmp-round38-u2/` ngoài repo — KHÔNG đưa vào batch.
