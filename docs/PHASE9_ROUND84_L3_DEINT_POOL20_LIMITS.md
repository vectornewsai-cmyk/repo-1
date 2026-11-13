# Đợt 84 L3 — Deint pool 20 lần: CI cận dưới VẪN TRÊN ngưỡng, nhưng verdict LẬT ở chế độ máy yên tĩnh + FPS combo lần đầu

Ngày: 11/11/2026 (lượt cron 03:35 +07; đo headed 20:45–21:30 UTC, tức
03:45–04:30 giờ VN). Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only,
Chromium qua Xvfb + CDP, `--disable-gpu`; VM up ~27 phút khi bắt đầu
đo). Nợ: K3 §7.1–7.5 (pool lên 20 lần + xem CI cận dưới có giữ trên
ngưỡng không; cơ chế biến động; gap-mean; harness FPS; combo +
fixture 60fps).

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT, L3 KHÔNG TỰ ĐÓNG G1

- **Pool 20 lần (I5+J3+K3+L3): median 0,805×, mean 0,844, SD 0,151,
  CI 95% của mean [0,774; 0,914] — cận dưới VẪN TRÊN ngưỡng 0,75×
  (+0,024; K3 ở pool 15 là +0,037 — biên thu hẹp).** PASS 15/20
  (75%). Theo tiêu chí chặt I5 §6.1 (≥4/5 lần PASS VÀ cận dưới CI
  ≥ 0,75): 15/20 = 75% < 80% — tiêu chí tỉ lệ PASS KHÔNG đạt trên
  pool 20 (K3: 12/15 = 80% vừa đạt). CI vẫn đạt, tỉ lệ PASS không.
- **Cửa sổ L3 5 lần mới: 0,65 / 0,68 / 0,75 / 0,75 / 1,03 →
  median 0,750× (biên +0,000), 3/5 PASS → luật (b) CHƯA ĐẠT
  "PASS ổn định"** (giống J3, lật ngược so với K3). Luật (a) 1 lần:
  3/5 PASS, tỉ lệ lật 0,40 (cao nhất từ trước tới nay; lịch sử
  5/20 = 0,25).
- **Phát hiện chính đợt này — verdict PHỤ THUỘC CHẾ ĐỘ TẢI, không
  phải chỉ code:** chia pool 20 theo baseline mean fps — baseline
  <10fps (máy tải, n=16): median 0,82×, 14/16 PASS; baseline
  ≥10fps (máy yên, n=4): median 0,68×, 1/4 PASS. Pearson(ratio,
  baselineFps) = −0,478. "PASS ổn định" của K3 là verdict của chế
  độ máy tải; cùng code đó FAIL ở chế độ máy yên.
- **Cơ chế đã tách được (xem §3.2): ở chế độ yên, tick rAF bị
  LƯỢNG TỬ HOÁ theo khung 60Hz — baseline gapP50 đúng 16,7ms
  (1 khung), deint gapP50 đúng 33,4ms (2 khung), mọi slot ở cả 2
  lần yên.** Deint tốn đúng 1 khung rAF thêm; tỉ lệ có trần
  ~0,65–0,70 ở chế độ yên. Đây không phải nhiễu đếm.
- **Gap-mean (T1) lần này PASS 0,78×** (0,75/0,73/1,09/0,69/0,65)
  — nay 2 PASS / 1 FAIL sau G1 (G1 0,71 FAIL; I5 0,98 PASS).
  Nhưng draw-fps cùng lần đo đó FAIL 0,72× — hai metric vẫn
  lệch chiều nhau.
- **FPS combo lần đầu (G1 §6.4): 0,69×** (0,58/0,94/1,03/0,75/
  0,13), baseline 13,66 fps, combo 9,01 fps — combo (deint +
  denoise + stabilize + chroma + LUT + sharpen/noise) KHÔNG tệ
  hơn hẳn deint-only ở cùng chế độ yên (0,65–0,68×); tỉ lệ bị
  chi phối bởi hiệu ứng lượng tử hoá khung, không phải số tầng
  hiệu ứng. Chỉ 1 lần đo — chưa đủ để kết luận.
