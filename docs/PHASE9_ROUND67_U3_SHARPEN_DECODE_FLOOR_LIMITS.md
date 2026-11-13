# PHASE 9 ĐỢT 67 — LUỒNG U3: TÁCH SÀN DECODE KHỎI ESTIMATOR KHI ĐO SHARPEN HEADED

**Ngày:** 08/11/2026 · **Nợ đóng:** đợt 66 §8 mục 3 (`docs/PHASE9_ROUND66_LIMITS.md`,
`docs/PHASE9_ROUND66_T4_SHARPEN_CHROMA_LIMITS.md` §7–§8): sharpen HYB4 full-res
pre-encode KHỚP 8/8 nhưng headed vẫn XẤP XỈ (le8 tốt nhất 98,5%) do sàn decode
Chrome-vs-ffmpeg (plain 1,165 MAD ngay cả khi không resample), nhánh direct bị nghi
khuếch đại sàn đó.
**Kết quả tóm tắt: sharpen headed thực chất KHỚP — hiệu ứng là chính xác từng pixel
trong chính decoder của preview.** Chứng cứ quyết định (GĐ C, cửa sổ scale đúng 1,0,
không resample): áp production `applySharpen` lên screenshot plain của preview rồi
so với screenshot sharp của preview cho **MAD = 0,000, le8 = 100,00% trên cả 4 cảnh,
cả 2 mức** — tức preview chạy đúng code production, không có lỗi effect nào trong
decoder Chrome. Mọi lệch headed còn lại đều là sàn decode (Chrome-vs-ffmpeg) lan
qua blur sharpen. Trên số trừ sàn theo lân cận: testsrc2 + slovenska KHỚP-trừ-sàn
mọi cỡ/mức; basgo KHỚP trừ sharp10 ở w1440/1:1; ocean XẤP XỈ ở sharp10 (texture
cao tần, sàn plain tới 2,45 MAD). Biến thể S7/BLEND8 đều không thắng HYB4 — giữ HYB4,
không đổi code production.

Tiêu chí: KHỚP = MAD ≤ 2 và ≥ 99% pixel lệch ≤ 8 (le8); XẤP XỈ = MAD ≤ 20 và
≥ 90% pixel lệch ≤ 32. KHỚP-trừ-sàn = le8_net_nb ≤ 1% và mad_net_quad ≤ 2
(le8_net_nb: tỉ lệ pixel có lỗi delta thấy được (>8) mà sàn lân cận 3×3 mẫu
cũng ≤ 8 — xem §1). Mọi số dưới đây đều đo thật; probe/log/JSON tại
`hidden_files/round67-u3/` (compare/, within-decoder/, within-decoder-exact/, logs/).

---

## 1. Harness mới: tách sàn decode khỏi effect (GĐ A)

`apps/web/scripts/parity-67u3-compare.mjs` — so snapshot preview headed với frame
render pre-encode (đích preencode/bilinear là chính, lanczos đối chứng), thêm:

- **floor F**: plain preview↔render MAD/le8/le32 (như cũ).
- **delta thô D**: |Δp−Δr| MAD/le8 (như cũ).
- **le8_net**: tỉ lệ pixel có |Δp−Δr|_max > 8 VÀ |Pp−Pr|_max ≤ 8 (lỗi thấy được
  mà sàn local không giải thích).
- **le8_net_nb**: như le8_net nhưng sàn lấy max trên vùng lân cận 3×3 mẫu
  (≈ ±4px, phủ support blur 5px của sharpen) — vì delta sharpen phụ thuộc cả
  vùng lân cận, sàn local tại đúng pixel là chưa đủ. Đây là chỉ số chính cho
  verdict trừ sàn.
- **mad_net_quad** = sqrt(max(0, MAD_delta² − MAD_floor²)) — ước lượng bậc hai,
  giả định độc lập (thường = 0 vì MAD_delta < MAD_floor — tức lỗi delta nằm
  gọn trong độ lớn sàn; không dùng một mình để kết luận).
