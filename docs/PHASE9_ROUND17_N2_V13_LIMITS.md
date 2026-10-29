# Phase 9 đợt 17, luồng N2 — V13 hỗ trợ radial-soft + dissolve-noise: LIMITS (trung thực)

> Luồng N2 đợt 17 (chỉ luồng này). KHÔNG push GitHub, KHÔNG release/tag,
> KHÔNG code giả, KHÔNG file binary, KHÔNG tạo file paths-loop riêng
> (parent sẽ gộp batch), KHÔNG sửa build-loop-log.md.
> Chỉ sửa 2 file (xem §5). FFmpeg đo: 8.1.2. Thang KHỚP V6/V11/V12:
> MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8 (mỗi kênh).
> Nguồn: A đỏ thuần / B xanh dương thuần qua lavfi color, render qua
> pipe (không file raw), khung 1920×1080, duration=0.4, offset=1,
> fps=30, frame đích = 30 + round(p×12) — đúng quy ước V13 sau sửa
> hướng P đợt 14 R1.

## 0. Kết luận ngắn

1. **Nợ đợt 16 đã đóng:** V13 nay hỗ trợ cả 2 kind còn thiếu —
   `radial-soft` (type `circle-soft`) và `dissolve-noise` (type
   `dissolve`). Trước đợt này cả 2 đều FAIL giả với preview đen
   (đo baseline 320×180 p=0,5: circle-soft MAD 84,649, dissolve
   MAD 84,832, B% preview 0,00).
2. **HD 1920×1080 × p = 0,25 / 0,5 / 0,75: 6/6 KHỚP, FAIL 0,
   lỗi render 0** (xem §2).
3. **Hồi quy V13 cũ giữ nguyên: 42 case mặc định FAIL 0** (đúng con
   số đợt 16) **+ 15 case circleopen/circleclose/bars-fade/wipeleft/
   diamond FAIL 0**, với số MAD của 3 type đợt 16 H1 trùng đúng tới
   3 chữ số thập phân (circleopen 0,440/1,200/0,178…).
4. **Đính chính 1 điểm trong mô tả nhiệm vụ (quan trọng, xem §1.3):**
   radial-soft KHÔNG dùng smoothstep và KHÔNG dùng tâm cắt nguyên
   floor(W/2) — đó là mô hình của `radial-gradient` (circleopen).
   Mô hình radial-soft đã xác minh (đợt 14 R1 §3.4, đợt 15 T6) là
   trọng số TUYẾN TÍNH `radialSoftWeight` + tâm region W/2+0,5 đánh
   giá tại tâm pixel. Làm theo đúng chữ "smoothstep + tâm cắt nguyên"
   cho radial-soft sẽ cho trọng số sai. Ở khung 1920×1080 (W, H chẵn)
   hai quy ước tâm trùng nhau về số nên số HD không bị ảnh hưởng
   bởi điểm này; nó chỉ khác nhau ở khung lẻ.

## 1. Việc đã làm (chỉ trong `server/render/src/test_v13_hd_parity.js`)

### 1.1. radial-soft (circle-soft)

- Thêm `radialSoftWeightV13` (ưu tiên hàm thật `radialSoftWeight` từ
  module `transitionPreview`, fallback đúng công thức module:
  `clamp((center+width-rho)/width, 0, 1)`, width ≤ 0 → bậc thang)
  và nhánh mới trong `layerPixelAlphaV13`: rho = khoảng cách từ
  TÂM pixel (x+0,5, y+0,5) tới tâm region (cx = W/2+0,5, cy = H/2+0,5)
  chia rMax = hypot(W/2, H/2) của chính region; alpha = w (lớp B)
  hoặc 1-w (lớp A, inverted) nhân layer.alpha.
- Vì |(x+0,5) − (W/2+0,5)| = |x − W/2| nên khoảng cách này bằng đúng
  khoảng cách FFmpeg tính tại chỉ số nguyên trong expr custom
  (`sqrt(pow(X-W/2,2)+pow(Y-H/2,2))`) — đúng mô hình soft-aware đợt
  14 R1 §3.4 / đợt 15 T6. Bản chưa dịch tâm (+0,5) đã đo ở T6 cho
  MAD ~0,9 ở 192×108 (le8 ~90%); bản dịch tâm cho 0,18–0,21.
