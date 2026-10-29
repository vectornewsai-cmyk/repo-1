# Phase 9 đợt 19, luồng G6 — Harness miền YUV + residuals — LIMITS (trung thực)

> Đợt 19, luồng G6. Repo làm việc: `~/workspace/repo-1`,
> KHÔNG push GitHub, KHÔNG release/tag, KHÔNG code giả.
> FFmpeg đo: 8.1.2. Máy đo: VM này (số chỉ đúng máy này).
> **KHÔNG sửa code sản phẩm web/render/store/spec, KHÔNG sửa file
> i18n, KHÔNG sửa script đo của G4, KHÔNG sửa script footage của
> G5, KHÔNG đổi ngưỡng, KHÔNG đổi logic sản phẩm để vừa số đo.**
> Chỉ sửa: harness dùng chung + 3 harness parity + 2 script đo mới
> + file LIMITS này. Không stage, không push — parent sẽ stage.

## 1. Việc đã làm (3 mảng, đúng lệnh giao)

### (a) Mode đo miền YUV qua FFmpeg vào module dùng chung

`server/render/src/harnessShared.js` thêm (logic raster/preview cũ
nguyên vẹn, không đổi 1 dòng ngữ nghĩa nào):

- `yuv420PaddedDims(w, h)` — kích thước chẵn tương ứng (khung lẻ
  pad 1 pixel mép phải/dưới).
- `ffmpegRgbToYuv420(rgb, w, h, workDir, tag)` — RGB24 -> yuv420p
  bằng ĐÚNG bộ chuyển swscale của FFmpeg (lệnh rawvideo, filter
  `pad=ceil(iw/2)*2:ceil(ih/2)*2:0:0:black,format=yuv420p`), trả về
  `{ yuv, w, h }` với w/h ĐÃ pad. Khung chẵn thì pad là no-op.
  Đây là mode đo (b) của đợt 18, nay là code dùng chung duy nhất —
  v18 giữ helper cục bộ `rgbToYuvFfmpeg` của nó (không đụng v18),
  nhưng mọi đo mới từ đợt này trở đi dùng helper chung.
- `ffmpegYuvToRgb420(yuv, w, h, workDir, tag)` — chiều ngược,
  phục vụ kiểm tra subsample-only kiểu S2 của đợt 18.
- `ffmpegYuvCompare(previewRgb, renderRgb, w, h, workDir, tag)` —
  cả 2 phía qua CÙNG bộ chuyển FFmpeg rồi `yuv420Mad` (kiểu S5b
  của đợt 18). Trả về đúng object `yuv420Mad`.
- `classifyYuvRef(m)` / `formatYuvMad(m)` — phân loại + chuỗi in
  MAD miền YUV, cùng dạng với `fmtYUV` của v18.

V11/V12/V14 gắn cờ `--yuv` (mặc định TẮT):

- V11: phần A (25 case transition) in thêm dòng `[YUV-FFmpeg]`.
- V12: phần A (12 case) + A2 V3 (14 case) in thêm dòng
  `[YUV-FFmpeg]`.
- V14: phần T (13 case transition) in thêm dòng `[YUV-FFmpeg]`.
- Dòng YUV KHÔNG tính vào FAIL/KẾT/counts, KHÔNG đổi bất kỳ dòng
  nào khác. Phần B (text) và C/E (effect) chưa nối mode này trong
  đợt này — helper dùng chung đã sẵn, để đợt sau nếu cần (xem §7).

### (c) Hợp nhất `rasterizeTextPreview` (làm trước, vì là tiền đề sạch)

Đã đối chiếu từng ký tự thân hàm `sampleBilinear` +
`rasterizeTextPreview` của V11 (dòng 387–439) và V12 (dòng
414–466): **giống hệt nhau (1964 ký tự, diff = 0)** — chỉ khác
tiêu đề section đứng sau hàm. Cả 2 đã dời nguyên văn về
`harnessShared.js` (bản duy nhất); V11/V12 nay chỉ `require`
(`rasterizeTextPreview` đã có sẵn trong require line, nay thêm
`ffmpegYuvCompare, formatYuvMad`). Không còn định nghĩa cục bộ
nào của 2 hàm này trong V11/V12 (grep còn 0, chỉ còn call site
phần B và comment trỏ về module chung). V14 không có hàm text
nên không đụng.

