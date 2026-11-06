# Phase 9 đợt 32, luồng P5 — Reverse playback 30fps: nền tảng WebCodecs + đo lặp fps ngược — LIMITS

Ngày: 01/11/2026 (giờ +07; log harness ghi UTC 07:12–07:18).
KHÔNG push, KHÔNG release/tag, KHÔNG code giả, KHÔNG binary vào repo.
Luồng này KHÔNG sửa `seek.ts`, KHÔNG sửa logic seek trong `preview.tsx`
(luồng P2 cùng đợt đang sửa vùng đó), KHÔNG đụng dip, CLI, toast,
cdp-snapshot, autosave, KHÔNG tự ghi paths-loop hay build-loop-log
(parent gộp). Đọc trước khi làm: `docs/PHASE9_ROUND31_N2_REVERSE_FPS_LIMITS.md`
toàn bộ và `docs/PHASE9_ROUND32_O5_REVERSE_WEBCODECS_LIMITS.md` toàn bộ.

> **GHI CHÚ ĐỢT (bổ sung 01/11/2026):** file này giữ tên `ROUND32_P5`
> theo chỉ đạo của parent, nhưng nội dung §7 trở đi thực chất là việc
> của **đợt 33** (follow-up): sửa lỗi tsc do luồng P4 báo + quy kết
> nghi hồi quy fps ngược mà O5 đợt 32 còn để mở (O5 §6 nợ 1). Parent
> sẽ stage đợt này dưới tên đợt 33. Các §0–§6 giữ nguyên lịch sử
> đợt 32 P5, không viết lại; §7 là phần bổ sung, không ghi đè kết
> quả cũ.

**Vị trí của luồng này so với O5 (tránh hiểu lầm là làm lại):** O5 đợt 32
đã làm spike WebCodecs (Annex B chuẩn bị offline bằng ffmpeg, chưa có
demux MP4 trong browser), đo lặp 3+3 lượt, và viết spec hook rAF (chưa
áp dụng). P5 KHÔNG lặp lại spike đó mà tiến lên đúng 3 bước O5 để lại
(§2.5 của O5): (1) demux MP4 THẬT trong browser, (2) prototype
decode-ahead + cửa sổ trượt qua library thật (không phải spike inline),
(3) thí nghiệm flush chunk đơn. Cộng thêm đo lặp fps ngược 3+3 lượt
trên bundle hiện tại và module hook rAF đã test toán học (chưa nối
vào preview — xem §3 vì sao).

## 0. Kết luận ngắn (không vượt số đo)

1. **Đo lặp fps ngược (6 lượt, cùng 1 bundle): GOP thưa 0.96–2.56
   (trung vị 2.00), GOP dày 4.74–11.67 (trung vị 7.67) — đều dưới 30,
   và đều dưới khoảng rảnh của N2 (thưa 8.97; dày 18.42–24.05).**
   Nhưng **KHÔNG kết luận hồi quy do code**: (a) "máy rảnh" KHÔNG đạt
   được trong đợt này — loadavg 1 phút giữ 2.85–8.74 suốt 6 lượt vì
   các luồng P khác chạy song song (Chrome headed + build); (b) bundle
   đo đợt này (`index-Cqp7uur1.js`) khác bundle N2 (`C0HfodWe`) và
   khác bundle O5 (`D3yYXWHm`) — so sánh là bundle-với-bundle trong
   môi trường khác nhau. Số đợt này là baseline "dưới tải song song
   của đợt 32", không phải baseline rảnh mới. Muốn khóa hồi quy phải
   đo lại khi máy quiesced (không luồng browser nào khác) — xem §1.4.
2. **Nền tảng WebCodecs là THẬT và đo được, nhưng kết luận "đủ cho
   30 fps ngược" của O5 cần thêm 1 dấu sao: chỉ chắc trên footage
   phẳng.** Qua demux MP4 thật + `ReverseFrameCache` thật: decode
   1 GOP phẳng 577–607 fps, present ngược từ cache qua canvas 2D
   278–306 fps — vượt xa 30. Nhưng trên footage nhiễu thật (testsrc2
   + noise, GOP 300): decode phần mềm chỉ **31.9 fps** (9.41 s cho
   1 GOP 300 frame, cửa sổ phát ngược 10 s — biên chỉ ~6%).
   Decode-ahead giấu được chi phí trên footage phẳng với biên lớn,
   nhưng trên footage nhiễu ở máy này (VM không GPU, decode phần mềm,
   đang bị luồng khác tranh CPU) thì biên gần như không còn. Đây là
   số đo mới mà O5 chưa có (O5 chỉ đo phẳng).
3. **Latency chunk đơn đã có đáp án (đóng nợ O5 §2.4):** queue
   1 keyframe → `flush()` → **1 output, 2.5 ms**. Lần kẹt 20 s của O5
   là do đếm output TRƯỚC flush; decoder không kẹt, chỉ giữ frame
   chờ flush. Số latency 1 frame phục vụ thiết kế seek đã có.
4. **Demux MP4 trong browser rẻ không đáng kể:** 1.5 ms (thưa) /
   0.4 ms (dày) cho file 900 frame — không phải bottleneck.
5. **Hook gap rAF riêng vòng preview: CHƯA nối vào `preview.tsx`.**
   Giao module `previewRafHook.ts` (toán clamp/gap/lost đã test
   30/30 cùng demux) + điểm chèn đã đối chiếu đúng số dòng hiện tại
   (§3). Lý do không nối: P2 cùng đợt đang sửa `preview.tsx`; chèn
   lúc này có nguy cơ xung đột ghi đè. Đây là nhánh "chỉ làm phần đo
   ngoài preview" mà task cho phép, ghi rõ chứ không claim đã nối.
