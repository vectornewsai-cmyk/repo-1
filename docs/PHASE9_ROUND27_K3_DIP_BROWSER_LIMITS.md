# Phase 9 đợt 27, luồng K3 — Pixel-test nhánh dip J3 trên browser thật

> Đóng nợ #3 của đợt 26 (LIMITS J3 §8.4): nhánh `drawVideoClipWithDip`
> trong `preview.tsx` (strip transition → offscreen → `getImageData` →
> composite `singleClipDipPixel` → `putImageData` → `drawImage`) trước
> đây chỉ được khóa bằng unit test + harness Node; luồng này là lần
> đầu tiên nó được pixel-test trên browser thật (Chromium headed dưới
> Xvfb, pipe CDP, theo mẫu harness đợt 26 J6 — không Playwright).
> Trung thực, không tô hồng: số xấu trên footage thật được giữ nguyên
> và phân tích tới cùng, không giấu sau nhãn.

## 0. Kết luận ngắn (không vượt số đo)

1. **Nhánh dip J3 KHỚP trên browser thật: 18/18 case chính KHỚP ở cả
   4 run sạch (run2–run5), 0 exception, resampled MAD = 0,000 ở mọi
   case chính.** Phẳng (đỏ/xanh lá/magenta/custom (199,99,49)) +
   gradient tĩnh từng pixel + sanity không-transition đều KHỚP theo
   thang V6 (MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8). Đường dây component
   của J3 — dipMode routing, alpha theo cửa sổ vào/ra, strip
   transition, offscreen composite, phạm vi pixel — nay đã có bằng
   chứng browser thật, không còn là nợ.
2. **KHÔNG sửa code sản phẩm nào trong luồng này.** Không phát hiện
   lỗi wiring rõ ràng nào: mọi case chính đều KHỚP, và dư số duy
   nhất (footage thật, §5) đã được chứng minh thuộc về nguồn frame
   video chung của preview (tồn tại cả khi không có transition, không
   có dip), không phải nhánh dip. Sửa video sync để săn dư số đó là
   việc ngoài phạm vi luồng này và có thể đụng code của luồng khác.
3. **Footage thật K (clip-k-dod-iwo.mp4, SHA khớp J3) — KHÔNG KHỚP,
   và đó KHÔNG phải lỗi dip:** fadewhite vào XẤP XỈ (MAD 1,972 /
   resampled 1,167; ≤8 = 93,70% / 97,65%), fadegrays ra LỆCH (MAD
   6,612 / resampled 4,186; ≤8 = 76,97% / 84,78%). Nhưng sanity cùng
   footage KHÔNG transition cũng LỆCH tương tự (MAD 6,962 /
   resampled 5,583; ≤8 = 76,63% / 78,51%) — tức baseline
   preview-vs-control trên footage động này đã lệch sẵn chừng đó,
   dip không làm tệ thêm (fadegrays ra resampled 4,186 còn tốt hơn
   sanity 5,583; fadewhite vào đúng tỷ lệ suy giảm theo alpha
   0,3466). Xem §5 để biết những giả thuyết đã bị loại trừ (proxy,
   fit, lệch thời gian ±0,5s) và cái còn mở.
4. **Perf browser thật (cận trên longtask, §6):** frame dip luôn sinh
   1 longtask, frame thường không bao giờ (12/12 probe); longtask dip
   50–118ms ở các run yên tĩnh, 216–323ms ở run3 khi VM tải nặng do
   các luồng song song build lại dist. Cùng họ với ước lượng Node của
   J3 (trắng ~51ms, xám ~74ms ở cùng số pixel) — nhưng cấm trích
   thành "vòng lặp dip tốn đúng X ms", vì longtask gồm cả seek /
   decode / rAF.

## 1. Harness và phương pháp đo (đọc trước khi tranh luận về số)

- Harness mới: `apps/web/scripts/clicktest-dip-browser-pipe.mjs`
  (pipe CDP + snapshot dist + seed qua autosave + scrub ruler thật +
  video control độc lập; display :98, cổng 4198 — tránh đụng :96 /
  :97 của các harness trước; snapshot gate: bundle phải chứa
  `dipMode`, nếu dist cũ hơn J3 thì dừng chứ không đo nhầm đường
  đen cũ).
