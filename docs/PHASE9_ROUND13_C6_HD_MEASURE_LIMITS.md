# Phase 9 đợt 13 — C6: Đo 14 type V3 ở HD + nhiều p (LIMITS)

Ngày: 2026-10-27, luồng C6 đợt 13. KHÔNG push, KHÔNG tag/release,
KHÔNG binary. Chỉ sửa file của mảng này (harness + fix scaling/biên
trong `transitionPreview.ts` + test tương ứng). Không đụng
circleopen/dissolve, badge, migrate, speed-curve UI, click-test.

## 0. Kết luận ngắn (đọc đoạn này là đủ)

- **1920x1080, p = 0.25 / 0.5 / 0.75, cả 14 type V3 đều KHỚP**
  theo thang V6/V11/V12 (MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8) khi ghép
  render frame theo **P thực của frame đó** (xem §4 về đảo chiều P).
  Bảng đầy đủ ở §3. Type yếu nhất vẫn KHỚP là spiral
  (MAD 0.63–0.80, le8 99.67%).
- **3 fix đã áp dụng và đo lại, đều xanh:**
  1. `rowScanPair`: `rowH = max(0.5, h/160)` → `rowH = 1`
     (blinds-diag ở HD: MAD 4.27–4.44 XẤP XỈ → 0.08–0.25 KHỚP).
  2. `wipeleft`: cột ngưỡng thuộc về A (lệch đúng 1080 pixel/1 cột
     ở mọi p → 0 pixel lệch ở mọi p, cả HD lẫn 72x45).
  3. `diamond` cũ: tâm đa giác +0.5 như diamondclose (lệch
     1501–2160 pixel → 749–1080 pixel ở HD; 0 pixel ở 72x45).
- **Phát hiện lớn nhất, GHI NỢ chứ không sửa ở đây (§4):**
  FFmpeg 8.1.2 đánh giá expr custom với **P giảm 1→0** qua các
  frame transition, trong khi built-in tăng 0→1 và preview tăng
  0→1. V12 chỉ đo p=0.5 (điểm giữa, bất biến trước đảo chiều)
  nên không phát hiện được. Hậu quả: hình học V3 khớp khi ghép
  theo P thực, nhưng **diễn tiến theo thời gian của transition
  custom khi render thực tế chạy ngược so với ý đồ preview**
  (render worker dùng đúng thứ tự `[A][B] + buildXfadeFilter`,
  xem `server/render/src/render.js` bước 2). Sửa hướng này là
  việc của luồng render (đổi expr hoặc đổi cách ghép), không
  phải của luồng đo — luồng này chỉ đo đúng và báo rõ.

## 1. Harness V13 (`server/render/src/test_v13_hd_parity.js`, MỚI)

Mở rộng V12, giữ nguyên thang phân loại V6 và nguồn A đỏ / B xanh:

- **Render qua pipe, không qua file raw.** V12 ghi raw 72x45 ra
  /tmp (vài trăm KB). Ở 1920x1080, 1 frame = 6.2MB, 39 frame =
  242MB — /tmp trên VM này chỉ là tmpfs 512MB nên ghi file chết
  "No space left" (đã gặp thật khi benchmark). V13 cho ffmpeg
  ghi rawvideo ra stdout, chỉ giữ đúng frame đích trong bộ nhớ
  (tối đa ~6.2MB + 1 chunk). Input là lavfi `color` (không file
  input), filter lấy thật từ `buildXfadeFilter` của `transitions.js`.
- **P chính xác với ít frame expr.** V12 dùng duration=1, fps=30
  nên p chỉ có bước 1/30. V13 dùng duration=0.4, offset=1, fps=30:
  transition có 12 bước P; frame đích = 30 + round(p·12) cho
  built-in và 30 + round((1−p)·12) cho custom (xem §4). Lợi ích:
  tối đa 9 frame expr cho p=0.75 thay vì 45 frame nếu dùng
  duration=2; tổng 2 lượt HD (pre-fix + post-fix) mỗi lượt
  ~11–12.5 phút cho 48 case trên VM 2 CPU.
