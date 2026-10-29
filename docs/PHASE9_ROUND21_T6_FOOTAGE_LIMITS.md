# Phase 9 đợt 21 (T6) — footage máy quay thật H.264/1080p license sạch + parity: LIMITS trung thực

> Đợt 21, luồng T6 (footage thật + parity). Luật cứng đã giữ: KHÔNG push
> GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag, KHÔNG code
> giả, KHÔNG stage (parent stage), KHÔNG tải binary vào repo, KHÔNG sửa
> store, preview, panel, harness chung (chỉ thêm mode đo trong chính
> script đo của luồng này), KHÔNG ghi build-loop-log (parent gộp).
> Chỉ tạo 3 file text dưới đây. Máy đo: VM 2 vCPU, FFmpeg/ffprobe 8.1.2,
> /tmp 512MB (đợt này /tmp bị reset giữa chừng 1 lần — xem §7).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

Nợ mở từ đợt 18–20 ("chưa có clip H.264/MP4, chưa có 1080p đo native,
chưa có dọc/tối/nhanh ở hạng H.264") nay **đóng được phần lớn**:

- Đã tìm và tải **3 clip quay thật H.264** (lần đầu bộ footage có
  H.264): **G = Artemis I phóng đêm, H.264 1920×1080 30fps** (NASA,
  public-domain-equivalent theo chính sách NASA) — đồng thời là clip
  **tối + chuyển động nhanh**; H = phim 1950 "Don't Talk to
  Strangers" (Internet Archive, H.264 640×480, licenseurl publicdomain);
  I = Earth from Orbit 2013 (NASA, H.264 1280×720).
- Parity **RGB24: cả 3 type (dissolve, circleopen, fade) × cả 2 cặp
  đều KHỚP** (MAD 0,0023–0,5048, 100% pixel lệch ≤ 8), và **dissolve
  ở native 1920×1080 cũng KHỚP** (MAD 0,0054) — lần đầu đo parity ở
  native 1080p trên footage thật (R19 chỉ đo 1080p nguồn scale xuống
  720p).
- **Phát hiện mới, trung thực: ngưỡng KHỚP YUV crf ≤ 14 của R20 R6
  KHÔNG chuyển nguyên vẹn sang footage thật.** Trên cặp phóng đêm →
  phim 1950, dissolve ở yuv420p crf14 chỉ đạt **XẤP XỈ
  (MAD-YUV 2,3436)**, trong khi cặp phóng đêm → quỹ đạo Trái Đất vẫn
  KHỚP ở crf14 (1,6921). Quét bổ sung: cặp 1 về **KHỚP ở crf12
  (1,9930)**. Kết luận cũ của R6 KHÔNG bị sửa (nó đúng trên test
  pattern và vẫn đúng trên cặp 2) — chỉ bổ sung: **ngưỡng crf YUV
  phụ thuộc nội dung**; với footage hạt/chi tiết như phim 1950 thì
  cần crf ≤ 12 cho dissolve. Circleopen/fade KHỚP ở crf14 trên cả 2
  cặp (0,85–1,03).
- Sàn YUV ở crf0 cho dissolve trên footage thật là **0,6498 (KHỚP),
  không phải 0,0000 như R6 đo trên test pattern** — đã kiểm chứng
  độc lập bằng ffmpeg thuần (§5.3): xfade khi đầu ra là yuv420p xử
  lý khác với blend trong rgb24 rồi mới chuyển sang yuv; đó là tính
  chất pipeline, không phải bug script đo.
- Binary chỉ nằm ở `/tmp/vcut-r21-footage`, **không có trong repo,
  không stage**. Chưa có clip dọc H.264 (xem §6).

## 1. Nguồn đã xác minh license (API từng file, không tin tên file)

### 1.1. Vì sao không dùng Commons/Openverse cho hạng này

- **Wikimedia Commons: đã chứng minh ở R19 §2 là không có file gốc
  H.264/MP4 nào** (tìm `filemime:video/mp4` trả 0 kết quả; transcode
  chỉ có VP9 và MPEG-4 Part 2, không phải H.264). Vì vậy nhiệm vụ
  "H.264/1080p" không thể làm qua Commons — phải sang nguồn khác.
- **Openverse: đã thử trong đợt này nhưng không dùng được.** API
  video `api.openverse.org/v1/video/?license=cc0,pdm` trả **403**
  (không User-Agent) rồi **empty reply** (có User-Agent) từ VM này.
  Ghi rõ: Openverse **không được kiểm tra thành công trong đợt
  này**, không mạo nhận đã xác minh qua Openverse. Thay vào đó,
  license được xác minh qua **API sơ cấp của chính nguồn chứa file**
  (NASA images-api và Internet Archive metadata API) — cùng nguyên
  tắc "chỉ tin trường license của API cho từng file cụ thể" như
  R18/R19, chỉ khác nguồn API vì Commons không có hạng này.

### 1.2. BA CLIP MỚI ĐÃ TẢI (đã nhìn bằng mắt, §4)

| Clip | Nội dung thật (đã nhìn bằng mắt) | ffprobe thật | API nguồn / license | SHA256 |
|---|---|---|---|---|
| G: `clip-g-artemis-launch.mp4` — NASA "Artemis I Launch (Press Site)", nasa_id `Artemis I Launch 2022 CU tracking from Press Site_compressed`, bản `~large.mp4` | Tên lửa SLS phóng **ban đêm**: tháp phóng, khói, lửa động cơ, tên lửa rời bệ — tối + chuyển động nhanh thật | **H.264, 1920×1080, 30fps**, 341,483 s, 217.168.897 byte | NASA images-api: photographer=`NASA/Sam Lott`, center=`MSFC`, title=`Artemis I Launch (Press Site)` — item do NASA sản xuất. Căn cứ license: trang NASA Images and Media Usage Guidelines (nasa.gov/nasa-brand-center/images-and-media): nội dung NASA "generally are not subject to copyright in the United States", dùng được cho mục đích giáo dục/thông tin kèm ghi nguồn NASA | fc97cf25bda929757c3e658a82f8d00440a3d5d6f97f133c8a873a4716efaaf9 |
| H: `clip-h-donttalk1950.mp4` — IA `DontTalk1950`, file `DontTalk1950.mp4` | Phim giáo dục 1950: phố, trường học, trẻ em, ô tô (quay từ gương xe) — quay thật ngoài trời | **H.264, 640×480, 29,97fps**, 787,920 s, 81.945.828 byte | IA metadata API: `licenseurl=http://creativecommons.org/licenses/publicdomain/`, file có `format=h.264` — public domain | 274a85050e1cc9e8faf6d7a6382633f618a34f26bcb0f4ab66aa8252e075d28a |
| I: `clip-i-earth-orbit.mp4` — NASA "Earth from Orbit 2013", nasa_id `GSFC_20140421_EarthOrbit_m11525`, bản `~medium.mp4` | Viền Trái Đất nhìn từ quỹ đạo lúc bình minh — quay thật từ vũ trụ, chuyển động chậm | **H.264, 1280×720, 30fps**, 228,033 s, 65.068.407 byte | NASA images-api: photographer=(trống), center=`GSFC` — item của trung tâm NASA. Cùng căn cứ license như clip G | c080c73080a25b3b2f937ff367b9c824fb1139b0c3588099df50f2cbc09e5d7e |

Ghi chú nguồn gốc cần nói rõ:
- Clip G và I được dùng theo chính sách NASA (nội dung NASA "generally
  are not subject to copyright"), **không phải deed CC0** — trích dẫn
  phải ghi đúng "NASA public-domain-equivalent (US government work)",
  không ghi "CC0". Ngoại lệ của chính sách vẫn áp dụng: logo/insignia
  NASA không thuộc public domain, nội dung bên thứ ba có bản quyền
  (nếu bị đánh dấu) không được chuyển quyền, và không được ngụ ý NASA
  chứng thực sản phẩm. Clip G có logo NASA trên tên lửa/tháp phóng ở
  khung hình — dùng để đo trong /tmp là an toàn, nhưng nếu đưa vào kho
  phát hành thì phải rà soát logo theo chính sách này (xem §6.1).
- Clip H là phim Prelinger 1950; license ghi nhận là **licenseurl do
  API IA trả về cho item**, không phải xác minh độc lập lại với bản
  quyền gốc của phim. Nếu đưa H vào kho phát hành thì phải đối chiếu
  thêm bước này.
- Clip I có photographer trống nhưng center GSFC — script chấp nhận
  qua nhánh center NASA (đã ghi rõ trong script); đây là điểm yếu
  hơn clip G (photographer NASA rõ ràng) và được ghi nhận tại đây.

### 1.3. BẰNG CHỨNG CỔNG KIỂM TRA HOẠT ĐỘNG — trường hợp phủ định

IA item `BACTER_CREAM`: licenseurl =
`http://creativecommons.org/licenses/by-nc-nd/2.5/ca/` (BY-NC-ND, nằm
ngoài danh sách MIT/CC0/CC-BY/OFL/public-domain) → script
`--check-only-ia` in REJECT, exit 1. Cổng IA không nể nang nội dung.
Cùng đợt, `--check-only-nasa` chấp nhận clip G (exit 0) và
`--check-only-ia` chấp nhận clip H (exit 0).

### 1.4. Bảng hạng mục nhiệm vụ (mỗi hạng ít nhất 1 clip nếu tìm được thật)

| Hạng mục ưu tiên | Kết quả | Clip |
|---|---|---|
| H.264/MP4 | **CÓ (lần đầu)** — cả 3 clip đều H.264 thật, xác minh qua ffprobe | G, H, I |
| 1080p | **CÓ** — G là 1920×1080 native, đã đo native (§5.2) | G |
| Clip dọc (portrait) H.264 | **KHÔNG TÌM ĐƯỢC trong đợt này** (xem §6) | — (dọc vẫn chỉ có E/F webm/ogv của R19) |
| Cảnh tối | **CÓ** | G (phóng đêm) |
| Chuyển động nhanh | **CÓ** | G (phóng, tên lửa rời bệ) |

## 2. Script fetch (thứ duy nhất về sau được stage — binary thì không)

`scripts/fetch-r21-footage.sh` (kế thừa mẫu R18/R19, thay nguồn xác
minh sang NASA images-api + IA metadata API vì lý do §1.1):
- `--check-only-nasa "<nasa_id>"`: item phải tồn tại qua images-api
  và có photographer bắt đầu bằng "NASA" HOẶC center là trung tâm
  NASA (GSFC/MSFC/KSC/JSC/GRC/ARC/LARC/AFRC/HQ); ngược lại REJECT.
- `--check-only-ia "<identifier>" [mp4file]`: licenseurl phải chứa
  "publicdomain" VÀ file mp4 phải có format "h.264"; ngược lại REJECT.
- **Chốt chặn OUTDIR trong repo: TỪ CHỐI, exit 2** (đã kiểm chứng
  với `assets`).
- Sau mỗi lần tải: ffprobe (codec/kích thước/duration) + ffmpeg giải
  mã thử 1 frame + ghi `LICENSES.txt` trong OUTDIR gồm label, kết quả
  kiểm tra API, URL tải, SHA256.
- Chỉ tải 3 file mẫu, gửi User-Agent định danh, không tải hàng loạt.

## 3. Phương pháp đo parity trên footage H.264 mới

Script đo mới: `server/render/src/measure_r21_footage_parity.js`
(chuyển thể từ script R19, tham số hoá cửa sổ đo + thêm 2 mode đo;
dùng CHÍNH module chung `harnessShared.js` + `describeTransition`
từ module thật, transpile bằng tsc sang /tmp — không sửa code sản phẩm):

- **Cửa sổ đo** (khác R18/R19 dùng 2 giây đầu file): mỗi clip dùng
  cửa sổ 2 giây bắt đầu tại `<win>` truyền qua dòng lệnh, vì clip
  phóng cần cửa sổ chứa thời điểm phóng và clip 1950 cần cửa sổ phố:
  G = 58–60s, H = 30–32s, I = 0–2s. Ngữ nghĩa xfade giữ nguyên trong
  cửa sổ: A(win+1.5), B(win+0.5). Cửa sổ in ra log và ghi tại đây.
- **Ô RGB24** (giữ nguyên R18/R19): chuẩn hoá cả 2 đầu vào bằng cùng
  filter chain `fps=30,scale=W:H,format=rgb24,settb=AVTB`, **ép rgb24
  TRƯỚC xfade**; xfade duration=1 offset=1; chỉ lấy frame giữa
  transition (index 45 @30fps, p=0.5). Thang V6: KHỚP = MAD ≤ 2 và
  ≥99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20 và ≥90% ≤ 8; còn lại LỆCH.
- **Ô YUV420p e2e** (theo ĐÚNG phương pháp R20 R6 §1): encode 2 giây
  bằng libx264 preset medium ở crf cho trước (mặc định 14 — ngưỡng
  KHỚP YUV đã khóa cho dissolve), `format=yuv420p` sau xfade; decode
  frame 45 ra yuv420p raw (+ rgb24 để đối chứng MAD-RGB); so yuv với
  preview chuyển sang yuv420p bằng CHÍNH FFmpeg
  (`harnessShared.ffmpegRgbToYuv420` + `yuv420Mad`, kiểu S5b đợt 18).
  Phân loại V6-tham-chiếu (thang V6 gốc định nghĩa cho MAD RGB; số
  miền YUV chỉ tham chiếu, không phải badge mới). File mp4 2s bị xoá
  ngay sau khi decode để tiết kiệm /tmp.
- **Ô bổ sung** (cờ dòng lệnh, không làm thay đổi ô gốc):
  `--native1080-dissolve` (dissolve ở native 1920×1080 rgb24),
  `--crf0-ref` (dissolve yuv crf0 đối chứng),
  `R21_YUV_CRF=<n>` + `--types=<danh sách>` (quét crf khác / chạy
  riêng 1 type — dùng cho phép đo crf12 bổ sung ở §5.1).
- Chỉ ghi 1 frame raw/lần render — không ghi 90 frame để không lặp
  lỗi đầy /tmp của đợt H6.

## 4. Kiểm tra bằng mắt (nội dung quay thật, không phải test pattern)

- G @59,5s (trong cửa sổ đo): tên lửa SLS ban đêm đang rời bệ, lửa
  động cơ sáng chói, khói cuồn cuộn, tháp phóng 2 bên — quay thật,
  tối + chuyển động nhanh đúng như nhiệm vụ yêu cầu.
- G @40s/@60s (thăm dò trước khi chọn cửa sổ): @40s tên lửa còn trên
  bệ, động cơ vừa cháy sáng; @60s đã bay lên rõ — cửa sổ 58–60s ôm
  đúng thời điểm phóng.
- H @30s/@30,5s: phố 1950, trường học, trẻ em, ô tô — quay thật ngoài
  trời, máy quay chuyển động (nhìn qua gương xe).
- H @60s: cận mặt 1 trẻ em — ghi nhận cho cảnh báo quyền nhân thân
  ở §6.1 (cửa sổ đo dùng 30–32s nên frame đo không phải cận mặt này,
  nhưng toàn bộ clip vẫn chứa người nhận diện được).
- I @0,5s: viền Trái Đất cong dưới ánh bình minh trên nền đen vũ trụ
  — quay thật từ quỹ đạo, chuyển động chậm, gần như đơn sắc tối
  (std 28,6, diff-ngang 0,16 — mịn nhất trong bộ).

## 5. Kết quả đo (số thật, log giữ lại)

Độ phức tạp frame đo: A(G,59.5) std=46,4 diff-ngang=1,23 (cả 2 cặp
dùng chung A); B(H,30.5) std=37,4 diff-ngang=1,11; B(I,0.5) std=28,6
diff-ngang=0,16. Đối chứng trích lặp frame A: tổng lệch tuyệt đối =
**0** ở cả 2 cặp (chuỗi chuẩn hoá xác định).

### 5.1. Cặp 1: G (phóng đêm 1080p) → H (phim 1950), 1280×720 (log `/tmp/r21-parity-pair1.log`)

| Transition | RGB24 (MAD / ≤8 / hạng) | YUV420p crf14 (MAD-YUV / ≤8 / V6-tham-chiếu) | MAD-RGB của frame decode |
|---|---|---|---|
| dissolve | 0,0044 / 100,00% / **KHỚP** | 2,3436 (Y=2,7233 U=1,7279 V=1,4408) / 98,63% / **XẤP XỈ** | 6,9775 / 68,24% / LỆCH |
| circleopen | 0,4998 / 100,00% / **KHỚP** | 1,0180 (Y=1,2625 U=0,6868 V=0,3711) / 99,98% / **KHỚP** | 1,9211 / 99,88% / KHỚP |
| fade | 0,4989 / 100,00% / **KHỚP** | 1,0303 (Y=1,2808 U=0,7401 V=0,3190) / 100,00% / **KHỚP** | 1,8914 / 99,96% / KHỚP |

Đối chứng + quét bổ sung (cùng cặp 1):
- Dissolve YUV **crf0: MAD-YUV 0,6498** (Y=0,7659 U=0,6501 V=0,1847)
/ 100,00% / KHỚP — xem §5.3 về sàn này.
- Dissolve YUV **crf12: MAD-YUV 1,9930** (Y=2,2636 U=1,5866 V=1,3170)
/ 99,56% / **KHỚP** (log `/tmp/r21-parity-pair1-crf12.log`; chạy bằng
  `R21_YUV_CRF=12 ... --types=dissolve`, RGB lặp lại đúng 0,0044).
  → Trên nội dung hạt/chi tiết như phim 1950, dissolve YUV cần
  **crf ≤ 12** mới KHỚP, không phải crf ≤ 14 như test pattern.

### 5.2. Cặp 2: G (phóng đêm 1080p) → I (quỹ đạo 720p), 1280×720 (log `/tmp/r21-parity-pair2.log`)

| Transition | RGB24 (MAD / ≤8 / hạng) | YUV420p crf14 (MAD-YUV / ≤8 / V6-tham-chiếu) | MAD-RGB của frame decode |
|---|---|---|---|
| dissolve | 0,0023 / 100,00% / **KHỚP** | 1,6921 (Y=1,7679 U=1,5619 V=1,5189) / 99,74% / **KHỚP** | 6,2308 / 75,18% / LỆCH |
| circleopen | 0,5048 / 100,00% / **KHỚP** | 0,8551 (Y=1,0209 U=0,6558 V=0,3910) / 99,98% / **KHỚP** | 1,8989 / 99,87% / KHỚP |
| fade | 0,4991 / 100,00% / **KHỚP** | 0,8446 (Y=1,0344 U=0,6231 V=0,3073) / 100,00% / **KHỚP** | 1,8668 / 99,97% / KHỚP |

### 5.3. Ô native 1080p + sàn YUV crf0 — đọc kết quả

- **Dissolve native 1920×1080 rgb24 (cặp 1): MAD 0,0054, ≤8 100,00%,
  KHỚP** — gần như tuyệt đối như ở 720p (0,0044). Lần đầu tiên
  parity được đo ở native 1080p trên footage thật; mô hình
  dissolve-noise khớp FFmpeg cả khi không scale xuống.
- **Sàn YUV crf0 = 0,6498, không phải 0,0000 như R6.** Đã kiểm chứng
  độc lập bằng ffmpeg thuần (không qua script đo): render dissolve
  rgb frame 45 rồi chuyển sang yuv420p bằng FFmpeg, so với decode
  yuv của bản encode crf0 cùng chuỗi → **MAD 0,6472** (sai khác
  0,0026 so với 0,6498, đúng bằng khe rgb preview-vs-render 0,0044).
  Kết luận: khi đầu ra xfade là yuv420p, FFmpeg xử lý (blend/chuyển
  miền) khác với blend trong rgb24 rồi mới chuyển sang yuv — sàn
  0,65 này là tính chất pipeline, không phải bug script đo. Số 0,0000
  của R6 đo trên test pattern (nội dung phẳng/đồ hoạ) nên không
  chuyển sang footage thật có nhiễu hạt và chi tiết quang học.
  **Không đổi kết luận R6** (nó đúng trên test pattern của nó) —
  chỉ ghi thêm: sàn YUV crf0 phụ thuộc nội dung.
- **MAD-RGB của frame decode (cột phải): dissolve ~6–7 LỆCH, còn
  circleopen/fade ~1,9 KHỚP** — cùng mẫu ở cả 2 cặp. Giải thích nhất
  quán: dissolve blend 50/50 khắp frame nên mọi pixel đều chịu lỗi
  subsample 4:2:0; circleopen/fade ở p=0,5 chủ yếu là vùng thuần A
  hoặc thuần B (chỉ biên chuyển đổi bị ảnh hưởng) nên decode gần
  như khớp preview. So với R6 (MAD-RGB ~57,78 trên test pattern),
  sàn subsample trên footage thật mịn hơn hẳn (~6–7) — test pattern
  có chi tiết màu tần số cao nên lỗi subsample lớn hơn nhiều. Đây
  là bằng chứng nữa rằng **không được trích số subsample của test
  pattern sang footage thật**.

### 5.4. Đọc tổng hợp — ngưỡng crf YUV phụ thuộc nội dung

| Nội dung | Dissolve YUV crf14 | Dissolve YUV crf12 | Nguồn |
|---|---|---|---|
| Test pattern (smptebars/testsrc2) | 1,8094 KHỚP | (không đo; crf12 = 1,4079 KHỚP) | R20 R6 |
| Phóng đêm → quỹ đạo (mịn, hdiff 0,16–1,23) | 1,6921 KHỚP | — | Đợt này, cặp 2 |
| Phóng đêm → phim 1950 (hạt, hdiff 1,11) | 2,3436 XẤP XỈ | 1,9930 KHỚP | Đợt này, cặp 1 |

Quy tắc thực hành rút ra (ghi đúng phạm vi đo, không tổng quát hoá
vượt 3 nội dung đã đo): **muốn KHỚP miền YUV cho dissolve trên mọi
footage đã đo thì dùng crf ≤ 12**; crf14 chỉ an toàn trên nội dung
mịn/test pattern. Circleopen/fade KHỚP ở crf14 trên cả 2 cặp nên
không cần hạ crf cho 2 type này (chưa đo crf cao hơn cho chúng).

## 6. Giới hạn chưa làm được / nợ còn lại (trung thực)

### 6.1. CẢNH BÁO TRƯỚC KHI PHÁT HÀNH (đọc trước khi đưa clip vào kho phát hành)

Dùng 3 clip này **chỉ để đo trong /tmp** là an toàn. Nếu muốn đưa vào
kho asset phát hành kèm sản phẩm thì phải kiểm tra lại từng clip —
bản quyền sạch KHÔNG tự động làm sạch nhãn hiệu hay quyền nhân thân:

- **Clip G — CẦN KIỂM TRA LOGO NASA:** khung hình chứa logo NASA
  trên tên lửa/tháp phóng; chính sách NASA cấm dùng insignia/logotype
  như thể được NASA chứng thực. Không phát hành G nếu chưa rà soát
  logo và ghi nguồn NASA đúng cách.
- **Clip H — CẦN KIỂM TRA QUYỀN NHÂN THÂN + NGUỒN GỐC:** phim 1950
  chứa trẻ em nhận diện được (đặc biệt cận mặt @60s); quyền nhân
  thân/quyền riêng tư có thể áp dụng độc lập với public domain. Nguồn
  gốc Prelinger cũng cần đối chiếu thêm trước khi phát hành (§1.2).
- **Clip I — SẠCH NHẤT:** quỹ đạo Trái Đất, không người, không logo,
  không biển hiệu nhìn thấy được ở frame đã kiểm tra. Vẫn nên quét
  lại toàn bộ 228 s (luồng này chỉ nhìn frame @0,5s) trước khi phát
  hành.
- **NASA không phải CC0:** clip G/I phải được trích là "NASA
  public-domain-equivalent (US government work)", không trích "CC0".
- **IA/NASA không bảo đảm license từng file vĩnh viễn:** SHA256 trong
  §1.2 + manifest `/tmp/vcut-r21-footage/LICENSES.txt` là bằng chứng
  về trạng thái tại thời điểm tải (29/10/2026); nếu file gốc bị đổi
  license hoặc bị gỡ sau này thì phải đo lại từ đầu với file khác.

### 6.2. Giới hạn đo lường còn lại

- **Chưa có clip dọc H.264:** đã có dọc ở R19 (E webm, F ogv) nhưng
  chưa có clip dọc nào ở hạng H.264. Hướng tiếp theo: tìm clip dọc
  H.264 trên IA (phim dọc hiếm) hoặc NASA vertical reel (cần kiểm tra
  xem có phải quay thật hay đồ hoạ như 3 reel NASA đã loại ở R19
  §1.3) — chưa làm trong đợt này.
- **Chưa đo native 1080p cho circleopen/fade** (chỉ dissolve có ô
  native 1080p); chưa đo 4K; chưa đo 79 type còn lại trên footage
  H.264 (mới đo 3 type).
- **Chưa đo crf > 14 cho circleopen/fade** (chưa biết ngưỡng trượt
  của 2 type này trên footage thật); chưa đo preset khác ở crf12/14
  trên footage thật (R6 chỉ đo preset trên test pattern).
- **Chỉ nhìn 1–3 frame/clip bằng mắt:** nội dung toàn bộ clip (đặc
  biệt G dài 341 s, H dài 788 s) chưa quét hết từng giây — cảnh báo
  §6.1 dựa trên frame đã nhìn, không phải rà soát toàn clip.
- **Không có FPS canvas / click-test trên footage H.264** (blocker
  headed của N6 vẫn còn); script đo chỉ chạy ở tầng FFmpeg + module
  preview, không qua trình duyệt.
- **Đa dạng vẫn chưa đủ:** 9 clip tổng cộng sau đợt này (2 R18 + 4
  R19 + 3 R21), vẫn chưa có người nói/chân dung cận cảnh, chưa có
  4K quay thật nào được tải, chưa có clip dọc H.264.

## 7. Kiểm chứng đã chạy + sự cố /tmp

- `bash -n scripts/fetch-r21-footage.sh`: pass.
- `node --check server/render/src/measure_r21_footage_parity.js`: pass
  (cả trước và sau khi thêm cờ `--types`/`R21_YUV_CRF` + sửa header
  log từ crf14 cố định sang crf thực tế — sửa cosmetic sau khi đo,
  không đổi số đo; các log cặp 1/2 vẫn ghi đúng crf của chúng).
- `--check-only-ia BACTER_CREAM`: REJECT, exit 1 (§1.3).
- `--check-only-nasa` clip G: OK, exit 0; `--check-only-ia` clip H:
  OK, exit 0.
- Chốt chặn OUTDIR trong repo: TỪ CHỐI, exit 2 (chạy với `assets`).
- Fetch thật vào `/tmp/vcut-r21-footage`: 3 file, ffprobe + giải mã
  thử 1 frame đều pass (log `/tmp/r21-fetch2.log` — log fetch lần 2;
  xem sự cố dưới).
- Parity cặp 1 chạy trọn vẹn, exit 0 (log `/tmp/r21-parity-pair1.log`);
  cặp 2 chạy trọn vẹn, exit 0 (log `/tmp/r21-parity-pair2.log`); quét
  crf12 cặp 1 chạy trọn vẹn (log `/tmp/r21-parity-pair1-crf12.log`,
  RGB lặp lại đúng 0,0044).
- Kiểm tra bằng mắt 3 frame đo (`/tmp/r21-eye-g.jpg` @59,5s,
  `/tmp/r21-eye-h.jpg` @30,5s, `/tmp/r21-eye-i.jpg` @0,5s) + frame thăm
  dò G @40s/@60s, H @30s/@60s: nội dung quay thật như mô tả §4.
- Kiểm chứng sàn YUV crf0 bằng ffmpeg thuần (không qua script đo):
  MAD 0,6472, khớp 0,6498 của script trong 0,0026 (§5.3).
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code sản phẩm hay
  code TS nào — script đo chỉ transpile module TS sang /tmp để đo,
  như mẫu H6/R18/R19; script fetch là bash, không liên quan build web).
- KHÔNG chạy click-test browser thật (nợ mở chung, §6.2).
- KHÔNG sửa file nào khác: chỉ tạo 3 file mới ở §8, không đụng code
  sản phẩm, harness, store, preview, render, i18n, hay file của luồng
  khác.

**Sự cố /tmp bị reset giữa chừng (ghi rõ, không giấu):** sau khi fetch
lần 1 xong (3 file, 364MB) và trong lúc chạy đo cặp 1, /tmp bị dọn
sạch (toàn bộ file đợt này biến mất, chỉ còn file của luồng khác) —
lượt đo cặp 1 đầu tiên bị abort vì "không thấy file nguồn". Đã xử lý
bằng cách chạy lại toàn bộ chuỗi trong 1 script duy nhất (fetch →
cặp 1 → cặp 2) và đo lại từ đầu; mọi số trong §5 đều từ chuỗi chạy
lại này (log fetch2 + pair1 + pair2), không phải từ lần chạy bị abort.
Bài học cho đợt sau: **đừng để /tmp 512MB chứa đồng thời 364MB footage
+ thư mục đo của nhiều luồng khác** — chuỗi fetch→đo nên chạy liền
mạch, và thư mục tmp của script đo đã được dọn sau khi ghi log (chỉ
giữ log + frame mắt + footage) để tránh đầy /tmp. Tổng dung lượng
/tmp cuối đợt: 365MB đã dùng / 148MB trống.

## 8. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `scripts/fetch-r21-footage.sh` (MỚI — fetch 3 clip H.264 từ NASA +
  IA về OUTDIR ngoài repo, kèm kiểm tra license API NASA/IA +
  ffprobe + manifest LICENSES.txt; binary KHÔNG vào repo)