- **Không sửa production, không đổi ngưỡng, không đổi harness E1.**
  Chỉ thêm 2 script mới (probe combo + gen fixture 60fps) và file
  này. Pixel ổn định tuyệt đối cả 5 lần L3 (G2 MAD 0,6114; G7a
  0,6985; G7b 0,0119; G8 R 0,55 → 0,52 — giống hệt K3 tới 4 chữ số).

## 2. Thay đổi code (trạng thái cuối — KHÔNG ĐỔI production)

| File | Đổi gì |
|---|---|
| `apps/web/scripts/probe-84l3-combo-fps.mjs` | **Mới**: probe FPS combo headed (vite + Xvfb + Chrome, cùng cơ chế E1): 11 slot × 3s xen kẽ [baseline, combo], combo = enhance deinterlace + denoise + stabilize (smoothing 10) + chromaKey mặc định (#00FF00/0,3/0,1) + filter.lut `vcut-cinematic` + effects sharpen 0,5 + noise 0,3; bật/tắt qua patchClip (đúng action panel dùng); xác nhận áp thật bằng state clip + hook + snapshot MAD. Probe thăm dò, không gate: exit 0 khi đo xong (dù tỉ lệ < 0,75×), 1 chỉ khi harness lỗi. |
| `apps/web/scripts/gen-84l3-60fps-fixture.sh` | **Mới**: sinh fixture `interlaced720-60fps.mp4` (testsrc2 1280×720, 60fps, 5s, h264) vào `~/.scratch-r61r3-1cOf/media/` — binary chỉ stage script gen, không stage binary. |
| `docs/PHASE9_ROUND84_L3_DEINT_POOL20_LIMITS.md` | **Mới**: file này. |
| `apps/web/scripts/deint-fps-verdict-83k3.mjs`, `apps/web/scripts/clicktest-77e1-deint-fps.mjs`, `apps/web/src/preview.tsx` và mọi file production khác | **KHÔNG ĐỔI**. |

## 3. Số đo thật

### 3.1 E1 headed × 5 lần mới (L3) — G5 (draw-fps, drift-corrected, ngưỡng 0,75×)

Cửa sổ 2560×1440, canvas backing 1991×815, scaleY 1,132, clip 1 =
interlaced720.mp4, 11 slot (6 baseline + 5 deint, 3s/slot). Tải ghi
là loadavg 1-phút (đầu → cuối phần FPS, lấy từ log slot). Sibling
đợt 84 chạy song song (load 1-phút dao động 1–21 trong 5 lần; sóng
tải lên xuống theo job của các luồng khác).

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối FPS) | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Kết quả |
|---|---|---|---|---|---|---|
| 1 | 20:45–20:47 | 1,0 → 3,2 | 38,52 fps | 0,74 / 0,58 / 0,61 / 0,68 / 0,63 | **0,65×** | FAIL, 9/10 |
| 2 | 20:47–20:49 | 1,4 → 1,6 | 38,97 fps | 0,80 / 0,69 / 0,64 / 0,61 / 0,65 | **0,68×** | FAIL, 9/10 |
| 3 | 20:50–20:52 | 4,3 → 15,4 | 6,26 fps | 0,79 / 0,80 / 0,79 / 0,70 / 0,68 | **0,75×** | PASS, 10/10 |
| 4 | 20:53–20:56 | 7,4 → 3,4 | 1,81 fps | 0,95 / 0,59 / 1,01 / 0,20 / 1,00 | **0,75×** | PASS, 10/10 |
| 5 | 20:58–21:00 | 19,3 → 20,4 | 2,70 fps | 0,70 / 1,23 / 1,50 / 0,75 / 0,99 | **1,03×** | PASS, 10/10 |

