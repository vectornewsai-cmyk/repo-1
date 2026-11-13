# Phase 9 đợt 83, luồng K6 — Lineart aliasing: 5 hướng mới đều KHÔNG thắng baseline

- **Luồng:** K6, đợt 83 (nợ J7 đợt 82 §4.6 — mục 6 trong 12 nợ mở của đợt 82).
- **Ngày:** 11/11/2026 (lượt cron 00:35 +07). Repo local `~/workspace/repo-1`, HEAD GitHub `5f548ef8`. **CHỈ stage, KHÔNG push.**
- **Kết luận ngắn: KHÔNG CÓ HƯỚNG MỚI NÀO CÓ BẰNG CHỨNG. Không sửa production.**
  Đã thử 5 hướng chưa từng thử (D1 gain-fit sharpen-sau-upscale, D2
  pre-softening nhỏ, D3 render vector ở viewport-size crisp + area-coverage,
  D4 dither Bayer, D5 sharpen ở thang trung gian) trên 6 dataset lineart +
  3 control, tổng ~150 phép đo MAD. **Không hướng nào thắng baseline
  (sharpen-trước-upscale, tri) trên bất kỳ dataset lineart nào** — tốt nhất
  (D4 A1) chỉ "cải thiện" 0,01–0,06 MAD (0,2–2,4%), trong nhiễu đo ±0,05
  và chứng minh được là KHÔNG phải do dither (xem §5). Baseline vẫn là mô
  hình tốt nhất; nó chỉ giải thích ~10–15% độ lớn của delta preview Chrome
  trên lineart — 85–90% còn lại vẫn chưa có mô hình nào giải thích được.
  **Giữ nguyên, tác động toàn cục ≤1,2 nên không đổi verdict** (bound J7 E6
  giữ nguyên).

## 1. Câu hỏi và phương pháp

J7 đã loại kernel, pha, sharpen-sau toàn lượng, decode-mềm (blur mạnh),
supersample 2×. Luồng này thử các hướng còn lại mà J7 chưa đụng tới, dùng
lại snaps headed + frame render của G5 (đợt 79) / H3 (đợt 80) / J7 (đợt 82)
— **KHÔNG capture headed mới**. Script mới duy nhất:
`apps/web/scripts/r83k6-lineart-new-direction.mjs` (bundle effectCanvas
build lại: `/tmp/r83k6-effectCanvas.cjs`).

Tiêu chí thắng đăng ký TRƯỚC khi chạy (ghi trong header script): trên
sharp10, trung bình 4 dataset 640@1,264: MAD tốt nhất < 60% MAD baseline
tri, thắng trên ≥3/4 dataset, control không tệ hơn >20% (plain ≤ +0,5).
Nhiễu đo MAD ~±0,05 (J7 tái lập I3 trong 0,01–0,06).

Datasets chính (640@1,264, viewport 809×455): L1px / L2px / L3px / L4px.
Phụ (1280@1,132, viewport 1449×815): L1px / L2px — chỉ chạy D1 + D3 (D2/
D4/D5 đã thua dứt khoát trên 640 nên không lặp lại ở 1280). Control: sqw4
(640 + 1280, D1 ± D3) và textsmall640 tự nhiên (đủ D1/D2/D4/D5 — kiểm tra
hồi quy trên nội dung mà baseline đang KHỚP).

## 2. Kết quả tổng — delta MAD sharp10 (thấp hơn = khớp Chrome hơn)

Baseline tri (tái lập đúng J7 trong 0,01–0,03 trên mọi dataset):

| Dataset | BASE tri | D1 best gain | D3 crisp | D3 coverage | D2 best α=0,05 | D4 best A=1 | D5 s_mid |
|---|---|---|---|---|---|---|---|
| L1px-640@1,264 | **5,494** | 5,819 (g0,1) | 6,075 | 16,425 | 7,252 | 5,484 | 15,223 |
| L2px-640@1,264 | **4,128** | 4,662 (g0,1) | 4,680 | 13,018 | 6,356 | 4,102 | 15,004 |
| L3px-640@1,264 | **3,140** | 3,644 (g0,1) | 3,658 | 12,059 | 4,756 | 3,093 | 14,262 |
| L4px-640@1,264 | **2,343** | 2,738 (g0,1) | 2,763 | 9,630 | 3,472 | 2,286 | 9,819 |
| **Trung bình 4** | **3,776** | 4,216 | 4,294 | 12,783 | 5,459 | 3,741 | 13,577 |
| L1px-1280@1,132 | **3,196** | 3,249 (g0,1) | 3,410 | 10,240 | — | — | — |
| L2px-1280@1,132 | **2,834** | 3,102 (g0,1) | 3,082 | 8,492 | — | — | — |
| sqw4-1280@1,132 (control) | **4,724** | 7,729 (full) | — | — | — | — | — |
| textsmall640 (control) | **0,748** | 1,782 (full) | — | — | 0,787 | 0,719 | 1,585 |