- **mad_clean** = MAD |Δp−Δr| chỉ trên pixel có floor ≤ 8.
- **Phân rã theo nhánh**: mask direct = pixel có ≥1 kênh excess_est > 4, tính
  từ frame render plain bằng đúng estimator HYB4 (sao chép verbatim từ
  `effectCanvas.ts`). Cùng mask dùng cho cả HYB4 lẫn S7.

**Giới hạn của metric trừ sàn (trung thực, xem §5):** le8_net_nb điều kiện trên
ĐỘ LỚN của sàn (|D| ≤ 8), nhưng delta sharpen đáp ứng với THÀNH PHẦN CAO TẦN
của sàn (D − blur(D)): D dao động ±8 thì blur(D)≈0, delta error ≈ amount×8 ≈ 16
> 8 dù sàn local/lân cận ≤ 8. Trên texture cao tần metric này UNDER-correct —
phần dư 1–5% ở ocean/basgo chưa chắc là lỗi effect. Vì vậy GĐ C (within-decoder
exact) mới là chứng cứ quyết định, metric trừ sàn chỉ là cận trên bảo thủ.

---

## 2. Kết quả trừ sàn trên snaps cũ: testsrc2 HYB4 vs S7 (GĐ A)

Tái phân tích snaps đợt 66 T4 (HYB4, 4 cỡ) và đợt 65 S7 (3 cỡ, không có 1:1),
cùng render reference preencode (unsharp — giống nhau cho cả hai vì khác biệt
S7/HYB4 chỉ ở phía preview).

| Cỡ | floor MAD/le8 | HYB4 sharp05 le8_net_nb | HYB4 sharp10 le8_net_nb | S7 sharp05 le8_net_nb | S7 sharp10 le8_net_nb |
|---|---|---|---|---|---|
| w1440 | 1,228 / 96,0% | **0,01%** | **0,11%** | 0,05% | 0,63% |
| w1920 | 1,041 / 96,8% | **0,02%** | **0,09%** | 0,07% | 0,64% |
| w2560 | 1,052 / 97,1% | **0,46%** | **0,33%** | 0,46% | 0,97% |
| 1:1 | 1,165 / 96,1% | **0,07%** | **0,12%** | — (không đo) | — |

- **HYB4 KHỚP-trừ-sàn cả 4 cỡ, cả 2 mức** (0,01–0,46%, dưới ngưỡng 1% với biên tốt).
- **S7 cũng KHỚP-trừ-sàn** theo metric lân cận (0,05–0,97%), nhưng sharp10 sát
  nút (0,63–0,97%); với le8_net local (không lân cận) S7 sharp10 là 1,24–1,56%
  → XẤP XỈ-trừ-sàn, còn HYB4 là 0,39–0,81% → KHỚP.
- **HYB4 thắng S7 rõ trên số đã trừ sàn ở sharp10**: 0,09–0,33% vs 0,63–0,97%
  (gấp 2–7×). Ở sharp05 hai bên ngang nhau (0,01–0,46%).
- mad_clean: HYB4 0,51–0,61 vs S7 0,13–0,25 — trên pixel sàn sạch, delta MAD
  của S7 NHỎ hơn HYB4 (delta-add triệt tiêu sàn trong phép trừ, direct mang
  sàn vào delta). Nhưng le8 (lỗi thấy được) mới quyết định verdict, và ở đó
  HYB4 thắng — vì lỗi của S7 tập trung ở biên bão hoà (xem §3).

---

## 3. Phân rã nhánh: giả thuyết "direct khuếch đại sàn" KHÔNG đứng như đã nghĩ

Mask per-pixel từ frame render cho direct ~95% pixel testsrc2 (53,6% KÊNH
direct → 95% pixel có ≥1 kênh direct), 0% slovenska/basgo, ~18% ocean.
Nhưng tập "add" còn lại (~4% pixel testsrc2) có deltaMadMax 6–10 (gấp ~5× tập
direct) Ở CẢ S7 (không có nhánh direct!) lẫn HYB4. Chẩn đoán
(`r67u3-diag-add-pixels.mjs`): các pixel này nằm đúng trên biên bão hoà sắc
nét của testsrc2 — vd (12,9) plain [255,133,4], dp G/B +40/+39 vs dr +26/+22;
(107,8) S7 dp R +5 vs dr +54. Cơ chế: mask tính từ decode ffmpeg gán sai nhánh
so với decode Chrome tại đúng pixel biên (hai decode lệch pha biên), và blur
sharpen khuếch đại lệch lân cận. **Kết luận: không dùng phân rã nhánh per-pixel
từ render để kết luận direct khuếch đại sàn** — mask sai ngay tại nơi cần đo.
Số phân rã vẫn giữ trong report JSON để đối chứng, không dùng làm chứng cứ chính.
Hướng đúng là within-decoder exact (§4), nơi nhánh không còn là biến số.