6. **Preview vẫn dùng đường element-seek cũ. KHÔNG claim preview đã
   chạy 30 fps ngược.** Mọi số WebCodecs dưới đây là của prototype
   ngoài preview, chưa nối vào vòng lặp preview.

## 1. Đo lặp fps ngược (6 lượt, harness N2 nguyên vẹn)

### 1.1 Phương pháp

- Harness y nguyên đợt 31 N2:
  `apps/web/scripts/clicktest-round31-n2-reverse-fps-pipe.mjs` (không
  sửa 1 dòng). Mỗi lượt snapshot dist riêng, profile Chrome riêng,
  display `:94` / port `4194` (tránh :93/:95/:96/:98/:99 của luồng
  khác). Thứ tự xen kẽ thưa/dày.
- Fixture y nguyên đợt 28/31: `~/workspace/tmp-round27-k4/`
  `sparse-gop-flat.mp4` (GOP 300) và `dense-gop-flat.mp4` (GOP 30);
  cả hai 1280×720, 30 s, 30 fps, H.264 High@L3.1.
- Bundle đo: `index-Cqp7uur1.js` — GIỐNG NHAU ở cả 6 lượt (mỗi lượt
  snapshot đều ghi bundle này), nên so sánh TRONG đợt này là sạch.
  Lưu ý: bundle trên đĩa đã đổi 2 lần trong buổi này trước khi đo
  (lúc 01:30 là `B8uKpTK2`, lúc đo là `Cqp7uur1`) do luồng khác
  build lại dist — dist là tài nguyên chia sẻ, không khóa được.
- Chỉ số "máy rảnh" dùng ở đây KHÔNG chỉ loadavg: loadavg 1 phút là
  trung bình trượt, chậm phản ánh tải thực (bằng chứng: dense-1 có
  load 7.47 nhưng rAF P50 7.9 ms và tốc độ xuôi 0.980 — khỏe như lúc
  rảnh). Vì vậy mỗi lượt được phân loại thêm bằng tốc độ xuôi nội
  suy + gap rAF (probe toàn cục kiểu N2, vẫn là cận dưới loss như
  N2 đã cảnh báo).

### 1.2 Bảng số

| Lượt | GOP | fps ngược (draw/wall) | drawDelta | holdDelta | Xuôi nội suy | Verdict | Load 1' trước ngược |
|---|---|---|---|---|---|---|---|
| sparse-1 | thưa | **0.96** (15/15.60 s) | 15 | 161 | 0.648 (đói rAF) | PARTIAL\* | 6.82 |
| sparse-2 | thưa | **2.56** (36/14.04 s) | 36 | 419 | 1.000 | PASS | 8.49 |
| sparse-3 | thưa | **2.00** (29/14.47 s) | 29 | 350 | 0.983 | PARTIAL\* | 4.86 |
| dense-1 | dày | **11.67** (166/14.22 s) | 166 | 357 | 0.980 | PASS | 7.47 |
| dense-2 | dày | **7.67** (109/14.21 s) | 109 | 298 | 1.001 | PASS | 7.03 |
| dense-3 | dày | **4.74** (71/14.99 s) | 71 | 222 | 0.850 (tải một phần) | PASS | 3.66 |

Tổng hợp (báo khoảng + trung vị, theo yêu cầu đợt này):

| GOP | Đợt 32 P5 (3 lượt) | Đợt 32 O5 (3 lượt) | Đợt 31 N2 lúc rảnh |
|---|---|---|---|
| Thưa (GOP 300) | **0.96–2.56, trung vị 2.00** | 3.83–5.86, trung vị 4.55 | 8.97 (1 lượt) |
| Dày (GOP 30) | **4.74–11.67, trung vị 7.67** | 9.10–11.92, trung vị 10.70 | 18.42–24.05 (2 lượt) |

Tập con "rAF khỏe" (xuôi nội suy ≥ 0.98, tức main thread không đói):
thưa 2.00–2.56 (2 lượt), dày 7.67–11.67 (2 lượt). Ngay cả tập con này
vẫn dưới N2 — nhưng decode/seek chạy trên thread/process khác của
Chrome nên rAF khỏe KHÔNG chứng minh decode không bị tranh CPU với
các Chrome của luồng song song. Vì vậy tập con này vẫn chưa phải
"rảnh" theo nghĩa của N2.

\* PARTIAL ở sparse-1/sparse-3 là artefact mẫu chuyển tiếp, cùng họ
với PARTIAL của N2/M2: mẫu gray đầu phase ngược còn frame cũ
(sparse-1: 8 mẫu đầu = 3 rồi mới 27→17; sparse-3: mẫu đầu = 6 rồi
29→16), sau warmup giảm đơn điệu, không mẫu đen (`blackRev = 0`),
badge ngược/giữ đều thấy, playhead ngược 29.5 → 15.2–16.2. Phát ngược
vẫn đúng; chỉ check monotonic của harness fail vì mẫu đầu.

### 1.3 Đọc số này như thế nào (và không như thế nào)

- **Được claim:** đường element-seek hiện tại, dưới tải song song
  của đợt 32, cho fps ngược thưa ~2 và dày ~8 (trung vị); 30 fps
  ngược là không thể bằng đường này trong bất kỳ lượt nào (cao nhất
  11.67). HoldDelta ngược 161–419 (thưa) / 222–357 (dày) xác nhận
  lại bottleneck là seek/decode từng frame, không phải rAF (rAF
  ngược ở 5/6 lượt khỏe: P50 7–13 ms, 0–1 gap > 100 ms sustained
  sau khi trừ tick biên).
