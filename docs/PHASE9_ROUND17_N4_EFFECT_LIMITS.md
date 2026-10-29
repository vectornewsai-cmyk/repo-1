# Phase 9 đợt 17 — Luồng N4: effect residuals, edgedetect pattern + glitch ổn định (LIMITS)

Ngày: 2026-10-28. Một luồng trong đợt lớn Phase 9 đợt 17. KHÔNG push,
KHÔNG tag/release, KHÔNG binary. Chỉ sửa file trên đĩa; batch stage do
parent đợt lớn tổng hợp (luồng này KHÔNG tự tạo file paths-loop riêng,
KHÔNG sửa build-loop-log.md, KHÔNG sửa harness server/render).

Máy đo: FFmpeg 8.1.2 trên VM này. Mọi số dưới đây là nguồn tổng hợp,
chưa phải footage thật / HD / clip dài — đừng claim hơn.

## 0. Kết luận nhanh (trung thực)

- **Edgedetect: có sửa mô hình thật, vẫn XẤP XỈ — KHÔNG nâng badge.**
  Mô hình mới: gray nguyên kiểu swscale + Gaussian σ=1.4 bán kính 2 +
  làm tròn sau mỗi pass blur và trên độ lớn + NMS nghiêm (như cũ).
  Tổng MAD 6 ô chuẩn (step/tự nhiên/pattern × 72×45/144×90, t=0.5)
  10.11 (H5) → 8.48; trên 24 ô kiểm chứng độc lập (nguồn tự nhiên mới
  + pattern + step, t=0/0.25/0.5/1) 97.95 → 47.99. Nhưng tự nhiên gốc
  72×45 tệ đi 2.13 → 3.81 và pattern 144×90 vẫn 2.12/98.4% (cần MAD ≤ 2
  và ≤8 ≥ 99% mới KHỚP) nên badge giữ approx.
- **Glitch: KHÔNG còn không ổn định — đã khóa cách đo.**
  Truy nguyên cho thấy lần lật tier đợt 16 KHÔNG phải do nhiễu ngẫu
  nhiên theo thời gian (xem §2). Cách đo ổn định nay được khóa bằng
  test trong parity test (lặp byte-identical + cấu trúc TB/std trong
  ngưỡng), và V14 --only effect chạy 3 lần cho kết quả giống hệt nhau.
  Badge glitch giữ approx (đúng theo thiết kế: nhiễu preview độc lập
  với nhiễu render, không thể KHỚP từng frame).
- **Không đổi badge nào.** previewStatus.ts chỉ cập nhật comment số
  đo edgedetect (đã lỗi thời từ đợt 14 R6); giá trị badge không đổi.

## 1. Edgedetect: truy nguyên nợ pattern của đợt 16 H5

### 1.1 Lệch pattern KHÔNG phải lỗi độ lớn, mà là lỗi kept-set

Trên pattern 72×45, t=0.5 (mô hình H5):

| | Số pixel biên | Giá trị tại biên wrap |
|---|---|---|
| Render | 22, thưa, xen kẽ cột 63/64 | 184 (trong khung), 248/252/255 (gần biên khung) |
| Preview H5 | 39, dày, gần như mỗi hàng 1 pixel | 182 |

Độ lớn khớp trong ~2 mức (184 vs 182); toàn bộ MAD 2.51 đến từ việc
mô hình giữ những hàng mà render bỏ, và đôi khi sai cột (63 thay vì
64). Phân rã MAD 72×45: missed 13 pixel (tổng 2524), false 30 pixel
(tổng 5459), cả hai cùng giữ 9 pixel (tổng lệch chỉ 160). Ở 144×90:
missed 71, false 187, cùng giữ 90 — cùng một mẫu hình.

### 1.2 Nguồn gốc: wrap đơn kênh + lượng tử hoá điểm cố định + NMS nghiêm

