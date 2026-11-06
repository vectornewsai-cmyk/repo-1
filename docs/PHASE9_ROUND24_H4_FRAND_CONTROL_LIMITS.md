# Phase 9 đợt 24 (luồng H4) — thí nghiệm đối chứng giả thuyết frand-mosaic + ô còn thiếu (native 608, sàn crf0 4K) — LIMITS trung thực

> Đợt 24, luồng H4 (nối tiếp đợt 23 luồng G5). Luật cứng đã giữ:
> KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
> release/tag, KHÔNG code giả, KHÔNG sửa code sản phẩm (chỉ thêm
> 2 script đo mới), KHÔNG đưa binary vào repo, KHÔNG dùng clip
> J/K/L/R1/R2 vào kho phát hành (chỉ đo trong scratch ngoài repo,
> đã xoá sau khi đo — cảnh báo phát hành đợt 23 G6 vẫn nguyên).
> Máy đo: VM 2 vCPU, FFmpeg 8.1.2. Scratch đo đặt trên đĩa
> (/home/hatch/vcut-r24-scratch) theo đúng bài học ENOSPC đợt 23 —
> KHÔNG dùng /tmp cho file lớn; /tmp chỉ chứa các ô native 608
> nhỏ (vài MB) và đã dọn sau mỗi lần chạy.

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **Giả thuyết frand-mosaic ở dạng gốc BỊ BÁC ở mức sàn.**
  Đợt 23 nói "dissolve mosaic nhiễu frand giàu tần số cao nên
  subsample 4:2:0 phá nặng hơn blend mịn". Thí nghiệm đối chứng
  đợt này chứng minh cơ chế thật KHÁC: **lệch hệ số chuyển màu
  bt709 (chuỗi render, theo metadata nguồn) vs bt601 (phép chuyển
  preview trong harness)**. Bằng chứng quyết định, cùng cặp K→L,
  cùng frame, chỉ đổi hệ số chuyển: chuỗi mặc định (bt709) vs
  preview bt601 = **1,6946/98,36% XẤP XỈ** (tái lập đúng số đợt
  23); chuỗi ÉP bt601 vs preview bt601 = **0,0024/100% KHỚP**;
  chuỗi ép bt709 = 1,6946 (đúng bằng mặc định — chứng tỏ mặc định
  chính là bt709); preview chuyển bt709 vs chuỗi mặc định =
  **0,0023/100% KHỚP**. Sàn trượt không phải do subsample, không
  phải do tần số cao — mà do hai phép chuyển khác hệ số.
- **Bằng chứng phụ loại trừ tần số cao:** mosaic khối 64px và
  16px trên cùng cặp K→L cho sàn **0,0000/100% KHỚP** (cả hai
  phía đều bt601 vì input rawvideo không metadata — thí nghiệm
  này bị CONFOUND bởi chuyển màu, nên chỉ là bằng chứng phụ, bằng
  chứng chính là probe ép-bt601 ở trên); cặp R1→R2 có phổ blend
  frand CAO HƠN K→L (HF 74,79 so với 52,77) mà sàn vẫn **KHỚP
  0,6615/99,95%**. Tần số cao đơn thuần không dự báo được sàn
  trượt.
- **Tần số cao vẫn có giá ở crf hữu hạn** (không phủ nhận hoàn
  toàn): với chuyển màu KHỚP (bt601 cả hai phía), dissolve K→L
  crf14 vẫn XẤP XỈ **2,2843/98,69%** (so với mismatched 2,9697),
  trong khi circleopen **0,8036/99,99% KHỚP**. Nhưng ngưỡng đã
  về đúng quy tắc cũ: dissolve K→L KHỚP ở **crf12 (1,8661/
  99,52%)** và **crf10 (1,5137/99,86%)**.
