# Đợt 83 K3 — Deint FPS: CHỐT luật verdict MEDIAN 5 lần — PASS ỔN ĐỊNH, CÓ BIÊN

Ngày: 11/11/2026 (lượt cron 00:35 +07; đo headed 17:44–18:00 UTC, tức
00:44–01:00 giờ VN). Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only,
Chromium qua Xvfb + CDP; VM reboot lúc ~17:28 UTC, up ~16 phút khi
bắt đầu đo — lần 1 là lần headed đầu tiên sau reboot). Nợ:
docs/PHASE9_ROUND82_J3_DEINT_FPS_MEDIAN_LIMITS.md §6.1/§7.1 (verdict
median 5 lần J3 đúng ngưỡng 0,75, chỉ 3/5 PASS — chưa đạt "PASS ổn
định"; câu hỏi mở: verdict median 5 lần + ≥4/5 PASS hay giữ verdict
1 lần?) + docs/PHASE9_ROUND81_I5_DEINT_FPS_REGRESSION_LIMITS.md §6.1
(quy tắc "PASS ổn định" chặt: ≥4/5 lần PASS VÀ cận dưới CI 95% của
mean gộp ≥ 0,75).

## 1. Kết luận ngắn — QUYẾT ĐỊNH: ÁP LUẬT MEDIAN-5

- **Luật verdict CHÍNH cho deint FPS từ đợt 83 trở đi: median 5 lần
  (luật b).** "PASS ổn định" ⟺ median của 5 mean-từng-lần ≥ 0,75×
  VÀ ≥ 4/5 lần ≥ 0,75×. Ngưỡng 0,75× giữ nguyên, không nới.
- **Đợt này (K3, 5 lần mới): luật (b) PASS ỔN ĐỊNH — lần đầu có biên
  thật.** 5 mean-từng-lần: **0,95 / 1,04 / 0,69 / 0,85 / 0,84** →
  **median 0,85× (biên +0,10 so với ngưỡng)**, 4/5 lần ≥ ngưỡng.
  So với J3 (median 0,75, biên 0, 3/5 PASS): biên an toàn đã xuất
  hiện, không còn "đúng ngưỡng".
- **Luật cũ (a) 1 lần vẫn lật verdict ngay trong đợt này:** lần 3
  FAIL 0,69× trong khi 4 lần còn lại PASS — tỉ lệ lật 1/5 (0,20),
  đúng bằng tỉ lệ lật lịch sử (3/15 lần code mới FAIL). Verdict 1
  lần vẫn là tung đồng xu có lệch; giữ nó làm verdict chính là sai.
- **Gộp 15 lần (I5+J3+K3): median 0,840×, 12/15 PASS, mean 0,868,
  CI 95% của mean [0,787; 0,949] — cận dưới LẦN ĐẦU VƯỢT NGƯỠNG
  (+0,037).** Theo quy tắc chặt của I5 §6.1 (≥4/5 lần PASS VÀ cận
  dưới CI ≥ 0,75): 12/15 = 80% ✓ và 0,787 ✓ — "PASS ổn định" nay
  đạt cả theo nghĩa chặt trên pool 15 lần, không chỉ theo median.
- **Chi phí luật (b): ~15,5 phút cho 5 lần chạy** (151/155/186/
  213/227s) so với ~3 phút cho 1 lần — gấp 5 lần, nhưng verdict
  này chỉ chạy theo đợt (không chạy mỗi commit) nên chấp nhận được.
- **Không sửa production, không sửa harness E1.** Cơ chế G1 còn
  nguyên: pixel giống hệt nhau cả 5 lần (G2 MAD 0,6114; G7a
  0,6985; G7b 0,0119; G8 R 0,55 → 0,52). Chỉ FPS nhiễu.
- **Tách biệt mới–cũ vẫn CHƯA đạt ý nghĩa thống kê 0,05:**
  20 lần code mới (G1 3 + H6 2 + I5 5 + J3 5 + K3 5): 16/20 PASS,
  median 0,845, mean 0,919; code cũ 1/4 PASS. Fisher một phía
  [[16,4],[1,3]] p≈0,059 (J3: 0,071) — cải thiện nhẹ nhưng vẫn
  > 0,05. Đừng trích "đã chứng minh deint mới nhanh hơn cũ".

## 2. Thay đổi code (trạng thái cuối — KHÔNG ĐỔI production)

