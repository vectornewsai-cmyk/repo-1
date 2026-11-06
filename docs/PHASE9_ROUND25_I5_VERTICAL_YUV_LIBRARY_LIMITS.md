# Phase 9 đợt 25 (luồng I5) — Đo YUV N1→N2 + tìm cảnh quay thuần ngoài vũ trụ + gói script fetch — LIMITS trung thực

> Đợt 25, luồng I5. Luật cứng đã giữ: KHÔNG push GitHub, KHÔNG chạy
> push-files, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
> KHÔNG code giả, KHÔNG stage (parent stage), KHÔNG tải binary vào
> repo, KHÔNG sửa code sản phẩm. Chỉ tạo file text ở §8. Máy đo: VM
> 2 vCPU, FFmpeg/ffprobe 8.1.2, numpy 1.26.4. Scratch đo ở
> ~/workspace/tmp-round25-i5/ (trên đĩa, không phải /tmp tmpfs) —
> đã dọn sạch cuối luồng, xác nhận bằng `ls` (§8). Script đo và
> script fetch mới dùng lại được; binary đo đã xóa, ai cần đo lại
> thì chạy lại script fetch (SHA256 đầy đủ đã ghi, tải xác định).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **N1/N2 tải lại trùng tuyệt đối đợt 24:** N1 SHA256
  `2ede4e15356bff19274daa8728759c9d425ab1ba9f855eb34d3d90dcd3fff76a`
  (32.963.935 byte), N2 SHA256
  `a7d8eb96a7130d3049d460c0fbecb336475e7b37816b655a9d0aa309f523a71b`
  (37.922.134 byte) — khớp cả đầu/cuối tắt của LIMITS H5 lẫn kích
  thước, H.264 dọc thật 1080×1920 60fps. LƯU Ý: LIMITS H5 chỉ ghi
  SHA dạng tắt (`2ede4e15…dcd3fff76a`, `a7d8eb96…523a71b`); SHA đầy
  đủ ở đây là lần đầu được ghi ra từ phép đo trực tiếp, và nó khớp
  đúng đầu/cuối tắt đó — không phải SHA mới lệch.
- **Parity YUV N1→N2, phương pháp KHỚP MÀU (theo kết luận H4): KHỚP
  ở cả 4 mức** — crf0 sàn 0,0592 / crf10 1,0403 / crf12 1,2715 /
  crf14 1,5413 (thang V6, xem §2). Cặp này KHỚP tới crf14, tức
  thoáng hơn quy tắc "crf ≤ 10" của H4 — không phải vì quy tắc sai,
  mà vì nội dung N1/N2 chịu lượng tử hoá tốt hơn K→L ở miền YUV
  (xem §2.3). Control bt601 cho cùng verdict (sàn 0,0596, crf14
  1,5554): verdict không phụ thuộc lựa chọn ma trận khi đã khớp.
- **Hai bài học phương pháp đắt giá, đều có bằng chứng số (§3):**
  (1) Gắn cờ `-color_*` ở output encode KHÔNG chỉ là tag — ffmpeg
  chèn thêm phép chuyển màu khi nguồn mang metadata unknown, làm
  mp4 đổi từ 16.363.337 → 16.101.561 byte và frame 0 lệch 85,9%
  pixel; lần đo đầu của luồng này (sàn 2,0781) vì vậy VÔ HIỆU và
  đã bị hủy, không đưa vào kết luận. (2) xfade trực tiếp trên
  yuv420p KHÔNG tái tạo được bằng model pick frand theo từng mặt
  phẳng ở chroma: sàn native XAP_XI 0,9988 (Y 0,0783 nhưng U
  2,8039 / V 2,8756, le8 97,75%) — parity YUV của dự án phải đo
  trên chuỗi xfade RGB với chuyển màu khớp (§2), không được đo
  trên chuỗi xfade-native với model pick.
- **KHÔNG tìm được clip mới đạt:** sau khi rà ~200 tiêu đề NASA
  images-api + ~180 tiêu đề IA (kèm 4 probe bằng chứng: 2 NASA
  ngang, 1 IA dọc nhưng license không xác minh được, 1 IA người
  trong mô tả), hạng "cảnh quay camera thuần ngoài vũ trụ" (thiên
  nhiên / đô thị quay thật, dọc) VẪN TRỐNG. Không hạ chuẩn để đủ
  số — kho dọc phát hành vẫn chỉ có R1 (đã cắt) + R2 + N1 + N2,
  trong đó N1/N2 là visualization, không phải cảnh quay thuần.