- **Không được claim:** "đợt 32 làm chậm phát ngược" hay "code P/O
  gây hồi quy". Ba phiên đo (N2, O5, P5) khác bundle, khác tải, khác
  thời điểm; tỉ lệ trung vị P5/N2 (~0.22× thưa, ~0.36× dày) và
  P5/O5 (~0.44× thưa, ~0.72× dày) đều nằm trong vùng mà tải song
  song có thể giải thích (đặc biệt GOP thưa: mỗi bước ngược phải
  giải mã lại cả GOP 300 frame, cực kỳ nhạy với tranh CPU decode).
- **Phương sai lượt-lượt vẫn lớn, nhưng đã có cấu trúc mới:** GOP
  dày dao động 4.74–11.67 (±~43% quanh trung vị) — lớn hơn ±~25%
  của N2 và ±~13% của O5. GOP thưa rAF-khỏe dao động hẹp hơn
  (2.00–2.56, ±~12%) nhưng ở mức thấp hẳn. Mẫu này phù hợp với
  "decode bị tranh CPU ngoài main thread" hơn là "phương sai ấm
  Chrome" thuần túy.

### 1.4 Việc cần làm để khóa số (đợt sau)

Đo lại 3+3 lượt trên 1 bundle cố định, máy quiesced thật (tạm dừng
mọi luồng browser khác trong cửa sổ đo, xác nhận bằng cả loadavg
lẫn tốc độ xuôi lẫn số process Chrome), warm-up Chrome trước lượt
chính thức. Tới lúc đó, số P5 chỉ là baseline "dưới tải đợt 32".

## 2. Nền tảng WebCodecs: demux MP4 thật + cache cửa sổ trượt

### 2.1 Module mới (library, chưa nối preview)

- `apps/web/src/lib/mp4Demux.ts` — parse MP4: moov/trak/mdia/minf/
  stbl, stsd/avc1/avcC, stts, stss (vắng = mọi sample là key), stsz,
  stsc, stco/co64. Trả về track video H.264 đầu tiên: codec string
  từ avcC, description (avcC), timescale, kích thước, 900 sample với
  offset/size/timestamp/duration/isKey, cộng `sampleChunkInit`
  (timestamp/duration µs cho EncodedVideoChunk), `gopStartFor`,
  `reverseWindowFor` (align cửa sổ về đầu GOP), `nv12BytesPerFrame`.
  Dữ liệu sample MP4 đã là AVCC length-prefixed nên dùng trực tiếp,
  không qua Annex B như spike O5.
- `apps/web/src/lib/reverseWebcodecs.ts` — `ReverseFrameCache`:
  `decodeGop` (tạo VideoDecoder mỗi GOP, output key theo timestamp
  µs → index, frame lỗi không vào cache), `presentReverse` (vẽ theo
  thứ tự giảm dần, frame thiếu đếm vào `missing` chứ không vẽ sai),
  `evictExcept` (close frame ngoài cửa sổ), `closeAll`. Không tự
  chạy decode-ahead (tránh race với vòng present); caller điều phối
  (xem §2.4).
- Giới hạn demux (ghi rõ): chưa áp edit list (elst — timestamp trả
  về là media time thô), chưa reorder B-frame (không dùng ctts;
  fixture đo không có B-frame), chưa fragmented MP4 (moof/mvex),
  chưa avc3/HEVC/nhiều track. Fixture có B-frame sẽ decode sai thứ
  tự present nếu dùng timestamp decode — cần ctts trước khi nối
  preview cho video thật.

### 2.2 Kiểm chứng mức Node: 30/30 assertion

Test `~/workspace/tmp-round32-p5/test-demux.cjs` (scratch, không
stage; kết quả stage ở `benchmarks/results/v32-p5-demux.json`) chạy
trên build CJS của 3 module (tsc `--strict` pass cả CJS lẫn ESM):
trên cả 2 fixture flat — 900 sample, codec `avc1.64001F`, 1280×720,
30.00 s, keyframe đầu = 0, khoảng keyframe đúng GOP (300/30), mọi
offset/size nằm trong file, length-prefix AVCC hợp lệ, chunk 0 là
key @0 µs, chunk 150 là delta @5 000 000 µs (thưa) / key (dày, vì
150 = 5×30), `reverseWindowFor(450, 90)` cho decodeFrom 300 (thưa) /
360 (dày) — đúng GOP chứa frame 361. Toán hook rAF (§3) cũng nằm
trong 30 assertion này (ring 5, clamp 114→100 lost 14, phase loại
justWoke, predictedRate khớp 1−14/316).
- Lỗi gặp khi làm (trung thực): lần đầu demux không tìm thấy track
  vì offset box con của avc1 tính 78 thay vì 86 byte (VisualSampleEntry
  đủ 86 byte — xem comment trong code). Sửa xong 30/30. Lỗi thứ hai
  là do test, không phải module: kỳ vọng window thưa decodeFrom = 0
  trong khi frame 361 thuộc GOP bắt đầu ở 300, và kỳ vọng chunk 150
  dày là delta trong khi 150 là keyframe — đã sửa test, module đúng.

### 2.3 Kiểm chứng mức browser thật (probe P5, Chrome headed)

