# Phase 9 đợt 31, luồng N6 — Hiệu chuẩn trọng số dip cho mô hình cặp

> Follow-up điều kiện (a) của quyết định đợt 30 M6
> (`docs/PHASE9_ROUND30_M6_PAIRGAP_DECISION_LIMITS.md` §0) và nợ §3
> mục 6 của `docs/PHASE9_ROUND30_LIMITS.md`: hiệu chuẩn lại trọng số
> dip, là follow-up rẻ nhất trước khi đổi model cặp. KHÔNG push,
> KHÔNG tag/release, KHÔNG binary vào repo, KHÔNG tự ghi file
> paths-loop hay build-loop-log (parent lo). KHÔNG đụng seek/preview
> ngoài dip, CLI, i18n, script CDP.

## 0. Quyết định (đọc trước)

**ĐỔI trọng số dip trong code sản phẩm**: `fadeDipWeights` trong
`apps/web/src/lib/transitionPreview.ts` chuyển từ smoothstep
(A tắt [−0,01, 0,196], B mở [0,122, 1,076]) sang **nội suy tuyến tính
qua các nút p cách 0,05** suy ra từ probe xfade đơn 120fps, với
**bB kẹp 0 tới p=0,12** (giữ đúng hành vi đã ghim). Ô lệch của M6
(FW/FG phẳng localT=0,75) đi từ **5,00 LỆCH (lưới 30fps của M6) →
3,00 XẤP XỈ (đúng p, trọng số cũ) → 1,33 KHỚP (đúng p, trọng số mới)**,
và **không ô nào tụt verdict** trên toàn bộ lưới đo (xem §4–§5).

**Giới hạn của quyết định này (trung thực, đọc kỹ trước khi trích):**

- Đọc "không tệ đi" theo thang verdict như chính M6 đã dùng (M1 bị
  bác vì làm ô KHỚP thành LỆCH): trọng số mới **không làm tụt
  verdict ô nào** trong 15 ô phẳng gốc + 15 ô phẳng màu mới + 63 ô
  xfade đơn màu mới + 6 ô footage. Nhưng có **3 dao động dưới ngưỡng**
  vẫn giữ KHỚP mà MAD tăng nhẹ, ghi rõ ở §4.4: FW/FG phẳng gốc 0,9
  (0,33→1,00), xfade đơn màu mới fadeblack p=0,8 (0→0,67) và
  fadegrays p=0,6 (0,33→1,00); footage 0,9 tăng 0,25→0,40. Tất cả đều
  ≤ 2 mức trên 1 pixel phẳng (mức nhiễu làm tròn 8-bit), không đổi
  tier. Nếu parent áp bar nghiêm ngặt "không tăng MAD ở bất kỳ ô
  nào" thì bộ này CHƯA đạt bar đó — khi ấy chỉ lấy kết quả đo ở
  đây làm ứng cử, đừng merge thay đổi code.
- **KHÔNG đổi mô hình**: sản phẩm vẫn giữ mô hình đơn clip + badge
  `matched` như quyết định M6. Hiệu chuẩn này chỉ đóng điều kiện
  (a) của M6 trên lưới exact-p (xem §7); đổi model vẫn cần đủ điều
  kiện (b) harness before/after, (c) ngân sách perf ~1,5×, (d) phạm
  vi họ fade — không làm, không claim trong luồng này.
- Lưới 30fps gốc của M6 **không phải lưới tham chiếu hợp lệ cho ô
  0,75** (xem §1): frame n=113 ứng với p thật 0,7667/0,2667, nên dù
  trọng số hoàn hảo thì model tại p=0,75 vẫn lệch so với frame đó
  (đo thật sau đổi trên lưới 30fps: 3,33 XẤP XỈ, từ 5,00 LỆCH;
  footage 0,75 cũng chỉ 2,83→2,06 XẤP XỈ trên lưới 30fps trong khi
  đúng p là 0,76 KHỚP). Lưới đúng là lưới
  exact-p 120fps trong luồng này.

## 1. Phát hiện trước khi tìm trọng số: ô 0,75 lệch một nửa do harness

