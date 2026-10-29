# Phase 9 đợt 15 — Luồng T5: đo parity ở điều kiện nặng/thật hơn (LIMITS)

> Ngày: 2026-10-28. Luồng đo T5 trong đợt lớn round 15 (chủ đề đóng nợ
> đo đợt 14 §3: dissolve 1080p/yuv420p/footage thật; circle 4K/footage
> thật; ghost HD/1080p/FPS khi blend).
> KHÔNG push, KHÔNG tag/release, KHÔNG binary, KHÔNG dist,
> KHÔNG sửa code sản phẩm, KHÔNG sửa `previewStatus.ts`/badge —
> chỉ đo + script đo + tài liệu này. Mọi đề xuất badge ở §6 chỉ là
> đề xuất, parent quyết.

## 0. Kết luận ngắn (đọc đoạn này là đủ)

Thang matched giữ nguyên V6/V11/V12: **MATCHED ⇔ MAD ≤ 2 và
≥ 99% pixel có lệch kênh tối đa ≤ 8**. "Dưới ngưỡng" = trượt
ít nhất một trong hai tiêu chí.

| Nhóm | Mô hình (rgb) | Đầu ra thật của product | Kết luận |
|---|---|---|---|
| Dissolve 1080p | MATCHED mọi p, phẳng + tự nhiên (MAD ≤ 0,0073) | **TỤT HẠNG, thảm hại**: e2e MAD 71,21 (phẳng) / 47,57 (tự nhiên), le8 < 3% | Mô hình frand đúng tuyệt đối; pattern nhiễu từng pixel KHÔNG THỂ sống qua đầu ra yuv420p — giới hạn của định dạng đầu ra, không phải lỗi preview |
| Circle 4K | MATCHED mọi p, phẳng + tự nhiên, open + close (MAD ≤ 0,49, le8 100%) | Phẳng MATCHED (1,34 / 100%); tự nhiên cực đoan DƯỚI NGƯỠNG (le8 94–96%) | Mô hình smoothstep + tâm cắt nguyên đứng vững ở 4K; phần tụt là giới hạn chung của yuv420p trên nội dung chi tiết cực đoan, không phải lỗi mô hình circle |
| Ghost 1080p | MATCHED cả yuv lẫn rgb (MAD 0,054 / 0,006) | tmix render 28,6 ms/frame ≈ 34,9 fps (FFmpeg, chưa encode) | Blend preview = tmix thật, đúng thứ tự weights, không trễ frame; FPS canvas trình duyệt VẪN CHƯA ĐO (nợ còn lại, xem §7) |

Phát hiện phương pháp quan trọng nhất đợt này (§5): **xfade của
FFmpeg 8.1.2 chỉ hỗ trợ format 444/gray, không có yuv420p** — mọi
cell "yuv" cũ (đặt `format=yuv420p` trước xfade) thực chất chạy
xfade ở yuv444p do FFmpeg tự nâng (auto_scale). Vì vậy tài liệu
này phân biệt 3 điều kiện, đừng gộp: `rgb` (xfade ở rgb24),
`yuv-in` (đầu vào qua yuv420p, xfade ở 444), `e2e` (ép yuv420p
SAU xfade — đúng bước đầu ra của product). Cell x264 cộng thêm
encoder lên trên e2e.

## 1. Phương pháp đo (tái tạo được)

- **Script:** `server/render/src/test_v15_hd_measure.mjs` (MỚI).
  Chạy từ gốc repo (để alias `@repo-1/video-spec` resolve như probe
  ghost đợt 12):
  `node --experimental-strip-types server/render/src/test_v15_hd_measure.mjs [--only dissolve|circle|ghost|e2e] [--ps 0.25,0.5,0.75]`
  Exit 0 khi mọi cell render xong (kể cả cell dưới ngưỡng).
- **Timeline chung mọi cell transition:** fps 30, duration 0.4,
  offset 1 (như V13): frame đích F = 30 + round(p·12) → p =
  0.25/0.5/0.75 ứng với F = 33/36/39; frame 29 = thuần A,
  frame 42 = thuần B.
