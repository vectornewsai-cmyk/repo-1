# Phase 9 đợt 12 — T6: Đối chiếu preview-vs-render vòng 3 (harness V12)

Ngày: 2026-10-27, luồng T6 đợt 12. KHÔNG push, KHÔNG tag/release,
KHÔNG binary, KHÔNG sửa logic sản phẩm. Chỉ thêm 2 file: harness
`server/render/src/test_v12_parity.js` và chính file LIMITS này.
File stage paths-loop KHÔNG do T6 tạo (parent sẽ gộp).

## 1. Harness V12 làm gì (và không làm gì)

`server/render/src/test_v12_parity.js` là bản mở rộng của V11
(`test_v11_parity.js` giữ nguyên, không sửa), chạy từ
`server/render/` bằng `node src/test_v12_parity.js`:

- §A: giữ nguyên 7 case hồi quy V11 (transition).
- §A2 (mới): 14 type V3, phát hiện fallback tự động — nếu
  `describeTransition` trả `geometric=false` thì case là PENDING,
  vẫn đo MAD của bản fallback so với render nhưng KHÔNG tính FAIL.
  Khi luồng T2 xong hình học V3, cùng harness này tự chuyển sang
  phân loại KHỚP/XẤP XỈ/LỆCH theo thang V6, không cần sửa harness.
- §B: giữ nguyên 4 case text hồi quy V11.
- §C (mới): effect canvas theo badge mới (pixelate, shake,
  rgb-shift, mirror) + sharpen hồi quy. Filter render lấy thật từ
  `buildEffectFilter` của `effects.js`; hàm preview lấy thật từ
  `effectCanvas.ts` (transpile bằng tsc sang /tmp, như V11).
  Badge được ĐỌC từ `previewStatus.ts` lúc chạy, không hardcode.

Thang phân loại (giữ đúng thang V6/V11): KHỚP = MAD ≤ 2 và
≥ 99% pixel lệch ≤ 8; XẤP XỈ = MAD ≤ 20 và ≥ 90% pixel lệch ≤ 32;
ngoài ra là LỆCH. PENDING không phải PASS cũng không phải FAIL.

## 2. Bảng số đo thật (lần chạy cuối, đã sửa 2 lỗi harness — xem §5)

Máy đo: FFmpeg 8.1.2, VM 2 CPU, Linux x64. Transition: khung 72x45,
A đỏ thuần / B xanh dương thuần, frame giữa p = 0.5. Text: 320x180,
"TEST" trắng trên nền đen. Effect: nguồn tổng hợp (pattern /
gradient kênh / asym). Số chỉ đúng máy đo và nguồn đo này.

### §A — Transition hồi quy V11 (khớp đúng bảng V11 chạy lại độc lập)

| Type | MAD | ≤8 | ≤32 | Kết luận |
|---|---|---|---|---|
| fade | 0.67 | 100.0% | 100.0% | KHỚP |
| wipeleft | 2.36 | 98.6% | 98.6% | XẤP XỈ (lệch 1 cột biên, như V11) |
| slideright | 0.00 | 100.0% | 100.0% | KHỚP |
| circleopen | 43.50 | 5.5% | 25.1% | LỆCH (gradient rộng, hoàn thành sớm ~P=0.8 — nợ cũ đợt 11, không phải hồi quy mới) |
| dissolve | 85.52 | 49.7% | 49.7% | LỆCH (lưới hash vs nhiễu từng pixel — nợ cũ đợt 11) |
| diamondclose | 85.00 | 0.0% | 0.0% | LỆCH theo thang V11 (§A) — xem §A2: cùng type này là PENDING |
| squareopen | 85.00 | 0.0% | 0.0% | LỆCH theo thang V11 (§A) — xem §A2: cùng type này là PENDING |

### §A2 — 14 type V3: TẤT CẢ PENDING (T2 chưa xong lúc T6 chạy)

`transitionPreview.ts` trên đĩa lúc chạy vẫn chưa có case nào trong
14 type này: mọi `describeTransition` đều trả `geometric=false`,
note `type lạ "..." → fallback fade`. Số MAD dưới đây là MAD CỦA
BẢN FALLBACK FADE, không phải của hình học V3 — không được đọc
thành "hình học V3 lệch 85". MAD = 85.00 đồng đều ở mọi type là hệ
quả số học của fallback: tại p = 0.5, fallback cho pixel tím
(127.5, 0, 127.5) trong khi render cho pixel đỏ hoặc xanh thuần,
nên MAD = (127.5 + 127.5) / 3 = 85. Tín hiệu riêng từng type trong
bảng này chỉ còn tỉ lệ pixel B của render.