Chuỗi kép M6 ở 30fps chọn frame `n = round((3 + localT) × 30)`:
localT=0,75 → n=113 → thời gian 113/30 = 3,7667s → **p1 thật
0,7667** (xfade thứ nhất, offset 3) và **p2 thật 0,2667** (xfade thứ
hai, offset 3,5), trong khi model tính ở p1=0,75 / p2=0,25. Sai số
Δp = +0,0167 ở cả 2 tầng. localT=0,6 và 0,9 là bội số của 1/30 nên
không dính lỗi này — khớp với việc chỉ các ô 0,75 mang dư số lớn
hơn hẳn (2,33–2,83 ở nhiều combo, 5,00 ở FW/FG).

Bằng chứng pixel (FW/FG phẳng, kênh R/G/B):

| | Pixel chuỗi | Pixel model (trọng số cũ) | Chênh | MAD |
|---|---|---|---|---|
| 30fps n=113 (p thật 0,7667/0,2667) | (118, 100, 118) | (121, 109, 121) | (3, 9, 3) | 5,00 LỆCH |
| 120fps đúng p=0,75/0,25 | (119, 104, 119) | (121, 109, 121) | (2, 5, 2) | 3,00 XẤP XỈ |

Tức **~2,00 MAD trong số 5,00 là lỗi chọn frame của harness, không
phải lỗi trọng số**. Phần còn lại (3,00, tập trung kênh G: chênh 5)
mới là lỗi hiệu chuẩn thật, phân tích ở §2: tầng 1 FW tại p=0,75
cho pixel (69, 162, 69) trong khi chuỗi đơn thật là (65, 160, 65)
(bB thật ≈ 0,744 so với code 0,7295), và tầng 2 FG tại p=0,25 có
bB thật 0,0551 so với code 0,0492 — cộng dồn qua gray-mid của tầng
1 thành chênh kênh G ≈ 5 mức.

## 2. Probe xfade đơn 120fps + đảo ngược trọng số

Chuỗi xfade đơn A=red (253,0,0) → B=green (0,127,0) — lưu ý FFmpeg
`green` sau chuyển rgb24 là (0,127,0), không phải (0,255,0); mọi phép
đảo ngược đều dùng giá trị thuần đo được, không dùng giá trị danh
nghĩa. Mỗi type × p = 0 → 1 bước 0,05 (21 điểm), frame tại đúng p
nhờ 120fps. Đảo ngược (aAlpha, bAlpha) dưới dạng mô hình sản phẩm
bằng bình phương tối thiểu 3 kênh; dư số LSQ (rmse) kiểm tra dạng
mô hình có đúng không.

Kết quả tổng hợp (trung bình 3 type; chi tiết từng p trong
`benchmarks/results/v31-n6-single.json`):

| Type | max \|ΔaA\| | max \|ΔbB\| | MAD trung bình (code cũ) | MAD lớn nhất |
|---|---|---|---|---|
| fadeblack | 0,0035 | 0,0157 | 0,30 | 0,67 |
| fadewhite | 0,0080 | 0,0159 | 1,44 | 3,67 (p=0,15) |
| fadegrays | 0,0075 | 0,0132 | 0,68 | 1,33 |

- Dạng mô hình đúng: rmse đảo ngược ≤ 0,30 với fadewhite,
  ≤ ~1,1 với fadegrays (mean) — tức công thức dip + bất biến
  dip.a = 1−p−aAlpha, dip.b = p−bAlpha đứng; sai số nằm ở đường
  cong trọng số, không nằm ở dạng công thức.
- Độ lệch bB theo p (trung bình 3 type, code cũ → đảo ngược):
  p=0,15: +0,0103; 0,25: +0,0070; 0,45: −0,0074; 0,70: +0,0133;
  0,75: +0,0124; 0,85: −0,0103; 0,90: −0,0116. Dạng nhấp nhô này
  (không đơn điệu theo một phép dịch/giãn khoảng) là lý do lưới
  khoảng ở §3 thất bại: không có bộ (aStart, aEnd, bStart, bEnd)
  nào vừa nâng bB ở 0,75 vừa hạ bB ở 0,85.
- Gray-mid: mean kênh thắng luma trên đường RGB (rmse trung bình
  đảo ngược fadegrays: mean 0,63 vs luma 0,72; trên lưới cặp, đổi
  sang luma làm ô lệch thành 8,00 LỆCH — xem §3). Giữ mean cho
  đường RGB, đúng như code hiện tại.

## 3. Lưới khoảng (interval) THẤT BẠI — không có bộ khoảng nào đạt bar