- **Preview lấy từ CODE THẬT, không copy công thức:**
  `describeTransition` + `radialGradientWeight`
  (`transitionPreview.ts`), `ffmpegDissolveFrand`
  (`dissolveFrand.ts`), `motionBlurBlendPlan` (`previewEngine.ts`),
  `buildXfadeFilter` (`transitions.js`).
- **Nguồn:** A = `testsrc2` (động), B = `mandelbrot` (động, fractal)
  qua lavfi — KHÔNG tải footage có bản quyền. "Footage giống thật"
  ở đây nghĩa là nội dung biến thiên không gian (không phải màu
  phẳng), vì hình học dissolve/circle chỉ phụ thuộc nội dung không
  gian. Nguồn phẳng đỏ/xanh giữ làm baseline. Lưu ý trung thực:
  mandelbrot là trường hợp cực đoan (chi tiết fractal ở mọi pixel,
  khắc nghiệt hơn footage máy quay vốn bị low-pass quang học);
  testsrc2 gần nội dung broadcast hơn và qua yuv420p nguyên vẹn
  (xem đối chứng §4). Vì vậy các số "tự nhiên" dưới đây là cận
  xấu nhất (worst-case), không phải dự báo cho footage thường.
- **Giá trị phẳng thật:** probe qua đúng chuỗi format cho
  A = (253,0,0), B = (0,0,254) cả rgb lẫn yuv (sàn làm tròn yuv
  của lavfi `color`, như đợt 13 C6 đã ghi).
- **Kiểm chứng ánh xạ frame (validation):** dissolve và circle
  đều cho frame 29 vs A29 và frame 42 vs B12 = **MAD 0,0000,
  le8 100,000%** — ánh xạ frame và đường format được tin cậy,
  các số dưới đây không phải do ghép sai frame.
- **Máy đo:** CPU AMD EPYC 9D64, 2 vCPU; RAM 7,7 GiB; FFmpeg 8.1.2;
  **không GPU** (`nvidia-smi` không có; mọi encode/render đều CPU).
  Render 4K mandelbrot ~522 ms/frame nên tổng lượt đo ~15 phút,
  chủ yếu là sinh nguồn, không phải đo.

## 2. Dissolve — 1920×1080

### 2.1 Bảng số (MAD / le8)

| Điều kiện | p=0,25 | p=0,5 | p=0,75 |
|---|---|---|---|
| rgb / phẳng | 0,0064 / 99,996% MATCHED | 0,0073 / 99,996% MATCHED | 0,0062 / 99,996% MATCHED |
| rgb / tự nhiên | 0,0049 / 99,996% MATCHED | 0,0056 / 99,996% MATCHED | 0,0048 / 99,996% MATCHED |
| yuv-in / phẳng | 0,3397 / 99,996% MATCHED | 0,3407 / 99,996% MATCHED | 0,3395 / 99,996% MATCHED |
| yuv-in / tự nhiên | 1,4429 / 96,165% DƯỚI NGƯỠNG | 1,5656 / 96,140% DƯỚI NGƯỠNG | 1,6999 / 96,065% DƯỚI NGƯỠNG |
| **e2e / phẳng (p=0,5)** | — | **71,2122 / 1,827% DƯỚI NGƯỠNG** | — |
| **e2e / tự nhiên (p=0,5)** | — | **47,5679 / 2,872% DƯỚI NGƯỠNG** | — |
| x264 crf20/medium = mặc định product (p=0,5) | — | phẳng 71,4665 / 1,023%; tự nhiên 49,2336 / 0,815% DƯỚI NGƯỠNG | — |
| x264 crf23/veryfast / phẳng (p=0,5) | — | 72,4113 / 0,573% DƯỚI NGƯỠNG | — |
| x264 crf0/lossless / phẳng (p=0,5, chẩn đoán) | — | 71,2122 / 1,827% DƯỚI NGƯỠNG | — |

### 2.2 Đọc kết quả — mô hình đúng, đầu ra không giữ được pattern

1. **Mô hình frand đúng tuyệt đối ở 1080p + nội dung tự nhiên.**
   rgb/natural MAD ≤ 0,0056 ở mọi p — tốt hơn cả rgb/phẳng ở
   320×180 đợt 14 (≤ 0,0089). Kích thước tăng không làm tăng pixel
   lệch hiếm một cách đáng kể (le8 99,996% ≈ 80 pixel/2M pixel
   lệch > 8, đúng dạng pixel sinf hiếm đợt 14 đã ghi). Chi phí
   raster frand 1080p đo trong lượt này: 168–809 ms/frame Node
   (dao động do tải máy; cùng bậc với ~158 ms đợt 14 ghi).