- `server/render/src/measure_r21_footage_parity.js` (MỚI — parity
  dissolve/circleopen/fade trên footage H.264 mới, ô rgb24 + ô
  yuv420p e2e crf tuỳ chọn + ô native 1080p dissolve, dùng module
  chung harnessShared)
- `docs/PHASE9_ROUND21_T6_FOOTAGE_LIMITS.md` (MỚI — chính file này)

KHÔNG đưa vào stage (chỉ để trên đĩa / trong /tmp, ghi tên để đối chiếu):
binary mẫu `/tmp/vcut-r21-footage/clip-g-artemis-launch.mp4`,
`clip-h-donttalk1950.mp4`, `clip-i-earth-orbit.mp4`, manifest
`/tmp/vcut-r21-footage/LICENSES.txt`, log `/tmp/r21-fetch2.log`
(fetch lần 1 `/tmp/r21-fetch.log` đã mất cùng đợt reset /tmp),
`/tmp/r21-parity-pair1.log`, `/tmp/r21-parity-pair2.log`,
`/tmp/r21-parity-pair1-crf12.log`, frame kiểm tra bằng mắt
`/tmp/r21-eye-g.jpg`, `/tmp/r21-eye-h.jpg`, `/tmp/r21-eye-i.jpg`.
Không tạo file binary nào trong repo. Không push, không tag/release.
