# Phase 9 đợt 13 — C2: dissolve (LIMITS)

> Ngày: 2026-10-27. Luồng DISSOLVE, KHÔNG push, KHÔNG tag/release.
> Nợ cũ: harness V12 đo dissolve LỆCH MAD 85.52 (preview lưới hash vs
> render FFmpeg xfade dissolve nhiễu từng pixel). Luồng này điều tra bản
> chất nhiễu đó, thử tái tạo, và kết luận trung thực.

## 1. Kết luận (đọc trước)

1. **FFmpeg xfade dissolve là XÁC ĐỊNH (deterministic), không phải ngẫu
   nhiên mỗi lần render.** Cùng input, cùng lệnh, 3 lần render độc lập
   cho output **byte-identical toàn file** (cmp, 874.800 byte/lần).
   Giả thuyết "dissolve ngẫu nhiên nên không thể khớp pixel-perfect"
   là **SAI** — đã bác bỏ bằng thực nghiệm, không dừng ở đó.
2. **Nhưng mẫu nhiễu vẫn chưa tái tạo được.** Trường ngưỡng của
   dissolve là nhiễu trắng thuần theo tọa độ pixel (x, y) (xem §3),
   và mọi hàm băm tọa độ thông dụng đã thử đều chỉ đạt mức ngẫu nhiên
   (~3,5% khớp bin, xem §4). Vì vậy **không đạt pixel-perfect** và
   **không đạt ngưỡng "khớp"** (MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8).
3. **Preview giữ nguyên hình học lưới 20×12, badge giữ "approx".**
   Đổi preview sang nhiễu từng pixel KHÔNG cải thiện MAD (đo thật:
   85.00 so với 85.52 — vẫn LỆCH, xem §5), vì hai trường ngẫu nhiên
   độc lập thì MAD chỉ phụ thuộc vào p, không phụ thuộc vào độ hạt.
   Sửa hình học mà không cải thiện số đo nào thì chỉ thêm rủi ro vỡ
   test/render — nên KHÔNG sửa code sản phẩm trong luồng này.
4. **Dissolve ở trạng thái "xấp xỉ thống kê" một cách có cơ sở:**
   tỉ lệ pixel chuyển đổi theo p của preview khớp render trong
   ~0,04 ở mọi p đo (xem §5), phân bố ngưỡng đều, đơn điệu theo p.

## 2. Phương pháp đo (tái tạo được)

- Khung 72×45, A = đỏ thuần (255,0,0), B = xanh dương thuần
  (0,0,255), FPS 30, filter đúng `buildXfadeFilter("dissolve", 1, 1)`
  của `server/render/src/transitions.js` (tức
  `xfade=transition=dissolve:duration=1:offset=1`), output rawvideo
  rgb24 — cùng setup với harness V12.
- Frame giữa transition = index 45 (p = 0,5); các frame transition là
  index 30–59 (p = k/30, k = 0–29).
- Trường ngưỡng T(x, y): frame transition đầu tiên mà pixel chuyển
  sang B, đo bằng cách quét toàn bộ frame transition (không chỉ frame
  giữa). Pixel chỉ nhận đúng 2 giá trị (census frame 45: 1645 pixel
  B + 1595 pixel A, không có pixel blend trung gian) nên T là ngưỡng
  nhị phân, không phải alpha liên tục.
- FFmpeg máy đo: 8.1.2 (Ubuntu). Số chỉ đúng bản FFmpeg này; nếu bản
  FFmpeg khác đổi thuật toán dissolve thì số có thể đổi theo.

## 3. Bản chất trường ngưỡng T(x, y) — số đo thật