2. **yuv-in / tự nhiên tụt le8 (~96%) nhưng KHÔNG phải lỗi
   dissolve.** Đối chứng §4: mandelbrot đi qua yuv420p một mình
   (không transition) đã cho le8 93,655% ở 1080p; testsrc2 một
   mình cho 100%. Cell yuv-in là hỗn hợp ~50/50 hai nguồn nên
   le8 ~96% đúng như kỳ vọng từ đối chứng — tức tổn thất nằm ở
   đầu vào (chi tiết chroma fractal bị subsampling), không phải
   ở hình học dissolve.
3. **e2e mới là điều kiện quyết định — và nó thảm hại ngay cả
   với nguồn phẳng.** Chuỗi e2e: đầu vào yuv420p → xfade (tự nâng
   lên 444) → ÉP yuv420p sau xfade → rgb24. Với nguồn phẳng,
   MAD 71,21 và chỉ 1,83% pixel còn trong ngưỡng: pattern nhị
   phân từng pixel đã bị phá nát hoàn toàn. Vì nguồn phẳng
   không có chi tiết chroma nào để mất ở đầu vào, toàn bộ tổn
   thất này nằm ở đúng một bước: chuyển 444→420 sau xfade.
   Cơ chế: một khối 2×2 chia sẻ một mẫu chroma; khi 4 pixel
   trong khối thuộc 2 phía A/B khác nhau, chroma chung ép mọi
   pixel về màu trung gian — pattern ngẫu nhiên từng pixel là
   trường hợp xấu nhất có thể của subsampling.
4. **Encoder được minh oan hoàn toàn.** x264 crf0 (lossless) cho
   đúng từng chữ số với e2e không qua encoder (71,2122 /
   1,827%); crf20/medium (mặc định product) cho 71,4665 — tức
   encoder chỉ cộng thêm ~0,25 MAD. Chẩn đoán căn frame: frame
   giải mã phân loại 49,97% xanh (đúng p=0,5 yêu cầu) và gần
   preview p=0,5 nhất trong 3 ứng viên p — căn frame đúng, pixel
   mẫu là màu trung gian (vd 94,0,111; 136,20,153) chứ không
   phải đỏ/xanh thuần. Tăng chất lượng encode không cứu được:
   crf20 ≈ crf23 ≈ crf0 ≈ 71–72. Đây là giới hạn cấu trúc của
   đầu ra yuv420p, không phải vấn đề tuning.
5. **Kết luận dissolve: TỤT HẠNG ở điều kiện đầu ra thật.**
   Nhãn "matched" của dissolve chỉ còn đúng ở mức mô hình
   xfade (rgb). Bất kỳ dissolve nào xuất qua pipeline thật
   (yuv420p) cũng mất pattern — người xem so preview với file
   xuất sẽ thấy khác biệt lớn. Không có cách sửa ở phía preview
   (mô hình đã đúng tuyệt đối) và không có cách sửa ở phía
   encode (lossless cũng thua). Hướng duy nhất để giữ pattern
   là đầu ra 444 — ngoài phạm vi pipeline hiện tại và không
   được đề xuất ở đây (parent quyết nếu muốn theo).

## 3. Circle (open/close) — 3840×2160

### 3.1 Bảng số (MAD / le8; mọi ô rgb đều le8 100%)

