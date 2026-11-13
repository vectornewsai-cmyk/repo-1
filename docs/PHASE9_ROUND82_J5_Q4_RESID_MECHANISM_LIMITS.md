# Phase 9 Đợt 82 — Luồng J5: Cơ chế Q4 resid — "làm mượt x264" vs "motion mismatch"

**Ngày:** 10–11/11/2026 (lượt cron 21:35 +07 → ~23:50 +07). **Trạng thái:** HOÀN THÀNH, đã stage, KHÔNG push.
**Phạm vi:** chỉ đo lường + script `.mjs` + doc. Không đổi luật gate, không đụng production.

## 0. Tóm tắt kết quả (đọc phần này là đủ)

| Câu hỏi | Trả lời |
|---|---|
| Cơ chế nào đúng: (i) làm mượt x264 hay (ii) motion mismatch? | **(ii-a) LỆCH CHỈ SỐ FRAME — và không phải hai ứng viên như I4 §4.4 viết.** Preview F7 của slovenska là **frame 24, không phải frame 25**: resid với render frame 24 chỉ **0,51–0,62**, với frame 25 là **2,93–2,95**. Toàn bộ khoảng cách "video thật 2,95 vs still 0,74" là **chênh 1 frame (40 ms) của motion**, không phải làm mượt. |
| (i) làm mượt encode đóng góp bao nhiêu? | **≈ 0.** Cùng bộ lọc C3, cùng frame: render native f25 → resid 2,9467; render VP9-decode f25 → resid **2,9364** (chênh 0,01). Sweep B: sai số làm mượt x264 crf 18 của slovenska chỉ **0,83** (sàn 4:2:0 đã 0,59) — và trong chuỗi đo khớp-frame nó **triệt tiêu hoàn toàn** (cả hai phía decode cùng stream). |
| Motion tự thân có làm phồng resid không? | **KHÔNG — chỉ khi lệch frame.** Pan giả 0/2/8 px/frame: resid khớp-frame đứng yên **0,7404 / 0,7375 / 0,7368**; resid lệch 5 frame: **0,97 / 10,26 / 13,90** — tăng theo tốc độ pan. |
| Vì sao test-pattern miễn nhiễm (×1,00)? | **Hai lý do, cả hai đều đã đo:** (1) test-pattern.mp4 **KHÔNG phải still-loop** — chỉ frame 30 khớp frame tham chiếu (f25 vs f30: std_R **34,10**, ~7,4% pixel lệch > 8), và capture 30fps khớp đúng frame 30 nên resid của nó là **lệch kernel thuần**; (2) lệch kernel trilinear-vs-1-kernel trên cùng frame tp @311×175 là **3,86**, cùng bậc với resid 4,46. Encode không chạm tới resid vì cả hai phía decode cùng mp4 (sai số encode triệt tiêu). |
| Q4 còn là hướng săn đáng làm không? | **KHÔNG — với các họ nội dung đã thử.** Q4 cần `residStd_R ≥ d0std_R > 2`; resid khớp-frame thật của slovenska chỉ **~0,5–0,7** (không phải 2,95), của tp lớn (4,46) nhưng `d0std_R` chỉ ~0,9–1,7 (chroma đã bão hòa rail). Hai điều kiện kéo ngược nhau trên mọi họ đã đo. Hướng duy nhất chưa thử: sọc màu mịn (chromatic fine stripes) — xem §6. |
| G2 vs G12 phân biệt được không? | **Vẫn KHÔNG — 0 case** trong 16 case pan mới (cộng 75 sweep + 14 capture I4). |
| Test | J5 **30/30** (test_round82_j5_q4_resid.mjs). Capture headed 4/4 phiên D1/D3/H9 3/3 pass (pan-slov-s8 phải chạy lại lần 2 sau 1 lần timeout mount do tải VM — xem §8). |

**Đính chính quan trọng nhất đợt này (đảo ngược I4 §4.4):** "still re-encode giết resid
slovenska 2,95 → 0,74" **không phải do encode làm mượt**. Số 2,95 chưa bao giờ là
resid của video thật khớp-frame — nó là resid của **preview frame 24 so với render
frame 25**. Resid khớp-frame thật của slovenska video là **0,51 (C2) / 0,62 (C3)** —
thấp hơn cả still (0,74). Cả hai cơ chế ứng viên ở I4 §4.4 đều sai theo nghĩa đã
viết: (i) đóng góp ≈ 0, (ii) đúng nhưng không phải "motion làm phồng resid video
thật" mà là **lệch 1 frame trong giao thức capture** (xem §1.2).