| Tính chất | Thí nghiệm | Kết quả |
|---|---|---|
| Xác định theo lần render | Render cùng input 3 lần, cmp toàn file | **Byte-identical cả 3 lần** (874.800 byte) |
| Phụ thuộc duration? | duration 1 vs 2, cùng offset 1 | T chuẩn hoá theo p khớp **100%** (3240/3240 pixel, \|Δp\| < 1/30) |
| Phụ thuộc kích thước? | 72×45 vs 144×90, cùng (x, y) | Khớp **100%** (≤ 1 frame); kiểm chứng đối chứng (2x, 2y) chỉ 10,1% = mức ngẫu nhiên |
| Phụ thuộc màu A/B? | đỏ→xanh vs xanh lá→vàng vs trắng→đen (rgb24) | Khớp **100%** exact-bin cả 2 cặp |
| Phân bố | Histogram 30 bin của T (3240 pixel) | Đều: 75–135/bin (kỳ vọng 108/bin nếu đều) |
| Tương quan không gian | corr(T, x) = −0,008; corr(T, y) = 0,011 | Không tương quan tuyến tính |
| Tương quan lân cận | mean \|ΔT\| pixel kề ngang = 10,08 (độc lập đều 1–30 ⇒ ~10,3); tỉ lệ \|ΔT\| ≤ 1 = 9,8% (độc lập ⇒ ~9,6%) | Nhiễu trắng, không làm mượt |
| Chu kỳ / lặp | T(x, y) = T(x+dx, y) với dx = 1, 2, 3, 4, 8, 16, 32, 36 và dy tương tự | 2,6–3,8% = mức ngẫu nhiên (1/30 ≈ 3,3%); **không có chu kỳ** |
| Đơn điệu theo p | Tỉ lệ B render: p≈0,167 → 0,182; 0,333 → 0,339; 0,5 → 0,508; 0,667 → 0,671; 0,833 → 0,835; 0,967 → 0,968 | B ≈ p (sai số ≤ 0,015, trong nhiễu mẫu 3240 pixel) |

Kết luận từ bảng: dissolve là **một trường ngưỡng tĩnh T(x, y) duy
nhất** — chỉ phụ thuộc tọa độ tuyệt đối (x, y), không phụ thuộc
duration, offset, kích thước khung, màu clip, hay lần render. Pixel
chuyển sang B khi và chỉ khi p vượt T(x, y). Đây là dạng "dithered
dissolve" (ngưỡng nhiễu), không phải blend alpha.

## 4. Thử tái tạo mẫu nhiễu — đều thất bại ở mức ngẫu nhiên

Tiêu chí: hàm ứng viên phải đưa (gần như) mọi pixel vào đúng bin T
(30 bin). Hàm ngẫu nhiên độc lập đạt ~3,3% exact-bin theo lý thuyết.
Tất cả ứng viên đều quanh mức đó — tức **không ứng viên nào đúng**:

| Ứng viên | Exact-bin | Within ±1 bin |
|---|---|---|
| sin(127.1x + 311.7y)·43758.5453 (hash hiện tại của preview, tính theo từng pixel) | 3,5% | 11,0% |
| sin(12.9898x + 78.233y)·43758.5453 | 4,5% | 11,8% |
| Wang hash (x·374761393 + y·668265263) | 4,0% | 8,4% |
| Wang hash (xor), Wang hash (chỉ số row-major) | 3,6% / 3,5% | 8,5% / 8,5% |
| SplitMix32 (2 cách gộp khóa) | 3,5% / 3,2% | 10,1% / 10,1% |
| Murmur finalizer, LCG tuyến tính | 3,6% / 3,5% | 8,7% / 9,6% |

Đã loại trừ thêm bằng cấu trúc (không chỉ bằng thử hàm): không có
chu kỳ, không có tương quan hàng/cột, không có dạng luồng tuần tự
theo row-major (vì cùng (x, y) ở 2 kích thước khác nhau vẫn khớp —
luồng tuần tự theo row-major sẽ lệch khi đổi chiều rộng). Hướng còn
lại là đọc source `vf_xfade.c` của FFmpeg để biết đúng hàm sinh
nhiễu — đã thử qua web search và mở commit dissolve gốc
(e3e55982904092fd6f42411bed54a7368455875a) nhưng code.ffmpeg.org
trả "Access Denied" (Anubis), và binary libavfilter trên máy đã strip
hết symbol nên không mổ được tên hàm. Đây là việc chưa xong, không
phải kết luận "không thể".

## 5. Đối chiếu preview–render hiện tại (chạy lại với code hiện tại)

Raster composite preview từ `describeTransition` thật (transpile
`apps/web/src/lib/transitionPreview.ts` bằng tsc, raster đúng logic
harness V12) so với frame render thật:

| p (frame render) | Tỉ lệ B: preview / render | MAD grid-preview | ≤8 | Phân loại |
|---|---|---|---|---|
| 0,25 (frame 37) | 0,263 / 0,242 | 63,80 | 62,5% | LỆCH |
| 0,50 (frame 45) | 0,469 / 0,508 | **85,52** | 49,7% | LỆCH |
| 0,75 (frame 52) | 0,751 / 0,730 | 65,95 | 61,2% | LỆCH |

