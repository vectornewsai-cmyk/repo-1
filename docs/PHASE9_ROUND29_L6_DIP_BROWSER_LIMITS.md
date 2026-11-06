# Phase 9 đợt 29, luồng L6 — Browser thật 1080p/4K cho dip + tổ hợp, và truy nguyên kênh G fadeblack

> Đóng nợ đợt 28 §3.7 (L6): click-test browser thật ở 1080p/4K; wiring
> DOM/offscreen của tổ hợp dip+mask/SR/track/blur trên browser; longtask
> dip 4K trên browser; clip ngắn cả 2 cửa sổ cùng active (alpha tích);
> fadeblack YUV kênh G dư số nhỏ chưa giải thích. Đo là chính; KHÔNG sửa
> code sản phẩm nào ngoại trừ 1 ghi chú comment mô tả badge (§5).
> Thang V6: KHỚP = MAD ≤ 2 VÀ ≥ 99% ≤ 8; XẤP XỈ = MAD ≤ 20 VÀ ≥ 90% ≤ 8;
> còn lại LỆCH. (B) = wiring đơn clip (model code sản phẩm vs tham chiếu
> độc lập); (A) = gap đơn-clip-vs-cặp (model vs xfade render).

## 0. Kết luận ngắn

1. **Browser thật 1080p + 4K: dip KHỚP.** Phiên browser chạy lại sau khi
   vá 3 lỗi harness của run1 (xem §1.3) cho kết quả cuối ở §1.2.
2. **Tổ hợp trên browser thật: dip composite đúng sau transform** —
   mask/SR/track đều KHỚP, vùng ngoài phủ đúng nền khung (10,12,16),
   dip KHÔNG vẽ ra ngoài vùng clip chiếm (out MAD 0,0000 cả 3 tổ hợp).
   Blur trên browser cũng KHỚP ở mức INFO (vạch di chuyển tổng hợp,
   MAD 0,676, ≤8 99,17% — scrub từng bước tích lũy đúng snapshot
   trailing; xem §1.2).
3. **Clip ngắn (alpha tích): wiring CHÍNH XÁC.** Với tham chiếu RGB
   sạch, (B) = 0,0000 ở mọi ô phẳng (15/15) + 1080p (3/3) và KHỚP trên
   footage (0,23/0/0). Quy tắc `alpha = bAlpha(p_in) × aAlpha(p_out)`,
   dip theo cửa sổ vào, đã khóa bằng code sản phẩm thật
   (`transitionClipVisual` + `singleClipDipPixel`), không phải cài lại.
   Nhưng (A) gap cặp của clip ngắn LỚN và tăng nhanh sau đầu vùng
   chồng: chỉ còn KHỚP ở localT = 0,6 (FW/FW phẳng 2,00; footage 1,56;
   FB/FB phẳng 1,00), rồi LỆCH từ localT = 0,75 trở đi (tới 248,33 với
   in fadeblack / out fadewhite) vì xfade thứ hai kéo về clip C trong
   khi preview đã sụp về dip thuần (alpha tích = 0 từ p_out ≥ ~0,20).
   Đây là giới hạn kiến trúc mới, đo đúng số lần đầu (xem §2).
4. **Kênh G fadeblack: ĐÃ TRUY NGUYÊN XONG, bằng số.** Dư số không phải
   do subsampling 420 (yuv444 cho cùng số tới 0,01), không phải do clip
   ở mức tối (bin sáng đồng ý trong 0,2; pattern clip-fraction không
   khớp pattern lệch), không phải do roundtrip chuyển đổi cuối (~−1,2
   đều 3 kênh, sai pattern). Cơ chế đúng: **đường YUV của xfade
   fadeblack cho chroma ra = 127 thay vì 128 ở mọi p** (fade thường cho
   đúng 128; chuyển đổi đầu vào trực tiếp cũng cho 128) — tức đây là
   hành vi riêng của implementation fadeblack trong FFmpeg, không phải
   của xfade nói chung. Qua bt601 limited→full, ΔCb = ΔCr = −1 ánh xạ
   thành ΔR ≈ −1,6 / ΔG ≈ +1,2 / ΔB ≈ −2,0 so với phần Y thuần; cộng
   phần Y thuần ≈ −12,0 được đúng signed footage p = 0,5
   (−13,68 / −10,67 / −14,09) tới ~0,1. Hằng số đơn −21,05 vẫn đúng cho
   R/B (offset suy ra −20,9/−21,6) nhưng lệch kênh G (~−16,3): muốn
   khớp từng kênh phải dùng offset theo kênh, không đổi verdict (đã
   KHỚP với hằng số đơn) nên KHÔNG đề xuất đổi code (xem §3, §5).
