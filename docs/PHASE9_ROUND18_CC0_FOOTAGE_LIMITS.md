# Phase 9 đợt 18 — footage máy quay thật license sạch (CC0/public domain): LIMITS trung thực

> Đợt 18, luồng footage thật license sạch. Luật cứng đã giữ: KHÔNG push
> GitHub, KHÔNG ghi qua GitHub connector, KHÔNG release/tag, KHÔNG code
> giả, KHÔNG stage (parent stage), KHÔNG tải binary vào repo, KHÔNG sửa
> file của luồng khác, KHÔNG ghi build-loop-log (parent gộp).
> Chỉ tạo 3 file text dưới đây. Máy đo: VM 2 vCPU, FFmpeg/ffprobe 8.1.2,
> /tmp 512MB (sau đợt còn trống 417MB).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

Đợt 17 N6 kết luận "repo không có footage máy quay thật" và "không tải
video ngoài vì license không sạch". Đợt này gỡ được nửa đầu của nợ đó
bằng cách **xác minh license từng file qua API, không tin tên file hay
trang tổng hợp**: đã tìm và tải được **2 clip quay thật** từ Wikimedia
Commons, cả hai đều được API ghi `License=pd, Copyrighted=False`
(public domain), và đã đo parity trên chính 2 clip đó:

| Transition (720p, rgb24, p=0.5) | MAD | ≤8 | Hạng V6 |
|---|---|---|---|
| dissolve | 0,0034 | 100,00% | KHỚP |
| circleopen | 0,4995 | 100,00% | KHỚP |

Kết quả này **khớp với mọi nguồn tổng hợp trước đây** (H6 P/L/S, N6 X/M)
ở cùng thang đo — tức mô hình preview–render đứng vững cả trên footage
máy quay thật, không chỉ trên test pattern. Phạm vi badge vẫn giữ nguyên
"matched ở mức mô hình xfade rgb24" (ô yuv420p e2e không đo trong luồng
này, xem §5). Binary chỉ nằm ở `/tmp/vcut-cc0-sample`, **không có trong
repo, không stage**.

## 1. Nguồn đã xác minh license (đọc trang/API thật, không suy đoán)

### 1.1. DÙNG ĐƯỢC — Wikimedia Commons, xác minh từng file qua API

Cơ chế xác minh (script tự làm trước mỗi lần tải, xem §2): gọi API
Commons `action=query&prop=imageinfo&iiprop=extmetadata`, chỉ chấp nhận
`License=cc0` (kèm LicenseUrl chứa `creativecommons.org/publicdomain/zero`)
hoặc `License=pd` kèm `Copyrighted=False`. Mọi giá trị khác bị từ chối
và script dừng — đã chứng minh bằng trường hợp phủ định ở §1.4.

Trang chính sách của Commons xác nhận CC0 được chấp nhận ("CC0 — OK")
và nội dung public domain cũng được chấp nhận, nhưng đồng thời cảnh báo:
Wikimedia Foundation **không bảo đảm** tính đúng đắn của thông tin
bản quyền từng file, và các hạn chế khác (nhãn hiệu, quyền nhân thân,
quyền riêng tư) vẫn có thể áp dụng độc lập với bản quyền. Vì vậy mỗi
clip dùng sau này vẫn phải qua cùng bước kiểm tra API này — không được
suy ra "nguồn Commons = tự động sạch".

Hai clip mẫu đã tải (cùng tác giả WrS.tm.pl, cùng thị trấn Tomaszów
Mazowiecki, Ba Lan — xem giới hạn đa dạng ở §5):