Probe mới `apps/web/scripts/probe-round32-p5-webcodecs-pipe.mjs` +
`probe-round32-p5-page.js` (pipe CDP + Xvfb, display `:93` / port
`4193`, Chrome 156.0.8078.4 — cùng binary với harness N2/O5). Trang
probe import module P5 đã biên dịch ESM (không phải code inline
như spike O5) nên số đo là của chính library sẽ nối vào preview.
Kết quả `benchmarks/results/v32-p5-webcodecs.json`:

| Đo | GOP thưa phẳng (300 fr) | GOP dày phẳng (30 fr) | Nhiễu 10 s (300 fr, GOP 300) |
|---|---|---|---|
| Demux MP4 trong browser | 1.5 ms (900 sample, 3 key) | 0.4 ms (900 sample, 30 key) | — (parse trong lần fetch; không tách riêng) |
| Decode qua cache | 300/300, 0.52 s → **577.1 fps** | 30/30, 0.049 s → **607.3 fps** | 300/300, 9.414 s → **31.9 fps** |
| Present ngược từ cache (canvas 2D) | 300 vẽ, 0 thiếu, 1.078 s → **278.2 fps** | 30 vẽ, 0 thiếu, 0.098 s → **306.1 fps** | 300 vẽ, 0 thiếu, 1.368 s → **219.3 fps** |
| `isConfigSupported` | prefer-hardware **false**, prefer-software **true** (giống O5; VM Xvfb không GPU) | | |

Fixture nhiễu tự tạo bằng ffmpeg (scratch, không vào repo):
`testsrc2 1280×720 30fps 10s + noise=alls=25`, x264 GOP 300, không
B-frame, 38.9 MB, 300 frame, 5 keyframe (scenecut của x264 chèn
thêm — decode vẫn từ keyframe 0 nên không ảnh hưởng phép đo 1 GOP).
> [Đính chính Z5 04/11/2026 — KHÔNG xoá dòng gốc] "GOP 300" ở đây
> là MƠ HỒ, cần đọc chính xác: đó là đặt encoder -g 300 + cửa sổ
> decode 300 frame từ keyframe 0 (phép đo 1 GOP của P5), KHÔNG
> phải GOP hiệu dụng đều 300 frame — chính dòng gốc đã ghi file có
> 5 keyframe do scenecut. Số 31,9 fps vẫn đứng; cấm trích "GOP 300"
> của clip này thành "keyframe cách nhau 300 frame".

### 2.4 Decode-ahead: tiêu chí đúng và kết quả

Probe đo thêm "decode GOP kế trong lúc present cửa sổ hiện tại"
bằng cache thứ hai: thưa decode GOP 2 hết 1.293 s trong khi present
không tốc độ (unpaced) cửa sổ 1 chỉ hết 0.982 s; dày 0.120 s so với
0.097 s — tức `decodeFinishedBeforePresentEnd = false` ở cả hai.
**Nhưng tiêu chí unpaced này là sai cho thiết kế thật:** phát ngược
thật present đúng 30 fps (có pacing), nên cửa sổ 300 frame kéo dài
10 s wall (thưa) và 30 frame kéo dài 1 s wall (dày). Tiêu chí đúng
là `decodeWall < thời lượng cửa sổ ở 30 fps`:

| Cửa sổ | Decode GOP kế (đo) | Thời lượng cửa sổ @30fps | Kết luận |
|---|---|---|---|
| Thưa phẳng | 0.52–1.29 s | 10 s | **Giấu được, biên lớn** |
| Dày phẳng | 0.05–0.12 s | 1 s | **Giấu được, biên lớn** |
| Thưa nhiễu | 9.41 s | 10 s | **Giấu được nhưng biên ~6%** — 1 lần giật decode là hụt cửa sổ |

Hệ quả thiết kế (không phải claim sản phẩm): cửa sổ trượt 90 frame
như O5 đề xuất vẫn hợp lý cho phẳng; với footage nhiễu trên máy
không GPU, cần hoặc cửa sổ lớn hơn (tăng bộ nhớ), hoặc decode
sớm hơn 1 GOP (prefetch 2 GOP), hoặc hardware decode. Chưa chọn —
cần đo lại trên máy có GPU trước khi khóa thiết kế.

### 2.5 Thí nghiệm chunk đơn: ĐÃ CÓ ĐÁP ÁN

Queue 1 keyframe → `flush()` → **1 output, queue→flush 2.5 ms**,
không error. Kết luận: decoder giữ frame đơn chờ flush (đúng giả
thuyết của O5); latency 1 frame theo đường flush là ~2.5 ms trên
fixture phẳng. Số này phục vụ thiết kế seek (warm-up seek vào GOP
mới), không phải latency decode chuỗi.

### 2.6 Chưa đo (ghi rõ, không giấu)

- Bộ nhớ VideoFrame thật: VideoFrame nằm ngoài JS heap nên jsHeap
  không thấy; số MB lý thuyết NV12 (414.7 MB/GOP thưa, 124.4 MB/90
  frame) vẫn chỉ là lý thuyết như O5 đã ghi. Cần đo bằng công cụ
  bộ nhớ của Chrome khi làm prototype nối preview.
- Hardware decode trên máy có GPU: `prefer-hardware` false trên VM
  này; máy user có thể khác — chưa kiểm tra.
- Safari / máy thật / dpr > 1 / viewport khác: chưa đo (nợ chung).
- Footage có B-frame / elst: demux hiện tại chưa xử lý (xem §2.1).
- Chi phí tạo decoder mỗi GOP: nằm trong wall decode của probe,
  chưa tách riêng — với GOP dày (0.05 s/GOP) phần này có thể đáng
  kể theo tỉ lệ, cần tách khi tối ưu.