- **Quy tắc crf YUV SỬA LẠI (lần 2):** với phép chuyển màu KHỚP,
  **crf ≤ 10 cho KHỚP dissolve trên 6/6 nội dung đã đo** (K→L
  thậm chí KHỚP từ crf12) — **"ngoại lệ K→L" của đợt 23 BIẾN MẤT:
  nó là artifact đo, không phải tính chất nội dung.** Cảnh báo
  phương pháp: toàn bộ số YUV đợt 20–23 đều đo bằng phương pháp
  mismatched (preview bt601 vs chuỗi bt709) nên mang một độ
  lệch hệ thống phụ thuộc nội dung (0,66–1,71 MAD ở sàn); quy tắc
  "crf ≤ 10" đợt 22 sống sót vì độ lệch đó chưa đủ lớn trên các
  nội dung khác để đổi verdict, trừ K→L. **Từ đợt sau, đo parity
  YUV phải khớp hệ số chuyển** (chuyển preview bằng bt709, hoặc
  ép chuỗi về bt601) — đây là sửa phương pháp đo, KHÔNG phải sửa
  sản phẩm: render dùng bt709 là ĐÚNG với nguồn bt709, preview
  canvas là RGB; chỉ phép so sánh YUV là cần khớp hệ số.
- **Verdict cho hạng nội dung K→L: KHỚP** (với chuyển màu khớp).
  Không phát hiện bug sản phẩm → KHÔNG sửa code sản phẩm.
- **Ô còn thiếu đã đo xong:** native 608×1080 (L-native) cho
  J→L và K→L; sàn crf0 4K dọc (upscale) cho J→K cả 2 type, đều
  KHỚP (xem §4–§5).

## 1. Thiết kế thí nghiệm đối chứng (3 hướng, như nhiệm vụ)

Cùng cặp K→L (K 28–30s, L 24–26s), cùng khung 720×1280, cùng
frame giữa n=45 @30fps (p=0,5), cùng thang V6, cùng chuỗi ép
rgb24 trước blend — chỉ đổi MỘT biến mỗi hướng:

- **(a) Mosaic làm thô:** dissolve với pattern khối thay vì
  frand từng pixel. Mỗi ô bs×bs nhận 1 giá trị giả ngẫu nhiên
  xác định từ (bx,by) (hàm `blockVal` trong script, hash
  Math.imul); ô thành B khi giá trị < 0,5. Render bằng FFmpeg
  `maskedmerge` với mask rgb24 do script sinh (ngữ nghĩa đã kiểm
  chứng trên ảnh tổng hợp: mask=0 → A, 255 → B); preview JS dùng
  CÙNG hàm nên khớp mô hình theo định nghĩa (RGB MAD 0,0000 cả
  hai cỡ khối). Hai cỡ: 64px (fracB 52,7%) và 16px (fracB 49,8%).
- **(b) Phổ tần số:** trên frame blend RGB đã render: hdiff/
  vdiff trung bình, HF = trung bình |pixel − trung bình 4 kề|
  theo kênh, tỉ lệ pixel lệch ngang kênh-max > 8.
- **(c) Cặp khác:** sàn crf0 của dissolve/circleopen trên cặp
  R1→R2 (R1 20–22s, R2 10–12s, 720×1280) — cặp NASA "sạch" đợt 23
  G6, đã biết crf14 XẤP XỈ / crf10 KHỚP cho dissolve.
- **(d) Probe chẩn đoán bổ sung (nảy sinh từ kết quả (a)–(c)):**
  khi (a) cho sàn 0,0000 và (c) cho HF cao hơn mà vẫn KHỚP, giả
  thuyết frand-HF mất sức thuyết phục → kiểm tra trực tiếp hệ số
  chuyển màu bằng script probe riêng (chuỗi mặc định vs ép bt601
  vs ép bt709 vs preview bt709 — tứ giác khép kín, §3).

## 2. Kết quả đối chứng (số thật; JSON đầy đủ tại benchmarks/results/v24-frand-control.json)

### 2.1. Hướng (a)+(b): cùng cặp K→L, 720×1280

| Blend | RGB24 | HF / hdiff / sharp | YUV420p crf14 | Sàn YUV crf0 |
|---|---|---|---|---|
| dissolve frand | 0,0039 KHỚP | HF 52,77 / 53,92 / 53,60% | 2,9697 / 95,36% XẤP XỈ | 1,6946 / 98,36% XẤP XỈ |
| fade (crossfade) | 0,5008 KHỚP | HF 1,17 / 2,20 / 3,78% | 1,4887 / 99,99% KHỚP | 1,3321 / 100% KHỚP |
| block64 | 0,0000 KHỚP | HF 2,07 / 3,30 / 7,93% | 0,4920 / 100% KHỚP | 0,0000 / 100% KHỚP |
| block16 | 0,0000 KHỚP | HF 4,36 / 5,51 / 9,91% | 0,4777 / 100% KHỚP | 0,0000 / 100% KHỚP |

