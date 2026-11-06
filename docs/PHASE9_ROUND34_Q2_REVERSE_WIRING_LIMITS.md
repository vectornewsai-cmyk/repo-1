# Phase 9 đợt 34, luồng Q2 — Nối ReverseFrameCache + hook rAF vào preview phát ngược (sau cờ opt-in) — LIMITS

Ngày: 01/11/2026 (giờ +07; log probe UTC 13:21–13:23).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo.
Luồng này KHÔNG sửa `seek.ts`, KHÔNG sửa i18n, KHÔNG sửa bridge,
KHÔNG sửa file `scripts/*` của luồng khác, KHÔNG ghi paths-loop hay
build-loop-log (parent gộp). Đọc trước khi làm:
`docs/PHASE9_ROUND33_LIMITS.md` §3 mục 3 và
`docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md` §6.

## 0. Kết luận ngắn (không vượt số đo)

1. **Hook rAF ĐÃ NỐI THẬT vào vòng lặp preview** (`preview.tsx`):
   ghi mẫu mỗi tick, loại tick `justWoke`, công bố
   `window.__vcutPreviewRaf` + `window.__vcutReverseEngine`. App thật
   (dist mới) mount lên đã thấy hook có mẫu và engine mặc định
   `"element"`.
2. **Đường WebCodecs ĐÃ NỐI THẬT vào `drawVideoClip`, sau cờ opt-in
   mặc định TẮT** (`window.__vcutReverseWebcodecs === true`):
   khi cờ bật + có VideoDecoder + clip đang stepping ngược + cache
   đã có frame đúng mốc source time thì vẽ frame cache, đi tiếp
   đúng pipeline (mask/SR/LUT/chroma/effects/opacity); mọi trường
   hợp còn lại rơi về nhánh element cũ nguyên vẹn. Bật cờ trong app
   thật + wake vòng lặp đã đổi engine công bố sang `"webcodecs"`.
3. **Bộ nhớ VideoFrame thật (lần đầu có số đo, không còn lý thuyết
   NV12): ~2,40 MiB/frame ở 720p** (delta RSS cây Chrome cho 298
   frame giữ, xem §2). Cửa sổ cache mặc định chốt từ số này:
   **75 frame** trong ngân sách 192 MiB (75 × 2,40 ≈ 180 MiB).
4. **ctts + elst ĐÃ làm cho footage thật:** parse ctts v0/v1 và
   elst v0/v1, present đúng thứ tự B-frame (kiểm chứng trên fixture
   x264 có 86 frame B thật: thứ tự present đơn điệu giảm đúng,
   `frameAt(2.0s)` trả đúng frame tới từng µs, diff 0).
5. **KHÔNG claim 30 fps ngược cho preview.** Paced từ cache ấm vẽ
   đủ 90/90 frame trong 2,981 s wall nhưng 47/90 frame trễ > 20 ms
   dưới tải; present unpaced phẳng chỉ 51,3 fps dưới tải ~4,5 (xa
   số quiet 278 fps của P5 — khác chế độ tải nên không kết luận
   hồi quy). Số fps của đợt này gắn với tải song song của đợt 34.
6. **Phát hiện nợ lớn (không giấu): controller hiện giữ nguyên cả
   ArrayBuffer file trong lúc decode/giữ** — file noise 420 MB làm
   JS heap lên 401 MB. Ngân sách cửa sổ 192 MiB KHÔNG bao gồm
   khoản này. Cần đổi sang fetch theo khoảng GOP (hoặc nhả buffer
   sau decode) trước khi bật cờ này cho file lớn (xem §5.1).

## 1. Đã làm (file đổi/thêm — danh sách chính xác)

### 1.1 Sửa

- `apps/web/src/lib/mp4Demux.ts` — ctts + elst (xem §3).
- `apps/web/src/lib/reverseWebcodecs.ts` — thứ tự present theo
  presentation timestamp, `get()`, ngân sách bộ nhớ, controller nối
  preview + registry + thống kê (xem §4).
- `apps/web/src/lib/reversePlayback.ts` — chỉ thêm phần cờ opt-in
  cuối file: `ReverseEngine`, `isReverseWebcodecsOptedIn()`,
  `resolveReverseEngine()` (xem §4.3). Không đụng logic stepping cũ.