- **Script đóng gói đã kiểm chứng chạy thật:** `scripts/
  fetch-r25-i5-vertical-library.sh` (bash -n pass) tải lại N1+N2
  với cổng SHA đầy đủ: exit 0, cả 2 file "SHA trùng", manifest
  LICENSES.txt đầy đủ. SVS chập chờn trong đợt (empty reply, stall
  ~10s) nên script có `--retry 5 --retry-all-errors` + retry
  ffprobe remote — lần chạy kiểm chứng đã qua nhờ đúng cơ chế
  này sau một lần lỗi thoáng qua.

## 1. Đối chiếu N1/N2 tải lại (bước 1 của nhiệm vụ)

Chạy lại script đợt 24 (`fetch-r24-vertical-nonsSpace.sh`) vào
scratch ngày 30/10/2026:

| Clip | Nguồn | Codec / khung / fps | Duration | Kích thước | SHA256 (đầy đủ, đo trực tiếp) |
|---|---|---|---|---|---|
| N1 | NASA SVS 5626, `guard_vert_background_comp_1920p60.mp4` | H.264 / 1080×1920 / 60fps | 43,67s | 32.963.935 byte | `2ede4e15356bff19274daa8728759c9d425ab1ba9f855eb34d3d90dcd3fff76a` |
| N2 | NASA SVS 5677, `arctic_sea_ice_min_2026_vertical_1920p60.mp4` | H.264 / 1080×1920 / 60fps | 53,83s | 37.922.134 byte | `a7d8eb96a7130d3049d460c0fbecb336475e7b37816b655a9d0aa309f523a71b` |

- Đối chiếu: kích thước trùng tuyệt đối số đợt 24 (32.963.935 /
  37.922.134); SHA đầy đủ khớp đầu `2ede4e15` + cuối
  `dcd3fff76a` (N1) và đầu `a7d8eb96` + cuối `523a71b` (N2) của
  LIMITS H5. **Kết luận: KHÔNG lệch SHA, dùng đúng file cũ.**
  Cả 2 chỉ có 1 stream video, không audio; giải mã thử frame đầu
  pass (cổng của script đợt 24).
- Metadata màu quan trọng cho §2: ffprobe cho cả 2 clip đều
  `color_space=unknown, color_primaries=unknown,
  color_transfer=unknown, color_range=unknown` — KHÁC với
  J/K/L/R1/R2 (đều bt709 theo H4). Vì vậy "khớp hệ số chuyển màu
  nguồn" không thể hiểu là "đọc metadata nguồn" ở cặp này (không
  có metadata để đọc); phương pháp §2 ép cùng một ma trận rõ ràng
  cho cả hai phía, và control bt601 chứng minh verdict không phụ
  thuộc lựa chọn đó.
- Sự cố tải (ghi rõ, không giấu): lần tải N2 đầu tiên trong script
  đợt 24 chết với `curl: (52) Empty reply from server` (script
  dừng theo `set -e`, LICENSES.txt lúc đó chỉ có N1); tải lại N2
  bằng tay với `--retry` thành công ngay lần retry đầu, SHA trùng
  tuyệt đối. Sau đó, lần chạy kiểm chứng script mới cũng gặp một
  lần lỗi thoáng qua rồi qua nhờ retry. SVS không ổn định, nhưng
  file là xác định (HEAD 200, content-length đúng 32.963.935 cho
  N1) — không phải file đã đổi.

## 2. Parity YUV N1→N2, phương pháp khớp màu (bước 2)

### 2.1. Phương pháp của riêng luồng I5 (không chờ harness I1)

