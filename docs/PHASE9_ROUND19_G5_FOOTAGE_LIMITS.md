# Phase 9 đợt 19 (G5) — mở rộng footage thật license sạch: LIMITS trung thực

> Đợt 19, luồng G5 mở rộng footage thật. Luật cứng đã giữ: KHÔNG push
> GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag, KHÔNG code
> giả, KHÔNG stage (parent stage), KHÔNG tải binary vào repo, KHÔNG sửa
> code sản phẩm / harness / store / preview / render / file i18n,
> KHÔNG sửa file của luồng khác, KHÔNG ghi build-loop-log (parent gộp).
> Chỉ tạo 3 file text dưới đây. Máy đo: VM 2 vCPU, FFmpeg/ffprobe 8.1.2,
> /tmp 512MB (sau đợt còn trống ~438MB).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

Đợt 18 để lại bộ footage thật chỉ 2 clip, cùng 1 tác giả/thị trấn,
cùng Theora 720p30, và mới đo 2/81+ transition type. Đợt này mở rộng
thành **6 clip** (2 cũ + 4 mới), **4 tác giả khác nhau, 4 nước khác
nhau, 3 codec, cả ngang lẫn dọc**, và đo parity trên footage mới cho
**4 type** (dissolve, circleopen, fade, wipeleft) × **2 cặp** = 8 phép
đo — **tất cả đều KHỚP** theo thang V6 (MAD ≤ 2 và ≥99% pixel lệch ≤ 8),
lặp lại lần 2 cho số giống hệt nhau:

| Cặp (rgb24 ép trước xfade, p=0.5) | dissolve | circleopen | fade | wipeleft |
|---|---|---|---|---|
| Ngang C→D, 1280×720 | 0,0017 | 0,4946 | 0,4980 | 0,0000 |
| Dọc E→F, 720×1280 | 0,0038 | 0,4984 | 0,5004 | 0,0000 |
| Tất cả: ≤8 | 100,00% | 100,00% | 100,00% | 100,00% |

Mẫu MAD lặp lại gần như y hệt đợt 18 (dissolve ~0,003, circleopen
~0,495) trên cả nội dung mới, cả khung dọc — tức "sàn lượng tử hoá"
của circleopen/fade (~0,5) là tính chất của đường cong, không phải của
nội dung hay hướng khung. Phạm vi badge vẫn giữ nguyên "matched ở mức
mô hình xfade rgb24" (ô yuv420p e2e không đo trong luồng này, xem §6).
Binary chỉ nằm ở `/tmp/vcut-r19-footage`, **không có trong repo,
không stage**.

Bảng hạng mục đợt 19 yêu cầu (mỗi hạng ít nhất 1 clip nếu tìm được
thật, không bịa):

| Hạng mục ưu tiên | Kết quả | Clip |
|---|---|---|
| H.264/MP4 | **KHÔNG TÌM ĐƯỢC trên Commons** (xem §2, có bằng chứng) | — |
| 1080p | CÓ | C (1920×1080), D (1920×1080) |
| Clip dọc (portrait) | CÓ | E (1080×1920), F (480×640) |
| Cảnh tối | CÓ | D (tuyết đêm dưới đèn LED) |
| Chuyển động nhanh | CÓ | C (đua xe leo đồi) |

## 1. Nguồn đã xác minh license (API từng file, không tin tên file)

Cơ chế xác minh (kế thừa đợt 18, mở rộng sang CC BY — xem §3):
gọi API Commons `action=query&prop=imageinfo&iiprop=extmetadata`,
chấp nhận `cc0` (kèm LicenseUrl là deed CC0), `pd` kèm
`Copyrighted=False`, hoặc `cc-by-*` không chứa "sa" (kèm LicenseUrl
là deed CC BY). CC BY-SA và mọi license khác bị từ chối. Trang chính
sách Commons vẫn áp dụng cảnh báo của đợt 18: Wikimedia Foundation
**không bảo đảm** tính đúng đắn của thông tin bản quyền từng file, và
nhãn hiệu / quyền nhân thân / quyền riêng tư vẫn có thể áp dụng độc
lập với bản quyền.