| Điều kiện | p=0,25 | p=0,5 | p=0,75 |
|---|---|---|---|
| rgb / phẳng / open | 0,0383 MATCHED | 0,3334 MATCHED | 0,0684 MATCHED |
| rgb / phẳng / close | 0,0684 MATCHED | 0,3333 MATCHED | 0,0383 MATCHED |
| rgb / tự nhiên / open | 0,0483 MATCHED | 0,4938 MATCHED | 0,0997 MATCHED |
| rgb / tự nhiên / close | 0,1054 MATCHED | 0,4865 MATCHED | 0,0592 MATCHED |
| yuv-in / phẳng / open | 0,3782 / 100% MATCHED | 0,7628 / 100% MATCHED | 0,3771 / 100% MATCHED |
| yuv-in / tự nhiên / open | 1,2364 / 96,634% DƯỚI NGƯỠNG | 2,1448 / 94,811% DƯỚI NGƯỠNG | 1,6361 / 97,087% DƯỚI NGƯỠNG |
| **e2e / tự nhiên / open** | 0,6421 / 96,460% DƯỚI NGƯỠNG | 2,9683 / 94,264% DƯỚI NGƯỠNG | 2,4846 / 96,209% DƯỚI NGƯỠNG |
| **e2e / phẳng / open (p=0,5)** | — | 1,3443 / 100% MATCHED | — |
| **e2e / tự nhiên / close (p=0,5)** | — | 2,1965 / 96,301% DƯỚI NGƯỠNG | — |

Gương thời gian giữ đúng ở 4K: close(p) ≈ open(1−p) từng ô
(vd open p=0,25 MAD 0,0383 = close p=0,75 MAD 0,0383) — khớp
kiểm chứng gương đợt 14 R4.

### 3.2 Đọc kết quả — mô hình đứng vững ở 4K, tụt e2e chỉ trên nội dung cực đoan

1. **Mô hình smoothstep + tâm cắt nguyên đứng vững ở 4K.**
   rgb/natural cả open lẫn close đều MATCHED với le8 100% ở
   mọi p, MAD tối đa 0,49 — tốt hơn nhiều so với ngưỡng 2.
   Đây là bằng chứng mạnh nhất từ trước tới nay cho circle:
   8,3M pixel/frame, nội dung tự nhiên, vẫn khớp tới sàn làm
   tròn. Quy tắc tâm cắt nguyên không lộ thêm vấn đề ở kích
   thước chẵn 4K (đúng như đợt 14 dự báo: chỉ kích thước lẻ
   mới phân biệt được).
2. **e2e / phẳng vẫn MATCHED (1,34 / 100%) — đối lập hoàn toàn
   với dissolve.** Vì blend circle trơn tru theo bán kính, các
   pixel kề nhau gần giống nhau nên chia sẻ chroma 2×2 không
   gây hại. Cặp đối lập dissolve-phẳng (71,21) vs circle-phẳng
   (1,34) cùng một bước chuyển 444→420 là bằng chứng sạch nhất
   cho cơ chế §2.2: mức độ phá hoại tỉ lệ với độ "ngẫu nhiên
   từng pixel" của pattern, không phải với transition nói chung.
3. **e2e / tự nhiên tụt le8 (94–96%) nhưng KHÔNG phải lỗi
   mô hình circle.** Đối chứng §4: mandelbrot một mình qua
   yuv420p đã ở le8 95,299% ở 4K — tức ngay cả một clip phẳng
   không transition cũng trượt ngưỡng trên nội dung này. Cell
   e2e cộng thêm một lần chuyển 420 nữa ở đầu ra nên le8
   94–96% là đúng kỳ vọng từ đối chứng. Phần tụt này là giới
   hạn chung của yuv420p trên chi tiết chroma cực đoan, và vì
   mandelbrot khắc nghiệt hơn footage máy quay thật, con số
   này là cận xấu nhất — với nội dung broadcast/testsrc2-like,
   e2e vẫn đứng (yuv-in testsrc2 một mình = 100%).
4. **Kết luận circle: GIỮ matched ở mức mô hình; ghi rõ giới
   hạn e2e.** Khác dissolve (tụt mọi nội dung), circle chỉ tụt
   trên nội dung chi tiết cực đoan ở đầu ra yuv420p, còn với
   nội dung thường và nguồn phẳng thì e2e vẫn MATCHED. Đề xuất
   badge ở §6 phản ánh đúng sự khác biệt này.

## 4. Đối chứng yuv420p thuần (không transition) — chìa khóa phân bổ nguyên nhân

| Nguồn (frame 36, một mình qua yuv420p→rgb24) | 1080p | 4K |
|---|---|---|
| testsrc2 | MAD 0,0000 / le8 100,000% | MAD 0,0000 / le8 100,000% |
| mandelbrot | MAD 2,9828 / le8 93,655% | MAD 2,5357 / le8 95,299% |