### (b) Truy nguyên pixelate tới cùng (xem §6 — kết luận: KHÔNG sửa
code, vì không phải lỗi sản phẩm; khóa bằng probe thay vì sửa)

Script mới `server/render/src/test_v19_pixelate_probe.js` (dùng
module THẬT `effectCanvas.ts` qua tsc như V12/V14, không copy mô
hình) + script mới `server/render/src/test_v19_harness_yuv_shared.js`
(xem §3).

## 2. Kiểm chứng trước/sau (kiểu đợt 17: log giống hệt nhau)

Chạy mặc định (không cờ) TRƯỚC và SAU khi sửa, diff sau khi lược
thời gian render (ms) và tên thư mục tmp:

| Harness | Trước | Sau (mặc định) | KẾT sau |
|---|---|---|---|
| V11 | 29 case, FAIL 0 | **giống hệt** | 29 case, FAIL (LỆCH): không có; lỗi render: 0 |
| V12 | 37 case, FAIL 0 | **giống hệt** | 37 case, FAIL: không có; PENDING V3: không có; lỗi render: 0 |
| V14 | KHỚP 21, XẤP XỈ 1, LỆCH 0 | **giống hệt** | KHỚP 21, XẤP XỈ 1, LỆCH 0, PENDING 0, STAT-APPROX 1, STRUCT-OK 1, STAT-LỆCH 0; lỗi render: 0 |

Chạy `--yuv` rồi lược bỏ các dòng `[YUV-FFmpeg]` + ms/tmp →
**cũng giống hệt log mặc định** ở cả 3 harness: mode YUV chỉ
THÊM dòng đo, không đổi bất kỳ kết luận RGB nào.

`node --check` xanh cả 6 file JS (harnessShared, V11, V12, V14,
v19-shared, v19-pixelate-probe). Không chạy tsc/vite build: luồng
này không sửa code TS nguồn web hay code sản phẩm nào — không có
gì để tsc/build kiểm chứng thêm; không mạo nhận. Không chạy
click-test browser thật (nợ mở chung của repo).

## 3. Kết quả mode YUV dùng chung

### 3.1. V11/V12/V14 `--yuv`: cùng mode, cùng kết luận

Mọi dòng YUV đều KHỚP (V6-tham-chiếu), đúng tier với dòng RGB
cùng case (toàn bộ case transition của 3 harness vốn đã KHỚP ở
miền RGB). Số đo YUV:

| Harness | Số dòng YUV | Tier |
|---|---|---|
| V11 `--yuv` | 25 (toàn bộ phần A) | 25 KHỚP |
| V12 `--yuv` | 26 (12 A + 14 A2) | 26 KHỚP |
| V14 `--yuv` | 13 (toàn bộ phần T) | 13 KHỚP |

Đối chiếu chéo 12 case chung cả 3 harness — số giống hệt nhau tới
4 chữ số thập phân, KHÔNG có case nào lệch nhau:

| Case | V11 | V12 | V14 |
|---|---|---|---|
| fade | 0,0217 | 0,0217 | 0,0217 |
| wipeleft | 0,0000 | 0,0000 | 0,0000 |
| slideright | 0,0000 | 0,0000 | 0,0000 |
| circleopen | 0,1922 | 0,1922 | 0,1922 |
| diamondclose | 0,0000 | 0,0000 | 0,0000 |
| squareopen | 0,0000 | 0,0000 | 0,0000 |
| dissolve | 0,0000 | 0,0000 | 0,0000 |
| bars-fade | 0,0105 | 0,0105 | 0,0105 |
| blinds-h | 0,0000 | 0,0000 | 0,0000 |
| plus | 0,0000 | 0,0000 | 0,0000 |
| checker | 0,0000 | 0,0000 | 0,0000 |
| grid | 0,0000 | 0,0000 | 0,0000 |

Riêng V11/V12 còn có (không có ở V14): circleclose 0,1667;
squareclose / checker-alt / blinds-diag / split-h / split-v /
barn-h / barn-v / corners / clock-ccw đều 0,0000; rings 0,0238;
star 0,2518; spiral 0,0238 — tất cả KHỚP. Đây là lần đầu 3 harness
chạy CÙNG một mode đo YUV từ CÙNG một code dùng chung và cho
cùng kết luận — đúng yêu cầu (a).

### 3.2. Script v19-shared: tái tạo đúng số v18 + đóng khoảng trống S5