Theo kết luận H4 (đợt 24 §3: "đo parity YUV phải khớp hệ số chuyển
màu — chuyển preview bằng bt709, hoặc ép chuỗi bt601"), và theo
truyền thống đo R6/R20 (model RGB → chuyển sang YUV bằng FFmpeg,
không dùng hàm JS `rgbToYuv420` cho dissolve):

- Cửa sổ: N1 10–12s → N2 10–12s (cùng cửa sổ với parity RGB H5),
  chuẩn hoá 720×1280, 30fps, 60 frame, dissolve 2s.
- Render: A/B → `scale=720:1280,fps=30,format=rgb24` → xfade
  dissolve → `scale(out_color_matrix=MATRIX:out_range=tv),
  format=yuv420p` → libx264 preset medium, crf X → decode về
  yuv420p raw.
- Model: A/B trích rgb24 (cùng filter như H5) → pick frand float32
  (vf_xfade.c, như script H5) với p_hat đo từ chính frame render
  RGB (phương pháp H5: tỉ lệ pixel gần B hơn A) → khung RGB model
  → chuyển sang yuv420p bằng ĐÚNG filter chuyển của render.
- So sánh: MAD trên mọi sample (mẫu số 1,5·W·H) + MAD-Y/U/V riêng
  + tỉ lệ sample |diff| ≤ 8. Thang V6: KHỚP nếu MAD ≤ 2 và le8 ≥
  99%; XẤP XỈ nếu MAD ≤ 20 và le8 ≥ 90%; còn lại LỆCH. Cảnh báo
  R20 R6 §3.3 vẫn áp dụng: MAD tổng bị loãng bởi mặt phẳng chroma,
  nên bảng luôn kèm MAD-Y/U/V riêng.
- Encode KHÔNG gắn cờ màu nào (xem §3.1: gắn cờ chèn phép chuyển).
  Decode về yuv420p raw không áp dụng ma trận nên tag mp4 (nếu có)
  không ảnh hưởng số đo.
- Script: `scripts/measure-r25-i5-yuv-parity.py` (mode `matched`
  mặc định; mode `native` chỉ để chẩn đoán §3.2). Kết quả đầy đủ
  từng frame: `benchmarks/results/v25-i5-yuv-n1-n2.json`.

### 2.2. Kết quả — tất cả KHỚP

| Chuỗi (libx264, preset medium, 2s 720×1280) | MAD tổng | MAD-Y | MAD-U | MAD-V | ≤8 (sample) | Verdict |
|---|---|---|---|---|---|---|
| **bt709 khớp, crf0 (sàn)** | **0,0592** | 0,0843 | 0,0087 | 0,0093 | 99,95% | **KHỚP** |
| **bt709 khớp, crf10** | **1,0403** | 1,1293 | 0,8328 | 0,8918 | 99,92% | **KHỚP** |
| **bt709 khớp, crf12** | **1,2715** | 1,3959 | 0,9725 | 1,0729 | 99,86% | **KHỚP** |
| **bt709 khớp, crf14** | **1,5413** | 1,7304 | 1,0930 | 1,2331 | 99,67% | **KHỚP** |
| bt601 khớp (control), crf0 | 0,0596 | 0,0846 | 0,0093 | 0,0096 | 99,95% | KHỚP |
| bt601 khớp (control), crf14 | 1,5554 | 1,7358 | 1,1418 | 1,2474 | 99,66% | KHỚP |

Kích thước mp4 2s (bt709): crf0 16.318.395 B, crf10 11.784.251 B,
crf12 10.278.257 B, crf14 8.926.856 B — giảm đều theo crf, không
có bất thường.

### 2.3. Đọc số (trung thực, không thổi phồng)

- **Sàn crf0 = 0,0592, không phải ~0,002 như H4 đo trên K→L.**
  Đây không phải mâu thuẫn: H4 đo 1 frame duy nhất (frame 45,
  p=0,5 danh nghĩa) trên nội dung K→L; luồng này đo 60 frame với
  p_hat đo được trên nội dung N1/N2 giàu chi tiết bản đồ/text.
  Cùng mẫu đã thấy ở miền RGB: parity RGB H5 của N1→N2 là MAD
  0,1000, cao hơn R1→R2 (0,0050) cũng vì chi tiết bản đồ/text làm
  mỗi pixel lệch frand 1-ulp mang |diff| lớn hơn. Sàn YUV 0,0592
  (Y 0,0843, chroma ~0,009 nhờ trung bình subsample) cùng bậc với
  sàn RGB 0,1000 — nhất quán, không phải bug mới. Verdict sàn vẫn
  KHỚP với biên rộng (MAD chỉ bằng ~3% ngưỡng).
- **KHỚP tới crf14, thoáng hơn quy tắc H4 "crf ≤ 10".** Quy tắc H4
  ("crf ≤ 10 cho KHỚP dissolve trên 6/6 nội dung đã đo") là chặn
  dưới an toàn qua nhiều nội dung, trong đó K→L KHỚP từ crf12;
  N1→N2 KHỚP tới crf14 chỉ có nghĩa cặp này chịu lượng tử hoá tốt
  hơn ở miền YUV (MAD tăng đều ~0,20–0,27 mỗi bước crf từ 10 lên
  14, không có bước nhảy). KHÔNG được suy ra "quy tắc mới crf ≤
  14" cho mọi nội dung — chỉ ghi nhận cho cặp N1→N2 này.
- **Control bt601 đổi verdict không:** sàn chênh 0,0004 MAD, crf14
  chênh 0,0141 MAD, cùng verdict KHỚP. Đây là kiểm chứng trực tiếp
  rằng phương pháp đã khớp thật: nếu còn lệch hệ số, đổi ma trận
  sẽ đổi số lớn (như H4: mismatched 1,6946 vs khớp 0,0024).
- **So với số RGB H5:** RGB24 dissolve N1→N2 là 0,1000 / 99,92%
  KHỚP; YUV khớp màu ở đây là 0,0592–1,5413 KHỚP ở mọi crf đo. Hai
  miền kể cùng một câu chuyện: dissolve N1→N2 parity tốt.

## 3. Hai phát hiện phương pháp (đừng lặp lại)

### 3.1. Cờ `-color_*` ở output encode KHÔNG chỉ là tag (lần đo đầu vô hiệu)

Lần đo đầu của luồng này dùng chuỗi xfade yuv420p trực tiếp +
encode có gắn `-color_primaries bt709 -color_trc bt709 -colorspace
bt709 -color_range tv` (với giả định sai lầm "tag chỉ là metadata,
không đổi sample") và cho sàn crf0 = 2,0781 XAP_XI (Y 1,4278, U
3,5682, V 3,1891). Đối chứng sau đó chứng minh giả định sai:

- Cùng chuỗi, chỉ bỏ cờ màu: mp4 16.363.337 B, SHA
  `2742248b…` (trùng với bản render chẩn đoán không cờ); gắn cờ:
  mp4 16.101.561 B, SHA khác hoàn toàn. Cờ `-ss 10` vs `10.0` đã
  loại trừ (cùng SHA khi không cờ).
- So frame 0 hai bản: 85,90% pixel Y khác nhau, maxdiff 24 — đúng
  dạng lệch của một phép chuyển màu (không phải lệch khung hình:
  nếu lệch khung thì Y sẽ không còn đúng bằng A/B từng pixel).
- Cơ chế (suy luận có căn cứ, ghi rõ là suy luận): khi nguồn mang
  metadata unknown, ffmpeg chèn phép chuyển màu cho output khi cờ
  màu output khác với tính chất khung hình sau filter — tức cờ
  output không còn là tag thụ động. **Hệ quả cho mọi luồng đo sau:
  đừng bao giờ gắn cờ màu ở output encode khi đo parity; muốn ép
  ma trận thì ép bằng filter `scale(out_color_matrix=…)` trong
  chuỗi (như §2.1), nơi cả hai phía dùng cùng filter.**
- Lần đo đầu (2,0781) đã bị HỦY và không xuất hiện trong kết luận;
  file JSON lần đầu đó chỉ còn ở scratch (đã xóa cuối luồng) và
  KHÔNG được stage. Ai thấy số 2,0781 ở đâu khác thì đó là số vô
  hiệu, đừng trích.

### 3.2. xfade-native trên yuv420p không tái tạo được bằng model pick (chẩn đoán)

Khi xfade chạy trực tiếp trên input yuv420p (không qua RGB) và
model là pick frand theo từng mặt phẳng (Y full-res, U/V theo tọa
độ chroma), sàn crf0 (chuỗi sạch, không cờ màu) cho:

| Mặt phẳng | Hành vi render | MAD vs model pick |
|---|---|---|
| Y | Đúng bằng A hoặc B từng pixel (neither = 0,00% ở frame 0/30/59); mask khớp frand 99,92–99,95% | 0,0783 |
| U | 84,68% pixel frame 30 không bằng A cũng không bằng B, nhưng nằm giữa A và B (83,58%) — tức là BLEND, không phải pick | 2,8039 |
| V | Tương tự U (neither 86,17%, giữa 85,31%) | 2,8756 |
| **Tổng (mẫu số 1,5·W·H)** | — | **0,9988, le8 97,75% → XAP_XI** |

Phân tích sâu hơn (frame 30, chroma): model trung bình khối 2×2
của pick luma cho MAD ~0,70–0,85 (tốt hơn hẳn pick-chroma
~2,7–4,7 và blend tuyến tính ~1,3–1,6), nhưng chỉ đúng tuyệt đối
~44–51% pixel; trọng số blend suy ra theo số pick B trong khối
(m=0→w≈0,15; m=2→w≈0,51; m=4→w≈0,87) cho thấy chroma render xấp
xỉ "73% trung bình khối + 27% blend toàn cục" — tức hạt nhân nội
suy chroma rộng hơn hộp 2×2. Luồng này KHÔNG truy nguyên tiếp tới
mức đặt tên đúng cơ chế nội bộ của xfade (cần đọc vf_xfade.c);
điểm cần nhớ cho người đo sau là đủ: **đừng lấy verdict parity từ
chuỗi xfade-native + model pick; parity YUV của dự án được định
nghĩa trên chuỗi xfade RGB với chuyển màu khớp (§2).** Chẩn đoán
này tái tạo được bằng mode `native` của script đo (crf0).

## 4. Kho dọc sau đợt này (không đổi — không có clip mới đạt)

| Clip | Chủ đề | Dạng | Trạng thái |
|---|---|---|---|
| R1 (đợt 23) | Vũ trụ: vòm tên lửa EUS | 608×1080, camera | Đạt, đã có script cắt end card ở 46,5s (đợt 24) |
| R2 (đợt 23) | Vũ trụ: trăng + Artemis II | 608×1080, camera | Đạt |
| N1 (đợt 24) | Trái Đất: sóng thần mô phỏng | 1080×1920, visualization | Đạt (kèm ghi chú nhãn bản đồ xuyên suốt) |
| N2 (đợt 24) | Trái Đất: băng biển Bắc Cực | 1080×1920, visualization | Đạt (kèm ghi chú text/ngày xuyên suốt) |
| **Cảnh quay camera thuần ngoài vũ trụ (thiên nhiên / đô thị)** | — | — | **VẪN TRỐNG (§5)** |

## 5. Tìm cảnh quay thuần ngoài vũ trụ — ứng viên ĐẠT/LOẠI (bước 3)

Tiêu chuẩn áp đúng H5/H6 đợt 23 (không hạ chuẩn): loại nếu gặp
người nhận diện được, vũ khí, chiến tranh/thương vong, phỏng vấn
cận mặt có tên, logo/end card nổi bật; đạt nếu photographer/nguồn
rõ ràng, 0 người hoặc người xa không nhận diện được, và quét toàn
clip mỗi ~10s. License chỉ chấp nhận NASA public domain / IA
public-domain (hoặc CC-BY trong tập MIT/CC0/CC-BY/OFL) đã xác minh
qua API sơ cấp (NASA images-api, IA metadata API). "Ngoài vũ trụ"
ở đây nghĩa là ngoài chủ đề vũ trụ (thiên nhiên / đô thị quay
thật), theo đúng nợ mở H5 §7 — không phải "quay từ ngoài vũ trụ".

### 5.1. NASA images-api — không có ứng viên mới

- Truy vấn `q=vertical, media_type=video` (2 trang, ~200 item) và
  `q="vertical video"` (phrase): ngoài R1/R2 đã biết và clip L đã
  bị loại đợt 22 (photographer trống, center HQ — cổng siết đợt 24
  REJECT đúng), toàn bộ là bẫy "vertical" = lắp ráp/lift theo
  chiều dọc (Vertical Integration Facility, lift to vertical) hoặc
  timelapse công nghiệp vũ trụ. Không có clip thiên nhiên/đô thị
  nào trong danh sách.
- Probe bằng chứng cho bẫy (ffprobe remote bản `~large.mp4`):
  - `KSC-20210717… Starliner Rollout to Vertical Integration
    Facility` (photographer NASA/Cory S Huston — qua cổng
    photographer, nhưng): **1920×1080 ngang**, 349,43s → LOẠI vì
    khung ngang (và chủ đề công nghiệp vũ trụ, không phải thiên
    nhiên/đô thị).
  - `KSC-20260324… Artemis II Sunrise Timelapse` (photographer
    NASA/Glenn Benson — qua cổng): **1920×1080 ngang**, 34,47s →
    LOẠI vì khung ngang.
- `NHQ20210323INGENUITY001 "Things are Really Looking Up (on
  Mars)"`: photographer trống, center HQ → **REJECT bởi cổng siết
  chỉ-nhánh-photographer** (cùng lý do như clip L), không cần
  probe thêm.
- Kết luận NASA: 0 ứng viên mới qua được cổng; images-api không
  phải nguồn cho hạng thiên nhiên/đô thị dọc.

### 5.2. Internet Archive — không có ứng viên mới

Đã rà các truy vấn (mỗi truy vấn ghi rõ số kết quả đã xem):

| Truy vấn IA | Kết quả xem | Ứng viên đáng chú ý + verdict |
|---|---|---|
| `title:(vertical) AND mediatype:movies` (50) | 50 tiêu đề | Toàn quảng cáo, MV, game, tin tức, quân sự, TV — 0 clip thiên nhiên/đô thị trung tính qua được sàng tiêu đề + license. |
| `"vertical video" AND mediatype:movies` (50) | 50 tiêu đề | Như trên, cộng 2 item DoD + 1 item dọc (xem dưới). |
| `title:(portrait) AND mediatype:movies` (50) | 50 tiêu đề | "Portrait" ở đây là thể loại/người, không phải khung dọc — 0 ứng viên footage. |
| `"waterfall vertical" / "river vertical" / "ocean vertical" / "city vertical"` (mỗi 15) | 0 / 0 / 0 / 1 | Chỉ 1: `lostcityverticalwallclip166416926` ("Lost City Vertical Wall Clip", creator Surreal_, không license) → **LOẠI vì license không xác minh được**. |
| `collection:(nasa) AND title:(vertical)` (20) | 20 tiêu đề | Toàn ảnh/model (ảnh rover Mars PLAN-PIA, mô hình hầm gió C-…) — không có item phim dọc nào. |
| `"1080x1920" AND mediatype:movies` (20) | 20 tiêu đề | Tin tức Capitol 6/1 (trung tính fail), quảng cáo game, karaoke, cờ vua — 0 thiên nhiên/đô thị. Xem thêm 3 item dưới. |
| `"720x1280" AND mediatype:movies` (20) | 20 tiêu đề | Quảng cáo game, rally cảnh sát (trung tính fail) — 0 thiên nhiên/đô thị. |

Ứng viên đã probe sâu (không chỉ sàng tiêu đề):

- **IA `0-people-vertical-video-672x-1280`** ("0 People Vertical
  Video 672x 1280", file `0_People_Vertical_Video_672x1280.ia.mp4`,
  7.907.802 byte): ffprobe remote cho **H.264 672×1280 dọc thật,
  13,13s** — qua cổng codec + dọc. NHƯNG metadata IA cho
  creator=null, licenseurl=null, description="1" → **LOẠI vì
  license KHÔNG xác minh được qua API sơ cấp**. Tiêu đề "0
  People" là khẳng định chưa kiểm chứng, không thay được license;
  không tải về quét nội dung vì cổng license đã chặn (quét cũng
  không cứu được license).
- **IA `26-0012-044-dod-111625815`** (Navy Medicine, Artemis II
  recovery, licenseurl publicdomain mark — license qua, nhưng):
  tiêu đề đã đủ để loại theo cổng trung tính (quân sự + người mặc
  quân phục trên tàu) → **LOẠI (cổng trung tính, verdict theo
  tiêu đề, không tải về quét)**.
- **IA `26-0037-077-dod-111630342`** (Marine Corps Combat Pistol
  Program qualification, publicdomain mark — license qua, nhưng):
  huấn luyện vũ khí → **LOẠI (vũ khí, verdict theo tiêu đề)**.
- **IA `wildfire-zc-720x-1280-x-264`** ("Wildfire ZC"): creator
  trống, license trống → **LOẠI vì license không xác minh được**
  (dù tiêu đề gợi thiên nhiên — không đủ).
- **IA `mvi-8063`** (licenseurl CC BY-NC-SA 4.0): **LOẠI vì
  license NC không nằm trong tập sạch MIT/CC0/CC-BY/OFL** (NC cấm
  dùng thương mại; dự án chỉ nhận license sạch tuyệt đối).
- **IA `x-2046198032426017223`** (licenseurl CC BY 4.0 — license
  qua cổng, nhưng mô tả ghi rõ nội dung là đời thường của 2 người
  có tên, chụp ảnh/selfie — nhóm nhạc QWER): **LOẠI vì người
  nhận diện được (verdict theo mô tả sơ cấp, không tải về)**.
- Các item còn lại trong các truy vấn (quảng cáo game, karaoke,
  cờ vua, tin tức Capitol, rally) đều LOẠI theo sàng tiêu đề +
  license (không license hoặc không phải footage trung tính);
  không item nào trong số đó là thiên nhiên/đô thị quay thật.

**Tổng rà đợt này: ~200 tiêu đề NASA + ~180 tiêu đề IA đã xem,
4 probe bằng chứng (2 NASA ngang, 1 IA dọc-nhưng-license-fail,
1 IA metadata license-fail), 0 clip mới ĐẠT.** Hạng cảnh quay
camera thuần ngoài vũ trụ vẫn trống — cần tìm tiếp ở nguồn khác
(ví dụ: danh mục video dọc của Wikimedia Commons chưa lập chỉ mục
theo hướng khung, hoặc kho video dọc của cơ quan chính phủ ngoài
NASA/BLM), không hạ chuẩn. Ghi chú trung thực: các verdict LOẠI
theo tiêu đề/mô tả ở trên được ghi rõ mức bằng chứng (không mạo
nhận đã quét frame những clip chưa tải).

## 6. Đóng gói script fetch (bước 4)

Script mới `scripts/fetch-r25-i5-vertical-library.sh` (bash -n
pass, xem §7):

- Tải N1 + N2 từ URL SVS gốc, cổng: ffprobe h264 + dọc, giải mã
  thử frame đầu, **SHA256 đầy đủ bắt buộc trùng** (sai SHA → xóa
  file, exit 1), kích thước in ra để đối chiếu (lệch size chỉ cảnh
  báo, SHA quyết định), chốt chặn OUTDIR trong repo (exit 2),
  manifest `LICENSES.txt` (FILE/LABEL/URL/SIZE/SHA256).
- Chống chập chờn SVS (bài học §1): curl `--retry 5
  --retry-all-errors --retry-delay 10`; ffprobe remote retry 3 lần.
- Kiểm chứng chạy thật ngày 30/10: `bash -n` pass; chạy trọn vẹn
  vào scratch-test: **exit 0, N1 + N2 đều "SHA trùng"**, manifest
  đầy đủ (N1 32.963.935 byte, N2 37.922.134 byte). Lần chạy kiểm
  chứng đầu (trước khi thêm retry) đã lỗi thoáng qua ở N1 rồi qua
  nhờ retry — đúng cơ chế đã thêm, không phải may mắn một lần.
  Mode `--check-only-svs` (ffprobe remote, không tải) cũng có
  trong script để kiểm tra nhanh trước khi tải — đã chạy thử:
  N1 OK ngay (h264 1080×1920), N2 OK sau 1 lần retry (đúng cơ chế
  retry đã thêm, không phải lỗi bền).
- KHÔNG có clip mới trong script (đúng vì §5: 0 clip đạt) và
  KHÔNG có mục trim cho N1/N2 (cả 2 đã quét 0 logo/end card đợt
  24, không có gì để cắt — thêm bước trim giả sẽ là code giả).
  R1 vẫn dùng script đợt 23 (fetch) + đợt 24 (trim ở 46,5s); script
  này ghi rõ cross-reference thay vì nhân đôi đường fetch chưa
  kiểm chứng lại.

## 7. Kiểm chứng đã chạy (lệnh + kết quả thật)

- `bash scripts/fetch-r24-vertical-nonsSpace.sh` (đợt 24) vào
  scratch: N1 OK (SHA trùng tuyệt đối); N2 lỗi curl 52 lần đầu,
  tải lại thành công, SHA trùng tuyệt đối.
- `ffprobe` N1/N2: H.264 1080×1920 60fps, duration 43,67s /
  53,83s, metadata màu unknown cả 2 (xem §1).
- `python3 -c ast.parse` script đo mới: pass.
- Đo YUV matched bt709: crf0 0,0592 / crf10 1,0403 / crf12 1,2715
  / crf14 1,5413 — tất cả KHỚP (JSON §8).
- Đo YUV matched bt601 control: crf0 0,0596 / crf14 1,5554 — cùng
  verdict KHỚP (chứng minh khớp ma trận thật, §2.2).
- Đo YUV native chẩn đoán: crf0 0,9988 XAP_XI (Y 0,0783, U 2,8039,
  V 2,8756) — cảnh báo §3.2, không phải verdict parity.
- Lần đo đầu (gắn cờ màu output): sàn 2,0781 — ĐÃ HỦY vì vô hiệu
  (§3.1), không stage, không trích.
- `bash -n scripts/fetch-r25-i5-vertical-library.sh`: pass; chạy
  trọn vẹn vào scratch-test: exit 0, N1+N2 "SHA trùng";
  `--check-only-svs`: N1 OK ngay, N2 OK sau 1 retry.
- KHÔNG chạy tsc/vite build (không sửa code TS nào — chỉ script đo
  Python + script fetch bash + docs + JSON kết quả); KHÔNG chạy
  click-test browser thật (nợ mở chung).
- KHÔNG push, KHÔNG tag/release, KHÔNG ghi qua GitHub, KHÔNG
  stage paths-loop, KHÔNG sửa build-loop-log.md (parent gộp).

## 8. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- Mới: `scripts/measure-r25-i5-yuv-parity.py` (đo parity YUV
  dissolve: mode `matched` — chuỗi xfade RGB + chuyển YUV cùng ma
  trận (bt709/bt601), p_hat đo từ frame render RGB; mode `native`
  — chẩn đoán xfade yuv420p + model pick theo mặt phẳng; encode
  KHÔNG gắn cờ màu; chỉ đọc file đầu vào, chỉ ghi OUT.json)