5. **Badge: giữ `matched` cho cả 3 type; đã bổ sung 2 giới hạn + 1 giới
   hạn mới vào ghi chú mô tả badge** trong `previewStatus.ts` (§5) —
   chỉ sửa comment, không đổi logic, không đổi tập matched.

## 1. Click-test browser thật 1080p/4K + tổ hợp + longtask

### 1.1 Harness và phương pháp

- Script mới: `apps/web/scripts/clicktest-dip-browser-round29-l6.mjs`
  (infra pipe CDP trích verbatim từ K3 đợt 27: Xvfb + Chrome headed
  `--remote-debugging-pipe`, click ruler thật, seed qua autosave,
  snapshot dist; phần đo viết mới). Display :99 / port 4199 (tránh
  luồng L5 đợt 29 đang chạy ở :97).
- Project dọc 1080×1920 và 2160×3840 (khớp footage K/L đợt 28); video
  phẳng sinh bằng FFmpeg ở đúng độ phân giải project (flat red/green/
  magenta/custom + vạch trắng di chuyển cho blur). Canvas preview thực
  tế 1352×633 ở cả 2 phiên (viewport wrap, dpr ≤ 2): scale 0,3297 ở
  1080p và 0,1648 ở 4K — đo so sánh trực tiếp pixel project→device
  và cả bản resampled (mirror đúng thứ tự app: dip trên canvas project
  rồi resample, như K3).
- Tổ hợp đo theo vùng phủ: điểm mẫu chỉ tính khi coverage = 1 (trong)
  hoặc = 0 (ngoài) theo đúng ngữ nghĩa preview (`maskAlphaAt` cho
  mask; nghịch đảo xoay/scale cho SR; hình bao dịch cho track); điểm
  biên feather/biên xoay bị bỏ qua, không tính vào MAD. Kỳ vọng ngoài
  = nền khung (10,12,16) — đo trực tiếp "dip có vẽ lọt ra ngoài không".
- Longtask: PerformanceObserver quanh scrub tới frame dip vs frame
  thường, như K3 — chỉ là cận trên (gồm seek/decode/rAF), không phải
  thời gian thuần vòng lặp dip.

### 1.2 Kết quả browser (run cuối, sau khi vá harness)

Run cuối (`benchmarks/results/v29-l6-dip-browser-fixed.json`):
**25/25 case chính KHỚP, exit = 0, 0 exception.** Canvas preview thực
1352×633 ở cả 2 phiên; resampled MAD = 0,0000 ở gần như mọi case dip
(trừ FB-OUT p = 0,1: 0,667 — vẫn KHỚP).