Chạy `node src/test_v19_harness_yuv_shared.js` (từ `server/render/`,
~17 giây, exit 0). Nguồn clip1/clip2, khung 1280x720, frame 45,
p=0,5 — đúng thiết lập v18:

| Ô | dissolve (v18 -> v19-shared) | circleopen (v18 -> v19-shared) |
|---|---|---|
| V0b helper-vs-JS (frame clip1@1.5) | 0,0597 (Y 0,0005 / U 0,2759 / V 0,0805) -> **0,0597 giống hệt** | (chung 1 frame kiểm chứng) |
| V0a/V0c helper xác định + khung lẻ | 2 lần -> byte giống hệt; 72x45 -> pad 72x46, len 4968, tự so MAD 0 | (như dissolve) |
| S1 (a) rgb24-ép-trước, so RGB | 0,0057 KHỚP -> **0,0057** | 0,3820 KHỚP -> **0,3820** |
| S5b-shared e2e crf18, so YUV (pipe qua helper chung) | 2,8985 XẤP XỈ -> **2,8985** (Y 2,9825 / U 2,6657 / V 2,7956; ≤8 96,72%) | 0,4291 KHỚP -> **0,4291** (Y 0,3870 / U 0,4991 / V 0,5278; ≤8 99,90%) |
| **P5b-shared (MỚI): e2e crf18, so YUV (preview qua helper chung)** | **2,9014 XẤP XỈ** (Y 2,9851 / U 2,6700 / V 2,7978; ≤8 96,72%) | **0,5138 KHỚP** (Y 0,5037 / U 0,5053 / V 0,5624; ≤8 99,90%) |
| S2-shared subsample-only (pipe->yuv->rgb, KHÔNG encode) | 57,7793 LỆCH -> **57,7793** | 1,4866 KHỚP -> **1,4866** |

Đọc kết quả:

- Helper dùng chung tái tạo đúng số v18 tới 4 chữ số thập phân ở
  mọi ô đối chứng (V0b, S1, S5b, S2) — chứng tỏ helper chung thay
  thế được helper cục bộ của v18 mà không đổi kết luận nào.
- **P5b là số mới, đóng lại khoảng trống S5-vs-S5b của v18:**
  preview-vs-e2e trong miền YUV, phía preview qua FFmpeg (không
  qua hàm JS), cho dissolve **XẤP XỈ 2,9014** — gần hệt S5b
  (2,8985, chênh 0,0029) và KHÁC HẲN số cũ qua hàm JS (S5 dissolve
  LỆCH 4,3437). Circleopen P5b 0,5138 KHỚP (S5b 0,4291, chênh
  0,0847 — đúng mức chênh preview-vs-pipe ở S1 là 0,3820 RGB).
  Kết luận vận hành từ đợt này: **mọi số YUV chính thức cho
  dissolve phải lấy qua helper FFmpeg dùng chung; hàm JS
  `rgbToYuv420` chỉ còn là đối chứng nhanh cho nội dung mịn**
  (đúng cảnh báo §4 của v18, nay đã có code thay thế).

## 4. Giới hạn của mode YUV dùng chung (trung thực)

- **Pad loãng MAD ở khung lẻ:** 72x45 -> 72x46 thêm 108 mẫu
  giống hệt nhau trên tổng 4968 (2,2%). Cả 2 phía pad giống nhau
  nên tier không đổi trong các case đã đo (toàn KHỚP, cách xa
  ngưỡng), nhưng với case nào sát ngưỡng thì phải tính tới độ
  loãng này khi đọc số — không tự ý trừ pad ra khỏi mẫu số.
- **Thang V6-tham-chiếu không phải chuẩn badge:** mọi số YUV
  trong §3 đều in kèm nhãn V6-tham-chiếu; không dùng chúng để
  sửa file badge/previewStatus (ngoài phạm vi luồng này).
- **Phạm vi `--yuv`:** chỉ phần transition (V11 A, V12 A+A2, V14
  T). Phần text (320x180, chẵn — helper chạy được ngay) và effect
  chưa nối; nếu đợt sau nối thì chỉ cần thêm vài dòng theo đúng
  mẫu đã có, không cần sửa helper.
- **Không đo lại v17/v18:** 2 script cũ không sửa, số của chúng
  được dùng làm kỳ vọng đối chứng (§3.2), không chạy lại toàn bộ
  (v17 chỉ chạy lại để xác nhận pixelate, xem §6).
