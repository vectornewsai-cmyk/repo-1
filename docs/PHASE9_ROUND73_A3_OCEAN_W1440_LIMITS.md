# PHASE 9 ĐỢT 73 — LUỒNG A3: OCEAN w1440 noise05 — ĐIỀU KIỆN HOÁ delta0
THEO absMAD plain + THÍ NGHIỆM RENDER-P + CHẨN ĐOÁN TRÔI KHUNG

**Ngày:** 09/11/2026 · **Nợ:** đợt 72 §4 mục 6 / Z2 §6.2+§8.1 (ocean
w1440 noise05 LỆCH thật: Δkurt G 1,11, Δcorr R-G 0,242, stdRatio G 1,20).
**Kết quả tóm tắt — đọc trước:**

1. **Ocean w1440 noise05 VẪN LỆCH dưới MỌI dạng điều kiện hoá delta0.**
   Δkurt G chỉ dao động trong **[1,08, 1,13]** (trilinear) và
   **[1,36, 1,37]** (1-kernel) qua 15 biến thể — không bao giờ tiến gần
   ngưỡng 0,35. Điều kiện hoá delta0 theo absMAD (nhị phân Z2, graded,
   theo kênh, theo vùng 9×9) **KHÔNG cứu được ô này**.
2. **Hướng phụ render-P cũng KHÔNG cứu được:** build frame noise render
   bằng ĐÚNG công thức preview `addYuvNoise` (est-chroma kCb 1,04/kCr
   1,12, nhiễu Y theo pixel + chroma theo khối 2×2, RNG mulberry32/
   Box-Muller verbatim) vẫn cho Δkurt G **1,06** (seed 12345) và **1,10**
   (seed 777). Giả thuyết est-chroma của Z2 §6.2 bị loại ở mức cơ chế duy
   nhất: render kurt G vẫn 0,25–0,29 trong khi preview là 1,35.
3. **Phát hiện mới (chẩn đoán bin): đuôi nặng KHÔNG phải đuôi thật — mà
   là HỖN HỢP PHƯƠNG SAI (scale mixture).** Trong từng bin plainAbsDiff,
   preview delta G có kurt ≈ 0,2–0,3 (KHỚP render); nhưng 11% pixel có
   plainAbsDiff ≥ 8 mang preview std G **18,64** thay vì ~9,0. Trộn 3
   thành phần std 9,1/10,5/18,6 theo tỉ lệ 78/11/11% dự đoán kurt toàn
   cục **1,53** (đo 1,35) và std toàn cục **10,71** (đo 10,69, tỉ lệ
   1,20 đúng số đo). Toàn bộ chữ ký lệch (Δkurt G, stdRatio G) quy về
   MỘT fact: phương sai thừa tập trung ở 11% pixel lệch-plain-nhiều.
4. **Giả thuyết trôi khung (snapshot noise05 ở khung khác plain) CHẾT
   ở mức cơ chế chính.** Plain preview khớp khung f25 nhất (MAD 3,12
   so với 12,4–14,8 ở f23/24/26/27). Tương quan toàn cục giữa dư
   e = dP − dR và trường trôi chỉ 0,135 (G, f25→f26); trong bin xấu
   nhất corr 0,375 nhưng chỉ giải thích ~17% phương sai thừa (và hai
   trường trôi liên tiếp tự chúng đã phản tương quan −0,40, nên cặp
   ±0,375 không đọc được thành trôi sạch).
5. **Không phá ô nào đã KHỚP.** Mọi đối chứng giữ verdict cũ; riêng
   test-pattern w1440 noise05 vẫn CẦN d0 (không-d0 LỆCH Δcorr R-G 0,206;
   luôn-d0 KHỚP) — quy tắc nhị phân Z2 (ngưỡng 2,5) vẫn là quy tắc đúng,
   graded 0,5 chỉ KHỚP sát nút (Δcorr 0,104) nên không thay được nhị phân.
