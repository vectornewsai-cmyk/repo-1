# Phase 9 đợt 23 (luồng G5) — parity footage dọc VÒNG 2: LIMITS trung thực

> Đợt 23, luồng G5 (nối tiếp đợt 22 luồng D). Luật cứng đã giữ: KHÔNG
> push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
> KHÔNG code giả, KHÔNG sửa code sản phẩm (chỉ thêm script đo mới),
> KHÔNG đưa binary vào repo, KHÔNG dùng clip J/K/L vào kho phát hành
> (chỉ đo trong /tmp — cảnh báo phát hành đợt 22 §6.1 vẫn nguyên).
> Máy đo: VM 2 vCPU, FFmpeg/ffprobe 8.1.2, /tmp tmpfs 512MB (chính
> giới hạn này gây ra 2 sự cố ENOSPC ở §6 — ghi rõ, không giấu).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **Quy tắc "crf ≤ 10 cho KHỚP YUV" của đợt 22 KHÔNG tổng quát hoá
  được.** Trên cặp dọc MỚI K→L (Iwo Jima → organ-chip), dissolve
  miền YUV **không về KHỚP ở bất kỳ crf nào**: crf14 2,9697 →
  crf12 2,6349 → crf10 2,3663 → crf8 2,1710 → **sàn crf0 1,6946 mà
  vẫn chỉ XẤP XỈ** — vì tiêu chí V6 là tiêu chí KÉP (MAD ≤ 2 VÀ
  ≥99% pixel lệch ≤ 8): sàn crf0 có MAD 1,6946 (đạt) nhưng chỉ
  98,36% pixel ≤ 8 (trượt). Sàn là giới hạn tốt nhất có thể của
  pipeline (encode lossless = đúng frame blend miền YUV), nên
  **KHỚP miền YUV cho dissolve trên cặp này là KHÔNG ĐẠT ĐƯỢC,
  không phải "cần crf thấp hơn"**. Circleopen cùng cặp cũng vậy:
  sàn crf0 1,5031 / 98,22% → XẤP XỈ. Đây là lần đầu cả 2 type đều
  có sàn trượt tiêu chí ≤ 8.
- **Yếu tố quyết định là NỘI DUNG, không phải độ phân giải.**
  Cặp J→L ở native 1080×1920 cho số gần như đồng nhất với 720×1280
  đợt 22 (dissolve crf14 2,3568 so với 2,3471; crf10 1,9456 so với
  1,9464) — ngưỡng crf ≤ 10 của cặp này giữ nguyên khi lên
  native. Cặp K→L ở native cũng không được cứu (sàn 1,6737 /
  98,39%, gần như sàn 720p 1,6946 / 98,36%).
- **RGB24: mọi cặp × mọi type đều KHỚP** (MAD 0,0022–0,5033,
  100% ≤ 8), kể cả 4K upscale. Parity preview–render ở miền RGB
  vẫn tuyệt đối; vấn đề chỉ nằm ở miền YUV (blend miền + subsample
  4:2:0), không phải bug preview hay render.
- **Fade (crossfade tuyến tính) KHỚP miền YUV ở crf14 trên chính
  cặp K→L mà dissolve trượt** (1,4887 / 99,99%) — gợi ý cơ chế ở
  §5: dissolve dùng mosaic nhiễu từng pixel (frand chọn A hoặc B)
  nên frame blend giàu tần số cao, subsample 4:2:0 phá nặng hơn
  blend mịn của fade. Đây là GIẢ THUYẾT nhất quán với số đo,
  chưa chứng minh nhân quả.
- **Fadeblack LỆCH theo thiết kế của preview, không phải bug
  render.** Preview của module thật (describeTransition) mô tả
  fadeblack bằng blend alpha tuyến tính và BỎ QUA màu trung gian
  (ghi rõ trong code); render FFmpeg đi qua đen thật nên tại
  p=0,5 render gần đen trong khi preview là blend 50/50 → MAD
  RGB 34,6082. Muốn parity cho fadeblack phải dạy preview mô hình
  dip qua đen — nợ mới, không phải lỗi encode.
- **4K dọc là UPSCALE TỔNG HỢP, không phải 4K quay thật.**
  Nguồn chỉ 1080p, chain scale=2160:3840 nội suy lên. Parity ở
  4K upscale vẫn KHỚP cả 2 type ở crf14 (dissolve 1,9448,
  circleopen 0,7658). Bản ~orig.mp4 của L đã thăm dò từ xa bằng
  ffprobe (không tải): 608×1080 — không phải 4K, nên không có clip
  4K dọc thật nào được dùng trong đợt này.