- MAD 85,52 tại p = 0,5 **tái tạo đúng số V12** — code hiện tại không
  đổi, số cũ vẫn đúng.
- MAD khớp công thức lý thuyết của 2 trường nhị phân độc lập:
  MAD = 170 · 2p(1−p) (170 = (255+255)/3 cho cặp đỏ/xanh thuần):
  p = 0,25 ⇒ 63,75; p = 0,5 ⇒ 85,0; p = 0,75 ⇒ 63,75. Số đo nằm đúng
  trên đường lý thuyết này — bằng chứng thêm rằng preview và render
  là 2 trường độc lập, lệch nhau không phải do sai tỉ lệ hay sai
  hướng mà do sai từng pixel.
- **Thí nghiệm đối chứng độ hạt:** thay lưới 20×12 bằng cùng hàm
  `dissolveHash` nhưng tính theo từng pixel (không đổi hàm, chỉ đổi
  độ hạt) cho MAD 63,85 / 85,00 / 65,85 — **không khác gì lưới**
  (chênh ≤ 0,52). Vì vậy không sửa `transitionPreview.ts`: sửa đó
  không cải thiện MAD, không cải thiện tỉ lệ B, chỉ làm preview mịn
  hơn về mặt thị giác mà không có số đo nào chứng minh lợi ích đó
  vượt rủi ro vỡ test dissolve hiện tại (test đếm số ô theo p) và
  code vẽ rects của preview.

## 6. Badge: đã kiểm chứng, KHÔNG đổi — và đó là đúng

- `apps/web/src/components/transitions/previewStatus.ts`:
  `TRANSITION_MATCHED = {"fade", "none"}` — dissolve **không** có
  trong set nên `transitionPreviewStatus("dissolve") = "approx"`.
- Ngưỡng "khớp" (V6/V11): MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8.
  Dissolve đo được: MAD 85,52, ≤8 = 49,7% — **cách ngưỡng rất xa**.
  Nâng badge lên "matched" sẽ là claim sai. Badge "approx" hiện tại
  là đúng với số đo, giữ nguyên, không sửa file badge.
- Lưu ý cho luồng badge sau này: nếu một ngày tái tạo đúng được
  T(x, y) thì phải đo lại đủ 3 p (0,25 / 0,5 / 0,75) đạt ngưỡng rồi
  mới nâng — một p duy nhất là không đủ.

## 7. Chưa xong / giới hạn (trung thực)

- **Hàm sinh T(x, y) của FFmpeg chưa xác định được.** Đã loại trừ
  các họ hàm thông dụng và các cấu trúc luồng/chu kỳ, nhưng chưa đọc
  được source `vf_xfade.c` (xem §4). Không claim "không thể khớp" —
  chỉ claim "chưa khớp với những gì đã thử".
- **Chưa đo dissolve ở pixel format khác (yuv420p).** Một lần thử
  yuv420p đã hỏng về phương pháp (file input ghi theo kích thước
  frame rgb24 trong khi khai pix_fmt yuv420p nên ffmpeg đọc lệch
  khung) — kết quả lần đó đã **hủy, không dùng**. Cần làm lại đúng
  (ghi input đúng kích thước frame yuv420p) trước khi claim gì về
  yuv. Số trong tài liệu này chỉ đúng cho rgb24.
- **Chỉ đo ở 72×45, A/B thuần, p rời rạc.** T(x, y) đã chứng minh
  không phụ thuộc kích thước ở 2 cỡ (72×45, 144×90) nhưng MAD chỉ đo
  ở 72×45; footage thật / clip dài / HD chưa đo cho dissolve.
- **Không sửa code sản phẩm trong luồng này** (lý do ở §1.3, §5).
  File đổi duy nhất là tài liệu này + 1 bullet trong
  `TRANSITION_PREVIEW_LIMITS.md` (ghi lại kết luận xác định +
  xấp xỉ thống kê, không đổi hành vi).
- Pixelize có cùng họ nhiễu với dissolve không (cùng hàm sinh,
  khác độ hạt)? Chưa đo — luồng khác không được suy từ kết quả này
  sang pixelize.