- **Rasterize preview bằng scanline, không per-pixel.** V12 kiểm
  tra từng pixel qua `pointInPolygon` / `rects.some` — ở 1080p
  với 1080 dải quét thì 2M pixel × ~15k rect là không chạy được.
  V13 rasterize theo hàng: rect/rects/circle điền khoảng,
  polygon quét (sweep) đúng luật toggle của V12 (pixel được phủ
  khi số giao điểm > tâm pixel là lẻ). Preview ở HD chỉ mất
  40–260ms/case.
- **Kiểm chứng harness trước khi tin số HD:**
  - `--check` ở 72x45, p=0.5: rasterizer scanline V13 vs
    per-pixel V12 lệch **0 pixel / 16/16 type** (14 V3 +
    wipeleft + diamond).
  - V13 ở 72x45, p=0.5: 14/14 V3 KHỚP, MAD 0.14–0.59, khớp phạm
    vi đợt 12 (0.00–0.52, star 0.59 hơi cao hơn do sàn yuv, xem
    dưới) — duration 0.4 không làm sai kết quả so với V12.
  - V13 ở 72x45, p=0.25/0.75 (4 type mẫu): 8/8 KHỚP, B% render
    trùng preview tới 0.01% — ghép P theo §4 là đúng.
- **Sàn làm tròn yuv (không phải lỗi hình học).** Nguồn lavfi
  `color` đi qua yuv: đỏ render = 254 (không phải 255), xanh =
  255 đúng. Nên MAD có sàn (1−B%)/3: p=0.25 → ~0.250,
  p=0.5 → ~0.167, p=0.75 → ~0.083, và hàng trăm nghìn pixel
  diff=1. Mọi MAD trong bảng §3 đều bao gồm sàn này; le8 =
  100% nghĩa là không còn pixel nào lệch > 8 ngoài biên đã nêu.
  Bản phân tích lệch đầu tiên của V13 đếm bằng nhau tuyệt đối
  nên báo "lệch 75%" cho wipeleft — đó là lỗi của hàm phân
  tích (đã sửa sang ngưỡng > 8, xem §6); các cột MAD/le8 trong
  log pre-fix vẫn đúng, chỉ cột phân tích lệch của 6 dòng
  wipeleft/diamond trong log pre-fix là sai và đã được đo lại.

Cách chạy (từ `server/render/`):
`node src/test_v13_hd_parity.js [--size 1920x1080] [--ps 0.25,0.5,0.75] [--extra] [--check] [--only ...]`
`--extra` thêm wipeleft + diamond (nợ cũ). Exit 0 khi mọi case
render xong (kể cả LỆCH); 1 khi lỗi render; 2 khi harness lỗi.

## 2. Fix scaling: rowScanPair (blinds-diag, rings, corners)

- **Nguyên nhân (pre-fix, 1920x1080):** `rowH = max(0.5, h/160)`
  → ở 1080p mỗi dải rộng 6.75px, hình học của dải lấy theo hàng
  giữa nên biên chéo/cong lệch tới nửa dải (~3.4px). Đo thật:

  | Type | p=0.25 | p=0.5 | p=0.75 | (MAD pre-fix, le8 97.53% cho blinds-diag) |
  |---|---|---|---|---|
  | blinds-diag | 4.436 XẤP XỈ | 4.351 XẤP XỈ | 4.268 XẤP XỈ |
  | rings | 1.245 KHỚP | 1.196 KHỚP | 1.140 KHỚP |
  | corners | 0.450 KHỚP | 0.422 KHỚP | 0.179 KHỚP |

  B% render trùng preview tới 0.02% ở cả 3 type — lỗi chỉ ở
  biên, đúng bản chất xấp xỉ theo hàng giữa. Rings/corners vẫn
  KHỚP trước fix vì biên của chúng đổi chậm theo y (vòng tròn /
  cung góc) nên sai số nửa dải nhỏ hơn; blinds-diag (dải chéo
  dốc) là type duy nhất rơi xuống XẤP XỈ ở HD.