---

## 4. Headed 12 lượt: 3 cảnh tự nhiên × 4 cỡ (GĐ B)

Harness mới `apps/web/scripts/parity-67u3-sharpen-floor-headed.mjs` (bản sao T4,
tham số hoá content; cửa sổ 1:1 = 1850×1400, suy ra từ canvas 1281×775 của T4
qua công thức canvas = (WIN_W−569)×(WIN_H−625)). Footage tải lại từ Wikimedia
Commons (do `~/.scratch-r64r4/` đã mất): slovenska CC BY 3.0 (vp9 1080p 54s),
basgo CC BY 3.0 (vp8 1080p 26s), ocean CC0 (theora 1080p 6,4s); transcode về
1280×720 H.264 mp4 CRF18 để proxy=false (theora Chrome không chơi được; cùng
file mp4 làm input cả preview lẫn render nên so sánh tự nhất). Driver
`run-headed-12.sh` chạy tuần tự, compare ngay sau mỗi lượt.

**Tất cả 12 lượt: 7/7 pass, 0 lỗi trang, proxy=false.** Bảng tổng hợp
(đích preencode/bilinear; KHỚP-trừ-sàn ⇔ le8_net_nb ≤ 1%):

| Cảnh | Cỡ | floor MAD/le8 | sharp05 delta le8 → le8_net_nb | sharp10 delta le8 → le8_net_nb |
|---|---|---|---|---|
| slovenska | w1440 | 0,729 / 100,0% | 100,0% → **0,00% KHỚP** | 99,9% → **0,12% KHỚP** |
| slovenska | w1920 | 0,475 / 100,0% | 100,0% → **0,00% KHỚP** | 99,9% → **0,06% KHỚP** |
| slovenska | w2560 | 0,354 / 100,0% | 100,0% → **0,00% KHỚP** | 100,0% → **0,02% KHỚP** |
| slovenska | 1:1 | 0,414 / 100,0% | 100,0% → **0,00% KHỚP** | 100,0% → **0,04% KHỚP** |
| basgo | w1440 | 1,466 / 98,9% | 98,9% → **0,62% KHỚP** | 96,2% → 2,29% XẤP XỈ |
| basgo | w1920 | 1,331 / 98,4% | 99,7% → **0,07% KHỚP** | 98,2% → **0,56% KHỚP** |
| basgo | w2560 | 0,720 / 99,9% | 99,8% → **0,15% KHỚP** | 99,3% → **0,63% KHỚP** |
| basgo | 1:1 | 0,819 / 99,6% | 99,5% → **0,38% KHỚP** | 98,3% → 1,40% XẤP XỈ |
| ocean | w1440 | 2,364 / 92,7% | 92,5% → **0,44% KHỚP** | 84,8% → 2,15% XẤP XỈ |
| ocean | w1920 | 2,448 / 92,2% | 95,5% → **0,20% KHỚP** | 88,5% → 1,09% XẤP XỈ |
| ocean | w2560 | 1,281 / 99,5% | 97,4% → 1,88% XẤP XỈ | 93,9% → 4,89% XẤP XỈ |
| ocean | 1:1 | 1,749 / 96,2% | 94,2% → 1,64% XẤP XỈ | 88,2% → 4,75% XẤP XỈ |

- **slovenska: KHỚP THÔ luôn** ở cả 4 cỡ, cả 2 mức (le8 99,9–100%), không cần trừ sàn.
- **basgo: KHỚP-trừ-sàn** trừ sharp10 ở w1440 (2,29%) và 1:1 (1,40%).
- **ocean: chỉ sharp05 w1440/w1920 KHỚP-trừ-sàn**; còn lại XẤP XỈ (1,09–4,89%).
  Sàn plain của ocean rất lớn (MAD 1,28–2,45, le8 chỉ 92–99,5%) — sóng biển là
  texture cao tần, nơi decode Chrome-vs-ffmpeg lệch mạnh nhất (DCT ringing).