(sharp05 cho cùng thứ hạng trên mọi dataset — xem JSON; D1/D2/D5 thua cả ở
sharp05, D4 A1 "cải thiện" 0,01–0,03 ở sharp05, cũng trong nhiễu.)

**Không hướng nào đạt tiêu chí thắng.** Tốt nhất toàn đợt là D4 A1 với
−0,035 MAD trung bình (−0,9%) — dưới nhiễu đo và không phải hiệu ứng
dither (xem §5). Mọi hướng còn lại tệ hơn baseline 1,1–4,0×.

## 3. Từng hướng — đã thử gì, số đo nói gì

### D1 — Gain-fitted sharpen-sau-upscale: HÌNH DẠNG SAI, không phải lượng sai

E7a (J7) chỉ thử sharpen-sau với toàn lượng (overshoot năng lượng
2,5–3,9×). Hướng mới: quét gain g ∈ {0,1…0,7} nhân vào delta sau-upscale
và quét intensity trực tiếp i ∈ {0…0,3} (amount = 0,2 + i·1,8).

- Trên lineart, MAD(g) **tăng đơn điệu theo g** trên mọi dataset, cả 2 mức:
  gain tốt nhất luôn là g nhỏ nhất thử (0,1) mà vẫn thua baseline (vd L2px
  sharp10: g0,1 = 4,662 > BASE 4,128; g0,7 = 11,445). Intensity tốt nhất
  cũng là i nhỏ nhất (i0, amount 0,2) mà vẫn thua baseline (L2px: 5,138).
- Đảo chiều trên control sqw4: ở đó MAD(g) **giảm** theo g (tốt nhất g0,7,
  vẫn tệ hơn baseline rất nhiều: sqw4-640 sharp10 full 10,555; g0,7
  14,064). Trên textsmall640 cũng thua baseline (full 1,782 vs 0,748).
- Kết luận: delta sau-upscale **sai hình dạng** so với dp_prev trên lineart
  (không chỉ sai lượng) — giảm gain chỉ tiến dần về "dự đoán delta = 0"
  mà không bao giờ tới được baseline. Hướng sharpen-sau-upscale đóng hẳn:
  toàn lượng đã loại (J7 E7a), gain-fit nay cũng loại.

### D2 — Pre-softening NHỎ (α-sweep): càng mềm càng tệ, plain vỡ ngay cả ở α nhỏ nhất

E8 (J7) chỉ thử blur MẠNH. Hướng mới: 3-tap [α/2, 1−α, α/2], α ∈ {0,05;
0,1; 0,2; 0,4} — proxy cho "base browser mềm hơn base ffmpeg một chút".

- α nhỏ nhất (0,05) đã tệ hơn baseline trên MỌI dataset lineart (L1px
  7,252 vs 5,494; L4px 3,472 vs 2,343) và tệ dần theo α (α=0,4: 10,6–27,8).
- Plain cũng vỡ ngay: α=0,05 đã đẩy plain MAD từ 4,28 → 6,07 (L1px),
  3,36 → 5,52 (L2px), 1,90 → 3,04 (L4px) — vượt xa ngưỡng cho phép +0,5.
  Trên textsmall640, α=0,05: delta 0,787 vs baseline 0,748 (tệ hơn) và
  plain 1,506 vs 1,473.
- Kết luận: **bất kỳ** pre-softening nào cũng tệ hơn — không tồn tại α>0
  có lợi. Giả thuyết "base-mismatch khuếch đại qua sharpen" dạng làm-mềm
  đều bị loại (E8 blur mạnh + D2 blur nhỏ). Chỉ còn dạng base-mismatch
  KHÔNG phải làm-mềm (vd khác biệt decode YUV/chroma) là chưa đo được —
  cần probe đọc trực tiếp effect canvas (nợ J7 §7.1, vẫn mở).

### D3 — Render vector ở độ phân giải đích: crisp cho delta đúng bằng 0; coverage overshoot

Hai biến thể lưới vẽ trực tiếp ở viewport-size (hình học scale đúng):
D3a crisp bilevel (pixel đen nếu tâm pixel nằm trong band đường), D3b
area-coverage (giá trị pixel = 255·(1 − tỉ lệ diện tích đường phủ)).