| File | Đổi gì |
|---|---|
| `apps/web/scripts/deint-fps-verdict-83k3.mjs` | **Mới**: module verdict + driver đo. Hàm thuần export: `medianOf`, `meanCI`, `deintFpsVerdict(runMeans, threshold=0.75)` (trả verdict cả luật (a) 1 lần và luật (b) median-5 + ≥4/5, kèm CI 95% và tỉ lệ lật verdict), `g5MeanFromReport` (tính lại G5 mean từ report JSON theo đúng công thức drift-corrected của harness). CLI: `measure <outdir>` chạy 5 lần E1 headed liên tiếp (port 5590–5594 / debug 9690–9694 / display :190–:194, mỗi lần ~3–4 phút) rồi verdict + ghi `k3-verdict-summary.json`; `analyze <dir...>` chỉ verdict từ report JSON đã có. Exit 0 khi luật (b) PASS ổn định, 1 khi không đạt / thiếu dữ liệu / harness lỗi. |
| `apps/web/scripts/deint-fps-verdict-83k3.test.mjs` | **Mới**: test hồi quy luật median (node --test, offline): 11 test — hằng số luật, medianOf, luật (b) trên số J3 thật (median đúng ngưỡng, 3/5 → FAIL), trên số I5 thật (5/5, median 0,81 → PASS), median cao nhưng 3/5 → FAIL, median đúng ngưỡng + 4/5 → PASS, toàn FAIL, <5 lần không kết luận, đầu vào sai throw, meanCI, g5MeanFromReport đúng công thức harness. |
| `docs/PHASE9_ROUND83_K3_DEINT_VERDICT_MEDIAN_LIMITS.md` | **Mới**: file này. |
| `apps/web/scripts/clicktest-77e1-deint-fps.mjs` | **KHÔNG ĐỔI** — G5 trong harness vẫn verdict theo 1 lần như cũ. Lý do: G5 là cửa trong bộ 10 case và là thước đo so sánh được với toàn bộ lịch sử 15 lần; đổi nó sẽ phá nghĩa của mọi số lịch sử và của cửa 10/10. Verdict median được áp ở tầng gộp 5 lần (script mới trên), không phải trong harness. |
| `apps/web/src/preview.tsx` và mọi file production khác | **KHÔNG ĐỔI**. |

Không đụng `enhancePreview.ts`, spec/render/store/i18n (dict không
đổi), không đụng workflow, không đụng TTS/Gradio. Không binary vào
batch. `apps/web/dist/` KHÔNG build lại (không đổi code sản phẩm).

## 3. Số đo thật

### 3.1 E1 headed × 5 lần mới (K3) — G5 (draw-fps, drift-corrected, ngưỡng 0,75×)

Cửa sổ 2560×1440, canvas backing 1991×815, scaleY 1,132, clip 1 =
interlaced720.mp4, 11 slot (6 baseline + 5 deint, 3s/slot). Tải ghi
là loadavg 1-phút (đầu → cuối phần FPS). Sibling đợt 83 chạy song
song suốt đợt đo (load 1-phút dao động 0,35–28 trong 5 lần).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối FPS) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|
| 1 | 17:44–17:47 | 1,2 → 0,35 | 5,53 fps | 1,74 / 0,61 / 0,71 / 0,78 / 0,92 | **0,95×** | PASS, 10/10 |
| 2 | 17:47–17:49 | 11,3 → 14,4 | 4,10 fps | 1,14 / 0,75 / 1,36 / 1,12 / 0,83 | **1,04×** | PASS, 10/10 |
| 3 | 17:49–17:52 | 12,4 → 3,7 | 4,12 fps | 0,98 / 0,57 / 0,79 / 0,63 / 0,48 | **0,69×** | FAIL, 9/10 (chỉ G5) |
| 4 | 17:53–17:56 | 1,2 → 18,1 | 2,60 fps | 0,81 / 0,51 / 0,79 / 1,12 / 1,00 | **0,85×** | PASS, 10/10 |
| 5 | 17:56–18:00 | 28,0 → 6,3 | 3,24 fps | 1,12 / 0,30 / 0,95 / 1,14 / 0,67 | **0,84×** | PASS, 10/10 |

**Slot draw-fps từng lần (B = baseline, D = deint, fps):**