### 1.1. BỐN CLIP MỚI ĐÃ TẢI (đã nhìn bằng mắt, §4)

| Clip | Nội dung thật (đã nhìn bằng mắt) | ffprobe thật | API Commons | SHA256 |
|---|---|---|---|---|
| C: `clip-c-hillclimb.webm` — File "Slovenija - Hill climb car race - Gorjanci - 22.6.2014.webm" | Đường đua leo đồi Slovenia: khán giả ven đường, xe đua chạy tới từ xa, xe cứu thương/van sự kiện; chuyển động nhanh thật | VP8, 1920×1080, 25fps, 9,709 s, 14.401.103 byte | License=cc-by-3.0, Short="CC BY 3.0", Copyrighted=True, Artist="Jan Šefran" — **ghi công bắt buộc khi phát hành lại** | 63c76781b53dd5fafb32b6e7b17e85bc8e48ad9fd5a9b3fef3532266cf244740 |
| D: `clip-d-snowled.webm` — File "Snow under LED street light in Tuntorp, Brastad.webm" | Tuyết rơi ban đêm dưới đèn LED đường phố, cây phủ tuyết; cảnh tối thật, gần như đơn sắc | VP9, 1920×1080, 25fps, 34,800 s, 7.233.046 byte | License=cc-by-4.0, Short="CC BY 4.0", Copyrighted=True, Artist="W.carter" — **ghi công bắt buộc khi phát hành lại** | 0eee3b999492450acc4dcc057e0b1065bb017ef5291797bcc586523264cd962b |
| E: `clip-e-puerta-vertical.webm` — File "Puerta saturnina desde un dron (video vertical).webm" | Drone dọc: tượng đài đỏ Puerta Saturnina, đường phố, cọ, đường ray; quay thật từ trên cao | VP8, 1080×1920, **60fps**, 78,205 s, 36.438.690 byte | License=cc0, Short="CC0", LicenseUrl là deed CC0 1.0, Artist="Luisalvaz" — **CC0 deed thuần túy** | a9fded250c4e5ff0dc5ed05e17f43222ac340599d9bc549afe8cdef46cff5769 |
| F: `clip-f-vatican-vertical.ogv` — File "View of Saint Peter's Square, Vatican.ogv" | Quảng trường St Peter, Vatican: cột obelisk, hành lang, du khách đi lại; quay thật | Theora, 480×640, 30fps, 38,833 s, 19.528.445 byte | License=pd, Short="Public domain", Copyrighted=False, Artist="User:Mattes" | 53a910488555435a3cba9f6fe2e370ac3dfae54c8657d4c7e4be70d7b55fefc5 |

Ghi chú nguồn gốc cần nói rõ:
- Clip C có Credit ghi "YouTube: …" (Commons:YouTube files, video gốc
  YouTube của Jan Šefran, ngày 2014-06-22). License ghi nhận ở đây là
  **license do API Commons trả về cho file trên Commons**, không phải
  xác minh độc lập lại với video YouTube gốc. Nếu đưa C vào kho phát
  hành thì phải đối chiếu thêm bước này.
- Clip E là clip dọc CC0 deed đầu tiên của bộ footage (đợt 18 chỉ có
  public domain theo API, không có CC0 deed nào được tải).
- Clip F tuy chỉ 480×640 nhưng là clip dọc quay thật rẻ nhất về
  dung lượng/độ dài để đo cặp dọc; cặp dọc đo ở 720×1280 (upscale từ
  cả hai nguồn bằng cùng filter chain — xem §5).

### 1.2. ỨNG VIÊN ĐÃ XÁC MINH NHƯNG KHÔNG TẢI (để dành, không tính vào bộ)