- **D3a: delta đúng bằng 0 trên mọi dataset** (E-ratio 0, dip 0) — sharpen
  trên bilevel crisp bị kẹp hoàn toàn ở MỌI thang, kể cả viewport-size.
  MAD của D3a bằng đúng mean|dp_prev| (6,075 / 4,680 / 3,658 / 2,763 —
  khớp từng số với phép đo độc lập ở §4). Đây là bằng chứng sạch:
  **delta preview CHỈ có thể sinh ra từ sharpen tác động lên giá trị
  trung gian (xám) — mà giá trị trung gian chỉ xuất hiện SAU bước
  resample.** Nhưng D1 đã chứng minh sharpen-sau-resample sai hình dạng.
  Hai kết quả này kẹp chặt cơ chế: bước tạo delta của Chrome vừa cần giá
  trị trung gian, vừa không phải applySharpen-sau-upscale.
- **D3b coverage overshoot nặng**: dip đúng cỡ dp_prev ở 3px/4px (vd 3px
  sharp05: −11,9 vs dp −10,5) nhưng MAD tệ hơn baseline 3–5× (L1px sharp10:
  16,425 vs 5,494; L2px: 13,018 vs 4,128). Dip khớp mà MAD tệ ⇒ hình dạng
  sai (FWHM/lobe/pha), và plain của coverage cũng lệch xa prev (MAD
  11–73 — lưới coverage không phải là plain Chrome thấy). Area-coverage
  rendering KHÔNG phải hướng sửa cho lineart này; hàm ý sản phẩm "vẽ
  overlay vector ở preview-size" không có bằng chứng ở đây (lưu ý: test
  này dùng video lineart, không phải overlay app vẽ — xem §7.4).
- Kết luận: D3 đóng cả hai biến thể.

### D4 — Dither Bayer có kiểm soát: "cải thiện" 0,01–0,06 là artefact, không phải hiệu ứng dither

Bayer 4×4, biên độ A ∈ {1, 2, 4} cộng vào R_plain trước sharpen.

- A=1: MAD thấp hơn baseline một chút trên MỌI dataset (L1px −0,010; L2px
  −0,026; L3px −0,047; L4px −0,057; textsmall640 −0,029/−0,031) — nhưng
  **dither A=1 không thay đổi gì trên input bilevel**: giá trị cộng ∈
  (−0,5; +0,5), làm tròn về đúng 0/255 cũ. Input vào applySharpen giống
  hệt nhau ⇒ delta đo được là d_model (applySharpen trên plain), còn
  baseline dùng d_render (frame ffmpeg). Chênh 0,01–0,06 này đúng bằng
  khoảng cách d_model–d_render đã biết (J7 E1: MAD project-size 0,05–0,08
  → sau upscale còn ~0,01–0,06). **Dither không đóng góp gì.**
- A=2/A=4 tệ hơn baseline trên lineart (vd L2px sharp10: 4,158/4,269 vs
  4,128) và tệ rõ trên textsmall640 (A=4 sharp10: 1,416 vs 0,748).
- Kết luận: dither loại. Không áp dither vào pipeline.

### D5 — Sharpen ở thang trung gian s_mid = √scale: tệ nhất nhóm "hợp lý"

Upscale R_plain lên 720×405 (s_mid = 1,124), sharpen ở đó, upscale tiếp
lên viewport. MAD 9,8–15,2 trên lineart 640 (tệ hơn baseline 2,9–4,2×),
1,585 trên textsmall640 (tệ hơn baseline 2,1×). Không có thang trung gian
nào cứu được sharpen-sau — phù hợp với D1 (gain→0 vẫn thua). Loại.

### Hướng đã cân nhắc nhưng KHÔNG thử (lý do ghi rõ)

- **Tách kênh luma/chroma:** trên nội dung test (grayscale/bilevel) R=G=B
  nên sharpen luma-only ≡ sharpen RGB — không thể tạo khác biệt. Chỉ có ý
  nghĩa trên lineart màu bão hoà (chưa có dataset).
- **Hinting theo độ dày (làm dày đường mảnh tối thiểu):** J7 E4 cho thấy
  plain Chrome KHÔNG dày đường hơn mô hình (rộng biểu kiến bằng nhau) —
  không có bằng chứng Chrome làm vậy; đổi độ dày sẽ phá plain MAD.