## 3. Hook đo gap rAF riêng vòng preview: module xong, CHƯA nối

- Module mới `apps/web/src/lib/previewRafHook.ts`:
  `createPreviewRafHook(maxSamples = 5000)` (ring buffer, record
  gap/dt/lost đúng công thức clamp của loop: `dtMs = min(100,
  gapMs)`, `lostMs = max(0, gapMs − dtMs)`) và
  `analyzePreviewRafPhase` (loại mẫu justWoke, gap P50/P95/P99, số
  gap > 100 ms, tổng lost, predictedRate = 1 − lost/wall). Toán đã
  test trong 30 assertion §2.2.
- Điểm chèn đã đối chiếu trên cây hiện tại (ngày 01/11/2026,
  `preview.tsx` mtime 31/10 19:19, chưa bị luồng khác sửa trong
  buổi này): khai báo cạnh `idleDebug` (quanh dòng 1968–1975, trước
  `const loop`); đầu `loop`, NGAY TRƯỚC dòng clamp dòng ~1975
  (`const dt = Math.min(0.1, (now - last) / 1000);`), tính gap
  TRƯỚC khi `last = now;`; `wake()` set `justWoke = true` cạnh
  `last = performance.now();`; cleanup xóa `__vcutPreviewRaf` cạnh
  dòng xóa `__vcutPreviewIdle` (dòng ~2416). Chi tiết đầy đủ trong
  comment đầu file module (để đợt sau áp cơ học, không đoán lại).
- Vì sao chưa nối: luồng P2 cùng đợt đang sửa vùng seek trong
  `preview.tsx`; hook chèn cùng file lúc này có nguy cơ xung đột
  ghi đè, và task cho phép nhánh "chỉ làm phần đo ngoài preview"
  khi xung đột. Đợt sau (khi P2 chốt) áp theo comment trong module;
  sau khi nối, harness đọc `window.__vcutPreviewRaf.samples` theo
  chỉ số tại mỗi mark (fwd/rev-start/end) như mô tả trong module,
  và lúc đó số clamp mới là số thật của vòng lặp (thay cho cận
  dưới/cận trên của probe toàn cục N2).

## 4. Sự cố trong lượt (ghi đủ, không giấu)

1. **Build ESM cũ gây fail probe lần 1:** build-esm biên dịch
   trước fix 86 byte (§2.2) nên probe báo "không tìm thấy track
   video avc1" dù test Node đã pass (test dùng build-cjs đã build
   lại). Đã build lại ESM + copy vào scratch, probe lần 2 pass
   hoàn toàn. Bài học: mọi build (CJS/ESM) phải build lại sau mỗi
   lần sửa module, không dùng build cũ của module khác.
2. **Bundle dist đổi giữa chừng:** `B8uKpTK2` (01:30) →
   `Cqp7uur1` (lúc đo) do luồng khác build lại. May mắn: cả 6 lượt
   fps đều snapshot cùng `Cqp7uur1` nên so sánh trong đợt sạch.
3. **Loadavg gây hiểu lầm:** dense-1 load 7.47 nhưng rAF khỏe
   (P50 7.9 ms, xuôi 0.980) — loadavg 1 phút là trung bình trượt,
   không dùng một mình để kết luận "rảnh/tải". Phân loại lượt phải
   kèm tốc độ xuôi + gap rAF (§1.1).
4. **Không chạy vite build / vitest:** cố tình KHÔNG chạy vite
   build (dist là tài nguyên chia sẻ, build lại sẽ đổi bundle giữa
   chừng và phá phép đo của luồng khác); vitest không có trong
   checkout này (như O5 đã ghi) nên không tự cài dependency để
   chạy cho bằng được. Kiểm chứng thay thế: tsc `--strict` trên
   3 module mới (CJS + ESM đều pass), test Node 30/30, probe
   browser thật (demux + decode + present + flush). Tsc toàn app
   và vite build thuộc về bước gộp của parent khi cây đã ổn định.

## 5. File đổi/thêm (text, không binary — parent gộp batch)

- Mới: `apps/web/src/lib/mp4Demux.ts` (demux MP4 + planner cửa sổ).
- Mới: `apps/web/src/lib/reverseWebcodecs.ts` (ReverseFrameCache).
- Mới: `apps/web/src/lib/previewRafHook.ts` (hook đo rAF, chưa nối).
- Mới: `apps/web/scripts/probe-round32-p5-webcodecs-pipe.mjs`
  (harness probe WebCodecs; bản chạy thực tế ở scratch
  `~/workspace/tmp-round32-p5/wc/` — scratch ngoài repo, không
  stage; fixture `.mp4`/`.h264` chỉ nằm ở scratch).
- Mới: `apps/web/scripts/probe-round32-p5-page.js` (trang probe;
  cách dùng xem comment đầu file — cần copy về scratch cùng
  module ESM đã biên dịch).
- Mới: `docs/PHASE9_ROUND32_P5_REVERSE_WEBCODECS_LIMITS.md` (file này).
- Mới: `benchmarks/results/v32-p5-demux.json` (kết quả test Node
  30/30 + chi tiết demux 2 fixture).
- Mới: `benchmarks/results/v32-p5-reverse-sparse-1.json`,
  `v32-p5-reverse-sparse-2.json`, `v32-p5-reverse-sparse-3.json`,
  `v32-p5-reverse-dense-1.json`, `v32-p5-reverse-dense-2.json`,
  `v32-p5-reverse-dense-3.json` (JSON 6 lượt đo lặp, mỗi file ghi
  đủ load, gap rAF probe toàn cục, mẫu playhead/gray).