- **2 lần chạy 4K chết vì /tmp đầy (ENOSPC)** — số dissolve crf14
  đã in trước khi chết được chạy lại và tái lập đúng tới 4 chữ
  số thập phân; số crf10 được tái tính từ file còn sống sau sự
  cố (§6). Không số nào trong file này là số bịa từ lần chạy chết.

## 1. Clip tái sử dụng (xác minh lại, không tin nhãn cũ)

Chạy lại `scripts/fetch-r22-footage.sh` vào `/tmp/vcut-r23-footage`
ngày 30/10/2026. Script tự kiểm tra license qua API sơ cấp TRƯỚC
KHI TẢI (không tin kết quả đợt 22):

- J: IA metadata API OK — licenseurl publicdomain mark, creator
  U.S. Naval Hospital Twentynine Palms; ffprobe sau tải h264
  1080×1920 25fps; SHA256 **trùng đợt 22**
  (07c81538…740501e).
- K: IA metadata API OK — licenseurl publicdomain mark, creator
  U.S. Defense Health Agency; ffprobe sau tải h264 1080×1920
  23,976fps; SHA256 **trùng đợt 22** (49f33b83…2db6d69c).
- L: NASA images-api OK — center HQ, photographer trống (nhánh yếu
  như đợt 22, đã ghi rõ); ffprobe sau tải h264 608×1080 30fps;
  SHA256 **trùng đợt 22** (0e2df0ee…33e3cdb8b3aa5f94).
- L bản ~orig.mp4: thăm dò từ xa bằng ffprobe qua HTTP (không tải
  về, không tốn /tmp): h264 608×1080, 75,742 s, 92.674.959 byte —
  **không phải 4K**. Vì vậy không tạo script fetch-r23-footage.sh:
  không có clip mới nào để fetch; ô 4K dùng upscale tổng hợp và
  ghi rõ là upscale (xem §4).
- Kiểm tra bằng mắt thêm: K @29,5s (frame A của cặp mới K→L) là
  tư liệu màu hoá (không đen trắng như K @28,5s đợt 22): lính cõng
  thương binh, chữ "7,677 casualties" + subtitle "evacuated 7,677
  casualties" — vùng tối lớn + biên tương phản gắt, nhất quán với
  khe YUV lớn của cặp này. Cảnh báo phát hành đợt 22 §6.1 (tư liệu
  chiến tranh + thương vong) càng đúng với frame này.

## 2. Script đo mới (thay đổi có chủ đích so với R22)

`server/render/src/measure_r23_vertical_parity.js` (chuyển thể từ
script R22, `node --check` pass; không sửa code sản phẩm, không sửa
harness chung):

1. **Ô YUV nhận tham số khung (w,h)** thay vì luôn dùng khung
   chính — sửa "lỗi tiềm ẩn" của R22: `renderXfadeYuv` dùng W,H
   toàn cục (R22 không lộ vì ô YUV chỉ chạy ở khung chính, nhưng
   ô YUV-native mới cần đúng khung native).
2. **Cờ `--yuv-native`**: chạy thêm ô YUV e2e ở đúng khung native
   (R22 chỉ có ô native RGB24).
3. **Type fade/fadeblack qua cùng khung xfade** — không cần code
   riêng: `xfade=transition=fade` (crossfade tuyến tính) và
   `=fadeblack` (qua đen); preview lấy từ chính `describeTransition`
   của module thật nên kết quả fadeblack LỆCH phản ánh đúng mô
   hình preview hiện tại, không phải setup sai.

Phương pháp còn lại giữ nguyên R21/R22: ép rgb24 TRƯỚC xfade
(`fps=30,scale=W:H,format=rgb24,settb=AVTB`), xfade duration=1
offset=1, frame giữa n=45 @30fps (p=0,5), thang V6 (KHỚP = MAD ≤ 2
và ≥99% ≤ 8; XẤP XỈ = MAD ≤ 20 và ≥90% ≤ 8). Ô YUV e2e: libx264
preset medium, crf qua `R23_YUV_CRF`, decode frame 45 ra yuv420p
raw (+ rgb24 đối chứng), so với preview chuyển sang yuv420p bằng
chính FFmpeg. Cửa sổ đo: K→L: K 28–30s, L 24–26s; J→L native:
J 28–30s, L 24–26s; J→K 4K: J 28–30s, K 28–30s (ngữ nghĩa xfade
trong cửa sổ giữ nguyên: A(win+1,5), B(win+0,5)). Đối chứng trích
lặp frame A: tổng lệch tuyệt đối = **0** ở mọi cặp (chuỗi chuẩn
hoá xác định). RGB lặp lại đúng tới 4 chữ số thập phân giữa các
lần chạy crf khác nhau và giữa lần chạy chết/chạy lại ở 4K.