- **Blend tuyến tính tri(d_render) + g·d_post:** D1 cho MAD tăng đơn điệu
  theo g trên lineart ⇒ mọi trọng số g>0 đều tệ hơn baseline — blend
  không thể thắng, không cần chạy.

## 4. Khung giải thích mới: baseline chỉ giải thích 10–15% delta preview

Đo độc lập mean|dp_prev| ("dự đoán delta = 0") trên 640@1,264:

| Dataset | mean\|dp_prev\| sharp10 | BASE tri | BASE tốt hơn "dự đoán 0" |
|---|---|---|---|
| L1px | 6,075 | 5,494 | 0,581 (9,6%) |
| L2px | 4,680 | 4,128 | 0,552 (11,8%) |
| L3px | 3,658 | 3,140 | 0,518 (14,2%) |
| L4px | 2,763 | 2,343 | 0,420 (15,2%) |

Trên lineart, baseline chỉ hơn "đoán 0" khoảng 10–15% — tức **85–90% năng
lượng delta preview vẫn chưa có mô hình nào giải thích được** sau J7 + K6
(9 hướng đã loại tổng cộng, xem §6). Trái lại trên nội dung tự nhiên
baseline giải thích gần hết (textsmall640: mean|dp| 4,074 → BASE 0,748,
tốt hơn 82%; E-ratio dp/tri ≈ 1,05). Lệch lineart là hiện tượng riêng của
nội dung bilevel/đường mảnh, không phải lỗi mô hình tổng quát.

Kết hợp D3a (delta = 0 trên bilevel crisp ở mọi thang) + D1 (sharpen-sau
sai hình dạng) + J7 E3 (dp nằm GIỮA sharpen-trước ≈ 0 và sharpen-sau
overshoot ~3×): bước nội bộ Chrome tạo delta vừa cần giá trị trung gian
sau-resample, vừa không phải là applySharpen với cùng tham số sau-resample.
Ứng viên còn lại duy nhất có cơ chế (chưa đo được offline): base của
browser khác base ffmpeg ở mức YUV/chroma-decode (không phải làm-mềm) rồi
bị sharpen khuếch đại — cần probe đọc trực tiếp effect canvas (J7 §7.1).

## 5. Quyết định: KHÔNG sửa production

- **Không đổi `chrome-resample.mjs`, `effectCanvas.ts`, `preview.tsx`,
  không đổi (B,C), không thêm dither/softening/coverage.** Không có A/B
  nào thắng baseline; D4 A1 "thắng" 0,9% là artefact d_model–d_render,
  dưới nhiễu đo, không phải hiệu ứng dither — áp nó vào production sẽ là
  sửa theo cảm tính, đúng điều luật cấm.
- **Không chạy lại tsc/vite build** (không sửa file production nào; chỉ
  thêm 1 script + doc này). Hồi quy: `node --test
  apps/web/scripts/chrome-resample-67u2.test.mjs` **8/8 pass**.
- Bound J7 E6 giữ nguyên: lệch lineart không đổi verdict toàn cục nào
  trên nội dung tự nhiên đã đo (MAD toàn cục ≤1,2); chỉ quan trọng khi
  phải khớp pixel trên đường kẻ/chữ mảnh bilevel.

## 6. Toàn cảnh các hướng đã loại (J7 + K6)

| Hướng | Đợt/luồng | Kết quả |
|---|---|---|
| Kernel (tri/BC/Mitchell/Catmull) | J7 V0 (+ I3) | Chênh ≤0,22 — loại |
| Pha lấy mẫu (fitShift) | J7 E2 (+ I3) | Cải thiện ≤7% — loại |
| Đường effect (E1) | J7 E1 | MAD 0,05–0,08 — khớp, loại |
| Gain trên tri(d_render) | I3 E3 / J7 §5 | Cải thiện 2–4% — loại |
| Sharpen-sau-upscale toàn lượng | J7 E7a | Overshoot 2,5–3,9× — loại |
| **Sharpen-sau gain-fit (D1)** | **K6** | **Tốt nhất g→0, vẫn thua baseline — loại** |
| Decode-mềm / blur mạnh | J7 E8 | Tệ hơn 2,5–7× — loại |
| **Pre-softening nhỏ α-sweep (D2)** | **K6** | **Tệ hơn ở mọi α, plain vỡ — loại** |
| Base-est downscale-back | J7 E9 | Phương pháp hỏng — không kết luận |
| Supersample 2× | J7 E10 | Tệ hơn 2,6–3,9× — loại |
| **Render viewport crisp (D3a)** | **K6** | **Delta đúng = 0 — loại (nhưng cho bằng chứng cơ chế §4)** |
| **Render viewport coverage (D3b)** | **K6** | **Tệ hơn baseline 3–5× — loại** |
| **Dither Bayer (D4)** | **K6** | **A1 "thắng" 0,9% là artefact E1; A2/A4 tệ hơn — loại** |
| **Sharpen thang trung gian (D5)** | **K6** | **Tệ hơn baseline 2,9–4,2× — loại** |
| Luma/chroma split, hinting độ dày, blend tuyến tính | K6 §3 | Không thử — lý do ghi ở §3 cuối |