- Mới: `benchmarks/results/v32-p5-webcodecs.json` (JSON probe
  WebCodecs: support, demux, decode, present, decode-ahead,
  single-flush, noise).
- Không sửa: mọi code sản phẩm (`preview.tsx` — chỉ đọc,
  `seek.ts`, `store.ts`, ...), harness N2 (dùng nguyên vẹn),
  mọi file của luồng khác, paths-loop, build-loop-log. Dist trên
  đĩa không do luồng này build.

## 6. Nợ còn lại

1. **Đo lại fps ngược khi máy quiesced** (§1.4) để khóa có/không
   hồi quy so với N2/O5 — số P5 hiện tại chưa đủ kết luận.
2. **Nối hook rAF §3 vào `preview.tsx`** (sau khi P2 chốt) rồi đo
   lại clamp bằng số thật của vòng lặp, thay probe toàn cục N2.
3. **Nối `ReverseFrameCache` vào preview** (thay đường element-seek
   ở chiều ngược khi có cache, giữ fallback element-seek khi
   WebCodecs không hỗ trợ) — chỉ sau khi có (a) đo bộ nhớ
   VideoFrame thật, (b) hỗ trợ ctts/elst cho footage thật, (c) đo
   lại trên máy có GPU (hardware decode).
4. **Thiết kế cửa sổ decode-ahead cho footage nhiễu** (§2.4):
   prefetch 2 GOP hoặc cửa sổ lớn hơn — cần số đo bộ nhớ trước.
5. **Safari / máy thật / dpr > 1:** chưa đo cho cả đường cũ lẫn
   đường WebCodecs mới.
6. **Tách chi phí tạo decoder mỗi GOP** khỏi wall decode (§2.6),
   nhất là với GOP dày.
7. **Unit test reversePlayback trong môi trường có vitest** (nợ
   chung từ O5 §4.6, vẫn chưa chạy được ở đây).

## 7. Bổ sung đợt 33 — sửa tsc + quy kết nghi hồi quy của O5 (01/11/2026)

### 7.1 Sửa lỗi tsc trong file của P5 (ưu tiên 1) — ĐÃ SẠCH

- **P4 báo 6 lỗi ở `mp4Demux.ts` và `reverseWebcodecs.ts`.** Khi P5
  kiểm chứng lại bằng đúng config project
  (`tsc --noEmit -p apps/web/tsconfig.json`, có `noUnusedLocals` +
  `noUnusedParameters` mà lần biên dịch standalone trước đó của P5
  không bật), toàn project chỉ còn đúng **1 lỗi**: `mp4Demux.ts`
  TS6133 — tham số `view` của `findBox` không được dùng. 5 lỗi còn
  lại mà P4 thấy (3× `chunkBox` possibly null + 2× `e.message` ở
  `reverseWebcodecs.ts`) đã được P5 sửa trước đó trong đợt 32
  (xem §2.2/§4.1 của file này) — tức báo cáo của P4 dựa trên trạng
  thái file cũ hơn thời điểm P4 đo, không phải trạng thái hiện tại.
  Ghi rõ để parent khỏi đi sửa lại 5 lỗi đã hết.
- **Cách sửa lỗi còn lại:** bỏ tham số `view` khỏi `findBox`
  (đổi signature + 13 điểm gọi trong cùng file, bằng sed + đối
  chiếu grep từng dòng). Không đổi logic parse nào khác.
- **Kiểm chứng sau sửa:** `tsc --noEmit -p apps/web/tsconfig.json`
  exit 0, output rỗng — sạch toàn project tại thời điểm kiểm tra
  (07:22 và 07:28 UTC; luồng khác có thể làm bẩn lại sau đó, nhưng
  phần P5 sở hữu đã sạch). Test Node demux/hook chạy lại trên
  build CJS mới: **30/30 assertion pass** (không vỡ logic do
  refactor). File đổi duy nhất ở bước này: `mp4Demux.ts`
  (signature `findBox`).

### 7.2 O5 đã làm gì (đối chiếu, không nhận vơ)

O5 đợt 32 (file `docs/PHASE9_ROUND32_O5_REVERSE_WEBCODECS_LIMITS.md`,
**KHÔNG sửa code sản phẩm**): đo lặp fps ngược 3+3 lượt trên bundle
`index-D3yYXWHm.js` — thưa 3.83–5.86 (trung vị 4.55), dày 9.10–11.92
(trung vị 10.70) — thấp ~0.5× so với khoảng rảnh đợt 31 N2 (thưa
8.97; dày 18.42–24.05); kết luận "tín hiệu hồi quy mạnh ở mức bundle,
nguyên nhân chưa quy kết được" và để nợ: (a) diff bundle đợt 31 vs
đợt 32 ở đường seek/reverse, (b) đo lại 3+3 lượt trên bundle sạch
sau khi O3 chốt. O5 cũng làm spike WebCodecs (Annex B offline, chưa
demux), spec hook rAF (chưa áp dụng). P5 đợt 32 đã làm tiếp demux
thật + cache thật + hook module (§2–§3 trên); đợt 33 này chỉ làm
nốt đúng 2 nợ (a)(b) của O5, không đo lại y hệt O5 rồi claim mới.

### 7.3 Diff bundle: thay đổi cấu trúc DUY NHẤT ở đường seek là `seekElement`

