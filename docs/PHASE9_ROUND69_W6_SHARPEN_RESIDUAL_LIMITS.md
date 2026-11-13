# PHASE 9 ĐỢT 69 — LUỒNG W6: DƯ SHARPEN DIRECT-BRANCH + HEADED NOISE LỆCH-THỐNG-KÊ

**Ngày:** 09/11/2026 · **Nợ đóng:** V7 đợt 68 §8 mục 3–6 (phần dư
direct-branch chưa có predictor; scaler chưa đo w1920/w2560; headed noise
vẫn LỆCH-THỐNG-KÊ).
**Kết quả tóm tắt — 3 phát hiện, 0 sửa code production:**
1. **Predictor cho dư direct-branch: ÂM TÍNH.** 10 ứng viên thử trên dữ liệu
   full-res 4 cảnh × 2 mức — không ứng viên nào tách được pixel/ô dư vs sạch
   với ngưỡng ổn định qua cảnh. Predictor sàn chroma (P_R0/P_dir/P_chroma)
   thậm chí NGƯỢC tương quan trên ocean (AUC 0,16–0,24). Giữ verdict V7.
2. **Scaler w1920/w2560: ĐO XONG.** Chéo scaler bil/lanczos cho 0,89–1,03%
   trên basgo sharp10 (≥ phần dư headed 0,56–0,63% — giải thích trọn) và
   0,66–0,97% trên ocean (giải thích ~2/3 ở w1920, ~1/5 ở w2560; phần còn
   lại là sàn decode theo per-cell). Cùng scaler → 0,00% mọi ô (tái khẳng
   định V7).
3. **Headed noise đo lại trên Chrome 158: tái lập CHÍNH XÁC số T3** (độ trôi
   0,00 trên mọi thống kê, cả 6 tổ hợp) — phép đo xác định, không phải nhiễu
   đo. **Đính chính U2:** với cách lấy mẫu NHẤT QUÁN (T3), w1440 noise10
   vs đích 2-stage là **LỆCH** (Δkurt R 0,56, Δcorr R-G 0,123), không phải
   KHỚP như U2 báo — U2 đã trộn 2 kiểu lấy mẫu (preview canvas-aligned vs
   render (0,0)-aligned). **Phát hiện phương pháp:** kurtosis của delta
   nhiễu sau resample phụ thuộc pha lấy mẫu step-4 tới ±0,6 — verdict ở
   w1440 noise vs 2-stage và w2560 noise05 vs 1-kernel nằm SÁT NGƯỠNG và
   đổi theo pha; tiêu chí KHỚP-THỐNG-KÊ cần pin pha lấy mẫu (hoặc lấy mẫu
   toàn bộ pixel) mới kết luận chắc được ở các ô sát nút.

Repo: `vectornewsai-cmyk/repo-1`, code local `~/workspace/repo-1`. **KHÔNG
push, KHÔNG release/tag.** Mọi số dưới đây là đo thật (Chromium 1254 headed
qua Xvfb, Node, VM không GPU). Probe/log/JSON tại
`hidden_files/round69-w6/` (`r69w6-predictor.mjs`, `r69w6-scaler.mjs`,
`r69w6-noise-compare.mjs`, `r69w6-noise-phase.mjs`,
`r69w6-noise-midcheck.mjs`, `predictor/`, `scaler/`, `noise/`,
`headed/w1440|w1920|w2560/`), log luồng
`hidden_files/round69-w6-sharpen-residual.md`.

---

## 1. Nhiệm vụ 1 — Predictor cho dư direct-branch: ÂM TÍNH

### 1.1 Thiết kế (đăng ký trước)

Dữ liệu: shots within-decoder-exact 1280×720 (4 cảnh) + frame render
pre-encode (tái dùng scratch V7). Cổng kiểm tra: nErr8 tái lập đúng V7
(testsrc2 934/1586; ocean 239/432; slovenska/basgo 0/0) — khớp cả 4 cảnh,
dữ liệu đầu vào đúng. Predictor CHỈ tính từ 2 frame PLAIN (shot Chrome +
render ffmpeg) + amount — không dùng frame sharp.

