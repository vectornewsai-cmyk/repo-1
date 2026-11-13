# PHASE 9 ĐỢT 74 — LUỒNG B1: OCEAN w1440 noise05 — CƠ CHẾ ĐÃ TÌM RA
## (RÒ PLAIN DO 2 CHUỖI DOWNSCALE KHÁC NHAU) + PROBE TỔNG HỢP + CÙNG-KHUNG + QUÉT s

**Ngày:** 09/11/2026 · **Nợ:** đợt 73 §4 mục 1 / A3 §6 (ocean w1440
noise05 LỆCH thật: Δkurt G 1,11, Δcorr R-G 0,242, stdRatio G 1,20; đuôi
nặng là hỗn hợp phương sai — 11% pixel gradient cao mang preview std G
18,64 thay vì ~9,0; delta0-absMAD không cứu, Δkurt G tốt nhất 1,08).
**Kết quả tóm tắt — đọc trước:**

1. **CƠ CHẾ ĐÃ TÌM RA — rò plain do preview dùng 2 chuỗi downscale
   khác nhau cho plain và noise (preview.tsx).** Khi clip KHÔNG có canvas
   effect, preview vẽ thẳng video element xuống viewport trong **1 bước**
   (1920×1080 → 489×275); khi CÓ effect (noise), video phải qua effect
   canvas 1920→1280 rồi mới xuống viewport (**2 bước**). Delta preview do
   đó chứa số hạng rò plain `L = D2(D1(V)) − D_main(V)` mà render không
   có: bằng 0 với nội dung trơn, lớn ở nội dung tần số cao. Kiểm chứng
   định lượng: phần dư `(dP − dR_sameSeed)` tương quan với `−plainDiff`
   tới **corr 0,993 (dải E sine, 1920), 0,824 (dải D checker), 0,917 toàn
   khung**, slope 0,64–0,89 (slope < 1 do `−plainDiff` chỉ là xấp xỉ của
   L — trilinear/ffmpeg thay cho kernel thật của Chrome). Đây là **lỗi
   preview thật** (không phải artefact đo): mọi media lớn hơn project
   (ocean/basgo/slovenska đều 1920×1080 trong project 1280×720) đều chịu
   rò này khi bật canvas effect; mức độ nặng nhẹ tùy nội dung (ocean
   nhiều tần số cao nhất nên LỆCH, basgo/slovenska KHỚP).
2. **Probe tổng hợp (gradient dốc + noise05) XÁC NHẬN ở mức hiện tượng
   và LOẠI giả thuyết gradient thuần.** Video 1280×720 native: preview
   std G PHẲNG theo gradient (8,7–9,9 ở s=0,382, varRatio 0,96–1,03 ở
   dải A/B/C) — không tái hiện mức thừa ×2 của ocean. Cùng nội dung
   nhưng video **1920×1080** (phải pre-downscale trước khi cộng noise):
   dải D checker varRatio **2,57** (prevStdG 14,50 vs render-P 9,04),
   dải E sine varRatio **4,18** (17,54 vs 8,58). Chỉ khác đường đi của
   plain (pre-downscale) mà excess xuất hiện — đúng dự đoán của rò plain.
3. **Giao thức cùng-khung KHẲNG ĐỊNH 11/11 cặp** plain/noise05 dùng
   đúng cùng một frame decode (raw frame hash + currentTime khớp;
   hash tái hiện y hệt giữa các lần chạy). Giả thuyết trôi khung CHẾT
   hẳn ở mức giao thức (A3 mới loại ở mức cơ chế chính).
4. **Quét thang s liên tục (7 điểm phân biệt, 0,243 → 1,382):** Δkurt G
   1,14 → 1,12 → **0,24 (s=0,521, KHỚP)** → 0,15 → 0,15 → 0,04 → 0,02;
   slope −1,122/đơn vị s. B1 tái hiện đúng số Y2/A3 ở 2 điểm chung
   (ΔkurtG 1,12 và 0,15 — khớp từng số). **Nhưng excess ở bin xấu nhất
   KHÔNG biến mất theo s** (Part D): std preview bin [8,256) vẫn
   14,2–21,4 ở mọi s; Δkurt toàn cục sụp chỉ vì std nền tăng theo s
   (9,0 → 14,9) làm tỉ lệ hỗn hợp giảm (2,07× → 1,41×).