- `apps/web/src/preview.tsx` — nối tối thiểu, có rào chắn (xem §4):
  import 2 module mới, hook rAF (khai báo + record + `justWoke` +
  cleanup), công bố engine, nhánh cache trong `drawVideoClip`
  (kèm nới kiểu `srcEl` sang `VideoFrame` và nới tham số
  `chromaKeyedSource` sang `CanvasImageSource` — hàm này chỉ dùng
  `drawImage` nên không đổi hành vi với nguồn cũ).
- `apps/web/tsconfig.json` — chỉ thêm 2 test mới vào exclude (theo
  tiền lệ P4: test dùng import `.ts` cho Node strip-types nên
  không qua được TS5097 nếu nằm trong include).

### 1.2 Mới

- `apps/web/src/lib/mp4Demux34Q2.test.ts` — 8 test ctts/elst trên
  MP4 dựng tay (ctts v1 offset âm, elst v0 rỗng + media, ctts v0,
  elst v1, trường hợp không ctts/elst).
- `apps/web/src/lib/reversePlayback34Q2.test.ts` — 4 test cờ opt-in.
- `docs/PHASE9_ROUND34_Q2_REVERSE_WIRING_LIMITS.md` — file này.
- `benchmarks/results/v34-q2-videoframe-memory.json` — toàn bộ số
  đo probe + RSS theo phase + phân tích delta.

### 1.3 Không đụng (ghi rõ để parent khỏi nghi ngờ)

`seek.ts`, mọi file i18n, bridge, mọi file `scripts/*` (probe đợt
này chỉ nằm ở scratch `~/workspace/tmp-round34-q2/`, không stage),
file của luồng Q3 (`reverseDecodeAhead.ts` — hoạch định
decode-ahead là của Q3, controller ở đây KHÔNG tự decode-ahead
nhiều GOP để khỏi làm trùng), file của luồng Q4, paths-loop,
build-loop-log. Dist trên đĩa bị build lại 2 lần để kiểm chứng
(đây là tài nguyên chia sẻ, không stage dist).

## 2. Đo bộ nhớ VideoFrame thật (nhiệm vụ 1 — chốt kích thước cache)

### 2.1 Phương pháp (vì sao không dùng JS heap)

VideoFrame nằm ngoài JS heap: giữ 298 frame phẳng, JS heap đứng
yên 1 MB (baseline cũng 1 MB). Vì vậy đo bằng **delta RSS cây
tiến trình Chrome** (tiến trình chính + mọi tiến trình con, tổng
RSS, lấy trung vị các mẫu trong phase). Runner polling CDP mỗi
~0,5 s, ghi kèm load1. Probe import đúng module ESM đã biên dịch
từ code đợt này và chạy đúng lệnh controller mà preview gọi.
Máy: VM 2vCPU/8GB, không GPU; Playwright chromium 156.0.8078.4
headed qua Xvfb :96. (Lưu ý môi trường: binary meta-chromium bị
chặn bởi policy máy — "Hatch WebGL domain policy", exit 13 — nên
probe dùng Playwright chromium như P5; socket Xvfb :97 mồ côi
cũng đã gây CDP timeout ở lần chạy đầu và đã sửa bằng kiểm tra
tiến trình Xvfb sống trước khi dùng socket.)

### 2.2 Số đo (chi tiết ở benchmarks JSON)

| Phase | RSS trung vị (KB) | Ghi chú |
|---|---|---|
| Baseline (trang trống) | 1.371.084 | load1 3,57 |
| Giữ 298 frame phẳng 720p | 2.103.792 | load1 3,57→4,54 |
| Sau closeAll (phẳng) | 1.697.792 | vẫn +326.708 KB so baseline |
| Giữ 298 frame noise 720p | 1.914.788 (n=115, min 1.712.264, max 2.178.724) | phase này GỒM cả 79,7 s decode; load leo tới ~15 |
| Giữ 148 frame phẳng 1080p | 1.866.712 | nhiễm buffer noise chưa GC (xem §2.3) |

- **720p: (2.103.792 − 1.371.084) KB / 298 = 2.517.762 byte ≈
  2,40 MiB/frame**, gấp ~1,82× NV12 lý thuyết (1.382.400 byte).
  Đây là delta RSS nên gồm cả backing VideoFrame + đệm
  decoder/canvas + tiến trình GPU/video khởi động lần đầu — tức
  là **cận trên để lập ngân sách, không phải số byte thuần của 1
  VideoFrame**. Dùng cận trên để chốt ngân sách là đúng hướng
  (thừa an toàn hơn thiếu).
