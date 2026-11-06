# Phase 9 đợt 25 (luồng I1) — Harness đo khớp màu + đo lại bảng CRF cũ — LIMITS trung thực

> Đợt 25, luồng I1 (nối tiếp nợ phương pháp đợt 24 H4). Luật cứng đã giữ:
> KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
> release/tag, KHÔNG code giả, KHÔNG sửa code sản phẩm (chỉ sửa
> harness đo + thêm 2 script đo mới), KHÔNG đưa binary vào repo,
> KHÔNG dùng clip J/K/L/R1/R2/N1/N2 vào kho phát hành (chỉ đo trong
> scratch ngoài repo, đã xoá sau khi đo — cảnh báo phát hành đợt
> 22 §6.1 / đợt 23 G6 / đợt 24 H5 vẫn nguyên).
> Máy đo: VM 2 vCPU, FFmpeg/ffprobe 8.1.2. Scratch đo đặt trên đĩa
> (~/workspace/tmp-round25-i1, ngoài repo) — KHÔNG viết raw lớn vào
> /tmp (tmpfs 512MB); đo tuần tự trong luồng, xoá raw ngay sau mỗi
> ô đo (xem §7 xác nhận dọn).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **Harness đo đã có chế độ khớp màu tường minh.** `harnessShared.js`
  thêm `ffmpegRgbToYuv420Matched` (bắt buộc matrix), `probeColorMetadata`
  (đọc metadata bằng ffprobe) và `matrixForMetadata` (bt709→bt709,
  bt601/smpte170m→bt601, còn lại throw — không đoán). Hàm cũ
  `ffmpegRgbToYuv420` giữ nguyên filter legacy bt601 để số cũ tái
  lập đúng, nhưng nay in **cảnh báo MISMATCHED rõ ràng một lần mỗi
  tiến trình** khi caller không chỉ matrix, và trả nhãn `legacy:true`.
  Mặc định an toàn mới: không có matrix tường minh thì không được
  claim "khớp màu".
- **Bảng CRF cũ đã được đo lại bằng phương pháp khớp** (chuỗi sản
  phẩm mặc định + preview chuyển cùng matrix nguồn): 5 cặp ×
  dissolve ở crf 0/10/12/14, cộng circleopen K→L, mỗi ô encode **2
  lần, chênh lệch 0,0000 tuyệt đối** (xác định, không dao động).
- **"Ngoại lệ K→L" chính thức bị xoá khỏi bảng:** dissolve K→L KHỚP
  từ crf12 (1,8385), circleopen K→L KHỚP ở mọi crf (cao nhất 0,7981
  ở crf14). Toàn bộ 8 ô XẤP XỈ cũ của K→L đều đổi verdict thành
  KHỚP — đúng như dự báo của probe đợt 24 H4.
- **Quy tắc crf YUV SỬA LẠI (lần 3):** với chuyển màu khớp,
  **crf ≤ 10 vẫn là quy tắc an toàn phổ quát** (5/5 cặp KHỚP ở
  crf10), nhưng nay nó là quy tắc **thận trọng**, không còn là
  giới hạn cứng: 3/5 cặp KHỚP ngay từ crf14 (J→L, J→K, N1→N2),
  K→L KHỚP từ crf12, chỉ còn **R1→R2 là cặp ràng buộc thật**
  (KHỚP ở crf10, XẤP ở crf12 — ngưỡng nằm giữa 10 và 12). R1→R2
  cũng là cặp có HF blend cao nhất từng đo (74,79, đợt 24 H4) —
  nhất quán với nhận xét đợt 24: tần số cao không gây trượt sàn,
  nhưng vẫn tốn ở crf hữu hạn.
- **N1/N2 là trường hợp đặc biệt có thật:** metadata màu của cả 2
  clip đều `unknown` (ffprobe null) — harness auto **từ chối đoán**
  và chế độ probe thực nghiệm xác định matrix hiệu dụng của chuỗi
  mặc định là **bt601** (sàn crf0 0,0030 so với 0,7676 ở bt709,
  chênh 256×, không thể nhầm). Với bt601 hiệu dụng, dissolve N1→N2
  KHỚP ở mọi crf kể cả crf14 (1,8104).