5. **Không sửa production trong luồng này.** Đã có đủ bằng chứng để nêu
   chính xác cách sửa + giao thức kiểm chứng (xem §8), nhưng sửa đường
   render preview chạm mọi frame preview nên thuộc luồng riêng (cần hồi
   quy đầy đủ + đo FPS). Nợ ocean w1440 chuyển trạng thái từ "chưa rõ
   cơ chế" sang "đã rõ cơ chế, chờ sửa + kiểm chứng".

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
**KHÔNG push, KHÔNG release/tag.** Mọi số dưới đây là đo thật (Node
v24.22.1; ffmpeg 8.1.2; Chromium 1254 headed qua Xvfb; snapshot headed
B1 mới, KHÔNG tái dùng snapshot Y2 trừ 2 điểm đối chứng quét s).
Ngưỡng verdict như Z2/A3: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12. Probe/log/JSON tại `hidden_files/round74-b1/`, log
luồng `hidden_files/round74-b1.md`.

---

## 1. Bối cảnh và câu hỏi

A3 đã thu hẹp lệch ocean w1440 noise05 thành một fact: phương sai thừa
tập trung ở 11% pixel lệch-plain-nhiều (preview std G 18,64 thay vì
~9,0), và đề xuất 3 hướng cho đợt sau (A3 LIMITS §6): (a) probe tổng
hợp (gradient dốc + noise05, w1440) đo std delta theo gradient; (b)
khẳng định cùng-khung bằng giao thức snapshot mới; (c) đo preview delta
std theo thang s liên tục (0,38→0,63) trên ocean noise05. Luồng này làm
cả 3, cộng 2 follow-up nảy sinh từ kết quả: (D) phân rã bin ocean theo
mọi s; (A2) probe gradient 1920×1080; (corr/leak) tương quan delta
preview vs render-P cùng-seed và kiểm chứng rò plain.

Thiết lập đo: harness mới `r74b1-headed-capture.mjs` (dựa trên Y2: vite
dev + Xvfb + Chromium 1254 headed + CDP, seed project qua localStorage,
import media bằng DOM.setFileInputFiles, effects qua store.patchClip,
playhead 1.0; khác Y2: nguồn/variant/cửa sổ cấu hình qua env, cổng
557x/967x riêng, thêm giao thức cùng-khung §2). Seed noise preview tại
localT=1.0: `0x9e3779b9 ^ floor(1.0*30) = 2654435751` (effectCanvas.ts
`canvasEffectOps`) — replica render-P dùng đúng seed này (cùng
realization) + seed 12345 đối chứng thống kê. Hàm delta0/channelStats/
fullDeltaStats/absMad/RNG/addYuvNoise sao chép VERBATIM từ
r73a3-d0cond.mjs; resample trilinear từ chrome-resample.mjs (đã gồm fix
blend-at-end của A1).

## 2. Phần 1 — probe tổng hợp: gradient dốc + noise05 (script r74b1-analyze.mjs)

Video tổng hợp `gradient.mp4` 1280×720 @30fps, tĩnh hoàn toàn (frame 0
vs frame 30 MAD 0,0000), 5 dải ngang (đo trên frame đã decode):
A phẳng 128 (|gx| 0); B ramp ngang 0→255 (|gx| 0,20/px); C răng cưa
chu kỳ 128px (|gx| 3,75/px); D checkerboard khối 2×2 0/255 (|gx|,|gy|
127/px); E sine dọc chu kỳ 8px (|gy| 54/px). Capture headed plain/
plain2/noise05(+noise05b) ở w1440 (s=0,382) và w1920×1080 (s=0,632).

### 2.1 Theo dải (preview std G vs render-P cùng-seed)