- **Ngân sách chốt: 192 MiB, cửa sổ mặc định 75 frame**
  (192 MiB / 2,40 MiB ≈ 79,9 → lấy 75 chừa biên). Hằng
  `REVERSE_CACHE_DEFAULT_WINDOW_FRAMES = 75`,
  `REVERSE_CACHE_MEMORY_BUDGET_BYTES = 192 MiB`,
  `windowFramesForMeasuredBudget()` đã kiểm chứng lại bằng build
  CJS với đúng đầu vào đo được (75 frame vừa ngân sách, 79 là
  giới hạn toán học).
- **1080p: delta 495.628 KB / 148 ≈ 3,27 MiB/frame — CHỈ MANG TÍNH
  CHỈ DẪN**, vì phase này đo sau phase noise mà JS heap vẫn còn
  401–405 MB buffer file noise chưa GC. Không dùng số này để
  chốt hằng số; nợ đo 1080p sạch vẫn mở (§5.3).

### 2.3 Hai vết bẩn trong phép đo (ghi đủ, không giấu)

1. Sau `closeAll`, RSS vẫn cao hơn baseline ~327 MB. Chưa phân
   biệt được GC lag (V8 chưa thu hồi) với Chrome tăng trưởng
   chung — chỉ quan sát, không claim leak và cũng không claim
   "đã giải phóng sạch".
2. Controller giữ nguyên cả file (xem §5.1): phase noise có JS
   heap 401 MB trong lúc giữ, và phần này còn vương sang phase
   1080p sau đó. Mọi delta RSS sau phase noise đều nhiễm khoản
   này ở mức độ chưa tách được.

## 3. ctts/elst cho footage thật (nhiệm vụ 2)

### 3.1 Đã làm trong `mp4Demux.ts`

- **ctts v0** (offset không dấu) **và v1** (offset có dấu, B-frame
  thường âm ở sample sau): mỗi sample có thêm
  `presentationTimestamp = decode timestamp + composition offset`
  (không ctts thì bằng decode timestamp nên mọi số cũ không đổi).
- **elst v0/v1** trong `edts/trak`: parse đủ entry rỗng
  (`media_time = -1`, dwell) và entry media; `movieTimescale` lấy
  từ `mvhd` (v0 +12, v1 +20, giống mdhd). `editShiftUnits()` =
  media_time của entry không rỗng đầu tiên (null khi không có
  elst); `displayTimestampUnits() = presentation − shift`;
  `isBeforeEditStart()` = display < 0 (demux KHÔNG tự drop sample
  trước edit — caller tự bỏ qua, ghi rõ trong code).
- **`sampleChunkInit()` nay dùng presentation timestamp** (thay
  vì decode timestamp): WebCodecs nhận chunk theo thứ tự decode
  nhưng dùng timestamp này để reorder B-frame và output đúng thứ
  tự present; decoder output mang timestamp này nên
  `ReverseFrameCache` map output → sample đúng cả khi có B-frame.
  File không ctts thì presentation = decode nên hành vi cũ giữ
  nguyên (test P5 cũ không đổi số).
- **Helper thứ tự present:** `presentOrderFor()` (decode-index
  sắp theo presentation tăng dần, hòa → index tăng dần) và
  `sampleIndexForPresentationTime()` (mốc thời gian → decode-index
  của sample có presentation/display time lớn nhất mà vẫn ≤ mốc;
  trước sample đầu → sample present đầu tiên; vượt cuối → sample
  present cuối cùng). Controller dùng đúng hàm này với cùng mốc
  source time mà đường element-seek dùng, nên tra ra cùng frame.

### 3.2 Kiểm chứng

- **Node (MP4 dựng tay, 8/8 pass):** ctts v1 offset âm cho
  presentation [0,300,100,200] từ decode [0,100,200,300]; thứ tự
  present [0,2,3,1]; chunk timestamp sample B = 300.000 µs;
  elst v0 (rỗng 100 + media 100) cho shift 100, display
  [-100,200,0,100], sample trước edit bị đánh dấu; ctts v0 + elst
  v1 đều parse được; không ctts/elst thì presentation = decode,
  edit rỗng, shift null.