- "Mossy Tree CC0.webm" (đợt 18): CC0 deed, 4K, 15 MB — vẫn là ứng viên
  dự phòng, đợt này không cần vì đã đủ 4 clip.
- "Cars drifting around a race track at twilight and night as viewed
  from FPV drone.webm": CC BY 3.0, 4K, 161 s, **220.856.651 byte** —
  license hợp lệ và đúng hạng "tối + nhanh", nhưng quá lớn cho /tmp
  512MB khi đã có 4 clip khác nên không tải. Nếu cần thêm clip tối +
  nhanh thì dùng bản transcode 1080p VP9 của nó thay vì bản gốc.

### 1.3. KHÔNG PHẢI FOOTAGE MÁY QUAY — loại khỏi bộ dù license sạch

Ba clip dọc của NASA (SVS) có license pd/CC0 nhưng là **hoạt hình /
trực quan hoá**, không phải quay máy quay, nên không tính vào bộ
"footage thật" (và không dùng để đo parity footage thật):
- "Astrophysics Holiday Vertical Video (SVS14800 …)" — pd,
  1080×1920, 86,6 s, 29,6 MB (reel xoay đồ hoạ Fermi).
- "Webb Captures Jupiter's Aurora (SVS14839 - VERTICAL)" — pd,
  1080×1920, 167 s, 23,0 MB (trực quan hoá cực quang).
- "2024 Atlantic Hurricane Season (Vertical Mode) (SVS5515 …)" — pd,
  1080×1920, 121,7 s, 334,7 MB (đồ hoạ bão, quá lớn nên càng không tải).

## 2. Hạng H.264/MP4: KHÔNG TÌM ĐƯỢC trên Commons (ghi rõ, không bịa)

Đã thử 3 đường độc lập, đều cho kết quả âm tính:

1. Tìm kiếm API Commons `filemime:video/mp4` trong namespace File
   trả về **0 kết quả** — không có file gốc nào mang mime video/mp4.
2. API `videoinfo` (derivatives) của 3 file đại diện (Mossy Tree,
   hill climb, Snow LED) chỉ liệt kê transcode VP9 `.webm` và
   MPEG-4 Part 2 `.mov` 360p — **không có transcode H.264/MP4 nào**.
   Lưu ý: `.mov` mpeg4 (mp4v) KHÔNG phải H.264, không được tính là
   đạt hạng H.264/MP4.
3. Tìm kiếm `filetype:video` + từ khoá "mp4" không cho file .mp4 gốc
   nào; toàn bộ file gốc tìm được trong đợt này đều là `.webm`
   (VP8/VP9) hoặc `.ogv` (Theora).

Kết luận trung thực: **trên Wikimedia Commons, hạng H.264/MP4 coi như
không tồn tại** (Commons chỉ nhận gốc WebM/Ogg và chỉ transcode ra
VP9/MPEG-4). Muốn có clip H.264/MP4 license sạch thì phải sang nguồn
khác (vd. kho Prelinger/Internet Archive chưa xác minh từng file, hoặc
tự transcode VP9→H.264 từ clip đã xác minh — nhưng đó là bản chuyển
mã, không còn là "file gốc H.264"). Đợt này không làm cả hai hướng
đó, chỉ ghi nợ lại. Các clip đã tải vẫn bao phủ được mọi hạng còn lại
của nhiệm vụ.

## 3. Script fetch + bằng chứng cổng kiểm tra hoạt động

`scripts/fetch-r19-footage.sh` (kế thừa mẫu đợt 18, thay đổi duy nhất
đáng kể: cổng chấp nhận thêm CC BY không-SA, vì đợt 19 cần clip
1080p/tối/nhanh mà nhiều clip hay nhất trên Commons chỉ có CC BY;
CC BY vẫn nằm trong danh sách cho phép MIT/CC0/CC-BY/OFL của repo):

