# Phase 9 đợt 24 (luồng H5) — Kho dọc trung tính ngoài vũ trụ + siết cổng NASA + cắt end card R1: LIMITS trung thực

> Đợt 24, luồng H5. Luật cứng đã giữ: KHÔNG push GitHub, KHÔNG chạy
> push-files, KHÔNG ghi qua GitHub connector, KHÔNG release/tag,
> KHÔNG code giả, KHÔNG stage (parent stage), KHÔNG tải binary vào
> repo, KHÔNG sửa code sản phẩm. Chỉ tạo file text ở §8. Máy đo: VM
> 2 vCPU, FFmpeg/ffprobe 8.1.2, /tmp 512MB (tmpfs) — các file đo nằm
> ở /tmp/vcut-r24-h5 và /tmp/vcut-r24-test, KHÔNG bền vững, ai cần
> đo lại thì chạy lại script fetch (SHA256 đã ghi, tải xác định).

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **Đã tìm được 2 clip dọc mới đạt chuẩn phát hành, ngoài vũ trụ:**
  N1 = NASA SVS GUARDIAN tsunami background comp vertical (sóng thần
  mô phỏng trên bản đồ Thái Bình Dương) và N2 = NASA SVS Arctic Sea
  Ice Minimum 2026 vertical (băng biển Bắc Cực). Cả 2 đều H.264 dọc
  thật 1080×1920 60fps, đã quét contact sheet toàn clip mỗi ~10s:
  **0 người, 0 vũ khí, 0 chiến tranh/thương vong, 0 phỏng vấn cận
  mặt có tên, 0 logo/end card** trong toàn bộ mẫu.
- **Ghi chú trung thực bắt buộc kèm theo verdict:** cả 2 đều là
  **visualization khoa học của NASA SVS (đồ hoạ dữ liệu + nhãn bản
  đồ/text xuyên suốt), KHÔNG phải cảnh quay camera thuần** như R1.
  N1 mang nhãn bản đồ (Russia/Kamchatka/Alaska/Hawaii, Guardian
  Station G027, Tidal gauges KOKB) suốt clip; N2 mang text "Arctic
  Sea Ice + ngày" và đường trung bình 1981–2010 suốt clip. Tiêu chuẩn
  rà soát đợt 23 không cấm nhãn/text khoa học, nên verdict vẫn là
  ĐẠT — nhưng ai đóng gói kho mẫu mà muốn "cảnh quay thuần" thì 2
  clip này KHÔNG đáp ứng, vẫn còn thiếu hạng đó (xem §7).
- **Cổng NASA đã siết:** hàm `check_nasa_release()` trong script
  fetch mới CHỈ chấp nhận nhánh photographer (bắt đầu bằng "NASA");
  nhánh center đã bị xoá hoàn toàn. Test phủ định: clip L đợt 22
  (photographer trống, center HQ — chính clip đã lọt qua nhánh center
  cũ rồi sau đó bị loại) nay bị REJECT đúng, exit 1; R1/R2 vẫn OK.
  Script đợt 23 giữ nguyên (không sửa) và từ nay KHÔNG được dùng cho
  quyết định phát hành.
- **Đã có script cắt end card R1 — và đính chính điểm cắt:** quét
  đuôi bản ~large (SHA256 trùng tuyệt đối đợt 23) cho thấy đồ hoạ
  bắt đầu từ ~46,6–46,8s, logo Artemis ~48,5–49,5s, logo NASA
  (meatball) ~50–54,77s. Muốn 0 insignia nổi bật phải cắt ở **46,5s**
  (loại 8,27s đuôi), KHÔNG phải "~5s cuối" như đợt 23 ước lượng
  (5s đó chỉ là đoạn meatball). Script đã chạy thử trên /tmp: bản ra
  46,57s, frame cuối vẫn là cảnh nhà xưởng.
- **Parity cặp mới N1→N2, dissolve RGB24: KHỚP (MAD 0,1000; 99,92%
  pixel lệch ≤ 8)** ở khung 720×1280, cửa sổ 10–12s mỗi clip.