| Phiên / case | MAD trực tiếp | Ghi chú |
|---|---|---|
| 1080p sanity đỏ / xanh lá | 0,0000 / 0,0000 | |
| 1080p FW-OUT p = 0,1 / 0,5 | 0,245 / 0,000 | p = 0,5: alpha = 0 → trắng thuần |
| 1080p FW-IN p = 0,1 / 0,5 | 0,000 / 0,392 | p = 0,1: bAlpha = 0 (B chưa mở trước p = 0,122) → trắng thuần; p = 0,5 nhạy thật |
| 1080p FG-OUT / FG-IN p = 0,5 | 0,333 / 0,333 | |
| 1080p FB-OUT p = 0,1 / 0,5 | 0,521 / 0,000 | p = 0,1 nhạy thật (alpha 0,4491, blend trên nền khung); p = 0,5 đúng nền khung (10,12,16) |
| 1080p MASK-FW-IN p = 0,5 | 0,134 (trong 0,392 / ngoài 0,000) | n trong 9720, n ngoài 18630; appMean ngoài đúng (10,12,16) |
| 1080p SR-FW-IN p = 0,5 | 0,148 (trong 0,149 / ngoài 0,000) | n ngoài chỉ 190 (góc hẹp sau xoay 15° + scale 1,3) nhưng đúng nền tuyệt đối |
| 1080p TRACK-FW-IN p = 0,5 | 0,118 (trong 0,145 / ngoài 0,000) | n ngoài 5804 (dải trái + dưới do shift +0,1W/−0,1H) |
| 1080p SHORT-BOTH pIn 0,6 / pOut 0,1 | 0,222 (resampled 0,000) | playhead đúng 12,6; alpha tích 0,2253 — case nhạy thật trên browser |
| 1080p SHORT-BOTH pIn 0,767 / pOut 0,267 | 0,000 | vùng alpha tích = 0 → trắng thuần |
| 1080p BLUR-FW-IN p = 0,5 (INFO) | 0,676 (≤8 99,17%) | scrub từng bước đã tích lũy đúng snapshot trailing; 0,83% pixel > 8 nằm ở biên vạch di chuyển (pha frame/biên resample), không phải sai ngữ nghĩa |
| 4K: 2 sanity + FW/FG/FB (p = 0,1/0,5) | giống hệt 1080p từng chữ số (0,245 / 0,392 / 0,333 / 0,521 / 0,000) | không có bug phụ thuộc độ phân giải trong nhánh dip trên browser |

Longtask (cận trên gồm seek/decode/rAF, mỗi phiên 2 lần đo dip +
2 lần đo frame thường, đơn vị ms):

| Phiên | Dip longtask | Frame thường longtask |
|---|---|---|
| 1080p | 446; 64 + 317 | —; 78 |
| 4K | 1176; 712 | 97; 104 + 99 |
| (run1) 1080p | 382; 263 | 95 + 66; — |

Đọc đúng: longtask dip 4K (712–1176ms) lớn hơn hẳn frame thường
(~100ms) — vòng lặp ImageData toàn khung 2160×3840 (8,3M pixel) +
offscreen + decode 4K đều nằm trong cửa sổ longtask này, nhưng phép
đo này KHÔNG tách được phần nào là vòng lặp dip thuần; cấm trích
"dip 4K tốn ~1s" thành thời gian hàm. Ở 1080p, dip longtask
~260–450ms so với frame thường 0–95ms (cùng cảnh báo). Nợ longtask
dip 4K của đợt 28 nay đã có số browser thật (dạng cận trên).

### 1.3 Run1: 20/23 KHỚP — 3 ca không KHỚP đều là lỗi harness, đã vá

Run1 (`benchmarks/results/v29-l6-dip-browser.json`) cho 20/23 case
chính KHỚP; 3 ca còn lại đều đã xác định là lỗi phía đo, không phải
lỗi app, và đã vá trước run cuối:

1. **FB-OUT-custom-p05 (1080p + 4K), MAD 12,6667, ≤8 = 0%:**
   appMean đúng (10,12,16) = nền khung `#0a0c10` (`preview.tsx:1564`),
   kỳ vọng harness sai (0,0,0). Nguyên nhân: fadeblack đi đường alpha
   (không qua nhánh dip) nên clip vẽ bằng globalAlpha lên nền khung,
   không phải lên nền đen 0. 12,6667 = (10+12+16)/3 đúng từng chữ số.
   Vá: kỳ vọng mode black = `alpha·clip + (1−alpha)·(10,12,16)`.
   Bổ sung thêm case FB-OUT p = 0,1 (alpha ≈ 0,449, nhạy thật) ở run cuối.
