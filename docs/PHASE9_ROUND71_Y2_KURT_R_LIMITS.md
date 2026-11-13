# PHASE 9 ĐỢT 71 — LUỒNG Y2: Δkurt R FULL-PIXEL + PROBE VIDEO THẬT + VERDICT NỘI DUNG TỰ NHIÊN

**Ngày:** 09/11/2026 · **Nợ đóng:** đợt 70 §4 mục 2 (Δkurt R còn lại ở
w1440 0,45–0,49 + w1920 n10 trilinear 0,42 sau hiệu chỉnh delta0 của X6).
**Kết quả tóm tắt — đọc trước:**

1. **Nợ testsrc2 w1440 ĐÓNG PHẦN LỚN BẰNG FULL-PIXEL:** sau hiệu chỉnh
   delta0 + tính trên TOÀN BỘ pixel rect video (không step-4), w1440
   noise05 Δkurt R **0,49 → 0,29 KHỚP**, noise10 **0,45 → 0,34 KHỚP**
   (sát nút 0,35). Verdict step-4 của X6 ở 2 ô này là DO PHA LẤY MẪU:
   tính lại Δkurt R trên mẫu step-4 ở 4 pha từ chính dữ liệu full-pixel
   cho 0,62/0,49/0,27/0,67 (noise05) và 0,57/0,46/0,40/0,54 (noise10) —
   mẫu step-4 thiên lệch Δkurt R lên cao hơn full-pixel ~0,1–0,25 một
   cách có hệ thống, không chỉ nhiễu ngẫu nhiên.
2. **w1920 noise10 testsrc2 VẪN LỆCH, nhưng nhẹ hơn:** Δkurt R
   **0,42 → 0,38** full-pixel (ngưỡng 0,35) — chỉ còn lệch 0,03, và
   dưới 1-kernel ô này KHỚP (Δkurt R 0,06). Đây là ô duy nhất còn lệch
   trên testsrc2 sau hiệu chỉnh.
3. **KHÔNG có bias đường video:** probe với nguồn VIDEO thật (h264 CRF0
   + PNG cùng mẫu): profile luma video-vs-canvas **MAD = 0, max = 0 ở
   cả 30 profile** (4 mẫu × 6 thang × row/col) — `<video>` và
   `<img>`/canvas dùng ĐÚNG CÙNG bộ lọc resample trong Chrome headed.
   Giả thuyết "đường video có bias khác" (X6 §8.2/§10.1) CHẾT bằng đo
   trực tiếp. Việc kurt R ở w1920 "thích" 1-kernel hơn là đặc tính của
   bộ lọc theo THANG (xem §3), không phải theo loại nguồn.
4. **Nội dung tự nhiên sau delta0 (trilinear, full-pixel): 10/12 KHỚP**
   (basgo 4/4, slovenska 4/4, ocean w1920 2/2). **Ocean w1440 là ngoại
   lệ thật, tái lập được pixel-identical:** noise05 LỆCH (Δkurt G 1,12;
   Δcorr R-G 0,233), noise10 LỆCH (Δkurt R 0,37). Không phải lệch khung
   (frame 25 khớp tốt nhất, MAD 4,46 vs 10,4–12,7 ở khung kề), không
   phải transient (chạy lại phiên headed độc lập cho snapshot
   pixel-identical). Xem §4.
5. **Đính chính X6 §10.4:** delta0 KHÔNG "nhỏ hơn nhiều trên nội dung
   tự nhiên" nói chung — ocean có mean|delta0| = 3,70, gấp ~3× testsrc2
   (1,28); và trên ocean, TRỪ delta0 làm Δkurt R TỆ ĐI một cách có hệ
   thống ở cả 6 ô đo được (0,14→0,44; 0,19→0,39; 0,23→0,37; 0,21→0,32;
   …). Delta0 là đặc thù nội dung bão hoà, không phải hiệu chỉnh phổ
   quát. Xem §5.