Đọc: HF giảm 25× (52,77 → 2,07) thì sàn về 0 — bề ngoài ủng hộ
giả thuyết. NHƯNG ô block có cả hai phía bt601 (input rawvideo
không metadata), còn ô frand có chuỗi bt709 vs preview bt601 —
so sánh này bị confound bởi chuyển màu, không kết luận được một
mình. Nó chỉ có giá trị sau khi probe §3 gỡ confound: với chuyển
khớp, frand cũng về 0,0024 → tần số KHÔNG phải nguyên nhân sàn.

### 2.2. Hướng (c): cặp đối chứng R1→R2, 720×1280

| Transition | RGB24 | HF | YUV crf14 | Sàn YUV crf0 |
|---|---|---|---|---|
| dissolve | 0,0049 KHỚP | 74,79 | 2,7719 / 97,24% XẤP XỈ | 0,6615 / 99,95% KHỚP |
| circleopen | 0,4969 KHỚP | 2,09 | 1,2657 / 99,79% KHỚP | 0,8607 / 99,95% KHỚP |

Đọc: dissolve R1→R2 có HF blend (74,79) CAO HƠN K→L (52,77) mà
sàn vẫn KHỚP — mâu thuẫn trực tiếp với "HF cao → sàn trượt".
(Số crf14 dissolve 2,7719 nhỉnh hơn số G6 2,7581 một chút
0,0138; RGB 0,0049 so với 0,0050 — cùng verdict, chênh lệch ở
mức làm tròn/chọn frame của script khác nhau, không đổi kết
luận.)

### 2.3. Hướng (d): probe hệ số chuyển màu — bằng chứng quyết định

Cùng cặp K→L, dissolve, 720×1280, chỉ đổi phép chuyển:

| Chuỗi / preview | MAD-YUV | ≤8 | Verdict |
|---|---|---|---|
| xfade → format=yuv420p (mặc định, metadata bt709) vs preview bt601 | 1,6946 | 98,36% | XẤP XỈ (= đúng số đợt 23) |
| xfade → scale(out_color_matrix=bt601) → yuv420p vs preview bt601 | 0,0024 | 100% | KHỚP |
| xfade → scale(out_color_matrix=bt709) → yuv420p vs preview bt601 | 1,6946 | 98,36% | XẤP XỈ (= mặc định) |
| preview chuyển bt709 vs chuỗi mặc định | 0,0023 | 100% | KHỚP |

Tứ giác khép kín: ép-709 tái lập đúng mặc định (chứng tỏ mặc
định là bt709); khớp hệ số theo EITHER chiều đều về ~0,002.
Kết luận: **sàn trượt = lệch hệ số chuyển màu, không phải
subsample, không phải frand.** Mọi clip J/K/L/R1/R2 đều gắn
metadata bt709 (ffprobe: color_space/transfer/primaries đều
bt709, range tv) — chuỗi render tôn trọng metadata, còn phép
chuyển preview rawvideo mặc định bt601.

Hệ quả ở crf hữu hạn (chuyển KHỚP bt601 cả hai phía, K→L):

| Transition | crf14 | crf12 | crf10 |
|---|---|---|---|
| dissolve | 2,2843 / 98,69% XẤP XỈ | 1,8661 / 99,52% KHỚP | 1,5137 / 99,86% KHỚP |
| circleopen | 0,8036 / 99,99% KHỚP | — | — |

So với phương pháp mismatched đợt 23 (dissolve crf14 2,9697,
crf12 2,6349, crf10 2,3663): khớp chuyển màu cải thiện ~0,68 MAD
ở crf14 và đưa ngưỡng KHỚP về crf12 (thay vì "không có crf").

## 3. Quy tắc crf YUV sau đợt này (sửa lần 2)