**Thời gian mỗi lần:** 123s / 123s / 141s / 291s / ~150s. Lần 4
chậm nhất (291s) vì tải sibling cao giữa chừng — slot 4→5 cách
nhau ~40s (waitIdle chờ lâu), nhưng 0 timeout G0. Tổng 5 lần
~14 phút.

**Slot draw-fps từng lần (B = baseline, D = deint, fps):**

| Lần | B0 | D1 | B2 | D3 | B4 | D5 | B6 | D7 | B8 | D9 | B10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 31,71 | 25,85 | 38,22 | 22,48 | 39,63 | 24,38 | 39,77 | 28,20 | 42,84 | 25,82 | 38,92 |
| 2 | 33,58 | 28,90 | 38,23 | 27,23 | 40,85 | 25,93 | 40,55 | 24,93 | 41,12 | 26,20 | 39,47 |
| 3 | 8,78 | 7,42 | 9,93 | 4,85 | 2,25 | 3,65 | 7,04 | 3,95 | 4,21 | 3,24 | 5,36 |
| 4 | 1,29 | 1,05 | 0,91 | 0,59 | 1,09 | 3,15 | 5,12 | 0,64 | 1,18 | 1,21 | 1,25 |
| 5 | 3,67 | 2,13 | 2,42 | 1,83 | 0,55 | 3,23 | 3,75 | 2,30 | 2,35 | 2,87 | 3,47 |

- **Lần 1–2: baseline ~39 fps — cao nhất lịch sử đo** (kỷ lục cũ:
  J3 lần 1: 27,35; I5 lần 1: 16,35). Cả baseline lẫn deint đều
  nhanh gấp ~10× so với K3, nhưng TỈ LỆ lại thấp nhất (0,65/
  0,68). Không phải code đổi (preview.tsx mtime 10/11 09:41 UTC,
  trước K3; previewEngine.ts từ 07/11; chỉ MediaBin.tsx và
  proxy.ts bị sibling sửa trong lúc đo — không liên quan đường
  preview). Đây là hiệu ứng chế độ máy, xem §3.2.
- **Lần 4: tỉ lệ 0,20 ở slot 7** (deint 0,64 fps trong khi
  baseline kề 5,12/1,18) — sụp 1 slot đơn lẻ dưới tải, cùng mẫu
  với lần 3 K3 (slot deint 0,48) và combo slot 9 đợt này (0,13).
  Sụp slot đơn là nhiễu tải, luật median hấp thụ được (lần 4 vẫn
  PASS 0,75× đúng ngưỡng).
- **Lần 5: tỉ lệ 1,50 ở slot 5** (deint 3,23 fps > baseline kề
  0,55/3,75) — ở baseline ~2–3 fps mỗi slot chỉ ~6–9 lần vẽ,
  lượng tử hoá ±17% cộng nhiễu tải làm tỉ lệ đơn lẻ rải 0,70–
  1,50. Mean lần vẫn có nghĩa nhờ trung bình 5 tỉ lệ.
- **Pixel ổn định tuyệt đối cả 5 lần:** G2 R 0,74 → 0,51 (MAD
  0,6114); G7a MAD 0,6985; G7b MAD 0,0119; G8 R 0,55 → 0,52;
  H9 0 lỗi trang cả 5 lần. Mọi số pixel giống hệt nhau tới 4 chữ
  số giữa 5 lần và giống K3 — không có gì dịch chuyển về pixel;
  chỉ FPS nhiễu theo chế độ máy.

### 3.2 Cơ chế: tỉ lệ phụ thuộc chế độ tải — lượng tử hoá khung rAF

Gộp 20 lần (tính lại từ report JSON từng lần bằng
`hidden_files/round84-l3/analyze-pool20.py` — khớp số I5/J3/K3
đã công bố tới ±0,01):