2. **BLUR-FW-IN-p05 FAIL (control video error):** file
   `bar-moving.mp4` trong snapshot là file 0 byte — lần chạy đầu
   (drawbox) lỗi eval nhưng ffmpeg đã tạo file rỗng, lần chạy sau chỉ
   kiểm tra tồn tại nên không tạo lại. Vá: coi file 0 byte là chưa có
   (tạo lại); đồng thời đổi cách sinh vạch từ drawbox (không có biến
   `n` — lỗi eval đã chứng minh) sang overlay hộp trắng PNG với
   `x='mod(n*30,880)'` (overlay có `n`; đã verify 180 frame, vạch di
   chuyển thật).
3. **SHORT-BOTH ở target 12,75 chỉ kiểm tra vùng alpha = 0:**
   click snap thành playhead 12,7667 (pOut = 0,2667 > 0,196 nên
   aAlpha = 0, alpha tích = 0 → trắng thuần, MAD 0,0000 nhưng không
   nhạy). Vá: thêm case target 12,6 (localT = 0,6 đúng frame,
   alpha tích 0,2253 nhạy thật) ở run cuối.

## 2. Clip ngắn cả 2 cửa sổ cùng active (Node/FFmpeg, giao thức R28)

Script mới: `server/render/src/measure_r29_l6_dip_shortclip_gchan.js`
(chế độ `--short`). Model dùng CHÍNH `transitionClipVisual` (alpha
tích + dipMode theo cửa sổ vào) và `singleClipDipPixel`; tham chiếu
FFmpeg độc lập cho cùng mô hình đơn clip; (A) = chuỗi xfade kép
A(4s)→B(1,5s)→C(4s), mỗi xfade 1s (xfade1 offset 3, xfade2 offset 3,5;
vùng chồng của B là localT ∈ [0,5, 1)).

### 2.1 (B) wiring: chính xác tới 0,0000 với tham chiếu RGB sạch

Lần chạy đầu dùng overlay mặc định của FFmpeg (chuyển qua yuv420p)
cho 1 ô XẤP XỈ: FG/FW localT = 0,6 MAD 2,3333 (các ô còn lại KHỚP,
footage 0,9893). Chẩn đoán: cùng case đó với overlay `format=rgb`
cho đúng 0,0000 — 2,33 là nhiễu yuv của pipeline tham chiếu (cùng họ
nhiễu 0,1–2,5 MAD đã ghi ở R28 §1d: geq cắt ngắn gray 42,33→42 +
overlay yuv). Sau khi vá tham chiếu sang `format=rgb`, chạy lại
(`v29-l6-dip-shortclip-rgbref.json`):

| Nhóm | (B) |
|---|---|
| Phẳng 720×1280, 5 combo in/out × 3 localT | 0,0000 cả 15 ô |
| Phẳng 1080×1920, FW/FW × 3 localT | 0,0000 cả 3 ô |
| Footage K→L(ngắn)→J, FW/FW × 3 localT | 0,2259 / 0,0000 / 0,0000 KHỚP |

Combo in/out gồm FW/FW, FG/FW, FW/FG, FB/FB và FB/FW (trường hợp
thú vị: cửa sổ vào là fadeblack nên preview đi đường alpha thuần
ngay cả khi cửa sổ ra là fadewhite — model alpha·clip vẫn KHỚP
0,0000, đúng ngữ nghĩa "dipMode theo cửa sổ vào").

### 2.2 (A) gap cặp: nhỏ ở đầu vùng chồng, phình nhanh sau đó

| Combo phẳng | localT 0,6 | localT 0,75 | localT 0,9 |
|---|---|---|---|
| FW/FW | 2,00 KHỚP | 6,67 LỆCH (≤8 66,7%) | 17,67 LỆCH |
| FG/FW | 123,00 LỆCH | 206,33 LỆCH | 195,33 LỆCH |
| FW/FG | 59,00 LỆCH | 143,00 LỆCH | 150,00 LỆCH |
| FB/FB | 1,00 KHỚP | 11,33 LỆCH (≤8 33,3%) | 33,33 LỆCH |
| FB/FW | 139,33 LỆCH | 248,33 LỆCH | 237,33 LỆCH |