---

## 1. Bối cảnh và phát hiện phương pháp

### 1.1 Định nghĩa (giữ nguyên từ E6/F7/G6/H4/I4)

- `residStd_R` = độ lệch chuẩn kênh R của `prevPlain − resample(renderPlain1280)`:
  `prevPlain` là snapshot preview trong browser tại viewport, `renderPlain1280` là
  frame render tham chiếu 1280×720 (resample trilinear về viewport trong harness).
- Luật cổng (kênh R): R0 = áp d0 iff `plainMad ≤ 2,5`; G1 = R0 + `d0std_R ≤ 2,0`;
  G2 = R0 + `ratio_R = d0std_R / residStd_R ≤ 1,0`; G12 = cả ba.
- Q4 = góc G1 từ chối ∧ G2 áp: `d0std_R > 2,0 ∧ ratio_R ≤ 1,0` (điều kiện CẦN để
  phân biệt G2 vs G12).

### 1.2 Hai số 2,95 vs 0,74 KHÔNG cùng chuỗi đo

Đọc lại chuỗi đo trước khi thiết kế thí nghiệm đã lộ ra điểm then chốt mà I4 §4.4
chưa thấy:

| | F7 "video thật" (2,95) | I4 "still" (0,74) |
|---|---|---|
| Preview | browser decode **VP9 webm 1920×1080, 25fps**, playhead 1,0 s | browser decode **x264 mp4 1280×720, 30fps**, playhead 1,0 s |
| Render tham chiếu | **frame GỐC 1920** (native f25 → C3 1920→1280 → trilinear) | **ffmpeg decode cùng mp4 frame 30** (→ trilinear) |
| Frame được cho là khớp | f25 (render-1k) vs preview @1,0 s | f30 vs preview @1,0 s |

Ba khác biệt cùng lúc: (a) render tham chiếu là frame gốc hay frame đã encode,
(b) có bước 1920→1280 hay không, (c) codec/fps khác nhau. Vì vậy "lệch frame"
phải tách thành hai giả thuyết con: **(ii-a) lệch chỉ số frame** (preview frame N
vs render frame M ≠ N) và **(ii-b) motion thật trong nội dung**. Thí nghiệm A
phân rã F7 bằng cách **giữ nguyên snapshot preview F7, chỉ đổi render tham chiếu**;
thí nghiệm C (pan) tách (ii-a) khỏi (ii-b) bằng motion giả có kiểm soát.

### 1.3 Đính chính nhỏ nhưng cần ghi: render-1k slovenska là C3, không phải C2

`r72z2-rebuild.json`: slovenska winner = **C3-tri-rgb** (ocean C2, basgo C1).
Vì vậy so sánh A0-vs-A1 trong script gốc trộn cả chênh lệch bộ lọc C2-vs-C3
(std 0,62 ở 1280) vào ước lượng làm mượt. Đã chạy check bổ sung bằng đúng bộ
lọc C3 (`r82j5-c3-check.mjs`, xem §2.4) — kết luận không đổi, và chênh lệch này
nhỏ hơn một bậc so với hiệu ứng đang đo.

---

## 2. Thí nghiệm A — Phân rã resid F7 (prevPlain F7 cố định, w1920, 809×455)

Script `r82j5-resid-mechanism.mjs` §A. Noise cho các render tham chiếu mới: chuyển
delta Z2 từ noise render-1k (`noiseMới = plainMới + (noiseCũ − plainCũ)`, kẹp
0..255; clampFrac ≤ 0,0001 cho mọi ref f25, 0,045 cho ref f24 — xem §8).

### 2.1 Tái lập (sanity)

| | residStd_R | plainMad | d0std_R | Ghi chú |
|---|---|---|---|---|
| I4 still slovenska (tái lập) | **0,7404** | 0,6496 | 0,124 | I4 báo 0,74 / 0,65 — khớp |
| F7 real slovenska (tái lập) | **2,9467** | 1,8191 | 0,2071 | F7 báo 2,95 / 1,82 — khớp |

Chuỗi đo tái lập chính xác từng số — mọi phân rã dưới đây đo trên cùng snapshot
preview F7 nên so sánh được trực tiếp.

### 2.2 Đổi render tham chiếu — kết quả

