# PHASE9_ROUND17_N1_HARNESS_UNIFY — LIMITS (trung thực)

## Việc đã làm

Dời nốt 2 bản sao cuối về module dùng chung `server/render/src/harnessShared.js`:

- `rasterizeTransitionPreview(visual, w, h)` — composite preview A đỏ / B xanh,
  bản DUY NHẤT nay nằm ở `harnessShared.js`.
- `barsFadeIsBar(x, bandW, p)` + setter `setBarsFadeIsBar(fn)` — cùng quy ước
  `set*` như `setRadialWeight` / `setDissolveFrand` (đợt 16 H6).

3 harness `test_v11_parity.js`, `test_v12_parity.js`, `test_v14_parity.js` nay chỉ
`require` 2 hàm này; toàn bộ định nghĩa cục bộ cũ đã xóa, kèm comment trỏ về
module chung. Chỗ gán hàm thật đổi từ `barsFadeIsBarFn = tp.mod.barsFadePixelIsBar`
sang `setBarsFadeIsBar(tp.mod.barsFadePixelIsBar)` (1 chỗ mỗi file).

Phạm vi giữ đúng lệnh giao: CHỈ 4 file code trên + file LIMITS này. Không sửa
`test_v13`, không sửa code web, không sửa file của luồng khác.

## Căn cứ "ngữ nghĩa không đổi" (không phải khẳng định suông)

Trước khi dời, đã đọc từng dòng cả 3 bản `rasterizeTransitionPreview` và cả 3
bản `barsFadeIsBar`:

- Thứ tự 4 nhánh composite giống hệt nhau ở cả 3 file: radial-gradient →
  bars-fade → họ fade (không geometric) → geometric sequential-over.
- Cùng công thức từng nhánh: radial crossfade từng pixel qua `layerPixelAlpha`
  (chỉ số nguyên x, y); bars-fade dải → B thuần, nền → A\*(1-p)+B\*p tại chỉ số
  nguyên X; fade crossfade qua `layerCovers` tại tâm pixel (x+0.5, y+0.5);
  geometric over A rồi B; cùng `Math.round` cuối.
- `barsFadeIsBar` 3 bản giống hệt nhau, kể cả fallback
  `mod(X, bandW) < p*bandW` và guard `!(bandW > 0) || !(p > 0) → false`.
- Khác biệt duy nhất giữa 3 bản cũ là format/comment (V14 viết gọn 1 dòng),
  không có khác biệt tính toán nào.

Chứng minh bằng số đo (không chỉ đọc code): chạy cả 3 harness TRƯỚC và SAU
khi hợp nhất, diff toàn bộ log sau khi lược thời gian render (ms) và tên thư
mục tmp ngẫu nhiên → **3 log giống hệt nhau**.

## Số đo thật sau hợp nhất (chạy ngày 2026-10-28, máy này)

| Harness | Kết quả sau hợp nhất | Baseline trước hợp nhất | Cổng giao |
|---|---|---|---|
| V11 | 29 case, FAIL (LỆCH): không có; lỗi render: 0; exit 0 | giống hệt (trừ ms/tmp) | 29 case, FAIL 0 — ĐẠT |
| V12 | 37 case (A 12 + A2 V3 14 + B text 4 + C effect 7), FAIL: không có; PENDING V3: không có; lỗi render: 0; exit 0 | giống hệt (trừ ms/tmp) | 37 case, FAIL 0 — ĐẠT |
| V14 | KHỚP 21, XẤP XỈ 1, LỆCH 0, PENDING 0, STAT-APPROX 1, STRUCT-OK 1, STAT-LỆCH 0; lỗi render: 0; exit 0 | giống hệt (trừ ms/tmp) | KHỚP ≥20 / XẤP XỈ ≤2 / LỆCH 0 / PENDING 0 — ĐẠT |

`node --check` xanh cả 4 file. Không còn định nghĩa cục bộ nào của
`rasterizeTransitionPreview`, `barsFadeIsBar`, `barsFadeIsBarFn` trong 3 harness
(grep còn 0 kết quả; chỉ còn `barsFadePixelIsBar` là tên hàm của module
transitionPreview, và `setBarsFadeIsBar`).

## Case glitch V14 — ghi rõ, không dùng làm cổng chặn

Case `glitch t=0.5` (rgbashift + noise `allf=t`, nhiễu phụ thuộc thời gian) vẫn
STRUCT-OK như baseline, với cùng số đo: MAD từng frame 12.318 (chỉ tham khảo),
lệch vs shift-thuần TB 8.85 (kỳ vọng 7–13), std 11.24 (kỳ vọng 9–14). Vì nhiễu
theo thời gian nên MAD từng frame không ổn định theo thời gian và không được
dùng làm cổng chặn — cổng chặn của V14 là KHỚP/LỆCH/PENDING như bảng trên.

## Cái gì còn 2 bản / chưa hợp nhất (trung thực)

1. **Không còn bản sao thứ 2 của rasterizer transition.** Sau đợt này,
   `rasterizeTransitionPreview` + `barsFadeIsBar` + `radialWeight` +
   `regionCovers` + `layerPixelAlpha` + `layerCovers` + `pointInPolygon` chỉ
   còn 1 bản trong `harnessShared.js`.
2. **Còn riêng lẻ (ngoài phạm vi đợt này, cố tình không đụng):**
   - `rasterizeTextPreview` vẫn còn bản riêng ở V11 và V12 (đợt này chỉ giao
     rasterize *transition*). Chưa đối chiếu 2 bản text nên không claim chúng
     giống nhau.
   - `solidFrame`, `writeRaw`, `renderTransition*`, `transpileTs`,
     `loadTransitionPreview` và phần main của mỗi harness vẫn riêng theo từng
     harness (khác case, khác khung W/H, khác phần effect/text) — đó là logic
     riêng của harness, không phải bản sao của nhau.
   - `regionKinds` ở V14 được giữ nguyên (còn dùng tại 2 chỗ trong V14); nó
     không phải bản sao của hàm nào ở V11/V12.
3. **Khác biệt rasterizer còn lại (nếu tính cả text):** xem mục 2 — text
   rasterizer chưa hợp nhất, chưa đo; mọi claim "hợp nhất xong" trong file này
   chỉ áp dụng cho rasterizer *transition*.

## Giới hạn đo

- Số đo chỉ đúng trên máy chạy (ffmpeg local, khung 72x45 của harness) và tại
  thời điểm chạy; thời gian render từng case dao động giữa 2 lần chạy (đã lược
  khi diff) nhưng MAD, tỉ lệ pixel B và verdict không đổi.
- Chỉ kiểm chứng 3 harness V11/V12/V14. Không chạy V13 (ngoài phạm vi, không
  sửa) và không chạy tsc/vite build (đợt này không đụng code web/TS).
- Việc dời code không đổi hành vi render thật (ffmpeg) — chỉ đổi nơi định nghĩa
  hàm preview; bằng chứng là log trước/sau giống hệt nhau.