Nguồn pattern chỉ có ĐÚNG MỘT biên wrap trong khung 72×45: kênh R
nhảy 252 → 0 tại x=64 (G không wrap vì y·5 ≤ 220; B không wrap vì
x+3y ≤ 203 < 256). Biên này là step đơn kênh trên nền gradient mượt
của 2 kênh còn lại. Thí nghiệm tách kênh chứng minh B mới là tác nhân
gây ra kept-set thưa (xem §1.3), còn G không có tác dụng.

Cơ chế: trên biên wrap, độ lớn Sobel gần như hằng theo hàng y trong
toán học float, nên mô hình float luôn giữ 1 pixel mỗi hàng. Nhưng
pipeline render làm việc trên mặt phẳng uint8: gray nguyên của swscale
và blur nguyên làm tròn tạo ra ripple ±1–2 theo hàng y trong độ lớn
tại biên; NMS nghiêm (m > cả 2 phía) biến ripple đó thành tie-break:
hàng nào 2 cột plateau bằng nhau đúng mức nguyên thì cả 2 cột cùng
chết (hàng bị bỏ), hàng nào lệch thì cột thắng xen kẽ 63/64. Đây là
artefact của nguồn tổng hợp: footage tự nhiên không có step đơn kênh
hoàn hảo kèm gradient mượt như vậy, nên không nên overfit thêm vào
pattern.

Bằng chứng pipeline render (đo trực tiếp, không đoán):

- Log `ffmpeg -v verbose`: trước edgedetect, FFmpeg tự chèn chuyển
  đổi `rgb24 → gray` (full range), sau đó `gray → rgb24`. Vì vậy
  wires mode (mặc định) làm việc trên MỘT mặt phẳng xám, không phải
  từng kênh — thí nghiệm step đơn kênh xác nhận: step chỉ-R, chỉ-G,
  chỉ-B đều cho output R=G=B.
- Dốc tuyến tính: render cho ~174 ≈ độ lớn Sobel thô (~170), không
  phải magnitude/4 (~42) — thang độ lớn thô của H5 là đúng.
- Biên chéo không bão hoà (Δ=64): render cho 208 (chéo 45°) / 196
  (chéo x−2y) — cao hơn MỌI kernel đã thử (K3 gần nhất: 197/203; K5:
  163/166; G1.4: 144/148). Tức pipeline render còn khác biệt cấu trúc
  ngoài kernel (không chỉ là chọn kernel), xem §1.4.

### 1.3 Thí nghiệm tách kênh (72×45, edgedetect low=0.2 high=0.45)

- Step R thuần (G/B hằng): chỉ 4 pixel biên khung — plateau kill.
- Step R + dốc G theo y: vẫn chỉ 4 pixel — dốc G KHÔNG tạo biên trong.
- Step R + dốc chéo B: 9 pixel, có pixel trong khung (hàng 35–40,
  giá trị 170–172) — dốc B LÀ tác nhân.
- Pattern bỏ dốc B (B hằng): chỉ 4 pixel — khẳng định B là tác nhân.
- Pattern bỏ dốc G: 24 pixel thưa xen kẽ, giá trị 160 — mẫu hình
  giống pattern đầy đủ (22 pixel, giá trị 184).
- Quét dốc B k=0..6 và dốc G g=0..8: số pixel trong khung và chu kỳ
  hàng giữ/bỏ thay đổi theo hệ số dốc đúng kiểu chu kỳ làm tròn của
  gray nguyên (vd B k=4: giữ hàng 3,10,16,21,27,32,38 — chu kỳ ~5–6;
  G g=5: lại về 4 pixel, G g=1: 17 pixel) — khớp giả thuyết ripple
  lượng tử hoá, không khớp giả thuyết "hướng gradient chéo".

### 1.4 Vì sao chọn Gaussian σ=1.4 (và vì sao không phải kernel khác)

Quét kernel với gray nguyên swscale + làm tròn (72×45, t=0.5):

