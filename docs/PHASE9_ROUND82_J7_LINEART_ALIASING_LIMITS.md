# Phase 9 đợt 82, luồng J7 — Lineart aliasing: delta MAD ~4,1 không phụ thuộc kernel

- **Luồng:** J7, đợt 82 (nợ I3 §4.4 / §7.3 — nợ quan trọng nhất I3 để lại).
- **Ngày:** 10/11/2026. Repo local `~/workspace/repo-1`, HEAD `5f548ef8`. **CHỈ stage, KHÔNG push.**
- **Kết luận ngắn: CƠ CHẾ ĐÃ THU HẸP ĐÁNG KỂ — NHƯNG KHÔNG CÓ HƯỚNG SỬA NÀO CÓ BẰNG CHỨNG. Không sửa production.**

  Trên nội dung bilevel (đen 0 / trắng 255), delta sharpen ở project-size
  **≈ 0** vì sharpen bị kẹp ở cả hai đầu (E5: lưới tổng hợp thuần cho delta
  đúng bằng 0 với MỌI độ dày 1–4px, cả 2 thang, cả 2 mức sharpen), trong
  khi delta preview của Chrome lớn hơn **2,4–7,5×** về năng lượng. Lệch
  KHÔNG nằm ở đường effect (E1: MAD 0,05–0,08), KHÔNG phải kernel (cả 4
  kernel — kể cả Mitchell, kernel drawImage thật của Chrome theo J2 đợt
  82 — đều cho delta MAD chênh nhau ≤0,22), KHÔNG phải pha lấy mẫu
  (fitShift cải thiện ≤7%), KHÔNG phải sharpen-sau-upscale (E7a:
  overshoot 2,5–3,9×), KHÔNG phải decode-mềm (E8: blur làm tệ hơn
  2,5–7×), KHÔNG phải supersampling (E10: tệ hơn baseline 2,6–3,9×).
  Delta thật của Chrome nằm GIỮA sharpen-trước-upscale (≈ 0) và
  sharpen-sau-upscale (overshoot ~3×), và bước nội bộ Chrome tạo ra nó
  vẫn chưa tách được offline (E9 downscale-back hỏng phương pháp).
  **Đóng bằng bound:** trên nội dung tự nhiên, pixel cạnh mảnh lệch MAD
  4,4–4,9 (cùng cỡ lineart) nhưng chỉ ~10–15% khung nên MAD toàn cục
  ≤1,2 — không đổi verdict. Không đề xuất sửa production nào.

## 1. Câu hỏi và phương pháp

I3 (§4.4) để lại: lineart2px delta MAD ~4,1 với MỌI kernel (tri/BC/
Mitchell/Catmull đều 4,1–4,3), trong khi E1 ở project size MAD chỉ
0,064–0,076 (đường effect khớp). Lệch được gán nhãn "aliasing của đường
2px, không phải kernel — BC không sửa được, vẫn mở". Luồng này kiểm tra
nhãn đó bằng dữ liệu cũ + capture headed mới:

- **Offline trên dữ liệu H3/G5** (`r82j7-lineart-aliasing.mjs`): lineart
  1px @0,632/1,132/1,264/2,264 (G5) + lineart 2px @1,132/1,264/2,264
  (H3) + textsmall/photo/videoframe tự nhiên. V0 tái lập; E1 profile qua
  đường lưới; E2 fit pha; E3 ngân sách năng lượng; E4 độ rộng đường
  plain; E5 luật độ dày miền mô hình (lưới tổng hợp 1–4px); E6 breakdown
  pixel cạnh trên nội dung tự nhiên.
- **Capture headed mới 3px/4px** (media + render frames + headed harness
  sao từ H3): lineart 3px/4px-640 @1,264, phân tích bằng
  `r82j7-lineart34.mjs` (cùng code với script chính).
- **Ba test loại trừ/giả thuyết** (script riêng): E7a sharpen-sau-upscale
  trên CHÍNH P_plain của Chrome; E8 blur-sensitivity (decode mềm); E9
  base-est (downscale P_plain bằng Mitchell rồi sharpen); E10
  supersample 2× (hướng sửa ví dụ).
- Bundle `applySharpen` build lại từ `effectCanvas.ts` hiện tại
  (`/tmp/r82j7-effectCanvas.cjs`, esbuild — file `/tmp` cũ của I3 đã mất;
  luồng sau chạy lại script này phải build lại bundle bằng lệnh trong §8).