| ref | Render tham chiếu | residStd_R | plainMad | d0std_R | ratio_R | Ý nghĩa |
|---|---|---|---|---|---|---|
| A0 | native f25 → C2 (tái lập F7) | **2,9467** | 1,8191 | 0,2071 | 0,0703 | gốc |
| A1 | VP9 decode f25 → C2 | **2,9311** | 2,0870 | 0,2708 | 0,0924 | cùng frame đã encode |
| A2 f20 | VP9 decode f20 → C2 | **8,2276** | 7,8181 | 0,2258 | 0,0274 | lệch −5 frame |
| A2 f22 | VP9 decode f22 → C2 | **5,4723** | 4,6315 | 0,2410 | 0,0440 | lệch −3 |
| A2 f24 | VP9 decode f24 → C2 | **0,5140** | 0,3898 | 0,2624 | 0,5105 | **lệch −1 — CỰC TIỂU** |
| A2 f26 | VP9 decode f26 → C2 | **4,6110** | 3,8900 | 0,2698 | 0,0585 | lệch +1 |
| A2 f28 | VP9 decode f28 → C2 | **8,2031** | 8,0776 | 0,2905 | 0,0354 | lệch +3 |
| A2 f30 | VP9 decode f30 → C2 | **10,1354** | 10,7618 | 0,2893 | 0,0285 | lệch +5 |
| A4 | VP9 decode f25 → ffmpeg bicubic 1920→1280 | **3,0086** | 1,9471 | 0,2739 | 0,0910 | đổi bộ lọc 1920→1280 |
| A5 | h264 720p f30 @1,0 s | **3,0003** | 1,9094 | 0,1170 | 0,0390 | khác codec, cùng timestamp |
| A3 | native f25 → trilinear thẳng 1920→viewport | **2,9886** | 1,8342 | — | — | bỏ bước 1280 |
| A3b | native f25 → 1-kernel thẳng 1920→viewport | **3,2010** | 1,9470 | — | — | bỏ bước 1280, kernel khác |

Đường cong lệch-frame (residStd_R theo frame render, preview cố định):

```
f20: 8,23 ┤        ╭─╮
f22: 5,47 ┤      ╭─╯ ╰─╮
f24: 0,51 ┤     ╭╯     ╰╮  ← cực tiểu DUY NHẤT, thấp hơn cả still (0,74)
f25: 2,93 ┤    ╱        ╲
f26: 4,61 ┤   ╱          ╲
f28: 8,20 ┤  ╱            ╲
f30: 10,14┤ ╱              ╲
```

### 2.3 Kết luận A — preview F7 là frame 24

- **Cực tiểu sắc nét duy nhất ở f24 (0,51)**, không phải f25 (2,93). Mọi biến thể
  giữ frame 25 đều cho ~2,93–3,20 bất kể codec (VP9/h264), bộ lọc 1920→1280
  (C2/bicubic/trilinear/1-kernel), hay có bước 1280 hay không (A3/A3b). Chỉ có
  **chỉ số frame** mới làm resid đổi — và nó đổi rất mạnh: lệch ±1 frame đã
  0,51 → 2,93/4,61; lệch ±5 frame lên 8,23/10,14.
- **Làm mượt (i) ≈ 0:** A1 ≈ A0 (chênh 0,016); xem thêm §2.4 với cùng bộ lọc C3.
- **Bước 1920→1280 ≈ 0:** A3 (bỏ bước) = 2,99 ≈ A0; A4 (đổi bộ lọc) = 3,01 ≈ A0.
- **Chênh lệch frame 24–25 ở 1920 là std_R 3,46** (đo trực tiếp f24−f25) — tức
  video slovenska chuyển động ~3,5 đơn vị mức xám mỗi 40 ms ở thang 1920; sau
  downscale về viewport nó đóng góp √(2,93² − 0,51²) ≈ **2,88** vào resid.
- Vì sao preview lại là frame 24 trong khi `currentTime` đọc được là 1,000?
  Snapshot F7 ghi `currentTime: 1` (làm tròn 3 chữ số thập phân, tức thực tế
  trong [0,9995; 1,0005)) và D3 chỉ kiểm tra plain-vs-noise **cùng-khung**,
  không kiểm tra preview-khung **== render-khung**. Giao thức không có bước nào
  xác minh frame preview đúng là frame tham chiếu — xem §7.3. Nguyên nhân
  browser-internal chính xác (seek hạ cánh 999,x ms hay chọn frame có pts <
  currentTime) **chưa xác định** — chỉ có bằng chứng thực nghiệm là preview
  == f24. Basgo (30fps, frame 30) khớp đúng (resid 0,71–0,73) và pan 30fps
  khớp đúng (§4) nên hiện tượng này gắn với boundary 25fps @1,0 s, không phải
  lỗi chung của mọi capture.

### 2.4 Check bổ sung bằng đúng bộ lọc C3 (`r82j5-c3-check.mjs`)