- **Fix:** `rowH = 1` — mỗi dải đúng 1 hàng pixel, `yIdx` chính
  là chỉ số hàng đó, không còn xấp xỉ. Ở khung nhỏ, kết quả
  không đổi (mỗi hàng pixel trước đây cũng đã có đúng 1 `yIdx`,
  chỉ là dải 0.5px bị lặp đôi). Giá phải trả: số rect tăng từ
  ≤160 dải lên H dải (1080 dải ở 1080p); preview gom tất cả
  rect vào 1 path rồi clip 1 lần (`preview.tsx`: `clipRegion`)
  nên chi phí chỉ tăng tuyến tính ở bước dựng path.
- **Sau fix (1920x1080, từ lượt post-fix §3):** blinds-diag
  0.249/0.165/0.081, rings 0.255/0.168/0.084, corners
  0.296/0.181/0.069 — tất cả le8 ≥ 99.999%, tức về đúng sàn
  làm tròn. Unit test `transitionPreview.test.ts`: 20/20 pass
  (gồm test quét hàng cũ, không đổi kỳ vọng).

## 3. Bảng MAD đầy đủ — POST-FIX, 1920x1080, FFmpeg 8.1.2

Thang V6: KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8. Tất cả các
dòng dưới đều KHỚP. MAD đã bao gồm sàn yuv (1−B%)/3 (xem §1).
B% render vs preview trùng nhau tới 0.12% ở mọi dòng (phần
lớn ≤ 0.05%; star lệch nhất 0.12% do biên đa giác, xem dưới);
cột B% không lặp lại ở đây để bảng gọn.

| Type | p=0.25: MAD / ≤8 | p=0.5: MAD / ≤8 | p=0.75: MAD / ≤8 |
|---|---|---|---|
| diamondclose | 0.349 / 99.964% | 0.255 / 99.948% | 0.107 / 99.964% |
| squareopen | 0.296 / 100% | 0.185 / 100% | 0.083 / 100% |
| squareclose | 0.250 / 100% | 0.148 / 100% | 0.037 / 100% |
| checker-alt | 0.333 / 100% | 0.167 / 100% | 0.167 / 100% |
| blinds-diag | 0.249 / 100% | 0.165 / 100% | 0.081 / 100% |
| split-h | 0.250 / 100% | 0.167 / 100% | 0.083 / 100% |
| split-v | 0.250 / 100% | 0.167 / 100% | 0.083 / 100% |
| barn-h | 0.250 / 100% | 0.167 / 100% | 0.084 / 100% |
| barn-v | 0.250 / 100% | 0.167 / 100% | 0.084 / 100% |
| rings | 0.255 / 99.999% | 0.168 / 99.999% | 0.084 / 99.999% |
| corners | 0.296 / 99.999% | 0.181 / 100% | 0.069 / 100% |
| star | 0.498 / 99.837% | 0.321 / 99.849% | 0.180 / 99.901% |
| clock-ccw | 0.329 / 99.954% | 0.324 / 99.907% | 0.206 / 99.928% |
| spiral | 0.795 / 99.678% | 0.721 / 99.674% | 0.629 / 99.678% |
| wipeleft (nợ cũ) | 0.250 / 100% | 0.167 / 100% | 0.084 / 100% |
| diamond (nợ cũ) | 0.350 / 99.964% | 0.255 / 99.948% | 0.106 / 99.964% |

Đọc thêm từ bảng:
- Các type rect/dải (square, split, barn, checker-alt) về đúng
  sàn yuv (MAD = (1−B%)/3, le8 100%) — hình học của chúng là
  chính xác tới mức đo được, không còn sai số mô hình.
- spiral là type yếu nhất vẫn KHỚP (MAD 0.63–0.80, ~0.32%
  pixel lệch > 8): biên dải xoắn là đường cong, đa giác xấp xỉ
  bằng đoạn thẳng + cung ngoài nên pixel biên lệch nhiều hơn
  các type khác. Star tương tự nhưng nhẹ hơn (0.18–0.50):
  đa giác 96 đỉnh xấp xỉ hàm cos5θ nên dây cung cắt góc sao.
  Cả hai vẫn KHỚP với biên độ rộng, không cần sửa mô hình.