Lưới thô (162 combo: aStart × aEnd × bStart × bEnd × grayDef) rồi
lưới mịn quanh CUR (20 combo: bStart 0,100–0,145 × bEnd 1,03–1,10,
a giữ nguyên, gray=mean), đánh giá trên phẳng exact-p 15 ô + xfade
đơn 63 ô. Hồi quy ở đây = ô phẳng MAD tăng > 0,5 hoặc tụt verdict.

- **Chỉ duy nhất CUR có nRegress = 0** (lưới mịn; lưới thô thêm 1
  combo aStart=0,02/aEnd=0,17 cũng nRegress=0 nhưng singleMean tệ
  0,81→1,76 và singleWorst 3,67→17,00 — bị loại ngay).
- Mọi combo đưa ô lệch về KHỚP đều hồi quy ≥ 5 ô phẳng, ví dụ:
  bStart=0,135/bEnd=1,05 → ô lệch 1,67 KHỚP nhưng nRegress=5,
  singleMean 0,81→1,05, singleWorst 3,67→5,67;
  bStart=0,122/bEnd=1,05 → ô lệch 0,67 KHỚP nhưng nRegress=5,
  singleMean→1,34, singleWorst→6,67.
- Kết luận: **hiệu chuẩn dạng khoảng đã tới giới hạn** — smoothstep
  4 tham số không biểu diễn được đường cong thật (nhấp nhô §2).
  Đây là căn cứ để chuyển sang đường cong nút ở §4 thay vì cố
  vặn thêm khoảng.

## 4. Đường cong nút (SHAPE) + thí nghiệm chéo

### 4.1 Cách dựng

Nút = trung bình đảo ngược 3 type tại mỗi p (bảng đầy đủ trong
`server/render/src/measure_r31_n6_shape_xval.js`, KNOTS):

| p | aAlpha | bAlpha |
|---|---|---|
| 0,00 / 0,05 / 0,10 / 0,15 / 0,20 | 1 / 0,8012 / 0,4497 / 0,1329 / 0 | 0 / 0,0005 / 0,0039 / 0,0128 / 0,0288 |
| 0,25 / 0,30 / 0,35 / 0,40 / 0,45 / 0,50 | 0 | 0,0562 / 0,0955 / 0,1427 / 0,2004 / 0,2659 / 0,3435 |
| 0,55 / 0,60 / 0,65 / 0,70 / 0,75 / 0,80 | 0 | 0,4191 / 0,5059 / 0,5884 / 0,6697 / 0,7419 / 0,8007 |
| 0,85 / 0,90 / 0,95 / 1,00 | 0 | 0,8479 / 0,8989 / 0,9476 / 1 |

Nội suy tuyến tính giữa các nút; **biến thể kẹp** (bản áp vào code):
bB = 0 với p ≤ 0,12 rồi nối lên nút 0,15 — giữ đúng test
`b.alpha === 0` tại p=0,12 (bản nút thô cho 0,0075 tại đó, do trung
bình lẫn nhiễu kênh dip của FW/FG; probe fadeblack riêng cho bB=0
ở p=0,10). aA giữ bảng nút (aA(0,2)=0, đơn điệu giảm).

### 4.2 Lưới phẳng gốc red→green→magenta, exact-p 120fps (15 ô)

| Combo / localT | CUR | SHAPE-kẹp |
|---|---|---|
| FW/FW 0,6 / 0,75 / 0,9 | 2,00 / 1,33 / 1,00 KHỚP | 1,33 / 1,00 / 0,67 KHỚP |
| FG/FW 0,6 / 0,75 / 0,9 | 2,00 / 1,33 / 1,00 KHỚP | 1,33 / 1,00 / 0,67 KHỚP |
| **FW/FG 0,6 / 0,75 / 0,9** | 2,33 XẤP XỈ / **3,00 XẤP XỈ** / 0,33 KHỚP | 1,33 KHỚP / **1,33 KHỚP** / 1,00 KHỚP |
| FB/FB 0,6 / 0,75 / 0,9 | 1,00 / 1,33 / 1,33 KHỚP | 1,00 / 0,00 / 0,67 KHỚP |
| FB/FW 0,6 / 0,75 / 0,9 | 0,67 / 1,33 / 1,00 KHỚP | 0,67 / 1,00 / 0,67 KHỚP |

Ô lệch **về KHỚP**; ô FW/FG 0,6 cũng từ XẤP XỈ lên KHỚP. Duy nhất
FW/FG 0,9 tăng 0,33→1,00 (vẫn KHỚP, xem §4.4).

