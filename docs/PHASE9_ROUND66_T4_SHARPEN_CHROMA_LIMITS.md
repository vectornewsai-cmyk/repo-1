# PHASE 9 ĐỢT 66 — LUỒNG T4: SHARPEN + CHROMA (HYB4)

**Ngày:** 08/11/2026 · **Nợ đóng:** đợt 65 S7 (`docs/PHASE9_ROUND65_LIMITS.md` §8 mục 3b,
`docs/PHASE9_ROUND65_S7_LIMITS.md` §7 mục 2–3): sharpen vẫn XẤP XỈ (le8 tốt nhất 98,3%)
+ kCb/kCr chưa kiểm trên nội dung tự nhiên thật.
**Kết quả tóm tắt:** sharpen giờ **KHỚP ở full-res pre-encode trên cả 4 cảnh đo, cả 2 mức**
(le8 99,7–100%, MAD 0,07–0,87); **kCb/kCr giữ nguyên 1,04/1,12 cho noise** — không cần
hiệu chỉnh theo nội dung. Headed viewport vẫn XẤP XỈ (le8 tốt nhất 98,5% vs S7 98,3%),
nhưng đã xác định được nguyên nhân là **sàn sai khác decode Chrome-vs-ffmpeg**
(~1,1 MAD, không phụ thuộc scale), không phải resample.