- **Không phát hiện bug sản phẩm** → KHÔNG sửa code sản phẩm.
  Render dùng bt709 theo metadata nguồn là đúng; render nguồn
  unknown dùng bt601 cũng là hành vi mặc định đúng của FFmpeg.

## 1. Phương pháp mới — và 2 bug của chính luồng này (ghi rõ, không giấu)

### 1.1. Phương pháp khớp màu (đường đo chính)

- Chuỗi render GIỮ NGUYÊN như sản phẩm: xfade trên rgb24 rồi
  `format=yuv420p` MẶC ĐỊNH (FFmpeg dùng metadata nguồn). Không ép
  matrix ở chuỗi mặc định — đây là điểm khác với số matched của
  đợt 24 H4 (ép chuỗi về bt601); cả hai đều là "khớp", nhưng số
  đợt này đo đúng đầu ra sản phẩm thật. Đối chiếu §4: hai cách
  khớp cho K→L dissolve chênh nhau ≤ 0,037 MAD, cùng verdict mọi
  ô — hai triển khai khớp độc lập xác nhận lẫn nhau.
- Phía preview chuyển sang yuv420p bằng đúng matrix của nguồn:
  `auto` = đọc ffprobe cả 2 clip, hai bên phải đồng nhất, nếu
  không thì throw. `probe` = đo sàn crf0 của chuỗi mặc định so
  với preview-bt601 và preview-bt709, chọn sàn nhỏ hơn; nếu sàn
  nhỏ hơn vẫn không KHỚP thì throw (không gán theo cảm tính).
- Khung đo giữ đúng quy ước đợt 22–24: cửa sổ 2s mỗi clip, chuẩn
  hoá `fps=30,scale=720:1280,format=rgb24,settb=AVTB`, xfade
  duration=1 offset=1, frame giữa n=45 @30fps (A tại win+1,5s, B
  tại win+0,5s), libx264 preset medium, thang V6-tham-chiếu
  (KHỚP = MAD ≤ 2 VÀ ≥99% mẫu lệch ≤ 8).
- Guard căn khung mới: trước mỗi cặp/type, so RGB preview vs frame
  chuỗi rgb24 tại n=45 — phải KHỚP mới đo YUV (tránh số YUV của
  khung lệch, bài học maskedmerge đợt 24). Mọi guard đợt này đều
  KHỚP (dissolve 0,0027–0,0052; circleopen 0,4995 — mức làm tròn
  ~0,5 đã biết từ đợt 23, không đổi verdict).

### 1.2. Bug 1 (của script mới): output rawvideo không ghi `-pix_fmt` làm lệch chọn frame

- Triệu chứng: lần validation đầu cho guard RGB MAD **76,9445
  LỆCH** trong khi probe R24 gốc chạy lại cùng lúc tái lập đúng
  từng số (1,6946 / 0,0024 / 2,2843 / 0,8036).
- Chẩn đoán (thí nghiệm, không đoán): chuỗi xfade+select n=45 ra
  rawvideo KHÔNG ghi `-pix_fmt` cho frame có MAD 76,9445 — đúng
  bằng frame 46 của chuỗi giải mã đầy đủ (lệch chỉ số do ffmpeg
  tự đàm phán format ở output); cùng chuỗi đó ghi rõ
  `-pix_fmt rgb24` cho MAD **0,0039 KHỚP** (đúng số RGB đợt 24).
  Chuỗi 1 input (sourceFrame) không lộ lỗi này, nhưng vẫn được
  ghi tường minh cho đồng nhất.
- Sửa: mọi output rawvideo trong script mới đều ghi `-pix_fmt`
  tường minh (rgb24 cho guard/sourceFrame, yuv420p cho decode —
  decode vốn đã ghi). **Bài học cho mọi script đo sau này: không
  bao giờ để ffmpeg tự chọn pix_fmt ở output rawvideo khi đo theo
  chỉ số frame.** Số 76,9445 KHÔNG đưa vào kết luận.
- Hệ quả kiểm chứng: sau khi sửa, validation tái lập đúng số
  forced-601 đợt 24 (dissolve K→L crf14 = 2,2843, §2) trước khi
  tin bất kỳ số matched mới nào.

### 1.3. Bug 2 (của script mới): vòng parseArgs lặp vô hạn với flag `--probe-only`

