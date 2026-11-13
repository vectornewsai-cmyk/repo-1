# Phase 9 đợt 86, luồng N7 — Danh tính toán tử video đầy đủ (LIMITS)

Ngày: 2026-11-11. Repo local `~/workspace/repo-1`, HEAD vẫn `5f548ef8`.
KHÔNG push, KHÔNG release/tag, KHÔNG binary, KHÔNG file `.github/workflows`.
Không thêm i18n key. Không sửa production TS (xem §3 — Chrome tự làm scaler
video; đường plain sau M10 đi qua canvas 1:1 Mitchell nên không có sửa
production nào từ luồng này). M5 (luồng song song, EPERM wiring) đã chạm
`r86n7-video-operator2-headed.mjs` lúc 02:54 UTC (đổi `fs.writeFileSync`
sang `writeFileEpermRetry`, không đổi hành vi) — ghi nhận, không phải việc
của luồng này.

## §0. Kết luận — toán tử video là gì

Explicit `drawImage(video)` (upscale lẫn downscale) = **tam giác
(bilinear) với vị trí lấy mẫu lượng tử hoá về lưới 1/16 px và chuyển
float→uint8 bằng CẮT NGỌN**:

```
S     = (i + 0,5 − offDst) / fround(s)        s = thang thực dst/src
S_q   = floor(16·S) / 16                      fround = float32
v     = Σ tri(j + 0,5 − S_q) · src[j]         tri(x) = max(0, 1−|x|)
out   = trunc(v)                              CẮT NGỌN, không làm tròn
```

(viết khác tương đương: round về 1/16 với φ=−1/32, vì
round(y−0,5)=floor(y) với mọi y — nhưng KHÔNG được implement bằng
`Math.round` vì tie .5 của JS làm tròn LÊN, sai đúng pixel tie, xem §5.)

Bằng chứng chốt (`r86n7-verify3.json`): **86/87 case MAD đúng 0**
(73 upscale + 6 CTM + 7/8 downscale; thang 1,0–3,0 + thang editor
1,2638889/2,2639 + downscale 0,6/0,75; bậc 0→255, sóng vuông 64/192,
vạch 1px; Chromium 1254 headed, SwiftShader/CPU). Phần dư duy nhất:
sqw4-mid s=0,6 (16 pixel, §5).

Toàn bộ pipeline video (preview/render) và đóng góp từng bước
(bảng ngân sách — Δcorr/phần dư sau khi dùng đúng mô hình):

| Bước | Danh tính | Đóng góp còn lại |
|---|---|---|
| Decode (mp4→frame) | B-1to1 = nguồn byte-identical (MAD 0, clip xám); patch màu Chrome vs ffmpeg max 2 tại tâm | 0 |
| YUV→RGB | **bt601 limited-range** (Chrome mặc định SD); hệ số dốc khớp bt601 trong 0,018; max residual fit 0,25; bt709 bị loại (sai hệ số tối đa 57,5) | 0 (sau khi dùng đúng ma trận — Δcorr ở s≈2,26 của M2 chính là do dùng bt709 sai) |
| Chroma upsample | ≡ **ffmpeg/swscale mặc định** (MAD 0,5); nearest 7,5, bilinear ngây thơ (MPEG2/JPEG siting) 7,56 — đều bị loại | 0 |
| Scale (kernel) | **tam giác + S_q 1/16 + trunc** (V1 trên); sóng dày từ tri-float MAD mean 0,478 / worst 1,113 về 0,000 | 16 pixel ở sqw4-mid s=0,6 (§5) |
| CTM | Cùng quy tắc V1, offDst là tịnh tiến theo trục đang xét; offX=0,5 không ảnh hưởng profile trục còn lại | 0 (6/6 MAD 0) |
| Quality high/low | **Giống hệt trên đường video** (cùng tam giác); canvas-high ≡ Mitchell (MAD 0–0,008) là đường KHÁC (image/canvas, K2 đợt 83) | 0 |
| Premultiply / alpha | Alpha kênh ra luôn 255 (149 dump); video không có alpha | 0 |
| Composite | Source-over 8-bit Skia `floor((128v+127bg+127)/255)`, alpha 128/255; MAD 0,001, maxDiff 1 | ≤1 (sàn làm tròn) |
| Scale xảy ra ở | **Không gian RGB sau convert** (modelA 0,043/0,041 vs modelB YUV-space 0,70/7,66) | 0 |
| Đẳng hướng / luma=chroma | Đúng (M2) | 0 |

Hệ quả cho Δcorr: với mô hình đúng, resample tái tạo Chrome **từng số**
trên 86/87 case nên đóng góp của resample vào Δcorr = 0; Δcorr còn lại
(nếu có) nằm ở khác biệt cấu trúc nhiễu giữa 2 đường (render ffmpeg noise
trên YUV420p native vs preview addYuvNoise trên base RGB-derived — như
V3 đợt 68 đã kết luận), không phải ở bộ lọc.