| Chế độ (baseline mean fps) | n | Median | Mean | PASS |
|---|---|---|---|---|
| <10 fps (máy tải) | 16 | 0,82× | 0,87× | 14/16 |
| ≥10 fps (máy yên) | 4 | 0,68× | 0,74× | 1/4 |

- Pearson(ratio từng-lần, baseline fps) = **−0,478** (n=20):
  baseline càng cao, tỉ lệ càng thấp. Pearson(ratio, chênh
  gapP50 deint−baseline) = −0,093 — chênh gap trung vị KHÔNG
  dự báo tỉ lệ (vì gap trung vị nhiễu giữa các slot; xem dưới).
- **Bằng chứng lượng tử hoá (gapP50 từng slot, từ report JSON):**
  lần 1–2 L3: baseline gapP50 = **16,7ms mọi slot** (đúng 1 khung
  60Hz), deint gapP50 = **33,3–33,4ms mọi slot** (đúng 2 khung).
  J3 lần 1: 33,3ms vs 50,0ms (2 vs 3 khung). Tick-time đợt này
  slot 0–1: baseline gap P50 16,7ms / draw 35,94 fps, deint
  33,4ms / 24,46 fps. Khi máy yên, vòng preview chạy đúng nhịp
  rAF 60Hz: baseline vẽ xong trong 1 khung, deint tràn sang
  khung thứ 2 — tỉ lệ có trần cấu trúc ~0,65–0,70, không phải
  nhiễu đếm (mỗi slot 3s ở 30–40 fps có ~100 lần vẽ, lượng tử
  hoá chỉ ±1%).
- **Chi phí deint KHÔNG nằm trong drawImage đồng bộ:** tick-time
  slot 0–1: drawImage 12,9 vs 13,0 ms/tick (như nhau) trong khi
  gap rAF mean 27,2 → 40,5ms (+49%). Chi phí nằm ngoài thời gian
  gọi drawImage đo được (raster/decode bất đồng bộ hoặc
  scheduling) — chỉ gap rAF mới thấy. Phân rã drawImage: lần vẽ
  thêm `video→1280x720` (intermediate) ở slot deint ~6,5
  ms/call; tap `canvas→1280x360` không đáng kể (0,04 ms/call).
- **Loadavg vẫn KHÔNG dự báo verdict:** lần 5 tải 19–21 PASS
  1,03×; lần 1–2 tải ~1–3 FAIL 0,65–0,68×. Sampler trạng thái
  máy (230 mẫu/15s suốt đợt): steal CPU chỉ 22–83 tick/15s
  (~0,5–1,4% công suất 4 CPU), CPU MHz hằng 1497,749 — không có
  tín hiệu throttle/host-steal. Tải cao vẫn làm chậm phép đo
  (lần 4: 291s) nhưng không lật verdict theo hướng nào.
- **H-A (lần đầu sau reboot) KHÔNG còn là ngoại lệ riêng:** lần 1
  và lần 2 giống hệt nhau (38,52 vs 38,97 fps; 0,65 vs 0,68×).
  Mẫu "lần 1 baseline cao" của I5/J3 giải thích tốt hơn bằng
  sóng tải sibling (đầu đợt sibling chưa nặng) thay vì warmup.
  Đề xuất warmup J3 §6.3 vì thế KHÔNG còn là ưu tiên (xem §6).

### 3.3 Pool 20 lần — so sánh cửa sổ verdict

| Cửa sổ | Luật (a) 1 lần | Luật (b) median 5 + ≥4/5 | CI 95% mean |
|---|---|---|---|
| I5 5 lần (đợt 81) | 5/5 PASS | median 0,810, 5/5 → PASS | [0,753; 0,955] |
| J3 5 lần (đợt 82) | 3/5 PASS | median 0,750, 3/5 → CHƯA ĐẠT | [0,624; 1,116] |
| K3 5 lần (đợt 83) | 4/5 PASS | median 0,850, 4/5 → PASS ỔN ĐỊNH | [0,711; 1,037] |
| **L3 5 lần (đợt 84)** | **3/5 PASS, lật 0,40** | **median 0,750, 3/5 → CHƯA ĐẠT** | **[0,585; 0,959]** |
| Gộp 15 (I5+J3+K3) | 12/15 | median 0,840, 12/15 | [0,787; 0,949] |
| **Gộp 20 (I5+J3+K3+L3)** | **15/20** | **median 0,805, 15/20** | **[0,774; 0,914]** |