- `--check-only` từ chối CC BY-SA, exit 1 (2 trường hợp, cả hai đều
  là clip lẽ ra rất hợp nhiệm vụ nên càng chứng minh cổng không nể
  nang nội dung):
  - "Night Life at Katowice, Poland.webm" — dọc 1080×1920 + đêm,
    nhưng License=cc-by-sa-4.0 → REJECT.
  - "VTA light rail arriving at Hamilton station.webm" — dọc
    1080×1920, nhưng License=cc-by-sa-4.0 → REJECT.
  - Cùng nhóm bị loại khi rà soát (không chạy --check-only từng file
    nhưng đã đọc License qua API): "Rainbow over Mother Brook.webm"
    (dọc 480×640, BY-SA 4.0), "Flagpole on the Taunton Green…"
    (dọc 1080×1920, BY-SA 4.0), "Roller coaster vertical loop.ogv"
    (BY-SA 3.0).
- `--check-only` chấp nhận CC BY 3.0 (hill climb), exit 0.
- Chốt chặn OUTDIR trong repo: TỪ CHỐI, exit 2 (chạy với `assets`).
  Lưu ý: `assets/` vốn đã tồn tại sẵn trong repo (thư mục kho asset),
  script chỉ từ chối ghi vào đó, không tạo/xoá gì trong repo.
- Fetch thật vào `/tmp/vcut-r19-footage`: 4 file, ffprobe + giải mã
  thử 1 frame đều pass (log `/tmp/r19-fetch.log`), manifest
  `/tmp/vcut-r19-footage/LICENSES.txt` gồm title, trang nguồn,
  license API, URL tải, SHA256.

## 4. Kiểm tra bằng mắt (nội dung quay thật, không phải test pattern)

- C @t=1,5: khán giả + xe sự kiện ven đường đua, biển chỉ hướng;
  @t=5: xe đua đang chạy tới từ xa giữa đường đồi, đám đông dọc đường.
  Rõ ràng là quay thật ngoài trời, không phải đồ hoạ.
- D @t=1,5: đêm tối, vệt tuyết bay ngang dưới ánh đèn LED, cây tối —
  gần như đơn sắc, độ tương phản thấp (std chỉ 12,1, xem §5).
- E @t=5: drone dọc nhìn xuống tượng đài đỏ, đường, cọ, đường ray,
  ô tô nhỏ, 1 người đi bộ nhỏ xíu — quay thật từ drone.
- F @t=1,5: quảng trường, obelisk, du khách — quay thật, khung dọc.

## 5. Phương pháp + kết quả đo parity trên footage mới

Script đo mới: `server/render/src/measure_r19_footage_parity.js`
(chuyển thể từ script R18, tham số hoá W/H và danh sách type; dùng
CHÍNH module chung `harnessShared.js` + `describeTransition` từ module
thật, transpile bằng tsc sang /tmp — không sửa code sản phẩm):

- Chuẩn hoá cả 2 đầu vào bằng cùng filter chain
  `fps=30,scale=W:H,format=rgb24,settb=AVTB` — **ép rgb24 TRƯỚC
  xfade**, đúng miền đo đã chốt. Nguồn 25fps (C, D), 60fps (E),
  30fps (F) đều được resample về 30fps bởi cùng chain này; nguồn
  1080p được scale xuống 1280×720 cho cặp ngang để MAD so sánh được
  trực tiếp với R18 (không đo native 1080p — xem §6).
- Render: xfade duration=1 offset=1 trên 2 giây đầu mỗi clip, chỉ lấy
  frame giữa transition (index 45 @30fps, t=1.5, p=0.5); ngữ nghĩa
  xfade: tại t=1.5 lấy A(1.5) và B(0.5). Preview lấy màu từ đúng 2
  frame đó trích bằng cùng filter chain.
- Chỉ ghi 1 frame raw/lần render — không ghi 90 frame để không lặp
  lỗi đầy /tmp của đợt H6.
- Thang V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8.