## 2. Luật độ dày và thang — dữ liệu Chrome thật (V0 + capture mới)

Delta MAD (tri, sharp05/10) trên lineart, mọi kernel chênh nhau ≤0,22:

| Nội dung | 0,632 ↓ | 1,132 ↑ | 1,264 ↑ | 2,264 ↑ |
|---|---|---|---|---|
| 1px | 4,965/4,963 | 3,205/3,199 | 5,471/5,475 | 5,305/5,310 |
| 2px | — | 2,814/2,820 | 4,107/4,113 | 4,107/4,113 |
| 3px (mới) | — | — | 3,094/3,124 | — |
| 4px (mới) | — | — | 2,282/2,331 | — |

Kernel-independence ở cả 3px/4px mới: 3px tri 3,094/3,124 — BC
3,257/3,290, Mitchell 3,252/3,283, Catmull 3,250/3,292; 4px tri
2,282/2,331 — BC 2,349/2,401, Mitchell 2,342/2,391, Catmull
2,346/2,412. I3 đã đúng cho 2px; nay đúng cho cả 1/3/4px.

**Luật độ dày @1,264 (sharp10): 5,48 → 4,11 → 3,12 → 2,33 — tỉ lệ
~0,75 mỗi px dày thêm** (4,11/5,48 = 0,75; 3,12/4,11 = 0,76;
2,33/3,12 = 0,75). Ngoại suy hình học: ~5px → 1,75, ~6px → 1,31
(dưới ngưỡng KHỚP MAD ≤ 2) — chỉ là ngoại suy từ 4 điểm, một thang,
chưa đo 5–6px thật, đừng trích làm kết luận.

**Không phụ thuộc thang:** 2px cho 4,11 ở CẢ 1,264 và 2,264 (bằng nhau
tới 0,001); 1px 5,31–5,48 trên cả 3 thang upscale; downscale 0,632
cũng 4,96. **Không có ngưỡng Nyquist:** lệch hiện diện ở mọi thang kể
cả downscale, nên nó KHÔNG phải hiện tượng chỉ-xảy-ra-khi-upscale.
Nhãn "aliasing" giữ lại như tên gọi làm việc cho tương tác lấy mẫu
đường mảnh, không phải cơ chế ngưỡng Nyquist đã chứng minh.

## 3. Cơ chế — phần đã xác định: delta project-size ≈ 0 do kẹp hai đầu

### 3.1 E1 — đường effect khớp; E5 — delta mô hình đúng bằng 0

E1 project-size MAD(d_model, d_render) = 0,05–0,08 trên mọi dataset
lineart (1px: 0,055–0,068; 2px: 0,05–0,076; 3px: 0,089–0,136; 4px:
0,117–0,204 — tăng nhẹ theo độ dày nhưng vẫn nhỏ). Đường effect
(ffmpeg unsharp vs applySharpen) KHÔNG phải nguyên nhân.

E5 (lưới tổng hợp thuần, trắng 255 + đường đen, không chéo/tròn):
**model delta MAD viewport = 0, dip = 0, năng lượng = 0 với MỌI độ dày
1–4px, cả 2 kích thước (640/1280), cả 2 mức sharpen.** Lý do: mọi pixel
đều ở đầu kẹp (0 hoặc 255); sharpen chỉ đẩy giá trị RA NGOÀI nên bị
kẹp hết — đường đen không tối thêm được, nền trắng không sáng thêm
được. Đo trực tiếp trên frame render thật L1px-1280: mean|d_render| =
0,765, max 85 (chỉ ở một giao nhau tròn/chéo), 212.222/921.600 pixel
khác 0 — delta chỉ tồn tại ở chỗ frame decode có giá trị trung gian
(h264 làm mềm cạnh cong/chéo), KHÔNG ở đường lưới thẳng.

### 3.2 E3 — delta preview lớn hơn mô hình 2,4–7,5× về năng lượng

Tỉ lệ sum|dp_prev| / sum|tri(d_render)| (sharp10):

| | 0,632 | 1,132 | 1,264 | 2,264 |
|---|---|---|---|---|
| 1px | 7,37 | 5,27 | 4,62 | 4,50 |
| 2px | — | 3,53 | 3,44 | 3,43 |
| 3px | — | — | 2,90 | — |
| 4px | — | — | 2,38 | — |