- checker-alt ở p=0.25 là trường hợp suy biến: expr dùng
  `gt(P,0.25)` nghiêm ngặt nên ở đúng p=0.25 cả ô chẵn lẫn ô
  lẻ đều chưa hiện → B% = 0 cả render lẫn preview. Số đo này
  đúng nhưng không có khả năng phân biệt hình học (cả hai đều
  rỗng); không dùng nó để kết luận checker-alt khớp — kết luận
  dựa vào p=0.5/0.75 (B% = 50% cả hai phía, le8 100%).
- 720p không cần đo riêng: 1080p đã chạy xong toàn bộ trong
  ~12.5 phút/lượt, không có lý do kỹ thuật nào để hạ xuống
  720p (nhiệm vụ cho phép 720p chỉ khi 1080p quá chậm — ở đây
  1080p chạy được, chỉ chậm do expr FFmpeg chứ không do
  harness).

## 4. Phát hiện: P của expr custom GIẢM 1→0 (nợ hướng render)

Bằng chứng đo thật (FFmpeg 8.1.2, lặp lại bằng cả lavfi lẫn
file rawvideo kiểu V12, cả 192x108 và 1920x1080):
- wipeleft (built-in), duration 0.4: B% tăng đơn điệu qua các
  frame transition (frame 30: 0%, 31: 7.8%, …, 42: 99.5%) —
  P tăng 0→1, đúng kỳ vọng.
- squareopen / diamondclose (custom), cùng thiết lập: B% GIẢM
  đơn điệu (frame 30: 100%, …, 41: ~1%) — P giảm 1→0. Ví dụ
  diamondclose ở HD: frame 39 cho B% = 13.53% = đúng hình học
  P=0.25 (preview 13.56%), frame 33 cho 86.40% = P=0.75.
  Với duration 1 (kiểu V12): squareopen frame 30 = 100% B,
  frame 45 = 45.4% (≈ P=0.5), frame 59 = 0.2% (≈ P=0).
- Công thức ghép frame của V13: custom → frame
  30 + round((1−p)·12) (p=0.25/0.5/0.75 → 39/36/33);
  built-in → 30 + round(p·12) (33/36/39). p=0.5 rơi vào
  frame 36 ở cả hai chiều nên mọi số đo V11/V12 (chỉ đo p=0.5)
  đều vẫn đúng — đảo chiều này chỉ lộ ra khi đo p ≠ 0.5.
- Lần đo HD đầu tiên của luồng này (chưa biết đảo chiều) đã
  ghép sai (preview p=0.25 vs render P=0.75) và cho MAD
  85–124 LỆCH giả — đã hủy lượt đó, chẩn đoán bằng đường cong
  B% theo frame, sửa ghép frame, đo lại toàn bộ. Các số trong
  §3 đều dùng ghép đúng; log pre-fix/post-fix đều dùng ghép
  đúng (log pre-fix chỉ khác post-fix ở 3 fix §2/§5).
- Ảnh hưởng tới sản phẩm: render worker (`render.js` bước 2)
  ghép `[A][B] + buildXfadeFilter(type, T, dA−T)` đúng thứ tự
  như harness, nên transition custom khi render thực tế cũng
  chịu P giảm này. Hệ quả theo thời gian: ví dụ squareopen
  render ra sẽ hiện toàn cảnh mới ở đầu cửa sổ, rồi hình vuông
  co dần về không, rồi cắt sang cảnh mới — ngược với ý đồ
  "cảnh mới nở ra từ hình vuông" và ngược với preview (p tăng
  dần). Đây là nợ của tầng render/expr, KHÔNG phải của preview:
  hình học tại cùng một giá trị P thì khớp (§3), nhưng chiều
  thời gian thì ngược. Luồng này không sửa expr (đó là mô hình
  của luồng render) và không đảo p của preview để "hợp thức
  hoá" render ngược — cả hai cách đều giấu bug. Hướng sửa để
  luồng render quyết: hoặc viết lại expr theo P giảm (vd thay
  P bằng 1−P trong expr — nhưng phải kiểm tra lại toàn bộ 23
  type custom, không chỉ 14 V3), hoặc đổi cách ghép xfade sao
  cho P tăng (nếu FFmpeg cho phép). Ghi chú: tài liệu web phổ
  biến mô tả P custom là "0→1" — số đo thật trên FFmpeg 8.1.2
  ở đây mâu thuẫn với mô tả đó; tin số đo, không tin tài liệu
  thứ cấp.