| Nội dung (dissolve YUV, phương pháp cũ mismatched trừ khi ghi rõ) | crf14 | crf12 | crf10 | Sàn crf0 |
|---|---|---|---|---|
| Test pattern (R20 R6) | 1,8094 KHỚP | 1,4079 KHỚP | — | 0,0000 |
| Ngang phóng đêm → phim 1950 (R21 cặp 1) | 2,3436 XẤP XỈ | 1,9930 KHỚP | — | 0,6498 |
| Ngang phóng đêm → quỹ đạo (R21 cặp 2) | 1,6921 KHỚP | — | — | — |
| Dọc trường bắn → Iwo Jima (R22 cặp 1) | 1,9828 KHỚP | 1,6573 KHỚP | — | 0,5926 |
| Dọc trường bắn → organ-chip (R22 cặp 2) | 2,3471 XẤP XỈ | 2,1117 XẤP XỈ | 1,9464 KHỚP | 1,6307 |
| **Dọc Iwo Jima → organ-chip (R23/R24) — mismatched** | **2,9697 XẤP XỈ** | **2,6349 XẤP XỈ** | **2,3663 XẤP XỈ** | **1,6946 XẤP XỈ** |
| **Dọc Iwo Jima → organ-chip — KHỚP chuyển màu bt601** | **2,2843 XẤP XỈ** | **1,8661 KHỚP** | **1,5137 KHỚP** | **0,0024 KHỚP** |

Quy tắc thực hành MỚI: **đo parity YUV phải khớp hệ số chuyển
màu (preview bt709, hoặc ép chuỗi bt601); với chuyển khớp,
crf ≤ 10 cho KHỚP dissolve trên 6/6 nội dung đã đo (K→L KHỚP từ
crf12).** Các số mismatched cũ vẫn giữ giá trị lịch sử nhưng
KHÔNG được dùng để kết luận "ngoại lệ nội dung" nữa. Nợ phương
pháp cho đợt sau: cập nhật harnessShared.ffmpegRgbToYuv420 (hoặc
script đo) để chuyển preview bằng bt709 khi nguồn là bt709, rồi
đo lại các cặp cũ bằng phương pháp khớp để có bảng crf sạch
(không làm trong luồng này vì nhiệm vụ chỉ yêu cầu đối chứng +
ô còn thiếu, và sửa harness chung cần luồng riêng kiểm chứng
hồi quy).

## 4. Ô native 608×1080 (L-native) — đã đo (script R23, phương pháp mismatched cũ)

Cả hai cặp đều giữ verdict như ở 720p/1080p — độ phân giải
không đổi verdict, nhất quán với kết luận đợt 23:

| Cặp / type | RGB native | YUV crf14 | Sàn YUV crf0 |
|---|---|---|---|
| K→L dissolve | 0,0035 KHỚP | 2,9981 / 95,19% XẤP XỈ | 1,7118 / 98,35% XẤP XỈ |
| K→L circleopen | 0,4983 KHỚP | 1,7395 / 98,18% XẤP XỈ | 1,5165 / 98,23% XẤP XỈ |
| J→L dissolve | 0,0024 KHỚP | 2,3561 / 98,74% XẤP XỈ | 1,6475 / 99,99% KHỚP |
| J→L circleopen | 0,5039 KHỚP | 1,6160 / 99,89% KHỚP | 1,4153 / 100% KHỚP |

Lưu ý trung thực: các ô native này đo bằng script R23 nên vẫn
mang lệch chuyển màu mismatched. Probe §2.3 chạy lại ở 608×1080
cho dissolve K→L: mặc định 1,7118 (= đúng sàn native), ép-bt601
**0,0021 KHỚP**, ép-bt709 1,7118, preview-bt709 vs mặc định
0,0020 KHỚP — cùng cơ chế như 720p, nên sàn native "trượt" cũng
là artifact, không phải tính chất native. Không cần đo lại toàn
bộ native bằng phương pháp khớp trong luồng này (probe đã chứng
minh cơ chế tại đúng khung native).

## 5. Sàn crf0 ở 4K dọc — đã đo (upscale tổng hợp, scratch đĩa, không ENOSPC)

Cặp J→K, 2160×3840, nguồn 1080p upscale (vẫn KHÔNG có clip 4K
dọc thật — như đợt 23). Encode lossless 4K chạy trên đĩa
(/home, còn trống ~140GB), không chạm /tmp:

| Transition | RGB24 | Sàn YUV crf0 |
|---|---|---|
| dissolve | 0,0037 KHỚP (= đợt 23) | 0,5949 / 100% KHỚP |
| circleopen | 0,4977 KHỚP (= đợt 23) | 0,6741 / 100% KHỚP |

Cả hai sàn đều KHỚP ngay cả với phương pháp mismatched — nội
suy upscale làm mịn + nội dung J→K giữ lệch chuyển màu dưới
ngưỡng. Nợ 4K đã đóng: không còn ô 4K nào chưa đo ở mức sàn
(trừ footage 4K thật, vẫn chưa có nguồn).

## 6. Sự cố và bài học kỹ thuật trong lúc đo (ghi rõ, không giấu)

1. **Lỗi `-loop` với rawvideo** (lần chạy block đầu): `-loop 1`
   không phải option của demuxer rawvideo → sửa bằng filter
   `loop=loop=-1:size=1:start=0` trong filter_complex.
2. **Chuỗi maskedmerge 2s lệch khung không ổn định:** chuỗi RGB
   cho frame 47 = preview đúng tuyệt đối (MAD 0,0000), nhưng
   chuỗi có thêm `format=yuv420p` lại cho nội dung khác hẳn ở
   cùng chỉ số (MAD ~16,5, không frame nào khớp tốt) — framesync
   của maskedmerge với mask loop 25fps không đáng tin để đo
   theo chỉ số frame. Đã BỎ phương pháp này, thay bằng
   frame-concat: sinh 60 frame đơn lẻ bằng đúng lệnh 1-frame đã
   kiểm chứng, nối thành rawvideo 2s rồi encode; frame 45 được
   guard MAD < 0,01 so với preview TRƯỚC KHI encode (cả 2 cỡ
   khối đều qua guard; sàn block 0,0000 tự nó cũng là chứng cứ
   căn khung đúng). Chi tiết này quan trọng cho ai tái dùng
   maskedmerge để đo: đừng tin chỉ số frame của chuỗi maskedmerge
   nhiều input khác fps.
3. **Bug `--json=` trong script mới:** lần chạy đầu quên strip
   tiền tố `--json=` nên ghi JSON lỗi ENOENT ở cuối (sau khi mọi
   số đã in); đã sửa và chạy lại toàn bộ — lần 2 tái lập ĐÚNG
   TỪNG SỐ tới 4 chữ số thập phân (diff log rỗng).
4. **Script probe nhanh viết tay bị sai preview:** lần đo crf12/
   crf10 đầu cho MAD 45,9 vô lý — do bản rút gọn của
   `previewFrame` bỏ nhánh `geometric` trong khi dissolve có
   `geometric:true` + region `dissolve-noise`. Đã sửa bằng cách
   copy đủ 3 nhánh từ script R24; kết quả sau đó tái lập đúng
   crf14 = 2,2843 của probe chính. Số 45,9 KHÔNG đưa vào kết
   luận, chỉ ghi lại đây làm bài học.
5. **SHA256 clip tái kiểm chứng:** J 07c81538…740501e, K
   49f33b83…2db6d69c, L 0e2df0ee…33e3cdb8b3aa5f94 — trùng đợt
   22/23. R1/R2 tải mới qua script R23 (cổng NASA nhánh
   photographer): R1 608×1080, R2 608×1080, đều h264 dọc.

## 7. Giới hạn chưa làm được / nợ còn lại

- **Chưa cập nhật harness đo sang chuyển màu khớp** (nợ phương
  pháp §3): cần một luồng riêng sửa `ffmpegRgbToYuv420` (hoặc
  script đo) dùng bt709 khi nguồn bt709 + hồi quy toàn bộ bảng
  crf cũ bằng phương pháp khớp. Luồng này KHÔNG sửa harness
  chung để tránh ảnh hưởng các luồng khác khi chưa có kiểm
  chứng hồi quy.
- **Chưa đo crf12/crf10 khớp-chuyển-màu cho circleopen K→L**
  (đã KHỚP từ crf14 nên không cần cho quy tắc, nhưng bảng chưa
  đầy đủ); chưa đo fade khớp-chuyển-màu ở crf14 (mismatched đã
  KHỚP 1,4887 nên khớp-chuyển-màu chỉ tốt hơn, không đổi
  verdict).