- Bundle đo ở run cuối (run5): `index-mIzUrd00.js`,
  sha256[:16] = `ae6342b5876a41c0`. Lưu ý: mỗi run snapshot một
  bundle khác nhau (run1 `Cz3iL36M`, run2 `z7wG6h2H`, run3–run5
  `mIzUrd00`) vì các luồng đợt 27 song song build lại dist — hành
  vi dip ổn định qua cả 3 bundle, không phải artefact của một bản
  build.
- Seed chính (meta 1280×720, fps 30, 1 track, 5 clip): đỏ [0,4) ra
  fadewhite 1s; xanh lá [4,8) vào fadewhite 1s + ra fadegrays 1s;
  magenta [8,12) vào fadegrays 1s; custom (199,99,49) [12,16) ra
  fadegrays 1s; gradient tĩnh [16,20) vào fadewhite 1s + ra
  fadegrays 1s. Tại một thời điểm trong cửa sổ transition chỉ có
  đúng 1 clip được vẽ nên frame canvas chính là đầu ra nhánh dip
  đơn clip — đúng đối tượng J3 cần khóa.
- Playhead: store snap về frame 30fps nên p tính từ playhead dự
  đoán theo tọa độ click (x phát đi nguyên + rulerLeft đo lại sau
  click) là chính xác tới 1 frame; mọi case run2–run5 đều rơi đúng
  frame mục tiêu, không còn cờ lệch (xem §7 về 2 bẫy đo đã sửa ở
  run1).
- Pixel kỳ vọng KHÔNG lấy từ màu danh nghĩa: video control độc lập
  (cùng file, qua static server) seek tới cùng source time, vẽ
  contain-fit lên canvas riêng, rồi áp chính công thức
  `singleClipDipPixel` + trọng số `fadeDipWeights` (cài lại trong
  harness từ code app). Nhờ control mà sai số roundtrip codec
  (yuv420p — ví dụ đỏ danh nghĩa (255,0,0) giải mã thực tế thành
  (255,24,0)) không lọt vào verdict. Lưu ý trung thực: công thức là
  model chung đã khóa bởi unit test J3; cái browser-test này khóa
  là đường dây wiring dùng model đó (routing/alpha/offscreen), và
  control pixel là độc lập — không phải là chứng minh lại công
  thức trọng số.
- Hai cách so: (a) point-sampled: pixel device tại vị trí project
  tương ứng so với pixel gốc; (b) resampled: control đi qua đúng
  chuỗi của app (dip trên canvas project → resample dưới viewport
  transform) rồi so device 1:1. Cách (b) cho MAD = 0,000 ở mọi case
  chính — tức với nội dung trơn, chuỗi resample của harness tái tạo
  đúng từng bit pixel của app, nên (b) là thước đo sạch cho wiring.
- Verdict theo thang V6 của dự án: KHỚP = MAD ≤ 2 VÀ ≥ 99% ≤ 8;
  XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8; còn lại LỆCH.

## 2. Số đo chính: 18/18 KHỚP (run5 — run2/run3/run4 cho cùng kết quả)

| Case | Cửa sổ / p | alpha | MAD | ≤8 | Resampled MAD / ≤8 | Verdict |
|---|---|---|---|---|---|---|
| S1 sanity đỏ giữa clip | — | 1 | 0,000 | 100% | 0,000 / 100% | KHỚP |
| S2 sanity xanh lá giữa clip | — | 1 | 0,000 | 100% | 0,000 / 100% | KHỚP |
| FW-OUT đỏ | ra / 0,0333 | 0,8859 | 0,156 | 100% | 0,000 / 100% | KHỚP |
| FW-OUT đỏ | ra / 0,1000 | 0,4491 | 0,245 | 100% | 0,000 / 100% | KHỚP |
| FW-OUT đỏ | ra / 0,5000 | 0 | 0,000 | 100% | 0,000 / 100% | KHỚP |
| FW-IN xanh lá | vào / 0,1000 | 0 | 0,000 | 100% | 0,000 / 100% | KHỚP |
| FW-IN xanh lá | vào / 0,5000 | 0,3466 | 0,392 | 100% | 0,000 / 100% | KHỚP |
| FW-IN xanh lá | vào / 0,7333 | 0,7056 | 0,340 | 100% | 0,000 / 100% | KHỚP |
| FW-IN xanh lá | vào / 0,9333 | 0,9396 | 0,347 | 100% | 0,000 / 100% | KHỚP |
| FG-OUT xanh lá | ra / 0,1000 | 0,4491 | 0,047 | 100% | 0,000 / 100% | KHỚP |
| FG-OUT xanh lá | ra / 0,5000 | 0 | 0,333 | 100% | 0,000 / 100% | KHỚP |
| FG-IN magenta | vào / 0,1000 | 0 | 0,333 | 100% | 0,000 / 100% | KHỚP |
| FG-IN magenta | vào / 0,5000 | 0,3466 | 0,333 | 100% | 0,000 / 100% | KHỚP |
| FG-OUT custom | ra / 0,1000 | 0,4491 | 0,171 | 100% | 0,000 / 100% | KHỚP |
| FG-OUT custom | ra / 0,5000 | 0 | 0,333 | 100% | 0,000 / 100% | KHỚP |
| GRAD-FW-IN | vào / 0,1000 | 0 | 0,000 | 100% | 0,000 / 100% | KHỚP |
| GRAD-FW-IN | vào / 0,5000 | 0,3466 | 0,313 | 100% | 0,000 / 100% | KHỚP |
| GRAD-FG-OUT | ra / 0,5000 | 0 | 0,388 | 100% | 0,000 / 100% | KHỚP |