- **Browser (footage B-frame thật, ffmpeg x264 bf=3, 86 frame B):**
  `cttsDetected = true`; thứ tự present 12 đầu
  [0,1,2,4,3,5,7,6,9,10,8,12] (thấy rõ reorder B); dãy vẽ từ cache
  đơn điệu giảm theo presentation timestamp
  (`presentOrderMonoDesc = true`); `frameAt(2.0s)` trả đúng frame
  tới từng µs (frame timestamp 2.066.667 µs = kỳ vọng, diff 0);
  decode cửa sổ 90 → 119 frame (mở rộng về đầu GOP), drawn 119,
  missing 0.

### 3.3 Giới hạn còn lại của demux

Vẫn không hỗ trợ: fragmented MP4 (moof/mvex), avc3, HEVC, nhiều
track. File có presentation timestamp trùng nhau giữa các sample
(file lỗi theo spec) sẽ làm cache map nhầm — demux không tự sửa
file lỗi; `decodeGop` giữ sample đầu, frame trùng bị đếm thiếu
chứ không map nhầm (đã ghi trong code).

## 4. Nối vào preview sau cờ opt-in (nhiệm vụ 3)

### 4.1 Cờ opt-in (mặc định TẮT)

- `window.__vcutReverseWebcodecs === true` mới bật (bật bằng tay
  từ console). **Chưa có toggle UI** — toggle cần store + i18n
  nên thuộc luồng sở hữu 2 mảng đó, không làm lén ở đây.
- `resolveReverseEngine()`: `"webcodecs"` chỉ khi cờ bật VÀ có
  `VideoDecoder`; thiếu 1 trong 2 thì `"element"`. Mọi lỗi
  fetch/demux/decode của đường mới đều khóa controller về
  unsupported và mọi lần hỏi sau trả null ngay — đường cũ không
  bao giờ bị chặn bởi lỗi của đường mới.

### 4.2 Điểm nối trong `preview.tsx` (rào chắn đầy đủ)

1. **Hook rAF** (đúng điểm chèn trong comment module P5):
   khai báo cạnh `idleDebug`, record ở đầu `loop` TRƯỚC dòng
   clamp `dt` (dùng `last` trước khi bị ghi đè) và trước nhánh
   early-return chưa có canvas/wrap, `justWoke = true` trong
   `wake()`, cleanup xóa `__vcutPreviewRaf` + đóng controller.
   Hook chỉ ghi mẫu đo, không đổi hành vi vẽ.
2. **Công bố engine:** mỗi tick, `resolveReverseEngine()` được
   đọc và chỉ ghi `window.__vcutReverseEngine` khi đổi giá trị
   (tránh ghi mỗi tick).
3. **Nhánh cache trong `drawVideoClip`** (nhánh video): chỉ khi
   stepping (phát ngược toàn cục hoặc `clip.reverse`) VÀ engine
   = `"webcodecs"` mới hỏi `reverseWebcodecsFrameFor()` với nguồn
   `item.proxyUrl ?? item.url` (đúng source element đang dùng) và
   mốc `rampSourceTimeAt(clip, t)` (đúng mốc element seek tới).
   Có frame đúng mốc thì `srcEl = VideoFrame`, đi tiếp đúng
   pipeline (VideoFrame là `CanvasImageSource` hợp lệ; chroma/LUT/
   effects/mask/SR/opacity đều chạy trên canvas như cũ). Chưa có
   frame (đang decode / source không demux được / unsupported)
   thì rơi về nhánh element cũ nguyên vẹn — không skip, không
   đen. Thống kê hit/miss phơi qua `window.__vcutReverseWc`.
4. **Không đổi hành vi khi cờ tắt:** khi engine = `"element"`,
   `wcFrame` luôn null nên nhánh `else if (v)` chạy đúng code cũ;
   `stepping` chỉ được tính sớm hơn (cùng biểu thức, thuần túy,
   không side effect) so với vị trí cũ trong khối `if (v)`.

### 4.3 Controller nối preview (`reverseWebcodecs.ts`)