Footage FW/FW: 1,56 KHỚP (0,6) → 8,62 LỆCH (0,75) → 23,89 LỆCH (0,9).
Cơ chế: ở localT = 0,6, xfade thứ hai mới ở p₂ = 0,1 (còn chủ yếu là
kết quả xfade thứ nhất) nên cặp ≈ đơn clip; từ localT = 0,75,
p₂ = 0,25–0,4 kéo mạnh về clip C trong khi preview đã sụp về dip
thuần vì aAlpha(p_out) = 0 từ p_out ≈ 0,20 (trọng số A tắt hẳn) —
alpha tích = 0 nên preview là trắng/đen/xám thuần, còn render vẫn
mang nội dung B+C. Với FG/FW và FB/FW, gap còn lớn ngay từ 0,6 vì
dip xám/đen của preview khác hướng với dip trắng của xfade thứ hai.
**Kết luận:** clip ngắn là trường hợp gap đơn-clip-vs-cặp tệ nhất
của họ fade (tới ~248 MAD, vượt xa ~46–52 của clip thường và ~128
của mask+fadewhite) — đã ghi vào ghi chú badge (§5). Không phải lỗi
wiring: (B) = 0,0000 chứng minh preview vẽ đúng mô hình đơn clip của
nó; gap là hệ quả của kiến trúc đơn clip khi 2 xfade chồng nhau.

## 3. Truy nguyên kênh G fadeblack (Node/FFmpeg)

Script: cùng file trên, chế độ `--gchan`
(`benchmarks/results/v29-l6-dip-gchan.json`).

### 3.1 Số đo gốc (footage, p = 0,5, sweep n = 31..59)

- Signed pairYUV − pairRGB tại p = 0,5 (KL và JL cho cùng số tới 4
  chữ số, vì chỉ phụ thuộc clip B = L): **R −13,6812 / G −10,6748 /
  B −14,0947** — tái tạo đúng dư số đợt 28 §6 (G ~−10,7 so với R/B
  ~−13,7; B ở đây −14,09).
- Fit slope LSQ qua gốc theo m = dip.a + dip.b trên 29 p:
  KL: c_R = −13,77 / c_G = −11,19 / c_B = −14,87;
  JL: c_R = −14,06 / c_G = −11,59 / c_B = −15,43.
  (Slope này là thống kê mô tả của hiệu pairYUV−pairRGB, KHÔNG phải
  hằng số thay thế cho yuvLevelOffset −21,05 của model cặp — xem
  §3.3 về cách quy đổi đúng.)
- Offset suy ra tại p = 0,5 (signed ÷ m, m = 0,6534):
  **R −20,9 / G −16,3 / B −21,6**, so với hằng số đơn −21,05:
  R và B khớp trong ~0,5; **G lệch +4,7** — đó chính là dư số cần
  giải thích, và nó nằm ở kênh G, không phải ở R/B.

### 3.2 Loại trừ có hệ thống, rồi cơ chế đúng

| Giả thuyết | Kiểm tra | Kết quả |
|---|---|---|
| Subsampling chroma 420 | yuv444 vs yuv420p, cùng frame | **Loại:** phẳng trung gian [−15,−11,−14] cả hai; footage 444 [−13,6669,−10,6807,−14,0801] ≈ 420 [−13,6812,−10,6748,−14,0947] (sai khác ≤ 0,02) |
| Clip ở mức tối | Bin theo luma tại p = 0,5 | **Loại:** bin 0–64 [−13,664,−10,668,−14,083] ≈ bin 64–128 [−13,843,−10,738,−14,204] (sai khác ≤ 0,2); clip-fraction loR 4,88% / loG 3,75% / loB 1,84% không khớp pattern lệch (B clip ít nhất nhưng lệch lớn nhất) |
| Roundtrip chuyển đổi cuối | yuv420p roundtrip của chính frame RGB | **Loại:** [−1,0535,−1,2715,−1,1673] — nhỏ (~1,2) và đều 3 kênh, sai pattern (G còn âm hơn R) |
| Phẳng bão hòa che hiệu ứng | Phẳng trung gian (180,120,60)→(60,120,180) và xám (200→100) | **Xác nhận:** phẳng nguyên sắc cho ~0/−1 do lượng tử hóa (đỏ mất 1 mức do Cr 240→254,4), còn phẳng trung gian tái tạo đúng pattern: [−15,−11,−14] và xám [−15,−12,−15] |