### 4.3 Thí nghiệm chéo (không dùng dữ liệu fit)

**(a1) Cặp màu mới blue (0,0,254) → yellow (253,253,0) → cyan
(0,255,255), phẳng exact-p 15 ô:** SHAPE-kẹp cải thiện hoặc bằng
CUR ở cả 15 ô, 0 hồi quy theo luật MAD>0,5/tụt verdict; FW/FG 0,75
từ 2,33 XẤP XỈ → 1,67 KHỚP. (Bản nút thô cũng 0 hồi quy.)

**(a2) Xfade đơn màu mới blue→yellow, 3 type × 21 p:**

| Type | CUR mean / worst MAD | SHAPE-kẹp mean / worst MAD | Ô flagged MAD>0,5 |
|---|---|---|---|
| fadeblack | 0,95 / 2,00 | 0,19 / 0,67 | 1/21 (p=0,8, vẫn KHỚP) |
| fadewhite | 0,94 / 2,33 | 0,57 / 1,00 | 0/21 |
| fadegrays | 0,91 / 1,67 | 0,78 / 1,33 | 1/21 (p=0,6, vẫn KHỚP) |

**(b) Footage K→L→J exact-p 120fps, 6 ô:** FW/FW 0,6: 1,54→1,29;
0,75: 1,54→0,76; 0,9: 0,25→0,40; FB/FW 0,6: 1,16→1,25; 0,75:
1,54→0,76; 0,9: 0,25→0,40 — tất cả KHỚP, 0 hồi quy theo luật.

### 4.4 Các dao động dưới ngưỡng (ghi rõ, không giấu)

- FW/FG phẳng gốc 0,9: 0,33→1,00 (chênh tối đa 1 mức, vẫn KHỚP).
- Xfade đơn màu mới fadeblack p=0,8: 0→0,67; fadegrays p=0,6:
  0,33→1,00 (mỗi ô = 2 mức tổng trên 3 kênh của 1 pixel phẳng,
  vẫn KHỚP).
- Footage 0,9: +0,15 mức trung bình trên toàn khung (230.400 px,
  vẫn KHỚP).
Đây là mức nhiễu làm tròn 8-bit của FFmpeg (pixel chuỗi là số
nguyên; CUR đạt đúng 0 ở vài ô chỉ là may mắn làm tròn), không phải
tụt tier. Xem cảnh báo bar nghiêm ngặt ở §0.

## 5. Áp vào code sản phẩm + kiểm chứng độc lập

Đổi duy nhất `fadeDipWeights` trong
`apps/web/src/lib/transitionPreview.ts` (bảng nút + nội suy tuyến
tính + ghi chú hiệu chuẩn mới) và 3 ghi chú liên quan trong cùng
file (case fadeblack, case fadewhite/fadegrays, note fadewhite).
Không đổi công thức dip, gray-mid, offset YUV, singleClipDipPixel,
hay bất kỳ logic preview/render nào khác.

- `node apps/web/src/lib/transitionPreview.test.ts`: **31 pass,
  0 fail** (trước đổi cũng 31/0 — các neo b(0,5)≈0,347±0,01,
  a(0,2)===0, b(0,12)===0, đơn điệu, bất biến dip đều giữ).
- `tsc --noEmit` (apps/web): **0 lỗi**.
- Kiểm chứng end-to-end bằng CHÍNH code sản phẩm sau đổi
  (`--pair120`, dùng describeTransition + compositeFadePixel thật):
  **khớp từng chữ số** với số ứng cử SHAPE-kẹp ở §4.2–§4.3(b) trên
  cả 21 ô (phẳng 15 + footage 6), gồm FW/FG 0,75 = 1,33 KHỚP và
  footage 0,75 = 0,76 KHỚP. (Cột M2-paramCUR trong file after vẫn
  là trọng số cũ để đối chiếu.)
- KHÔNG chạy `vite build` trong luồng này: dist đang dùng chung với
  các luồng song song khác, rebuild có thể đổi bundle hash giữa
  lúc họ click-test; parent kiểm chứng gộp chạy build (tsc đã xanh
  nên rủi ro chỉ còn ở khâu bundle, không ở logic đổi này).

## 6. Đo thêm: vòng lặp inline trên browser (đóng một phần nợ M6 §6)