| Lần | B0 | D1 | B2 | D3 | B4 | D5 | B6 | D7 | B8 | D9 | B10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 1,56 | 6,11 | 5,47 | 3,54 | 6,11 | 4,30 | 5,92 | 5,79 | 8,97 | 6,50 | 5,15 |
| 2 | 2,59 | 4,20 | 4,78 | 3,26 | 3,97 | 4,28 | 2,31 | 3,98 | 4,82 | 4,53 | 6,14 |
| 3 | 3,46 | 4,08 | 4,84 | 2,49 | 3,89 | 2,88 | 3,44 | 2,41 | 4,26 | 2,19 | 4,84 |
| 4 | 2,31 | 3,78 | 7,07 | 2,43 | 2,42 | 1,47 | 1,28 | 1,77 | 1,87 | 1,25 | 0,63 |
| 5 | 3,76 | 5,19 | 5,51 | 1,33 | 3,32 | 2,50 | 1,95 | 2,88 | 3,12 | 1,65 | 1,78 |

- **Lần 3 FAIL 0,69× KHÔNG giải thích được bằng lượng tử hoá.**
  Baseline 4,12 fps → mỗi slot ~12 lần vẽ, sai số đếm chỉ ±8%,
  nhưng 4/5 tỉ lệ deint đều < 0,8 (0,57/0,79/0,63/0,48) — chậm
  có hệ thống trong lần chạy, không phải một slot ngoại lệ. Đây
  là bằng chứng trực tiếp: ngoài nhiễu đếm (H-D) còn có biến
  động thật giữa các lần chạy (trạng thái máy/throttle — chưa
  tách được, như H-C của J3 đã ghi). Luật median hấp thụ đúng
  loại FAIL này: 1 lần FAIL không lật được verdict gộp.
- **Lần 1 (đầu sau reboot): H-A YẾU lần này.** Baseline 5,53 fps
  là cao nhất 5 lần nhưng chỉ gấp 1,35× median 4 lần còn lại
  (3,67) — không còn gấp 8–14× như I5/J3. Tuy nhiên trong lần 1
  vẫn có ramp: slot 0 baseline chỉ 1,56 fps rồi vọt lên 5,5–9
  fps các slot sau (giống ramp I5 §3.3). Lần đầu sau reboot vẫn
  là ngoại lệ, chỉ nhẹ hơn lần này.
- **Loadavg lại KHÔNG dự báo verdict (xác nhận J3 H-E, n=15).**
  Lần 2 tải 11–16 PASS 1,04×; lần 5 tải đầu 28 (cao nhất đợt)
  PASS 0,84×; lần 4 tải vọt 0,38 → 18,12 giữa chừng (slot 10
  baseline chỉ 0,63 fps) vẫn PASS 0,85×; lần 3 FAIL 0,69× lúc
  tải GIẢM dần 12,4 → 3,7. Đừng dùng loadavg để hiệu chỉnh hay
  bác một lần đo — nhưng tải cao vẫn là tín hiệu cảnh báo timeout
  G0 (lần này 0 timeout dù tải đỉnh 28).
- **Pixel ổn định tuyệt đối cả 5 lần:** G2 R 0,74 → 0,51 (MAD
  0,6114); G7a MAD 0,6985; G7b MAD 0,0119; G8 R 0,55 → 0,52;
  H9 0 lỗi trang cả 5 lần. Mọi số pixel giống hệt nhau tới 4 chữ
  số giữa 5 lần — không có gì dịch chuyển về pixel; chỉ FPS nhiễu.

### 3.2 So sánh hai luật verdict trên cùng dữ liệu

| Cửa sổ | Luật (a) 1 lần | Luật (b) median 5 + ≥4/5 | CI 95% mean |
|---|---|---|---|
| K3 5 lần mới | 4/5 PASS, lật 1/5 (0,20) | **median 0,850, 4/5 PASS → PASS ỔN ĐỊNH** (biên +0,10) | [0,711; 1,037] — cận dưới vẫn < 0,75 |
| J3 5 lần (đợt 82) | 3/5 PASS, lật 2/5 (0,40) | median 0,750, 3/5 → CHƯA ĐẠT (biên 0) | [0,624; 1,116] |
| I5 5 lần (đợt 81) | 5/5 PASS, lật 0/5 | median 0,810, 5/5 → PASS ỔN ĐỊNH (biên +0,06) | [0,753; 0,955] |
| Gộp 10 (I5+J3) | 8/10, lật 0,20 | median 0,805, 8/10 → PASS (biên +0,055) | [0,749; 0,981] |
| **Gộp 15 (I5+J3+K3)** | **12/15, lật 0,20** | **median 0,840, 12/15 → PASS ỔN ĐỊNH (biên +0,09)** | **[0,787; 0,949] — cận dưới VƯỢT ngưỡng** |
| Toàn lịch sử mới (20 lần: G1 3 + H6 2 + I5 5 + J3 5 + K3 5) | 16/20, lật 0,20 | median 0,845, 16/20 | mean 0,919 |