Tỉ lệ giảm theo độ dày (1px > 2px > 3px > 4px) và theo thang với 1px.
Trong vùng lân cận đường (E3b): mean|dp| 6,14 → 4,71 → 3,67 → 2,77
theo độ dày 1–4px @1,264, trong khi mean|tri(d_render)| gần như phẳng
(1,32 → 1,36 → 1,26 → 1,16) — **delta Chrome giảm theo độ dày, delta
mô hình không đổi.** Profile qua đường dọc (sharp10): dip dp_prev
−7,8 đến −19,4 (1px) / −0,5 đến −15,6 (2px) / −10,5 (3px) / −7,9
(4px), trong khi tri(d_render) chỉ −0,3 đến −1,2. Y-profile (đường
ngang) cho dip lớn hơn và có cấu trúc lưỡng cực −/+ (dấu hiệu dịch
subpixel), nhưng fitShift chỉ cải thiện MAD 3–7% — pha không phải cơ
chế chính (E2).

### 3.3 E4 — đường plain khớp (lệch không thừa kế từ plain)

Độ rộng biểu kiến của đường ở plain: prev = tri = BC ở mọi thang đo
được (1px: 1px @0,632, 2px @1,132/1,264, 3px @2,264; 2px: 3px @1,132/
1,264, 5px @2,264; 3px: 4px @1,264). MAD b_plain trong cửa sổ đường
0,98–4,14 — plain khớp tốt. Lệch delta KHÔNG phải do plain đã lệch
sẵn. (Lưu ý đo: E4 ở L4px-640 cho "rộng 9px" là artefact — nền trung
bình theo hàng ~129 gần ngưỡng 127,5 vì lưới dày 4px/8px; không dùng
số này.)

## 4. Nội dung tự nhiên — bound ảnh hưởng thật (E6)

MAD riêng trên pixel "cạnh mảnh" (|d_render| project > 8) vs pixel
phẳng, kernel tri (sharp05/10):

| Nội dung | % pixel cạnh | MAD cạnh | MAD phẳng | MAD toàn cục | Tỉ lệ năng lượng dp/tri |
|---|---|---|---|---|---|
| textsmall 1280 @1,132 | 9,7 / 11,0% | 4,94 / 4,78 | 0,08 / 0,05 | 0,55 / 0,58 | 1,07 / 1,06 |
| textsmall640 @1,264 | 11,7 / 14,6% | 4,38 / 4,41 | 0,17 / 0,12 | 0,66 / 0,75 | 1,05 / 1,05 |
| photo 1280 @1,132 | 12,0 / 17,6% | 2,80 / 2,91 | 0,62 / 0,60 | 0,88 / 1,00 | 1,12 / 1,10 |
| videoframe 1280 @1,132 | 22,4 / 31,5% | 1,75 / 2,45 | 0,51 / 0,62 | 0,79 / 1,20 | 1,00 / 1,02 |

**Bound:** lệch trên chi tiết mảnh là CÓ THẬT trên nội dung tự nhiên —
pixel cạnh của chữ nhỏ lệch MAD 4,4–4,9, cùng cỡ lineart — nhưng chúng
chỉ chiếm ~10–15% khung nên MAD toàn cục ≤0,75 (KHỚP) trên text,
≤1,00 trên photo, ≤1,20 trên video tự nhiên. Tỉ lệ năng lượng ~1,0–1,1
(trái với 2,4–7,5 trên lineart): trên nội dung tự nhiên mô hình đúng
về tổng năng lượng, lệch chỉ là tái phân bố ở cạnh. **Kết luận thực
dụng: lệch lineart không đổi verdict toàn cục nào trên nội dung tự
nhiên đã đo; nó chỉ quan trọng khi sản phẩm phải khớp pixel trên
đường kẻ/chữ mảnh bilevel (vd overlay đồ họa vector, subtitle nét mảnh).**

## 5. Bốn giả thuyết đã loại bằng số đo (E7a/E8/E9/E10)