## 1. Tiêu chuẩn rà soát áp dụng (kế thừa đợt 23, không hạ chuẩn)

Loại nếu gặp bất kỳ: người nhận diện được; vũ khí; chiến tranh /
thương vong; phỏng vấn cận mặt có tên; logo/end card nổi bật.
Đạt nếu: photographer/nguồn rõ ràng, 0 người hoặc người xa không
nhận diện được, và quét toàn clip mỗi ~10s (bài học từ clip L đợt 23:
chỉ nhìn 3 frame đã cho verdict sai). License phải xác minh qua API
sơ cấp (NASA images-api, IA metadata API, Wikimedia Commons
imageinfo, trang SVS trên tên miền nasa.gov) — không tin tiêu đề
hay LIMITS cũ. Nhãn bản đồ / text khoa học trong visualization
KHÔNG nằm trong danh sách loại của đợt 23 — nhưng phải ghi rõ để
người đóng gói không nhầm với cảnh quay thuần (§0, §7).

## 2. Clip mới đạt chuẩn — N1, N2

### 2.1. N1 — NASA SVS GUARDIAN tsunami, bản background comp vertical

- Nguồn: NASA Scientific Visualization Studio, SVS 5626,
  "GUARDIAN Warns Hawaii Early of Incoming Kamchatka Tsunami
  (Vertical version)" — bản `guard_vert_background_comp_1920p60.mp4`
  (chỉ lớp mô phỏng nền; KHÔNG lấy bản `comp final` hay `overlay4`
  vì 2 bản đó mang lớp text cảnh báo — 2 bản đó không được quét
  frame-by-frame, chỉ bị loại theo thiết kế: background comp là lớp
  sạch duy nhất trong 3 bản vertical của SVS 5626).
- License xác minh: trang SVS trên svs.gsfc.nasa.gov (tên miền NASA)
  + bản mirror Wikimedia Commons ghi "Public domain", artist
  "NASA's Scientific Visualization Studio". Theo chính sách NASA,
  nội dung NASA "generally are not subject to copyright" (tác phẩm
  chính phủ Mỹ) — KHÔNG trích là "CC0" (như đợt 23 §1.2). Ngoại lệ
  logo/insignia và nội dung bên thứ ba: quét mẫu không thấy.
- Bản đo: H.264 **1080×1920, 60fps, 43,67s, 32.963.935 byte**,
  SHA256 `2ede4e15…dcd3fff76a` (script fetch chạy lại cho SHA trùng
  tuyệt đối — tải xác định). Chỉ có 1 stream video, không có audio.
- Quét contact sheet mẫu 10s (0/10/20/30/40/42,7s): mô phỏng sóng
  lan trên bản đồ Thái Bình Dương, nhãn Russia / Kamchatka /
  Alaska / Hawaii / Guardian Station G027 / Tidal gauges KOKB
  xuyên suốt, không đổi bản chất. **0 người, 0 vũ khí, 0 chiến
  tranh, 0 phỏng vấn, 0 logo/end card** trong toàn bộ mẫu. Cảnh
  chuyển động rõ (sóng lan dần) — hợp làm demo chuyển động hơn R2.
- **Verdict: ĐƯỢC đưa vào kho phát hành** (kèm ghi chú visualization
  có nhãn bản đồ xuyên suốt, không phải cảnh quay camera thuần).

### 2.2. N2 — NASA SVS Arctic Sea Ice Minimum 2026 vertical

- Nguồn: NASA SVS 5677, "Arctic Sea Ice Minimum 2026" — bản
  `arctic_sea_ice_min_2026_vertical_1920p60.mp4`.
- License xác minh: trang SVS trên svs.gsfc.nasa.gov + bản mirror
  Wikimedia Commons ghi "Public domain", mô tả "Arctic sea ice
  minimum 2026, vertical format". Cùng lưu ý NASA như N1 (không CC0).