| check | Kết quả |
|---|---|
| C3(native f25 RGB) vs render-1k | std [0,31; 0,30; 0,31], MAD 0,10 — **không khớp byte** (xem §8: mô hình trilinear đã đổi blend-at-end ở đợt 73 A1 sau Z2; chênh 0,31 nhỏ hơn một bậc so với hiệu ứng đang đo) |
| C3(VP9-decode f25) — cùng bộ lọc C3, cùng frame đã encode | residStd_R **2,9364**, plainMad 1,8199 (A0: 2,9467 / 1,8191) — **làm mượt VP9 ≈ 0, tách sạch** |
| C3(VP9-decode f24) | residStd_R **0,6171**, plainMad 0,603 — **cực tiểu f24 giữ nguyên với bộ lọc C3** |

Ước lượng phương sai làm mượt theo A0−A1 (giả định độc lập): resid²(A0)−resid²(A1)
= 0,0917 → std ≈ 0,30 — **chặn trên**, vì còn lẫn chênh C2-vs-C3 (0,62 ở 1280);
với cùng bộ lọc C3, chênh A0−C3-f25 chỉ còn 0,01 std.

---

## 3. Thí nghiệm B — Sweep làm mượt: still encode ở nhiều crf/codec

Script `r82j5-resid-mechanism.mjs` §B. Still 4 s @30fps từ frame gốc 1280×720,
decode frame 30, đo sai số làm mượt = std/MAD của (decode − gốc) từng kênh.
**Lưu ý cách đọc:** số này là sai số encode **so với frame gốc**; trong chuỗi đo
khớp-frame (I4) nó **triệt tiêu** (cả hai phía decode cùng stream) nên không
đi vào resid — sweep này đo (i) như một hiệu ứng độc lập, không phải như thành
phần của resid I4.

### 3.1 Slovenska (smoothStd_R)

| codec | crf 0 | crf 10 | crf 18 | crf 23 | crf 28 | crf 30 | crf 35 |
|---|---|---|---|---|---|---|---|
| x264 | **0,588** | 0,632 | **0,832** | 1,044 | 1,333 | — | 2,041 |
| VP9 | **0,588** | — | **0,881** | — | — | 1,102 | — |
| x265 | — | — | **0,854** | — | — | — | — |
| AV1 | — | — | **0,708** | — | — | 0,920 | — |

- **Sàn crf 0 = 0,588, giống hệt nhau giữa x264 và VP9** (std [0,588; 0,569; 0,775],
  MAD [0,917; 0,921; 1,048] — từng số trùng nhau): sàn này là **vòng lặp
  RGB→YUV420p→RGB (subsampling chroma)**, không phải lượng tử hóa, và codec-độc lập.
- Lượng tử hóa chỉ cộng thêm trên sàn: x264 crf 18 → 0,83 (phần lượng tử
  √(0,83²−0,59²) ≈ 0,59); crf 35 mới lên 2,04.
- Ở crf 18, **AV1 giữ chi tiết tốt nhất** (0,708 < x264 0,832 < x265 0,854 < VP9 0,881).
- Kết luận (i): làm mượt x264 crf 18 thật nhưng **nhỏ (0,83)**, chưa bằng một nửa
  khoảng cách cần giải thích (2,95−0,74 = 2,21) — và trong chuỗi khớp-frame nó
  bằng 0 vì triệt tiêu. **(i) không giải thích được I4 §4.4.**

### 3.2 Test-pattern (smoothStd_R) — đối chứng

| codec | crf 0 | crf 10 | crf 18 | crf 23 | crf 28 | crf 30 | crf 35 |
|---|---|---|---|---|---|---|---|
| x264 | **2,318** | 2,334 | **2,368** | 2,429 | 2,637 | — | 3,605 |
| VP9 | **2,318** | — | 2,374 | — | — | 2,460 | — |
| x265 | — | — | 2,389 | — | — | — | — |
| AV1 | — | — | 2,331 | — | — | 2,357 | — |

- Sàn crf 0 của tp là **2,32** (R), gần **phẳng tới crf 23** (2,43) — sai số encode
  của tp **do subsampling chroma trên cạnh màu sắc nét chi phối**, không phải do
  lượng tử hóa; lượng tử chỉ lộ rõ từ crf 28 trở lên.