- CI cận dưới pool 20 vẫn trên ngưỡng (+0,024) nhưng biên thu
  hẹp so với pool 15 (+0,037). Tỉ lệ PASS pool 20 là 75% — dưới
  80% của tiêu chí chặt I5 §6.1.
- **Tách biệt mới–cũ vẫn CHƯA đạt ý nghĩa thống kê 0,05:**
  20 lần code mới: 15/20 PASS; code cũ 1/4 PASS. Fisher một
  phía [[15,5],[1,3]] p≈0,091 (K3: 0,059) — tệ đi vì thêm 2 lần
  FAIL ở chế độ yên. Đừng trích "đã chứng minh deint mới nhanh
  hơn cũ".

### 3.4 Gap-mean (tick-time) — nợ G1 §6.1: thêm 1 lần lúc VM yên

Probe `probe-79g1-tick-time.mjs`, 21:28–21:30 UTC, load 1-phút
1,6–4,0 (cửa sổ yên nhất đợt — chờ tải sibling hạ mới chạy),
11 slot × 4,5s. Kết quả 7/8 pass (chỉ G5 FAIL):

- **T1 gap-mean PASS 0,78×** (tỉ lệ gap 0,75 / 0,73 / 1,09 /
  0,69 / 0,65; drawImage 39,2 ms/tick baseline vs 34,1 ms/tick
  deint). Trạng thái gap-mean sau G1: **2 PASS / 1 FAIL**
  (G1 0,71 FAIL; I5 0,98 PASS; L3 0,78 PASS).
- **G5 draw-fps cùng lần đo FAIL 0,72×** (tỉ lệ 0,75 / 0,69 /
  1,04 / 0,66 / 0,45; baseline mean 18,88 fps — chế độ yên).
  Hai metric lại lệch chiều (lần này gap PASS, draw FAIL; G1
  ngược lại: gap FAIL 0,71, draw PASS 0,83). Metric nào là
  chuẩn vẫn chưa được parent/user quyết (§6.1 G1).
- Nợ "thêm lần tick-time lúc VM yên tĩnh" nay ĐÃ CÓ lần đo
  (PASS) — nhưng vì 2 metric lệch nhau, nợ chỉ khép một nửa
  theo nghĩa đếm lần đo; quyết định metric chuẩn vẫn mở.

### 3.5 FPS combo deint + chroma/LUT/effects — lần đầu đo (G1 §6.4)

Probe mới `probe-84l3-combo-fps.mjs`, 21:21–21:23 UTC, load
1-phút 2,0 → 9,3 (tăng dần theo sibling), 11 slot × 3s xen kẽ.
Kết quả 4/4 pass (probe thăm dò, không gate):

| Slot | B0 | C1 | B2 | C3 | B4 | C5 | B6 | C7 | B8 | C9 | B10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| draw fps | 13,97 | 9,30 | 17,92 | 12,61 | 8,91 | 10,62 | 11,65 | 10,60 | 16,57 | 1,93 | 12,97 |

- **Combo mean 9,01 fps vs baseline 13,66 fps; tỉ lệ
  drift-corrected 0,58 / 0,94 / 1,03 / 0,75 / 0,13 → mean
  0,69×** (ngưỡng tham khảo 0,75×: chưa đạt). Slot 9 combo sụp
  còn 1,93 fps (tỉ lệ 0,13) lúc tải ~9 — cùng mẫu sụp slot đơn
  như E1 lần 4 (0,20).