- Mới: `scripts/fetch-r25-i5-vertical-library.sh` (fetch N1+N2 với
  cổng SHA256 đầy đủ + h264/dọc + chốt chặn OUTDIR trong repo +
  retry chống SVS chập chờn + manifest LICENSES.txt; binary KHÔNG
  vào repo)
- Mới: `benchmarks/results/v25-i5-yuv-n1-n2.json` (số đo §2 đầy
  đủ từng frame: matched bt709 4 mức, matched bt601 control 2 mức,
  native chẩn đoán crf0)
- Mới: `docs/PHASE9_ROUND25_I5_VERTICAL_YUV_LIBRARY_LIMITS.md` (file
  này; tên file dùng ASCII VERTICAL theo quy ước repo)

KHÔNG ĐỔI (cố tình):

- `scripts/fetch-r24-vertical-nonsSpace.sh` — giữ nguyên (script
  đợt 24 đã stage); script mới đợt 25 là bản đóng gói riêng có
  cổng SHA đầy đủ, không sửa batch cũ.
- `scripts/fetch-r23-vertical-replacements.sh`,
  `scripts/trim-r1-endcard.sh`, mọi file sản phẩm, mọi file đợt
  24 đã stage.

Dọn dẹp cuối luồng: toàn bộ scratch `~/workspace/tmp-round25-i5/`
(library, packtest, diag, JSON tạm, log) đã xóa sau khi mọi số đo
đã nằm trong JSON repo + LIMITS này; xác nhận bằng `ls` trước khi
báo (xem báo cáo cuối của luồng).

## 9. Nợ còn lại (không mạo nhận)

- **Hạng cảnh quay camera thuần ngoài vũ trụ vẫn trống** (§5):
  cần tìm tiếp ở nguồn khác (Wikimedia Commons video dọc, kho
  chính phủ ngoài NASA/BLM), không hạ chuẩn.
- **Chưa truy nguyên đúng cơ chế nội bộ** của xfade-native ở
  chroma (§3.2: hạt nhân nội suy rộng hơn hộp 2×2) — cần đọc
  vf_xfade.c nếu muốn đặt tên chính xác; hiện chỉ có mô tả thực
  nghiệm.
- **Chưa có quyết định đóng gói cuối:** N1/N2 vẫn chỉ nằm ở
  scratch (đã xóa cuối luồng theo quy định) — ai đóng gói kho
  phát hành thì chạy lại script mới (§6), SHA đã ghi, tải xác
  định (chấp nhận SVS chập chờn, script đã có retry).
- **Harness khớp màu chung của I1** (song song) chưa có khi luồng
  này đo — phương pháp §2.1 là của riêng I5; khi I1 xong, parent
  nên đối chiếu hai phương pháp trước khi khóa một chuẩn đo YUV
  chung cho các đợt sau.