10 ứng viên: `P_R0` = max_c |R0c_s − R0c_r|; `P_dY` = |ΔY_s − ΔY_r|;
`P_dir` = max_c |clip(R0c_s+ΔY_s) − clip(R0c_r+ΔY_r)| (mô phỏng đầy đủ đầu
ra nhánh direct từ mỗi decode); `P_chroma` = |DCb|+|DCr| theo pixel;
`P_edgeY` = std 5×5 của lumY_s; `P_edgeD` = std 5×5 của D_Y;
`P_E` = |lumEst_s − lumY_s|; `P_clip` = max_c excess(R0c_s);
`P_R0nb3`/`P_dirNb3` = max 3×3 của P_R0/P_dir (lân cận — mask sai tại biên).

Tiêu chí CHẤP NHẬN (đăng ký trước): MỘT ngưỡng duy nhất cho TPR ≥ 95% VÀ
FPR ≤ 5% (pixel direct) trên CẢ 4 combo có dư (testsrc2/ocean × sharp05/
sharp10) VÀ độ chính xác mức ô ≥ 95% trên cả 2 cảnh có dư VÀ fireAll ≤ 1%
trên slovenska/basgo (nErr8 = 0). Tập đánh giá: pixel direct (either),
dư = errMax > 8 (testsrc2: 842/1484 px dư-direct; ocean: 237/422 px).

### 1.2 Kết quả — không ứng viên nào đạt (TPR@8 / FPR-direct@8 / AUC)

| Predictor | testsrc2 05 | testsrc2 10 | ocean 05 | ocean 10 | fireAll basgo/slov. |
|---|---|---|---|---|---|
| P_R0 | 0,006 / 0,002 / 0,63 | 0,007 / 0,002 / 0,67 | 0 / 0,009 / 0,22 | 0 / 0,009 / 0,23 | 0,0% / 0,0% |
| P_dY | 0 / 0 / 0,50 | 0 / 0 / 0,50 | 0 / 0 / 0,50 | 0 / 0 / 0,50 | 0,0% / 0,0% |
| P_dir | 0,029 / 0,001 / 0,67 | 0,036 / 0,002 / 0,73 | 0 / 0,010 / 0,21 | 0,005 / 0,014 / 0,23 | 0,3% / 0,0% |
| P_chroma | 0 / 0 / 0,63 | 0 / 0 / 0,68 | 0 / 0 / 0,16 | 0 / 0 / 0,24 | 0,0% / 0,0% |
| **P_edgeY** | **0,963 / 0,040 / 0,97** | **0,978 / 0,040 / 0,97** | 0,481 / 0,101 / 0,70 | 0,692 / 0,100 / 0,81 | **29,7% / 5,9%** |
| P_edgeD | 0 / 0 / 0,50 | 0 / 0 / 0,50 | 0 / 0 / 0,50 | 0 / 0 / 0,50 | 0,0% / 0,0% |
| P_E | 0,038 / 0 / 0,47 | 0,103 / 0 / 0,62 | 0 / 0 / 0,51 | 0 / 0 / 0,64 | 0,0% / 0,0% |
| P_clip | 0,795 / 0,665 / 0,45 | 0,861 / 0,665 / 0,59 | 0,308 / 0,819 / 0,29 | 0,517 / 0,819 / 0,49 | 0,0% / 0,0% |
| P_R0nb3 | 0,150 / 0,006 / 0,88 | 0,117 / 0,006 / 0,90 | 0,004 / 0,017 / 0,27 | 0 / 0,017 / 0,27 | 0,0% / 0,0% |
| P_dirNb3 | 0,214 / 0,005 / 0,94 | 0,222 / 0,006 / 0,94 | 0,004 / 0,024 / 0,30 | 0,026 / 0,048 / 0,40 | 0,0% / 0,0% |