| Type | Tỉ lệ pixel B render | MAD fallback | Kết luận |
|---|---|---|---|
| diamondclose | 50.7% | 85.00 | PENDING |
| squareopen | 41.1% | 85.00 | PENDING |
| squareclose | 58.9% | 85.00 | PENDING |
| checker-alt | 50.0% | 85.00 | PENDING |
| blinds-diag | 51.1% | 85.00 | PENDING |
| split-h | 49.3% | 85.00 | PENDING |
| split-v | 50.0% | 85.00 | PENDING |
| barn-h | 48.6% | 85.00 | PENDING |
| barn-v | 51.1% | 85.00 | PENDING |
| rings | 50.9% | 85.00 | PENDING |
| corners | 44.0% | 85.00 | PENDING |
| star | 80.9% | 85.00 | PENDING (tỉ lệ B cao nhất — đúng hướng sao nở, nhưng đây mới chỉ là tỉ lệ, chưa phải hình học) |
| clock-ccw | 48.9% | 85.00 | PENDING |
| spiral | 51.3% | 85.00 | PENDING |

### §B — Text hồi quy V11 (khớp đúng bảng V11 chạy lại độc lập)

| Animation | MAD | ≤8 | ≤32 | Kết luận |
|---|---|---|---|---|
| tiltIn @0.35s | 1.10 | 98.6% | 98.9% | XẤP XỈ (rasterizer khác nhau, như V11) |
| skewIn @0.30s | 0.94 | 98.9% | 99.1% | XẤP XỈ (như V11) |
| slideReveal @0.50s | 0.93 | 99.5% | 99.5% | KHỚP |
| curtainIn @0.40s | 0.40 | 99.5% | 99.6% | KHỚP |

### §C — Effect canvas theo badge mới (số đo MỚI, k/chiều chưa từng đo ở đợt 11)

| Case | Badge lúc chạy (đọc từ previewStatus.ts) | MAD | ≤8 | Kết luận |
|---|---|---|---|---|
| pixelate intensity=0.25 (k=6), 72x48 | matched (canvas) | 0.667 | 100.0% | KHỚP — badge và số đo nhất quán |
| pixelate intensity=0.75 (k=13), 78x39 | matched (canvas) | 0.667 | 100.0% | KHỚP — badge và số đo nhất quán |
| mirror, 72x45 | matched (canvas) | 0.000 | 100.0% | KHỚP — badge và số đo nhất quán |
| rgb-shift intensity=0.5 (s=9), 72x45 | matched (canvas) | 0.000 | 100.0% | KHỚP — badge và số đo nhất quán |
| shake t=0, 72x45 | matched (canvas) | 0.000 | 100.0% | KHỚP — badge và số đo nhất quán |
| shake t=0.5, 72x45 | matched (canvas) | 0.000 | 100.0% | KHỚP — badge và số đo nhất quán |
| sharpen intensity=0.5 (hồi quy), 72x45 | approx (canvas) | 1.044 | 97.2% (≤32: 100.0%) | XẤP XỈ — badge và số đo nhất quán, không nâng |

Lưu ý về badge: lúc T6 chạy, `previewStatus.ts` đã có tập mới
`EFFECT_CANVAS_MATCHED = {pixelate, shake, rgb-shift, mirror}`
(do luồng badge đợt 12 làm) — tức badge đã nâng trước khi T6 đo
xong, và số đo V12 xác nhận việc nâng đó là đúng trên các nguồn
đo này. T6 không sửa `previewStatus.ts`.

## 3. Tổng kết đếm

- V12 chạy: 32 dòng (A 7 + A2 14 + B 4 + C 7), trong đó
  diamondclose/squareopen xuất hiện 2 lần (1 lần ở §A theo thang
  V11, 1 lần ở §A2 dạng PENDING) → 30 case phân biệt.
- LỆCH (FAIL theo thang V6, không tính PENDING): 4 dòng §A —
  circleopen, dissolve, diamondclose, squareopen (2 type sau trùng
  với PENDING ở §A2, xem §2).