| Giả thuyết | Test | Kết quả |
|---|---|---|
| **Sharpen sau upscale** | E7a: `applySharpen(P_plain) − P_plain` vs dp_prev (dùng CHÍNH snapshot plain của Chrome, khắc phục điểm yếu I3 E6 dùng tri(R_plain)) | **Loại dứt khoát.** MAD 7,8–21,4 (tệ hơn tri 2,3–5,5); năng lượng overshoot 2,5–3,9×; profile dip −37 đến −86 vs dp −7,8. Đối chứng sqw4-640 cũng tệ (8,1/10,6 vs 4,04/4,69). |
| **Decode của browser mềm hơn ffmpeg** | E8: blur R_plain (tap121/binom5) rồi sharpen trên frame mờ | **Loại.** Delta tệ hơn 2,5–7× (vd L2px: 4,1 → 20,5/17,8); plain của frame mờ vỡ MAD 22–50 (baseline 1,9–3,4). Frame browser sắc như ffmpeg. |
| **Base-mismatch khuếch đại qua sharpen** | E9: downscale P_plain về project-size bằng Mitchell (J2) rồi sharpen trên B_est | **Không kết luận được — phương pháp hỏng.** MAD(B_est, R_plain) = 13–25: round-trip upscale→downscale phá hỏng đường mảnh (I3 §5.3 đã cảnh báo). Sharpen(B_est) MAD 9,5–19,0 — tệ hơn baseline — nhưng đó là artefact của B_est hỏng, không phải bằng chứng chống giả thuyết. Cần probe đọc trực tiếp effect canvas (xem §7.3). |
| **Supersampling 2× trước khi sharpen** (hướng sửa ví dụ) | E10: sharpen ở 2× project-size (Mitchell), downscale về, upscale lên viewport | **Loại.** MAD 5,9–16,2, tệ hơn baseline Mitchell (2,3–4,1) **2,6–3,9×** trên cả 4 dataset, cả 2 mức. Supersampling cũng overshoot như sharpen-sau-upscale. |

Cùng với I3 đã loại: gain (E3: g tốt nhất chỉ cải thiện 2–4%),
sharpen-sau-upscale bản tri (E6), làm mờ thêm (fit B: tệ hơn 2,7–3,4×),
lệch pha (fit A/D: ngược dấu plain/delta), đường effect (E1/E7).

## 6. Quyết định: KHÔNG sửa production

- **Không đổi `chrome-resample.mjs`, `effectCanvas.ts`, `preview.tsx`,
  không đổi (B,C).** Không có A/B nào thắng: baseline (sharpen-trước-
  upscale) vẫn là mô hình tốt nhất trong mọi mô hình đã thử — mọi
  "sửa" ứng viên đều tệ hơn baseline 2,6–3,9× (E7a/E10) hoặc tệ hơn
  2,5–7× (E8).
- **J2 (đợt 82) đã chứng minh kernel drawImage thật của Chrome là
  Mitchell (B=C=1/3), MAD 0,000–0,003 trên probe trực tiếp** — nhưng
  Mitchell cũng không sửa lineart (V0: Mitchell 4,30 vs tri 4,11 ở
  2px-640; 2,39 vs 2,33 ở 4px). Việc đổi (B,C) sang (1/3, 1/3) là quyết
  định của parent dựa trên J2 (cải thiện plain/sqw), KHÔNG phải sửa
  cho lineart — đừng trích J2 là đã đóng nợ này.
- **Không áp supersampling, không thêm ngưỡng độ dày tối thiểu, không
  làm mờ đường mảnh** — cả ba đều không có bằng chứng, hai trong ba đã
  bị đo loại trực tiếp.

## 7. Giới hạn trung thực (nợ mở / chưa giải quyết)

1. **Bước nội bộ Chrome tạo ra delta preview từ delta project-size ≈ 0
   vẫn mở.** Sau khi loại mọi giả thuyết kiểm được offline, còn lại các
   ứng viên chỉ đo được bằng probe headed trực tiếp: (a) base-mismatch
   khuếch đại qua sharpen — cần đọc frame ở effect canvas; (b)
   drawImage video→canvas 1:1 với `imageSmoothingQuality="high"` làm
   việc không-đồng-nhất; (c) getImageData/putImageData + color-management
   quantization. Cho tới khi có probe đó, đừng claim đã hiểu hết cơ chế;
   §3–§5 chỉ là kết luận loại trừ + bound, không phải đo trực tiếp.
2. **Delta MAD lineart vẫn LỆCH ở mọi độ dày đã đo (1–4px) và mọi thang
   (0,632–2,264):** 1px 4,96–5,48; 2px 2,81–4,11; 3px 3,09–3,12; 4px
   2,28–2,33 (tri, sharp05/10 gần như bằng nhau — sharpen05 vs sharpen10
   chênh <0,05 vì delta bị kẹp). Ngoại suy hình học ~0,75/px (§2) chưa
   được đo ở 5–6px.