- **Chưa có clip 4K dọc quay thật** (4K đợt này vẫn là upscale
  tổng hợp như đợt 23); chưa đo fade ở native/4K; chưa đo 79
  type còn lại trên footage dọc H.264.
- **Chưa đo lại các cặp cũ bằng phương pháp khớp** (R20–R22):
  số mismatched cũ vẫn đứng trong bảng §3 với nhãn rõ ràng.
- **Cảnh báo phát hành đợt 23 G6 vẫn nguyên:** J/K/L chỉ đo nội
  bộ, không đưa vào kho phát hành; R1/R2 là clip thay thế đạt
  chuẩn (đo ở đây chỉ dùng làm cặp đối chứng, không phải đóng
  gói phát hành).
- **Không sửa code sản phẩm** vì không phát hiện bug sản phẩm:
  render bt709 là đúng; lệch nằm ở phép so sánh của harness đo.

## 8. Kiểm chứng đã chạy (lệnh + kết quả)

- `bash scripts/fetch-r22-footage.sh /home/hatch/vcut-r24-footage`:
  exit 0; cổng IA/NASA OK cả 3 clip; ffprobe h264 + khung dọc +
  giải mã thử pass; SHA256 trùng đợt 22/23 cả 3 file.
- `bash scripts/fetch-r23-vertical-replacements.sh
  /home/hatch/vcut-r24-replacements`: exit 0; cổng NASA nhánh
  photographer OK cả 2 clip; ffprobe h264 608×1080 cả 2.
- `node --check` cả 2 script mới: pass.
- Native 608 (script R23): K→L crf14+crf0-ref exit 0, K→L crf0
  exit 0, J→L crf14 exit 0, J→L crf0 exit 0; số khung chính 720p
  tái lập đúng đợt 23 (dissolve 0,0039/2,9697/1,6946).
- Đối chứng K→L (script R24): chạy 2 lần, log diff rỗng — tái
  lập tuyệt đối; guard frame-45 và guard crf0 đều qua.
- Probe chuyển màu (720p + 608): exit 0 cả hai khung; tứ giác
  khép kín (ép-709 = mặc định, khớp 2 chiều về ~0,002).
- Probe crf12/crf10 khớp-chuyển-màu: tái lập crf14 = 2,2843
  trước khi tin crf12/crf10 (sau khi sửa bug preview §6.4).
- 4K sàn crf0 (script R24, scratch đĩa): exit 0; RGB tái lập
  đúng đợt 23 (0,0037/0,4977); không ENOSPC (đĩa còn ~140GB).
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code TS nào
  — script đo chỉ transpile module TS sang scratch để đo, như
  mẫu R21–R23). KHÔNG chạy click-test browser thật (nợ mở
  chung).

## 9. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `server/render/src/measure_r24_frand_control.js` (MỚI — thí
  nghiệm đối chứng: mosaic khối maskedmerge + phổ tần số + sàn
  crf0; phương pháp YUV ô block là frame-concat có guard, xem
  §6.2; cờ `--blocks`, `--crf0`, `--json`, env `R24_SCRATCH`/
  `R24_YUV_CRF`)
- `server/render/src/measure_r24_colorspace_probe.js` (MỚI —
  probe tứ giác chuyển màu bt601/bt709 + encode crf14 khớp-chuyển
  màu cho dissolve/circleopen)
- `benchmarks/results/v24-frand-control.json` (MỚI — toàn bộ số
  đo §2–§5 ở dạng JSON, kèm nhãn phương pháp mismatched/matched)
- `docs/PHASE9_ROUND24_H4_FRAND_CONTROL_LIMITS.md` (MỚI — chính file này)

KHÔNG đưa vào stage (đã xoá sau khi đo, ghi tên để đối chiếu):
binary mẫu `/home/hatch/vcut-r24-footage/clip-{j,k,l}-*.mp4`,
`/home/hatch/vcut-r24-replacements/clip-r{1,2}-*.mp4`, manifest
`LICENSES.txt` hai thư mục, toàn bộ thư mục scratch
`/home/hatch/vcut-r24-scratch/` (log đo, frame trung gian, mp4
chẩn đoán), các log đo `/home/hatch/vcut-r24-scratch/r24-*.log`.
Không tạo file binary nào trong repo. Không push, không
tag/release, không sửa code sản phẩm.