**Cơ chế đúng (đo trực tiếp trên mặt phẳng YUV):** ở p = 0,5, frame
xám 200→100 qua đường fadeblack YUV cho **Y = 34, U = 127, V = 127**
(trong khi chuyển đổi trực tiếp cho 128/128, và fade thường cũng cho
128/128 — tức −1 chroma là riêng của implementation fadeblack, xuất
hiện ở mọi p đã đo: n = 35/40/45/50/55 đều U = V = 127). Qua bt601
limited→full, ΔCb = ΔCr = −1 ánh xạ thành ΔR ≈ −1,6 / ΔG ≈ +1,2 /
ΔB ≈ −2,0 so với phần Y thuần. Phân rã signed footage:
phần Y thuần ≈ −12,0 + phần chroma (−1,6 / +1,2 / −2,0)
= (−13,6 / −10,8 / −14,0), khớp số đo (−13,68 / −10,67 / −14,09)
tới ~0,1. Trên phẳng xám: Y = 34 (limited) → RGB ≈ 21, chroma 127 →
(19, 22, 19) đúng từng mức so với đường RGB (34, 34, 34).
**Kết luận:** dư số kênh G đã giải thích xong — không còn "dư số nhỏ
chưa giải thích" cho fadeblack. Không đổi verdict, không đổi hằng số
model (xem §3.3).

### 3.3 Có nên đổi yuvLevelOffset sang theo kênh không?

Không (cho đợt này). Hằng số đơn −21,05 đã cho corrected KHỚP ở
đợt 28 (fadeblack vào p = 0,5: gapYUV 14,18 → corrected 1,79). Offset
theo kênh suy ra (−20,9 / −16,3 / −21,6) chỉ cải thiện thêm kênh G
một chút và sẽ làm code model phức tạp hơn (offset vô hướng thành
vector) vì một dư số ~3 mức ở một kênh — không đáng đổi khi verdict
đã KHỚP. Ghi nhận ở đây để luồng sau muốn tinh chỉnh thì có số:
muốn khớp từng kênh thì dùng offset vector (−20,9, −16,3, −21,6)
thay cho scalar −21,05 (áp cho cùng số hạng m = dip.a + dip.b).

## 4. Tổ hợp Node ở 1080p (đối chiếu với 720p đợt 28)

Script: `server/render/src/measure_r29_l6_dip_combo_1080.js` (bản sao
harness đợt 28 L6, chỉ đổi COMBO_W/H sang 1080×1920; chế độ `--combo`;
`benchmarks/results/v29-l6-dip-combo-1080.json`). Kết quả p = 0,5,
cặp K→L; viết tắt FW/FG, (B)/(A) như trước (sanity = transform không
dip; so sánh với 720p đợt 28 trong ngoặc).

| Tổ hợp | Sanity ra / vào | (B) FW ra / vào | (B) FG ra / vào | (A) FW ra / vào | (A) FG ra / vào |
|---|---|---|---|---|---|
| mask-rect | 0,61 / 0,55 KHỚP (0,47/0,56) | 0,09 / 0,65 KHỚP | 0,34 / 0,66 KHỚP | 117,66 / 106,87 LỆCH (= 720p) | 21,64 / 23,91 LỆCH (≈ 21,87/23,98) |
| mask-ellipse | 0,49 / 0,44 KHỚP (0,38/0,45) | 0,07 / 0,51 KHỚP | 0,25 / 0,52 KHỚP | 127,69 / 119,56 LỆCH (= 720p) | 17,60 / 19,38 LỆCH (≈ 17,78/19,43) |
| SR 1,3× + 15° | 1,51 / 1,81 KHỚP (1,26/1,90) | 0,11 / 1,94 KHỚP | 1,03 / 2,21 XẤP XỈ | 44,34 / 2,10 XẤP XỈ (≈ 44,36/2,15) | 54,97 / 60,58 LỆCH (≈ 55,52/60,83) |
| track +80,−40 | 2,38 / 2,26 XẤP XỈ (2,02/2,16) | 0,00 / 1,93 KHỚP | 2,14 / 2,68 XẤP XỈ | 56,69 / 15,95 XẤP XỈ (720p: 61,81/23,54) | 47,43 / 50,86 LỆCH (≈ 46,07/49,26) |
| motion blur tmix×3 | 0,00 / 0,00 KHỚP (= 720p) | 0,00 / 1,69 KHỚP | 0,82 / 1,69 KHỚP | 46,15 / 0,25 KHỚP (= 720p) | 41,18 / 41,60 LỆCH (≈ 41,53/41,93) |