- `regionCoversV12` thêm `case "radial-soft": return true` (mirror
  radial-gradient: phủ khắp khung, alpha biến thiên) — nhưng cả 2
  rasterizer đều được nối đường per-pixel riêng cho kind này (xem
  §1.3) nên nhánh mask nhị phân/geometric không bao giờ dùng tới
  giá trị true đó cho radial-soft.

### 1.2. dissolve-noise (dissolve)

- Thêm `loadDissolveFrand()` (transpile `apps/web/src/lib/
  dissolveFrand.ts` qua tsc → /tmp, mirror V11/V12) và gán
  `dissolveFrandFnV13` trong `main()` trước cả nhánh `--check` lẫn
  đo chính. Lần đo này load OK.
- `regionCoversV12` thêm `case "dissolve-noise"`: frand float32 tại
  chỉ số nguyên `floor(x), floor(y)` (raster truyền tâm pixel x+0,5
  nên floor về đúng chỉ số FFmpeg dùng trong vf_xfade.c); invert →
  `fr >= p` (lớp A), ngược lại `fr < p` (lớp B).
- **Không có fallback double:** đợt 14 R2 đã chứng minh tính frand
  bằng double chỉ khớp ~mức ngẫu nhiên (sai số đối số ~1e-4 nhân
  43758 quay fract nhiều vòng). Chưa load được hàm thì kind này phủ
  sai có chủ đích (false) → case LỆCH rõ ràng, không cho số giả.

### 1.3. Nối đường per-pixel + mở rộng --check

- `rasterizeV12` (tham chiếu) và `rasterizeV13` (scanline) đều thêm
  phát hiện `hasRadialSoft` / `hasDissolve` và đi đường per-pixel qua
  `layerPixelAlphaV13` cho cả 2 kind — giống cách radial-gradient/
  bars-fade đã làm, vì gradient mềm và mask frand từng pixel không
  biểu diễn được bằng mask nhị phân scanline (đi đường mask sẽ ra
  frame đen như trước).
- `--check` mở rộng thêm `circle-soft`, `dissolve` vào danh sách đối
  chiếu 2 rasterizer ở 72×45, p=0,5.
- **Không đụng:** `harnessShared.js`, V11/V12/V14, code web, và không
  đụng `transitions.js` (expr render của cả 2 type đã đúng từ đợt
  14 R1/R2; việc thiếu chỉ nằm ở phía rasterizer V13).

## 2. Số đo thật (FFmpeg 8.1.2, 1920×1080)

### 2.1. Kind mới — 6 case, FAIL 0

| Type | p | Frame | MAD | ≤8 | ≤32 | Hạng | B%: render vs preview |
|---|---|---|---|---|---|---|---|
| circle-soft | 0,25 | 33 | 0,451 | 100,000% | 100,000% | KHỚP | 12,33 vs 12,40 |
| circle-soft | 0,5 | 36 | 0,356 | 100,000% | 100,000% | KHỚP | 47,22 vs 47,33 |
| circle-soft | 0,75 | 39 | 0,214 | 100,000% | 100,000% | KHỚP | 80,58 vs 80,67 |
| dissolve | 0,25 | 33 | 0,256 | 99,996% | 99,996% | KHỚP | 24,97 vs 24,97 |
| dissolve | 0,5 | 36 | 0,174 | 99,996% | 99,996% | KHỚP | 50,01 vs 50,01 |
| dissolve | 0,75 | 39 | 0,089 | 99,996% | 99,996% | KHỚP | 75,02 vs 75,02 |

- Lệnh: `node src/test_v13_hd_parity.js --only circle-soft,dissolve`
  từ `server/render/`.
- `--check` (72×45, p=0,5): circle-soft và dissolve đều **0 pixel
  kênh lệch** giữa rasterizeV12 và rasterizeV13 (21 type đối chiếu
  tổng cộng, lệch lớn nhất 0 pixel) — 2 rasterizer tương đương
  trước khi tin số HD.

### 2.2. Hồi quy V13 cũ — 42 + 15 case, FAIL 0

- Mặc định (14 type V3 × 3 p): `== KẾT V13: 42 case, FAIL: không
  có; lỗi render: 0 ==`. MAD từng case 0,037–0,795, tất cả KHỚP
  (spiral cao nhất 0,795/0,721/0,629 — vẫn dưới ngưỡng 2 rất xa).