- Triệu chứng: lượt probe N1/N2 đầu chạy > 6 phút, node 93,6% CPU,
  không có tiến trình ffmpeg con, không tạo được thư mục scratch
  (chưa tới bước tạo scratch) — kẹt ngay ở parse tham số.
- Nguyên nhân: nhánh `--probe-only` làm `i--` trong khi cuối vòng
  lặp chỉ tăng `i` cho tham số có value; cộng với `i++` của header
  vòng lặp, chỉ số quay lại đúng vị trí cũ → lặp vô hạn.
- Sửa: bỏ `i--` (flag không value thì vòng lặp tự tăng). Đã kill
  tiến trình kẹt (không còn tiến trình đo nào, không để lại
  scratch — vì chưa tới bước tạo scratch), chạy lại probe và tái
  lập đúng 2 sàn (0,0030 / 0,7676) ở cả lần probe-only và lần quét
  đầy đủ. Không số nào từ lượt kẹt được dùng (lượt đó chưa sinh
  số nào).

### 1.4. Cách ép/đọc metadata từng bên (ghi rõ, không đoán)

- Đọc: `ffprobe -select_streams v:0 -show_entries
  stream=codec_name,width,height,color_space,color_transfer,
  color_primaries,color_range -of json`. J/K/L/R1/R2: cả 4 trường
  đều bt709, range tv. N1/N2: cả 4 trường đều null (unknown).
- Ép phía preview: filter `scale=out_color_matrix=<matrix>,
  format=yuv420p` trên input rawvideo rgb24 (đúng cách probe đợt
  24 đã chứng minh: preview-bt709 vs chuỗi mặc định = 0,0023).
- Ép phía chuỗi (chỉ dùng cho validation, không dùng cho bảng
  chính): `scale=out_color_matrix=bt601,format=yuv420p` thay cho
  `format=yuv420p` trong graph xfade.
- Không có bước nào đoán matrix từ độ phân giải, fps hay tên
  file. Nguồn mismatch (A bt709, B bt601) chưa gặp — script sẽ
  throw nếu gặp, đó là hành vi đúng, chưa phải là tính năng thiếu
  cần lấp bằng đoán mò.

## 2. Validation: tái lập số matched đợt 24 trước khi tin số mới

K→L dissolve, chuỗi ép bt601 + preview bt601 (đúng phương pháp
đợt 24 H4 §2.3), guard RGB 0,0039 KHỚP:

| Ô | Đợt 24 H4 | Đợt này (script mới) | Chênh |
|---|---|---|---|
| dissolve crf14 | 2,2843 / 98,69% XẤP XỈ | 2,2843 / 98,69% XẤP XỈ | 0,0000 |

Script mới tái lập đúng tới 4 chữ số thập phân — đủ cơ sở để tin
các số matched mới ở §3 (chuỗi mặc định + preview bt709) khi chúng
chỉ chênh ≤ 0,037 so với số forced-601 tương ứng.

## 3. Kết quả đo lại — bảng khớp màu mới (chuỗi sản phẩm mặc định)

Khung 720×1280, frame 45, libx264 preset medium. Mỗi ô encode 2
lần: **chênh lệch lần 1–lần 2 = 0,0000 MAD và 0,0000 ≤8 ở mọi ô**
(xác định tuyệt đối, repeatVerdictMatch=true mọi ô) nên bảng chỉ
ghi 1 số/ô. Cửa sổ: K→L: K 28–30s, L 24–26s; J→L: J 28–30s, L
24–26s; J→K: J 28–30s, K 28–30s; R1→R2: R1 20–22s, R2 10–12s;
N1→N2: N1 10–12s, N2 10–12s.

### 3.1. Dissolve — số mới (preview matrix trong ngoặc)