- Bản đo: H.264 **1080×1920, 60fps, 53,83s, 37.922.134 byte**,
  SHA256 `a7d8eb96…523a71b` (script fetch chạy lại cho SHA trùng
  tuyệt đối). Chỉ có 1 stream video, không có audio.
- Quét contact sheet mẫu 10s (0/10/20/30/40/50/52,8s): bản đồ Bắc
  Cực, diện tích băng thu dần theo ngày (Mar → Jul → Sep → Dec),
  text "Arctic Sea Ice + ngày" và đường trung bình 1981–2010 xuyên
  suốt; frame cuối (52,8s) là bảng "September Average / March
  Average / Minimum Extent" — text thống kê, không logo. **0 người,
  0 vũ khí, 0 chiến tranh, 0 phỏng vấn, 0 logo/end card** trong
  toàn bộ mẫu.
- **Verdict: ĐƯỢC đưa vào kho phát hành** (kèm ghi chú visualization
  có text/ngày xuyên suốt, không phải cảnh quay camera thuần).

### 2.3. Kho dọc sau đợt này

| Clip | Chủ đề | H.264 dọc thật | Người/logo |
|---|---|---|---|
| R1 (đợt 23) | Vũ trụ: vòm tên lửa EUS | 608×1080 | Công nhân xa, cần cắt end card (§4) |
| R2 (đợt 23) | Vũ trụ: trăng + Artemis II | 608×1080 | 0 người, gần như tĩnh |
| N1 (đợt này) | Trái Đất: sóng thần mô phỏng | 1080×1920 | 0 người, 0 logo; nhãn bản đồ |
| N2 (đợt này) | Trái Đất: băng biển Bắc Cực | 1080×1920 | 0 người, 0 logo; text ngày |

Đa dạng chủ đề đã thoát khỏi "chỉ vũ trụ", nhưng cả 2 clip mới đều
là visualization — hạng "cảnh quay camera thuần ngoài vũ trụ"
(thiên nhiên, đô thị quay thật) vẫn chưa có (§7).

## 3. Ứng viên đã LOẠI (không hạ chuẩn để đủ số)

- **IA Flickr-30892922356, "Elkhorn Creek Wild and Scenic River"**
  (BLM Oregon & Washington, licenseurl CC BY 2.0 — license sạch):
  file mp4 IA ghi format h.264 nhưng ffprobe sau tải cho **640×360
  ngang**, 12,91s → LOẠI vì không phải khung dọc thật. Đây là bẫy
  ngược của đợt 23: license sạch không cứu được hướng khung sai.
- **Wikimedia Commons "Mountain Moment – Westside Waterfalls"**
  (Mount Rainier NPS, CC BY 3.0): **1280×720 ngang** → LOẠI.
- **Wikimedia Commons "Crooked River (36648939183)"** (BLM, Public
  domain): **1920×1080 ngang** → LOẠI.
- **Tìm kiếm NASA images-api `q=vertical video` / `q=vertical`:**
  ngoài R1/R2/L, toàn "vertical" nghĩa là lắp ráp theo chiều dọc
  (Vertical Integration Facility, lift to vertical) — đúng bẫy đợt
  22/23 đã cảnh báo; không có ứng viên images-api nào khác là khung
  dọc thật. Tìm kiếm IA `title:(vertical) + publicdomain` cho ra
  toàn quân sự / game / re-upload / tin tức — không có ứng viên nào
  qua được cổng license + dọc + trung tính cùng lúc.
- **GUARDIAN bản `comp final` và `overlay4`:** không quét
  frame-by-frame, loại theo thiết kế (mang lớp text cảnh báo phủ
  lên mô phỏng) — chỉ bản background comp được đưa vào kho.

## 4. Cắt end card khỏi R1 — đính chính điểm cắt đợt 23

- File quét: bản ~large.mp4 đợt 23, 608×1080, 54,77s, SHA256
  `45827cd3…a9cde` — trùng tuyệt đối đợt 23, chứng tỏ tải xác định.