| Dải (gradient) | w1440: prev / render-P / varRatio | w1920: prev / render-P / varRatio |
|---|---|---|
| A phẳng (~0) | 8,95 / 9,12 / **0,96** | 13,22 / 13,48 / **0,96** |
| B ramp (~0,20) | 8,70 / 8,87 / **0,96** | 12,71 / 12,96 / **0,96** |
| C răng cưa (~3,75) | 8,73 / 8,84 / **0,98** | 12,78 / 12,94 / **0,98** |
| D checker (~127) | 9,60 / 5,99 / **2,57** | 16,12 / 9,21 / **3,06** |
| E sine dọc (~54) | 9,24 / 8,44 / **1,20** | 13,46 / 12,41 / **1,18** |

### 2.2 Theo bin |gradient| của preview plain (viewport, kênh G)

| Bin | w1440: prev / render-P / varRatio | w1920: prev / render-P / varRatio |
|---|---|---|
| [0, 0,5) | 9,05 / 8,67 / 1,09 (n=55.212) | 13,29 / 12,83 / 1,07 (n=180.183) |
| [0,5, 2) | 8,94 / 8,86 / 1,02 | 12,90 / 12,72 / 1,03 |
| [2, 8) | 8,79 / 8,61 / 1,04 | 12,85 / 12,77 / 1,01 |
| [8, 32) | 9,14 / 6,02 / **2,31** | 15,99 / 9,51 / **2,83** |
| [32, 256) | 9,89 / 6,22 / **2,53** | 16,76 / 9,18 / **3,33** |

**Đọc:** preview std G gần như PHẲNG theo gradient (8,7–9,9 ở s=0,382;
chỉ +7% ở checker cực đoan) — **không tái hiện mức thừa ×2 của ocean**.
VarRatio lớn ở bin cao là do **render-P RỚT** (std 8,67→6,22 ở
s=0,382; kurt render-P vọt 2,66 ở dải D) chứ không phải preview tăng.
Verdict toàn khung vs render-P: LỆCH cả 2 cửa sổ (Δkurt G 0,42 ở
w1440 / 0,27 ở w1920; Δcorr R-G 0,107 / 0,157) — lệch này là lỗi của
mô hình trilinear ở nội dung Nyquist (xem §7.3), không phải cơ chế
ocean. plainAbsMad gradient: 2,727 (w1440) / 2,983 (w1920).

### 2.3 Theo pha downscale (8 bin, phase = frac((x+0,5)/s))

Dải phẳng A ở s=0,382: preview std G theo pha
[8,89, 9,57, 8,83, 8,78, 8,72, 8,78, 8,89, 9,14] — render-P
[9,04, 9,66, 9,03, 8,99, 8,90, 8,95, 9,06, 9,34]: **cùng mẫu, cùng
biên (±5%)**. Ở s=0,632 cả hai cùng có gù pha (đỉnh bin 4: preview
14,93 / render-P 15,03, biên ±10%). Pha là tính chất chung của cả hai
bộ lọc downscale, KHÔNG phải cơ chế riêng của preview, và biên của nó
(≤10%) xa mức thừa ×2 cần giải thích.

## 3. Phần 2 — giao thức snapshot khẳng định cùng-khung

Trước mỗi snapshot preview, harness đọc frame decode thô của chính
`<video>` element qua `window.__vcutMediaEls` (chỉ công bố ở nhánh
playing — harness phát 1 nhịp ngắn bằng `store.togglePlay` rồi dừng
lại để công bố, sau đó setPlayhead(1.0) + chờ idle như thường),
drawImage(video) ra offscreen canvas native-size, băm FNV-1a + mean +
trạng thái element (currentTime/paused/seeking/readyState).

**Kết quả: D3 pass 11/11 lượt chạy (35/35 case headed pass).** Mọi cặp
plain/noise05 đều cùng hash + cùng currentTime=1, paused=true,
seeking=false, readyState=4. Hash tái hiện y hệt giữa các lần chạy
độc lập: gradient `1abb07e5`, ocean `5c9f9de4`, gradient1920
`8eeb3123`. D1 (plain 2 lần pixel-identical) và D2 (noise05 2 lần
pixel-identical) cũng pass mọi lượt. **Giả thuyết trôi khung CHẾT ở
mức giao thức** — plain và noise05 chắc chắn cùng một frame decode;
dư nghi A3 §5 ("D1/D2 không chứng minh plain và noise05 cùng khung")
đã được đóng.