## §1. Bằng chứng số (verify3)

- **V1 trên 87 case: nZero 86/87, worst MAD 0,6531** (chỉ hỏng
  `down:sqw4-mid s0.6`). Chi tiết từng case trong `r86n7-verify3.json`
  (evidence, không stage).
- **Chuyển float→uint8 là TRUNC, không phải round** (phát hiện quan trọng
  nhất của verify2, trước đó mô hình dùng round): đổi round→trunc trên
  cùng 57 case bậc+sóng cho nZero 36→55/57, mean MAD 0,0054→0,0025.
  Pixel chứng minh trực tiếp: stepV255 s=1,5 i=479: đo 31, round cho 32,
  trunc cho 31. Sóng 64/192 không phân biệt được (giá trị nguyên).
- **Liệt kê 296 pixel S-nguyên phân biệt được** (S đúng là số nguyên trong
  số học thực, val(S) ≠ val(S−1/16)): **294 cho floor (S), chỉ 2 cho
  S−1/16** — cả 2 cùng s=809/640, S=320, i=404 (stepV255 đo 111, sqw4x-mid
  đo 136). Tie-break KHÔNG phải quy tắc chung (quy tắc "số nguyên → trừ
  1/16" và "strictly-below" đều CHẾT — strictBelow chỉ được 39/73).
- **Hướng làm tròn float32 của tỉ lệ quyết định tie** (đo được):
  fround(809/640) LÊN → V1 S=319,99999396 < 320 → S_q=319,9375 (đo 111 ✓);
  fround(1449/640) XUỐNG → V1 S=320,00001348 > 320 → S_q=320,0 (đo 127 ✓);
  fround(815/360) XUỐNG → CTM 6/6 ✓; fround(0,6) LÊN → V1 S=32,49999871
  < 32,5 nhưng Chrome cho 32,5 (§5).
- **15 biến thể số học đã thử** (chia/nhân × f32/f64 × thứ tự phép tính):
  tốt nhất V1/V15/V16/V23 = 86/87; V4 (thang float64) = 85/87 (hỏng 2 tie
  s=809/640); V11 (nhân nghịch đảo f32 của dstW) = 74/87 (hỏng tie s=3);
  không biến thể nào 87/87.
- **Downscale 4 combo**: floor+f64 = 8/8; floor+f32 = 7/8; round+f32/f64
  = 6/8 (hỏng thêm lineV s=0,75). Upscale+CTM: floor+f32 = 79/79.
- **CTM với thang ĐÚNG** (verify1 dùng sai thang 1449/640 cho stepV255,
  đã đính chính trong verify2 §2 sang 815/360 — đúng thang vì
  `drawScaled` vẽ ở kích thước tự nhiên dưới CTM scale 815/360; canvas
  1449 rộng chỉ là khung chứa): V1 6/6 MAD 0, kể cả off0.5. Pixel bất
  thường i=723 cũ (explicit 0 vs CTM 15) được giải thích: thang đúng từng
  đường + posq16 (explicit S_q=319,5 → 0; CTM S_q=319,5625 → ≈15).
- **Kernel tự do** (least-squares, 21 nút): φ*=−0,03, k≈triangle ±0,03 —
  đã bị posq16 vượt qua (superseded, không dùng nữa).
- Môi trường đo: Chrome 158 / Chromium 1254, SwiftShader/CPU, VM 4 vCPU
  EPYC 9D25. Chỉ đo upscale đẳng hướng nội dung tĩnh + downscale 0,6/0,75;
  chưa đo tỉ lệ không đẳng hướng (ngoài phạm vi sản phẩm — preview/render
  dùng thang đều). `seekableEnd=0` (python http.server), nội dung tĩnh nên
  frame 0 = frame 30.

## §2. Đính chính so với kết luận tạm thời trước đó

- **Trunc, không phải round**: mọi MAD "≈0,005–0,017 (1 pixel lệch 1)"
  trong phân tích cũ đều là sai số chuyển đổi cuối, không phải sai kernel.
  Sau khi đổi sang trunc, sóng dày MAD 0,000 và 71/73 case MAD đúng 0
  (trước khi xét thang float32).
- **φ=−1/32 round ≡ floor(16S)/16** (đẳng thức round(y−0,5)=floor(y)):
  "posq16 φ=−1/32" và "floor φ=0" là cùng một mô hình — verify1 báo cả hai
  worst 0,1417 vì chúng giống hệt nhau, không phải trùng hợp. Mô hình chốt
  viết dưới dạng floor để tránh tie .5 của `Math.round` JS.
- **Verify1 CTM dùng sai thang** (1449/640 thay vì 815/360) nên kết quả
  CTM ở đó không đáng tin — verify2 §2 làm lại với thang đúng, V1 6/6.
- **V11 và strictBelow đã thử và loại** (xem §1) — không phải đáp án.
- **Phần dư sóng dày sqw2 (M2) ĐÃ ĐÓNG**: không còn phần dư nào ngoài
  16 pixel sqw4-mid s=0,6 (§5).

## §3. Sửa mô hình (không sửa production TS)

Production TS không tự implement scaler video (Chrome làm); đường plain
sau M10 đi qua canvas 1:1 (Mitchell) nên **không có sửa production nào**.
Chỉ cập nhật mô hình đo trong `apps/web/scripts/chrome-resample.mjs`
(thư viện script harness):

- Thêm `videoOperatorWeights1D(i, s, srcLen, offDst=0)`:
  S=(i+0,5−offDst)/fround(s), S_q=floor(16S)/16, tam giác, bỏ tap ngoài
  biên, không chuẩn hoá lại (biên ảnh chưa đo — ghi rõ trong comment).
- Thêm `videoOperatorSample1D(src, i, s, offDst=0)`: Σ w·src rồi trunc
  về uint8.
- Thêm khối chú thích N7 vào header file (phân biệt rõ đường VIDEO với
  đường CANVAS trilinear/Mitchell; cập nhật dòng "Hàm xuất").
- Không đụng bất kỳ hàm canvas nào (`chromeWeights1D`,
  `resamplePlaneTrilinear`, `chromeResampleRgb24`, …).

Kiểm chứng sau sửa:

- Test mới `apps/web/scripts/r86n7-video-operator.test.mjs`: **10/10
  xanh** (`node --test`), gồm 2 tie đối nghịch s=809/640 (111) vs
  s=1449/640 (127), trunc (31, không phải 32), CTM off0.5 (0), identity,
  và 1 test pin phần dư s=0,6 (model 72, Chrome 64 — ghi rõ đừng "sửa").
- Hồi quy: `chrome-resample-67u2.test.mjs` **8/8 xanh** (không đổi hành vi
  đường canvas).
- `npm run build` ở `apps/web` (tsc + vite build): **pass, 0 lỗi**
  (vite build 6,31s). `npx tsc -p tsconfig.json` ở `apps/desktop`:
  **pass, 0 lỗi**.

## §4. Nợ mở (carry từ đợt 85 §4, cập nhật)

- **Toán tử video: ĐÃ ĐÓNG** trừ phần dư §5 (16 pixel tie nửa-nguyên ở
  s=0,6 — cần probe downscale thêm thang 0,3/0,9 nếu muốn pin cơ chế
  tie-break của đường downscale; thang dị hướng và biên ảnh chưa đo).
- G1: parent/user quyết (chưa tự đóng).
- vidstab `cache_stop`: thành phần hoạt động đã xác định, chưa sửa production.
- W7: nửa WebKit còn mở ở mức 1 quan sát chưa tái hiện.
- W6: drawImage là thành phần duy nhất gây chậm seek (~+270 ms/seek).
- birefnet-general trong gói: FAIL (nghi OOM-kill), fallback u2net hoàn tất.
- Voice cloning bằng giọng người thật đã thành công (M7 đợt 85); mẫu KHÔNG
  đưa vào repo.
- EPERM: không gặp sóng trong đợt 85; helper nối 50 file — chưa tuyên bố hết.
- TTS 39: CẤM kiểm lại mỗi đợt (kẹp Gradio, pillow<13).
- `.github/workflows/ci-security.yml` và `ci-build.yml`: vẫn 403 (App thiếu
  quyền workflows:write) — repo không có CI chạy thật; không thử push
  workflow nữa.

## §5. Phần dư duy nhất — sqw4-mid s=0,6 (16 pixel)

Tại S=k+0,5 đúng (i=19,31,43,55,67,…; S=32,5/52,5/72,5/…): mô hình V1
(thang float32) cho S_q=32,4375 → 72/184, Chrome đo 64/192 (MAD 0,65
trên case đó; 16 pixel lệch đúng 1 bước lưới 1/16 = 8 đơn vị). Ở đó
Chrome hành xử như thang float64 (S đúng 32,5). Biến thể thang float64
(V4) sửa được case này nhưng hỏng 2 tie upscale s=809/640. Không biến
thể nào trong 15 biến thể đã thử được 87/87. Giả thuyết còn lại (chưa
kiểm): đường downscale tính vị trí khác đường upscale (vd nghịch đảo
ma trận float32 rồi nhân trong float32 — đã thử dạng gần đúng, vẫn hỏng
tie s=809/640), hoặc SwiftShader lấy mẫu texture downscale qua bước
trung gian khác. Tác động thực tế: ≤1 pixel mỗi lần chuyển tiếp, chỉ ở
thang mà 16S chạm đúng nửa-nguyên (vd 0,6) — preview/render thật dùng
thang editor ~1,26/2,26 nên không chạm; không ảnh hưởng release gate.