- Quét đuôi chi tiết (frame từng mốc):
  - 44,0s và 46,5s: cảnh nhà xưởng (vòm tên lửa, banner NASA trên
    tường — chi tiết tài liệu trong khung hình, không phải insignia
    dùng làm thương hiệu).
  - 46,8s: ĐÃ sang đồ hoạ Trái Đất/Mặt Trăng → chuyển cảnh xảy ra
    trong khoảng **46,5–46,8s**.
  - 48,5–49,5s: logo Artemis toàn màn hình.
  - ~50,0–54,77s: logo NASA (meatball) toàn màn hình.
- Kết luận: đoạn meatball riêng chỉ ~4,8s — khớp "~5s" của đợt 23 —
  nhưng đoạn đồ hoạ + logo Artemis trước đó (~46,7–50s) cũng là
  insignia nổi bật. **Cắt ở 46,5s** (frame nhà xưởng cuối đã xác
  nhận) loại bỏ **8,27s** đuôi. Cắt ở 50s (chỉ bỏ meatball) vẫn để
  lại đồ hoạ + logo Artemis — KHÔNG đủ cho kho yêu cầu 0 insignia.
- Script mới `scripts/trim-r1-endcard.sh` (chỉ script, binary ra
  ngoài repo): `INPUT OUTPUT [CUT=46.5]`, cắt `-c copy` (không
  re-encode), chốt chặn OUTPUT trong repo (exit 2), kiểm chứng
  duration ra ≤ CUT + 0,3s + giải mã thử frame cuối.
- Chạy thử trên /tmp: bản ra **46,57s** (dừng ở keyframe trước CUT
  +0,07s, trong dung sai), H.264 608×1080, frame cuối đã xem bằng
  mắt: cảnh nhà xưởng (vòm + banner tường), KHÔNG phải đồ hoạ/logo.
  Bản đã cắt KHÔNG đưa vào repo — ai cần thì chạy lại script.

## 5. Cổng NASA đã siết — thay đổi, vị trí, test phủ định

- **Thay đổi:** trong script fetch mới
  (`scripts/fetch-r24-vertical-nonsSpace.sh`), hàm
  `check_nasa_release()` CHỈ có nhánh photographer
  (`photographer` bắt đầu bằng "NASA" thì OK, còn lại REJECT).
  **Nhánh center đã bị xoá hoàn toàn khỏi hàm** — không còn case
  GSFC/MSFC/KSC/JSC/GRC/ARC/LARC/AFRC/HQ nào. Đây là điểm khác duy
  nhất so với `check_nasa()` của script đợt 23, và là điểm yếu mà
  đợt 23 §1.3 đã cảnh báo (item bên thứ ba host tại trung tâm NASA
  vẫn lọt).
- **Phạm vi áp dụng (ghi rõ để khỏi hiểu lầm):** cổng siết này áp
  dụng cho item qua NASA images-api. N1/N2 là item SVS, không nằm
  trong images-api, nên cổng images-api không áp dụng trực tiếp cho
  chúng — license N1/N2 được xác minh qua trang SVS (nasa.gov) +
  Commons PD (§2). Script fetch mới vẫn giữ cổng sau tải h264 +
  khung dọc cho N1/N2, và `--check-only-svs` ffprobe URL trước tải.
- **Script đợt 23 không sửa:** `fetch-r23-vertical-replacements.sh`
  giữ nguyên cổng cũ (có nhánh center) vì batch đợt 23 đã stage với
  nội dung đó; từ nay script đó KHÔNG được dùng cho quyết định phát
  hành, chỉ còn giá trị đo nội bộ. Mọi clip phát hành mới qua
  images-api phải qua cổng siết này.
- **Test phủ định đã chạy 30/10 (qua `--check-only-nasa`):**
  - R1 (photographer `NASA /Sam Lott and Brandon Hancock`, MSFC)
    → OK, exit 0.
  - R2 (photographer `NASA/Sam Lott`, MSFC) → OK, exit 0.
  - L đợt 22 (photographer trống, center HQ) → **REJECT đúng**,
    exit 1, thông báo ghi rõ "nhánh center đã bị loại".
  - nasa_id không tồn tại → REJECT, exit 1.
  - Chốt chặn OUTDIR trong repo (chạy với `.`) → TỪ CHỐI, exit 2;
    chốt chặn OUTPUT trim trong repo → TỪ CHỐI, exit 2.