## 4. Phần 3 — quét thang s liên tục trên ocean noise05

8 cửa sổ B1 (1280×800 → 2880×1620) + 2 điểm Y2 làm đối chứng. Lưu ý
layout: w1600×900 cho cùng rect 489×275 với w1440×900 (canvas chững
ở H=900); w1920×1080 cho cùng rect 809×455 với Y2 w1920×900 — tổng
cộng **7 điểm s phân biệt**: 0,243 / 0,382 / 0,521 / 0,632 / 0,882 /
1,132 / 1,382. Render dùng frame Z2 có sẵn (method-T), resample
trilinear về đúng rect từng điểm; d0 không áp ở điểm nào (plainAbsMad
2,58–3,29 > 2,5).

| s | rect | Δkurt G | Δcorr R-G | stdRatio G | Verdict |
|---|---|---|---|---|---|
| 0,2431 | 311×175 | 1,14 | 0,254 | 1,21 | LỆCH |
| 0,3819 | 489×275 | 1,12 | 0,239 | 1,19 | LỆCH |
| 0,5208 | 667×375 | 0,24 | 0,085 | 1,07 | KHỚP |
| 0,6319 | 809×455 | 0,15 | 0,061 | 1,05 | KHỚP |
| 0,8819 | 1129×635 | 0,15 | 0,073 | 1,06 | KHỚP |
| 1,1319 | 1449×815 | 0,04 | 0,057 | 1,07 | KHỚP |
| 1,3819 | 1769×995 | 0,02 | 0,057 | 1,07 | KHỚP |

Slope hồi quy ΔkurtG/s = −1,122 (n=10 điểm gồm trùng lặp). **Dị
thường biến mất giữa s=0,382 và s=0,521**; ở s≤0,382 ΔkurtG gần như
phẳng (1,14 → 1,12). B1 tái hiện đúng số Y2/A3 ở 2 điểm chung
(ΔkurtG 1,12 / 0,15, stdRatioG 1,19 / 1,05 — khớp từng số). Chẩn đoán
pha trên ocean: ở s=0,382 std theo pha PHẲNG cả hai phía (preview
10,55–11,20; render 8,70–9,44); ở s≥0,632 cả hai cùng có gù pha —
pha không giải thích dị thường.

## 5. Follow-up D — phân rã bin ocean theo mọi s (r74b1-followup.mjs)

Bin plainAbsDiff định nghĩa A3 (mean |previewPlain − renderPlain|
theo 3 kênh, biên [0,1,2,4,8,256]); std G preview/render theo bin:

| s | bin xấu nhất [8,256): frac / prevStdG / renderStdG | prevStdG các bin |
|---|---|---|
| 0,2431 | 6,3% / **14,23** / 5,63 | [5,71, 5,83, 6,20, 7,96, 14,23] |
| 0,3819 | 10,9% / **18,64** / 8,61 | [9,01, 9,08, 9,24, 10,50, 18,64] |
| 0,5208 | 6,9% / **17,78** / 11,19 | [11,21, 11,23, 11,37, 12,36, 17,78] |
| 0,6319 | 7,5% / **19,58** / 13,49 | [13,14, 13,24, 13,36, 14,30, 19,58] |
| 0,8819 | 9,0% / **21,40** / 13,94 | [14,61, 14,64, 14,71, 15,28, 21,40] |
| 1,1319 | 8,9% / **20,96** / 13,95 | [14,90, 14,95, 15,03, 15,70, 20,96] |
| 1,3819 | 8,9% / **20,95** / 13,96 | [14,91, 14,94, 15,04, 15,66, 20,95] |

**Excess ở bin xấu nhất KHÔNG biến mất theo s** — std preview vẫn
~18–21 ở mọi s. Δkurt toàn cục sụp chỉ vì std nền tăng theo s
(9,0 → 14,9) làm tỉ lệ hỗn hợp giảm (2,07× → 1,41×). Kiểm tra nhất
quán nội bộ: kurt hỗn hợp dự đoán từ bin vs kurt đo được — s=0,521:
0,34 vs 0,36; s=0,632: 0,24 vs 0,34; s=0,882: 0,25 vs 0,39; s=1,132:
0,18 vs 0,28; s=1,382: 0,19 vs 0,27 (chênh ~0,1 do kurt trong-bin
~0,2–0,3 + mean từng bin); s=0,243: 2,13 vs 1,22 (bin xấu nhất
platykurtic, kurt −0,83, kéo tổng xuống). Không có mâu thuẫn số học.