| Mô hình | F-pattern MAD / kept-set | naturalOrig | pattern 144×90 |
|---|---|---|---|
| H5 (float, nhị thức K5) | 2.51 / 39 px (render 22) | 2.14/95.6% | 4.29/97.9% |
| K5 + gray nguyên + làm tròn | 2.13 | 2.13/95.6% | 4.25/98.0% |
| K7 nhị thức + làm tròn | 0.84 / 35 px, chứa đủ 22 px render | 4.15/94.5% | 2.86/98.2% |
| Gauss σ=1.0 r2 + làm tròn | 1.75 | 1.82/97.3% | 4.33/98.0% |
| **Gauss σ=1.4 r2 + làm tròn (CHỌN)** | **0.98 / kept-set 45/46 trên 2 probe wrap** | **3.81/94.5%** | **2.12/98.4%** |

K7 và G1.4 đều tái tạo kept-set wrap tốt, nhưng K7 làm dày biên
chéo (3 px/hàng thay vì 2 px/hàng của render trên biên chéo bão hoà)
nên bị loại. G1.4 thắng trên 2 nguồn tự nhiên độc lập tạo SAU khi
chọn kernel (không phải nguồn dùng để chọn): natural2 (24 ô:
97.95 → 47.99, pattern 3.41 → 1.56, natural2 8.64 → 4.24) và natural3
(72×45: 1.28 → 1.13; 144×90: 0.32 → 0.28). G1.4 thua DUY NHẤT trên
nguồn tự nhiên gốc (72×45: 2.13 → 3.81; 144×90: 0.78 → 1.17), và phân
rã cho thấy thua đó là magnitudes trên biên mỏng (missed/false gần
như không đổi: K5 miss 5/false 12, G1.4 miss 3/false 11 trên 168 pixel
biên của render) — blur rộng làm loãng biên mỏng 2–3 px của nguồn
này. Cân bằng tổng thể (6 ô chuẩn 10.11 → 8.48; 24 ô độc lập
97.95 → 47.99) nghiêng về G1.4, nên luồng này áp dụng nó, đồng thời
ghi rõ hồi quy trên naturalOrig thay vì giấu.

### 1.5 Số đo sau đổi (code thật, đo bằng parity test + script đối chiếu)

| Nguồn | Kích thước | H5 | N4 (mô hình mới) |
|---|---|---|---|
| step | 72×45 | 0.315 / 99.9% | **0.315 / 99.9%** |
| tự nhiên gốc | 72×45 | 2.130 / 95.6% | **3.815 / 94.5% (tệ đi)** |
| pattern | 72×45 | 2.513 / 98.6% | **0.985 / 98.9%** |
| step | 144×90 | 0.079 / 100.0% | **0.079 / 100.0%** |
| tự nhiên gốc | 144×90 | 0.776 / 98.3% | **1.172 / 98.1% (tệ đi)** |
| pattern | 144×90 | 4.290 / 97.9% | **2.118 / 98.4%** |

Pattern 72×45 đạt vế MAD của ngưỡng KHỚP (0.985 ≤ 2) nhưng ≤8 chỉ
98.9% < 99% nên vẫn chưa KHỚP. Không ô nào trong 6 ô đạt cả 2 vế
ngoại trừ step — badge type vẫn approx là đúng, vì badge gắn với
type, không gắn với từng case.

Test unit edgedetect (ảnh 8×4: step đối xứng → toàn 0, step bất đối
xứng → đúng 1 cột x=3) vẫn PASS với kernel mới — thay kernel không
phá cấu trúc NMS đã khóa từ H5.

## 2. Glitch: truy nguyên "không ổn định theo thời gian" + khóa cách đo

### 2.1 Kết quả truy nguyên: KHÔNG có tính ngẫu nhiên theo thời gian

Thí nghiệm trên cùng input pattern 72×45, filter glitch của render
(`rgbashift=rh=11:bh=-11,noise=alls=20:allf=t`):

- 5 process FFmpeg riêng biệt, frame 0: hash output GIỐNG HỆT nhau,
  MAD giữa các lần = 0.000; thống kê vs shift-thuần giống hệt nhau
  (TB 8.42, std 10.78).