- **C1: combo áp thật, pixel đổi lớn:** MAD vs baseline
  25,5939 (86,27% pixel đổi); hook applied=[deinterlace,
  stabilize, denoise], offscreenApplied=true (deint-only là
  false), denoiseBlurPx 3, stabilizeZoom 1,023. LUT
  vcut-cinematic + chroma + sharpen/noise đều qua pipeline thật.
- **So sánh cùng chế độ yên:** combo 0,69× ≈ deint-only
  0,65–0,68× (L3 lần 1–2, baseline ~39 fps). Thêm 5 tầng
  (denoise, stabilize, chroma, LUT, 2 canvas effects) không làm
  tỉ lệ tệ hơn hẳn deint-only — tỉ lệ bị chi phối bởi lượng tử
  hoá khung (§3.2), không phải số tầng. Chỉ 1 lần đo — chưa đủ
  để kết luận, cần lặp lại.
- **Dị thường mở: playhead combo chạy 1,32–1,60×** trong khi
  baseline 1,00–1,04× (mọi slot combo). Playhead vượt realtime
  nghĩa là slot combo có thể đã chạm cuối clip (out=4s) trước
  khi hết 3s đo — lần vẽ cuối slot có thể là frame tĩnh cuối
  clip, làm số combo khó so trực tiếp. Chưa điều tra nguyên
  nhân (xem §7.4).

### 3.6 Fixture 60fps — đã sinh, chưa đo headed

`interlaced720-60fps.mp4`: testsrc2 1280×720, 60fps, 5s, h264,
2.569.772 byte (sinh bằng script gen đã stage; file binary ở
`~/.scratch-r61r3-1cOf/media/`, KHÔNG vào batch). Chưa đo R
combing hay FPS headed với fixture này — nợ J3 §6.5 vẫn mở về
mặt số đo, chỉ xong phần chuẩn bị.

## 4. Kiểm chứng (cây cuối)

| Kiểm chứng | Kết quả |
|---|---|
| `measure` 5 lần headed E1 mới (verdict script K3) | 3/5 PASS luật (a); luật (b) CHƯA ĐẠT (median 0,75, 3/5) |
| Headed E1 lần 1–5 (code mới, cùng cây) | 9/10, 9/10, 10/10, 10/10, 10/10 (chỉ G5 FAIL ở lần 1–2) |
| Headed H9 (mọi lần chạy) | **0 lỗi trang** |
| Pixel G2/G7a/G7b/G8 (5 lần) | giống hệt K3 tới 4 chữ số |
| Tick-time probe (G1_TT_*) | **7/8** (T1 PASS 0,78×; G5 FAIL 0,72×) |
| Combo probe mới (3 lần chạy: 1 lỗi JSON, 1 lỗi mount, 1 xong) | **4/4** (C1 MAD 25,59; C2 0,69×; C3 0 lỗi) |
| `node --check probe-84l3-combo-fps.mjs` | **OK** |
| Pool-20 recompute (`analyze-pool20.py`) khớp số I5/J3/K3 đã công bố | **OK** (±0,01) |
| `node --test deint-fps-verdict-83k3.test.mjs` | **11/11** |
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `preview.tsx` md5 | **không đổi** (không sửa production) |
| Sóng EPERM trong lượt L3 | **0 lần** |

## 5. Giới hạn — đọc trước khi trích số

1. **"PASS ổn định" theo luật (b) KHÔNG còn đứng sau đợt này.**
   K3 đạt, L3 không đạt (median đúng ngưỡng, 3/5). Verdict 5 lần
   vẫn lật giữa các đợt — và nay đã biết một phần nguyên nhân:
   chế độ tải của máy. Khi trích verdict, LUÔN ghi kèm baseline
   mean fps (chế độ đo), không chỉ median.