| Cặp (matrix preview) | crf14 | crf12 | crf10 | Sàn crf0 |
|---|---|---|---|---|
| K→L (bt709 auto) | 2,2475 / 98,71% XẤP XỈ | 1,8385 / 99,53% **KHỚP** | 1,4873 / 99,86% **KHỚP** | 0,0023 / 100% **KHỚP** |
| J→L (bt709 auto) | 1,6567 / 99,78% **KHỚP** | 1,3145 / 99,94% **KHỚP** | 1,0350 / 99,98% **KHỚP** | 0,0018 / 100% **KHỚP** |
| J→K (bt709 auto) | 1,8381 / 99,79% **KHỚP** | 1,4848 / 99,95% **KHỚP** | 1,1844 / 99,99% **KHỚP** | 0,0019 / 100% **KHỚP** |
| R1→R2 (bt709 auto) | 2,6093 / 97,92% XẤP XỈ | 2,1307 / 99,39% XẤP XỈ | 1,7184 / 99,85% **KHỚP** | 0,0031 / 100% **KHỚP** |
| N1→N2 (bt601 probe) | 1,8104 / 99,56% **KHỚP** | 1,4724 / 99,87% **KHỚP** | 1,1853 / 99,95% **KHỚP** | 0,0030 / 100% **KHỚP** |

### 3.2. Circleopen K→L (bt709 auto, guard RGB 0,4995 KHỚP)

| Ô | crf14 | crf12 | crf10 | Sàn crf0 |
|---|---|---|---|---|
| circleopen K→L | 0,7981 / 99,99% **KHỚP** | 0,7165 / 100% **KHỚP** | 0,6421 / 100% **KHỚP** | 0,3284 / 100% **KHỚP** |

Lưu ý trung thực: sàn circleopen (0,3284) không về ~0 như sàn
dissolve (0,0023) dù cùng phương pháp khớp — vì preview
circleopen vốn có sai số làm tròn RGB ~0,5 (MAD RGB 0,4995, đã
biết từ đợt 23) và sai số đó lọt vào miền YUV. Đây là giới hạn
của mô hình preview hình học (đánh giá tại chỉ số nguyên), không
phải lệch chuyển màu: sàn vẫn KHỚP với biên rộng (0,33 so với
ngưỡng 2,0). Đừng trích "sàn circleopen 0,33" thành bằng chứng
lệch màu.

### 3.3. Probe matrix hiệu dụng cho N1/N2 (nguồn metadata unknown)

| So sánh (dissolve, chuỗi mặc định crf0) | MAD-YUV | ≤8 | V6 |
|---|---|---|---|
| vs preview-bt601 | 0,0030 | 100% | KHỚP |
| vs preview-bt709 | 0,7676 | 99,84% | KHỚP (nhưng kém 256×) |

Đọc: cả hai đều qua ngưỡng V6, nhưng chỉ bt601 cho sàn ≈ 0 —
matrix hiệu dụng là bt601, không mơ hồ. Giải thích nhất quán:
nguồn không gắn metadata thì FFmpeg mặc định dùng bt601 ở cả
hai chiều chuyển (nguồn→RGB và RGB→YUV), nên chuỗi mặc định
tương đương chuỗi ép bt601. Kết luận này chỉ áp dụng cho cặp
N1/N2 đã đo, không tổng quát hoá thành "mọi clip unknown đều
bt601" khi chưa đo thêm (nhưng script probe đã có sẵn để đo
trường hợp mới nào cũng được, không cần đoán).

## 4. Đối chiếu cũ → mới: số nào đổi verdict do phương pháp

MAD ghi dạng cũ (mismatched, đợt 22–24) → mới (khớp, đợt này).
"ĐỔI" = verdict khác; "GIỮ" = cùng verdict (dù số tốt hơn);
"MỚI" = ô chưa từng đo.

### 4.1. Dissolve