Đọc đúng:

- **(B) tổ hợp ở 1080p = 720p về verdict** (20/20 ô KHỚP hoặc XẤP
  XỈ, không ô nào LỆCH) — wiring dip sau transform không phụ thuộc
  độ phân giải.
- **(A) mask/SR/blur ở 1080p ≈ 720p tới ~0,5 MAD** (vì mask/SR/blur
  dùng tọa độ tương đối hoặc trung bình frame) — gap cặp của tổ hợp
  không phụ thuộc độ phân giải khi transform là tương đối.
- **Ngoại lệ duy nhất có lý do: track.** (A) FW vào giảm 23,54 →
  15,95 vì shift track là pixel tuyệt đối (+80,−40): diện tích không
  phủ giảm từ 13,9% (720p) xuống 9,3% (1080p), tỉ lệ 0,67; 23,54 × 0,67
  = 15,8 ≈ 15,95 đo được. Đây cũng là đối chứng nội bộ rằng lần chạy
  này đúng là ở 1080×1920 (chứ không phải chạy nhầm 720p): chỉ có
  track đổi theo đúng tỉ lệ diện tích, các tổ hợp tương đối đứng yên.
- Sanity track XẤP XỈ 2,38/2,26 (so với 2,02/2,16 ở 720p) vẫn là nhiễu
  roundtrip yuv của bước overlay trong pipeline tham chiếu (≤8 ≥
  99,99%), không phải lỗi model — shift nguyên pixel là chính xác.

## 5. Badge: giữ matched + bổ sung giới hạn (comment duy nhất)

File badge: `apps/web/src/components/transitions/previewStatus.ts`
(khối comment của `"fadewhite", "fadegrays"` trong
`TRANSITION_MATCHED` — đây là nơi duy nhất mô tả giới hạn của badge;
nhãn UI chỉ là chuỗi `previewBadge.matched/approx/none` trong i18n,
không có mô tả riêng từng type). Thay đổi: **chỉ thêm 1 đoạn ghi chú
vào comment J3** (không đổi logic, không đổi tập matched):

- (i) Đường YUV của render bão hòa về trắng/đen thuần ở p ≈ 0,17–0,27
  (đợt 28 §3.2) — canvas RGB đúng model hơn ở đó, không được "sửa"
  canvas cho khớp render đã clip.
- (ii) Clip có mask/track/SR: gap preview-vs-render lớn hơn clip
  thường vì dip render phủ toàn khung còn dip canvas chỉ trong vùng
  clip chiếm (đợt 28: mask+fadewhite (A) tới ~128, track+fadewhite
  ~62, so với ~46 không tổ hợp; đợt 29 xác nhận wiring (B) của các
  tổ hợp này KHỚP trên browser thật — gap (A) là giới hạn kiến trúc,
  không phải lỗi wiring).
- (iii) Mới đợt 29: clip ngắn (2 cửa sổ cùng active): gap (A) tăng
  nhanh sau đầu vùng chồng, tới ~248 MAD (FB/FW), vì preview sụp về
  dip thuần khi alpha tích = 0 trong khi render vẫn mang nội dung
  B+C qua xfade thứ hai.

## 6. Chưa đo / nợ còn lại (không mạo nhận)