2. **CI cận dưới pool 20 vẫn trên ngưỡng (+0,024) nhưng tỉ lệ
   PASS pool chỉ 75%.** Hai tiêu chí chặt (I5 §6.1) nay lệch
   nhau: CI đạt, tỉ lệ PASS không. Đừng trích chỉ một trong hai.
3. **Tách biệt mới–cũ chưa đạt ý nghĩa thống kê** (Fisher
   p≈0,091). Đừng claim "đã chứng minh".
4. **Tỉ lệ FPS là hàm của chế độ máy, không phải hằng số của
   code.** Ở chế độ yên (baseline ≥10fps) tỉ lệ ~0,68×; ở chế
   độ tải (baseline <10fps) tỉ lệ ~0,82×. Mọi số FPS deint từ
   trước tới nay (G1→K3) đều đo ở chế độ tải là chính — chúng
   mô tả code TRÊN MÁY TẢI, không phải tốc độ thật của code.
   Suy ra máy khác / máy có GPU / Safari thật: chưa biết gì thêm.
5. **Gap-mean và draw-fps vẫn lệch chiều nhau** (lần này gap
   PASS 0,78×, draw FAIL 0,72×). Chưa có metric chuẩn duy nhất;
   đừng dùng một metric để bác metric còn lại.
6. **Combo chỉ 1 lần đo, dưới tải tăng dần (2→9), kèm dị thường
   playhead 1,3–1,6×.** Số 0,69× là lần đầu có, chưa lặp lại,
   chưa đo ở chế độ tải khác. Đừng trích như số chắc.
7. **Fixture 60fps chưa đo headed** — R combing và FPS với
   fixture này đều chưa có; đừng trích "60fps tránh được trần
   30fps" khi chưa có số.
8. **Số đo chỉ đúng trên VM này (CPU-only, 4 vCPU, Chrome
   `--disable-gpu`, Xvfb).** Không suy ra máy khác.

## 6. Đánh giá harness FPS (J3 §6.2–6.3; cửa sổ G0 180s)

- **Slot 6s (J3 §6.2): KHÔNG nên làm để sửa vấn đề này.** Bằng
  chứng đợt này cho thấy ở chế độ yên, nhiễu chính không phải
  lượng tử hoá đếm (mỗi slot ~100 lần vẽ) mà là lượng tử hoá
  KHUNG rAF (1 vs 2 khung) — slot dài hơn không đổi được tỉ lệ
  trần ~0,65–0,70. Slot 6s chỉ giúp ở chế độ tải (baseline ~2
  fps, ~6 lần vẽ/slot). Đề xuất thay thế: **ghi chế độ đo
  (baseline mean fps) kèm mọi verdict**, và khi so sánh giữa các
  đợt chỉ so các lần cùng chế độ.
- **Warmup / bỏ lần đầu sau reboot (J3 §6.3): KHÔNG còn là ưu
  tiên.** Lần 1 và lần 2 L3 giống hệt nhau; mẫu "lần 1 nhanh"
  giải thích được bằng sóng tải sibling, không cần warmup. Đừng
  tốn công thêm warmup khi chưa có bằng chứng nó đổi verdict.
- **Cửa sổ G0 180s + retry khi timeout: GIỮ NGUYÊN.** Đợt này 0
  timeout trong 7 lần headed (5 E1 + combo + tick-time), kể cả
  lúc tải 1-phút 19–21 (lần 5) và lần 4 kéo dài 291s. J3 có 3
  timeout khi tải 15-phút 9–12. Quy tắc giữ: **timeout G0 →
  chạy lại lần đó 1 lần** (retry), vì timeout liên quan tải kéo
  dài (15-phút), không phải đỉnh tức thời. Không cần nới cửa sổ.