## 3. Kết quả đo (số thật; file JSON đầy đủ tại benchmarks/results/v23-vertical-parity.json)

### 3.1. Cặp MỚI K→L (Iwo Jima → organ-chip), 720×1280

| Transition | RGB24 | YUV420p crf14 | YUV420p crf12 | YUV420p crf10 | Sàn YUV crf0 |
|---|---|---|---|---|---|
| dissolve | 0,0039 / 100% / **KHỚP** | 2,9697 / 95,36% / XẤP XỈ | 2,6349 / 96,70% / XẤP XỈ | 2,3663 / 97,53% / XẤP XỈ | 1,6946 / 98,36% / XẤP XỈ |
| circleopen | 0,4995 / 100% / **KHỚP** | 1,6902 / 98,22% / XẤP XỈ | 1,6458 / 98,21% / XẤP XỈ | 1,6081 / 98,24% / XẤP XỈ | 1,5031 / 98,22% / XẤP XỈ |

Quét bổ sung dissolve crf8: 2,1710 / 97,94% / XẤP XỈ — đường cong
crf14→12→10→8→0 đơn điệu tiến về sàn (2,97→2,63→2,37→2,17→1,69)
nhưng **không bao giờ chạm KHỚP vì chân ≤ 8 kẹt ở 98,2–98,4% ở
mọi crf, kể cả lossless**. Cột MAD-RGB-decode của dissolve trượt
LỆCH ở mọi crf (12,9→12,2, ≤ 8 chỉ ~56–60%) — subsample 4:2:0 phá
mạnh trên cặp này; của circleopen về KHỚP từ crf12 (1,9951) sau
khi XẤP XỈ ở crf14 (2,0592), giống mẫu cặp J→L đợt 22.

### 3.2. Cặp J→L ở NATIVE 1080×1920 (J native; L upscale 608→1080 trong cùng chain)

| Transition | RGB24 | YUV420p crf14 | YUV420p crf12 | YUV420p crf10 | Sàn YUV crf0 |
|---|---|---|---|---|---|
| dissolve | 0,0022 / 100% / **KHỚP** | 2,3568 / 98,74% / XẤP XỈ | 2,1141 / 99,32% / XẤP XỈ | 1,9456 / 99,62% / **KHỚP** | 1,6138 / 99,99% / **KHỚP** |
| circleopen | 0,5033 / 100% / **KHỚP** | 1,5412 / 99,96% / **KHỚP** | 1,5082 / 99,99% / **KHỚP** | 1,4869 / 100% / **KHỚP** | — (không đo; đã KHỚP từ crf14) |

Đối chiếu 720×1280 đợt 22: dissolve 2,3471 / 2,1117 / 1,9464 /
sàn 1,6307; circleopen 1,5767 / 1,5271. Chênh lệch native–720p ≤
0,04 MAD ở mọi ô — **ngưỡng crf ≤ 10 của cặp J→L giữ nguyên khi
lên native**, không cần sửa. Lưu ý: đây không phải "native chung"
của cả 2 phía (L native là 608×1080); ô này là J-native, L được
upscale — ghi rõ để không ai trích thành "native cặp J→L" tuyệt
đối. Ô native 608×1080 (L-native, J downscale) chưa đo — nợ §7.

### 3.3. Cặp K→L ở NATIVE 1080×1920 (chỉ crf14 + sàn, để kiểm tra native có cứu được không)

- Dissolve: RGB 0,0038 KHỚP; YUV crf14 2,7669 / 96,68% XẤP XỈ;
  sàn crf0 1,6737 / 98,39% XẤP XỈ — **native không cứu được**,
  sàn gần như đồng nhất với sàn 720p (1,6946 / 98,36%).
- Circleopen: RGB 0,4992 KHỚP; YUV crf14 1,6407 / 98,29% XẤP XỈ
  (cột decode-RGB về KHỚP 1,9312 ở native, trong khi 720p XẤP XỈ
  2,0592 — hiệu ứng độ phân giải nhỏ ở cột decode, không đổi
  verdict YUV).