**Đọc bảng:**
- **P_edgeY là ứng viên duy nhất gần đạt trên testsrc2** (TPR 96–98%,
  FPR 4,0%, Youden tốt nhất T=6: TPR 0,966/0,980, FPR 0,041) — nhưng
  **sụp trên ocean** (TPR 48–69%, FPR 10%) và **không đặc hiệu**: bắn
  29,67% pixel basgo và 5,92% pixel slovenska, nơi nErr8 = 0. Đây là
  artefact của test pattern (dư nằm ở cạnh sắc của pattern) chứ không phải
  predictor chung — ngưỡng không ổn định qua cảnh → BÁC.
- **Predictor sàn chroma NGƯỢC tương quan trên ocean** (AUC 0,16–0,24,
  tệ hơn ngẫu nhiên): tại pixel dư, chênh lệch R0 giữa 2 decode NHỎ HƠN
  tại pixel direct-sạch. P_dir — mô phỏng đầy đủ nhất của giả thuyết V7
  §3.3 ("R0_est khác nhau giữa 2 decode") — chỉ bắt được 0–3,6% pixel dư
  ở ngưỡng 8. Giả thuyết "dư do R0 plain-frame khác nhau" KHÔNG được dữ
  liệu ủng hộ ở dạng đơn giản: tại pixel dư, R0 hai decode gần như trùng
  nhau (< 8) nhưng delta error vẫn > 8. Cơ chế thật nằm ở chỗ khác
  (tương tác clip + plain-floor theo kênh, hoặc ΔY tại biên mask — xem §5).
- P_dY/P_edgeD: TPR = 0 (AUC 0,50 — không có tín hiệu). P_E: TPR ≤ 0,10.
  P_clip: TPR cao nhưng FPR 0,67–0,82 (gần như mọi pixel direct đều kẹp
  sâu — testsrc2 direct 97%). P_R0nb3/P_dirNb3 cải thiện testsrc2
  (AUC 0,88–0,94; Youden tốt nhất T=2–4: TPR 0,72–0,97 nhưng FPR 0,05–
  0,25) nhưng vẫn TPR ≈ 0 trên ocean.
- **Mức ô 16×16 (3600 ô):** không predictor nào đạt cell-TPR ≥ 95% với
  FPR ≤ 5% trên cả 2 cảnh. Tốt nhất: P_dirNb3 testsrc2 sharp10 cell-TPR
  0,778 @ FPR 0,037 (T=8); cùng predictor trên ocean cell-TPR = 0.
  Độ chính xác ô 0,95–0,97 chỉ phản ánh đa số ô sạch (ô dư chỉ 3–6%:
  testsrc2 193/225 ô, ocean 104/162 ô) — không phải khả năng tách.
- **Tổ hợp hậu kiểm (không đăng ký trước, chỉ để khẳng định âm tính):**
  không cần chạy — mọi ứng viên có TPR cao trên ocean đều có FPR ≥ 10%
  (P_edgeY) và mọi ứng viên đặc hiệu đều có TPR ≈ 0 trên ocean; không
  phép hợp nào (OR/AND) đạt được TPR ≥ 95% + FPR ≤ 5% đồng thời trên cả
  2 cảnh. Âm tính là vững, không phải do thiếu tổ hợp.