Tiêu chí: KHỚP = delta MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8 (le8); XẤP XỈ = MAD ≤ 20 và
≥ 90% pixel lệch ≤ 32. Noise KHỚP-THỐNG-KÊ: tỉ lệ std ∈ [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12. Mọi số dưới đây đều đo thật (probe trong
`hidden_files/round66-t4/r66t4-probe*.{mjs,json,log}`).

---

## 1. Vì sao estimator cũ lệch ở vùng bão hoà — và vì sao không sửa estimator

### 1.1 E1 (2-step gamut-offset, đang dùng) vẫn tốt nhất

Đo trên frame 30 testsrc2 (ground truth Y native từ `preencode-plain.yuv`, full frame,
thang Y 16–235). Probe 1:

| Estimator | mean\|err\| | signed | p99 | Ghi chú |
|---|---|---|---|---|
| E0 derived (Y từ RGB đã kẹp) | 2,677 | −0,816 | 4,93 | baseline |
| **E1 2-step gamut-offset (production)** | **0,996** | −0,981 | 1,82 | tốt nhất; \|err\|>2 chỉ 0,57% |
| E2 Newton tới fixed point | ~1,26e13 | — | — | **PHÂN KỲ thảm hại — bác bỏ** |
| E3 channel inversion (mean) | 1,193 | −1,028 | 3,19 | tệ hơn E1 |
| E4 channel inversion + clamp biên | 1,129 | −0,961 | 3,30 | tệ hơn E1 |
| E5 channel inversion (median) | 1,220 | −0,967 | 3,79 | tệ hơn E1 |
| E6 oracle chroma (chroma thật) | 1,265 | −1,265 | 1,88 | vẫn tệ hơn E1 |

Lý do E3–E5 thua: 94,8% pixel chỉ có 1 kênh trong gamut (873.785/921.600); sai số
ước lượng chroma (mean|err| Cb 1,939, Cr 1,231) truyền thẳng vào Y. E2 phân kỳ là
đúng lý thuyết: fixed point overshoot Y_native (offset = 0 tại biên gamut trong khi
Y_native thật có offset Δ > 0) và slope của map ~1 nên lặp không ổn định.

Độ chính xác của **delta-Y** (lượng thực sự lái sharpen, amount·(Y−blur(Y))):
E1 MAD 0,041 (amount 1,1) / 0,0745 (amount 2,0); E0 0,0825/0,15; E6-oracle 0,0255/0,0464.
Sai số Y_est chỉ giải thích ~30–40% residual của sharpen (0,041×1,164 ≈ 0,048 RGB
so với 0,161 đo được) — phần còn lại là **cơ chế áp delta**, không phải estimator.
→ Không cần estimator mới; cần sửa cách áp delta (§2).

### 1.2 Bias chuyển đổi −1,14: không phải lỗi estimator, không cần sửa

Probe 1b: Y_derived lệch hệ thống **−1,14 so với Y_native ngay cả khi 0 kênh kẹp**
(signed −1,136; theo kênh R −0,841, G −1,279, B −0,838). Đây là bias làm tròn/cắt
của phép chuyển yuv→rgb bằng số nguyên của FFmpeg (swscale), không phải lỗi estimator.
Bias là hằng số → triệt tiêu trong delta sharpen (S7b ≡ S7 trong probe 2).
Hệ quả sâu: render thực chất "thấy" Y ≈ Y_nat − 1, nên Y_est (≈ Y_nat − 1) mới là
base ĐÚNG cho không gian đầu ra của render — ORACLE dùng Y_nat thật đo tệ hơn
(MAD 0,378) so với S8o dùng Y_est + oracle chroma (0,212).

Swscale dùng upsampling chroma **nearest 2×2** (không phải bilinear) — xác nhận lại
S7 (tại biên chroma: nearest meanAbs [9,45, 1,51, 3,62] vs bilinear [20,92, 5,42, 12,82]).

---

## 2. Cơ chế lệch của sharpen S7 và thiết kế HYB4

S7 cộng delta vào RGB plain **đã kẹp** (255) trong khi render cộng delta vào base
native **chưa kẹp** (R0 ≈ 300) — sai số bằng đúng độ vượt gamut (tới ~20 mức) khi
ΔY đẩy vào trong tại kênh kẹp. S8r (direct từ R0_est) sửa được lỗi đó nhưng trả giá
sai số base do ước lượng chroma (~1–4) tại mọi pixel trong gamut.

**HYB4 (đã ship trong `applySharpen`, `apps/web/src/lib/effectCanvas.ts`):**
hybrid theo từng kênh, dùng một lumEst duy nhất (k sharpen 1,04/1,09):
- `excess_est = |R0_est − biên| > 4` → kênh kẹp: direct `out = clip(R0_est + ΔY_direct)`
  (ΔY_direct kẹp trên lumEst).
- Ngược lại → delta-add `out = clip(plain + ΔY_add)` như S7 (ΔY_add kẹp trên lumY).
- Ngưỡng 4 ≈ sai số base của direct (probe 2c: HYB4 tốt hơn HYB0 cả testsrc2 lẫn ocean).

**Hằng số mới:** `SHARPEN_CHROMA_K_CB = 1,04`, `SHARPEN_CHROMA_K_CR = 1,09`
(hồi quy tối ưu cho độ chính xác base của sharpen). Noise **giữ nguyên**
`NATIVE_CHROMA_K_CB/CR = 1,04/1,12` — không đổi (§3).

---

## 3. kCb/kCr trên nội dung tự nhiên thật — giữ nguyên, không hiệu chỉnh theo nội dung

Ba cảnh thật (`~/.scratch-r64r4/`): slovenska (phố, xe cộ, 38s), basgo (tu viện, 10s),
ocean (sóng biển, 3s), đều scale 1280×720, YUV native = đầu ra decoder. Probe 3:

| Cảnh | Hồi quy U (kCb) | Hồi quy V (kCr) | Độ bão hoà/khối | Khối high-sat |
|---|---|---|---|---|
| slovenska | 1,014 | 1,017 | 5,5 | 0,4% |
| basgo | 0,999 | 1,000 | 9,5 | 0,0% |
| ocean | 1,020 | 1,031 | 72,3 | 54,4% |
| **Pooled** | **1,010** | **1,024** | — | — |
| testsrc2 (đối chứng) | 1,042 | 1,092 | — | 31% mẫu rail |

Theo band (pooled): low ~1,00, mid ~1,04, high ~0,98 — không có phụ thuộc bão hoà
nhất quán. Hệ số testsrc2 (1,04/1,12) phản ánh độ bão hoà cực đoan của testsrc2
(31% mẫu rail), không phải nội dung tự nhiên.

**Noise k-grid trên slovenska** (kCb {1,00, 1,04} × kCr {1,00, 1,06, 1,09, 1,12, 1,15},
cả 2 mức): **cả 10 combo KHỚP y hệt** (noise05 tỉ lệ [0,99, 0,99, 1,01], Δkurt ~0,1;
noise10 tỉ lệ [1, 1, 1,01]). Xác nhận trên basgo/ocean (k tốt-nhất-slovenska và k hiện
tại, seed 42+43, cả 2 mức — đều KHỚP; vd ocean noise10 k hiện tại tỉ lệ [0,98, 1, 1],
Δkurt ≤ 0,19).

**Kết luận:** giữ kCb=1,04/kCr=1,12 cho noise — trên nội dung tự nhiên thống kê noise
không nhạy với k trong [1,00, 1,15], và trên nội dung bão hoà 1,12 mới là giá trị
làm KHỚP. Không cần hiệu chỉnh theo nội dung. Y_est trên nội dung tự nhiên: bias
−1,1 không phụ thuộc nội dung (slovenska mean|e| 1,109; basgo 1,169; ocean 0,952 —
chỉ cải thiện so với derived tại vùng bão hoà).

---

## 4. Số đo sharpen full-res pre-encode (delta MAD / le8)

### 4.1 Production thật (probe 4, import `applySharpen` thật) — **KHỚP hết**

| Cảnh | sharp05 | sharp10 |
|---|---|---|
| testsrc2 | 0,070 / 99,8% | 0,095 / 99,7% |
| slovenska | 0,481 / 100,0% | 0,660 / 100,0% |
| basgo | 0,643 / 100,0% | 0,787 / 100,0% |
| ocean | 0,392 / 100,0% | 0,583 / 99,9% |

### 4.2 Chuỗi probe (testsrc2, để thấy HYB4 từ đâu mà ra)

| Biến thể | sharp05 | sharp10 |
|---|---|---|
| S7 (cũ) | 0,182 / 98,3% | 0,235 / 97,4% |
| S8r direct k=1,04/1,09 | 0,355 / 99,4% | 0,366 / 99,3% |
| HYB (switch cứng, margin 0) | 0,075 / 99,8% | 0,104 / 99,7% |
| **HYB4 (margin 4, đã ship)** | **0,074 / 99,9%** | **0,103 / 99,8%** |
| S8o (oracle chroma) | 0,212 / 100,0% | 0,231 / 100,0% |
| ORACLE (Y_nat + chroma native) | 0,378 / 100,0% | 0,358 / 100,0% |

HYB0 trên ocean chỉ le8 99,4% (S7 100%) — HYB4 sửa được (100,0%/100,0%, tốt hơn
cả S7: 0,563/0,699 vs 0,586/0,734). Tỉ lệ kênh direct: testsrc2 53,6%, slovenska
1,4%, basgo 0,0%, ocean 12,5%.

### 4.3 Probe 2d — BLEND và HYB4S đều không thắng HYB4 (giữ HYB4)

Sau khi headed cho thấy delta MAD tệ hơn S7 (§5), đã thử 2 hướng sửa:
- **BLEND8** (w = clamp(excess/8, 0, 1)) và **BLEND12** (ramp 2→12): ≈ HYB4 ở mọi
  nơi (chênh ≤ 0,004 MAD, full-res lẫn mô phỏng viewport). Switch cứng không phải
  nguyên nhân — tại biên switch hai nhánh chỉ chênh ~excess (≤ 4–5 mức). **Không đổi.**
- **HYB4S** (nội suy bilinear est chroma về từng pixel cho nhánh direct): **tệ hơn
  rõ** (testsrc2 full-res 0,147/98,2% vs HYB4 0,074/99,9% — rớt về XẤP XỈ).
  → Est chroma theo khối 2×2 là đúng mô hình (render chroma subsample nearest 2×2,
  §1.2); làm mịn nó là sai. **Bác bỏ.**

Mô phỏng viewport bằng scaler ffmpeg (preview lanczos/render bilinear và ngược lại,
cùng input lossless): HYB4 THẮNG S7 ở mọi cỡ (vd testsrc2 w2560 sharp05 0,234/99,1%
vs S7 0,29/98,4%) — mâu thuẫn với headed thật → nguyên nhân nằm ở decode (§5.2).

Probe 2e (kiểm decode bằng CRF20 vs lossless) **vô hiệu**: pre-encode YUV vốn là
decode của mp4 nên hai plain đồng nhất (MAD = 0) — không kiểm được gì. Ghi lại để
khỏi làm lại.

---

## 5. Headed viewport (Chromium headed qua Xvfb + CDP, vite dev)

Harness mới: `apps/web/scripts/parity-66t4-sharpen-chroma-headed.mjs` +
`parity-66t4-compare.mjs` (bản sao harness đợt 65 S7, đổi round; media + render
reference tái dùng từ round65-s7). Chạy 4 cỡ cửa sổ; mỗi cỡ 7/7 pass (C1 xác định,
C2/C3 sharpen đổi pixel + đơn điệu, C4/C4b/C5 noise đổi pixel + xác định + đơn điệu,
H9 0 lỗi trang), proxy=false.

### 5.1 Sharpen DELTA, đích pre-encode/bilinear (so với S7)

| Cửa sổ | S7 sharp05 | HYB4 sharp05 | S7 sharp10 | HYB4 sharp10 |
|---|---|---|---|---|
| w1440 (489×275) | 0,419 / 97,3% | 0,746 / 97,9% | 0,631 / 95,5% | 0,922 / 96,4% |
| w1920 (809×455) | 0,336 / 98,2% | 0,688 / 98,5% | 0,522 / 96,7% | 0,842 / 97,6% |
| w2560 (1733×975) | 0,319 / 98,3% | 0,715 / 97,8% | 0,454 / 97,2% | 0,827 / 97,5% |
| **1:1 (1281×721)** | — | **0,721 / 98,3%** | — | **0,832 / 97,0%** |

**Headed sharpen vẫn XẤP XỈ** (le8 tốt nhất 98,5% < 99%) — chưa KHỚP ở viewport.
Nhưng le8 tốt nhất cải thiện so với S7 (98,5% vs 98,3%), và le8 cải thiện ở w1440/w1920
cả 2 mức; chỉ w2560 sharp05 hơi tệ hơn (97,8% vs 98,3%).

### 5.2 Nguyên nhân delta MAD headed tệ hơn: sàn decode, không phải resample

- **Sàn plain (preview↔render, không effect): MAD 1,04–1,23, le8 94,3–97,1% ở cả 4 cỡ**
  — gần như không phụ thuộc scale. Ở 1:1 (scale 1,0008, gần như không resample) sàn
  vẫn 1,165/96,1%. → Sàn headed là **sai khác decode Chrome-vs-ffmpeg** (H.264
  decode + YUV→RGB khác nhau, tập trung tại biên bão hoà), không phải resample.
- **HYB4 delta MAD ~0,69–0,75 ở mọi cỡ, kể cả 1:1** — không phụ thuộc scale →
  nhánh direct khuếch đại sai khác decode: tại pixel biên bão hoà, decode hai bên
  lệch tới 10–30 mức (DCT ringing/deblock khác nhau); nhánh direct mang nguyên
  độ lệch đó vào đầu ra, còn delta-add của S7 triệt tiêu nó trong phép trừ delta.
  S7 thì MAD giảm theo scale (0,419→0,319) vì lỗi của nó do resample.
- **Đánh giá:** MAD headed 0,72 < sàn plain 1,17 → dưới ngưỡng thấy được của chính
  chuỗi đo. le8 (tỉ lệ lỗi > 8, tức lỗi thấy được) của HYB4 tốt hơn S7 ở 5/6 cặp
  so sánh. Giữ HYB4 là đúng; muốn headed KHỚP phải tách được decode khỏi effect
  (vd preview đọc frame YUV gốc thay vì RGB đã decode) — ngoài phạm vi luồng này,
  ghi làm nợ mở (§7).

### 5.3 Noise headed: vẫn LỆCH-THỐNG-KÊ (nợ cũ, không phải do luồng này)

Code noise không đổi trong đợt này; số headed y hệt S7 (vd w1440 noise05 tỉ lệ std
[1,9, 1,33, 1,77], Δkurt [5,50, 0,31, 2,91] → LỆCH-THỐNG-KÊ; w2560 noise05 lanczos
tỉ lệ [0,98, 0,8, 1,0] nhưng Δkurt vẫn lệch). Nguyên nhân đã biết từ S7: viewport
resample + decode làm méo thống kê nhiễu cao tần. Parity test Node vẫn xanh (§6).

---

## 6. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Unit `effectCanvas.test.ts` | **PASS 15 test** (14 cũ + 1 mới: sharpen không lệch vùng phẳng bão hoà — đỏ/xanh/vàng/trắng 16×16, độ lệch tối đa **0**) |
| Parity `effectCanvas.parity.test.ts` | **PASS 15 test**; sharpen pattern t=0,5 MAD 0,521/le8 99,4%, t=1 MAD 0,586/le8 99,4% (KHỚP); noise tỉ lệ [1,01, 1,00, 1,00] / [1,01, 1,01, 1,01] (KHỚP, không đổi) |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** |
| `npx vite build` (apps/web) | **pass** (56,39 s) |
| Headed (4 cỡ: w1440/w1920/w2560/1:1) | **7/7 pass mỗi cỡ**, 0 lỗi trang |
| Probe 1/1b/2/2b/2c/3/4/2d/2e | xem §1–§5; JSON + log trong `hidden_files/round66-t4/` |

---

## 7. Nợ còn lại (trung thực)

1. **Headed sharpen vẫn XẤP XỈ** (le8 tốt nhất 98,5%): do sàn sai khác decode
   Chrome-vs-ffmpeg (~1,1 MAD) mà nhánh direct khuếch đại. Full-res đã KHỚP.
   Hướng sau: tách decode khỏi effect trong harness (preview đọc YUV gốc), hoặc
   chấp nhận sàn này và dùng le8 làm chỉ số chính ở viewport.
2. **Headed noise vẫn LỆCH-THỐNG-KÊ** (nợ từ S7, code noise không đổi): resample +
   decode méo thống kê nhiễu cao tần. Cần harness đo noise ở 1:1 không resample
   hoặc so thống kê trên miền tần số.
3. Y_est bias signed −1 là bias chuyển đổi của FFmpeg (§1.2), không phải lỗi —
   không cần sửa; sửa sẽ làm tệ đi (ORACLE đo tệ hơn).
4. Whip-pan / GPU / các nợ đợt 65 khác thuộc luồng khác, không làm ở đây.

## 8. File thay đổi (stage, KHÔNG push)

- `apps/web/src/lib/effectCanvas.ts` — HYB4 + hằng số `SHARPEN_CHROMA_K_CB/CR`
- `apps/web/src/lib/effectCanvas.test.ts` — 1 unit test mới
- `apps/web/scripts/parity-66t4-sharpen-chroma-headed.mjs` — harness headed (bản sao S7)
- `apps/web/scripts/parity-66t4-compare.mjs` — compare (bản sao S7)
- `docs/PHASE9_ROUND66_T4_SHARPEN_CHROMA_LIMITS.md` — file này

Footage thật (`slovenska.webm`, `basgo.webm`, `ocean06.ogv` — CC BY/CC0, Wikimedia)
chỉ dùng để đo, không stage. File render tạm trong `/tmp` đã dọn (còn 4 KB config
vite của harness tại `/tmp/round66-t4`).