- Số chỉ đúng với FFmpeg 8.1.2 trên máy này; swscale khác phiên
  bản có thể cho số khác ở chữ số cuối (đặc biệt các case
  0,0000/0,1922 phụ thuộc làm tròn chuyển đổi).

## 5. Hợp nhất text — bằng chứng (bổ sung §1c)

- Thân hàm `sampleBilinear` + `rasterizeTextPreview` V11 vs V12:
  diff = 0 (1964 ký tự). Call site phần B ở cả 2 file giữ nguyên
  (`rasterizeTextPreview(vis, baseInfo.base, baseInfo.bbox.cx,
  baseInfo.bbox.cy, TW, TH)`), chỉ đổi nơi định nghĩa.
- Log trước/sau giống hệt nhau (§2) — bằng chứng bằng số đo,
  không chỉ đọc code.
- Sau đợt này, các hàm raster dùng chung CHỈ còn 1 bản trong
  `harnessShared.js`: `rasterizeTransitionPreview`,
  `rasterizeTextPreview` (+ `sampleBilinear` phụ trợ),
  `barsFadeIsBar`, `radialWeight`, `regionCovers`,
  `layerPixelAlpha`, `layerCovers`, `pointInPolygon`.
- Còn riêng lẻ (cố tình không đụng, như đợt 17 đã ghi):
  `solidFrame`, `writeRaw`, `renderTransition*`, `transpileTs`,
  `loadTransitionPreview` và phần main mỗi harness — đó là logic
  riêng của harness, không phải bản sao của nhau.

## 6. Pixelate: truy nguyên tới cùng — kết luận KHÔNG SỬA CODE

### 6.1. Số cần giải thích

- V17: pixelate t=0,43 k=8 trên nguồn X 1280x720: **MAD 0,1293,
  ≤8: 99,80%, KHỚP** (chạy lại đợt này trên frame tái sinh:
  đúng 0,1293).
- V12: pixelate k=6 (72x48) và k=13 (78x39): **MAD 0,6667,
  ≤8: 100,00%, KHỚP**. V14: pixelate k=9 (72x45): **MAD 0,6667,
  ≤8: 100,00%, KHỚP**.
- Cả 2 đều KHỚP tier, nhưng đều khác 0 — và 0,6667 đúng bằng
  2/3 thì không thể là ngẫu nhiên. Truy nguyên dưới đây dùng
  filter render đúng `effects.js` và mô hình canvas THẬT
  (`effectCanvas.ts` qua tsc), KHÔNG dùng bản copy mô hình
  (bản copy chỉ dùng ở probe thăm dò ban đầu, đã đối chiếu với
  module thật trước khi kết luận).

### 6.2. Chuỗi bằng chứng (mỗi bước đều có số đo)

**Bước 1 — Vị trí lấy mẫu của FFmpeg KHỚP canvas.**
Xung đơn điểm trắng trên nền đen, downscale k=6: chỉ xung tại
(3,3) sống sót tới dst(0,0); xung tại (2,2), (0,0), (5,5), (4,4),
(8,9) biến mất. Ramp R=x cho đúng dãy mẫu 3,9,15,21,... Pattern
vị trí (R=x, G=y, B=128) qua full-chain: **MAD = 0** ở mọi k đã
thử (6/8/9/13). Kết luận: FFmpeg lấy đúng offset `floor(k/2)`
của canvas — mô hình canvas ĐÚNG ở vị trí mẫu, không có gì để
sửa ở đây. (Góc trái-trên cũ đã bị loại từ đợt trước với MAD
26,75 — không phải câu chuyện này.)

**Bước 2 — Toàn bộ dư nằm ở khâu DOWNSCALE, upscale chính xác
tuyệt đối.** Trên đúng frame X của v17 (`stillA.png` tái sinh):
full-chain MAD = 0,1293 và downscale-only MAD = **0,1293 giống
hệt tới 4 chữ số**, histogram lệch của 2 đường khớp nhau theo
hệ số 64 (= diện tích khối 8x8). Probe repo khóa chặt hơn:
MAD full-chain = trung bình lỗi mẫu downscale tới **0,0e+0**
(không chênh) — vì khối ra full-chain chỉ là bản nhân bản của
đúng 1 mẫu downscale. Upscale không đóng góp gì.