Ba bundle còn nguyên trên đĩa (snapshot của harness, không phải
build lại): N2 đợt 31 `index-C0HfodWe.js` (979 512 byte),
O5 đợt 32 `index-D3yYXWHm.js` (984 096 byte), hiện tại
`index-Cqp7uur1.js` (987 615 byte). So sánh bằng marker còn sống
sau minify (chuỗi literal + tên hook đo + mẫu listener):

| Marker | N2 (đợt 31) | O5 (đợt 32) | Hiện tại |
|---|---|---|---|
| `reversePlayback` / `toggleReversePlayback` / `__vcutHoldStats` / `__vcutPreviewIdle` | 14 / 3 / 1 / 3 | 14 / 3 / 1 / 3 | 14 / 3 / 1 / 3 |
| `seeked` / `seeking` | 9 / 9 | 9 / 11 | 10 / 11 |
| `removeEventListener` gần `seeked` (O3 gỡ listener mồ côi) | 0 | 0 | **1** |

- **Đường phát ngược không đổi cấu trúc** giữa 3 bundle (mọi marker
  đếm được đều giống nhau) — không có bằng chứng code phát ngược
  bị sửa giữa N2 và O5.
- **`seekElement` đổi cấu trúc rõ rệt giữa N2 và O5** (trích nguyên
  hàm từ bundle, đã đối chiếu từng nhánh):
  - N2 — single-shot: pause → nếu đã đúng đích thì xong ngay; nếu
    không thì đặt timeout, gắn 1 listener `seeked` `{once:true}`,
    gán `currentTime = target`, và **trả về ngay ở sự kiện `seeked`
    đầu tiên** (kể cả khi element vẫn `seeking` hay chưa đúng đích
    — phần còn lại do vòng lặp preview xử lý ở tick sau, theo fix
    N1 đợt 31).
  - O5 — vòng lặp retry TRONG 1 lần gọi: ở mỗi sự kiện `seeked`
    lại kiểm tra `!e.seeking && đúng đích`; chưa đạt thì gắn lại
    listener + timeout và chờ `seeked` tiếp theo; chỉ gán
    `currentTime` khi `!e.seeking` (tức bước sau không chen ngang
    bước trước khi bước trước chưa settle). Hàm chỉ trả về khi
    element settle đúng đích hoặc hết timeout.
  - Hiện tại — **giữ nguyên vòng retry của O5**, cộng thêm
    `removeEventListener("seeked", handler)` trong hàm resolve
    (fix gỡ listener mồ côi của O3). Tức bundle O5 đo là bundle
    **giữa chừng của O3** (đã có retry-loop, chưa có gỡ listener);
    bundle hiện tại là O3 đã chốt. Vì ngữ nghĩa retry-loop giống
    nhau ở O5 và hiện tại, fix gỡ listener được kỳ vọng là trung
    tính với tốc độ (nó chỉ dọn listener chết) — và phép đo §7.4
    xác nhận điều này.
- **Cơ chế gây chậm (giả thuyết có cơ sở cấu trúc, chưa phải A/B
  chứng minh):** mỗi bước ngược đi qua `seekElement`; dạng retry
  khiến mỗi bước chờ tới khi settle thật thay vì trả về ở `seeked`
  đầu và để vòng lặp pipeline tiếp (với hold frame). Với GOP dày
  (decode nhanh, settle nhanh) chi phí nhỏ; với GOP thưa (Chrome
  giải mã dần về đích trong lúc `seeking=true` — O3 đã quan sát
  `currentTime` leo dần 1.43→2.9 trong lúc seeking) chi phí lớn.
  Đây cũng là **cái giá của sửa đúng**: dạng single-shot cũ đi kèm
  các bệnh mà N1/O3 đã sửa (seek không bao giờ xong, listener mồ
  côi tích lũy 93 cái/120 s, DARK-FIRST). Vì vậy **KHÔNG được
  revert `seekElement` về dạng N2 để lấy lại fps** — đường sửa đúng
  cho 30 fps ngược là WebCodecs (§2), không phải quay lại seek cũ.

### 7.4 Đo lại trên bundle hiện tại trong cửa sổ máy quiet — tách tải khỏi code

Cùng bundle với lượt P5 đợt 32 (`index-Cqp7uur1.js`), cùng harness
N2 nguyên vẹn, display `:92` / port `4192`, nhưng đo lúc máy quiet
(load 1 phút 0.95–1.68, tốc độ xuôi nội suy 1.001–1.010, rAF P50
~5–8 ms — so với lượt P5 đợt 32: load 2.85–8.74, nhiều lượt đói rAF).
Kết quả 6/6 PASS (phát ngược đúng, hold kích hoạt, không mẫu đen):

| Lượt | GOP | fps ngược quiet (đợt 33) | draw/hold | Xuôi | Load trước ngược |
|---|---|---|---|---|---|
| sparse-1 | thưa | **6.85** (94/13.73 s) | 94/597 | 1.005 | 1.16 |
| sparse-2 | thưa | **7.21** (99/13.73 s) | 99/604 | 1.008 | 1.38 |
| sparse-3 | thưa | **7.09** (98/13.82 s) | 98/591 | 1.010 | 1.22 |
| dense-1 | dày | **22.69** (313/13.80 s) | 313/530 | 1.001 | 0.81 |
| dense-2 | dày | **22.39** (309/13.80 s) | 309/520 | 1.007 | 1.31 |
| dense-3 | dày | **21.78** (300/13.77 s) | 300/506 | 1.004 | 1.08 |