- Đổi PTS bằng `setpts=100/TB` và `setpts=1000/TB`: output không đổi
  (MAD 0.000) — nhiễu KHÔNG phụ thuộc timestamp của frame.
- Noise riêng (`alls=20:allf=t`, 30 frame): frame 0 và frame 15 giống
  hệt nhau giữa 2 process; trong một process, các frame khác nhau
  (MAD frame0–frame15 = 12.15) — đúng bản chất nhiễu thời gian: khác
  nhau THEO FRAME, không phải theo lần chạy hay theo đồng hồ tường.
- Ghi chú về tính di động: filter noise có option `all_seed`
  (mặc định −1). Trên FFmpeg 8.1.2 ở đây, seed mặc định đã xác định,
  nhưng trên bản FFmpeg mà −1 là ngẫu nhiên thì đo render-frame mới
  lật được — vì vậy khóa di động được là ghim `all_seed` (xem §2.2).

Vậy lần lật tier STAT-LỆCH ↔ STRUCT-OK ở đợt 16 KHÔNG phải do ngẫu
nhiên: giữa đợt 16, preview đổi từ nhiễu đều sang Gauss (max |lệch|
≈ 40, vượt ngưỡng cũ max ≤ 21) TRƯỚC khi V14 đổi sang tiêu chí TB/std
Gauss — tức code và tiêu chí đổi giữa chừng trong cùng một đợt, nên
2 lần đo ở 2 thời điểm khác nhau thấy 2 tier khác nhau. Sau khi cả 2
đã ổn định (cuối đợt 16), tier không còn lật nữa — chứng minh ở §2.3.

### 2.2 Cách đo ổn định được khóa (không sửa harness)

Vì luồng này KHÔNG được sửa harness, cách đo ổn định được khóa ở
phía preview/test, trong `effectCanvas.parity.test.ts` (test mới,
PASS):

1. **Lặp lại byte-identical:** `applyGlitch` cùng seed 42 chạy 3 lần
   trên cùng input cho cùng output (hash 3943d12e × 3). Seed khác
   (43) cho output khác — seed có tác dụng thật, không phải hằng số
   giả.
2. **Cấu trúc vs shift-thuần (nhân biên), không dùng MAD vs render:**
   TB = 8.85 (ngưỡng 7–13), std = 11.24 (ngưỡng 9–14) — đúng tiêu chí
   V14 hiện tại. MAD từng frame vs render (12.318) chỉ là sàn nhiễu
   độc lập, KHÔNG được dùng làm tier.
3. **Đề xuất cho lần sửa harness sau (ngoài phạm vi luồng này):**
   ghim `noise=...:all_seed=<hằng số>` trong filter tham chiếu của
   V14 để đo render-frame ổn định cả trên bản FFmpeg mà seed mặc
   định là ngẫu nhiên. Không áp dụng ở đây vì cấm sửa harness.

### 2.3 Chứng minh lặp lại ở tầng harness (chỉ chạy, không sửa)

`test_v14_parity.js --only effect` chạy 3 lần liên tiếp, kết quả
GIỐNG HỆT nhau cả 3 lần, kể cả dòng glitch:

- `glitch t=0.5 | MAD=12.318 ≤8=7.2% ≤32=88.5% (chỉ tham khảo) |
  cấu trúc: max 40 (tham khảo) TB 8.85 (kỳ vọng 7–13) std 11.24
  (kỳ vọng 9–14) | STRUCT-OK | badge approx (canvas)`
- `edgedetect step | MAD=0.315 ≤8=99.9% | KHỚP`, `edgedetect natural |
  MAD=3.815 ≤8=94.5% | XẤP XỈ`
- Tổng cả 3 lần: KHỚP 8, XẤP XỈ 1, LỆCH 0, PENDING 0, STAT-APPROX 1,
  STRUCT-OK 1, STAT-LỆCH 0.

## 3. Kiểm chứng của luồng

- `effectCanvas.test.ts`: **14/14 PASS** (không đổi test nào; test
  edgedetect tiny-image vẫn xanh với kernel mới).