| Cặp / ô | Cũ (mismatched) | Mới (khớp) | Kết luận |
|---|---|---|---|
| K→L crf14 | 2,9697 XẤP XỈ | 2,2475 XẤP XỈ | GIỮ (cải thiện 0,72) |
| K→L crf12 | 2,6349 XẤP XỈ | 1,8385 KHỚP | **ĐỔI do phương pháp** |
| K→L crf10 | 2,3663 XẤP XỈ | 1,4873 KHỚP | **ĐỔI do phương pháp** |
| K→L crf0 | 1,6946 XẤP XỈ | 0,0023 KHỚP | **ĐỔI do phương pháp** |
| J→L crf14 | 2,3471 XẤP XỈ | 1,6567 KHỚP | **ĐỔI do phương pháp** |
| J→L crf12 | 2,1117 XẤP XỈ | 1,3145 KHỚP | **ĐỔI do phương pháp** |
| J→L crf10 | 1,9464 KHỚP | 1,0350 KHỚP | GIỮ (cải thiện 0,91) |
| J→L crf0 | 1,6307 KHỚP | 0,0018 KHỚP | GIỮ (sàn về ~0) |
| J→K crf14 | 1,9828 KHỚP (biên 0,0172) | 1,8381 KHỚP (biên 0,1619) | GIỮ (biên nới 9×) |
| J→K crf12 | 1,6573 KHỚP | 1,4848 KHỚP | GIỮ |
| J→K crf10 | — (không đo) | 1,1844 KHỚP | MỚI |
| J→K crf0 | 0,5926 KHỚP | 0,0019 KHỚP | GIỮ (sàn về ~0) |
| R1→R2 crf14 | 2,7719 XẤP XỈ | 2,6093 XẤP XỈ | GIỮ (cải thiện 0,16) |
| R1→R2 crf12 | — (không đo) | 2,1307 XẤP XỈ | MỚI |
| R1→R2 crf10 | — (không đo) | 1,7184 KHỚP | MỚI |
| R1→R2 crf0 | 0,6615 KHỚP | 0,0031 KHỚP | GIỮ (sàn về ~0) |
| N1→N2 crf14/12/10/0 | — (chưa từng đo YUV) | 1,8104 / 1,4724 / 1,1853 / 0,0030, đều KHỚP | MỚI toàn bộ |

### 4.2. Circleopen K→L — cả 4 ô đều ĐỔI do phương pháp

| Ô | Cũ (mismatched) | Mới (khớp) |
|---|---|---|
| crf14 | 1,6902 / 98,22% XẤP XỈ | 0,7981 / 99,99% KHỚP |
| crf12 | 1,6458 / 98,21% XẤP XỈ | 0,7165 / 100% KHỚP |
| crf10 | 1,6081 / 98,24% XẤP XỈ | 0,6421 / 100% KHỚP |
| crf0 | 1,5031 / 98,22% XẤP XỈ | 0,3284 / 100% KHỚP |

### 4.3. Đối chiếu hai cách khớp (K→L dissolve) — kiểm chứng chéo

| Ô | Khớp kiểu đợt 24 (ép chuỗi bt601) | Khớp kiểu đợt này (chuỗi mặc định + preview bt709) | Chênh |
|---|---|---|---|
| crf14 | 2,2843 XẤP XỈ | 2,2475 XẤP XỈ | 0,0368 |
| crf12 | 1,8661 KHỚP | 1,8385 KHỚP | 0,0276 |
| crf10 | 1,5137 KHỚP | 1,4873 KHỚP | 0,0264 |
| crf0 | 0,0024 KHỚP | 0,0023 KHỚP | 0,0001 |

Cùng verdict mọi ô; chênh nhỏ và cùng chiều (chuỗi bt709 cho số
nhỉnh hơn ~0,03, vì lượng tử hoá trong không gian YUV khác nhau).
Từ nay bảng chuẩn dùng cách đợt này (đo đúng đầu ra sản phẩm);
số forced-601 đợt 24 giữ giá trị đối chứng, không dùng làm bảng
chính nữa.

## 5. Quy tắc crf YUV sau đợt này (sửa lần 3 — thay quy tắc lần 2)

| Nội dung (dissolve YUV, phương pháp KHỚP) | crf14 | crf12 | crf10 | Sàn crf0 |
|---|---|---|---|---|
| K→L (Iwo Jima → organ-chip) | XẤP XỈ | KHỚP | KHỚP | KHỚP (~0) |
| J→L (trường bắn → organ-chip) | KHỚP | KHỚP | KHỚP | KHỚP (~0) |
| J→K (trường bắn → Iwo Jima) | KHỚP | KHỚP | KHỚP | KHỚP (~0) |
| R1→R2 (vòm tên lửa → trăng/bệ phóng) | XẤP XỈ | XẤP XỈ | KHỚP | KHỚP (~0) |
| N1→N2 (sóng thần → băng biển, bt601) | KHỚP | KHỚP | KHỚP | KHỚP (~0) |