- crf 0 giống hệt nhau giữa x264/VP9 (từng số trùng) — lại là sàn codec-độc lập.
- Vì sao tp "miễn nhiễm" trong I4 (§5) dù sai số encode của nó (2,32) lớn hơn
  slovenska (0,59)? Vì trong chuỗi khớp-frame, sai số này **triệt tiêu** — cả
  hai phía decode cùng mp4. Số 2,32 chỉ đi vào resid nếu render tham chiếu là
  frame gốc RGB — mà render tham chiếu của tp (fullrgb-plain.raw) **chính là
  frame decode** (decode test-pattern.mp4 f30 vs fullrgb-plain.raw: std/MAD =
  **0,0** — bit-identical), nên không có sai số nào để đi vào.

---

## 4. Thí nghiệm C — Still slovenska có motion giả (pan 0/2/8 px/frame)

Script `r82j5-pan-build.mjs` (pan ngang, edge-replication, KHÔNG upscale nên
không làm mờ thêm; x264 crf 18 như I4) + capture headed `r82j5-headed-capture.mjs`
(w1920, playhead 1,0 s, D1/D3/H9 3/3 pass cả 4 phiên — pan-slov-s8 chạy lại lần
2, xem §8) + đánh giá `r82j5-sweep.mjs` (khớp f30 vs lệch f25; noise lệch chuyển
delta Z2). Kết quả (raw, rect 809×455):

| video | pan | matched f30: residStd_R | matched: plainMad | offset f25: residStd_R | offset: plainMad | offset: ratio_R |
|---|---|---|---|---|---|---|
| pan-slov-s0 | 0 px/f | **0,7404** | 0,6496 | **0,9656** | 0,8063 | 0,1294 |
| pan-slov-s2 | 2 px/f (60 px/s) | **0,7375** | 0,6487 | **10,2600** | 5,7376 | 0,0126 |
| pan-slov-s8 | 8 px/f (240 px/s) | **0,7368** | 0,6555 | **13,8956** | 8,0970 | 0,0100 |
| pan-tp-s8 | 8 px/f (tp) | **1,1756** (R; B: 7,57) | 2,9217 | **94,4042** | 25,8051 | 0,0180 |

Dự báo trước capture (đo trực tiếp f30−f25 ở 1280): s0 std_R 0,88; s2 10,64;
s8 14,18; tp-s8 94,96 — khớp với resid offset đo được sau downscale (0,97 /
10,26 / 13,90 / 94,40).

Kết luận C (tách sạch ii-a khỏi ii-b):

- **Motion tự thân KHÔNG làm phồng resid khi frame khớp:** matched đứng yên
  0,7404 → 0,7375 → 0,7368 từ 0 tới 240 px/s. Pan-slov-s0 matched **tái lập
  chính xác từng số I4** (0,7404 / 0,6496) — chuỗi build pan + capture 30fps
  khớp đúng frame 30, không off-by-one ở 30fps.
- **Motion chỉ có nghĩa qua LỆCH FRAME:** offset 5 frame: 0,97 → 10,26 → 13,90
  theo tốc độ pan (bão hòa ở s8 vì dịch 40 px đã decorrelate gần hết texture).
- **Test-pattern pan:** matched R 1,18 (cùng bậc với tp @809 trong F7: 0,99 ở
  w2240; khác 4,46 vì đó là rect 311×175 — xem §5), nhưng kênh B nổ lên 7,57
  theo pha sọc; offset R 94,40 (sọc lệch 40 px). Cả 4 case tp-s8 đều
  **cả-hai-LỆCH** (dKurt R 0,61–2,80, deltaMad 15–26) nên không chấm được luật
  nào — cùng mode lỗi như tp n05 của I4 @311, không phải tín hiệu cổng mới.
- **Q4 = 0/16 case pan.** Mọi luật đúng 4/4 trên 3 sweep slov; tp-s8 0/0
  (không chấm).

---

## 5. Thí nghiệm D — Đối chứng test-pattern: vì sao miễn nhiễm (×1,00)

### D1. test-pattern.mp4 KHÔNG phải still-loop (phát hiện mới)

| so sánh | std [R,G,B] | MAD [R,G,B] | % pixel lệch > 8 |
|---|---|---|---|
| tp.mp4 f25 vs f30 | [34,10; 24,97; 29,23] | [6,10; 4,69; 4,90] | 7,43% |
| tp.mp4 f25 vs fullrgb-plain.raw | [34,10; 24,97; 29,23] | [6,10; 4,69; 4,90] | 7,43% |
| tp.mp4 f30 vs fullrgb-plain.raw | **[0; 0; 0]** | **[0; 0; 0]** | 0% |
| tp.mp4 f0/f5/f29/f31/f60/f90/f119 vs fullrgb-plain.raw | std_R 28,7–37,6 | MAD_R 4,5–7,1 | 6,2–7,9% |