| Clip | Nội dung thật (đã nhìn bằng mắt, §4) | ffprobe thật | API Commons | SHA256 |
|---|---|---|---|---|
| A: `clip-a-swifts.ogv` — File "Common swifts. Hubala residetials in Tomaszow Mazowiecki, Lodz Voivodeship, Poland, CC0.ogv" | Chim yến bay trên nền trời + mây; chuyển động thật (chim bay, mây trôi) | Theora, 1280×720, 30fps, 6,037 s, 838.446 byte | License=pd, LicenseShortName="Public domain", UsageTerms="Public domain", Copyrighted=False, Credit="Own work" | 29cd840505e5b4e4a981888b3752c15f47e3801481a7eba7be4b46d7339f9f0b |
| B: `clip-b-firetrucks.ogv` — File "Przejazd wozów strażackich przez ulicę Warszawską w Tomaszowie Mazowieckim, PL, EU, CC0.ogv" | Phố thật: xe cứu hỏa đỏ chạy tới, ô tô, nhà, cây, biển hiệu; chuyển động thật | Theora, 1280×720, 30fps, 11,316 s, 9.768.309 byte | License=pd, LicenseShortName="Public domain", UsageTerms="Public domain", Copyrighted=False, Credit="Own work" | bfdfd87b71a2b4b2d1d884ddcf57bbbafef902f2e1b41dd2ee954f2380cc4f00 |

Ghi chú trung thực về nhãn: tên 2 file đều chứa "CC0" nhưng API ghi
`License=pd` (public domain), không ghi `cc0`. Tài liệu này vì vậy ghi
đúng là **public domain theo API Commons**, không mạo nhận là CC0 deed.
Cả hai đều nằm trong danh sách cho phép của repo (public domain tương
đương nhóm CC0/CC-BY/OFL về mức độ tự do dùng lại cho mục đích đo;
nếu sau này muốn đưa clip vào kho asset phát hành thì vẫn cần đối chiếu
lại với LICENSE của repo và kiểm tra nhãn hiệu trong khung hình, xem §5).

Một ứng viên CC0 deed thật đã xác minh nhưng KHÔNG tải trong đợt này
(để giữ mẫu nhỏ, đúng nhiệm vụ 1–2 clip): "Mossy Tree CC0.webm" của
Elvis Deane — API ghi `License=cc0`, LicenseUrl là deed CC0 1.0,
26,077 s, 3840×2160, 15.171.869 byte. Đây là ứng viên dự phòng đầu tiên
nếu cần thêm 1 clip CC0 deed thuần túy.

### 1.2. DÙNG ĐƯỢC VỚI ĐIỀU KIỆN — NASA (chưa tải trong đợt này)

Trang Images and Media của NASA viết: nội dung NASA "generally are not
subject to copyright in the United States", dùng được cho mục đích giáo
dục/thông tin mà không cần xin phép riêng, nên ghi nguồn là NASA; nhưng
**logo/insignia của NASA không thuộc public domain**, nội dung của bên
thứ ba có bản quyền mà NASA dùng kèm sẽ được đánh dấu tên chủ sở hữu
(và NASA không chuyển quyền đó cho người khác), và nội dung không được
dùng theo cách ngụ ý NASA chứng thực sản phẩm. Vì vậy NASA là nguồn dự
phòng hợp lệ cho footage thật, nhưng mỗi file vẫn phải kiểm tra xem có
đánh dấu bên thứ ba hay logo hay không — không được tải bừa theo tên
miền nasa.gov. Đợt này không cần tới NASA vì Commons đã đủ 2 clip.

### 1.3. KHÔNG TÍNH LÀ CC0 — Pexels (đã đọc trang license, loại khỏi nhóm CC0)

Pexels Help xác nhận: "All photos and videos uploaded on Pexels are
licensed under the Pexels license" — tức **giấy phép riêng của Pexels,
không phải CC0**, cho dùng miễn phí cá nhân/thương mại không cần ghi
nguồn nhưng kèm hạn chế (không bán lại bản chưa sửa, không dùng làm
nền tảng stock cạnh tranh, không ngụ ý chứng thực). Một số bài viết
thứ ba gọi nhầm Pexels là CC0 — đó là thông tin sai, không dùng làm
căn cứ. Vì nhiệm vụ đợt này yêu cầu license sạch dạng CC0/public
domain, Pexels **không được dùng làm nguồn CC0** trong luồng này
(dù nội dung của nó vẫn "free to use" theo giấy phép riêng của nó).