## 6. Follow-up A2 + corr + leak — cơ chế rò plain (PHÁT HIỆN CHÍNH)

### 6.1 Probe gradient 1920×1080 ở w1440 (nghi phạm pre-downscale)

Cùng 5 dải nhưng video 1920×1080 (upscale bilinear từ PNG 1280; frame
decode + scale bilinear về 1280×720 làm plain render-P; checker sau
1920 còn |gx| ~50/px, sine dọc ~49/px). Capture headed 4/4 (D3 hash
`8eeb3123`).

| Dải | prevStdG / render-P / varRatio | (native-1280 để so) |
|---|---|---|
| A phẳng | 8,95 / 9,12 / 0,96 | 0,96 |
| B ramp | 8,70 / 8,87 / 0,96 | 0,96 |
| C răng cưa | 8,96 / 8,84 / 1,03 | 0,98 |
| D checker | **14,50** / 9,04 / **2,57** | 2,57 (do render rớt) |
| E sine dọc | **17,54** / 8,58 / **4,18** | 1,20 |

Chỉ đổi video 1280→1920 (cùng nội dung, cùng s=0,382) mà excess
xuất hiện ở dải tần cao (D 14,50; E 17,54) trong khi dải thấp không
đổi — **pre-downscale 1920→1280 trước khi cộng noise là điều kiện cần
của excess**. plainAbsMad 1920: 5,701 (so với 1920-downscaled) /
5,519 (so với native-1280) — Chrome pre-downscale khác xa bilinear
của ffmpeg, đúng như kỳ vọng (kernel khác).

### 6.2 Tương quan delta preview vs render-P cùng-seed (r74b1-corr.mjs)

| Case / dải | corr G | slope | extraStd G (=√(varP − slope²·varR)) |
|---|---|---|---|
| native A/B/C | 0,981–0,995 | 0,97–0,98 | 0,36–1,64 |
| native D checker | 0,334 | 0,53 | 9,06 (do render hỏng, xem §7.3) |
| native E sine | 0,862 | 0,94 | 4,74 |
| 1920 A/B/C | 0,969–0,995 | 0,98 | 0,36–2,29 |
| 1920 D checker | **0,604** | 0,97 | **11,55** |
| 1920 E sine | **0,546** | 1,12 | **14,67** |

Slope ≈ 1 ở 1920 D/E chứng tỏ seed đúng và thành phần replica-noise
vẫn hiện diện đủ; corr sụt chứng tỏ preview delta chứa thêm thành
phần ngoài **không tương quan** với replica, std ~11,5–14,7. Thành
phần ngoài cân bằng R≈G (D: 11,72 vs 11,55; E: 14,87 vs 14,67) —
**không màu**, giống nhiễu Y. Seed đã được xác nhận đúng bởi corr
0,995 ở dải thấp (sai seed sẽ cho corr ≈ 0 mọi dải).

### 6.3 Kiểm chứng rò plain (r74b1-leak.mjs) — KẾT LUẬN CƠ CHẾ

Tiền đề trong code (đã đọc): `preview.tsx:1909`
`ctx.setTransform(vp.scale, 0, 0, vp.scale, vp.offX, vp.offY)` +
`ctx.drawImage(drawSrc, dx, dy, dw, dh)`; `effectCanvasSource`
(preview.tsx:274–305) vẽ video vào effect canvas ở kích thước
letterbox dw×dh; chỉ khi `canvasOps.length > 0` mới đi qua effect
canvas (preview.tsx:1599). Do đó:

- **Plain (không effect):** video 1920×1080 → viewport 489×275,
  **1 bước**.
- **Noise (có canvas effect):** video 1920×1080 → effect canvas
  1280×720 → viewport 489×275, **2 bước**.