- Chỉ **frame 30** khớp frame tham chiếu; mọi frame khác lệch std_R ~29–38 trên
  ~7,4% pixel (phần tử chuyển động của testsrc2 trải khắp khung hình, bbox
  x[0..1279] y[0..719] — không phải vật thể cục bộ).
- Vì vậy "test-pattern still giữ nguyên 4,46" ở I4 §4.4 cần đọc lại cho đúng:
  **I4 build still từ frame 30** (fullrgb-plain.raw), và capture 30fps khớp đúng
  frame 30 — resid 4,46 là lệch kernel trên sọc sắc, không liên quan tới việc
  "encode giữ nguyên test-pattern". Nếu capture lệch sang frame 25, resid tp
  sẽ nổ lên ~34 (kiểu pan-tp-s8 offset: 94,40 sau pan 40 px).

### D2. Lệch kernel trên cùng một frame (trilinear vs 1-kernel, std_R)

| frame | @809×455 | @311×175 |
|---|---|---|
| test-pattern | **0,74** | **3,86** |
| slovenska | **0,35** | **1,50** |

- Lệch kernel cùng bậc với resid khớp-frame đã đo: tp @311: 3,86 vs resid 4,46;
  slov @809: 0,35 vs sàn resid 0,51–0,74; slov @311: 1,50 vs still resid 1,27.
  **Lệch kernel (browser scaler vs trilinear mô hình) là thành phần chủ đạo
  của resid khớp-frame**, không phải motion hay làm mượt. Kernel thật của
  browser vẫn chưa biết chính xác (trilinear vs 1-kernel chỉ là hai mô hình
  kẹp hai phía) nên con số này là chứng cứ cùng-bậc, không phải phân rã chính
  xác từng phần.

---

## 6. Kết luận tổng + Q4 còn đáng săn không

### 6.1 Phân rã cuối cùng của "2,95 vs 0,74" (w1920, kênh R)

| thành phần | đóng góp (std_R) | bằng chứng |
|---|---|---|
| Sàn kernel khớp-frame (browser vs trilinear) | **~0,5–0,7** | A2-f24 0,51 (C2) / 0,62 (C3); I4 still 0,74; D2 kernel-diff 0,35 |
| Lệch 1 frame motion (f24 vs f25, 40 ms) | **~2,88** (cộng phương sai: √(2,93²−0,51²)) | đường cong A2; f24−f25 @1920 std_R 3,46 |
| Làm mượt encode (VP9/x264) | **≈ 0** (chặn trên 0,30, lẫn nhiễu bộ lọc) | A1 ≈ A0; C3-f25 ≈ A0 (chênh 0,01) |
| Bước 1920→1280 / chọn bộ lọc bước đó | **≈ 0** (≤ 0,08) | A3 ≈ A0; A4 ≈ A0 |
| Codec (VP9 vs h264, cùng timestamp) | **≈ 0** | A5 ≈ A0 |

**Cơ chế đúng là (ii-a) lệch chỉ số frame**, với motion thật (ii-b) là nhiên liệu
chứ không phải cơ chế: motion chỉ tạo ra chênh lệch giữa hai frame kề; chính
**giao thức capture so preview frame 24 với render frame 25** mới biến chênh
lệch đó thành resid 2,95. Trong chuỗi khớp-frame, video thật KHÔNG có resid
lớn hơn still — nó còn thấp hơn một chút (0,51–0,62 so với 0,74).

### 6.2 Q4 — nên dừng săn theo hướng cũ

Q4 cần `residStd_R ≥ d0std_R > 2`. Sau khi bỏ neo sai 2,95:

- Slovenska-like (texture mềm, chroma-scale được): resid khớp-frame thật
  ~0,5–0,7; dù `d0std_R` kéo lên 2,64 (chroma s20) thì ratio vẫn ~3,6.
- Test-pattern-like (sọc sắc, resid lớn): resid 4,46 @311 nhưng `d0std_R` chỉ
  ~0,9 (chroma đã bão hòa rail 97% — không scale được); pan-tp-s8 @809:
  `d0std_R` 1,68, resid_R 1,18, ratio 1,43.
- Hai điều kiện kéo ngược nhau trên mọi họ đã đo (H4/I4/J5): nội dung cho
  `d0std_R` lớn là nội dung chroma mịn (resid nhỏ); nội dung cho resid lớn là
  sọc sắc (chroma bão hòa, `d0std_R` nhỏ).