Đọc đúng:
- **Luật (a) lật verdict với tỉ lệ ổn định 20%** (3/15 lần, 4/20
  lần) — bất kể cửa sổ nào. Một lần đo đơn lẻ có xác suất ~1/5
  cho verdict sai hướng so với đa số. Đó là lý do luật (a)
  không được làm verdict chính nữa.
- **Luật (b) trên cửa sổ 5 lần vẫn nhạy với cửa sổ chọn** (J3:
  chưa đạt; K3: đạt) — nhưng nhạy theo hướng đúng: nó chỉ lật
  khi ≥3/5 lần cùng lật một chiều, xác suất thấp hơn nhiều so
  với 1 lần lật. Trên pool gộp 15 lần, luật (b) đạt với cả hai
  tiêu chí chặt (median +0,09 và CI cận dưới +0,037).
- **CI 95% của mean trên 5 lần K3 vẫn chạm dưới ngưỡng** ([0,711;
  1,037]) — n=5 quá nhỏ để CI mean có nghĩa. Đừng dùng CI mean
  5 lần làm tiêu chí phụ; tiêu chí CI chỉ có nghĩa trên pool
  gộp ≥10 lần. Đây là lý do luật (b) dùng median + tỉ lệ PASS
  thay vì CI mean.

### 3.3 Chi phí thời gian đo

5 lần E1 liên tiếp: 151s + 155s + 186s + 213s + 227s = **932s
(~15,5 phút)**, 0 lần timeout G0 (J3: 3 lần timeout ở tải 15-phút
9–12; lần này tải 1-phút đỉnh 28 nhưng 15-phút chỉ ~8,3 và
không timeout — timeout G0 liên quan tải kéo dài, không phải
đỉnh tức thời). Mỗi lần ~3–4 phút, tăng dần theo tải sibling
(lần 5: 227s lúc tải 15-phút 7,4). Chi phí chấp nhận được cho
một verdict theo đợt.

## 4. Kiểm chứng (cây cuối — chỉ thêm 2 script + file này)

| Kiểm chứng | Kết quả |
|---|---|
| `node --test deint-fps-verdict-83k3.test.mjs` | **11/11** |
| `node --check deint-fps-verdict-83k3.mjs` | **OK** |
| `analyze` trên lịch sử I5+J3 (khớp số J3 tới ±0,01) | **OK** (median 0,805, CI [0,749; 0,981] — khớp J3 §3.2) |
| `measure` 5 lần headed E1 mới | **4/5 PASS luật (a), luật (b) PASS ỔN ĐỊNH** (median 0,85, 4/5) |
| Headed E1 lần 1–5 (code mới, cùng cây) | 10/10, 10/10, 9/10 (chỉ G5 FAIL), 10/10, 10/10 |
| Headed H9 (mọi lần chạy) | **0 lỗi trang** |
| Pixel G2/G7a/G7b/G8 (5 lần) | giống hệt tới 4 chữ số |
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| Unit `enhancePreview77E1.test.ts` | **11/11** |
| Unit `enhancePreview76D4.test.ts` | **10/10** |
| Unit `enhancePreview75C8.test.ts` | **14/14** |
| `preview.tsx` md5 | **không đổi** (không sửa production) |

## 5. Giới hạn — đọc trước khi trích số

1. **"PASS ổn định" theo luật (b) KHÔNG có nghĩa là "deint nay
   nhanh hơn baseline".** Median 0,85× / 0,84× gộp chỉ nói: deint
   không còn chậm hơn ngưỡng 0,75× đo được, với biên +0,09–0,10.
   Đừng trích "nhanh hơn 15%" hay "0,85×" như tốc độ thật — SD
   từng-lần vẫn 0,13–0,16 và tỉ lệ đơn lẻ vẫn rải 0,30–1,85.
2. **Luật (b) trên cửa sổ 5 lần vẫn có thể lật giữa các đợt**
   (J3 chưa đạt → K3 đạt). Verdict "chắc" chỉ có trên pool gộp
   ≥10–15 lần, nơi CI 95% của mean lần đầu vượt ngưỡng ([0,787;
   0,949]). Khi trích verdict, luôn ghi rõ cửa sổ (5 lần đợt này
   hay 15 lần gộp).