- **Chạy trọn vẹn script fetch mới** vào /tmp/vcut-r24-test: 2 file,
  ffprobe h264 + dọc + giải mã thử frame đầu đều pass, SHA256 trùng
  tuyệt đối với file đã quét (§2) — script và kết quả quét nói về
  cùng một byte.

## 6. Parity cặp mới N1→N2 (đo nhanh dissolve RGB24)

Script đo mới `scripts/measure-r24-h5-dissolve-parity.py` (script đo
đợt 22 không còn trong repo nên không tái dùng được — viết lại và
ghi rõ phương pháp thay vì mạo nhận là script cũ): cửa sổ N1 10–12s
→ N2 10–12s, chuẩn hoá 720×1280 30fps, render ffmpeg xfade dissolve
2s; mô hình preview = frand float32 tái tạo đúng vf_xfade.c (xem
`apps/web/src/lib/dissolveFrand.ts`: sinf float32 từng bước);
tiến độ p của từng frame đo từ chính frame render (tỉ lệ pixel gần
B hơn A — pixel dissolve luôn đúng bằng A hoặc B nên p đo được
sạch), nhờ vậy số đo kiểm tra trường ngẫu nhiên không gian của
frand; sai lệch ánh xạ thời gian (nếu có) lộ ở cột p_hat so với
tiến độ danh nghĩa.

| Transition | RGB24 (MAD / ≤8 / hạng) |
|---|---|
| dissolve N1→N2, 720×1280, 60 frame | **0,1000 / 99,92% / KHỚP** |

- Ngưỡng V6 (MAD ≤ 2, ≥99% pixel lệch ≤ 8): đạt KHỚP với biên rộng.
  MAD 0,1000 cao hơn cặp R1→R2 đợt 23 (0,0050) — giải thích trung
  thực: phần lệch còn lại (~0,08% pixel) đúng dạng lệch 1-ulp
  sinf glibc vs sin float32 mà dissolveFrand.ts đã cảnh báo, cộng
  với nội dung N1/N2 giàu chi tiết bản đồ/text nên mỗi pixel lệch
  mang |diff| lớn hơn; không phải bug mới.
- p_hat đo được chậm hơn tiến độ danh nghĩa đúng ~1 frame xuyên
  suốt (frame 0: p_hat 0,0 so với danh nghĩa 0,0167; frame 59:
  0,982 so với 1,0) — đúng hành vi xfade (frame đầu toàn A), đã
  biết từ trước, không ảnh hưởng verdict vì p dùng cho mô hình là
  p_hat đo được.
- Kết quả đầy đủ từng frame: `benchmarks/results/v24-h5-parity-n1-n2.json`
  (parent quyết có stage hay không). Chưa đo miền YUV cho cặp này
  (ngoài phạm vi "đo nhanh" của luồng; quy tắc crf đợt 23 không tự
  động áp sang cặp mới — xem §7).

## 7. Kiểm chứng đã chạy (lệnh + kết quả thật)

- `bash -n scripts/fetch-r24-vertical-nonsSpace.sh`: pass.
- `bash -n scripts/trim-r1-endcard.sh`: pass.
- `python3 -c ast.parse` cho script đo parity: pass (script .py
  độc lập, không sửa code sản phẩm nên không chạy tsc/vite build).
- `--check-only-nasa`: R1 OK, R2 OK, L REJECT exit 1, id không tồn
  tại REJECT exit 1 (xem §5).
- Fetch trọn vẹn vào /tmp/vcut-r24-test: 2 file, SHA trùng tuyệt
  đối file đã quét (N1 2ede4e15…, N2 a7d8eb96…).