- **Hướng duy nhất chưa thử (đề xuất, chưa đo):** sọc màu mịn (chromatic fine
  stripes, chu kỳ ~2–4 px, biên độ chroma lớn) — cùng một cấu trúc vừa tạo
  `d0std_R` lớn (mô hình chroma-shift khuếch đại cạnh chroma ở thang 2×2) vừa
  tạo resid lớn (kernel lệch trên sọc sắc). Nếu hướng này cũng trượt, Q4 nên
  được kết luận là **không đạt được với thiết kế cổng hiện tại** chứ không phải
  "chưa tìm ra case".

### 6.3 Không đổi luật gate, không sửa production

Bằng chứng đợt này là về **đo lường**, không phải về luật: không có case nào cho
thấy G2 sai hay G12 khác G2. Không đổi luật gate/production.

---

## 7. Ảnh hưởng tới các kết quả đã công bố

### 7.1 Sweep 77 case (I4) — điểm luật KHÔNG đổi

Các case slovenska trong sweep mang resid phồng (2,58–2,95 thay vì ~0,5–0,6).
Sửa lại không đổi verdict nào: với resid thật 0,51, ratio_R slovenska w1920 =
0,21/0,51 = **0,41** (vẫn ≤ 1, G2 vẫn áp); G1 (d0std 0,21 ≤ 2) không đổi;
verdict "đúng" KHÔNG-d0 không đổi (noD0 đã KHỚP). Điểm luật I4 (R0 61/69,
G1 67/69, G2 68/69, G12 68/69) giữ nguyên. Case phân biệt G1/G2 duy nhất
(F7-sweep-w2240-testpattern-n10) là test-pattern (30fps, khớp frame) nên không
bị ảnh hưởng.

### 7.2 Ocean (F7) — NGHI NGỜ, chưa xác minh

`ocean06.mp4` (nguồn capture F7) cũng là **25fps, frame 25, playhead 1,0 s** —
cùng giao thức với slovenska nên **có thể** mang cùng off-by-one. Nếu có, resid
thật của ocean thấp hơn số F7 công bố (0,91–1,82) và ratio_R thật lớn hơn
(4,32 → ~7+ ở w1600). Hướng sai lệch này **không đổi kết luận F7**: cả ba cổng
đã từ chối ocean, ratio lớn hơn chỉ càng từ chối mạnh hơn; phân tích lỗi R0
(Δkurt) là về verdict, không phụ thuộc resid. **Nợ:** chạy đường cong lệch-frame
cho ocean như §2.2 để xác nhận (chưa làm trong đợt này — chỉ slovenska).

### 7.3 Lỗ hổng giao thức (đề xuất sửa cho đợt sau, không làm trong đợt này)

D1/D3/H9 kiểm tra snapshot **cùng-khung giữa các variant**, nhưng không có kiểm
tra nào xác minh **preview-khung == render-khung**. Đề xuất: sau capture, so
trực tiếp snapshot plain với frame render tham chiếu (plainMad phải dưới ngưỡng
hợp lý cho nội dung đó), hoặc ghi `currentTime` với độ chính xác đầy đủ + tính
frame kỳ vọng từ fps và so với frame render. Lưu ý: với nội dung chuyển động
nhanh, plainMad lớn có thể do lệch kernel chứ không chỉ lệch frame — ngưỡng
phải theo nội dung (slovenska ~0,4–0,7; tp ~1–3 ở rect lớn).

### 7.4 I4 §4.3 vẫn đúng, §4.4 đảo ngược

- I4 §4.3 (blend KHÔNG sụp resid — khớp mô hình trung bình-không-tương-quan
  1,24 vs đo 1,22): **giữ nguyên**, không bị ảnh hưởng (blend đo trên still,
  khớp frame).
- I4 §4.4 ("still re-encode giết resid slovenska 2,95 → 0,74"): **đảo ngược**
  — xem §0/§6.1. Số 2,95 không phải resid video thật.

---

## 8. Ghi chú khác / giới hạn

- **VM:** 4 vCPU EPYC 9D25, ~7 GB RAM. Sweep B: 24 encode (x264 ~8–21 s,
  VP9 ~35–105 s, x265 ~39–162 s, AV1 ~88–113 s mỗi encode 4 s 720p).
  Eval harness (delta0Viewport + trilinear) ~45–90 s/case — toàn bộ thí
  nghiệm A/B/D + C3 + 4 sweep pan ≈ 2 h tường.