- Sàn plain giảm khi viewport lớn hơn (ít downscale hơn): slovenska
  0,729→0,354; basgo 1,466→0,720; nhưng ocean không đơn điệu
  (2,448 ở w1920 > 1,281 ở w2560) — sàn decode phụ thuộc nội dung nhiều hơn scale.

---

## 5. Within-decoder: chứng cứ quyết định (GĐ C)

Phương pháp: screenshot PNG full-res của preview ở 1:1 (canvas.toDataURL —
trực tiếp bitmap canvas, tránh Page.captureScreenshot đọc khung composite bị
lag: lần chạy đầu captureScreenshot cho 4 shot đen md5 giống hệt nhau, đã bỏ),
áp production `applySharpen` lên screenshot plain trong Node, so với screenshot
sharp. Cả hai vế dùng CÙNG một decode (Chrome) nên sàn decode triệt tiêu hoàn toàn.

### 5.1 Lần 1: cửa sổ 1850×1400 (scale 1,0008) — vẫn còn nhiễu scale

(A) within-Chrome MAD 0,312–1,895 (testsrc2 0,312/0,445; slovenska 0,507/0,708;
basgo 1,002/1,341; ocean 1,247/1,895). (B) within-ffmpeg (đối chứng) MAD
0,071–0,598, KHỚP hết. Control (A0) scale-confound (cùng decode ffmpeg,
sharpen chạy ở lưới 1281 trên input upscale): MAD 0,219–1,031 — giải thích
được phần lớn (A) nhưng không hết (ocean sharp10: (A) 1,895 vs (A0) 1,031).
Nghi ngờ: Chrome drawImage upscale 1280→1281 dùng filter khác ffmpeg bilinear
nên (A0) đánh giá thấp nhiễu scale. Cần loại bỏ scale hoàn toàn (§5.2).

### 5.2 Lần 2: cửa sổ 1849×1345 (scale ĐÚNG 1,0) — KHỚP TUYỆT ĐỐI