- Trim thử trên /tmp: bản ra 46,57s, H.264 608×1080, frame cuối là
  cảnh nhà xưởng (đã xem bằng mắt).
- Parity N1→N2: script đo exit 0, MAD 0,1000 / 99,92% / KHỚP.
- KHÔNG push, KHÔNG tag/release, KHÔNG ghi qua GitHub, KHÔNG stage
  paths-loop, KHÔNG sửa build-loop-log.md (parent gộp).

## 8. File đã tạo (text only — PARENT stage, luồng này không ghi paths-loop)

- Mới: `scripts/fetch-r24-vertical-nonsSpace.sh` (fetch N1/N2 từ
  NASA SVS về OUTDIR ngoài repo, kèm cổng NASA siết chỉ-nhánh-
  photographer + `--check-only-svs` + cổng ffprobe h264/khung dọc
  sau tải + manifest LICENSES.txt + SHA256; binary KHÔNG vào repo)
- Mới: `scripts/trim-r1-endcard.sh` (cắt end card R1 ở 46,5s bằng
  `-c copy`, chốt chặn OUTPUT trong repo, kiểm chứng duration +
  frame cuối; binary ra ngoài repo)
- Mới: `scripts/measure-r24-h5-dissolve-parity.py` (đo parity
  dissolve RGB24 bằng frand float32 + p_hat đo từ frame render;
  chỉ đọc file đầu vào, chỉ ghi JSON kết quả)
- Mới: `docs/PHASE9_ROUND24_H5_VERTICAL_LIBRARY_LIMITS.md` (file này;
  tên file dùng ASCII VERTICAL theo quy ước repo)
- Mới (file chạy): `benchmarks/results/v24-h5-parity-n1-n2.json`
  (MAD từng frame N1→N2; parent quyết có stage hay không)

KHÔNG ĐỔI (cố tình):

- `scripts/fetch-r23-vertical-replacements.sh` — giữ nguyên cổng cũ
  có nhánh center; từ nay không dùng cho quyết định phát hành (§5).
- Mọi file sản phẩm, mọi file đợt 23 đã stage — luồng này chỉ thêm
  script + tài liệu + kết quả đo.

## 9. Nợ còn lại (không mạo nhận)

- **Vẫn thiếu cảnh quay camera thuần ngoài vũ trụ** (thiên nhiên /
  đô thị quay thật, dọc, H.264, license sạch): N1/N2 là visualization
  có nhãn/text xuyên suốt. Ứng viên IA/Commons có cảnh quay thật
  kiểm tra đợt này đều là khung ngang (Elkhorn, Crooked River,
  Mountain Moment) hoặc quân sự/game — cần tìm tiếp ở nguồn khác
  (ví dụ: kho video dọc của cơ quan chính phủ ngoài NASA/BLM, hoặc
  clip dọc CC-BY trên Commons chưa được lập chỉ mục theo hướng
  khung), không hạ chuẩn.
- **Chưa đo miền YUV cho cặp N1→N2** (chỉ có RGB24 nhanh): đừng trích
  quy tắc crf đợt 23 sang cặp này khi chưa đo.
- **Chưa quét GUARDIAN bản comp final / overlay4** frame-by-frame
  (loại theo thiết kế, §3) — nếu ai muốn dùng bản có text cảnh báo
  thì phải quét lại toàn clip trước.
- **Chưa có quyết định đóng gói cuối:** bản R1 đã cắt (46,57s) và
  N1/N2 hiện chỉ nằm ở /tmp (tmpfs, không bền) — ai đóng gói kho
  phát hành thì chạy lại 2 script fetch + trim (SHA đã ghi, tải
  xác định) rồi mới đưa file vào quy trình đóng gói của kho.
- **Cổng siết chưa áp ngược vào script đợt 23** (cố tình giữ nguyên
  batch đã stage — xem §5); nếu parent muốn một script fetch duy
  nhất thì cần sửa script đợt 23 và stage lại batch đó, kèm cập
  nhật LIMITS đợt 23 — không tự ý làm trong luồng này.