### 3.4. Fade trên cặp K→L, 720×1280 — nêu rõ LOẠI fade đã đo

- **fade = xfade transition=fade = crossfade tuyến tính A→B**
  (KHÔNG phải fade-to-black, KHÔNG phải fade in/out từ đen):
  RGB 0,5008 / 100% KHỚP; YUV crf14 1,4887 / 99,99% **KHỚP**;
  YUV crf10 1,4155 / 100% **KHỚP**. Lưu ý RGB MAD 0,5008 ngang
  mức circleopen (0,4995), không ngang mức dissolve (0,0039):
  cả fade và circleopen đều KHỚP nhưng ở mức sai số làm tròn
  ~0,5, trong khi dissolve khớp gần tuyệt đối nhờ mô hình frand
  — khác biệt này chỉ là mức độ, không đổi verdict, và chưa
  điều tra nguyên nhân làm tròn (không claim).
- **fadeblack = xfade transition=fadeblack = qua đen** (giữa
  transition đi qua đen): RGB 34,6082 / 0,56% **LỆCH**; YUV crf14
  22,1343 (Y=30,4876 — kênh luma lệch áp đảo, đúng bản chất "qua
  đen") / 30,15% **LỆCH**; YUV crf10 22,1965 / 30,10% **LỆCH**
  (gần như không đổi theo crf — vì lệch do mô hình, không do
  lượng tử hoá). Đây là **nợ mô hình preview**: describeTransition
  ghi rõ fadeblack dùng "alpha tuyến tính, bỏ qua màu trung
  gian". Render FFmpeg là đúng; sửa parity fadeblack = dạy
  preview vẽ dip qua đen, không phải sửa render hay encode.

## 4. 4K dọc — UPSCALE TỔNG HỢP (cặp J→K, 2160×3840)

Cảnh báo đọc trước mọi trích dẫn: **đây KHÔNG phải 4K quay thật**.
Nguồn J/K chỉ 1080×1920; chain chuẩn hoá `scale=2160:3840` nội
suy lên. Số đo vì vậy trả lời câu hỏi "parity có giữ khi render
khung 4K dọc từ nguồn 1080p không", không trả lời "footage 4K
thật thì sao".

| Transition | RGB24 | YUV420p crf14 | YUV420p crf10 |
|---|---|---|---|
| dissolve | 0,0037 / 100% / **KHỚP** | 1,9448 / 99,75% / **KHỚP** | 1,3726 / 99,98% / **KHỚP** (tái tính §6) |
| circleopen | 0,4977 / 100% / **KHỚP** | 0,7658 / 100% / **KHỚP** | — (đã KHỚP từ crf14) |

Đối chiếu cặp J→K 720p đợt 22: dissolve crf14 1,9828 KHỚP (biên
mỏng 0,0172); ở 4K upscale 1,9448 KHỚP — cùng verdict, số nhỉnh
hơn chút. Circleopen 4K (0,7658) tốt hơn 720p (0,9062) — nội suy
upscale làm mịn biên, giảm khe subsample. Độ phức tạp frame ở
4K: J@29,5s std 56,0 diff-ngang 2,30 (720p: 5,60); K@28,5s std
84,3 diff-ngang 0,35 (720p: 1,00) — diff-ngang giảm do nội suy,
nhất quán với giải thích làm mịn. **Sàn crf0 ở 4K chưa đo được**
(xem §6): encode lossless 4K 2s vượt /tmp 512MB của VM.

## 5. Đọc tổng hợp — ngưỡng crf YUV sau 6 nội dung

| Nội dung (dissolve YUV) | crf14 | crf12 | crf10 | Sàn crf0 |
|---|---|---|---|---|
| Test pattern (R20 R6) | 1,8094 KHỚP | 1,4079 KHỚP | — | 0,0000 |
| Ngang phóng đêm → phim 1950 (R21 cặp 1) | 2,3436 XẤP XỈ | 1,9930 KHỚP | — | 0,6498 |
| Ngang phóng đêm → quỹ đạo (R21 cặp 2) | 1,6921 KHỚP | — | — | — |
| Dọc trường bắn → Iwo Jima (R22 cặp 1) | 1,9828 KHỚP | 1,6573 KHỚP | — | 0,5926 |
| Dọc trường bắn → organ-chip (R22 cặp 2) | 2,3471 XẤP XỈ | 2,1117 XẤP XỈ | 1,9464 KHỚP | 1,6307 |
| **Dọc Iwo Jima → organ-chip (R23 cặp mới)** | **2,9697 XẤP XỈ** | **2,6349 XẤP XỈ** | **2,3663 XẤP XỈ** | **1,6946 XẤP XỈ (trượt chân ≤ 8)** |

Quy tắc thực hành SỬA LẠI (thay quy tắc "crf ≤ 10 cho mọi
footage" của đợt 22): **crf ≤ 10 cho KHỚP miền YUV của dissolve
trên 5/6 nội dung đã đo; cặp K→L là ngoại lệ chứng minh quy tắc
không phổ quát — trên cặp đó KHÔNG CÓ crf nào cho KHỚP** (sàn
trượt chân ≤ 8). Circleopen giữ KHỚP ở crf14 trên 5/6 nội dung,
trừ K→L (sàn cũng trượt chân ≤ 8). Giả thuyết cơ chế (chưa chứng
minh): dissolve blend bằng mosaic nhiễu frand từng pixel (mỗi
pixel chọn A hoặc B) → frame blend giàu tần số cao → subsample
4:2:0 + blend miền YUV phá nặng; fade blend mịn tuyến tính thì
sống sót (KHỚP ở crf14 trên cùng cặp K→L). Nếu giả thuyết đúng,
hướng sửa không phải "hạ crf" mà là xem lại cách so sánh miền
YUV cho transition nhiễu, hoặc chấp nhận XẤP XỈ là verdict đúng
cho hạng nội dung này. Không kết luận vượt số đo.

## 6. Sự cố ENOSPC ở 4K (trung thực, kèm cách khôi phục số)

VM này có /tmp tmpfs 512MB, dùng chung với các luồng đợt 23 khác
(~170MB của luồng khác tại thời điểm đo) + 3 clip (145MB). Một
lần chạy 4K đầy đủ cần ~200MB tmp riêng (frame raw 24,9MB ×
nhiều file + mp4 encode; riêng mp4 crf10 4K 2s đã 79MB).

1. Lần 1 (cả 2 type + `--crf0-ref`): dissolve crf14 in xong
   (1,9448 KHỚP), rồi encode crf0 lossless chết với
   `No space left on device` (exit 228), script exit 1, chưa có
   circleopen. Thư mục tmp 205MB được xoá sau đó.
2. Lần 2 (dissolve riêng, crf14, không crf0): thành công, số
   **tái lập đúng 0,0037 / 1,9448** — chứng minh số lần 1 không
   phải số rác.
3. Lần 3 (circleopen riêng, crf14): thành công (0,4977 / 0,7658).
4. Lần 4 (dissolve riêng, crf10): encode xong, decode yuv xong
   (file .yuv đủ 12.441.600 byte = 2160×3840×1,5), rồi decode rgb
   chết vì ENOSPC (file rgb dở dang 18,9/24,9MB). Khôi phục: giải
   mã lại rgb từ mp4 còn sống ra thư mục scratch ngoài repo trên
   đĩa (không phải /tmp), tính lại preview bằng ĐÚNG code
   previewFrame của script đo + module thật đã transpile trong
   thư mục tmp còn sống, rồi so yuv420Mad. Kết quả tái tính:
   RGB 0,0037 (trùng đúng run gốc) và YUV crf10 **1,3726 /
   99,98% KHỚP** — số này được ghi là "tái tính", không mạo nhận
   là output trực tiếp của script đo. Toàn bộ thư mục tmp của
   lần 4 + scratch đã xoá sau khi ghi số.
5. Hệ quả: **sàn crf0 ở 4K không đo được trên VM này** (encode
   lossless 4K 2s cần hơn dung lượng /tmp còn trống). Muốn đo sàn
   4K phải có /tmp lớn hơn hoặc encode ra đĩa ngoài tmpfs — nợ
   hạ tầng đo, không phải giới hạn sản phẩm.

## 7. Giới hạn chưa làm được / nợ còn lại

- **Chưa có clip 4K dọc quay thật** (L orig đã loại: 608×1080).
  Muốn đo parity trên 4K thật phải tìm nguồn khác (IA/NASA) —
  chưa săn trong đợt này (nhiệm vụ chỉ yêu cầu "nếu tìm được").
- **Chưa đo ô native 608×1080** (L-native, J/K downscale) cho cặp
  J→L và K→L; mới chỉ có J/K-native 1080×1920.
- **Chưa đo fade/fadeblack ở native và 4K** (mới chỉ 720×1280,
  cặp K→L); chưa đo 79 type còn lại trên footage dọc H.264.
- **Chưa đo crf > 14 cho circleopen/dissolve** (chưa biết ngưỡng
  trượt phía trên); chưa đo preset khác ở crf10/12/14 trên
  footage dọc (R6 chỉ đo preset trên test pattern).
- **Chưa có click-test / FPS canvas trên footage dọc H.264**
  (blocker headed chung; script đo chỉ chạy tầng FFmpeg +
  module preview, không qua trình duyệt).
- **Chưa chứng minh giả thuyết frand-mosaic ở §5** (cần thí
  nghiệm đối chứng: dissolve với nhiễu tắt/bật, hoặc đo phổ
  tần số frame blend — chưa làm).
- **Cảnh báo phát hành đợt 22 §6.1 vẫn nguyên**, mạnh thêm bởi
  frame K @29,5s (tư liệu chiến tranh màu hoá + chữ thương vong):
  3 clip chỉ để đo trong /tmp, không đưa vào kho phát hành khi
  chưa rà soát quyền nhân thân / nội dung nhạy cảm từng clip.

## 8. Kiểm chứng đã chạy (lệnh + kết quả)

- `bash scripts/fetch-r22-footage.sh /tmp/vcut-r23-footage`: exit 0;
  kiểm tra API IA/NASA OK cả 3 clip trước khi tải; ffprobe h264 +
  khung dọc + giải mã thử 1 frame đều pass; SHA256 trùng đợt 22
  cả 3 file (log `/tmp/r23-fetch.log`).
- `ffprobe` từ xa bản L ~orig.mp4: h264 608×1080 — không phải 4K
  (không tải file 92,7MB về).
- `node --check server/render/src/measure_r23_vertical_parity.js`:
  pass.
- K→L 720p: crf14+crf0-ref exit 0, crf12 exit 0, crf10 exit 0,
  crf8 (dissolve riêng) exit 0, crf0 (circleopen riêng) exit 0.
- J→L native 1080×1920: crf14+crf0-ref exit 0, crf12 exit 0,
  crf10 exit 0.
- K→L native 1080×1920 crf14+crf0-ref: exit 0.
- Fade K→L 720p: crf14 exit 0, crf10 exit 0.
- 4K upscale J→K: lần 1 exit 1 (ENOSPC ở encode crf0, §6); lần 2
  dissolve crf14 exit 0 (tái lập đúng số lần 1); lần 3 circleopen
  crf14 exit 0; lần 4 dissolve crf10 exit 1 (ENOSPC ở decode rgb,
  §6) — số crf10 lấy từ tái tính có đối chiếu RGB trùng đúng.
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code sản phẩm
  hay code TS nào — script đo chỉ transpile module TS sang /tmp
  để đo, như mẫu R21/R22).
- KHÔNG chạy click-test browser thật (nợ mở chung, §7).
- KHÔNG tạo script fetch-r23 (không có clip mới; lý do §1).
- KHÔNG sửa file nào khác: chỉ tạo 3 file text mới liệt kê ở §9
  (1 script đo + 1 JSON kết quả + LIMITS này). Thư mục làm việc
  không phải git repo nên không có git status để đối chiếu
  (parent push qua API).

## 9. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `server/render/src/measure_r23_vertical_parity.js` (MỚI — parity
  footage dọc vòng 2: ô YUV nhận tham số khung + cờ `--yuv-native`
  + type fade/fadeblack qua cùng khung xfade; dùng module chung
  harnessShared + describeTransition thật)
- `benchmarks/results/v23-vertical-parity.json` (MỚI — toàn bộ số
  đo §3–§4 ở dạng JSON, kèm định nghĩa fade/fadeblack, cửa sổ đo,
  log và cảnh báo upscale)
- `docs/PHASE9_ROUND23_G5_VERTICAL_PARITY2_LIMITS.md` (MỚI — chính file này)

KHÔNG đưa vào stage (chỉ để trên đĩa / trong /tmp, ghi tên để đối chiếu):
binary mẫu `/tmp/vcut-r23-footage/clip-j-dod-pistol.mp4`,
`clip-k-dod-iwo.mp4`, `clip-l-nasa-avatar-vertical.mp4`, manifest
`/tmp/vcut-r23-footage/LICENSES.txt`, log `/tmp/r23-fetch.log`,
các log đo `/tmp/r23-*.log` (§8), frame kiểm tra bằng mắt
`/tmp/r23-eye-k-29p5.jpg`. Không tạo file binary nào trong repo.
Không push, không tag/release.