**Bước 3 — Trên ramp mịn, dư là ±1 hệ thống, không phải nhiễu.**
Pattern V12 (R=(x*4)%256, G=(y*5)%256, B=(x+3y)%256): mọi pixel
lệch đúng 1 ở R và G, 0 ở B — MAD = (1+1+0)/3 = **0,6667**,
diffPix 100%, per-channel (1,000 / 1,000 / 0,000), ở mọi k
(6/9/13). Giá trị FFmpeg (11,16,12) không phải pixel nguồn nào
(R=11, G=16 không nằm trên ramp 4x/5y) — tức là giá trị TÍNH
TOÁN, không phải lệch vị trí mẫu.

**Bước 4 — Trên nội dung nhiễu + cạnh sắc, dư thưa và tập trung
ở khối cạnh.** Frame X 1280x720 k=8: chỉ **636/14400 khối
(4,4%)** lệch; 95,6% khối chính xác tuyệt đối. Đuôi >8 chỉ
**71 khối (0,49%)**, max 119, và các khối đuôi đầu tiên đều nằm
trên đường chéo cứng của nguồn X (vd [96,168], [176,192],
[256,224] — đường y=135+0,35x trong tọa độ stillA) hoặc biên
checker. Khung nhiễu+cạnh tự sinh của probe repo (640x360, k=8)
cho cùng hình ảnh: MAD 0,1536, 3,7% khối lệch, maxdiff 128.

**Bước 5 — Cơ chế: swscale trộn chroma từ vùng lân cận trong khi
GIỮ luma.** Dấu vết quyết định:
- Tổng RGB giữ nguyên ở khối ramp (12+15+12 = 11+16+12 = 39)
  trong khi từng kênh lệch — không phải blend RGB đơn thuần.
- Trên toàn bộ 636 khối lệch của frame X: mean |dY| = **0,78**,
  max |dY| = **4,32**, trong khi lỗi RGB tới 119. Probe repo:
  max |dY| = 3,37 trong khi maxdiff RGB = 128. Lệch vị trí mẫu
  sẽ kéo luma theo cạnh sắc (tới ~100), không thể giữ luma ở
  mức này — nên vị trí mẫu chắc chắn đúng.
- Footprint đo được (nền solid, 1 pixel trắng): chỉ pixel TRÁI
  mẫu (2,3) làm đổi dst(0,0) thành (13,14,13); trắng tại (4,3),
  (3,2), (3,4), (2,2), (4,4) không đổi. Và G lệch (+1) dù G của
  pixel trái bằng G của mẫu — tức ảnh hưởng CHÉO KÊNH, không
  phải trọng số tuyến tính theo từng kênh (thử khớp trọng số
  tuyến tính từ 2 thí nghiệm E và PAT cho hệ số mâu thuẫn nhau).
- Khối đuôi mẫu hình: mẫu nền (117,144,171) -> FFmpeg
  (153,149,52), kéo về phía màu đường chéo (255,220,0): Y giữ
  139,0 -> 139,1; mẫu vàng (255,220,0) -> (221,215,116):
  Y giữ 205,4 -> 205,5. Luma giữ, chroma bị kéo về phía màu
  của pixel lân cận bên kia cạnh sắc.

Tóm lại cơ chế (mức đã chứng minh bằng đo, KHÔNG mạo nhận đã
đọc source swscale): bộ lọc `scale` với `flags=neighbor` của
FFmpeg 8.1.2 trên input RGB KHÔNG phải bản sao điểm thuần túy
dù filter graph đàm phán rgb24->rgb24 (đã kiểm tra bằng
`-v debug`: không có scaler tự chèn, không chuyển format):
bên trong nó lọc trong miền gần-YUV với chroma lấy từ vùng
lân cận, nên pixel mẫu nằm sát cạnh sắc bị kéo chroma về phía
bên kia cạnh; trên ramp mịn thì chroma trộn cho ±1 hệ thống.
Canvas là bản sao điểm đúng; FFmpeg là bản sao điểm + trộn
chroma LSB. Đây là hành vi của swscale, không phải lỗi mô hình
canvas và không phải lỗi filter render (filter render đúng
`effects.js`, đã dùng từ đầu).

### 6.3. Vì sao KHÔNG sửa (quyết định, có căn cứ)