### 5.1. Cặp ngang C→D, 1280×720 (log `/tmp/r19-parity-landscape.log`)

| Transition | MAD | ≤8 | Hạng |
|---|---|---|---|
| dissolve | 0,0017 | 100,00% | KHỚP |
| circleopen | 0,4946 | 100,00% | KHỚP |
| fade | 0,4980 | 100,00% | KHỚP |
| wipeleft | 0,0000 | 100,00% | KHỚP |

Độ phức tạp frame thật: A(1.5) std=68,0, diff-ngang=7,36 (cây cối +
đường đua chi tiết hơn nhiều so với bầu trời mịn của R18-A);
B(0.5) std=12,1, diff-ngang=1,02 (cảnh đêm tối, gần đơn sắc).
Đối chứng trích lặp frame A: tổng lệch tuyệt đối = **0**.

### 5.2. Cặp dọc E→F, 720×1280 (log `/tmp/r19-parity-vertical.log`)

| Transition | MAD | ≤8 | Hạng |
|---|---|---|---|
| dissolve | 0,0038 | 100,00% | KHỚP |
| circleopen | 0,4984 | 100,00% | KHỚP |
| fade | 0,5004 | 100,00% | KHỚP |
| wipeleft | 0,0000 | 100,00% | KHỚP |

Độ phức tạp frame thật: A(1.5) std=58,5, diff-ngang=5,79;
B(0.5) std=52,0, diff-ngang=1,80. Đối chứng trích lặp frame A: tổng
lệch tuyệt đối = **0**.

### 5.3. Tính lặp lại + đọc kết quả

- Chạy lặp cặp ngang lần 2 (log `/tmp/r19-parity-landscape2.log`):
  cả 4 MAD giống hệt lần 1 (0,0017 / 0,4946 / 0,4980 / 0,0000) —
  phép đo xác định, không phụ thuộc lần chạy.
- wipeleft = 0,0000 tuyệt đối ở cả 2 cặp: biên quét của mô hình khớp
  FFmpeg từng pixel, kể cả ở khung dọc (ngưỡng cột ti = floor(W/2)
  không gây lệch cột nào ở p=0,5).
- dissolve ~0,002–0,004 gần tuyệt đối ở cả 2 cặp — mô hình
  dissolve-noise khớp FFmpeg ngay cả trên nội dung tối (B đêm) và
  khung dọc.
- circleopen ~0,495–0,498 và fade ~0,498–0,500: cùng "sàn lượng tử
  hoá" đã chẩn đoán ở H6/N6/R18, xuất hiện ổn định qua 4 nội dung,
  2 hướng khung, 2 độ phân giải đo — không phải lỗi đường cong, và
  vẫn cách ngưỡng KHỚP (MAD ≤ 2) hơn 4 lần với 100% pixel lệch ≤ 8.
- Tổng số type đã đo trên footage thật sau đợt này: 4 type
  (dissolve, circleopen, fade, wipeleft); cộng đợt 18 thì dissolve và
  circleopen đã đo trên 2 bộ footage khác nhau, fade và wipeleft mới
  đo lần đầu trên footage thật. 77+ type còn lại vẫn chưa đo trên
  footage thật.

## 6. Cảnh báo trước khi phát hành + giới hạn chưa làm được

### 6.1. CẢNH BÁO NHÃN HIỆU / QUYỀN NHÂN THÂN (đọc trước khi đưa clip vào kho phát hành)

Dùng 4 clip này **chỉ để đo trong /tmp** là an toàn. Nếu muốn đưa vào
kho asset phát hành kèm sản phẩm thì phải kiểm tra lại từng clip dưới
đây — bản quyền sạch (CC0/pd/CC BY) KHÔNG tự động làm sạch nhãn hiệu
hay quyền nhân thân (đúng cảnh báo của Commons ở §1):