6. **Không sửa code production.** Chỉ thêm 3 script đo + file này.

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
**KHÔNG push, KHÔNG release/tag.** Mọi số dưới đây là đo thật (Node
v24.22.1; ffmpeg 8.1.2; snapshot headed Y2 tái dùng, KHÔNG capture
lại). Ngưỡng verdict như Z2: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12. Probe/log/JSON tại `hidden_files/round73-a3/`, log
luồng `hidden_files/round73-a3.md`.

---

## 1. Bối cảnh và câu hỏi

Z2 đã đóng ocean w1440 **noise10** (KHỚP nhờ điều kiện hoá delta0
nhị phân theo plain absMAD, ngưỡng 2,5) nhưng noise05 vẫn LỆCH thật
dưới mọi biến đã thử (filter 1920→1280, delta0 có/không, 3 mô hình
viewport, realization nhiễu, kẹp rail, cấu trúc plain 1-bước). Nhiệm
vụ luồng này: thử các dạng điều kiện hoá delta0 **tinh hơn** trong cùng
họ (Z2 chỉ làm nhị phân toàn cục), rồi tối đa 1 hướng phụ (render-P:
nhiễu render theo đúng công thức preview), và kết luận bằng số.

Cơ sở đo: snapshot headed Y2 (`round71-y2/headed-w1440` + `headed-w1920`),
frame render Z2 (`round72-z2/render-1k/`, plain thắng theo nguồn: ocean
C2, basgo C1, slovenska C3; noise method T), testsrc2 từ
`round66-t3/render`. Hàm `delta0`/`channelStats`/`fullDeltaStats`/
`absMad` sao chép VERBATIM từ `r72z2-analyze.mjs`; RNG + `addYuvNoise`
sao chép VERBATIM công thức từ `apps/web/src/lib/effectCanvas.ts`
(mulberry32, gaussianGenerator, rgbToYuv709/yuv709ToRgb,
estimateNativeChroma kCb 1,04/kCr 1,12, thứ tự rút RNG: chroma theo
khối trước, Y theo pixel sau).

## 2. Phần 1 — các dạng điều kiện hoá delta0 (script r73a3-d0cond.mjs)

### 2.1 Ô TARGET: ocean w1440 noise05 (viewport trilinear)

plain absMAD = 3,294; theo kênh [R 2,718, G 2,786, B 4,378].

| Biến thể | Δkurt [R,G,B] | Δcorr [R-G,R-B,G-B] | stdRatio | Verdict |
|---|---|---|---|---|
| w0 (không d0) | [0,12, **1,12**, 0,08] | [0,239, 0,078, 0,142] | [1,05, 1,19, 1,04] | LỆCH |
| w1 (luôn d0) | [0,44, **1,12**, 0,08] | [0,228, 0,072, 0,142] | [1,02, 1,19, 1,03] | LỆCH |
| graded w0,25 | [0,22, **1,13**, 0,08] | [0,237, 0,076, 0,142] | [1,04, 1,19, 1,03] | LỆCH |
| graded w0,5 | [0,31, **1,13**, 0,08] | [0,234, 0,075, 0,142] | [1,03, 1,19, 1,03] | LỆCH |
| graded w0,75 | [0,38, **1,13**, 0,08] | [0,231, 0,073, 0,142] | [1,02, 1,19, 1,03] | LỆCH |
| theo kênh T1,5 | [0,12, **1,12**, 0,08] | = w0 | = w0 | LỆCH |
| theo kênh T2,5 | [0,12, **1,12**, 0,08] | = w0 | = w0 | LỆCH |
| theo kênh T3,5 | [0,44, **1,12**, 0,08] | [0,228, 0,078, 0,142] | [1,02, 1,19, 1,04] | LỆCH |
| local 9×9 T1,5 | [0,32, **1,08**, 0,08] | [0,231, 0,068, 0,146] | [1,05, 1,20, 1,04] | LỆCH |
| local 9×9 T2,5 | [0,34, **1,09**, 0,08] | [0,218, 0,061, 0,145] | [1,04, 1,19, 1,04] | LỆCH |
| local 9×9 T4,0 | [0,37, **1,09**, 0,08] | [0,220, 0,063, 0,145] | [1,04, 1,19, 1,04] | LỆCH |
| local graded 1,5–4,0 | [0,35, **1,09**, 0,08] | [0,220, 0,063, 0,144] | [1,04, 1,19, 1,04] | LỆCH |
| 1-kernel w0 / w1 / w0,5 | G **1,36 / 1,36 / 1,37** | [0,036, 0,023, 0,004] (khớp corr) | [0,93, 0,92, 0,92] (trong ngưỡng) | LỆCH (do kurt) |