`ReversePreviewController` (1 instance / 1 source URL, registry
theo URL): fetch + demux 1 lần; `ensureWindowForTime()` decode
cửa sổ present chứa mốc hỏi (cửa sổ present = `windowFrames`
sample theo thứ tự present, decode từ đầu GOP chứa sample
decode-nhỏ nhất tới sample decode-lớn nhất, evict ngoài cửa sổ);
`frameAt()` đồng bộ — có frame đúng mốc thì trả, chưa có thì
kích decode nền và trả null. **Bất biến an toàn:** `frameAt` chỉ
trả frame của đúng decode-index mà mốc thời gian tra ra; decode
cửa sổ cũ (stale) có thể evict mất frame cửa sổ mới nhưng KHÔNG
BAO GIỜ trả frame sai mốc — trường hợp xấu nhất là null →
fallback element. Controller KHÔNG tự decode-ahead nhiều GOP
(hoạch định đó là của Q3, không làm trùng).

### 4.4 Kiểm chứng wiring trong app thật

Serve dist mới (vite build đợt này) + Playwright chromium headed
qua CDP: app mount ("VCut Studio"), `__vcutPreviewRaf` có mẫu
(5 mẫu lúc idle — vòng lặp ngủ khi không phát nên ít mẫu là
đúng), `__vcutPreviewIdle` cũ còn nguyên, engine mặc định
`"element"`; đặt `window.__vcutReverseWebcodecs = true` +
dispatch resize (wake) → engine công bố đổi sang `"webcodecs"`.
`__vcutReverseWc` null trong lần check này vì app test không có
clip nào nên `drawVideoClip` chưa từng hỏi cache — đường vẽ có
clip đã được kiểm chứng bằng probe controller dùng cùng code
(§3.2, §5.4), không mạo nhận app-check đã vẽ clip thật.

### 4.5 Cái gì KHÔNG đổi (trung thực)

- Khi cờ tắt, preview chạy y hệt cũ (element-seek + hold).
- Khi cờ bật, `syncMedia` vẫn seek element như cũ (dư thừa
  nhưng vô hại — draw ưu tiên frame cache khi có); bỏ seek
  element dưới cờ bật là việc tối ưu sau, không làm lén ở đây
  vì `syncMedia` nằm ngoài phạm vi luồng này.
- Hold stats (`__vcutHoldStats`) chỉ đếm đường element; frame
  cache vẽ thành công đếm riêng ở `__vcutReverseWc.hits`.

## 5. Đo lại fps (nhiệm vụ 4) + nợ còn lại

### 5.1 Số fps đo được (KHÔNG claim 30 fps ngược)

Mọi số dưới đây đo dưới tải song song của đợt 34 (load1
3,57–4,54 lúc baseline/phẳng, leo tới ~15 lúc decode noise) —
**cấm so sánh hồi quy với số quiet của P5/O5/N2** (quy tắc đợt
33). Trình tự đo: controller decode cửa sổ → present unpaced từ
cache → paced 30 fps từ cache ấm.

| Đo | Kết quả dưới tải đợt này | Số quiet P5 (chỉ tham khảo, khác tải) |
|---|---|---|
| Decode phẳng 720p (298 fr) | 420,3 fps (0,709 s) | 577–607 fps |
| Present unpaced phẳng 720p | **51,3 fps** (5,813 s / 298) | 278–306 fps |
| Paced ngược 90 fr từ cache ấm | đủ 90/90, wall 2,981 s, **nhưng 47/90 trễ > 20 ms** | — |
| Decode noise 720p (298 fr) | 3,7 fps (79,659 s) | 31,9 fps |
| Present unpaced noise 720p | 32,0 fps | 219,3 fps |
| Decode phẳng 1080p (148 fr) | 38,6 fps (3,837 s) | — |
| Present unpaced phẳng 1080p | 22,9 fps | — |

Đọc đúng: cadence trung bình của paced giữ được (wall ≈ 3,0 s
cho 90 frame) nhưng jitter lớn dưới tải — **không phải 30 fps
sạch, không claim preview đã chạy 30 fps ngược**. Present unpaced
thấp xa số quiet của P5 dù cùng lệnh vẽ: tải song song trên VM
2vCPU giải thích được phần lớn (đặc biệt decode noise chậm gấp
~8,5× so với quiet), nhưng chưa có phép đo quiet đối chứng trong
đợt này để tách tải khỏi code — đó là nợ §5.4, không được suy
diễn thành "code chậm đi".

### 5.2 Nợ còn lại (xếp theo mức độ chặn)