## 5. Nợ cũ wipeleft + diamond: tái hiện ở HD, đã sửa rẻ

- **wipeleft — TÁI HIỆN, ĐÃ SỬA.** Pre-fix ở HD: lệch>8 đúng
  1080 pixel trên đúng 1 cột ở mọi p — cột 1440 (p=0.25), 960
  (p=0.5), 480 (p=0.75), tức đúng cột ngưỡng X = W·(1−p):
  preview cho cột đó là B, render là A (biên strict-gt của
  FFmpeg built-in). Ở HD nó vẫn KHỚP theo thang (1/1920 =
  0.052%) nhưng ở 72x45 nó là nguyên nhân của XẤP XỈ V11
  (1/72 = 1.39%). Fix trong `describeTransition`: cột ngưỡng
  ti = floor(W·(1−p)) thuộc A ⇔ A rộng ti+1.5, B bắt đầu
  ti+1.5 (trong không gian tâm điểm; với ngưỡng không nguyên,
  floor cho đúng phân hoạch cũ nên không đổi gì ngoài trường
  hợp ngưỡng nguyên). Sau fix: lệch>8 = 0 ở mọi p, cả HD lẫn
  72x45 (72x45: MAD về đúng sàn 0.255/0.171/0.088, le8 100%,
  so với V11 là MAD 2.36 XẤP XỈ). Test `wipeleft p=0.5` trong
  `transitionPreview.test.ts` đã cập nhật theo số đo render
  (W=100: A rộng 51.5, B bắt đầu 51.5 rộng 48.5 — test cũ ghim
  hình học 50/50 sai so với render). Chưa đo wiperight /
  wipeup / wipedown nên KHÔNG suy diễn đối xứng, giữ nguyên 3
  type đó — cần một lượt đo biên riêng nếu muốn sửa đồng bộ.
- **diamond cũ — TÁI HIỆN, ĐÃ SỬA (phần lớn).** Pre-fix ở HD:
  lệch>8 = 1501 (p=0.25) / 2160 (p=0.5) / 1532 (p=0.75) pixel,
  rải ~2–3 pixel/cột trên biên chéo — đúng lệch nửa pixel như
  nợ đợt 12. Fix: tâm đa giác +0.5 như diamondclose (expr đánh
  giá tại chỉ số nguyên, canvas lấy mẫu tại tâm pixel). Sau
  fix ở HD: 751 / 1080 / 749 pixel — đúng một nửa cả về số
  pixel lẫn số cột (751→376, 1081→541, 750→375 cột) — tức lệch
  hệ thống đã hết. Phần còn lại là pixel nằm ĐÚNG trên cạnh
  thoi (ở HD bán kính r = 375/750/1125 đều nguyên nên cạnh đi
  qua đúng tâm pixel): FFmpeg dùng `lte` (bao gồm điểm biên)
  còn rasterizer của harness dùng luật ray-cast (loại một nửa
  số điểm biên, đúng 2/4 cạnh). Bằng chứng: ở 72x45, r =
  14.625/29.25/43.875 đều không nguyên nên không có pixel nào
  nằm đúng trên cạnh → sau fix lệch>8 = 0 ở mọi p. Phần dư
  này (0.036–0.052% khung, tier vẫn KHỚP) là quy ước tie-break,
  không phải lệch hình học — không sửa thêm (sửa nữa là đổi
  quy ước raster, không đổi hình học, rủi ro cao hơn lợi ích).

## 6. Trung thực về 2 lỗi của chính luồng này (đã sửa, số cuối mới có giá trị)