**Kết luận nhiệm vụ 1: ÂM TÍNH.** Không có predictor đơn giản nào tách được
ô dư vs ô sạch với ngưỡng ổn định. Phần dư direct-branch (0,03–0,17%
full-res) vẫn chưa có predictor — giữ verdict V7 (SÀN, dựa vào (A') = 0 +
full-res ≤ 0,17%). Không đề xuất áp dụng metric mới; không sửa code.

---

## 2. Nhiệm vụ 2 — Đối chứng scaler w1920/w2560: ĐO XONG

Phương pháp: như V7 probe 3 (Node thuần: decode PNG tự viết — đối chứng
ocean-plain khớp từng byte với raw ffmpeg; scale bilinear/Lanczos-3 tách
được; lưới step 4, metric le8_net_nb như headed). Thêm w1920 [809,455] +
w2560 [1733,975], chạy cả 4 cảnh. Chạy 1 lần (code xác định; V7 đã kiểm
chứng chạy 2 lần giống nhau tới 0,01pp).

### 2.1 Bảng tổng hợp — le8_net_nb sharp10 (chéo scaler = max 2 hướng)

| Cảnh | w1920 cùng | w1920 chéo | w1920 headed* | w2560 cùng | w2560 chéo | w2560 headed* |
|---|---|---|---|---|---|---|
| testsrc2 | 0,03–0,09% | 0,01–0,02% | 0,09% | 0,10–0,14% | 0,04–0,06% | 0,33% |
| slovenska | 0,00% | 0,06% | 0,06% | 0,00% | 0,05–0,07% | 0,02% |
| basgo | 0,00% | **0,98–1,02%** | 0,56% | 0,00% | **0,89–1,03%** | 0,63% |
| ocean | 0,00% | **0,66–0,72%** | 1,09% | 0,02–0,04% | **0,90–0,97%** | 4,89% |

(* headed = le8_net_nb V7 probe 1. sharp05 chéo: basgo 0,00–0,03%,
ocean 0,00–0,06% — không đáng kể. Floor MAD chéo scaler: basgo w1920
0,97→1,83, w2560 0,97→1,51; ocean w1920 2,15→2,91, w2560 2,15→2,99.)

**Đọc bảng:**
- **Cùng scaler → residual = 0,00% ở mọi ô** (tái khẳng định V7 ở 2 cỡ mới).
- **Basgo: chéo scaler (0,89–1,03%) VƯỢT phần dư headed (0,56–0,63%)** ở
  cả 2 cỡ — sai khác scaler một mình đã đủ giải thích trọn phần dư headed
  của basgo w1920/w2560 (Chrome drawImage ≠ ffmpeg bilinear; bil/lanczos
  chỉ là proxy cho bậc độ lớn, số tuyệt đối chỉ tham khảo như V7 §4).
- **Ocean w1920:** chéo scaler 0,66–0,72% giải thích ~2/3 phần dư headed
  1,09%; phần còn lại là sàn decode (per-cell V7: 0 px dư ở ô sạch).
- **Ocean w2560:** chéo scaler 0,90–0,97% chỉ giải thích ~1/5 phần dư
  headed 4,89%; phần lớn còn lại là sàn decode (floor MAD 1,28, ô tệ nhất
  6,00; per-cell 0/5166 px ở ô sạch).
- **Testsrc2/slovenska:** chéo scaler ≤ 0,07% ở cả 2 cỡ — không đáng kể,
  khớp với việc 2 cảnh này vốn KHỚP-trừ-sàn ở headed.
- So với 1:1 (V7: chéo 1,33–1,59%): đóng góp scaler ở w1920/w2560 nhỏ hơn
  ở 1:1 trên testsrc2/slovenska, nhưng vẫn ~1% trên basgo/ocean sharp10 —
  vì ở 2 cảnh này delta sharpen lớn và texture khiến sai khác kernel lộ rõ.

**Kết luận nhiệm vụ 2:** nợ V7 §8 mục 4 đã đóng. Mọi ô residual headed
w1920/w2560 nay đều có phân rã định lượng: scaler (chéo bil/lanczos) +
sàn decode (per-cell + full-res). Không ô nào còn thiếu lời giải thích.

---

## 3. Nhiệm vụ 3 — Headed noise đo lại trên Chrome 158: TÁI LẬP CHÍNH XÁC + ĐÍNH CHÍNH U2

### 3.1 Đo lại headed (Chrome 158, Xvfb)

Chrome: `~/.cache/ms-playwright/chromium-1254/chrome-linux64/chrome` =
Google Chrome for Testing **158.0.8127.18**. Harness
`parity-65s7-rail-clamp-headed.mjs` (vite dev + Xvfb + CDP), chạy 3 cửa sổ
(1440×900, 1920×1080, 2560×1600) vào `round69-w6/headed/w*` (KHÔNG ghi đè
snaps T3). Kết quả harness: **7/7 pass cả 3 cửa sổ** (C1 plain 2 lần
pixel-identical; C4b noise 2 lần pixel-identical; C2/C3/C4/C5 đơn điệu theo
intensity; H9 0 lỗi trang; media proxy=false). Hình học video khớp đúng T3
(w1440 489×275 scale 0,3819444; w1920 809×455 scale 0,6319444; w2560
1733×975 scale 1,3541667).

**Độ trôi vs T3 = 0,00 trên MỌI thống kê, cả 6 tổ hợp** (preview std/kurt/
corr của delta headed mới so với `r66t3-compare-report.json`): phép đo headed
noise là xác định tuyệt đối trên cùng Chrome 158 — "lệch" là tính chất ổn
định của phép so preview-vs-mô hình, không phải nhiễu đo hay trôi Chrome.

### 3.2 Verdict theo đích (tiêu chí T3/U2: std ratio ∈ [0,85, 1,18]; Δkurt ≤ 0,35; Δcorr ≤ 0,12)

| Cửa sổ | Mức | 1-kernel (T3) | 2-stage (U2, đích đúng s<0,5) | ffmpeg-bilinear |
|---|---|---|---|---|
| w1440 | noise05 | LỆCH (std G 0,83) | **LỆCH** (Δkurt R 0,62; Δcorr R-G 0,205) | LỆCH (std 1,33–1,90) |
| w1440 | noise10 | LỆCH (std G 0,76) | **LỆCH** (Δkurt R 0,56; Δcorr R-G 0,123) | LỆCH (std 1,20–1,76) |
| w1920 | noise05 | **KHỚP** | LỆCH (std G 1,53; Δkurt R 1,74) | LỆCH |
| w1920 | noise10 | **KHỚP** | LỆCH (std G 1,39; Δkurt R 1,67) | LỆCH |
| w2560 | noise05 | LỆCH (Δkurt G 0,39†) | LỆCH (std G 1,72; Δkurt R 2,17) | LỆCH |
| w2560 | noise10 | **KHỚP** | LỆCH (std G 1,56; Δkurt R 1,91) | LỆCH |

(† sát nút — xem §3.3. Đích 1-kernel tái lập đúng verdict T3 cả 6 ô.
Đích 2-stage ở w1920/w2560 LỆCH với biên lớn — khớp quy luật U2: Chrome
chỉ halve khi s<0,5, 1-kernel mới đúng ở s≥0,5.)

### 3.3 Đính chính U2 — verdict w1440 vs 2-stage phụ thuộc cách lấy mẫu

U2 báo w1440 noise10 vs 2-stage **KHỚP-THỐNG-KÊ** (Δkurt [0,24, 0,19,
0,33], Δcorr [0,118, 0,002, 0,031]) và noise05 chỉ lệch Δcorr R-G
(0,199). **Số W6 với cách lấy mẫu NHẤT QUÁN cho kết quả khác:**
noise05 Δkurt [0,62, 0,29, 0,35], Δcorr [0,205, 0,002, 0,035];
noise10 Δkurt [0,56, 0,15, 0,33], Δcorr [0,123, 0,009, 0,032] —
**cả 2 đều LỆCH**, noise10 lật KHỚP → LỆCH.

Nguyên nhân (đã kiểm chứng bằng `r69w6-noise-phase.mjs` + đối chứng
`r69w6-noise-midcheck.mjs`):
- **Không phải do làm tròn mid-stage:** float-mid vs uint8-mid cho cùng
  render kurt tới 0,01 (w1440 noise05: [2,92, 0,42, 1,59] cả 2 biến thể;
  module `resampleRgb24TwoStage` ≡ bản inline U2). Giả thuyết này đã bác.
- **Là do PHA LẤY MẪU step-4:** U2 tính thống kê preview từ báo cáo T3
  (lấy mẫu canvas-aligned: rx ≡ 1 mod 4, do rect.x = 191,06) nhưng tính
  thống kê render bằng `deltaSampled` lấy mẫu (0,0)-aligned (rx ≡ 0 mod 4)
  — **trộn 2 lớp pha khác nhau**. Kurtosis của delta nhiễu sau resample
  phụ thuộc mạnh vào pha: render kurt R của 2-stage w1440 noise05 dao
  động **2,34–2,93** qua các pha (phase0: 2,93 → Δkurt 0,03; phase1: 2,55;
  phase2: 2,69; phase3: 2,77; canvas-aligned: 2,34 → Δkurt 0,62;
  toàn bộ pixel: 2,79 → Δkurt 0,17). Cơ chế: kernel tam giác có trọng số
  khác nhau theo pha, nên phân phối đuôi (momen bậc 4) của trung bình có
  trọng số đổi theo lớp pha; lấy mẫu step-4 chỉ thấy MỘT lớp pha.
- **Verdict noise10 vs 2-stage lật theo pha:** phase0 KHỚP (Δkurt 0,24,
  Δcorr 0,118), phase1 LỆCH (0,47/0,103), phase2 KHỚP (0,33/0,119),
  phase3 LỆCH (0,43/0,116), canvas-aligned LỆCH (0,56/0,123), toàn bộ
  pixel KHỚP (0,31/0,118). **Ô này nằm đúng trên ngưỡng** — không thể gọi
  KHỚP hay LỆCH một cách vững chắc với lấy mẫu step-4; với pha đã pin
  theo phương pháp T3 (canvas-aligned cả 2 phía — cách ghép pixel đúng)
  thì verdict là LỆCH. U2 đã đúng về hướng (2-stage tốt hơn hẳn 1-kernel
  ở w1440: std ratio 1,01–1,11 vs 0,76–0,94) nhưng sai về verdict tuyệt
  đối ở ô noise10 do trộn pha lấy mẫu.
- **w2560 noise05 vs 1-kernel cũng sát nút:** Δkurt G 0,33–0,39 qua các
  pha (ngưỡng 0,35): phase3 KHỚP (0,34), các pha còn lại + toàn bộ pixel
  LỆCH (0,36–0,39). Với pha đã pin (T3): LỆCH.
- Các verdict còn lại là VỮNG theo pha: 1-kernel w1440 (std G 0,76–0,83,
  lệch xa ngưỡng), 2-stage w1920/w2560 (std G 1,39–1,72, Δkurt R 1,5–2,3),
  1-kernel w1920/w2560 noise10 KHỚP (biên ≥ 0,07).

**Kết luận nhiệm vụ 3:** headed noise vẫn LỆCH-THỐNG-KÊ ở w1440 (cả 2 mức,
cả 2 đích mô hình đúng/sai thang) và w2560 noise05 (sát nút). Nợ "headed
noise LỆCH-THỐNG-KÊ" KHÔNG đóng được bằng dữ liệu hiện tại — nhưng nay đã
biết chính xác nó lệch ở đâu: **w1440: std kênh G thấp (1-kernel) hoặc
kurt R + corr R-G cao (2-stage); w2560 noise05: kurt G cao hơn render
~0,39.** Và đã biết verdict ở 2 ô sát nút phụ thuộc pha lấy mẫu — tiêu chí
cần pin pha (hoặc lấy mẫu toàn bộ pixel) trước khi kết luận ở đó. Hướng
tiếp theo (xem §5): đo corr/kurt theo pha + mô hình 2-stage có hạng bất
đối xứng theo pha (dư ±16 của U2 §2.3) — cùng một gốc rễ.

---

## 4. Kiểm chứng

| Kiểm tra | Kết quả |
|---|---|
| Predictor: nErr8 tái lập V7 | **Khớp cả 4 cảnh** (934/1586, 239/432, 0/0, 0/0) |
| Scaler: decoder Node vs raw ffmpeg | **Khớp từng byte** (ocean plain, như V7) |
| Scaler: cùng scaler → residual | **0,00% mọi ô** (16/16 cặp cùng-scaler) |
| Headed: harness 3 cửa sổ | **7/7 pass × 3** (C1/C4b pixel-identical, H9 0 lỗi) |
| Headed: độ trôi vs T3 | **0,00 mọi thống kê, 6/6 tổ hợp** |
| Noise compare: tái lập số T3 1-kernel | **Khớp đúng** (renderKurt w1440 [3,12, 0,19, 2,19] = T3) |
| Midcheck: float-mid vs uint8-mid | **Giống nhau tới 0,01** (bác giả thuyết làm tròn mid) |
| tsc / unit | Không đổi code sản phẩm trong luồng này (chỉ probe + LIMITS) nên không chạy lại; V7 đã xanh trên cùng cây (tsc 0, unit 15/15). Parity test vẫn bị chặn EPERM ở V7 — xem §5 |
| Loadavg lúc đo | Predictor ~0,5–3,5; scaler chạy dưới load ~11 (nhiều luồng đợt 69 song song); headed 21:08–21:12 UTC; noise-compare ~1,1–6,0 |

**EPERM:** ghi file qua exec/shell đã hết (kiểm chứng đầu phiên: echo,
node writeFileSync, ffmpeg đều ghi được; scaler + headed chạy trực tiếp
không gặp EPERM). Vẫn ghi file kết quả bằng file-tools theo quy định luồng.

---

## 5. Nợ còn lại (trung thực)

1. **Phần dư direct-branch (0,03–0,17% full-res) vẫn chưa có predictor:**
   10 ứng viên đã thử đều âm tính; predictor sàn chroma còn ngược tương
   quan trên ocean. Cần mô hình khác hẳn (tương tác clip + plain-floor
   theo kênh tại biên mask, hoặc ΔY tại pixel biên direct/add) nếu muốn số
   trừ sàn về 0 tuyệt đối. Không cần thiết cho verdict (đã ≤ 0,17% và
   (A') = 0).
2. **Headed noise vẫn LỆCH-THỐNG-KÊ** ở w1440 (cả 2 mức) và w2560 noise05
   (sát nút). Phần dư cuối ở w1440 vs 2-stage: Δcorr R-G ~0,20 (noise05)
   và Δkurt R ~0,56 + Δcorr R-G ~0,12 (noise10). Có thể do dư pha ±16
   của mô hình 2-stage (U2 §2.3) — cùng gốc với phát hiện pha lấy mẫu §3.3.
3. **Tiêu chí KHỚP-THỐNG-KÊ chưa pin pha lấy mẫu:** verdict ở ô sát nút
   (w1440 noise10 vs 2-stage; w2560 noise05 vs 1-kernel) đổi theo pha
   step-4. Đợt sau nên pin pha canvas-aligned (phương pháp T3) hoặc chuyển
   sang lấy mẫu toàn bộ pixel cho các ô sát nút.
4. **Ngưỡng halve 0,45–0,63 chưa đo** (nợ U2 §7.1) — không thuộc luồng này.
5. **Parity test cần chạy lại khi hết EPERM** (nợ V7 §8.5; EPERM đã hết
   trong phiên này nhưng test chưa chạy lại trong luồng này).
6. `.github/workflows/ci-security.yml` vẫn chưa lên GitHub (403 quyền, chờ
   user) — nợ chung.

## 6. File thay đổi (stage, KHÔNG push)

- `docs/PHASE9_ROUND69_W6_SHARPEN_RESIDUAL_LIMITS.md` — file này.

Chỉ dùng để đo, KHÔNG stage (probe nội bộ / log / JSON / snaps): probe +
JSON + log tại `hidden_files/round69-w6/` (`r69w6-predictor.mjs`,
`r69w6-scaler.mjs`, `r69w6-noise-compare.mjs`, `r69w6-noise-phase.mjs`,
`r69w6-noise-midcheck.mjs`, `predictor/` 4 JSON, `scaler/` 4 JSON,
`noise/` 3 JSON, `headed/w1440|w1920|w2560/` snaps + log, `scratch/`),
log luồng `hidden_files/round69-w6-sharpen-residual.md`. Dữ liệu đo tái
dùng: shots V7/U3 (`round67-u3/within-decoder-exact/`), frame render
(`round68-v7/scratch/fullres/`), frame noise T3 (`round66-t3/render/`).