**Bằng chứng chốt (smoking gun):** preview kurt G = **1,35** (w0),
**1,35** (w1), **1,36** (graded 0,5), **1,32** (local T2,5) — gần như
bất biến; render kurt G = **0,23**. delta0 chỉ dịch chuyển kurt R
(0,49→0,81) và Δcorr R-G một chút (0,239→0,228). G-kurt không nằm
trong tầm tác động của delta0 — vì d0 là trường xác định suy từ plain,
còn đuôi nặng nằm trong chính delta nhiễu của preview. (Giải thích
theo-kênh T1,5/T2,5 ≡ w0: cả 3 kênh plain absMAD đều > 2,5 nên không
kênh nào được áp d0; T3,5 áp R+G nên ≡ w1 ở R.)

### 2.2 Đối chứng — không phá ô đã KHỚP, quy tắc nhị phân Z2 vẫn đúng

| Ô | w0 | w1 | graded 0,5 | Kết luận |
|---|---|---|---|---|
| ocean w1440 n10 | KHỚP Δkurt [0,22, 0,16, 0,03] | LỆCH R 0,37 | KHỚP [0,30, 0,17, 0,03] | Không-d0 là đúng (Z2) |
| test-pattern w1440 n05 | LỆCH Δcorr R-G 0,206 | KHỚP [0,27, 0,17, 0,27] / [0,004,…] | KHỚP sát nút Δcorr 0,104 | **CẦN d0**; graded không thay được nhị phân |
| test-pattern w1440 n10 | LỆCH Δcorr R-G 0,121 | KHỚP [0,32, 0,04, 0,25] | KHỚP | CẦN d0 |
| basgo w1440 n05 | KHỚP [0,15, 0,20, 0,11] | KHỚP y hệt (12/12 biến thể giống nhau từng số) | — | d0 không có tác dụng gì ở basgo |
| slovenska w1440 n05 | KHỚP [0,14, 0,05, 0,05] | KHỚP y hệt | — | d0 không có tác dụng gì ở slovenska |
| ocean w1920 n05 | KHỚP [0,11, 0,15, 0,04] | KHỚP [0,34, 0,16, 0,04] | KHỚP [0,25, 0,16, 0,04] | graded đơn điệu theo w ở R (0,11→0,34); w0 tốt nhất |

## 3. Phần 2 — hướng phụ render-P: nhiễu render theo công thức preview

Replica `addYuvNoise` (Node, RGB24 1280×720, strength 28/50, seed
12345 + seed 777 cho noise05) áp lên plain render Z2, viewport
trilinear, so với cùng snapshot preview.

| Ô (render-P, không-d0 / ĐK 2,5) | Δkurt [R,G,B] | Δcorr | stdRatio | Verdict |
|---|---|---|---|---|
| **ocean w1440 n05 seed 12345** | [0,04, **1,06**, 0,04] | [0,223, 0,070, 0,148] | [1,03, 1,17, 1,03] | **LỆCH** |
| **ocean w1440 n05 seed 777** | [0,00, **1,10**, 0,08] | [0,222, 0,074, 0,152] | [1,03, 1,18, 1,02] | **LỆCH** |
| ocean w1440 n10 seed 12345 | [0,02, 0,09, 0,00] | [0,087, 0,032, 0,059] | [1,02, 1,06, 1,03] | KHỚP |
| ocean w1920 n05 seed 12345 | [0,00, 0,15, 0,01] | [0,059, 0,025, 0,043] | [1,00, 1,03, 1,00] | KHỚP |
| test-pattern w1440 n05 (không-d0) | [0,03, 0,01, 0,20] | [0,010, 0,009, 0,017] | [0,98, 0,99, 0,96] | KHỚP |
| test-pattern w1440 n05 (luôn-d0 / ĐK) | [0,04, **0,41**, 0,20] | [**0,200**, 0,008, 0,007] | [0,98, 0,93, 0,97] | **LỆCH** |
| basgo w1440 n05 | [0,03, 0,09, 0,02] | [0,094, 0,026, 0,058] | [1,00, 1,05, 1,00] | KHỚP (cả 2 cách d0) |