6. **Trilinear LOD-bias −0,5 GIỮ LÀM production (không đổi code):** pooled
   MAD fit 0,0157, tệ nhất 0,0909 trên 30 profile hình học vuông — tốt
   nhất trong 3 mô hình xét (1-kernel 0,0271/tệ nhất 0,3764; 2-stage
   0,1316). Trilinear cho stdRatio ≈ 1,00–1,03 ở mọi ô KHỚP; 1-kernel
   tuy khớp kurt ở w1920 nhưng HỎNG stdRatio ở w1440 (G 0,77–0,82).
   Phần dư còn lại là tinh tế bậc-4 phụ thuộc thang, không phải sai
   mô hình bậc-1. Xem §6.

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`.
**KHÔNG push, KHÔNG release/tag, KHÔNG sửa code production trong luồng
này.** Mọi số dưới đây là đo thật (Node v24.22.1; Chromium 1254 headed
qua Xvfb, --disable-gpu, VM 4 vCPU, không GPU; load máy cao trong lúc
đo — xem §7 — nhưng snapshot xác định pixel-identical khi chạy lại).
Ngưỡng verdict như T3/X6: std ratio [0,85, 1,18], |Δkurt| ≤ 0,35,
|Δcorr| ≤ 0,12. Probe/log/JSON tại `hidden_files/round71-y2/`, log luồng
`hidden_files/round71-y2.md`.

---

## 1. Thí nghiệm (a) — Capture toàn bộ pixel ở headed + verdict sau delta0

Harness mới `apps/web/scripts/r71y2-headed-capture.mjs` (mẫu R65 S7:
vite dev + Xvfb + Chromium 1254 + CDP, seed qua localStorage autosave,
import bằng DOM.setFileInputFiles, effects qua store.patchClip, playhead
1,0). Khác R65: snapshot **toàn bộ pixel vùng video** (rect nguyên, cùng
công thức hình học với parity-66t3-compare.mjs), lưu RGB24 base64; import
1 lần 4 media rồi đổi `clip.src` bằng patchClip giữa các nguồn (đã xác
minh `patchClip` nhận `src` — store.ts:1801 merge `Partial<Clip>`).

- w1440 (1440×900): rect **489×275 @(191,0), scale 0,3819**,
  n = 134.475 pixel. w1920 (1920×1080): rect **809×455 @(271,0),
  scale 0,6319**, n = 368.095 pixel. (LƯU Ý: lần chạy w1920 đầu dùng
  1920×1200 cho rect 1022×575, scale 0,7986 — không phải hình học W6;
  đã chạy lại 1920×1080 để khớp W6. Bản 1200 giữ làm điểm thang phụ,
  xem §1.3.)
- Mỗi nguồn × 5 snapshot: plain / plain2 / noise05 / noise05b / noise10.
  Xác định: D1 plain-vs-plain2 và D2 noise05-vs-noise05b đều
  **pixel-identical ở cả 8 cặp nguồn×cửa sổ** (16/16), H9 0 lỗi trang
  cả 3 phiên. proxyUsed = false hết (proxy chỉ gắn tay qua setMediaProxy).
- Frame render đối chiếu: testsrc2 tái dùng `fullrgb-*.raw` của T3
  (frame 30); tự nhiên trích từ clip gốc bằng ffmpeg
  (scale 1280:720 bt709 + `noise=alls=28/50:allf=t` rồi select frame:
  ocean frame 25, basgo 30, slovenska 25 — đúng t = 1,0 s theo fps
  từng clip). Delta0 tính verbatim theo X6 (est-chroma k 1,04/1,12),
  resample trilinear về viewport.
- Phân tích: `apps/web/scripts/r71y2-analyze.mjs` — resample render bằng
  trilinear production + 1-kernel, deltaStats trên toàn bộ pixel, có/không
  delta0, + Δkurt R trên mẫu step-4 ở 4 pha từ cùng dữ liệu full-pixel.

### 1.1 Bảng verdict SAU hiệu chỉnh delta0 — trilinear, full-pixel

| Cửa sổ | Nguồn | noise05 | noise10 |
|---|---|---|---|
| w1440 | test-pattern | **KHỚP** Δkurt [0,29, 0,16, 0,28], Δcorr [0,003, 0,017, 0,051] | **KHỚP** Δkurt [0,34, 0,04, 0,26], Δcorr [0,028, 0,011, 0,042] |
| w1440 | ocean | **LỆCH** Δkurt [0,44, **1,12**, 0,08], Δcorr [**0,233**, 0,072, 0,144] | **LỆCH** Δkurt [**0,37**, 0,15, 0,02], Δcorr [0,092, 0,034, 0,057] |
| w1440 | basgo | **KHỚP** Δkurt [0,16, 0,19, 0,11], Δcorr [0,088, 0,034, 0,057] | **KHỚP** Δkurt [0,12, 0,09, 0,11], Δcorr [0,034, 0,021, 0,022] |
| w1440 | slovenska | **KHỚP** Δkurt [0,14, 0,04, 0,05], Δcorr [0,012, 0,007, 0,000] | **KHỚP** Δkurt [0,24, 0,05, 0,07], Δcorr [0,009, 0,003, 0,005] |
| w1920 | test-pattern | **KHỚP** Δkurt [0,33, 0,17, 0,18], Δcorr [0,005, 0,006, 0,036] | **LỆCH** Δkurt [**0,38**, 0,23, 0,23], Δcorr [0,013, 0,003, 0,030] |
| w1920 | ocean | **KHỚP** Δkurt [0,35, 0,18, 0,04], Δcorr [0,077, 0,029, 0,047] | **KHỚP** Δkurt [0,32, 0,06, 0,00], Δcorr [0,037, 0,016, 0,022] |
| w1920 | basgo | **KHỚP** Δkurt [0,15, 0,07, 0,10], Δcorr [0,026, 0,014, 0,014] | **KHỚP** Δkurt [0,12, 0,05, 0,09], Δcorr [0,021, 0,013, 0,011] |
| w1920 | slovenska | **KHỚP** Δkurt [0,14, 0,01, 0,04], Δcorr [0,011, 0,007, 0,005] | **KHỚP** Δkurt [0,24, 0,00, 0,07], Δcorr [0,014, 0,006, 0,006] |

**Tổng trilinear full-pixel: 13/16 KHỚP** (testsrc2 3/4, tự nhiên 10/12).
stdRatio ở mọi ô KHỚP là 0,98–1,07 (kênh G ocean w1440 noise05 là 1,20 —
vượt nhẹ 1,18, cùng ô LỆCH). Đối chiếu 1-kernel: w1440 LỆCH cả 8 ô
(stdRatio G 0,77–0,82 — preview std thấp hơn render hẳn; Δkurt G
0,28–1,36); w1920 KHỚP 7/8 (chỉ ocean noise05 LỆCH nhẹ Δkurt R 0,32…
không — 1-kernel w1920: testsrc2 2/2 KHỚP, ocean 2/2 KHỚP, basgo 2/2,
slovenska 2/2 = **8/8 KHỚP**). Nghĩa là: ở w1920, 1-kernel khớp thống
kê nhiễu TỐT HƠN trilinear; ở w1440, 1-kernel thua xa. Xem §3.

### 1.2 Nhạy pha của Δkurt R — verdict step-4 cũ là do pha

Δkurt R (trilinear, sau delta0) tính lại trên mẫu step-4 ở 4 pha
(rx ≡ phase mod 4) từ chính dữ liệu full-pixel, so với full-pixel:

| Ô | full-pixel | pha 0 | pha 1 (= X6) | pha 2 | pha 3 |
|---|---|---|---|---|---|
| w1440 testsrc2 noise05 | **0,29** | 0,62 | 0,49 | 0,27 | 0,67 |
| w1440 testsrc2 noise10 | **0,34** | 0,57 | 0,46 | 0,40 | 0,54 |
| w1920 testsrc2 noise10 | **0,38** | 0,40 | 0,42 | 0,51 | 0,50 |
| w1440 ocean noise05 | **0,44** | 0,37 | 0,39 | 0,54 | 0,62 |
| w1920 basgo noise05 | **0,15** | 0,14 | 0,09 | 0,21 | 0,16 |

Mẫu step-4 thiên lệch Δkurt R lên cao hơn full-pixel ở 4/5 ô trên
(trung bình +0,14; riêng testsrc2 w1440 +0,20/+0,33/+0,11/+0,20).
Lý do: kurtosis (momen bậc 4) bị chi phối bởi ít pixel cực trị; mẫu
thưa step-4 hoặc bắt trúng hoặc trượt các pixel đó nên vừa nhiễu vừa
lệch lên. **Mọi verdict Δkurt dựa trên step-4 trước đây (W6/X6) đều
phải đọc lại với sai số này** — full-pixel là phép đo đáng tin duy
nhất cho kurt. Pha 1 (pha canvas-aligned của X6) cho đúng số X6
(0,49/0,46) — tái lập chéo phương pháp đo.

### 1.3 Điểm thang phụ s = 0,7986 (w1920 cửa sổ 1920×1200, rect 1022×575)

Trilinear ≡ 1-kernel ở thang này (λ* = 0) nên 2 mô hình cho số giống
hệt từng số — kiểm chứng nội bộ tốt. Verdict sau delta0: testsrc2 2/2
KHỚP (Δkurt R 0,26 / 0,34), basgo 2/2 KHỚP, slovenska 2/2 KHỚP,
**ocean noise05 LỆCH (Δkurt R 0,39; trước delta0 chỉ 0,19 — delta0
lại làm tệ đi)**, ocean noise10 KHỚP (0,33). Tổng điểm phụ: **7/8**.
Ocean noise05 LỆCH ở 2/3 thang (w1440: 0,44; h1200: 0,39) và sát nút
KHỚP ở w1920 (0,35 đúng ngưỡng); ocean noise10 KHỚP ở 2/3 thang
(w1920 0,32; h1200 0,33) và LỆCH ở w1440 (0,37) — xem §4.

---

## 2. Thí nghiệm (b) — Probe bộ lọc với nguồn VIDEO thật: MAD = 0

Harness `apps/web/scripts/r71y2-video-probe.mjs` + trang
`hidden_files/round71-y2/probe/probe.html`: cùng 1 mẫu 1280×720 vẽ 1
lần từ `<video>` (h264 CRF 0, yuv420p, seek 0,5 s) và 1 lần từ `<img>`
PNG cùng mẫu, cùng dst size, `imageSmoothingQuality = "high"` như
preview.tsx/effectCanvasSource. Mẫu: vline (1 px trắng dọc x=640),
hline (1 px ngang y=360), step (nửa đen/nửa trắng, biên x=640), dot
(1 px tại 640,360). Thang dst: 489×275 (s=0,382), 640×360 (0,5),
809×455 (0,632), 853×480 (0,667 — thang effectCanvas 1080p→720p),
1280×720 (1:1), 1733×975 (1,354 upscale). Profile luma bt709.

**Kết quả headline: video-vs-img MAD = 0, max = 0 ở cả 30 profile**
(4 mẫu × 6 thang × row/col; determinism: vẽ lại video 2 lần identical).
Decode 1:1 của video cho đúng mẫu gốc (peak luma 255 đúng vị trí;
PNG và video frame 15 kiểm chứng bằng ffmpeg độc lập). **Đường video
và đường ảnh/canvas dùng đúng cùng bộ lọc** — ít nhất với
`--disable-gpu` + smoothing high, là đúng cấu hình của harness parity.
Giả thuyết "đường video có bias khác / libyuv bilinear thay vì Skia
trilinear" (X6 §8.2/§10.1) **CHẾT**. (Bối cảnh code: plain không effect
vẽ `<video>` trực tiếp xuống viewport, noise vẽ qua effectCanvas —
2 đường nguồn khác nhau này vẫn dùng chung 1 bộ lọc drawImage; khác
biệt còn lại giữa plain/noise chỉ là delta0 + mô hình nhiễu, không
phải bộ lọc.)

Lưu ý: probe này đo drawImage resample; nó không đo bước YUV→RGB của
decoder (mẫu trắng/đen có chroma phẳng nên YUV420 không làm sai lệch
luma — đã kiểm chứng decode 1:1 cho đúng 255).

---

## 3. Fit mô hình trên hình học vuông — trilinear vẫn tốt nhất tổng thể, nhưng phụ thuộc thang

Fit 3 mô hình (từ `chrome-resample.mjs`, nguồn 1D chính xác) lên profile
đo được ở hình học vuông (cả 2 trục cùng scale — đúng hình học viewport
thật; khác hình học dẹt 1D mà W5 dùng để fit trilinear). MAD pooled
(30 profile):

| Mô hình | Pooled MAD | Tệ nhất | Theo thang (pooled) |
|---|---|---|---|
| **trilinear LOD-bias −0,5** | **0,0157** | **0,0909** | 489: 0,0367 · 640: 0,0002 · 809: 0,0255 · 853: 0,0135 · 1733: 0,0180 |
| 1-kernel | 0,0271 | 0,3764 | 489: 0,1346 · 640: 0,0011 · 809: 0,0084 · 853: 0,0005 · 1733: 0,0180 |
| 2-stage | 0,1316 | 0,4431 | 489: 0,0253 · 640: 0,0020 · 809: 0,1435 · 853: 0,1501 · 1733: 0,1894 |

Đọc bảng: **trilinear là mô hình đơn tốt nhất tổng thể** (pooled thấp
nhất, tệ nhất thấp nhất) — giữ làm production. Nhưng nó không chính xác
tuyệt đối theo thang: ở s = 0,382 thì 2-stage fit tốt hơn một chút
(0,0253 vs 0,0367); ở s = 0,632–0,667 thì **1-kernel fit tốt hơn hẳn**
(0,0084/0,0005 vs 0,0255/0,0135 — riêng hline 809×455: 1-kernel MAD
0,0011 vs trilinear 0,0549). Nói cách khác, bộ lọc thật của Chrome ở
hình học vuông hành xử gần triangle thuần ở thang ~0,63–0,67 và gần
trilinear/2-stage ở thang ~0,38 — W5 fit trilinear trên hình học dẹt
nên không bắt được phần phụ thuộc thang này (U2 §1.2 đã thấy dẹt-vs-
vuông khác hẳn ở s<0,5). Điều này giải thích gọn vì sao Δkurt R ở w1920
"thích" 1-kernel: không phải bias đường video, mà là **mô hình trilinear
dùng blend mip L0/L1 (f = 0,16) trong khi Chrome ở thang đó gần như chỉ
dùng mip L0**. Đề xuất mô hình thích ứng theo thang (trilinear khi
s < ~0,5, 1-kernel khi s ≳ 0,6) là hướng đợt sau — KHÔNG đổi production
trong luồng này (verdict nhiễu đã 13/16 KHỚP; đổi mô hình cần vòng kiểm
chứng riêng).

---

## 4. Anomaly ocean w1440 — LỆCH thật, tái lập được, chưa giải thích xong

### 4.1 Chữ ký anomaly (w1440, trilinear, sau delta0)

| | noise05 | noise10 |
|---|---|---|
| Δkurt [R,G,B] | [0,44, **1,12**, 0,08] | [0,37, 0,15, 0,02] |
| Δcorr [R-G, R-B, G-B] | [**0,233**, 0,072, 0,144] | [0,092, 0,034, 0,057] |
| stdRatio | [1,02, **1,20**, 1,04] | [0,99, 1,07, 1,02] |
| plain absMAD (trilinear) | 4,455 (le8 0,844) | — |

Số gốc: preview delta kurt G = 1,35 vs render 0,23; preview std G =
10,69 vs render 8,94; preview corr R-G = −0,123 vs render −0,356.
Plain absMAD của ocean (4,46) cao hẳn các nguồn khác (testsrc2 1,05;
basgo 2,61; slovenska 1,88) — khung plain của preview đã lệch render
nhiều trước khi nói tới nhiễu.

### 4.2 Đã loại trừ bằng đo thật

- **Lệch khung: CHẾT.** absMAD preview-plain vs render frame 23–27:
  frame 25 tốt nhất rõ rệt (4,46 vs 10,4–12,7 ở khung kề), ở cả 2 cửa
  sổ. Preview đúng là frame 25.
- **Transient/tải máy: CHẾT.** Chạy lại phiên headed độc lập (vite +
  Chrome mới, ~15 phút sau) chỉ với ocean w1440: cả 5 snapshot
  **pixel-identical** với lần 1 (plain/plain2/noise05/noise05b/noise10,
  0 pixel lệch). Anomaly là xác định, không phải nhiễu do load.
- **Ma trận màu: CHẾT.** Cả 4 file nguồn đều không có metadata màu
  (color_space unknown) → Chrome và ffmpeg cùng fallback bt709 cho HD;
  render ép bt709 như T3. Không có VUI bt601 nào để lệch.
- **Đuôi delta không phải motion cục bộ:** mean|dG| theo 8 dải ngang
  gần như đều (7,4–10,6; hơi cao ở dải dưới), không cụm ở vùng sóng;
  đuôi |d|>30 của preview delta: R 11,8%, B 19,8%, G chỉ 1,2% — lệch
  là toàn cục, không phải một vùng chuyển động.

### 4.3 Hướng giải thích còn lại (chưa chứng minh — nợ đợt sau)

Ocean là nguồn duy nhất vừa (i) 1920×1080 qua bước scale video-path
1920→1280 của Chrome (khác ffmpeg bicubic của render — plain absMAD
4,46 là bằng chứng bước này lệch nhiều trên texture sóng tần số cao +
bão hoà), vừa (ii) có delta0 lớn (mean|d0| 3,70, lệch R 3,94). Hai yếu
tố này tương tác: delta0 của X6 tính từ khung plain RENDER, nhưng
khung plain thật của preview (qua scale Chrome) có trường est-chroma
khác → trừ delta0 "sai khung" có thể làm tệ thêm (xem §5: trên ocean,
trừ delta0 làm Δkurt R tệ đi ở cả 6 ô). Và G-kurt 1,35 của preview
delta gợi ý nhiễu preview có đuôi nặng hơn render trên nội dung này
(có thể là kẹp RGB sau cộng nhiễu YUV ở vùng sáng bão hoà — sóng/bọt
trắng gần rail). Cần đợt riêng: (a) khớp bước 1920→1280 của render với
bộ lọc video-path thật của Chrome (probe §2 cho thang 0,667: 1-kernel
fit tốt nhất, MAD 0,0005); (b) đo lại verdict ocean sau khi khớp bước
đó; (c) nếu vẫn lệch, phân rã đuôi delta theo bin độ sáng để kiểm tra
giả thuyết kẹp rail.

---

## 5. Delta0 trên nội dung tự nhiên — đính chính X6 §10.4

mean|delta0| ở viewport + std RGB của delta0 (trilinear):

| Nguồn | mean\|d0\| | delta0 std RGB | Tác dụng của trừ delta0 lên Δkurt R |
|---|---|---|---|
| test-pattern | 1,28–1,29 | [1,05, 4,41, 0,59] (G-nặng) | trung tính/tốt (Δcorr R-G 0,207→0,003 w1440 n05) |
| ocean | **3,70–3,72** | [3,94, 0,98, 0,94] (R-nặng) | **TỆ ĐI ở cả 6 ô**: 0,14→0,44; 0,19→0,39; 0,23→0,37; 0,21→0,32; 0,13→0,35; 0,23→0,33 |
| basgo | 0,28–0,32 | [0,84, 0,25, 0,47] | trung tính (≈0) |
| slovenska | 0,04–0,06 | [0,24, 0,02, 0,24] | trung tính (≈0) |

X6 viết "trên nội dung tự nhiên, hồi quy native-vs-derived cho k ≈
1,00–1,03 nên delta0 nhỏ hơn nhiều" — **sai với ocean**: ocean (biển
nắng, R bão hoà, mean RGB 198/109/71) có delta0 lớn gấp ~3× testsrc2,
tập trung kênh R. Delta0 phụ thuộc độ bão hoà + kênh trội của nội dung,
không phụ thuộc "tổng hợp vs tự nhiên". Hệ quả thực hành: **hiệu chỉnh
delta0 chỉ nên áp khi khung plain render và khung plain preview khớp
nhau** (testsrc2: absMAD ~1,0 → hiệu chỉnh tốt); khi plain đã lệch
nhiều (ocean absMAD 4,46) thì delta0 tính từ render là trường sai và
trừ nó làm tệ thêm. Đây cũng là lý do verdict ocean noise05 tệ nhất ở
w1440 (nơi plain lệch nhất). Không đổi harness trong luồng này (hiệu
chỉnh delta0 vẫn đúng cho testsrc2 và vô hại cho basgo/slovenska);
đợt sau quyết có điều kiện hoá hiệu chỉnh theo absMAD plain hay không.

---

## 6. Kết luận production: trilinear có đủ không?

- **ĐỦ cho production ở mức thống kê nhiễu hiện tại, với 2 ngoại lệ
  có tên.** Trilinear cho 13/16 KHỚP full-pixel sau delta0 (20/24 nếu
  tính cả điểm phụ s=0,799), stdRatio ≈ 1,00–1,03 ở mọi ô KHỚP, và là
  mô hình đơn fit tốt nhất trên probe hình học vuông. Không có bằng
  chứng nào cho bias đường video. **Không đổi code production.**
- **Ngoại lệ 1 — w1920 noise10 testsrc2 (Δkurt R 0,38):** lệch sát nút
  (0,03 trên ngưỡng), 1-kernel khớp ô này (0,06). Là tinh tế bậc-4 phụ
  thuộc thang (§3), không phải lỗi chức năng: preview và render đều
  đúng, chỉ khác nhau ở đuôi phân phối nhiễu sau resample ở thang
  0,63. Chấp nhận được cho tới khi có mô hình thích ứng theo thang.
- **Ngoại lệ 2 — ocean w1440 (và ocean noise05 LỆCH ở 2/3 thang):** lệch
  thật, tái lập được, cơ chế chưa đóng (§4.3). Phạm vi ảnh hưởng hẹp
  (1 clip bão hoà, 1 mức nhiễu ở thang nhỏ) nhưng là nợ mở có tên,
  không được giấu.
- Các ô KHỚP sát nút cần đọc đúng: w1440 testsrc2 noise10 Δkurt R 0,34
  (ngưỡng 0,35), w1920 ocean noise05 Δkurt R 0,35 (đúng ngưỡng) — verdict
  KHỚP nhưng không có biên an toàn; đừng trích dẫn chúng như khớp chắc.

---

## 7. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Headed capture w1440 (1440×900, 4 nguồn × 5 snapshot) | **9/9 pass**, exit 0; D1/D2 pixel-identical 8/8 cặp; H9 0 lỗi trang |
| Headed capture w1920 (1920×1080, hình học W6) | **9/9 pass**, exit 0; D1/D2 pixel-identical 8/8 cặp; H9 0 lỗi trang |
| Headed capture w1920-h1200 (điểm phụ s=0,799) | **9/9 pass**, exit 0 |
| Ocean w1440 repeat (phiên headed độc lập) | **3/3 pass**; 5/5 snapshot pixel-identical với lần 1 |
| Video probe (b) | exit 0; determinism video draw 2 lần identical; meta video 1280×720 readyState 4 cả 4 mẫu |
| Theora ocean: `canPlayType` + seek/draw probe | `""` + lỗi `DEMUXER_ERROR_NO_SUPPORTED_STREAMS` (code 4) — xem §8 |
| `node --check` 3 script mới | OK |
| `node --test chrome-resample-67u2.test.mjs` | **fail 0** (không đụng file này; baseline giữ nguyên) |
| Phân tích `r71y2-analyze.mjs` (w1440+w1920+h1200) | exit 0; JSON 158 KB + 90 KB |
| Pha step-4 tái lập số X6 | pha 1 cho 0,49/0,46 đúng số X6 — phương pháp đo nhất quán |

Điều kiện đo: load trung bình lúc chạy headed 5–14 (8–10 luồng đợt 71
chạy song song, nhiều phiên headed khác cùng lúc); dù vậy mọi snapshot
xác định pixel-identical khi chạy lại — kết quả không phụ thuộc load.
Không chạy lại tsc/vite build (không đụng TS/UI; chỉ thêm 3 file
`.mjs` harness — parent kiểm chứng gộp của đợt sẽ chạy lại nếu cần).

---

## 8. Phát hiện phụ: Theora .ogv KHÔNG play được trên Chromium 1254

Lần capture w1440 đầu: ocean06.ogv cho snapshot mean 12,66 ở cả 3
variant — thực ra là khung nền phẳng RGB (10, 12, 16), std 0,06 (không
có video). Probe trực tiếp: `canPlayType('video/ogg; codecs="theora"')`
trả `""`, video error code 4
`DEMUXER_ERROR_NO_SUPPORTED_STREAMS: FFmpegDemuxer: no supported
streams`, readyState 0. **Chromium 1254 (Chrome 158) trên VM này không
hỗ trợ Theora.** Đã xử lý: transcode ocean06.ogv → ocean06.mp4 (h264
CRF 18, giữ 1920×1080/25fps/6,4 s; SHA mp4
`8eae0e0a…`; SHA ogv gốc `4b9e690d…` khớp R64) và build lại frame render
từ chính mp4 đó (mean khung plain 198,3/109,5/71,4 vs 198,1/109,5/71,4
từ ogv — chênh ≤ 0,2). Hệ quả chung: **mọi clip .ogv/Theora đều không
preview được trong VCut trên Chrome hiện tại** — nếu kho mẫu còn file
Theora thì cần transcode; không phải lỗi của VCut. basgo (VP8) và
slovenska (VP9) play bình thường.

---

## 9. Nợ mở (trung thực)

1. **w1920 noise10 testsrc2 Δkurt R 0,38** — còn lệch sát nút. Hướng:
   mô hình thích ứng theo thang (§3) hoặc chấp nhận như giới hạn đã biết.
2. **Ocean w1440 (noise05 Δkurt G 1,12 + Δcorr 0,233; noise10 Δkurt R
   0,37)** — chưa giải thích xong (§4.3). Cần đợt riêng khớp bước
   1920→1280 với bộ lọc video-path thật rồi đo lại.
3. **Hiệu chỉnh delta0 chưa có điều kiện hoá:** trên nội dung mà plain
   render-vs-preview đã lệch nhiều (absMAD ≳ 4), trừ delta0 làm tệ đi.
   Cần quyết: điều kiện hoá theo absMAD plain, hoặc tính delta0 từ
   khung plain nhất quán với preview.
4. **Mô hình resample phụ thuộc thang ở hình học vuông** (§3): trilinear
   −0,5 là tốt nhất tổng thể nhưng không chính xác tuyệt đối (2-stage
   tốt hơn ở s=0,38; 1-kernel tốt hơn hẳn ở s=0,63–0,67). Cần probe
   thang dày hơn (0,45–0,65) + fit bias LOD theo thang trước khi đổi
   production.
5. **w2560 không đo lại trong luồng này** (phạm vi task là w1440/w1920;
   X6 đã KHỚP cả 2 mức ở w2560 bằng step-4 — với §1.2 thì verdict đó
   cũng cần full-pixel xác nhận lại ở đợt sau).
6. **Chưa đo GPU thật / Safari thật** (nợ kế thừa; mọi kết luận chỉ đúng
   trên CPU/SwiftShader + Chromium).
7. **Ngưỡng halve 0,45–0,63 vẫn chưa đo** (nợ U2 §7.1, nhắc lại).
8. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền,
   chờ user) — nợ chung.

## 10. File thay đổi (stage, KHÔNG push)

- `apps/web/scripts/r71y2-headed-capture.mjs` — harness capture
  full-pixel headed (4 nguồn × 5 variant, 1 cửa sổ/lần chạy).
- `apps/web/scripts/r71y2-video-probe.mjs` — harness probe bộ lọc nguồn
  video thật (trang probe + video/PNG mẫu).
- `apps/web/scripts/r71y2-analyze.mjs` — phân tích: fit mô hình probe +
  verdict full-pixel có/không delta0 + nhạy pha step-4.
- `docs/PHASE9_ROUND71_Y2_KURT_R_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / snapshot / JSON / frame
render): `hidden_files/round71-y2/` — `probe/` (probe.html,
probe-*.mp4/.png, ocean06.mp4, r71y2-video-probe.json,
r71y2-probe-chrome.log, ocean-test.html, chrome-userdata),
`render-nat/` (fullrgb-{ocean,basgo,slovenska}-{plain,noise05,noise10}.raw
+ fullrgb-ocean-plain-f23–f27.raw), `headed-w1440/` (r71y2-snaps +
report + log), `headed-w1920/` (tương tự), `headed-w1920-h1200/`
(điểm phụ), `headed-w1440-repeat/` (repeat ocean),
`r71y2-analysis.json`, `r71y2-analysis-h1200.json`,
`r71y2-ocean-check.mjs` (scratch điều tra ocean), log luồng
`hidden_files/round71-y2.md`. Footage tự nhiên KHÔNG đưa vào batch
(chỉ script/harness + LIMITS được stage; ocean06.mp4 transcode là tài
sản probe nội bộ, không stage).