## 7. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **Lineart aliasing VẪN chưa có hướng sửa có bằng chứng** sau 9 hướng đã
   loại (4 hướng J7/I3 + 5 hướng mới K6). Đây là lần thứ hai liên tiếp một
   luồng chuyên trách kết luận "không sửa được" — nên cân nhắc đóng băng
   nợ này (chỉ mở lại khi có probe effect-canvas trực tiếp, xem mục 2)
   thay vì tiếp tục quét hướng offline.
2. **Bước nội bộ Chrome tạo delta vẫn mở** (J7 §7.1 giữ nguyên): cần probe
   headed đọc trực tiếp frame ở effect canvas — phân biệt base-mismatch
   YUV/chroma với drawImage `imageSmoothingQuality="high"` không-đồng-nhất
   và quantization getImageData/putImageData + color-management. Cho tới
   khi có probe đó, đừng claim đã hiểu cơ chế.
3. **Delta MAD lineart vẫn LỆCH** ở mọi độ dày đã đo (1–4px) và mọi thang
   (0,632–2,264): 1px 4,96–5,49; 2px 2,81–4,13; 3px 3,09–3,14; 4px 2,28–2,34
   (tri, sharp05/10). Ngoại suy hình học ~0,75/px của J7 (§2) chưa được đo
   ở 5–6px.
4. **D3 test trên video lineart, không phải overlay app vẽ:** kết luận
   "coverage không phải hướng sửa" chỉ đúng cho pipeline video→canvas;
   overlay vector do app vẽ (text/shape ở preview-size) là đường code
   khác, chưa có số đo — đừng trích D3 để kết luận về overlay.
5. Chỉ đo nội dung tổng hợp grayscale/bilevel + control tự nhiên, frame
   tĩnh, 1 capture/biến thể. Chưa đo thang >2,3, dị hướng, nội dung màu
   bão hoà (nơi luma/chroma split mới có ý nghĩa), hay frame chuyển động
   có đường mảnh.
6. `applySharpen` vẫn dùng bt709 (nợ H3 §5.2) — chưa có bằng chứng trực
   tiếp; không đụng trong luồng này.
7. Không có sóng EPERM trong lượt này (mọi ghi file thành công).

## 8. Kiểm chứng

- Baseline tái lập đúng J7 trong 0,01–0,03 trên mọi dataset (vd L2px-640
  sharp10: 4,128 vs J7 4,113 — chênh 0,015 do d_render dùng frame
  fullrgb-*.raw giống J7; L1px-640: 5,494 vs 5,475).
- `node --test apps/web/scripts/chrome-resample-67u2.test.mjs`: **8/8
  pass** (chrome-resample.mjs không đổi; không sửa production nên không
  chạy tsc/vite build).
- Script chạy exit 0, ~280s, 9 dataset, ~150 phép đo MAD — JSON đầy đủ tại
  `hidden_files/round83-k6/r83k6-new-direction.json`, log tại
  `hidden_files/round83-k6/r83k6-new-direction.log`.
- Không sửa file production, không sửa file chung (package.json, dict i18n,
  DESKTOP.md), không binary, không workflow. Bundle effectCanvas chỉ build
  lại ra /tmp (không phải file repo).

## 9. File

- Script mới (1, `apps/web/scripts/`): `r83k6-lineart-new-direction.mjs`
  (D1–D5 + baseline + control; chạy: `node
  apps/web/scripts/r83k6-lineart-new-direction.mjs`, cần bundle
  `/tmp/r83k6-effectCanvas.cjs` — build lại bằng `node_modules/.bin/esbuild
  apps/web/src/lib/effectCanvas.ts --bundle --platform=node --format=cjs
  --outfile=/tmp/r83k6-effectCanvas.cjs`).
- Doc này: `docs/PHASE9_ROUND83_K6_LINEART_NEW_DIRECTION_LIMITS.md`.
- Bằng chứng (KHÔNG stage — không phải file repo):
  `hidden_files/round83-k6/` (`r83k6-new-direction.{json,log}`).