Render kurt G ở ô target: **0,29** (seed 12345) / **0,25** (seed 777)
so với preview **1,35** — hai seed độc lập đồng thuận. Replica được
chứng thực là trung thực: trên 4/5 ô đối chứng, render-P khớp preview
tốt bằng hoặc hơn render method-T (Δkurt ≤ 0,15). Vì vậy công thức
cộng nhiễu **không phải** cơ chế gây lệch — Z2 §6.2 giả thuyết
est-chroma bị loại ở mức cơ chế duy nhất.

**Cảnh báo phụ (ghi nhận, không đổi quy tắc):** dưới render-P, áp d0
LÀM HỎNG test-pattern w1440 n05 (Δkurt G 0,41, Δcorr R-G 0,20) trong
khi dưới render method-T (pipeline render thật) d0 giữ nó KHỚP. Nghĩa
là lợi ích của d0 gắn với pipeline render hiện tại (ffmpeg noise),
không phải hiệu chỉnh phổ quát — đừng dùng render-P thay method-T làm
chuẩn đối chiếu mà không hiệu chuẩn lại d0.

## 4. Phần 3 — chẩn đoán: đuôi nặng là hỗn hợp phương sai

Script `r73a3-ocean-diag.mjs`: phân rã preview delta G và render delta
G theo bin (bão hoà, giá trị R, plainAbsDiff). Z2 đã giết kẹp rail
theo độ sáng; cắt mới này giết thêm kẹp gamut theo kênh.

| Bin plainAbsDiff | Tỉ lệ pixel | preview G: kurt / std | render G: kurt / std |
|---|---|---|---|
| [0, 1) | 19,1% | 0,32 / 9,01 | 0,27 / 9,14 |
| [1, 2) | 41,4% | 0,27 / 9,08 | 0,20 / 9,02 |
| [2, 4) | 17,5% | 0,31 / 9,24 | 0,21 / 8,94 |
| [4, 8) | 11,1% | −0,02 / 10,50 | 0,22 / 8,95 |
| [8, 256) | 10,9% | −0,29 / **18,64** | 0,27 / 8,61 |

Trong từng bin, preview delta G là Gauss gần như thuần (kurt ≈
0,2–0,3, khớp render). Đuôi nặng toàn cục là **hỗn hợp**: 11% pixel
mang std 18,64 (gấp đôi), 11% mang std 10,5, còn lại std ~9,1. Tính
trộn: phương sai toàn cục dự đoán 114,7 → std **10,71** (đo 10,69);
kurt dự đoán **1,53** (đo 1,35; chênh do bin thô + kurt/bin ~0,3).
Cả hai số lệch (stdRatio G 1,20 và Δkurt G 1,11) đều suy ra từ cùng
một fact này. Cắt theo bão hoà / giá trị R cũng cho kurt ~1,06–1,40
đều khắp các bin R ∈ [128, 256) (99% pixel) — không phải kẹp rail
hay kẹp gamut theo kênh.

## 5. Phần 4 — kiểm tra giả thuyết trôi khung (script r73a3-drift.mjs)