Đọc: testsrc2 qua yuv420p nguyên vẹn tuyệt đối (màu của nó
thân thiện với subsampling); mandelbrot mất ~5–6% pixel > 8
chỉ vì chi tiết chroma fractal. Mọi cell yuv-in/e2e tự nhiên
trượt le8 đều nằm trong khoảng mà đối chứng này dự báo —
không cell nào cần giả thuyết "mô hình transition sai" để
giải thích. Đây là lý do §2/§3 kết luận "mô hình đúng, giới
hạn nằm ở định dạng đầu ra" thay vì "transition tụt hạng".

## 5. Phát hiện phương pháp: xfade chỉ chạy ở 444 (đọc kỹ trước khi dùng lại số "yuv")

Bằng chứng debug FFmpeg 8.1.2 (lệnh `format=yuv420p` trước
xfade, xem log debug): `Parsed_xfade formats = yuva444p /
yuv444p / gbrp / …` — **không có yuv420p**. FFmpeg tự chèn
`auto_scale` nâng đầu vào lên yuv444p trước xfade. Hệ quả:

- Mọi cell mang nhãn "yuv" trong script này đã được đổi tên
  thành **"yuv-in"**: chúng đo "đầu vào qua yuv420p + xfade ở
  444", KHÔNG phải "xfade chạy ở yuv420p". Đừng trích dẫn
  chúng như số đầu ra product.
- Điều kiện đầu ra thật là **e2e** (ép `format=yuv420p` SAU
  xfade) và **x264** (encoder yuv420p sau e2e). render.js cũng
  chịu cùng hành vi này (clip chuẩn hoá về yuv420p ở bước 1,
  xfade merge, rồi outFormat yuv420p ở đầu ra) — nên cell e2e/
  x264 ở đây tái tạo đúng pipeline product, không phải thiết
  lập nhân tạo.
- Cell "yuv" của các đợt trước (nếu đặt format trước xfade)
  cần đọc lại với cùng lưu ý này; các số rgb thì không ảnh
  hưởng (xfade ở rgb24 là đường đã đo từ V11/V12).
- Ngược lại, **tmix (ghost) CHẠY ĐƯỢC ở yuv420p thật**: debug
  cho thấy không có auto_scale nào trước tmix, chỉ có scale
  yuv420p→rgb24 sau tmix để bắt frame. Cell ghost "yuv" dưới
  đây là yuv420p thật, không cần đổi nhãn.

## 6. Ghost — 1080p/720p + FPS khi blend

### 6.1 Parity blend preview vs tmix thật

- Cấu hình: frames=3, weights **bất đối xứng** [0,2, 0,3, 0,5]
  (cũ→mới theo preview) — cố ý bất đối xứng để lộ được cả khả
  năng tmix hiểu thứ tự ngược. Nguồn động testsrc2.
- Kết quả tốt nhất (ma trận đầy đủ trong log):

| Điều kiện | Best alignment | MAD / le8 |
|---|---|---|
| 1080p, tmix trên yuv420p | winEnd=46 / tmixOut=46 | 0,0535 / 99,850% MATCHED |
| 1080p, tmix trên rgb24 | winEnd=46 / tmixOut=46 | 0,0057 / 100% MATCHED |
| 720p, tmix trên yuv420p | winEnd=46 / tmixOut=46 | 0,0583 / 99,840% MATCHED |
| 720p, tmix trên rgb24 | winEnd=46 / tmixOut=46 | 0,0064 / 100% MATCHED |

- **Alignment là đường chéo (winEnd == tmixOut):** tmix output
  k = trung bình có trọng số của đúng các frame k−2, k−1, k —
  không trễ frame, không lệch cửa sổ. Các ô lệch đường chéo
  trong ma trận đều MAD ≥ 1,93 (rõ ràng tệ hơn), nên alignment
  không phải do chọn mò.