Đọc số đúng cách:

- Các ô alpha = 0 (ra p ≥ ~0,2, vào p ≤ ~0,12) là cửa ải mạnh
  nhất cho nhánh dip: đầu ra phải là dip thuần (trắng 255 hoặc xám
  theo pixel). Đường đen cũ sẽ cho đen (0) ở các ô này — mọi ô đều
  ra đúng dip, nên nhánh dip chắc chắn đang chạy trên browser, không
  phải fallback về đường vẽ thường.
- Các ô alpha giữa (0,3466 / 0,4491 / 0,7056 / 0,9396) khóa alpha
  theo cửa sổ: cùng một clip xanh lá, vào cho alpha = bAlpha còn ra
  cho alpha = aAlpha — nếu routing nhầm cửa sổ thì MAD sẽ lệch hàng
  chục mức, không thể KHỚP.
- Gradient tĩnh khóa dip xám từng pixel trên nội dung biến thiên
  liên tục (R theo x, G theo y, B theo đường chéo): FG-OUT p = 0,5
  cho xám thuần từng pixel với MAD point-sampled 0,388 và resampled
  0,000 — tức `singleClipDipPixel` mode gray chạy đúng trên browser
  với mọi giá trị xám, không chỉ hằng số phẳng.
- Point-sampled MAD > 0 ở các ô giữa (0,047–0,392) trong khi
  resampled = 0,000: đó là sai số lấy mẫu điểm trên ảnh đã resample
  (canvas 1352×633, viewport scale 0,879), không phải sai số wiring
  — chứng minh bằng chính cột resampled.
- 0 `Runtime.exceptionThrown` trong cả phiên run5 (và các run
  trước).

## 3. Perf vòng lặp dip trên browser (cận trên, không phải số thuần)

Probe: `PerformanceObserver` longtask quanh scrub tới frame dip
(FW-IN p = 0,5) vs frame thường (giữa clip), 3 lần mỗi loại mỗi run.

| Run | Dip longtask (ms) | Plain longtask |
|---|---|---|
| run2 | 50, 60, 51 | không có (3/3) |
| run3 (VM tải nặng) | 323, 264, 216 | không có (3/3) |
| run4 | 55, 73, 65 | không có (3/3) |
| run5 | 97, 118, 50 | không có (3/3) |

Kết luận được phép rút: frame dip LUÔN sinh 1 longtask (≥ 50ms),
frame thường KHÔNG BAO GIỜ — chi phí trội thuộc về frame dip (vòng
ImageData toàn khung + seek/decode trong cùng task). Con số tuyệt
đối phụ thuộc tải VM (run3 cao gấp ~4× vì các luồng song song đang
build), nên chỉ báo khoảng 50–118ms ở điều kiện yên tĩnh, cùng họ
với ước lượng Node của J3 (trắng ~51ms, xám ~74ms ở cùng 921.600
pixel, 1280×720). Longtask là cận trên (gồm seek/decode/rAF), cấm
trích thành "vòng lặp dip tốn đúng X ms". Chưa đo: 1080p/4K trên
browser, và thời gian thuần của vòng lặp (cần instrument code app,
ngoài phạm vi luồng này).

## 4. Footage thật K — số đo và quy kết (phần trung thực nhất)