- Blur trên browser đã đo được ở run cuối (INFO, KHỚP 0,676 — §1.2),
  nhưng chỉ trên vạch di chuyển tổng hợp, chưa phải footage thật có
  chuyển động phức tạp; 0,83% pixel > 8 ở biên vạch chưa phân tích sâu
  (pha frame/biên resample). Bằng chứng Node tmix ≡ trailing-avg
  0,0000 của đợt 28 vẫn đứng.
- Safari / máy thật / dpr > 1 / viewport khác: toàn bộ đo trên
  Chromium headed VM, dpr ≤ 2, cửa sổ 1920×1200.
- Baseline nguồn frame footage động (K3 §4.4, đã làm sạch ở đợt 28
  L1): các case browser ở đây dùng phẳng/tĩnh nên không dính baseline
  này; claim preview-vs-render trên footage động vẫn phải trừ baseline.
- Số longtask là cận trên (gồm seek/decode/rAF), không phải thời gian
  thuần vòng lặp dip; số Node (1080p 18–108ms, 4K 75–374ms, đợt 28)
  không được trích thành số browser.
- Offset theo kênh §3.3 là số đo, chưa nối vào code model (cố tình
  không đổi vì verdict đã KHỚP).

## 7. Kiểm chứng và file đổi/thêm

- `node --check` cả 3 script đo mới: pass.
- Browser: xem §1.2 (run cuối) + run1 `v29-l6-dip-browser.json`
  (20/23, 3 ca lỗi harness đã vá và giải thích ở §1.3).
- Node short: 2 lần chạy (overlay mặc định + overlay format=rgb);
  số cuối lấy từ lần format=rgb.
- Node gchan: sweep 29 p × 2 cặp phẳng + 2 cặp footage; probe đối
  chứng 444/420, bin luma, clip-fraction, roundtrip, mặt phẳng YUV.
- KHÔNG push GitHub, KHÔNG ghi qua GitHub connector, KHÔNG
  release/tag, KHÔNG binary vào repo (video + snapshot chỉ ở
  `~/workspace/tmp-round29-l6/` ngoài repo; workdir đo đã xoá, còn
  footage + logs; trong repo không còn file .raw nào). KHÔNG sửa
  `App.tsx`, `store.ts`, i18n. KHÔNG tự ghi file paths-loop, KHÔNG
  ghi build-loop-log (parent lo).

File đổi/thêm (text, không binary — parent gộp batch):

- Mới: `apps/web/scripts/clicktest-dip-browser-round29-l6.mjs` — click-test browser 1080p/4K + tổ hợp + short + longtask (infra trích từ K3).
- Mới: `server/render/src/measure_r29_l6_dip_shortclip_gchan.js` — đo clip ngắn + kênh G (chế độ --short / --gchan).
- Mới: `server/render/src/measure_r29_l6_dip_combo_1080.js` — tổ hợp dip ở 1080p (bản sao harness đợt 28, đổi COMBO_W/H).
- Mới: `docs/PHASE9_ROUND29_L6_DIP_BROWSER_LIMITS.md` — file này.
- Mới: `benchmarks/results/v29-l6-dip-browser.json` — browser run1 (20/23, lỗi harness đã ghi).
- Mới: `benchmarks/results/v29-l6-dip-browser-fixed.json` — browser run cuối (sau vá).
- Mới: `benchmarks/results/v29-l6-dip-shortclip.json` — short, lần overlay mặc định.
- Mới: `benchmarks/results/v29-l6-dip-shortclip-rgbref.json` — short, lần overlay format=rgb (số cuối).
- Mới: `benchmarks/results/v29-l6-dip-gchan.json` — kênh G (fit + p = 0,5 + bin).
- Mới: `benchmarks/results/v29-l6-dip-combo-1080.json` — tổ hợp Node 1080p.
- Sửa: `apps/web/src/components/transitions/previewStatus.ts` — chỉ thêm ghi chú vào comment J3 (§5), không đổi logic.

Không sửa code sản phẩm khác (không file `src/` nào đổi ngoài comment badge trên).