- **Clip C — CẦN KIỂM TRA KỸ NHẤT:** xe đua mang decal tài trợ
  (livery) theo bản chất của xe đua — ở độ phân giải đo thì chữ trên
  xe không đọc được nhưng decal vẫn hiện hữu; cổng chào sự kiện có
  chữ "…sport" đọc được một phần; khán giả ven đường lộ mặt (chủ yếu
  nhìn từ sau lưng / ở xa). Thêm nữa: nguồn gốc YouTube (§1.1) cần
  đối chiếu lại trước khi phát hành. **Không đưa C vào kho phát hành
  nếu chưa rà soát livery + mặt người + nguồn YouTube.**
- **Clip D — SẠCH NHẤT:** đêm tối, tuyết, đèn đường, cây — không
  người, không biển hiệu, không logo nhìn thấy được ở frame đã kiểm
  tra. Vẫn nên quét lại toàn bộ 34,8 s (luồng này chỉ nhìn frame
  t=1,5) trước khi phát hành.
- **Clip E — CẦN KIỂM TRA TÁC PHẨM CÔNG CỘNG:** tượng đài Puerta
  Saturnina là tác phẩm điêu khắc ngoài trời chiếm khung hình chính
  — quyền panorama / quyền tác giả của tác phẩm có thể áp dụng tuỳ
  luật nơi đặt tượng, độc lập với CC0 của video. Ô tô và biển số ở
  xa không đọc được; 1 người đi bộ rất nhỏ. **Không phát hành E nếu
  chưa xác nhận quyền panorama cho tượng đài này.**
- **Clip F — CẦN KIỂM TRA MẶT NGƯỜI:** du khách ở quảng trường, một
  số mặt nhìn thấy được ở cự ly gần (dù nhỏ trong khung 480×640);
  không có biển hiệu/logo thương mại. Kiểm tra quyền nhân thân cho
  người nhận diện được trước khi phát hành.
- **CC BY bắt buộc ghi công:** clip C (Jan Šefran, CC BY 3.0) và clip
  D (W.carter, CC BY 4.0) — phát hành lại mà không ghi công là vi phạm
  giấy phép, dù Commons cho tải miễn phí.
- **Commons không bảo đảm license từng file** (§1): SHA256 trong
  §1.1 + manifest `/tmp/vcut-r19-footage/LICENSES.txt` là bằng chứng
  về trạng thái tại thời điểm tải (29/10/2026), không phải bảo đảm
  vĩnh viễn; nếu file gốc bị đổi license hoặc bị gỡ sau này thì phải
  đo lại từ đầu với file khác.

### 6.2. Giới hạn đo lường còn lại (trung thực)

- **Chưa có clip H.264/MP4** (§2) — hạng duy nhất trong nhiệm vụ
  không tìm được trên Commons; cần nguồn khác hoặc tự transcode
  (nhưng đó không còn là file gốc H.264).
- **Đo ở 1280×720 / 720×1280, không phải native 1080p:** cặp ngang
  scale từ 1080p xuống để MAD so sánh được với R18; parity ở native
  1920×1080 chưa đo (dự kiến MAD tương tự vì cùng mô hình, nhưng chưa
  đo thì chưa kết luận).
- **Chưa đo ô yuv420p e2e trên footage mới** (phạm vi badge giữ
  nguyên rgb24). Dựa vào H6/N6 (yuv420p LỆCH nặng trên mọi nguồn tổng
  hợp), nhiều khả năng yuv420p trên footage thật cũng LỆCH, nhưng đó
  là suy đoán — chưa đo thì chưa kết luận.
- **Mới đo 4 type trên footage mới** (tổng 4 type trên footage thật);
  77+ type còn lại chưa đo trên footage thật.
- **Chỉ nhìn 1–2 frame/clip bằng mắt:** nội dung toàn bộ clip (đặc
  biệt C dài 9,7 s có xe chạy qua, E dài 78 s bay drone) chưa quét
  hết từng giây — cảnh báo §6.1 dựa trên frame đã nhìn, không phải
  rà soát toàn clip.