So sánh 3 phiên trên cùng 1 trục (trung vị):

| GOP | P5 đợt 32 (tải song song) | O5 đợt 32 | Đợt 33 quiet (cùng bundle P5) | N2 đợt 31 rảnh |
|---|---|---|---|---|
| Thưa | 0.96–2.56, tv 2.00 | 3.83–5.86, tv 4.55 | **6.85–7.21, tv 7.09** | 8.97 (n=1) |
| Dày | 4.74–11.67, tv 7.67 | 9.10–11.92, tv 10.70 | **21.78–22.69, tv 22.39** | 18.42–24.05 (n=2) |

### 7.5 Kết luận quy kết (sửa lại kết luận §1.3 của O5)

1. **GOP dày: KHÔNG có hồi quy do code — kết luận cũ của O5 bị
   bác bỏ.** Trên cùng bundle mang vòng retry-loop, chỉ cần máy
   quiet là fps dày trở lại 21.78–22.69, nằm gọn trong khoảng rảnh
   của N2 (18.42–24.05). Mức 9.10–11.92 của O5 và 4.74–11.67 của P5
   đợt 32 đều là **tải song song** (các luồng khác chạy Chrome
   headed + build cùng lúc), không phải code chậm đi.
2. **GOP thưa: hồi phục phần lớn nhưng còn dư ~20% chưa quy kết
   chắc chắn.** Quiet cho 6.85–7.21 (tv 7.09) so với 1 điểm duy nhất
   8.97 của N2 (n=1, không có khoảng). Hai giả thuyết còn mở, chưa
   phân biệt được: (a) chi phí settle-wait của vòng retry-loop trên
   seek GOP thưa chậm (cơ chế §7.3 — phù hợp với việc dày không
   mất gì vì settle nhanh); (b) phương sai của chính điểm 8.97
   (dày đã có phương sai ±~25% ở N2; thưa chỉ đo 1 lượt rảnh nên
   khoảng thật chưa biết — 7.09 hoàn toàn có thể nằm trong khoảng
   đó). Muốn phân biệt phải làm A/B: cùng máy quiet, chỉ đổi
   `seekElement` giữa dạng single-shot và retry-loop (xem nợ mới
   dưới đây). Tới lúc đó, **không claim thưa hồi quy 20% do code**.
3. **Hệ quả thực tiễn:** (i) mọi phép đo fps ngược từ nay phải ghi
   rõ tải máy và chỉ so sánh khi cùng chế độ tải — số đo dưới tải
   song song không được dùng làm baseline hồi quy; (ii) không
   revert seek; (iii) 30 fps ngược vẫn cần đường WebCodecs (§2),
   và số quiet mới (dày 22.39, thưa 7.09) là baseline rảnh cập nhật
   cho đường element-seek cũ.
4. **O3 gỡ listener là trung tính với tốc độ** (bằng chứng: O5
   chưa có gỡ listener, hiện tại đã có, nhưng quiet cho dày = N2;
   nếu gỡ listener làm chậm thì dày đã không hồi phục hoàn toàn).

### 7.6 File đổi/thêm ở đợt 33 (cộng thêm vào §5, không ghi đè)

- Sửa: `apps/web/src/lib/mp4Demux.ts` (chỉ signature `findBox`,
  bỏ tham số `view` thừa + 13 điểm gọi; logic parse không đổi).
- Mới: `benchmarks/results/v33-p5-reverse-sparse-1.json`,
  `v33-p5-reverse-sparse-2.json`, `v33-p5-reverse-sparse-3.json`,
  `v33-p5-reverse-dense-1.json`, `v33-p5-reverse-dense-2.json`,
  `v33-p5-reverse-dense-3.json` (JSON 6 lượt quiet, cùng bundle
  `Cqp7uur1`, đủ load/gap rAF/mẫu playhead-gray).
- Mới: `benchmarks/results/v33-p5-bundle-diff.json` (marker +
  ngữ cảnh `seeked` của 3 bundle N2/O5/hiện tại — bằng chứng §7.3).
- Không sửa thêm: `reverseWebcodecs.ts`, `previewRafHook.ts`,
  `seek.ts`, `preview.tsx` (vẫn không đụng), mọi file luồng khác,
  paths-loop, build-loop-log. Không push, không tag/release, không
  binary. Harness N2 dùng nguyên vẹn; script đo lặp quiet chỉ nằm
  ở scratch (`~/workspace/tmp-round32-p5/run-fps-r33.sh`), không
  stage (nó chỉ là runner gọi harness N2 với display/port khác).

### 7.7 Nợ mới / nợ cập nhật (thay cho nợ 1 của §6)

1. **A/B `seekElement` để đóng dư thưa ~20%:** cùng máy quiet, đo
   3+3 lượt với 2 bundle chỉ khác dạng `seekElement`
   (single-shot N2 vs retry-loop hiện tại). Chỉ A/B này mới phân
   biệt được giả thuyết (a) và (b) ở §7.5.2. Việc này thuộc luồng
   sở hữu seek (P2/O3), không làm lén ở đây.
2. **Quy tắc đo fps ngược từ nay:** luôn ghi tải + tốc độ xuôi +
   gap rAF; cấm so sánh hồi quy giữa các phiên khác chế độ tải.
3. Các nợ còn lại của §6 giữ nguyên (nối hook rAF sau khi P2 chốt;
   nối cache vào preview sau khi có số bộ nhớ VideoFrame + ctts/
   elst + đo GPU; Safari/máy thật; tách chi phí tạo decoder;
   unit test trong môi trường có vitest).
