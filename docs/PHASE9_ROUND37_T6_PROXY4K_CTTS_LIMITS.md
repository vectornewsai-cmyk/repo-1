# Phase 9 đợt 37, luồng T6 — Proxy 4K→720p + xác minh ctts/present-order cho proxy có B-frame + đường asset: — LIMITS

Ngày: 02/11/2026 (giờ +07; log probe ghi UTC 07:18–07:32).
KHÔNG push, KHÔNG release/tag, KHÔNG binary vào repo, KHÔNG sửa file
của luồng khác. Luồng này đóng phần còn lại của §3.3
`docs/PHASE9_ROUND36_LIMITS.md` ("xác minh ctts/present-order cho proxy
có B-frame; 4K nguồn → proxy 720p; đường `asset:`") và một phần nợ
đứng (đường `asset:` bằng trình duyệt thật). Mọi số dưới đây đều là số
đo của chính luồng này, gắn nhãn tải từng lượt; KHÔNG có số quiet nào
(vì các luồng đợt 37 khác chạy song song suốt buổi đo).

## 0. Kết luận ngắn (không vượt số đo)

1. **4K nguồn → proxy 720p bằng đúng code Q8 đạt ngưỡng decode.**
   Proxy 720p của nguồn 4K nhiễu: decode phần mềm 63,8 / 72,0 fps,
   present unpaced 85,4 / 120,4 fps (2 lần, GOP 180 frame) — đều trên
   30 fps và trên ngưỡng "dễ decode" 60 fps của cổng S3, nhưng biên
   chỉ ~6–20% trên ngưỡng nên verdict cổng nhạy tải (xem §4). Nguồn
   4K gốc chỉ decode 2,2–3,0 fps, present 7,1–19,9 fps — proxy nhanh
   hơn nguồn ~21–30× ở decode. **Ngưỡng ở đây là decode 1 GOP +
   present unpaced, chưa phải phát ngược paced liên tục nhiều GOP**
   (nợ cũ của S3 §7.1 vẫn mở).
2. **Proxy 4K→720p này KHÔNG reorder — và đó là phát hiện quan trọng
   nhất của luồng.** Ctts của nó là offset hằng số 1024 (mọi sample),
   present order trùng decode order. `has_b_frames=2` của ffprobe
   KHÔNG chứng minh được reorder thật — nó chỉ là độ sâu reorder tối
   đa từ SPS. Cách đọc "proxy CÓ B-frame vì has_b_frames=2" ở LIMITS
   S3 là bằng chứng yếu (xem đính chính §6): bằng chứng đúng là độ
   biến thiên ctts, và proxy 4K này không có. Nguyên nhân đã tách
   bằng đối chứng (§3.2): x264 b-adapt chọn 0 B-frame cho nội dung
   nhiễu thuần trên nền đen, nhưng dùng B-frame thật cho nội dung
   testsrc2 + noise của Q3 — **reorder của proxy Q8 phụ thuộc nội
   dung, không phải thuộc tính đảm bảo của Q8.**
3. **Present-order cho proxy CÓ B-frame thật đã được xác minh ở cả 3
   tầng.** Trên proxy 480p của Q3 (reorder thật: 6 giá trị offset,
   265 lần present giảm / 900 sample): (a) demux thuần Node 6/6 —
   presentOrder là hoán vị, đơn điệu không giảm theo presentation
   timestamp, khác thứ tự index giảm dần mù, tra mốc đúng 3/3;
   (b) trình duyệt thật decode GOP 62 frame có 30 lần present giảm
   trong GOP: draw timestamp giảm đơn điệu chặt, khớp
   presentationTimestamp của sample 62/62, thứ tự draw khác hẳn
   index giảm dần — tức `presentReverse` sắp theo timestamp thật,
   không phải fallback index; (c) qua blob: và qua controller thật
   cũng đúng như vậy (§5). Không còn trường `cttsDetected` giả kiểu
   S3: mọi con số ctts ở đây tính từ sample đã parse.
4. **Đường `asset:` qua cổng reverse: cổng KHÔNG có nhánh riêng cho
   `asset:` — verdict chỉ phụ thuộc số đo decode, không phụ thuộc
   dạng src.** Với cùng số đo, clip `asset:` được verdict y hệt clip
   thường (opt-in bật + proxy dễ → allowed-experiment + 3 cảnh báo;
   opt-in tắt → blocked `opt-in-off`; footage nặng → blocked).
   Đường chạy thực tế sau rehydrate S5 đã chứng minh ở mức controller
   (§5): item rehydrated mang tên đúng `asset:<id>` nên preview tìm
   được qua `mediaByName`, `item.url` là blob:, controller trả frame
   đúng mốc sau 0,2–0,6 s với timestamp khớp tuyệt đối. **Điều kiện
   còn thiếu (không claim):** không có manifest rehydrate thì clip
   `asset:` không có MediaItem → preview báo "Thiếu media", reverse
   không bao giờ chạy; chưa click-test end-to-end ở mức App (mở
   `.vcut.json` có src `asset:` → rehydrate → stepping qua draw);
   proxy bridge cho item `asset:` chưa thử (cần bridge chạy; item
   rehydrated có `file` nên về nguyên tắc tạo được, chưa đo).
5. **Chưa đo — không claim hộ:** GPU thật, máy thật, Safari, đường
   WebCodecs ở dpr > 1 (cả footage thường lẫn `asset:`), phát ngược
   paced liên tục nhiều GOP, fps displayed đường element cho cặp
   4K/proxy (cổng `resolveProxyMainDirection` trả `no` đúng luật vì
   chưa đo displayed — xem §4), baseline quiet.

## 1. Fixture (tất cả ở scratch ngoài repo, không commit binary)

| Fixture | Cách tạo | Hình học / fps / GOP | Kích thước |
|---|---|---|---|
| Nhiễu 4K nguồn | `nullsrc 3840×2160:30:6s` + filter `noise=alls=25:allf=t`, x264 veryfast crf 23, `-g 90`, yuv420p, faststart | 3840×2160, 30 fps, keys [0,89,178], 180 sample | 461.414.359 byte (~615 Mbps — nhiễu 4K gần như không nén được) |
| Proxy 720p của 4K | `generateProxy` Q8 thật (`server/render/src/proxy.js`, height 720), `findProxy` hit sau generate | 1280×720, 30 fps, 1 GOP [0,179], 180 sample, ffprobe `has_b_frames=2` | 10.230.557 byte (~13,6 Mbps) |
| Proxy 480p reorder | Q8 thật từ `noise-30s.mp4` của Q3 (testsrc2 + noise), height 480 — tạo lại đợt này, khớp file S3 | 854×480, 30 fps, keys [0,45,107,183,432,497,572,621,682], 900 sample | 37.122.084 byte |
| Nguồn Q3 (đối chứng) | File Q3 có sẵn (`noise-30s.mp4`) | 1280×720, 30 fps, keys [0,300,600], 900 sample, ctts toàn 0 | 210.771.214 byte |

Sidecar proxy Q8 khớp nguồn (cùng tên/size/mtime) qua `findProxy` ở
cả hai lần generate đợt này. Proxy 4K→720p giữ fps 30 và duration
6,00 s đúng cam kết Q8 (chỉ giảm phân giải + bitrate).

## 2. Kết quả đo trình duyệt thật (Chrome 156.0.8078.4 headed, pipe CDP)

Nhãn tải: mọi lượt đều **under-load** (load1 ≥ 2,0 và/hoặc Chrome
ngoài cây probe và/hoặc tiến trình nặng khác — các luồng đợt 37 T3/T5
chạy song song; T5 dùng display :96, T3 dùng pipe riêng). Vì vậy mọi
fps đều KHÔNG phải baseline quiet, cấm dùng làm baseline hay claim
hồi quy. Chiều đọc under-load như S3: tải chỉ làm chậm thêm, nên số
proxy vượt 30 dưới tải vẫn là bằng chứng tốt cho throughput, nhưng
số nguồn 4K 2–3 fps dưới tải không cho phép suy ra số quiet.

### 2.1 Lượt chính: 4K nguồn → proxy 720p (JSON `v37-t6-proxy4k-ctts.json`)

Bundle đo: `mp4Demux.ts` + `reverseWebcodecs.ts` + (sau sửa §6)
`reversePreviewGate.ts` + `reverseDecodeAhead.ts` biên dịch bằng
esbuild từ repo hiện tại, sha ghi trong JSON (revWebcodecs
`df4625034f4b29c0…`). `prefer-hardware: false` cho mọi fixture,
`/dev/dri` không tồn tại — tái xác nhận VM không có HW decode.

| Lượt | GOP (decode idx) | Decode | Present unpaced | Drawn / missing | Timestamp draw |
|---|---|---|---|---|---|
| Proxy 720p #1 | [0,179] (180 fr, 1 GOP duy nhất) | 63,8 fps | 85,4 fps | 180 / 0 | giảm đơn điệu chặt, khớp pts 180/180, khác naive: KHÔNG (đúng — fixture offset hằng số, xem §3) |
| Proxy 720p #2 | như trên | 72,0 fps | 120,4 fps | 180 / 0 | như trên |
| Proxy 720p qua blob: (demux/decode trần) | [0,179] | 94,7 fps | 128,5 fps | 180 / 0 | khớp pts 180/180 |
| Proxy 720p qua controller + blob: | cửa sổ quanh mốc 0 s | hit sau 2 poll / 0,203 s | — | frame 1280×720, timestamp 66667 µs = pts sample 0 tuyệt đối | khớp |
| Nguồn 4K gốc #1 | [89,177] (89 fr) | 3,0 fps | 19,9 fps | 89 / 0 | khớp pts 89/89 |

Đọc đúng: (a) Proxy vượt 30 fps ở cả decode lẫn present, cả 2 lần
lặp — đủ điều kiện cần throughput của cửa sổ Q3; nhưng biên trên
ngưỡng dễ 60 fps chỉ 6–20% (63,8 fps ở lần thấp nhất), nên dưới tải
nặng hơn verdict cổng có thể lật sang blocked — đó là hành vi đúng
của cổng, không phải lỗi đo. (b) Present của nguồn 4K gốc chỉ
7,1–19,9 fps ngay cả unpaced: ở 4K, drawImage 4K lên canvas 4K tự nó
đã là nút thắt, không chỉ decode — proxy gỡ cả hai nút. (c) Lượt
chính đã chạy 2 lần trên 2 bundle (trước/sau sửa §6): lần đầu proxy
64,9 / 103,5 fps, blob 85,6 / 129,3 fps, nguồn 2,3 / 18,8 fps — nhất
quán với lần cuối trong biên dao động tải; JSON cuối chỉ giữ lần
chạy trên bundle mới nhất.

### 2.2 Lượt reorder: proxy 480p có B-frame thật (JSON `v37-t6-ctts-reorder-proxy.json`)

| Lượt | GOP | Decode | Present | Timestamp draw |
|---|---|---|---|---|
| Proxy 480p #1 | [45,106] (62 fr, 30 lần present giảm trong GOP) | 109,5 fps | 184,4 fps | giảm đơn điệu chặt, khớp pts 62/62, khác naive: CÓ |
| Proxy 480p #2 | như trên | 113,6 fps | 195,5 fps | như trên |
| Qua blob: | [45,106] | 110,6 fps | 124,8 fps | khớp pts 62/62, khác naive: CÓ |
| Qua controller + blob: | cửa sổ quanh mốc 1,5 s | hit sau 4 poll / 0,624 s | — | frame 854×480, timestamp 1566667 µs = pts sample 45 tuyệt đối |

Đối chứng trong cùng lượt: nguồn Q3 gốc (720p) có ctts toàn 0
(`cttsNonzero=0`, `decreases=0`) — tức nguồn gốc KHÔNG có B-frame,
reorder chỉ xuất hiện sau bước re-encode Q8. Đây là bằng chứng trực
tiếp rằng demux phân biệt được 3 trạng thái: không ctts (nguồn Q3),
ctts hằng số (proxy 4K), ctts biến thiên (proxy reorder) — không còn
dùng field giả.

### 2.3 Test thuần Node (không browser, không chạm tsconfig)

Script `probe-round37-t6-ctts-node.mjs` bundle `mp4Demux.ts` bằng
esbuild ra scratch rồi parse file thật, assert: presentOrder là hoán
vị, đơn điệu không giảm theo pts, có sample ctts khác 0, present
giảm trong thứ tự decode, presentOrder khác index giảm dần mù, tra
mốc đúng 3/3. Kết quả: **6/6 trên proxy reorder**; **5/6 trên proxy
4K** — fail duy nhất đúng là check "present giảm trong thứ tự
decode" (decreases=0), tức test báo đúng fixture không reorder thay
vì cho qua. Test này vì vậy vừa là test khóa, vừa là detector
fixture: file nào không reorder thì fail check đó một cách có ý
nghĩa, không được sửa ngưỡng cho qua.

## 3. Vì sao proxy 4K không reorder — đối chứng đã tách

1. Cùng code Q8, cùng bước scale: proxy 480p từ nguồn Q3 (testsrc2 +
   noise) reorder (6 giá trị offset, decreases 265/900); proxy 480p
   từ nhiễu thuần của luồng này (nullsrc đen + noise filter) KHÔNG
   reorder (offset hằng số 1024, decreases 0). Tái tạo lại bằng Q8
   thật cả hai chiều trong cùng buổi, không phải số cũ.
2. Cùng recipe nhiễu thuần, đổi GOP mặc định hay `-g 90` đều không
   reorder (t-a 720p và t-c 720p `-g 90` đều offset hằng số). Vậy
   `-g` không phải nguyên nhân; khác biệt nằm ở nội dung pixel.
3. Giải thích có bằng chứng (không đọc nội bộ x264): nội dung có cấu
   trúc chuyển động (testsrc2) làm B-frame có ích nên b-adapt dùng
   B-frame; nhiễu thuần không dự đoán được bằng inter nên b-adapt
   chọn 0 B-frame — dù SPS vẫn báo `has_b_frames=2` (độ sâu tối đa
   theo cấu hình, không phải số B-frame thực tế trong file). Hệ quả
   thực tế: **không được dùng `has_b_frames` làm bằng chứng B-frame
   cho bất kỳ fixture nào nữa; phải đọc độ biến thiên ctts.**

## 4. Cổng reverse + đường asset: (đánh giá bằng code cổng thật)

Chạy `resolveDecodeAheadGate` / `resolveProxyMainDirection` từ bundle
`reversePreviewGate.js` (esbuild từ repo) với đúng số đo đợt này
(HW proof: prefer-hardware supported=false, decode 0 frame):

| Trường hợp | Verdict | Lý do / cảnh báo |
|---|---|---|
| Opt-in bật + proxy 720p 63,8 fps under-load | allowed-experiment | `easy-decode-footage` + đủ 3 cảnh báo (thử nghiệm / under-load / chưa có HW decode) |
| Opt-in bật + nguồn 4K 3,0 fps under-load | blocked | `hardware-decode-absent` + `software-decode-below-easy-threshold` |
| Opt-in tắt (mặc định) + proxy 720p 63,8 fps | blocked | `opt-in-off` — dù footage dễ |
| Opt-in bật + proxy reorder 480p 113,6 fps under-load | allowed-experiment | `easy-decode-footage` + 3 cảnh báo |
| Proxy làm hướng chính (4K/proxy) | no | `proxy-displayed-fps-not-measured` — T6 không đo displayed đường element cho cặp này nên cổng từ chối đúng luật; không suy từ decode |

**Đường `asset:`:** kiểu input của cổng không có field dạng src —
verdict chỉ phụ thuộc `optIn` / `hardwareProof` /
`softwareMeasurement`. Vì vậy clip `asset:` không bị chặn riêng và
cũng không được ưu tiên riêng: với cùng số đo decode, verdict của
nó = verdict của clip thường. Điều này đã kiểm chứng bằng 2 lần gọi
cổng với cùng số đo (83,8 fps qua blob:) cho cùng kết quả
allowed-experiment + 3 cảnh báo.

## 5. Đường asset: chạy thật tới đâu (code + probe, không đoán)

Chuỗi code đã đọc (không sửa): clip `asset:<id>` → sau rehydrate S5,
`rehydrateMediaItems` tạo MediaItem có `name: c.src` (tức đúng
`asset:<id>`) nên `mediaByName` trong preview tìm được item; `item.url`
là blob: object URL từ blob IndexedDB, `item.file` tái tạo từ blob
(cùng size) nên preview truyền `item.file.size` làm
`knownFileSizeBytes` khi không có proxyUrl (đúng luật S4). Controller
`load()`: HEAD fail-soft (lỗi HEAD → null → vẫn GET, không tự chặn);
GET có header thì chặn file lớn trước khi đọc body.

Probe đã chạy (trình duyệt thật, §2): blob: đi qua fetch GET +
parse + decode + presentReverse đúng thứ tự (cả fixture hằng số lẫn
fixture reorder), và qua **controller thật** (`ReversePreviewController`
+ `knownFileSizeBytes = blob.size`, đúng cách preview gọi): hit sau
0,203 s (proxy 720p) và 0,624 s (proxy reorder), timestamp frame
khớp tuyệt đối presentationTimestamp của sample. Đây là chứng cứ
mức controller, không chỉ mức demux.

**Chưa nối / chưa chứng minh (ghi rõ, không claim):**
- Không có manifest trong IndexedDB (autosave cũ, media import chưa
  ingest — nợ S5) thì clip `asset:` không có MediaItem → preview vẽ
  "Thiếu media", đường reverse không bao giờ chạy. Đây là chặn ở
  tầng media bin, không phải ở cổng reverse.
- Chưa click-test end-to-end ở mức App: mở file `.vcut.json` có src
  `asset:` → rehydrate → stepping ngược qua draw của preview. Op
  controllerBlob chứng minh controller + blob:, chưa chứng minh
  toàn bộ App wiring.
- Hành vi HEAD riêng trên blob: URL không đo tách (chỉ đo đầu-cuối
  controller, trong đó HEAD lỗi cũng không chặn được vì fail-soft).
- Proxy bridge cho item `asset:` chưa thử: cần bridge chạy; item
  rehydrated có `file` nên `MediaBin.makeProxy` (upload FormData)
  về nguyên tắc chạy được, nhưng chưa đo; khi có proxyUrl thì size
  truyền vào controller là undefined (đúng luật S4) và cổng HEAD/GET
  của R3 làm việc — chưa đo Range/HEAD của bridge cho URL proxy này.
- Đường WebCodecs ở dpr > 1 (cả footage thường lẫn `asset:`) vẫn
  chưa đo bằng trình duyệt thật — nợ đứng từ đợt 35, còn nguyên.

## 6. Sự cố giữa buổi: file luồng khác đổi ngay lúc đo (đã xử lý, không giấu)

- Lượt chính đầu (07:18–07:20Z) chạy xanh trên bundle mà
  `reverseWebcodecs.ts` khi đó chỉ import `mp4Demux`.
- Lúc 07:20:55Z, một luồng đợt 37 khác sửa `reverseWebcodecs.ts`
  (nối thêm import `reversePreviewGate` + `reverseDecodeAhead` —
  mtime file chứng minh; các comment "Đợt 37 T2/T5" trong file cũng
  cho thấy nhiều luồng đang sửa cùng file). 3 lượt reorder sau đó
  chết ở "trang probe không ready": module page import bundle thiếu
  2 dep nên chết trước khi set ready (chẩn đoán bằng Chrome tối
  thiểu: trang tải được, title đúng, readyState complete, nhưng
  `__t6Ready` false; grep bundle thấy import trần).
- Cách xử lý (không sửa file của luồng khác): pipe của T6 nay bundle
  thêm 2 dep vào scratch, viết lại specifier thành `.js`, và kiểm
  tra cứng "không còn import trần thiếu trong scratch" trước khi
  chạy (fail rõ thay vì chết âm). Lượt chính + lượt reorder cuối
  đều chạy lại trên bundle mới nhất, cùng sha
  (`reverseWebcodecsTsSha256 df4625034f4b29c0…`,
  `reversePreviewGateTsSha256 918f11ae4840e661…`) — mọi số §2 đều
  từ bundle này. Số lượt chính đầu (trước sửa) chỉ dùng để đối chiếu
  nhất quán, không phải số chính thức.
- Bài học cho đợt sau: pipe nào bundle `reverseWebcodecs.ts` cũng
  phải bundle cả cây import của nó hoặc dùng `--bundle`, và phải có
  check import trần — file này đang là điểm nóng nhiều luồng sửa
  chung trong đợt 37. Parent gộp cần đối chiếu: T6 KHÔNG sửa
  `reverseWebcodecs.ts`, chỉ đọc và bundle nó.

## 7. Nợ còn lại

1. Phát ngược paced liên tục nhiều GOP bằng proxy + Q3 window (phép
   đo duy nhất còn thiếu để claim 30 fps ngược — S3 §7.1 vẫn mở);
   sau đó mới nối Q3 window vào controller sau cổng (mặc định tắt).
2. Đo quiet thật cho decode proxy 4K→720p (biên trên ngưỡng dễ hiện
   chỉ 6–20% dưới tải; cần số quiet để biết verdict cổng có vững
   không) và cho cả cặp displayed element 4K/proxy.
3. Đo lại toàn bộ trên máy có GPU thật (VM này prefer-hardware vẫn
   false) và máy thật / Safari.
4. Đường WebCodecs ở dpr > 1 bằng trình duyệt thật (cả footage
   thường lẫn `asset:`).
5. Click-test App end-to-end cho clip `asset:` sau rehydrate +
   proxy bridge cho item `asset:` (cần bridge chạy).
6. Fixture: mọi fixture proxy tương lai phải báo độ biến thiên ctts
   (số giá trị offset + số lần present giảm), cấm dùng
   `has_b_frames` làm bằng chứng B-frame.
7. Thứ tự push: batch này xây trên nền các batch đợt 22–36; user
   push theo thứ tự cũ → mới. Batch T6 KHÔNG chứa binary, không
   dist, không file của luồng khác.

## 8. File đổi/thêm (text, không binary — parent gộp batch, KHÔNG push)

- Mới: `apps/web/scripts/probe-round37-t6-proxy4k-ctts-page.js`
  (trang probe: load + ctts evidence + wcdecodeOrder ghi thứ tự draw
  + blobReverse + controllerBlob).
- Mới: `apps/web/scripts/probe-round37-t6-proxy4k-ctts-pipe.mjs`
  (pipe CDP + Xvfb + HTTP Range + nhãn tải từng lượt; bundle cả cây
  import của reverseWebcodecs + check import trần; env `T6_PORT` /
  `T6_DISPLAY` / `T6_SCRATCH` / `T6_SRC4K` / `T6_PROXY720` /
  `T6_OUT` / `T6_SKIP_SRC4K`).
- Mới: `apps/web/scripts/probe-round37-t6-ctts-node.mjs` (test thuần
  Node 6 check trên file proxy thật; chạy:
  `node apps/web/scripts/probe-round37-t6-ctts-node.mjs <proxy.mp4>`).
- Mới: `benchmarks/results/v37-t6-proxy4k-ctts.json` (lượt chính:
  5 run, errors []).
- Mới: `benchmarks/results/v37-t6-ctts-reorder-proxy.json` (lượt
  reorder: 4 run, errors []).
- Mới: `docs/PHASE9_ROUND37_T6_PROXY4K_CTTS_LIMITS.md` (file này).
- Không sửa: `reverseWebcodecs.ts`, `mp4Demux.ts`,
  `reversePreviewGate.ts`, `reverseDecodeAhead.ts`, `preview.tsx`,
  `proxy.js`, `assetStore.ts`, `rehydrate36S5.ts`, tsconfig, mọi
  file luồng khác, paths-loop, build-loop-log. Scratch chỉ nằm ngoài
  repo (`~/workspace/tmp-round37-t6/` — fixture 4K + proxy + script
  chẩn đoán, không vào batch).
- Kiểm chứng cú pháp: `node --check` cả 3 script mới đều pass;
  `tsc`/`vite build` thuộc bước gộp của parent (tránh phá phép đo
  luồng khác đang chạy song song).