Trước đây inline chỉ đo ở Node (nhanh hơn 2,8–4,3×). Luồng này đo
được inline trên Chromium headless thật qua CDP (script mới
`apps/web/scripts/measure-browser-dip-inline-round31-n6.mjs`,
dùng CHÍNH `singleClipDipPixel` transpile verbatim; KHÔNG dùng
binary browser của Muse vì nó từ chối khởi động ngoài policy:
"Hatch WebGL domain policy is required for browser startup" —
dùng bản Playwright chromium-1248 trong cache).

| | Vòng product (median) | Vòng inline (median) | Tỉ lệ | product-vs-inline |
|---|---|---|---|---|
| 1080p white (5 rep) | 50,7 ms | 18,5 ms | 2,7× | MAD 0,0000 |
| 1080p gray (5 rep) | 56,8 ms | 25,0 ms | 2,3× | MAD 0,0000 |
| 4K white (3 rep) | 177,7 ms | 71,8 ms | 2,5× | MAD 0,0000 |

Lặp lại lần 2 khớp trong ~5% (1080p white 50,6→50,7; gray
54,4→56,8; 4K white 173,5→177,7). **Cảnh báo so sánh:** số tuyệt đối
KHÔNG so được với số headed của M6 (1080p 250–308 ms, 4K 961–1239
ms) vì khác bản Chromium (headless Playwright vs headed Xvfb),
khác tải VM (M6 đo lúc VM nghẽn nặng, luồng này đo lúc rảnh hơn)
và khác cách cấp buffer (mảng thuần thay vì getImageData canvas).
Điều kết luận được chỉ là: **inline nhanh hơn product trên browser
thật với tỉ lệ ~2,3–2,7× và pixel-identical** — ủng hộ hướng tối ưu
cho điều kiện perf (c) của M6, nhưng chưa đủ để claim ngân sách
1,5× cho composite cặp (cần đo composite 2 pass + draw thật, chưa
làm ở đây).

## 7. Chưa đo / nợ còn lại (không mạo nhận)

- **Blur ở p/mode/weights khác: CHƯA ĐO** (nợ đứng từ M6). Luồng
  này không đụng harness blur của M6 (cần phiên app headed + seed
  autosave + ruler click — không rẻ trong một luồng hiệu chuẩn);
  blur vẫn chỉ có số tại p=0,5, FW-IN, weights [1,1,1] frames 3.
- Lưới 30fps gốc của M6 cho ô 0,75 vẫn XẤP XỈ (3,33 đo thật với
  trọng số mới, từ 5,00) — đó là lỗi chọn frame của harness (§1),
  không phải lỗi trọng số còn lại. Muốn lưới 30fps cũng KHỚP thì
  phải sửa harness chọn frame theo timestamp đúng p (hoặc đo ở fps
  cao hơn), không phải vặn thêm trọng số.
- Điều kiện (a) của M6 nay coi là **đóng trên lưới exact-p**
  (cặp đơn lẫn cặp ngắn đều KHỚP ở mọi p đã đo); điều kiện (b),
  (c), (d) vẫn mở — mô hình đơn clip vẫn giữ nguyên, không ai được
  trích luồng này như "đã cho phép đổi model".
- Safari / máy thật / dpr > 1 / viewport khác cho dip vẫn chưa đo
  (nợ đứng từ trước).
- Nút hiệu chuẩn fit trên 2 cặp màu phẳng + 1 footage; cặp màu
  thứ ba và footage khác chưa đo — rủi ro overfit còn lại là nhỏ
  nhưng không bằng 0; nếu round sau thấy hồi quy trên màu mới thì
  revert `fadeDipWeights` về smoothstep cũ (1 hàm duy nhất).

## 8. Kiểm chứng và file đổi/thêm

Lệnh chạy (từ gốc repo; FFmpeg 8.1.2, Node 24):

- `node --check` cả 4 script đo mới: pass.
- `node server/render/src/measure_r31_n6_dip_weights.js --single
  --json benchmarks/results/v31-n6-single.json` (63 chuỗi đơn).
- `node server/render/src/measure_r31_n6_dip_weights.js --pair120
  --json benchmarks/results/v31-n6-pair120.json` (21 ô, trọng số
  cũ) và `--pair120 --json benchmarks/results/v31-n6-pair120-after.json`
  (sau đổi code — khớp số ứng cử); `--pair30 --json
  benchmarks/results/v31-n6-pair30-after.json` (lưới 30fps gốc sau
  đổi: FW/FG 0,75 = 3,33 XẤP XỈ, footage 0,75 = 2,06 XẤP XỈ —
  bằng chứng lỗi chọn frame §1).