1. **Không có gì để sửa ở mô hình canvas:** vị trí mẫu đã đúng
   (Bước 1), luma đã đúng (Bước 5). "Sửa" mô hình cho khớp số
   FFmpeg đồng nghĩa tái tạo bit-exact bộ lọc nội bộ của swscale
   8.1.2 trong canvas — phụ thuộc phiên bản, dễ vỡ khi FFmpeg
   đổi, và không cải thiện sản phẩm (xem 3).
2. **Không sửa filter render:** filter thuộc code sản phẩm
   (ngoài phạm vi luồng này) và là hành vi render thật; đổi nó
   để chiều theo harness đo trên input RGB tổng hợp là đổi sản
   phẩm vì artifact đo.
3. **Pipeline thật không gặp quirk này như harness gặp:**
   render thật chạy trên frame video yuv420p (chroma đã subsample
   từ đầu), còn harness ép input RGB raw tổng hợp qua scale —
   chính sự ép này mới phơi bày bước trộn chroma nội bộ của
   swscale. Dư 0,1293 / 0,6667 do đó là **artifact đo của
   harness trên input RGB**, không phải lỗi sản phẩm.
4. **Badge KHỚP vẫn đứng:** 0,1293 ≤ 2 và ≤8 99,80% ≥ 99%;
   0,6667 ≤ 2 và ≤8 100%. Không nâng ngưỡng, không hạ tier,
   không giấu số — số vẫn in đầy đủ trong mọi log.
5. **Khóa thay vì sửa:** `test_v19_pixelate_probe.js` assert
   các dấu hiệu (offset MAD 0; ramp maxdiff ≤ 1 + tier KHỚP;
   upscale chính xác tuyệt đối; luma giữ max|dY| ≤ 8). Nếu
   FFmpeg/swscale tương lai đổi hành vi, probe rớt và báo hiệu
   cần điều tra lại — thay vì lặng lẽ cho số mới.
6. **Muốn sửa thật thì cần gì (không mạo nhận đã có đáp án):**
   đọc source swscale 8.1.2 để xác định đúng đường lọc nội bộ
   cho RGB + `SWS_POINT`, hoặc thử bộ lọc điểm thật khác (vd
   `zscale` nếu có) và đo lại toàn bộ harness — ngoài phạm vi
   đợt này, và chỉ đáng làm nếu quirk này xuất hiện trên
   pipeline render thật (frame yuv420p), không phải trên input
   RGB tổng hợp.

### 6.4. Ghi chú quá trình (trung thực về probe)

Lượt chạy đầu của probe repo rớt 9 assert với MAD 51–91 — do
LỖI CHÉP TAY của chính tác giả trong hàm `fromImg` của probe
(`buf[i + 1]` / `buf[i + 2]` thay vì `buf[i * 3 + 1]` /
`buf[i * 3 + 2]`), KHÔNG phải do module hay FFmpeg. Sửa 1 dòng
đó, toàn bộ assert đạt (exit 0). Lỗi này không nằm trong file
harness cũ (V12 `fromImg` viết đúng) và không ảnh hưởng bất kỳ
số đo nào khác trong đợt.

## 7. Nợ còn lại (trung thực)

- Source nội bộ của swscale 8.1.2 cho đường RGB + `SWS_POINT`
  chưa đọc — cơ chế §6.5 là kết luận từ đo hành vi (luma giữ +
  footprint + phi tuyến chéo kênh), đủ để quyết "không sửa",
  chưa đủ để tái tạo bit-exact.
- `--yuv` chưa nối phần text/effect (xem §4); helper đã sẵn.
- Hàm JS `rgbToYuv420` vẫn còn trong module (giữ để đối chứng
  nhanh nội dung mịn + tương thích script cũ); từ đợt này, mọi
  số YUV chính thức phải qua helper FFmpeg dùng chung (§3.2).
- Số YUV-domain ở crf0 (nợ từ đợt 18) vẫn chưa đo — không claim.
- Footage máy quay THẬT vẫn chưa đo (repo không có file nào
  như vậy); mọi số trên chỉ đúng cho test pattern / nguồn tổng
  hợp trong repo, không suy ra thành claim về footage thật.
- Cơ chế nội bộ của xfade-YUV trong FFmpeg 8.1.2 (nợ từ N5) vẫn
  chưa đọc tới source `vf_xfade.c` — không ảnh hưởng kết luận
  hay hướng sửa đo của đợt này.