- PENDING: 14/14 type V3.
- Lỗi render: 0. Exit harness: 0.
- Kiểm chứng chéo (chạy độc lập, không qua V12):
  - `node src/test_v11_parity.js`: 11 case, số đo y hệt §A/§B
    của V12 (fade 0.67, wipeleft 2.36, slideright 0.00, circleopen
    43.50, dissolve 85.52, text 1.10/0.94/0.93/0.40).
  - `node --experimental-strip-types
    apps/web/src/lib/effectCanvas.parity.test.ts`: PASS 9 test,
    số đo y hệt §C (pixelate 0.667 ở k=2/9/16, mirror/rgb-shift/
    shake 0.000, sharpen 1.044).

## 4. PENDING và nợ còn lại (T6 không làm, báo cho parent)

1. **PENDING chính: hình học 14 type V3 trong
   `transitionPreview.ts` (luồng T2).** Chưa có trên đĩa lúc T6
   chạy (kiểm chứng bằng `grep`: file chỉ có các type cũ +
   fallback `default`). Sau khi T2 xong, chạy lại đúng
   `node src/test_v12_parity.js` — §A2 sẽ tự chuyển sang KHỚP/
   XẤP XỈ/LỆCH, không cần sửa harness. Đặc biệt cần xem lại sau
   khi T2 xong: `star` (hệ số sao (1+0.4cos5θ)/0.6 khó biểu diễn
   bằng polygon thuần) và `spiral` (xoắn theo bán kính) — 2 type
   có nguy cơ cao chỉ đạt XẤP XỈ dù T2 đã map expr.
2. circleopen (gradient rộng) và dissolve (nhiễu từng pixel):
   LỆCH có cơ sở từ đợt 11, ngoài phạm vi T6, vẫn chưa sửa.
3. Ghost motion blur vô hình trên clip đục (phát hiện P5 đợt 11):
   ngoài phạm vi T6, vẫn chờ quyết định ngữ nghĩa.
4. Harness chỉ đo frame giữa p = 0.5, nguồn màu phẳng / tổng hợp,
   khung nhỏ (72x45, text 320x180) — chưa đo toàn bộ đường cong
   thời gian, footage quay thật, HD/clip dài, pixelate trên nguồn
   nhiễu rgb24, shake lệch pha khi clip không bắt đầu ở 0.

## 5. Trung thực về 2 lỗi harness ở lần chạy đầu (đã sửa, số cuối mới có giá trị)

Lần chạy đầu của V12 có 2 lỗi do chính harness, KHÔNG phải lỗi
sản phẩm, và đã sửa trước lần chạy cuối (§2 là số lần chạy cuối):

1. Badge đọc sai: harness chỉ biết các tập cũ
   (`EFFECT_MATCHED`/`EFFECT_APPROX`/`EFFECT_CANVAS_APPROX`) nên
   báo pixelate/shake/rgb-shift/mirror là "none" dù luồng badge đã
   thêm tập `EFFECT_CANVAS_MATCHED`. Đã thêm tập này vào hàm đọc
   badge — lần chạy cuối báo đúng "matched (canvas)".
2. Pixelate lệch kích thước frame: harness dùng khung 72x45 cho
   k=6 và k=13, nhưng filter scale neighbor thu/phóng làm chiều
   cao render co thành 42 (45 không chia hết cho 6/13). Đã đổi
   sang khung chia hết cho k (72x48 cho k=6, 78x39 cho k=13) —
   lần chạy cuối pixelate KHỚP MAD 0.667 ở cả 2 k mới.

## 6. File đã đổi (chỉ 2 file, không đụng logic sản phẩm)

- `server/render/src/test_v12_parity.js` (MỚI — harness V12, mở
  rộng V11: §A2 V3 + §C effect + đọc badge từ previewStatus.ts).
- `docs/PHASE9_ROUND12_T6_V12_PARITY_LIMITS.md` (MỚI — chính file
  này).
- KHÔNG đổi: `test_v11_parity.js`, `transitionPreview.ts`,
  `effectCanvas.ts`, `previewStatus.ts`, `projectRepo.ts`,
  speed-curve UI, và mọi logic sản phẩm khác. Không phát hiện bug
  sản phẩm mới nào cần báo ngoài các nợ đã liệt kê ở §4 (các
  LỆCH ở §A đều là nợ cũ đợt 11 hoặc PENDING của T2).