Quy tắc thực hành: **crf ≤ 10 cho KHỚP dissolve trên 5/5 nội dung
đã đo** (giữ nguyên mệnh đề của lần 2, nhưng với cơ sở đo sạch);
crf14 đủ cho 3/5 cặp, crf12 đủ cho 4/5 cặp; cặp ràng buộc duy
nhất còn lại là R1→R2 (ngưỡng giữa crf10 và crf12). "Ngoại lệ
K→L" không còn tồn tại ở bất kỳ dạng nào: cả dissolve lẫn
circleopen của nó đều KHỚP với phương pháp khớp. Mọi trích dẫn
bảng crf đợt 20–23 từ nay phải kèm nhãn "mismatched (cũ)" hoặc
dùng bảng §3/§5 này thay thế.

## 6. Cái gì chưa đo được và vì sao

- **Cặp ngang đợt 21 (phóng đêm → phim 1950 / → quỹ đạo):** chưa
  đo lại bằng phương pháp khớp — cần tải lại footage ngang đợt
  21 bằng script riêng của đợt đó; nằm ngoài phạm vi 4 cặp nhiệm
  vụ giao (K→L, J→L, R1→R2, N1→N2) cộng bonus J→K. Số mismatched
  cũ của 2 cặp này (crf14 2,3436 XẤP XỈ / 1,6921 KHỚP; sàn 0,6498)
  vẫn đứng với nhãn cũ, chưa được thay bằng số khớp.
- **Test pattern đợt 20 R6 (sàn 0,0000, crf14 1,8094 KHỚP):** chưa
  đo lại — nguồn là pattern tổng hợp không có metadata bt709
  thật nên "khớp" ở đây cần định nghĩa lại bằng probe (như N1/N2),
  không tự gán bt709. Không mạo nhận số cũ là số khớp.
- **Các ô native 608×1080 và 4K upscale đợt 23/24:** chưa đo lại
  toàn bộ bằng phương pháp khớp — probe tại 608 của đợt 24 đã
  chứng minh cùng cơ chế chuyển màu ở khung native (ép-bt601
  0,0021 KHỚP), và sàn 4K đợt 24 đã KHỚP ngay cả khi mismatched,
  nên không có lý do tin verdict các ô đó sẽ đổi; nhưng đó là
  suy luận, không phải số đo lại — ghi rõ để không ai trích thành
  "đã đo lại native/4K".
- **Circleopen các cặp còn lại, fade, fadeblack ở miền YUV khớp:**
  chưa đo lại (fade mismatched đã KHỚP 1,4887 nên khớp-chuyển-màu
  chỉ tốt hơn; fadeblack LỆCH do mô hình preview, không do màu —
  xem đợt 24 H3, vẫn giữ badge `approx`).
- **Nguồn A bt709 + B bt601 (mismatch thật giữa 2 clip):** chưa
  gặp, script throw có chủ đích — cách xử lý đúng cho trường hợp
  này (matrix nào cho preview?) là câu hỏi mở cho đợt sau, không
  được lấp bằng đoán mò trong đợt này.
- **79 type còn lại trên footage dọc:** như mọi đợt trước, chỉ
  dissolve (+ circleopen K→L) được đo lại ở đây; các type khác
  vẫn mang số mismatched cũ hoặc chưa có số.

## 7. Kiểm chứng đã chạy (lệnh + kết quả số thật)

- Fetch (cổng license của script gốc, không tự tải tay):
  `bash scripts/fetch-r22-footage.sh <scratch>/footage` exit 0;
  `bash scripts/fetch-r23-vertical-replacements.sh <scratch>/footage-r`
  exit 0; `bash scripts/fetch-r24-vertical-nonsSpace.sh
  <scratch>/footage-n` exit 0. SHA256 trùng đợt 22/23/24:
  J 07c81538…740501e, K 49f33b83…2db6d69c, L 0e2df0ee…33e3cdb8b3aa5f94,
  N1 2ede4e15…, N2 a7d8eb96… (trùng đợt 24 H5). R1/R2 đợt 24 không
  ghi SHA; SHA đo đợt này (ghi đầy đủ tại đây để đối chiếu khi tải
  lại): R1 45827cd393e8af410369cd9a0d3f7ee3e63082235653f6fc5d647afee37a9cde,
  R2 a4d82f82c3a2c4b61654b1a97aef4a85e1cba8a18e8ec82dfbe902fdc4218139.
- `node --check` harnessShared.js, test_r25_color_matched_harness.js,
  measure_r25_color_matched_crf.js: pass cả 3.