Vì phương sai thừa tập trung đúng ở pixel lệch-plain-nhiều (vùng
gradient cao, sóng chuyển động), giả thuyết ứng viên: snapshot noise05
chụp ở khung khác snapshot plain (seek ±1 frame). D1/D2 của Y2 chỉ
chứng minh lặp lại trong-cùng-variant (plain==plain2,
noise05==noise05b, MAD 0,000 cả 4 nguồn — đã kiểm lại từ JSON), KHÔNG
chứng minh plain và noise05 cùng khung.

- Plain preview khớp khung gốc nào nhất (MAD viewport, trilinear
  1 bước 1920→viewport): **f25 = 3,115**; f23 14,77, f24 12,94,
  f26 12,39, f27 12,68. Plain đúng là khung 25.
- Tương quan toàn cục corr(e = dP − dR, drift): G **0,135**
  (f25→f26), −0,142 (f24→f25); R/B ≤ |0,06|. Gần như không tương quan.
- Trong bin xấu nhất [8, 256): corr(e_G, D25−26) = **0,375**,
  corr(e_G, D24−25) = **−0,376** — nhưng hai trường trôi liên tiếp tự
  chúng đã phản tương quan **−0,37…−0,46** (chuyển động sóng gần
  Nyquist), nên cặp ±0,375 không đọc được thành trôi sạch. Phần
  phương sai thừa mà trôi giải thích được: ≈ (0,375·20,57)² ≈ 60
  trên tổng thừa ~267, tức **~20% trong bin xấu nhất, ~2% toàn cục**.
- **Kết luận: trôi khung CHẾT ở mức cơ chế chính.** Nhiều nhất là
  đóng góp phụ ở 11% pixel xấu nhất; phần lớn phương sai thừa
  (~80% trong bin đó) vẫn chưa giải thích được.

## 6. Kết luận

- **Ocean w1440 noise05: VẪN LỆCH, nợ CÒN.** Δkurt G tốt nhất đạt
  được trong toàn bộ luồng: **1,08** (local 9×9 T1,5) so với ngưỡng
  0,35; Δcorr R-G tốt nhất 0,218 (local T2,5) so với ngưỡng 0,12;
  stdRatio G tốt nhất 1,17 (render-P) so với ngưỡng 1,18 — chỉ
  stdRatio là chạm ngưỡng, hai chỉ số kia còn xa.
- **Đã loại trừ bằng số đo:** (1) mọi dạng điều kiện hoá delta0 theo
  absMAD — nhị phân, graded, theo kênh, theo vùng; (2) công thức cộng
  nhiễu est-chroma (render-P, 2 seed); (3) kẹp rail/kẹp gamut (bin độ
  sáng Z2 + bin bão hoà/R ở đây); (4) trôi khung ±1 frame ở mức cơ
  chế chính.
- **Đã xác lập:** lệch là hỗn hợp phương sai — 11% pixel (plain
  lệch-nhiều, gradient cao) mang preview std G gấp đôi. Trong từng
  bin, phân phối là Gauss; chỉ khi trộn mới sinh kurt 1,35. Đây là
  đặc trưng của ĐƯỜNG PREVIEW ở ô này (ocean × w1440 s=0,382 ×
  noise05), vì cả hai cách build render độc lập (ffmpeg noise,
  preview-formula noise) đều cho cùng chữ ký render kurt G 0,23–0,29.
- **Hướng còn lại cho đợt sau (chưa chứng minh):** (a) vì sao preview
  delta có phương sai gấp đôi đúng ở pixel gradient cao — ứng viên:
  downscale drawImage của Chrome ở s=0,382 tương tác với nhiễu theo
  cách phụ thuộc nội dung (kernel 2D thật vs mô hình tách trục — nợ
  Y8), hoặc video-path áp dụng khử răng cưa/làm mịn thích ứng;
  thí nghiệm: probe tổng hợp (gradient dốc + noise05, w1440) đo std
  delta theo gradient; (b) khẳng định cùng-khung bằng giao thức
  snapshot mới (tạm dừng video, đọc cùng một frame decode cho plain
  và noise — loại hẳn dư nghi trôi khung); (c) đo preview delta std
  theo thang s liên tục (0,38→0,63) trên ocean noise05 để xem phương
  sai thừa có biến mất ở s lớn không (w1920 đã KHỚP).