- Bổ sung (`--only circleopen,circleclose,bars-fade,wipeleft,
  diamond`): 15 case, FAIL 0, lỗi render 0; số MAD trùng đúng bảng
  đợt 16 H1 (circleopen 0,440/1,200/0,178; circleclose 0,529/1,162/
  0,098; bars-fade 0,750/0,333/0,167) — chứng tỏ việc nối nhánh mới
  không làm lệch đường rasterizer cũ.

## 3. Giới hạn còn lại (trung thực)

- **Dissolve ≤8 = 99,996%, không phải 100%:** ~83 pixel/khung
  (0,004% × 2.073.600) lệch > 8 — đúng họ lệch biên sinf 1-ulp mà
  đợt 14 R2 đã ghi (fract nằm sát biên bin thì sinf glibc vs
  Math.sin JS lệch nhau). Ở 72×45/144×90 đợt 14 R2 đo MAD 0,0000
  (0 pixel lệch); ở HD tọa độ tới 1919×1079 nên số pixel biên này
  hiện ra, nhưng vẫn dưới ngưỡng KHỚP (≥ 99%) rất xa. Không có cách
  khử hoàn toàn bằng JS thuần nếu không re-implement sinf của glibc.
- **circle-soft MAD HD (0,214–0,451) cao hơn số soft-aware cũ
  (0,18–0,21 ở ≤ 720p, đợt 14 R1/đợt 15 T6):** vẫn KHỚP với biên lớn
  (ngưỡng 2), và B% render–preview chỉ lệch ≤ 0,11 điểm %. Phần
  chênh nhiều khả năng là sàn lượng tử hoá yuv→rgb ở khung lớn +
  vành mềm rộng hơn theo pixel tuyệt đối; chưa truy nguyên tới từng
  pixel vì không cần cho hạng KHỚP — ghi lại để đợt sau khỏi tưởng
  là hồi quy.
- **Chi phí render circle-soft ở HD rất cao:** mỗi frame đích tốn
  60–107s render FFmpeg (expr custom chứa sqrt/pow đánh giá từng
  pixel 1080p trên máy 2 CPU này), trong khi preview chỉ 0,3–1,1s
  và dissolve render chỉ 1,7–3,2s. Đo 6 case mới hết ~5 phút, hồi
  quy 42 case hết ~9 phút — đây là chi phí của harness, không phải
  của sản phẩm.
- **Phạm vi số đo là mức mô hình xfade rgb24** (lavfi → xfade →
  `format=rgb24` qua pipe), đúng quy ước mọi lần đo V13. Đây KHÔNG
  phải kiểm chứng xuất file yuv420p end-to-end: đợt 15/16 đã đo
  yuv420p e2e LỆCH nặng (~50) cho dissolve/circleopen ở tầng encode
  file, và nợ đó vẫn còn nguyên, không bị số đo đợt này che lấp.
- **Chỉ đo ở 1920×1080 và nguồn màu phẳng:** khung lẻ (nơi quy ước
  tâm radial-soft vs tâm cắt nguyên khác nhau) và nội dung phi-lavfi
  chưa đo cho 2 kind này trong đợt này — mô hình thì không phụ thuộc
  nội dung (cùng expr, cùng frand tại cùng tọa độ), nhưng số HD trên
  footage thật vẫn là nợ mở, không claim.
- **Bars-fade ở harness vẫn giữ giả định cũ** (cả 2 lớp full-frame,
  alpha=1) — không liên quan đợt này, nhắc lại từ đợt 16 để khỏi
  tưởng đã sửa.

## 4. Lệnh kiểm chứng lại

```sh
cd ~/workspace/repo-1/server/render
node src/test_v13_hd_parity.js --check
node src/test_v13_hd_parity.js --only circle-soft,dissolve
node src/test_v13_hd_parity.js            # hồi quy 42 case mặc định
node src/test_v13_hd_parity.js --only circleopen,circleclose,bars-fade,wipeleft,diamond
node --check src/test_v13_hd_parity.js    # cú pháp JS
```

## 5. File đã đổi (chính xác, không tạo file paths-loop riêng)

- `server/render/src/test_v13_hd_parity.js` (SỬA — nhánh radial-soft
  + dissolve-noise, load dissolveFrand, mở rộng --check; không sửa
  harnessShared.js, V11/V12/V14, không sửa code web).
- `docs/PHASE9_ROUND17_N2_V13_LIMITS.md` (MỚI — file này).