- **Thứ tự weights đúng:** với weights bất đối xứng mà MAD
  vẫn 0,054/0,006 thì tmix hiểu weights[0] = frame cũ nhất
  đúng như preview (`motionBlurBlendPlan`); nhánh chẩn đoán
  weights-đảo của script không cần chạy (chỉ chạy khi MAD > 2).
  Đây là lần đầu thứ tự weights được chứng minh bằng số đo
  (đợt 12 T1 chỉ chứng minh bằng công thức + probe pixel).
- **Signal ghost lộ rõ ở HD:** blend khác frame hiện tại trung
  bình 1,927/đơn vị kênh, 6,52% pixel lệch > 8 trên nguồn động
  testsrc2 (chuyển động vừa phải — với vật chuyển động nhanh
  hơn, signal sẽ lớn hơn; chưa đo).
- **Kết luận ghost: GIỮ nguyên trạng thái tốt ở HD.** Blend
  preview khớp tmix thật ở cả 1080p lẫn 720p, cả yuv lẫn rgb.
  Khác dissolve/circle, ghost không chịu tổn thất e2e lớn vì
  trung bình thời gian làm mượt chi tiết chroma trước khi qua
  subsampling (yuv MAD chỉ 0,054 so với rgb 0,006).

### 6.2 FPS khi blend — đọc kỹ phạm vi của từng con số

| Phép đo | Kết quả | Phạm vi đúng |
|---|---|---|
| Render tmix thật 1080p (FFmpeg, format yuv420p, chưa encode) | **28,6 ms/frame ≈ 34,9 fps** (90 frame) | Tốc độ render-side; máy đo 2 vCPU, không GPU |
| Toán blend Node (per-pixel JS trên buffer, dùng đúng `motionBlurBlendPlan`) | 1080p: median **180 ms/frame ≈ 5,56 fps**; 720p: median **78 ms/frame ≈ 12,82 fps** (5 lần lặp) | **KHÔNG PHẢI FPS canvas trình duyệt.** Đường vẽ thật của product dùng `drawImage` (tăng tốc GPU), không lặp từng pixel bằng JS — con số này chỉ là trần dưới cho một cài đặt JS thuần, không được dùng để kết luận preview chậm |
| FPS canvas trình duyệt thật khi bật ghost | **CHƯA ĐO** | Nợ còn lại (§7): cần click-test/CDP trên trình duyệt thật, do parent/main-chat sắp xếp (subagent không có browser) |

## 7. Đề xuất badge — PARENT QUYẾT, luồng này KHÔNG đổi gì

- **Dissolve:** đề xuất GIỮ `matched` nhưng BỔ SUNG giới hạn
  phạm vi vào chú thích `previewStatus.ts` (không đổi tập hợp
  nếu parent đồng ý): "matched ở mức mô hình xfade (rgb24,
  MAD ≤ 0,0073 ở 1080p); đầu ra thật qua yuv420p không giữ
  được pattern nhiễu từng pixel (e2e MAD 71,21 ngay cả
  lossless) — đây là giới hạn của định dạng đầu ra, không
  phải lỗi preview". Phương án thay thế nếu parent đọc badge
  như "đầu ra cuối cùng": chuyển dissolve sang `approx` kèm
  cùng chú thích. Luồng này khuyến nghị phương án 1 (giữ
  matched + ghi rõ phạm vi), vì hạ badge sẽ đổ lỗi sai cho
  mô hình preview vốn đã đúng tuyệt đối.
- **Circleopen/circleclose:** đề xuất GIỮ `matched` + bổ sung
  chú thích phạm vi: "matched ở 4K rgb (MAD ≤ 0,49, le8 100%)
  và e2e nguồn phẳng (1,34 / 100%); e2e trên nội dung chi tiết
  cực đoan (mandelbrot) tụt le8 về 94–96% do giới hạn chung
  của yuv420p, không phải lỗi mô hình".
- **Ghost:** không có badge transition cho ghost (đây là effect
  motion blur, không phải transition) nên không đề xuất đổi
  nhãn nào; chỉ ghi nhận blend đã khớp tmix ở HD.

## 8. Chưa xong / nợ còn lại (trung thực)

- FPS canvas trình duyệt thật khi bật ghost (1080p) chưa đo —
  con số Node 180 ms/frame KHÔNG thay thế được; cần click-test
  trên browser thật.