## 7. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Tái lập số Z2 (baseline w0/w1 ô target) | Δkurt G 1,12 cả hai — đúng Z2 (1,11, chênh do làm tròn) |
| `node --check` 3 script mới r73a3-*.mjs | OK |
| Part 1: 7 ô × 12 biến thể d0 (+3 nhạy 1-kernel ở target) | exit 0; JSON `r73a3-analysis.json` (part1) |
| Part 2: render-P 6 ô (2 seed ở target) | exit 0; frame tại `hidden_files/round73-a3/render-p/` |
| Part 3: diag bin (3 cắt × 5–6 bin) | exit 0; JSON `r73a3-ocean-diag.json` |
| Part 4: drift (5 khung gốc + 4 trường trôi) | exit 0; JSON `r73a3-drift.json` |
| plain==plain2, noise05==noise05b (kiểm lại từ JSON Y2) | MAD 0,000 cả 4 nguồn |
| Không chạy lại | tsc/vite build (không đụng TS/UI/production; chỉ thêm script `.mjs` + LIMITS — parent kiểm chứng gộp đợt sẽ chạy); capture headed mới (snapshot Y2 tái dùng) |

Lưu ý về file render-P: tên file không mang cửa sổ (`fullrgb-ocean-
noise05-p-seed12345.raw`) nên ô w1920 đã ghi đè ô w1440 — nhưng hai
frame này byte-identical theo cấu trúc (cùng plain C2, cùng strength
28, cùng seed 12345, nhiễu chỉ phụ thuộc plain+seed+strength), nên
không mất dữ liệu; verdict từng ô đã tính trong bộ nhớ trước khi ghi
đè và đã lưu trong JSON. Đợt sau nên đặt tên file có cửa sổ.

## 8. Nợ mở (trung thực)

1. **Ocean w1440 noise05 — VẪN LỆCH, nợ chính còn lại** (Δkurt G
   1,08–1,13 mọi biến thể, Δcorr R-G 0,22–0,24, stdRatio G 1,17–1,20).
   Cơ chế đã thu hẹp thành: phương sai thừa ×2 ở 11% pixel lệch-
   plain-nhiều; nguyên nhân của phương sai thừa đó chưa rõ.
2. Quy tắc điều kiện hoá delta0 nhị phân (Z2, ngưỡng 2,5) được củng
   cố, không thay bằng graded (graded 0,5 KHỚP sát nút ở test-pattern,
   biên mỏng hơn nhị phân).
3. d0 gắn với pipeline render method-T; nếu đổi chuẩn đối chiếu sang
   render-P thì phải hiệu chuẩn lại d0 (render-P + d0 làm hỏng
   test-pattern w1440 n05).
4. Nợ kế thừa chưa đụng: mô hình resample thích ứng theo thang; dư
   plain (~1,0–3,1 MAD, offset kênh B +2,28 ocean); w2560 full-pixel;
   GPU/Safari thật; `.github/workflows/` vẫn 403 (chờ user).

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/r73a3-d0cond.mjs` — Part 1 (13 biến thể điều kiện
  hoá delta0) + Part 2 (render-P: replica addYuvNoise verbatim).
- `apps/web/scripts/r73a3-ocean-diag.mjs` — Part 3: phân rã đuôi theo
  bin bão hoà / R / plainAbsDiff (phát hiện hỗn hợp phương sai).
- `apps/web/scripts/r73a3-drift.mjs` — Part 4: kiểm tra trôi khung
  với khung gốc f23–f27 ( + script kiểm tra phụ /tmp, không stage).
- `docs/PHASE9_ROUND73_A3_OCEAN_W1440_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / snapshot / JSON / frame
render): `hidden_files/round73-a3/` — `r73a3-analysis.json`,
`r73a3-ocean-diag.json`, `r73a3-drift.json`, `render-p/` (5 frame
noise render-P). Không sửa code production, không binary, không
workflow `.yml`.