3. **Tách biệt mới–cũ chưa đạt ý nghĩa thống kê.** Fisher một
   phía p≈0,059 (16/20 vs 1/4) — vẫn > 0,05. Hướng tách biệt
   đứng, bằng chứng chưa mạnh. Đừng claim "đã chứng minh".
4. **Lần 3 FAIL 0,69× không giải thích được bằng lượng tử hoá**
   (§3.1) — có biến động thật giữa các lần chạy chưa tách được
   (trạng thái máy/throttle ngoài VM). Luật median hấp thụ nó,
   không giải thích nó. Nợ điều tra cơ chế vẫn mở.
5. **Loadavg không dự báo verdict, nhưng tải cao vẫn làm hỏng
   phép đo theo cách khác** (timeout G0 ở J3; slot 10 lần 4
   baseline 0,63 fps lúc tải vọt 18). Ghi tải mỗi lần đo vẫn cần
   — để biết phép đo nào đo trong điều kiện xấu, không phải để
   hiệu chỉnh số.
6. **H-A (lần đầu sau reboot nhanh) yếu lần này nhưng vẫn có**
   (baseline lần 1 cao nhất 5 lần + ramp trong lần). Đừng lấy
   lần 1 làm đại diện; warmup không tính điểm (đề xuất J3 §6.3)
   vẫn chưa làm.
7. **Số đo chỉ đúng trên VM này (CPU-only, 4 vCPU).** Không suy
   ra máy khác, máy có GPU, Safari/WebKit thật. Gap-mean (metric
   phụ) vẫn mở một nửa (1 PASS / 1 FAIL sau G1) — K3 không đo
   lại tick-time. FPS combo deint + chroma/LUT/effects vẫn chưa
   đo. Fixture 60 fps cho vùng nhanh vẫn chưa làm.

## 6. Cách dùng luật verdict từ nay

```bash
# Đo 5 lần + verdict (mỗi đợt, ~16 phút; đổi outdir mỗi đợt):
node apps/web/scripts/deint-fps-verdict-83k3.mjs measure \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round83-k3
# Chỉ verdict từ report đã có (so sánh cửa sổ):
node apps/web/scripts/deint-fps-verdict-83k3.mjs analyze \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round81-i5 \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round82-j3 \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round83-k3
# Test hồi quy luật (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
```

Quy tắc trích verdict: ghi "median 5 lần đợt N = X×, Y/5 PASS →
PASS ổn định / chưa đạt" kèm cửa sổ; pool gộp thì ghi thêm CI
95% của mean. Không verdict bằng 1 lần chạy nữa. Không đổi
ngưỡng 0,75× khi chưa có quyết định của user/parent.

## 7. Nợ mở cho đợt sau

1. G5: verdict "PASS ổn định" theo luật (b) **ĐÃ ĐẠT ở đợt K3 và
   trên pool 15 lần** — nhưng luật (b) trên cửa sổ 5 lần vẫn lật
   được giữa các đợt (J3 vs K3); đợt sau nên đo thêm 5 lần nữa
   để pool lên 20 lần và xem CI cận dưới có giữ trên ngưỡng không.
   **Quyết định "G1 đóng hay chưa" thuộc về parent/user** — K3
   chỉ đưa số: median gộp 15 lần 0,84×, CI cận dưới 0,787.
2. Cơ chế biến động thật giữa các lần chạy (§5.4): lần FAIL
   0,69× không do lượng tử hoá — cần tách nguyên nhân (throttle/
   trạng thái máy) nếu muốn verdict 5 lần ổn định hơn nữa.
3. Gap-mean: 1 PASS / 1 FAIL sau G1 — cần thêm lần tick-time lúc
   VM yên tĩnh (nợ G1 §6.1, còn mở một nửa).
4. Harness FPS: xem xét slot 6s + warmup (J3 §6.2–6.3); cửa sổ
   G0 180s — lần này 0 timeout nhưng tải đỉnh 28 cho thấy vẫn
   cần retry khi timeout.
5. FPS combo deint + chroma/LUT/effects (G1 §6.4) vẫn chưa đo;
   fixture 60 fps cho vùng nhanh vẫn chưa làm.
6. TTS 39 / gate / vidstab / kernel BC / G1-G2 / WebKit loop /
   GPU-Safari thật: nợ của các luồng khác — không thuộc K3.