### 1.4. BẰNG CHỨNG CỔNG KIỂM TRA HOẠT ĐỘNG — trường hợp phủ định

"File:Video of trees.webm" (tác giả Ready Street, video cây ở Nigeria)
trông qua tên và đoạn mô tả trang file rất dễ tưởng là CC0, nhưng API
Commons trả `License=cc-by-sa-4.0`, `LicenseShortName="CC BY-SA 4.0"`,
`Copyrighted=True`. Script đã từ chối đúng file này (`--check-only`
trả exit 1, in REJECT). CC BY-SA cũng nằm ngoài danh sách cho phép
MIT/CC0/CC-BY/OFL của repo nên file này không được dùng ở đây dù
CC BY-SA tự nó là giấy phép mở. Bài học: **không bao giờ tin tên file
hay đoạn trích trang tìm kiếm — chỉ tin trường License của API cho
từng file cụ thể**.

### 1.5. CHƯA XÁC MINH TRONG ĐỢT NÀY — không dùng, không kết luận

- **Pixabay:** chưa đọc trang license của Pixabay trong đợt này nên
  không ghi gì về điều khoản của nó và không dùng clip nào từ đó.
  (Pixabay cũng dùng giấy phép riêng, không phải CC0 — nhưng vì chưa
  đọc trang gốc nên câu này chỉ là lưu ý cần kiểm tra lại, không phải
  kết luận của đợt.)
- **Openverse:** API của Openverse có filter `license=cc0,pdm` và
  không cần key, nhưng Openverse chỉ có ảnh + audio trực tiếp; tab
  video chỉ dẫn ra nguồn CC khác, và bản thân filter chỉ phản ánh
  license do người đăng khai báo (đã có trường hợp gắn nhãn CC0 sai).
  Vì vậy Openverse không phải nguồn video trực tiếp cho đợt này; nó
  chỉ hữu ích nếu sau này cần ảnh tĩnh CC0 (vẫn phải kiểm tra từng
  ảnh, như §1.4).
- **Prelinger Archive / Internet Archive:** kho phim lịch sử public
  domain thật, nhưng chưa xác minh từng file nào trong đợt này nên
  không đưa vào danh sách dùng được.

## 2. Script fetch (thứ duy nhất về sau được stage — binary thì không)

`scripts/fetch-cc0-footage.sh`:
- Mặc định tải vào `/tmp/vcut-cc0-sample`; nhận OUTDIR tùy chọn.
- **Chốt chặn trong script:** nếu OUTDIR nằm trong repo thì từ chối
  (đã kiểm chứng: chạy với OUTDIR là `assets` trong repo → in TỪ CHỐI,
  exit 2).
- Trước mỗi lần tải: kiểm tra license qua API Commons như §1.1, từ
  chối mọi license ngoài {cc0, pd}; với cc0 còn đối chiếu LicenseUrl
  phải là deed CC0.
- Sau mỗi lần tải: ffprobe (codec/kích thước/duration) + ffmpeg giải
  mã thử 1 frame (chứng minh phát được) + ghi `LICENSES.txt` trong
  OUTDIR gồm title, trang nguồn, giá trị license API, URL tải, SHA256.
- Chỉ tải 2 file mẫu, gửi User-Agent định danh, không tải hàng loạt
  (tôn trọng Commons).

## 3. Phương pháp đo parity trên footage thật

Script đo mới: `server/render/src/measure_r18_cc0_parity.js`
(mô hình theo H6, dùng CHÍNH module chung `harnessShared.js` +
`describeTransition` từ module thật, transpile bằng tsc sang /tmp):
- Chuẩn hoá cả 2 đầu vào bằng cùng filter chain
  `fps=30,scale=1280:720,format=rgb24,settb=AVTB` (cả 2 clip vốn đã
  30fps/720p nên bước này gần như trung tính, nhưng khoá chặt căn khung).