- Ghi chú môi trường: giữa đợt, `/tmp` của VM bị quét sạch
  (mất log baseline + tmp v17 + probe thăm dò). Đã chạy lại
  toàn bộ kiểm chứng và lưu log vào scratch trong workspace;
  mọi số trong file này đều là số chạy lại sau vụ quét, và
  v17 tái sinh frame cho đúng pixelate 0,1293 — tính tái lập
  của các số đã được chứng minh bằng chính sự cố này.

## 8. File đổi/thêm (text, không binary — parent gộp batch, không stage ở đây)

- `server/render/src/harnessShared.js` (SỬA — thêm helper YUV
  qua FFmpeg + `rasterizeTextPreview`/`sampleBilinear` dùng
  chung; logic cũ nguyên vẹn).
- `server/render/src/test_v11_parity.js` (SỬA — bỏ 2 hàm text
  cục bộ, require từ module chung, thêm cờ `--yuv` phần A).
- `server/render/src/test_v12_parity.js` (SỬA — như V11, cờ
  `--yuv` cho phần A + A2).
- `server/render/src/test_v14_parity.js` (SỬA — thêm cờ `--yuv`
  phần T; không có hàm text để dời).
- `server/render/src/test_v19_harness_yuv_shared.js` (MỚI —
  script §3.2: V0 + S1/S5b-shared/P5b-shared/S2-shared).
- `server/render/src/test_v19_pixelate_probe.js` (MỚI — probe
  khóa §6: offset/ramp/footprint/nhiễu+cạnh/luma).
- `docs/PHASE9_ROUND19_G6_HARNESS_YUV_LIMITS.md` (MỚI — file này).
- KHÔNG sửa file nào khác. Đặc biệt: không sửa `render.js`,
  `effects.js`, `effectCanvas.ts`, preview, store/spec, i18n,
  script đo của G4, script footage của G5, hay bất kỳ file
  badge/previewStatus nào.

## 9. Kiểm chứng đã chạy (lệnh + kết quả)

Từ `server/render/` (trừ khi ghi khác):

- `node --check src/harnessShared.js src/test_v11_parity.js
  src/test_v12_parity.js src/test_v14_parity.js
  src/test_v19_harness_yuv_shared.js
  src/test_v19_pixelate_probe.js` — pass cả 6.
- `node src/test_v11_parity.js` — exit 0; KẾT 29 case, FAIL 0.
- `node src/test_v12_parity.js` — exit 0; KẾT 37 case, FAIL 0.
- `node src/test_v14_parity.js` — exit 0; KẾT KHỚP 21, XẤP XỈ 1,
  LỆCH 0, PENDING 0.
- `node src/test_v11_parity.js --yuv` — exit 0; 25 dòng YUV, toàn
  KHỚP; lược dòng YUV -> log giống hệt mặc định.
- `node src/test_v12_parity.js --yuv` — exit 0; 26 dòng YUV, toàn
  KHỚP; lược dòng YUV -> log giống hệt mặc định.
- `node src/test_v14_parity.js --yuv` — exit 0; 13 dòng YUV, toàn
  KHỚP; lược dòng YUV -> log giống hệt mặc định.
- 12 case chung V11/V12/V14: số YUV giống hệt nhau, 0 case lệch
  nhau (§3.1).
- `node src/test_v19_harness_yuv_shared.js` — exit 0, ~17 giây;
  toàn bộ số §3.2 (S5b/S2/S1/V0b tái tạo đúng v18 tới 4 chữ số;
  P5b mới: dissolve 2,9014 XẤP XỈ / circleopen 0,5138 KHỚP).
- `node src/test_v19_pixelate_probe.js` — exit 0, ~4 giây; mọi
  assert khóa đạt (offset MAD 0 ở k=6/8/9/13; ramp MAD 0,6667
  maxdiff 1; nhiễu+cạnh MAD 0,1536, upscale chính xác 0,0e+0,
  max|dY| 3,374).
- `node src/test_v17_complex_parity.js --mode=old` (chạy lại để
  xác nhận pixelate) — exit 0; pixelate t=0,43 k=8 đúng MAD
  0,1293, ≤8 99,80%, KHỚP.
- KHÔNG chạy tsc/vite build (không đụng code web/TS sản phẩm),
  KHÔNG chạy click-test browser thật (nợ mở chung).
- KHÔNG push, KHÔNG ghi qua GitHub connector, KHÔNG stage
  (parent sẽ stage).