- **Không có FPS canvas / click-test trên footage mới** (blocker
  headed của N6 vẫn còn); script đo chỉ chạy ở tầng FFmpeg + module
  preview, không qua trình duyệt.
- **Đa dạng vẫn chưa đủ:** 6 clip tổng cộng, chưa có người nói/chân
  dung cận cảnh (quyền nhân thân), chưa có 4K quay thật nào được tải
  (Mossy Tree vẫn chỉ là ứng viên), chưa có clip dọc 1080×1920 nào
  ngoài E (F chỉ 480×640).

## 7. Kiểm chứng đã chạy

- `bash -n scripts/fetch-r19-footage.sh`: pass.
- `--check-only` từ chối CC BY-SA (Katowice, VTA): REJECT, exit 1.
- `--check-only` chấp nhận CC BY 3.0 (hill climb): OK, exit 0.
- Chốt chặn OUTDIR trong repo: TỪ CHỐI, exit 2.
- Fetch thật vào `/tmp/vcut-r19-footage`: 4 file, ffprobe + giải mã
  thử 1 frame đều pass (log `/tmp/r19-fetch.log`).
- `node --check server/render/src/measure_r19_footage_parity.js`: pass.
- Parity cặp ngang chạy trọn vẹn **2 lần**, số MAD giống hệt nhau
  (log `/tmp/r19-parity-landscape.log`,
  `/tmp/r19-parity-landscape2.log`); cặp dọc 1 lần
  (`/tmp/r19-parity-vertical.log`).
- Kiểm tra bằng mắt 6 frame trích (`/tmp/r19-eye-c.png`,
  `/tmp/r19-eye-d.png`, `/tmp/r19-eye-e.png`, `/tmp/r19-eye-f.png`,
  `/tmp/r19-eye-c5.png`, `/tmp/r19-eye-c8.png`): nội dung quay thật
  như mô tả §4.
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code sản phẩm hay
  code TS nào — script đo chỉ transpile module TS sang /tmp để đo,
  như mẫu H6/R18; script fetch là bash, không liên quan build web).
- KHÔNG chạy click-test browser thật (nợ mở chung, §6.2).
- KHÔNG sửa file nào khác: chỉ tạo 3 file mới ở §8, không đụng
  code sản phẩm, harness, store, preview, render, i18n, hay file của
  luồng khác.

## 8. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `scripts/fetch-r19-footage.sh` (MỚI — fetch 4 clip mẫu từ Commons
  về OUTDIR ngoài repo, kèm kiểm tra license API {cc0, pd, cc-by
  không-SA} + ffprobe + manifest LICENSES.txt; binary KHÔNG vào repo)
- `server/render/src/measure_r19_footage_parity.js` (MỚI — parity
  dissolve/circleopen/fade/wipeleft trên footage mới, dùng module
  chung harnessShared; tham số hoá W/H để đo cả cặp ngang lẫn dọc)
- `docs/PHASE9_ROUND19_G5_FOOTAGE_LIMITS.md` (MỚI — chính file này)

KHÔNG đưa vào stage (chỉ để trên đĩa / trong /tmp, ghi tên để đối chiếu):
binary mẫu `/tmp/vcut-r19-footage/clip-c-hillclimb.webm`,
`clip-d-snowled.webm`, `clip-e-puerta-vertical.webm`,
`clip-f-vatican-vertical.ogv`, manifest
`/tmp/vcut-r19-footage/LICENSES.txt`, log `/tmp/r19-fetch.log`,
`/tmp/r19-parity-landscape.log`, `/tmp/r19-parity-landscape2.log`,
`/tmp/r19-parity-vertical.log`, frame kiểm tra bằng mắt
`/tmp/r19-eye-*.png`, thư mục tmp của script đo `/tmp/r19-footage-*`.
Không tạo file binary nào trong repo. Không push, không tag/release.