3. **E9 không kết luận được** (downscale-back hỏng trên đường mảnh) —
   đừng dùng lại phương pháp này cho nội dung mảnh; đừng trích E9 là
   bằng chứng chống base-mismatch.
4. **E4 đo rộng đường không dùng được khi lưới dày** (nền trung bình
   theo hàng gần ngưỡng 127,5 ở 4px/8px) — số "9px" ở L4px là artefact.
5. **D3 headed báo FAIL giả** ở cả 2 nguồn 3px/4px: harness kiểm tra
   raw frame hash của noise05 trong khi variants không gồm noise
   (đã bỏ noise để tiết kiệm thời gian). Cùng-khung được xác nhận độc
   lập bằng rawHash giống nhau cả 3 variant (3px: b4e33b1f; 4px:
   2720ea8b) + D1 plain 2 lần pixel-identical. Nếu luồng sau dùng lại
   harness này với variants rút gọn thì sửa D3 bỏ qua variant vắng mặt
   thay vì báo FAIL.
6. Chỉ đo nội dung tổng hợp grayscale/bilevel + 4 nội dung tự nhiên,
   frame tĩnh 30, 1 capture/biến thể (trừ D1 lặp plain). Chưa đo thang
   >2,3, dị hướng, nội dung màu bão hoà, hay frame chuyển động có đường
   mảnh.
7. `applySharpen` vẫn dùng bt709 (nợ H3 §5.2) — kề với fix noise bt601,
   chưa có bằng chứng trực tiếp; không đụng trong luồng này.

## 8. Kiểm chứng

- V0 tái lập đúng từng số I3 cho lineart2px-640 @1,264 (tri delta
  4,107/4,113; BC 4,306/4,313; Mitchell 4,295/4,302; Catmull
  4,302/4,313) và G5 cho lineart 1px (tri delta 3,205/3,199 @1,132 —
  G5 báo 3,269/3,263 cho implementation trilinear riêng của họ, chênh
  2%, không ảnh hưởng kết luận).
- `node --test apps/web/scripts/chrome-resample-67u2.test.mjs`: **8/8
  pass** (chrome-resample.mjs không đổi).
- Headed 3px/4px: D1 PASS cả 2 nguồn; rawHash cùng-khung cả 3 variant;
  H9 0 lỗi trang.
- Không sửa file production nào (chỉ thêm 9 script + doc này) nên
  tsc/vite build không bị ảnh hưởng; không chạy lại.
- Bundle effectCanvas build lại: `node_modules/.bin/esbuild
  apps/web/src/lib/effectCanvas.ts --bundle --platform=node
  --format=cjs --outfile=/tmp/r82j7-effectCanvas.cjs` (bundle cũ của I3
  ở /tmp đã mất sau restart — luồng sau chạy lại script J7 phải build
  lại bundle này trước).

## 9. File

- Script mới (9, `apps/web/scripts/`): `r82j7-lineart-aliasing.mjs`
  (V0 + E1–E6), `r82j7-lineart34.mjs` (3px/4px),
  `r82j7-post-upscale-test.mjs` (E7a), `r82j7-blur-test.mjs` (E8),
  `r82j7-base-est-test.mjs` (E9), `r82j7-supersample-test.mjs` (E10),
  `r82j7-make-media.py`, `r82j7-render-frames.mjs`,
  `r82j7-fullpixel-headed.mjs`.
- Doc này: `docs/PHASE9_ROUND82_J7_LINEART_ALIASING_LIMITS.md`.
- Bằng chứng (KHÔNG stage — không phải file repo):
  `hidden_files/round82-j7/` (`r82j7-aliasing.{json,log}`,
  `r82j7-aliasing34.{json,log}`, `r82j7-post-upscale.{json,log}`,
  `r82j7-blur.{json,log}`, `r82j7-base-est.{json,log}`,
  `r82j7-supersample.{json,log}`, `r82j7-headed.log`,
  `media/lineart{3,4}px-640.{png,mp4}`,
  `render/lineart{3,4}px-640/{preencode-*.yuv,fullrgb-*.raw}`,
  `headed-w1920x1080-p640x360-ph1/r82j7-snaps-w1920x1080-p640x360.json`).