- Self-test harness (`R25_SCRATCH=<scratch> node
  server/render/src/test_r25_color_matched_harness.js`): **ALL
  PASS** — T1 probe bt709, T2 matrix map, T3 throw unknown/thiếu/
  bt2020, T4 matched thiếu/lạ matrix throw, T5 matched bt709 ==
  ffmpeg scale bt709 (MAD 0), T6 legacy cảnh báo + khác bt709
  (MAD 12,4583) + bằng explicit bt601 (MAD 0), T7 compare matched
  MAD 0 + khung lẻ 72×45 pad MAD 0, T8 clip không metadata →
  unknown → throw. (Lần chạy đầu T1 trượt do clip tổng hợp không
  ghi transfer/primaries — đã nới T1 chỉ bắt color_space, trường
  quyết định matrix; xem file test.)
- Probe R24 gốc chạy lại: tái lập đúng 1,6946 / 0,0024 / 1,6946 /
  0,0023 / 2,2843 / 0,8036 — chứng tỏ số cũ không sai do môi trường
  thay đổi, chỉ sai do phương pháp.
- Validation script mới (forced-601): guard RGB 0,0039 KHỚP,
  dissolve K→L crf14 = 2,2843 đúng số đợt 24.
- Quét chính (mỗi ô 2 lần, diff 0,0000 mọi ô): K→L dissolve +
  circleopen, J→L dissolve, R1→R2 dissolve, N1→N2 dissolve
  (probe bt601), J→K dissolve bonus — exit 0 mọi lượt, JSON từng
  lượt đã ghi, gộp tại benchmarks/results/v25-color-matched-crf.json.
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code TS nào —
  script đo chỉ transpile 2 module TS sang scratch để đo, như mẫu
  R21–R24; harnessShared là JS thuần, đã node --check). KHÔNG chạy
  click-test browser thật (nợ mở chung).
- Dọn scratch: toàn bộ ~/workspace/tmp-round25-i1 đã xoá sau khi
  gộp JSON (footage, clip tải, thư mục chạy r24-cs-*, r25-cm-*,
  JSON tạm). Xác nhận bằng `ls` trước khi báo (xem §8).

## 8. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `server/render/src/harnessShared.js` (SỬA — thêm § đợt 25 I1:
  cảnh báo legacy ở ffmpegRgbToYuv420 + opts.matrix;
  ffmpegRgbToYuv420Matched, probeColorMetadata, matrixForMetadata,
  ffmpegYuvCompareMatched; ffmpegYuvCompare truyền opts qua;
  hành vi cũ ngoài cảnh báo không đổi)
- `server/render/src/test_r25_color_matched_harness.js` (MỚI —
  self-test T1–T8, tự tạo clip tổng hợp nhỏ, tự xoá scratch)
- `server/render/src/measure_r25_color_matched_crf.js` (MỚI — script
  đo crf khớp màu: auto/probe/bt709/bt601, chain default/forced,
  guard RGB, repeat 2, --probe-only; sửa 2 bug §1.2/§1.3 trong lúc
  làm)
- `benchmarks/results/v25-color-matched-crf.json` (MỚI — toàn bộ
  số đo §3–§4 ở dạng JSON, kèm metadata nguồn và matrix đã dùng)
- `docs/PHASE9_ROUND25_I1_COLOR_MATCHED_HARNESS_LIMITS.md` (MỚI —
  chính file này)

KHÔNG đưa vào stage (đã xoá sau khi đo, ghi tên để đối chiếu):
toàn bộ ~/workspace/tmp-round25-i1/ (footage J/K/L/R1/R2/N1/N2,
manifest LICENSES.txt, thư mục chạy r24-cs-odW6XW, các thư mục
r25-cm-*, JSON tạm r25-*.json). Không tạo file binary nào trong
repo. Không push, không tag/release, không sửa code sản phẩm.

## 9. Xác nhận dọn scratch (chạy trước khi báo cáo)

```
$ ls ~/workspace/tmp-round25-i1/
ls: cannot access '/home/hatch/workspace/tmp-round25-i1/': No such file or directory
```

(Thư mục đã bị xoá hoàn toàn — xem lệnh dọn ở §7. Nếu parent kiểm
tra mà vẫn thấy thư mục này thì đó là dữ liệu mới, không phải của
luồng này.)