Delta preview = `D2(D1(V)+N) − D_main(V) = D2(N) + [D2(D1(V)) − D_main(V)]`.
Số hạng trong ngoặc là **rò plain L** — 0 khi media = project size
(D1 là identity, native-1280 chứng minh: varRatio ~1 ở dải thấp),
lớn khi media > project và nội dung có tần số cao. Xấp xỉ
`L ≈ −(previewPlain − renderPlainTri)` và kiểm tra
`X=(dP−dR)` vs `Y=−plainDiff`:

| Case / dải | corr G (X vs Y) | slope | stdX / stdY |
|---|---|---|---|
| 1920 E sine | **0,993** | 0,89 | 14,72 / 16,37 |
| 1920 D checker | **0,824** | 0,64 | 11,56 / 14,80 |
| 1920 C răng cưa | 0,858 | 0,58 | 2,23 / 3,31 |
| 1920 ALL | **0,917** | 0,78 | 8,45 / 9,99 |
| native E sine | 0,981 | 1,02 | 4,72 / 4,54 |
| native D checker | 0,842 | 0,71 | 9,47 / 11,20 |

Slope < 1 là đúng như kỳ vọng (Y chỉ là xấp xỉ của L — trilinear/
ffmpeg thay cho kernel thật của Chrome — nên errors-in-variables làm
suy giảm slope/corr; L thật giải thích phần dư tốt hơn cả proxy).
Đối chiếu ocean: rò L có std ~15–16 ở pixel tần số cao (s=0,382) —
khớp excess ocean √(18,64² − 9²) ≈ 16,3. **Cơ chế đã đóng.**

Hệ quả: rò này tồn tại với MỌI media lớn hơn project khi bật canvas
effect (ocean/basgo/slovenska đều 1920×1080); test-pattern 1280×720
không rò. Mức độ verdict tùy nội dung: plainAbsMad w1440 — ocean
3,294 (LỆCH) > basgo 2,052 > slovenska 1,770 > test-pattern 1,049
(nền lỗi mô hình, KHỚP). Ocean noise10 KHỚP vì noise10 có std nền
lớn hơn (tỉ lệ hỗn hợp nhỏ hơn) — cùng lý do Δkurt sụp theo s (§4).

## 7. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Headed capture B1: 11 lượt chạy thành công (gradient w1440/w1920, gradient1920 w1440, ocean 8 cửa sổ) | **35/35 case pass** (D1/D2/D3/H9); 1 lượt bị abort giữa chừng (runtime delivery, không ghi snapshot — chạy lại 4/4) |
| Tái hiện snapshot: raw hash giống hệt giữa các lần chạy độc lập (gradient `1abb07e5`, ocean `5c9f9de4`, gradient1920 `8eeb3123`) | hash khớp 100% |
| B1 tái hiện số Y2/A3 ở điểm chung (ocean w1440/w1920) | ΔkurtG 1,12 / 0,15, stdRatioG 1,19 / 1,05 — khớp từng số |
| Video tổng hợp tĩnh (frame 0 vs 30) | MAD 0,0000 (native); 0,0001 (1920, sau downscale) |
| `node --check` 5 script mới r74b1-*.mjs + 1 script .py | OK |
| Phân tích chính (r74b1-analyze.mjs) | exit 0; JSON `r74b1-analysis.json` |
| Follow-up D+A2 (r74b1-followup.mjs) + corr + leak | exit 0; JSON `r74b1-followup.json`, `r74b1-corr.json`, `r74b1-leak.json` |
| Nhất quán kurt hỗn hợp (Part D bin → Part C) | khớp trong ~0,1–0,2 (xem §5) |
| Không chạy | tsc/vite build (không đụng code TS/UI/production); capture headed mới cho ocean ngoài quét s (tái dùng frame Z2) |

Sự cố quy trình (đã khắc phục, ghi để đợt sau tránh): 2 lần 2 nguồn
chung 1 cỡ cửa sổ ghi đè cùng file snapshot JSON (gradient w1440 bị
ocean ghi đè; ocean w1920×1080 bị gradient ghi đè) — đã chạy lại vào
thư mục hậu tố riêng (`headed-w1440x900-grad`,
`headed-w1920x1080-ocean`) và script phân tích tìm snapshot theo
`doc.window` + tên nguồn. Script capture nên đặt tên thư mục theo cả
nguồn khi chạy nhiều nguồn chung cửa sổ.