1. **Ghép frame sai ở lần đo HD đầu** (preview p vs render
   1−p cho custom, xem §4): cho MAD 85–124 LỆCH giả ở p=0.25/
   0.75. Đã chẩn đoán bằng đường cong B% theo frame, sửa
   ghép frame theo P thực, đo lại toàn bộ 48 case × 2 lượt.
   Không có số nào trong §3 lấy từ lượt ghép sai đó.
2. **Hàm phân tích lệch đếm bằng nhau tuyệt đối** (xem §1):
   báo wipeleft "lệch 75%" vì đếm cả pixel diff=1 do sàn yuv.
   Đã sửa sang ngưỡng > 8; các dòng wipeleft/diamond trong
   log pre-fix có cột phân tích lệch sai (cột MAD/le8 vẫn
   đúng) và đã được đo lại sau fix — chỉ trích dẫn số phân
   tích lệch từ lượt post-fix (hoặc lượt đo riêng sau fix).

## 7. Chưa xong / nợ mở (trung thực, không claim quá)

- **Đảo chiều P của custom (§4)** là nợ lớn nhất của đợt này,
  thuộc về luồng render — cần quyết hướng sửa và đo lại toàn
  bộ 23 type custom (không chỉ 14 V3) sau khi sửa, vì sửa expr
  sẽ đổi mọi frame custom.
- wiperight / wipeup / wipedown chưa đo biên (chỉ wipeleft đã
  đo/sửa) — không giả định chúng cùng lỗi 1 cột.
- diamond còn ~750–1080 pixel tie-break biên ở HD khi r nguyên
  (§5) — tier KHỚP, không sửa thêm.
- spiral (MAD tới 0.80) và star (tới 0.50) là 2 type V3 yếu
  nhất dù vẫn KHỚP — biên đa giác xấp xỉ đường cong; muốn
  MAD về sàn thì cần tăng số đỉnh / vẽ biên cong thật, chưa
  làm trong đợt này.
- Harness vẫn đo hình học composite (cả 2 lớp A/B trên cùng 1
  frame) như V12, không phải ảnh chụp preview canvas thật
  (preview thật vẽ 1 clip/lần trên nền đen — khác biệt đã ghi
  từ đợt 10, vẫn còn nguyên).
- Nguồn đo vẫn là màu phẳng đỏ/xanh (không phải footage quay
  thật, không có nhiễu/texture); chưa đo clip dài, chưa đo
  4K; TTS/caption/FPS không thuộc phạm vi luồng này.
- circleopen (MAD 43.50) và dissolve (MAD 85.52) là nợ cũ đợt
  12, ngoài ranh giới luồng này — không đo lại, không sửa.

## 8. File đã đổi/thêm (đường dẫn tương đối repo)

Stage (KHÔNG push — parent gộp batch, xem báo cáo cuối):
- `server/render/src/test_v13_hd_parity.js` (MỚI — harness V13)
- `apps/web/src/lib/transitionPreview.ts` (SỬA — rowScanPair
  rowH=1; wipeleft biên strict-gt; diamond tâm +0.5)
- `apps/web/src/lib/transitionPreview.test.ts` (SỬA — test
  wipeleft theo số đo render)
- `docs/PHASE9_ROUND13_C6_HD_MEASURE_LIMITS.md` (MỚI — chính
  file này)

KHÔNG đưa vào danh sách stage (chỉ để trên đĩa, ghi tên để
đối chiếu — theo đúng quy định của nhiệm vụ):
- `benchmarks/results/v13-hd-pre-fix.log` (48 case pre-fix,
  ~11.2 phút chạy)
- `benchmarks/results/v13-hd-post-fix.log` (48 case post-fix,
  ~12.5 phút chạy)

Kiểm chứng đã chạy: `--check` 0 pixel lệch (16 type, 72x45);
unit test `transitionPreview.test.ts` 20/20 pass; tsc riêng
cho `transitionPreview.ts` sạch (tsc/vite build toàn app do
parent kiểm chứng gộp); 2 lượt HD đầy đủ, mỗi lượt 48 case,
0 lỗi render, 0 FAIL.