Footage: `clip-k-dod-iwo.mp4` (Internet Archive, DoD; license
publicdomain qua API metadata của chính IA:
`https://creativecommons.org/publicdomain/mark/1.0/`; SHA256 khớp
đúng J3 `49f33b83…`; ffprobe: h264, **1080×1920, 23,976fps** —
lưu ý: J3 ghi "720×1280" là kích thước đo, còn file gốc là
1080×1920; và fps thật là 23,976 chứ không phải 30, xem §5.3).
Seed riêng: 1 clip K [0,4) vào fadewhite 1s + ra fadegrays 1s, project
1280×720 (clip dọc → pillarbox contain ở giữa). Không proxy (bridge
không chạy, badge PROXY ẩn, toast "Bridge không chạy … proxy tự
động thất bại" — xem §5.1).

| Case | alpha | MAD point / ≤8 | MAD resampled / ≤8 | Verdict |
|---|---|---|---|---|
| REAL-FW-IN K p = 0,5 | 0,3466 | 1,972 / 93,70% | 1,167 / 97,65% | XẤP XỈ |
| REAL-FG-OUT K p = 0,5 | 0 | 6,612 / 76,97% | 4,186 / 84,78% | LỆCH |
| REAL-SANITY K giữa clip, KHÔNG transition | 1 | 6,962 / 76,63% | 5,583 / 78,51% | LỆCH |

Quy kết (theo thứ tự bằng chứng):

1. **Không phải lỗi dip:** sanity không-transition lệch tương tự
   (thậm chí resampled tệ hơn fadegrays ra: 5,583 so với 4,186).
   Nếu nhánh dip có lỗi thì sanity phải KHỚP còn dip lệch — ngược
   lại hoàn toàn. Dư số nằm ở tầng nguồn frame video của preview
   (frame app khác frame control ở mức chi tiết), dip chỉ kế thừa
   nó: fadewhite vào đúng tỷ lệ suy giảm theo alpha (dư số clip
   × 0,3466 ≈ 2,29 lý thuyết so với 1,97 đo được — cùng họ số; phần
   trắng dip là giống hệt nhau ở hai phía nên không góp dư số).
2. **Không phải lệch thời gian nhỏ:** quét control sourceT ±15
   frame lưới 30fps (±0,5s, ≈ ±12 frame nguồn 23,976fps) không cứu
   được case nào — offset tốt nhất vẫn là −1 frame lưới (tức cùng
   1 frame nguồn, xem §5.3) với MAD y hệt offset 0. Frame app khớp
   control tốt nhất đúng tại thời gian danh nghĩa, nên không phải
   app seek lệch vài frame.
3. **Không phải proxy, không phải fit:** proxy đã loại trừ (§5.1);
   app dùng `letterboxFit` contain (min scale) giống hệt control
   (`previewEngine.ts`), không phải cover-crop.
4. **Còn mở:** cơ chế chi tiết của dư số nguồn frame (decode hai
   video element khác nhau? J4 hold-frame giữ frame cũ? sai số
   resample kép trên nội dung chi tiết?) chưa xác định được và
   KHÔNG được sửa trong luồng này — nó thuộc về tầng video sync
   chung của preview, ảnh hưởng mọi clip động chứ không riêng dip.
   Luồng follow-up cần: (a) so frame app vs control trên cùng K ở
   nhiều thời điểm và fps gốc để tách "frame khác" khỏi "cùng frame
   khác pixel"; (b) đọc `currentTime` thật của video element app
   (MediaPool detached, cần hook đo) thay vì suy đoán.

Hệ quả cho badge: kết quả này KHÔNG hạ badge matched của
fadewhite/fadegrays (chuẩn badge của dự án đã ghi ở J3 §7: model
cặp + projection đơn clip; browser-test nay khóa thêm wiring của
projection đó). Nhưng nó đặt giới hạn mới: trên footage động chi
tiết, frame preview của app vốn đã lệch control ~4–6 MAD resampled
ngay cả không có dip — bất kỳ claim "preview khớp render/control"
nào trên footage động cũng phải trừ baseline này trước.

## 5. Các giả thuyết đã kiểm tra và loại trừ

### 5.1 Proxy — LOẠI TRỪ (bằng chứng trực tiếp)

Nghi ngờ ban đầu: file K 45,8MB, MediaBin có auto-proxy; nếu app
dùng bản proxy 720p thì frame sẽ khác gốc. Đo thực tế sau import:
badge `.preview-proxy-badge` ẩn (`display: none`, text rỗng),
`.media-proxy` báo "Proxy lỗi, thử lại", toast "Bridge không chạy
(http://127.0.0.1:8787) — proxy tự động thất bại". Kết luận: app
dùng file gốc, không có proxy trong các phiên đo.

### 5.2 Fit cover vs contain — LOẠI TRỪ (đọc code)

Nghi ngờ: app crop (cover) còn control contain. Đọc code:
`drawVideoClip` dùng `letterboxFit` (min scale, contain) và comment
ghi rõ "Trước đây preview dùng cover-fit (crop) → sai khác với bản
render" — app và control cùng contain, cùng pillar 405×720. Không
phải nguyên nhân.

### 5.3 fps nguồn 23,976 vs lưới đo 30fps — GIẢI THÍCH search, KHÔNG giải thích dư số

K là 24000/1001 ≈ 23,976fps (frame dài 0,041708s). Hệ quả đo được:
control seek tới 3,4667 và 3,5 cho MAD y hệt tới từng chữ số thập
phân (6,612340823970038) vì cả hai rơi vào cùng 1 frame nguồn
[3,4618, 3,5035); tương tự 0,4667 và 0,5 cùng frame [0,4588, 0,5005).
Vì vậy search ±15 frame lưới 30fps chỉ quét ~±12 frame nguồn và
không có bước nào cho MAD tốt hơn offset 0 — search này đủ mạnh
để loại trừ "lệch vài frame", nhưng không đủ để khẳng định "đúng
frame nguồn" ở mức dưới 1 frame nguồn. Luồng sau đo footage động
nên quét theo lưới fps gốc của file, không theo 30fps.

### 5.4 Khung tối do seek chưa tới — BẪY ĐO, đã có guard (run3, run4)

Run3: FG-OUT K cho appMean = (10,12,16) đúng màu nền khung
`#0a0c10` — canvas chỉ có nền, clip chưa được vẽ, nhưng
settlePreview (hash ổn định 2 lần cách 600ms) vẫn "ổn định" vì
canvas tĩnh. Nguyên nhân: video 45MB chưa seek xong mà canvas đã
đứng yên ở nền. Run4: guard khung tối phát hiện và scrub lại
(lệch 1 frame rồi quay lại để ép seek mới — scrub cùng target
không đổi playhead nên không kích seek mới, bài học từ sanity
run4). Run5 không gặp khung tối. Guard này nay nằm trong harness
vĩnh viễn: appMean ~ nền khung trong khi kỳ vọng xa nền → retry 1
lần, vẫn tối → gắn cờ `measurementInvalid`, không tính là lỗi app.
Sanity run4 bị gắn cờ đúng theo cơ chế này (sau đó run5 đo được
thật, MAD 6,962 — tức run4 không phải "app không vẽ được K").

## 6. Chưa đo / giới hạn (không mạo nhận)

- **Chưa đo:** 1080p/4K trên browser; sweep p dày trên footage thật
  (mới p = 0,5); clip ngắn cả 2 cửa sổ cùng active (dip theo cửa sổ
  vào, alpha tích — J3 mới lập luận, chưa đo cả ở Node lẫn browser);
  tổ hợp dip + motion blur / SR / track / mask trên browser; Safari /
  máy thật / dpr > 1 / viewport khác (toàn bộ đo là Chromium headed
  dưới Xvfb, raster phần mềm, dpr = 1, canvas 1352×633).
- **Chưa xác định:** cơ chế dư số nguồn frame trên footage động
  (§4.4) — follow-up riêng, không thuộc luồng này.
- **Giới hạn của thước đo:** kỳ vọng dùng control video element
  (cùng trình duyệt, cùng decoder) chứ không phải frame render
  FFmpeg; vì vậy số này khóa wiring preview-vs-preview, không thay
  thế số J3 (preview model vs render xfade). Hai bộ số bổ sung nhau,
  không thay thế nhau.
- **Bundle trôi:** các luồng đợt 27 song song build lại dist nên
  bundle snapshot đổi giữa các run (§1); harness snapshot đầu mỗi
  run là thứ pin bản đo. Nếu chạy lại harness sau khi dist đổi, số
  bundle trong JSON sẽ khác — đó là hành vi đúng, không phải lỗi.

## 7. Bài học harness (để luồng sau khỏi vấp lại)

1. **Run1: case p = 0,9667 thoái hóa.** Target 4,9667 bị snap ra mép
   cửa sổ thành playhead 5,0 (p = 1,0, alpha = 1): nhánh dip không
   chạy, case thành sanity trá hình nhưng vẫn "PASS". Run2 đổi sang
   4,9333 (p = 0,9333, alpha = 0,9396) và KHỚP thật. Quy tắc: case
   dip phải có alpha < 1 một cách rõ ràng (p cách mép ≥ 1 frame),
   và harness phải từ chối case có alpha = 1 thay vì tính PASS.
   (Run1 đã bị ghi đè bởi run5; số run1 giữ ở đây để khỏi ai tưởng
   p = 0,9667 từng được khóa.)
2. **Run1: click width 1 làm playhead lệch +1 frame hệ thống.**
   `clickRect` lấy tâm rect nên click tại `wantX + 0,5px`; với
   60px/s thì 0,5px ≈ 0,0083s, đủ đẩy snap sang frame kế ở nhiều
   target. Run2 dùng width 0 (tọa độ phát đi = round(wantX)) và mọi
   playhead rơi đúng frame mục tiêu. Playhead trong báo cáo luôn là
   playhead DỰ ĐOÁN từ tọa độ phát đi, không phải target gõ vào —
   và MAD KHỚP ở p đó chứng minh dự đoán đúng.
3. **Vạch `.tl-playhead-handle` lệch −6,50px so với gốc ruler**
   (tâm handle, đo lúc playhead = 0, ổn định qua mọi run). Run1 chưa
   hiệu chuẩn nên mọi case bị gắn cờ "vạch lệch −3 frame" giả.
   Run2 trở đi hiệu chuẩn offset lúc playhead = 0 rồi trừ đi; sau
   hiệu chuẩn không còn cờ nào. Vạch chỉ là đối chiếu phụ — playhead
   dự đoán từ click + MAD KHỚP mới là bằng chứng chính.
4. **Check license IA phải đọc `metadata.licenseurl`, không phải
   trường top-level.** Run1 từ chối footage vì đọc nhầm trường rỗng;
   run2 sửa và license publicdomain được xác nhận, SHA khớp mới tải.
5. **Settle bằng hash ổn định là chưa đủ cho video lớn** (§5.4):
   canvas nền tĩnh cũng "ổn định". Cần thêm guard nội dung (ở đây:
   guard khung tối + retry ép seek mới).

## 8. Kiểm chứng và file đổi/thêm

- `node --check apps/web/scripts/clicktest-dip-browser-pipe.mjs`:
  pass (sau mọi lần sửa). File `.mjs` nằm ngoài `include: ["src"]`
  của `apps/web/tsconfig.json` nên không thuộc diện tsc — đúng quy
  ước, không cần thêm exclude.
- Harness exit = 0 ở run2–run5 (18/18 case chính KHỚP; case footage
  thật không gating exit vì đã xác định dư số thuộc baseline, xem
  §4 — nếu parent muốn gating chặt hơn thì đổi 1 dòng ở `main`,
  không đổi số đo).
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (video đo + snapshot dist chỉ
  ở `~/workspace/tmp-round27-k3/`, đã dọn cuối luồng; file K tải về
  cũng chỉ nằm ở scratch đó trước khi dọn — kiểm chứng lại bằng
  `ls` trước khi báo cáo). KHÔNG tự ghi file paths-loop, KHÔNG ghi
  build-loop-log (parent lo, theo tiền lệ J3/J6).

File đổi/thêm (text, không binary — parent gộp batch):

- Mới: `apps/web/scripts/clicktest-dip-browser-pipe.mjs` — harness
  browser-test K3 (pipe CDP + snapshot dist + seed qua autosave +
  scrub ruler thật + video control độc lập + đo point-sampled và
  resampled + probe longtask + phiên footage thật + guard khung
  tối; cổng 4198, display :98).
- Mới: `docs/PHASE9_ROUND27_K3_DIP_BROWSER_LIMITS.md` — file này.
- Mới: `benchmarks/results/v27-k3-canvas-dip-browser.json` — kết
  quả run5 (18 case chính + 3 case footage thật + proxy diag +
  perf + exceptions + log đầy đủ; các run trước bị ghi đè, số run
  trước giữ trong LIMITS này).

Không sửa code sản phẩm (không file `src/` nào đổi trong luồng
này) — đúng kết luận §0.2.