- `effectCanvas.parity.test.ts`: **15/15 PASS** (14 cũ + 1 test glitch
  ổn định mới: lặp 3 lần + cấu trúc TB/std trong ngưỡng).
- Harness V14 `--only effect` (chỉ chạy): 3/3 lần giống hệt nhau
  (xem §2.3). Không chạy V14 toàn phần (transition) vì luồng này
  không đụng transition; parent chạy lại khi gộp.
- `tsc --noEmit` (apps/web): **0 lỗi**.
- `vite build`: **PASS** (5.48s; dist tái tạo, không liệt kê vào file
  đổi — parent quyết định có stage dist hay không).
- Không nâng badge nào: edgedetect và glitch đều chưa đạt ngưỡng
  KHỚP toàn diện (xem §0, §1.5).

## 4. File đã đổi / thêm (báo cho parent gộp batch, không tự stage)

Đổi:

- `apps/web/src/lib/effectCanvas.ts` — `applyEdgeDetect`: gray
  nguyên swscale (19595/38470/7471, +32768 >> 16), kernel Gaussian
  σ=1.4 bán kính 2 thay cho nhị thức [1,4,6,4,1]/16, làm tròn sau mỗi
  pass blur và trên độ lớn; cập nhật comment mirror đầu file và
  comment hàm (ghi rõ hồi quy naturalOrig, không giấu).
- `apps/web/src/lib/effectCanvas.parity.test.ts` — cập nhật số/log
  edgedetect sang N4; thêm test glitch ổn định (lặp 3 lần
  byte-identical + cấu trúc TB/std trong ngưỡng V14).
- `apps/web/src/components/transitions/previewStatus.ts` — CHỈ cập
  nhật comment số đo edgedetect (đã lỗi thời từ đợt 14 R6); giá trị
  badge edgedetect/glitch KHÔNG đổi (vẫn approx).

Thêm:

- `docs/PHASE9_ROUND17_N4_EFFECT_LIMITS.md` — file này.

Không sửa: mọi file harness (`server/render/src/test_v14_parity.js`,
V11/V12/V14, harnessShared) — đúng ràng buộc luồng.

## 5. Nợ còn lại / việc cho đợt sau (trung thực)

1. **Edgedetect vẫn approx.** Muốn nâng badge cần mô hình qua được
   cả tự nhiên gốc (hiện 3.815/94.5% ở 72×45) lẫn pattern 144×90
   (2.118/98.4%) — hiện chưa có. Đáp ứng biên chéo không bão hoà của
   render (208/196) vẫn cao hơn mọi kernel đã thử: pipeline render
   còn khác biệt cấu trúc ngoài kernel (có thể là cách làm tròn nội
   bộ của gaussian_blur/Sobel trong vf_edgedetect.c) — cần đo sâu hơn
   nữa nếu muốn khớp tuyệt đối, nhưng đừng overfit vào nguồn tổng
   hợp; ưu tiên đo trên footage thật trước.
2. **Glitch/noise không bao giờ KHỚP từng frame** theo thiết kế
   (nhiễu preview seed xác định vs nhiễu render thời gian) — chỉ
   theo dõi bằng chỉ số cấu trúc/thống kê, đừng đưa chúng vào bảng
   KHỚP pixel. Đề xuất ghim `all_seed` cho lần sửa harness sau (§2.2).
3. **Chưa đo:** footage thật, HD/4K cho edgedetect; edgedetect ở các
   intensity khác 0.5 trên nguồn tự nhiên gốc (validation 24 ô cho
   thấy t gần như không đổi số đo trên step/pattern, nhưng natural
   gốc chưa quét t); V14 toàn phần sau gộp.
4. **Lưu ý về kernel:** G1.4 thắng tổng thể nhưng thua trên nguồn
   tự nhiên gốc vì làm loãng biên mỏng 2–3 px. Nếu footage thật cho
   thấy biên mỏng là phổ biến, cần cân nhắc lại giữa G1.4 và K5 —
   quyết định đó cần số đo footage thật, không phải thêm nguồn tổng
   hợp nữa.