Canvas bitmap đúng 1280×720, rect scale=1, không resample nào giữa effect
canvas và screenshot. Kết quả **(A') MAD = 0,000, le8 = 100,00% trên cả 4 cảnh,
cả 2 mức** — preview chạy đúng `applySharpen` production, từng pixel:

| Cảnh | (A') within-Chrome 05 / 10 | (B) within-ffmpeg 05 / 10 | (C) cross Node→render 05 / 10 | floor exact 1:1 |
|---|---|---|---|---|
| testsrc2 | **0,000 / 0,000** | 0,071 / 0,094 | 0,547 / 0,545 KHỚP | 0,934 / 99,90% KHỚP |
| slovenska | **0,000 / 0,000** | 0,366 / 0,581 | 1,058 / 1,001 KHỚP | 0,819 / 100% KHỚP |
| basgo | **0,000 / 0,000** | 0,597 / 0,740 | 1,377 / 1,110 KHỚP | 0,971 / 100% KHỚP |
| ocean | **0,000 / 0,000** | 0,442 / 0,598 | 2,420 / 2,160 XẤP XỈ | 2,152 / 99,96% XẤP XỈ |

- **(A') = 0,000 là bằng chứng dứt khoát: không có lỗi effect nào trong decoder
  Chrome.** Mọi lệch headed còn lại (kể cả phần dư 1–5% của metric trừ sàn ở
  ocean/basgo) đều là sàn decode lan qua blur sharpen — không phải lỗi sharpen.
- (C) cross (Node-sharpen từ plain shot vs render sharp) = tổng "effect + decode":
  KHỚP trên testsrc2/slovenska/basgo, XẤP XỈ chỉ trên ocean (MAD 2,16–2,42,
  le8 vẫn 99,65–99,76%) — và vì (A')=0 và (B) KHỚP, phần XẤP XỈ này là 100%
  sàn decode, không phải effect.
- Bài học harness: cửa sổ 1:1 cũ (1850×1400, scale 1,0008) vẫn chèn nhiễu
  resample MAD 0,3–1,9 vào phép đo within-decoder; muốn đo thuần effect phải
  dùng cửa sổ scale đúng 1,0 (1849×1345 cho layout này).

---

## 6. Biến thể: không biến thể nào thắng HYB4 (GĐ D)

Thử offline trên screenshot 1:1 (decode Chrome) → so với render sharp
(đích đúng) và sharp shot. Đối chứng: bản viết lại HYB4 trong script cho
MAD = 0,000 so với production `applySharpen` (khớp từng bit).

| Cảnh | Mức | HYB4 vs render | S7 vs render | BLEND8 vs render |
|---|---|---|---|---|
| testsrc2 | 05 | **0,695 / 96,36%** | 1,124 / 96,01% | 0,698 / 96,34% |
| testsrc2 | 10 | **0,749 / 95,85%** | 1,187 / 95,31% | 0,753 / 95,91% |
| slovenska | 05/10 | 0,599 / 0,846 | 0,599 / 0,846 (y hệt) | 0,599 / 0,846 (y hệt) |
| basgo | 05/10 | 1,219 / 1,636 | 1,219 / 1,636 (y hệt) | 1,219 / 1,636 (y hệt) |
| ocean | 05 | 2,598 / 91,00% | 2,581 / 91,01% | 2,597 / 91,01% |
| ocean | 10 | 3,168 / 87,76% | 3,161 / 87,77% | 3,167 / 87,77% |

- testsrc2: HYB4 thắng S7 rõ (MAD thấp hơn ~40%); BLEND8 hoà HYB4 (xác nhận
  lại probe 2d đợt 66: switch cứng không phải nguyên nhân).
- slovenska/basgo: ba biến thể Y HỆT nhau (direct ≈ 0% — nhánh không có tác dụng).
- ocean: ba biến thể hoà nhau trong nhiễu (S7 hơn HYB4 0,007–0,017 MAD, không
  đáng kể; le8 bằng nhau tới 0,01%).
- **Kết luận: không ship biến thể nào. Giữ HYB4, không đổi code production.**
  Lý do sâu: preview không thể biết decode của render, nên không có cách nào
  trong effect làm giảm lệch do decode — chỉ có thể làm operator bớt nhạy với
  input, mà điều đó lại làm lệch khỏi render. Sửa đúng chỗ là ở harness đo
  (đã làm ở đây), không phải ở effect.

---

## 7. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Unit `effectCanvas.test.ts` | **PASS 15 test** (`node --experimental-strip-types`) |
| Parity `effectCanvas.parity.test.ts` | **PASS 15 test** |
| `npx tsc --noEmit` (apps/web) | **0 lỗi** |
| `npx vite build` (apps/web) | **pass** (29,02 s) |
| Headed GĐ B (3 cảnh × 4 cỡ) | **7/7 pass mỗi lượt, 12/12 lượt**, 0 lỗi trang, proxy=false |
| Within-decoder (scale 1,0008) | 1/1 pass × 4 cảnh (sau khi sửa shot đen, xem §8) |
| Within-decoder exact (scale 1,0) | 1/1 pass × 4 cảnh, (A') MAD 0,000 cả 8 ô |
| Variant test (GĐ D) | đối chứng HYB4 MAD 0,000; không biến thể nào thắng |

Không đổi code production trong luồng này (chỉ thêm harness/script đo + LIMITS),
nên unit/parity/tsc/build chỉ là kiểm chứng cây vẫn xanh.

---

## 8. Sự cố trong lúc chạy (đã xử lý)

1. **Footage thật đã mất:** `~/.scratch-r64r4/` không còn trên đĩa. Tải lại 3 file
   từ Wikimedia Commons qua API imageinfo (verify license CC0/CC BY 3.0), lưu
   tại `hidden_files/round67-u3/media/` (chỉ dùng để đo, KHÔNG stage — binary).
2. **Screenshot đen do Page.captureScreenshot:** 4/12 shot đầu là ảnh đen md5
   giống hệt nhau (mean RGB [5,3, 7,2, 11,2]) — captureScreenshot đọc khung
   composite bị lag sau seek/patch. Đổi sang `canvas.toDataURL` trong trang
   (đọc trực tiếp bitmap canvas như getImageData) + kiểm tra mean>5, thử lại
   tối đa 3 lần. Chạy lại 4 cảnh đều sạch (mean 87–161, md5 duy nhất).
   Lưu ý cho harness sau: đừng dùng Page.captureScreenshot để đo pixel canvas.
3. **So sánh variant bằng vitest sai runner:** `npx vitest run` báo "No test
   suite found" — file test của repo chạy bằng `node --experimental-strip-types`,
   không phải vitest. Chạy đúng cách: 15/15 + 15/15 xanh.
4. **Số (C) cross ở lần compare within-decoder đầu bị ghi đè** khi chạy lại bản
   hạ khổ 1280 — đã khôi phục bằng control (C0) trong `r67u3-scale-control.mjs`
   (số (C0) ≈ số (C) cũ, chênh do lưới so sánh; xem §5.1 + scale-control.json).
5. **Cửa sổ 1:1 cũ (scale 1,0008) vẫn chèn nhiễu resample** vào phép đo
   within-decoder (MAD 0,3–1,9) — đã chạy lại ở cửa sổ 1849×1345 (scale đúng
   1,0), cho (A') = 0,000 dứt khoát.

---

## 9. Nợ còn lại (trung thực)

1. **Headed sharpen theo metric thô vẫn XẤP XỈ** trên testsrc2 (le8 96,4–98,5%)
   và ocean (le8 84,8–95,5%): đó là sàn decode + resample của chuỗi đo, không
   phải lỗi effect — đã chứng minh bằng (A') = 0,000. Muốn số headed thô KHỚP
   thì phải thay đổi chuỗi đo (vd preview đọc frame YUV gốc thay vì RGB đã
   decode, hoặc render dùng cùng decoder với Chrome) — ngoài phạm vi luồng này.
2. **Metric le8_net_nb vẫn under-correct trên texture cao tần** (ocean sharp10
   1,09–4,89% dù effect đã chứng minh là chính xác): nó điều kiện trên độ lớn
   sàn, không phải thành phần cao tần của sàn. Cần metric trừ sàn theo cao tần
   (vd dự đoán delta error từ high-pass của trường sàn D) nếu muốn số trừ sàn
   khớp với (A') trên mọi cảnh.
3. **Headed noise vẫn LỆCH-THỐNG-KÊ** (nợ từ S7/đợt 66, code noise không đổi,
   không đo lại trong luồng này).
4. **Sàn plain ocean vẫn lớn** (MAD 1,28–2,45): decode H.264 của Chrome vs
   ffmpeg lệch mạnh trên texture sóng biển — là đặc tính của chuỗi đo, không
   phải bug sản phẩm; nhưng là trần đo cho mọi effect trên nội dung này.

## 10. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/parity-67u3-compare.mjs` — compare mới: metric trừ sàn
  (le8_net, le8_net_nb, mad_net_quad, mad_clean) + phân rã nhánh
- `apps/web/scripts/parity-67u3-sharpen-floor-headed.mjs` — harness headed mới
  (bản sao T4, tham số hoá content: testsrc2/slovenska/basgo/ocean)
- `apps/web/scripts/parity-67u3-within-decoder-headed.mjs` — harness screenshot
  within-decoder (toDataURL + mean check + retry; cửa sổ scale 1,0 = 1849×1345)
- `docs/PHASE9_ROUND67_U3_SHARPEN_DECODE_FLOOR_LIMITS.md` — file này

Chỉ dùng để đo, KHÔNG stage (binary / log / probe nội bộ): footage gốc +
transcode mp4 (`hidden_files/round67-u3/media/`), snaps + screenshot PNG +
report JSON + log (`hidden_files/round67-u3/headed/`, `within-decoder/`,
`within-decoder-exact/`, `compare/`, `logs/`), probe chẩn đoán + variant test
(`r67u3-diag-add-pixels.mjs`, `r67u3-within-decoder-compare.mjs`,
`r67u3-variant-test.mjs`, `r67u3-scale-control.mjs`, `run-headed-12.sh`).