- **Lỗi harness phát hiện thêm (đã sửa trong probe combo, chưa
  sửa trong E1/verdict script):** lỗi throw TRƯỚC khối try chính
  sẽ bỏ qua killAll → vite/chrome/xvfb mồ côi giữ cổng/display
  (đợt này: cổng 5595/9695 + :195 bị giữ; lần chạy sau vite chết
  EADDRINUSE nhưng fetch(DEV_URL) vẫn "lên" vì trúng server mồ
  côi — false positive). Probe combo đã bọc mount trong
  try/catch + killAll; E1 và verdict script còn nguyên rủi ro
  này (xem §7.5).

## 7. Nợ mở cho đợt sau

1. **G1 đóng hay chưa — QUYẾT ĐỊNH CỦA PARENT/USER.** L3 chỉ đưa
   số: pool 20 median 0,805×, CI cận dưới 0,774 (+0,024), 15/20
   PASS; nhưng cửa sổ L3 không đạt luật (b) (median đúng ngưỡng,
   3/5) và verdict phụ thuộc chế độ tải (yên: median 0,68×, 1/4
   PASS). Ba phương án: (a) đóng G1 theo CI pool-20; (b) giữ mở,
   chờ verdict ở chế độ yên; (c) đổi định nghĩa verdict theo chế
   độ đo. L3 không tự chọn.
2. **Chế độ yên cần verdict riêng:** mới có 4 lần baseline
   ≥10fps trong pool 20 (1/4 PASS). Cần một đợt median-5 đo
   trong cửa sổ yên (cả 5 lần baseline ≥10fps) để biết trần
   0,65–0,70 có phải hằng số không.
3. **Fixture 60fps:** đo headed R combing + FPS ratio với
   `interlaced720-60fps.mp4` (fixture + script gen đã sẵn).
4. **Combo:** lặp lại lần 2 (cùng chế độ yên) + điều tra playhead
   1,3–1,6× ở slot combo (có phải chạm cuối clip sớm không; nếu
   đúng thì slot combo cần clip dài hơn hoặc đo theo frame thay
   vì wall-clock).
5. **Harness:** bọc lỗi trước-try + chống false-positive
   EADDRINUSE cho E1/verdict script (mẫu đã có trong probe
   combo); ghi chế độ đo (baseline mean fps) kèm mọi verdict sau
   này. Không làm slot 6s / warmup khi chưa có quyết định mới
   (bằng chứng §6 nói không cần).
6. **Gap-mean:** nay 2 PASS / 1 FAIL — cần parent/user quyết
   metric chuẩn (gap-mean hay draw-fps) khi hai metric lệch
   chiều, hoặc thêm 1 lần tick-time yên nữa để có 3 lần đo.
7. TTS 39 / gate / vidstab / kernel BC / G1-G2 / WebKit loop /
   GPU-Safari thật: nợ của các luồng khác — không thuộc L3.

## 8. Cách chạy lại

```bash
# Đo 5 lần + verdict (mỗi đợt, ~15 phút; đổi outdir mỗi đợt):
node apps/web/scripts/deint-fps-verdict-83k3.mjs measure \
  ~/workspace/goals/capcut-clone-video-editor/hidden_files/round84-l3
# Pool 20 (tính lại từ report JSON đã có):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round84-l3/analyze-pool20.py
# Probe tick-time (~5 phút, chờ VM yên rồi chạy):
G1_TT_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round84-l3/ticktime \
  G1_TT_DEV_PORT=5596 G1_TT_DEBUG_PORT=9696 G1_TT_DISPLAY=:196 \
  node apps/web/scripts/probe-79g1-tick-time.mjs
# Probe combo (~4 phút):
L3_COMBO_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round84-l3/combo \
  L3_COMBO_DEV_PORT=5595 L3_COMBO_DEBUG_PORT=9695 L3_COMBO_DISPLAY=:195 \
  node apps/web/scripts/probe-84l3-combo-fps.mjs
# Sinh fixture 60fps:
bash apps/web/scripts/gen-84l3-60fps-fixture.sh
# Test hồi quy luật median (offline):
node --test apps/web/scripts/deint-fps-verdict-83k3.test.mjs
```