- **Capture pan-slov-s8 lần đầu FAIL** (EXIT=2, timeout chờ app mount sau ~4
  phút) trong khi sweep pan-slov-s2 đang chạy song song và chiếm CPU — chạy
  lại một mình thì pass 3/3 trong ~90 s. Bài học: **không chạy sweep nặng
  song song với capture headed** (lần đầu tiên gặp lỗi này; các capture trước
  đều chạy khi VM rảnh).
- **Mô hình trilinear đã đổi sau Z2:** C3 tái lập bằng trilinear hiện tại lệch
  render-1k std 0,31 (blend-at-end đợt 73 A1). Mọi so sánh A dùng render-1k
  gốc nên không bị ảnh hưởng; chỉ ước lượng làm mượt A0−A1 mang thêm nhiễu
  này — đã tách sạch bằng C3-check (§2.4).
- **clampFrac noise-transfer f24 = 0,045** (4,5% pixel kẹp khi chuyển delta
  noise từ render f25 sang render f24): chỉ ảnh hưởng frame noise của ref f24,
  **không ảnh hưởng residStd** (chỉ dùng plain). Các ref f25: clampFrac ≤ 0,0001.
- **Nguyên nhân browser-internal của off-by-one chưa xác định** (seek hạ cánh
  999,x ms hay chọn frame pts < currentTime) — chỉ có bằng chứng thực nghiệm
  preview == f24. Không đoán sâu hơn.
- **Pan là motion giả 1 chiều, dịch nguyên khung** (edge-replication): không
  có motion cục bộ, không có motion blur, không có thay đổi phối cảnh — đủ để
  tách (ii-a)/(ii-b) nhưng không phải mô hình đầy đủ của motion thật.
- Không đụng production, không đổi luật gate, không push, không release/tag.
  Không đụng TTS/Gradio, không đụng `.github/workflows/*`.

---

## 9. File thay đổi (stage, KHÔNG push)

**Thêm:**
- `apps/web/scripts/r82j5-resid-mechanism.mjs` — thí nghiệm A/B/D (node-only:
  phân rã F7, sweep làm mượt 24 encode, đối chứng tp).
- `apps/web/scripts/r82j5-c3-check.mjs` — kiểm chứng bổ sung bằng bộ lọc C3.
- `apps/web/scripts/r82j5-pan-build.mjs` — build video pan motion-giả
  (0/2/8 px/frame) + frame render khớp/lệch.
- `apps/web/scripts/r82j5-headed-capture.mjs` — capture headed pan (sao chép
  r81i4-headed-capture.mjs, đổi đường dẫn/scratch sang round82-j5).
- `apps/web/scripts/r82j5-sweep.mjs` — đánh giá capture pan (khớp f30 + lệch
  f25, cả hai số học; tên file JSON kèm cửa sổ — sửa lỗi I4 §5).
- `apps/web/scripts/test_round82_j5_q4_resid.mjs` — test 30 kiểm chứng số
  headline (30/30 pass).
- `docs/PHASE9_ROUND82_J5_Q4_RESID_MECHANISM_LIMITS.md` — tài liệu này.

**Không stage:** binary media/render (mp4/.raw/.rgb/.yuv) trong
`hidden_files/round82-j5/` (tái lập được bằng script), snapshot headed JSON
(dữ liệu thô, ở lại hidden_files), log capture/sweep (ở lại hidden_files),
`.github/workflows` (không đụng).

## 10. Dữ liệu (hidden_files/round82-j5/, không stage)

- `r82j5-resid-mechanism.json` — mọi số đo A/B/D + tái lập.
- `r82j5-resid-mechanism.log` — log chạy A/B/D.
- `r82j5-c3-check.json` + `.log` — check C3.
- `r82j5-pan-build.log` — build 4 video pan.
- `r82j5-capture-{pan-slov-s0,pan-slov-s2,pan-slov-s8,pan-tp-s8}.log` (+
  `r82j5-capture-pan-slov-s8-r2.log` — lần chạy lại thành công) — log capture.
- `r82j5-sweep-{pan-slov-s0,pan-slov-s2,pan-slov-s8,pan-tp-s8}-w1920x1080.json`
  + `.log` — 16 case pan (khớp + lệch).
- `r82j5-sweep-pan-slov-s0.log` — (đã gộp trong danh sách trên).
- `headed-w1920x1080-{pan-slov-s0,pan-slov-s2,pan-slov-s8,pan-tp-s8}/` —
  snapshot headed + chrome-userdata + vite log từng phiên.
- `media/` — 4 mp4 pan + 24 mp4 sweep B (binary, không stage).
- `render/` — frame decode/render/noise (binary, không stage).
- `round82-j5.md` — log luồng J5.