## 8. Nợ mở (trung thực)

1. **Ocean w1440 noise05 — ĐÃ RÕ CƠ CHẾ, CHƯA SỬA.** Rò plain do
   2 chuỗi downscale khác nhau (xem §6.3). **Cách sửa đề xuất (luồng
   riêng, chưa làm):** cho đường plain đi qua cùng intermediate
   letterbox dw×dh như đường effects (vẽ video → offscreen canvas
   dw×dh → canvas chính), để plain và noise chia sẻ đúng một chuỗi
   resample và số hạng rò triệt tiêu. **Giao thức kiểm chứng:** capture
   lại ocean w1440 plain/noise05 + chạy lại phân tích → Δkurt G ≤ 0,35,
   Δcorr ≤ 0,12, stdRatio ∈ [0,85, 1,18]; hồi quy: tsc 0, vite build,
   suite parity liên quan (P7/i18n/css + click-test), đo FPS preview
   (thêm 1 lần draw 1280×720/frame). **Lưu ý sản phẩm:** sửa này làm
   thay đổi cả ảnh plain preview (downscale 2 bước mềm hơn 1 bước đôi
   chút ở cửa sổ nhỏ) — cần phán đoán sản phẩm, không chỉ số.
   Không sửa trong luồng này vì task chỉ giao 3 thí nghiệm + thay đổi
   chạm mọi frame preview.
2. **Mô hình trilinear không đáng tin ở nội dung Nyquist (§2, §6.2):**
   render-P rớt std 5,99 + kurt 2,66 ở checkerboard native trong khi
   preview sạch (9,60 / 0,03). Đừng dùng render-P (replica + trilinear)
   làm chuẩn đối chiếu ở gradient cực đoan; method-T (ffmpeg) vẫn là
   chuẩn. Nợ nhỏ: chưa đo method-T trên checkerboard tổng hợp để xem
   ffmpeg có cùng artefact không.
3. **Chưa đo:** rò plain trên media 4K / project 1080p; rò ở các canvas
   effect khác (không chỉ noise — mọi effect đi qua effectCanvas đều
   chịu cùng rò khi media > project); LUT/chroma cũng có intermediate
   riêng (kích thước khác) — cùng họ vấn đề, chưa đo.
4. Nợ kế thừa chưa đụng (đợt 73 §4): birefnet fps, TTS 39 CVE, SEGFAULT
   vidstab, gate ngưỡng 30, spawnSync render.js:1805, preset 4:5 chưa
   render MP4 end-to-end, Safari codec-probe, ci-security.yml 403.
5. Release gate giữ nguyên: KHÔNG release/tag.

## 9. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/r74b1-headed-capture.mjs` — harness headed B1 (nguồn/
  variant/cửa sổ qua env + giao thức cùng-khung D3 qua `__vcutMediaEls`).
- `apps/web/scripts/r74b1-analyze.mjs` — Part A (probe gradient) + Part B
  (cùng-khung) + Part C (quét s).
- `apps/web/scripts/r74b1-followup.mjs` — Part D (bin ocean theo s) +
  Part A2 (gradient 1920).
- `apps/web/scripts/r74b1-corr.mjs` — tương quan dP vs dR cùng-seed.
- `apps/web/scripts/r74b1-leak.mjs` — kiểm chứng rò plain.
- `apps/web/scripts/r74b1-make-gradient.py` — tạo video gradient tổng hợp
  1280×720 (+ upscale 1920 dùng trong A2).
- `docs/PHASE9_ROUND74_B1_OCEAN_W1440_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / snapshot / JSON / frame):
`hidden_files/round74-b1/` — 11 thư mục headed-w*, `r74b1-analysis.json`,
`r74b1-followup.json`, `r74b1-corr.json`, `r74b1-leak.json`, `sweep.log`,
`media/` (gradient.png/mp4, gradient1920.mp4 — binary, không stage).
Không sửa code production, không binary, không workflow `.yml`.