- Dissolve 16-bit chưa đo (nợ từ đợt 14, vẫn còn): frand giống
  nhau nhưng ngưỡng trên thang 16-bit, preview 8-bit không
  phân biệt — chưa có số.
- Circle e2e chỉ đo close ở p=0,5 tự nhiên (open đo đủ 3 p);
  phần còn lại dựa vào gương thời gian đã chứng minh đợt 14
  (close(p) = open(1−p) tới sàn lượng tử hoá) — không phải số
  đo trực tiếp cho close p=0,25/0,75 e2e.
- Ghost chỉ đo frames=3, weights [0,2, 0,3, 0,5], một nguồn động
  (testsrc2); chưa quét frames 2..8, chưa đo weights đều hay
  vật chuyển động nhanh, chưa đo clip dài, chưa đo mask/SR
  (đường vẽ mask/SR dùng cùng plan blend nhưng chưa có số
  riêng ở HD).
- "Footage giống thật" ở đây là lavfi tổng hợp (testsrc2/
  mandelbrot), không phải footage máy quay thật có nhiễu cảm
  biến; mandelbrot là cận xấu nhất, testsrc2 là cận lành nhất
  — footage thật nằm giữa hai cận này, chưa xác định vị trí
  chính xác.
- Cell yuv-in của đợt này (và mọi cell "yuv trước xfade" của
  đợt trước) phải được đọc lại theo §5 — chúng không phải số
  đầu ra product.
- Số đo chỉ có giá trị với FFmpeg 8.1.2 trên máy đo nêu ở §1;
  FFmpeg đổi hành vi P/format negotiation ở bản sau thì phải
  đo lại (đặc biệt phép dịch P của đợt 14 R1 và format 444
  của xfade).

## 9. File đã đổi/thêm (đường dẫn tương đối trong repo)

Stage (KHÔNG push — parent gộp batch round 15):

- `server/render/src/test_v15_hd_measure.mjs` (MỚI — script đo
  V15: dissolve + circle + ghost + e2e, chạy bằng
  `node --experimental-strip-types` từ gốc repo)
- `docs/PHASE9_ROUND15_T5_HD_MEASURE_LIMITS.md` (MỚI — chính
  file này)

KHÔNG đưa vào stage (chỉ để trên đĩa, ghi tên để đối chiếu):
- `benchmarks/results/v15-t5-hd-measure.log` (lượt đo chính:
  dissolve + circle + ghost, exit 0, DONE v15)
- `benchmarks/results/v15-t5-e2e.log` (lượt đo e2e: dissolve +
  circle post-xfade 420, exit 0)
- Các file /tmp trong lúc chẩn đoán (`/tmp/diag-*.mjs`,
  `/tmp/diss-yuv.raw`, `/tmp/diss-*.mp4`, `/tmp/smoke15.mjs`)
  đã xoá hoặc chỉ nằm ở /tmp, không thuộc repo.

Lệnh đo đã chạy + kết quả từng cái (tóm tắt; bảng đầy đủ ở
§2/§3/§6, log đầy đủ ở 2 file trên):
- Smoke `--only dissolve --ps 0.5`: đã lộ sớm yuv-in/natural
  tụt le8 (96,140%) và x264 lệch lớn — dẫn tới chẩn đoán căn
  frame + crf0 + đối chứng yuv (xem §2.2/§4).
- Lượt chính `--only all` (mặc định, ps 0.25/0.5/0.75): DONE,
  0 lỗi render — toàn bộ số §2 (trừ e2e/x264), §3 (trừ e2e),
  §6.
- Lượt e2e `--only e2e`: DONE, 0 lỗi render — toàn bộ số e2e
  §2/§3.
- Chẩn đoán riêng (không nằm trong script chính, chỉ để kiểm
  chứng nhân quả, đã ghi kết quả vào §2/§4/§5):
  phân loại B% frame giải mã x264 (49,97% xanh, đúng p=0,5);
  x264 crf0 (71,2122, khớp đúng e2e); đối chứng yuv thuần
  (testsrc2 100%, mandelbrot 93,7–95,3%); debug format xfade
  (chỉ 444/gray) và tmix (chạy được yuv420p thật).

Không sửa file sản phẩm nào. Không đổi badge. Không tạo file
binary nào trong repo. Không push, không tag/release.