- Render: xfade duration=1 offset=1 trên 2 giây đầu mỗi clip, chỉ lấy
  frame giữa transition (index 45 @30fps, t=1.5, p=0.5); ngữ nghĩa
  xfade: tại t=1.5 lấy A(1.5) và B(0.5). Preview lấy màu từ đúng 2
  frame đó trích bằng cùng filter chain.
- Chỉ ghi 1 frame raw/lần render (2,7 MB) — không ghi 90 frame raw
  (249 MB) để không lặp lỗi đầy /tmp của đợt H6.
- Thang V6: KHỚP = MAD ≤ 2 và ≥99% pixel lệch ≤ 8.

## 4. Kết quả đo (số thật, chạy 2 lần giống hệt nhau)

| Transition | Lần 1 | Lần 2 | Hạng |
|---|---|---|---|
| dissolve | MAD=0,0034, ≤8: 100,00% | MAD=0,0034, ≤8: 100,00% | KHỚP |
| circleopen | MAD=0,4995, ≤8: 100,00% | MAD=0,4995, ≤8: 100,00% | KHỚP |

Đối chứng kèm theo:
- Trích lặp frame A(1.5) hai lần: tổng lệch tuyệt đối = **0** (chuỗi
  chuẩn hoá xác định; phép đo không phụ thuộc lần chạy).
- Độ phức tạp frame thật: A(1.5) std=45,7, diff-ngang=0,31;
  B(0.5) std=75,5, diff-ngang=2,77. So với nguồn tổng hợp H6 P
  (diff-ngang ~85 vì nhiễu trắng `alls=18`), footage thật **mịn hơn
  nhiều ở trục nhiễu từng pixel** — A chủ yếu là bầu trời + mây mịn
  (đã nhìn bằng mắt: chim yến chỉ chiếm vài pixel), B là phố thật có
  chi tiết nhưng vẫn mịn hơn nhiễu tổng hợp. Vì vậy kết luận "KHỚP
  trên footage thật" là kết luận về **nội dung quay thật có cấu trúc
  quang học thật**, không phải "footage khó hơn nhiễu tổng hợp".
- Kiểm tra bằng mắt 2 frame trích: A = trời xanh + mây trắng + chim
  yến nhỏ; B = đường phố, xe cứu hỏa đỏ ở giữa xa, ô tô, nhà, cây.
  Cả hai đều rõ ràng là footage máy quay, không phải test pattern.

Đọc kết quả: circleopen 0,4995 cao hơn dissolve 0,0034 nhưng vẫn cách
ngưỡng 2 hơn 4 lần và 100% pixel lệch ≤ 8 — cùng dạng "sàn lượng tử
hoá của circle" đã chẩn đoán ở H6 (0,28) và N6 (0,49), không phải lỗi
đường cong. Dissolve gần như tuyệt đối (0,0034) cho thấy mô hình
dissolve-noise khớp FFmpeg ngay cả trên nội dung quay thật chuyển động.

## 5. Giới hạn chưa làm được / nợ còn lại (trung thực)

- **Chỉ 2 clip, cùng 1 tác giả, cùng 1 thị trấn, cùng codec Theora
  .ogv 720p30.** Chưa đủ đa dạng để kết luận cho mọi footage: chưa có
  clip H.264/MP4 (codec phổ biến nhất của user), chưa có 1080p/4K,
  chưa có người nói/chân dung (quyền nhân thân), chưa có cảnh tối/
  chuyển động nhanh mạnh, chưa có clip dọc. "Mossy Tree CC0.webm"
  (4K, CC0 deed, §1.1) là ứng viên đầu tiên để mở rộng.
- **Nhãn hiệu trong khung hình:** clip B chứa biển hiệu cửa hàng
  ("CHICKEN" và các biển khác) — đó là nhãn hiệu của bên thứ ba.
  Việc dùng 2 clip này **chỉ để đo trong /tmp** là an toàn, nhưng nếu
  sau này muốn đưa chúng vào kho asset phát hành kèm sản phẩm thì
  phải kiểm tra lại nhãn hiệu/quyền nhân thân, không tự động coi là
  sạch chỉ vì bản quyền là public domain (đúng cảnh báo của Commons
  ở §1.1).