- `FINE=1 node server/render/src/measure_r31_n6_dip_weights.js
  --search --json benchmarks/results/v31-n6-search-fine.json`
  (lưới mịn; lưới thô ở `v31-n6-search.json`).
- `node server/render/src/measure_r31_n6_shape_xval.js --json
  benchmarks/results/v31-n6-shape-xval.json` và
  `SHAPE_CLAMP=1 ... --json benchmarks/results/v31-n6-shape-xval-clamp.json`
  (thí nghiệm chéo màu mới + footage).
- `node server/render/src/measure_r31_n6_shape_orig.js --json
  benchmarks/results/v31-n6-shape-orig.json` và
  `SHAPE_CLAMP=1 ... --json benchmarks/results/v31-n6-shape-orig-clamp.json`
  (lưới phẳng gốc).
- `node apps/web/scripts/measure-browser-dip-inline-round31-n6.mjs
  --json benchmarks/results/v31-n6-browser-inline.json`
  (cần Chrome headless; `$CHROME_BIN` nếu khác mặc định).
- `node apps/web/src/lib/transitionPreview.test.ts`: 31 pass, 0 fail.
- `tsc --noEmit` (apps/web): 0 lỗi.
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (raw/frame trung gian chỉ ở
  /tmp, đã xoá; video + snapshot chỉ ở thư mục tmp ngoài repo từ
  các đợt trước, không đụng tới). KHÔNG tự ghi file paths-loop,
  KHÔNG ghi build-loop-log (parent lo).

File đổi/thêm (text, không binary — parent gộp batch):

- Sửa: `apps/web/src/lib/transitionPreview.ts` — `fadeDipWeights`
  thành nội suy nút hiệu chuẩn đợt 31 N6 (bB kẹp 0 tới p=0,12) +
  cập nhật 3 ghi chú liên quan trong cùng file; không đổi logic
  nào khác.
- Mới: `server/render/src/measure_r31_n6_dip_weights.js` — probe
  xfade đơn 120fps + đảo ngược trọng số, lưới cặp exact-p 120fps
  và 30fps, lưới tham số khoảng (thô + mịn).
- Mới: `server/render/src/measure_r31_n6_shape_xval.js` — thí
  nghiệm chéo SHAPE (màu mới + xfade đơn màu mới + footage),
  hỗ trợ `SHAPE_CLAMP=1`.
- Mới: `server/render/src/measure_r31_n6_shape_orig.js` — SHAPE
  trên lưới phẳng gốc, hỗ trợ `SHAPE_CLAMP=1`.
- Mới: `apps/web/scripts/measure-browser-dip-inline-round31-n6.mjs`
  — đo vòng lặp dip product-vs-inline trên Chromium headless qua
  CDP (hàm sản phẩm transpile verbatim).
- Mới: `docs/PHASE9_ROUND31_N6_DIP_WEIGHTS_LIMITS.md` — file này.
- Mới: `benchmarks/results/v31-n6-single.json` — probe xfade đơn
  63 điểm + đảo ngược.
- Mới: `benchmarks/results/v31-n6-pair120.json` — lưới cặp exact-p
  21 ô, trọng số cũ (baseline).
- Mới: `benchmarks/results/v31-n6-pair120-after.json` — lưới cặp
  exact-p 21 ô bằng CHÍNH code sản phẩm sau đổi (khớp số ứng cử).
- Mới: `benchmarks/results/v31-n6-pair30-after.json` — lưới 30fps
  gốc sau đổi (chứng minh lỗi chọn frame §1).
- Mới: `benchmarks/results/v31-n6-search.json` và
  `v31-n6-search-fine.json` — lưới tham số khoảng (thô + mịn).
- Mới: `benchmarks/results/v31-n6-shape-xval.json` và
  `v31-n6-shape-xval-clamp.json` — thí nghiệm chéo (nút thô + kẹp).
- Mới: `benchmarks/results/v31-n6-shape-orig.json` và
  `v31-n6-shape-orig-clamp.json` — SHAPE trên lưới phẳng gốc.
- Mới: `benchmarks/results/v31-n6-browser-inline.json` — vòng lặp
  inline trên browser headless.