1. **(CHẶN cho file lớn) Controller giữ nguyên cả ArrayBuffer
   file:** file noise 420 MB → JS heap 401 MB trong lúc giữ.
   Ngân sách 192 MiB chỉ tính frame, chưa tính buffer file. Cần
   đổi sang fetch theo khoảng byte của GOP (dựa vào bảng chunk
   offset đã demux) hoặc nhả buffer sau khi decode xong cửa sổ
   (decode cửa sổ sau fetch lại) trước khi bật cờ này cho file
   lớn. File nhỏ (vài chục MB) thì khoản này không đáng kể.
2. **(CHẶN cho claim 30 fps) Đo lại fps khi máy quiet** (tạm dừng
   luồng browser khác, ghi đủ tải + tốc độ xuôi + gap rAF như quy
   tắc đợt 33) cho cả đường element cũ lẫn đường cache mới, rồi
   mới kết luận đường cache có nhanh hơn đường cũ không.
3. **Đo 1080p sạch** (không nhiễm buffer file lớn chưa GC) để
   chốt cửa sổ theo độ phân giải, hoặc đổi controller sang cửa sổ
   theo byte (budget chia cho byte/frame đo được theo từng
   track) thay vì đếm frame cố định 75.
4. **Toggle UI cho cờ opt-in** (store + i18n — thuộc luồng sở hữu
   2 mảng đó) + dọn controller khi cờ tắt (hiện chỉ dọn khi
   unmount effect).
5. **Bỏ seek element thừa khi cờ bật** (đường cache đã vẽ thì
   `syncMedia` không cần seek element nữa) — tối ưu, không ảnh
   hưởng đúng đắn.
6. **Đo trên máy có GPU** (hardware decode, `prefer-hardware`
   vẫn false trên VM này) — nợ đứng từ P5, vẫn chưa có số.
7. **Safari / máy thật / dpr > 1 / viewport khác:** chưa đo cho
   cả đường cũ lẫn đường mới (nợ chung).
8. **Tách chi phí tạo decoder mỗi GOP** khỏi wall decode (nợ P5
   §2.6, vẫn còn).

## 6. Kiểm chứng gộp của luồng (không lấy số của mình làm chứng duy nhất)

- `tsc --noEmit -p apps/web/tsconfig.json`: **exit 0, output
  rỗng** (sau khi sửa 3 lỗi của luồng: đụng tên `engine` với
  AudioEngine trong loop, kiểu `decodePromise`, và 2 test mới
  vào exclude; lỗi TS5097 của file test luồng Q3 đã hết ở thời
  điểm kiểm chứng cuối vì Q3 đã tự thêm exclude — không phải do
  luồng này sửa).
- `vite build`: **pass, 6,47 s** (bundle mới chứa marker
  `__vcutPreviewRaf`, `__vcutReverseEngine`,
  `__vcutReverseWebcodecs`).
- Node strip-types: `mp4Demux34Q2` **8/8**, `reversePlayback34Q2`
  **4/4**, `reversePlayback` cũ **10/10**,
  `reversePlaybackRound28L2` **17/17**, `seek` (không sửa nhưng
  chạy hồi quy) **15/15**.
- Build CJS scratch: budget với đầu vào đo được **pass**
  (75 frame vừa 192 MiB; giới hạn toán học 79 frame; đầu vào
  lệch → 1 frame).
- Probe browser: 0 error; budget check trong trang 8/8 (lưu ý:
  các assert ngân sách trong trang chạy với hằng placeholder
  trước khi chốt số đo — hằng cuối 75 đã kiểm chứng lại bằng
  build CJS sau khi chốt, xem §2.2); rafHook math 2/2.
- App thật: hook + engine mặc định + đổi engine khi bật cờ
  (§4.4).
- Sự cố trong lượt: (a) lần chạy probe đầu CDP timeout do socket
  Xvfb :97 mồ côi — đã sửa runner (kiểm tra tiến trình Xvfb
  sống); (b) meta-chromium bị policy máy chặn (exit 13) — đổi
  sang Playwright chromium như P5; (c) test strip-types lúc đầu
  lỗi do parameter properties trong constructor controller (không
  erasable) — đã sửa thành khai báo field tường minh; (d) test
  strip-types import `reverseWebcodecs.ts` lỗi resolve do module
  nguồn import không đuôi theo chuẩn bundler — ngân sách vì vậy
  kiểm chứng qua probe browser + build CJS, không cố sửa import
  nguồn cho vừa Node (ghi rõ trong comment đầu test).