- **License "pd" ≠ deed CC0:** 2 clip mẫu được API ghi là public
  domain, không phải CC0 deed như tên file gợi ý. Tài liệu này ghi
  đúng như vậy; ai trích dẫn phải trích "public domain (API Commons:
  License=pd, Copyrighted=False)", không trích "CC0" cho 2 clip này.
- **Chưa đo ô yuv420p e2e trên footage thật** (phạm vi badge giữ
  nguyên rgb24). Dựa vào H6/N6 (yuv420p LỆCH nặng trên mọi nguồn tổng
  hợp), nhiều khả năng yuv420p trên footage thật cũng LỆCH, nhưng đó
  là suy đoán — chưa đo thì chưa kết luận.
- **Chỉ đo 2 transition** (dissolve, circleopen) theo nhiệm vụ; 81 type
  transition còn lại chưa đo trên footage thật.
- **Không có FPS canvas / click-test trên footage thật** trong luồng
  này (blocker headed của N6 vẫn còn); script đo chỉ chạy ở tầng
  FFmpeg + module preview, không qua trình duyệt.
- **Commons không bảo đảm license từng file** (§1.1): nếu file gốc
  trên Commons bị đổi license hoặc bị gỡ sau này, SHA256 trong §1.1
  + manifest `/tmp/vcut-cc0-sample/LICENSES.txt` là bằng chứng về
  trạng thái tại thời điểm tải (28/10/2026), không phải bảo đảm vĩnh viễn.

## 6. Kiểm chứng đã chạy

- `bash -n scripts/fetch-cc0-footage.sh`: pass.
- `--check-only "File:Video of trees.webm"`: REJECT, exit 1 (§1.4).
- Chốt chặn OUTDIR trong repo: TỪ CHỐI, exit 2 (không pipe).
- Fetch thật vào `/tmp/vcut-cc0-sample`: 2 file, ffprobe + giải mã
  thử 1 frame đều pass (log `/tmp/r18-fetch.log`).
- `node --check server/render/src/measure_r18_cc0_parity.js`: pass.
- Parity script chạy trọn vẹn **2 lần**, số MAD giống hệt nhau
  (log `/tmp/r18-parity.log`, `/tmp/r18-parity2.log`).
- Kiểm tra bằng mắt 2 frame trích (`/tmp/r18-frameA.png`,
  `/tmp/r18-frameB.png`): nội dung quay thật như mô tả §4.
- KHÔNG chạy tsc/vite build toàn dự án (không sửa code sản phẩm hay
  code TS nào — script đo chỉ transpile module TS sang /tmp để đo,
  như mẫu H6; script fetch là bash, không liên quan build web).
- KHÔNG chạy click-test browser thật (nợ mở chung, §5).

## 7. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- `scripts/fetch-cc0-footage.sh` (MỚI — fetch 2 clip mẫu CC0/pd từ
  Commons về OUTDIR ngoài repo, kèm kiểm tra license API + ffprobe +
  manifest LICENSES.txt; binary KHÔNG vào repo)
- `server/render/src/measure_r18_cc0_parity.js` (MỚI — parity
  dissolve/circleopen trên footage thật, dùng module chung harnessShared)
- `docs/PHASE9_ROUND18_CC0_FOOTAGE_LIMITS.md` (MỚI — chính file này)

KHÔNG đưa vào stage (chỉ để trên đĩa / trong /tmp, ghi tên để đối chiếu):
binary mẫu `/tmp/vcut-cc0-sample/clip-a-swifts.ogv`,
`clip-b-firetrucks.ogv`, manifest `/tmp/vcut-cc0-sample/LICENSES.txt`,
log `/tmp/r18-fetch.log`, `/tmp/r18-parity.log`, `/tmp/r18-parity2.log`,
frame kiểm tra bằng mắt `/tmp/r18-frameA.png`, `/tmp/r18-frameB.png`,
thư mục tmp của script đo `/tmp/r18-cc0-*`. Không tạo file binary nào
trong repo. Không push, không tag/release.
