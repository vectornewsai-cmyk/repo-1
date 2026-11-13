# Đợt 85 M1 — Deint combo lần 2 + fixture 60fps headed + gom bằng chứng verdict G1

Ngày: 11/11/2026 (lượt cron 06:35 +07; đo headed 23:43–00:17 UTC,
tức 06:43–07:17 giờ VN). Máy đo: VM này (4 vCPU, ~8GB RAM, CPU-only,
Chromium qua Xvfb + CDP, `--disable-gpu`; VM up ~11 phút khi bắt đầu
đo, reboot trước lượt). Nợ: L3 §7.2–7.4 (combo lần 2 + điều tra
playhead 1,3–1,6×; fixture 60fps đo headed; quyết định G1).

## 1. Kết luận ngắn — SỐ CHO PARENT/USER QUYẾT, M1 KHÔNG TỰ ĐÓNG G1

- **Pool 30fps KHÔNG ĐỔI (không chạy thêm E1 30fps ở luồng này):
  n=20, median 0,805×, CI 95% [0,774; 0,914], PASS 15/20 (75%).**
  Luật (a): 15/20. Luật (b) gộp: median vượt ngưỡng nhưng tỉ lệ PASS
  75% < 80% → **CHƯA ĐẠT**. Không có bằng chứng mới làm đổi trạng
  thái G1 theo hướng nào.
- **Fixture 60fps (deint-only, 5 lần mới, lần đầu đo headed):
  1,00 / 0,88 / 0,94 / 0,62 / 0,73 → median 0,880×, mean 0,834,
  SD 0,156, CI 95% [0,640; 1,028], PASS 3/5.** Luật (b) median-5:
  median vượt nhưng chỉ 3/5 PASS → **CHƯA ĐẠT** (thiếu 1 lần PASS).
  CI cận dưới 0,640 DƯỚI ngưỡng 0,75. Fixture 60fps KHÔNG cứu được
  verdict — giả thuyết J3 §6.5 ("60fps tránh trần 30fps") không được
  số này ủng hộ: tỉ lệ từng slot vẫn rải 0,10–1,66 như fixture 30fps.
  Cả 5 lần đều ở chế độ máy tải (baseline 2,1–3,7 fps) nên câu hỏi
  "verdict ở chế độ yên" (L3 §7.2) VẪN MỞ.
- **Combo (deint + denoise + stabilize + chroma + LUT + 2 effects):
  n=3 gộp (L3 0,69× + M1 0,96× / 0,29×) → median 0,690×, mean 0,647,
  SD 0,337, CI [-0,191; 1,484], PASS 1/3.** Phân tán quá lớn để kết
  luận (tỉ lệ từng slot 0,00–2,11 — slot đóng băng 0 fps xen slot
  2,11×). Combo FPS bị chi phối bởi đóng băng dưới tải, không phải
  bởi số tầng hiệu ứng. Chỉ 2/5 lần thử M1 hoàn thành (3 lần lỗi
  harness, xem §6).
- **Dị thường playhead combo ĐÃ GIẢI THÍCH ĐƯỢC CƠ CHẾ (xem §3.2):
  không phải chạm cuối clip.** Playhead "dịch chuyển tức thời"
  +1,1 đến +2,2s trong MỘT tick rAF sau khi main thread stall ≥1,5s
  — dt bị clamp ở 2s (`PREVIEW_DT_CAP_S`, `playheadPacing.ts`) rồi
  `forwardStep` bước bù toàn bộ stall trong 1 tick. Số +2,00 khớp
  chính xác tới 2 chữ số ở 4/4 slot combo có nhảy đầu cửa sổ.
  Đây đồng thời là **lỗi sản phẩm thật** (phát lại nhảy cóc 2s khi
  bật hiệu ứng nặng dưới tải), không chỉ nhiễu đo — nhưng sửa pacing
  là việc high-risk, ngoài phạm vi luồng đo này (xem §7.5).
- **Đối chứng deint-only (fixture 60fps): playhead 0,85–1,17×,
  không slot nào vượt 1,3×; nhảy đầu cửa sổ ≤0,79s.** Dị thường
  playhead là đặc trưng của combo (stall dài), không phải của deint.
- **Pixel ổn định tuyệt đối:** MAD combo-vs-baseline 25,5939
  (86,27% đổi) giống hệt L3 ở cả 2 lần hoàn thành; MAD deint-vs-baseline
  trên fixture 60fps 0,4167 (6,93% đổi) giống hệt nhau ở cả 5 lần.
  Deint áp thật trên fixture 60fps (hook tap=true cả 5 lần).

## 2. Thay đổi code (trạng thái cuối — KHÔNG ĐỔI production)

| File | Đổi gì |
|---|---|
| `apps/web/scripts/probe-85m1-combo-fps.mjs` | **Mới**: bản sao probe combo L3, thêm lấy mẫu playhead mỗi ~250ms trong slot (`phTrace` + `phMaxJump` + cờ `hitEnd`) để điều tra dị thường; sửa 2 lỗi harness gặp lúc chạy (vòng trace giới hạn theo thời gian thay vì số lần cố định; pause chỉ toggle khi còn playing). Đổi media route `/r85m1-media`, TMPDIR/cfg riêng `/tmp/round85-m1/combo`. Probe thăm dò, không gate. |
| `apps/web/scripts/probe-85m1-60fps-fps.mjs` | **Mới**: bản sao probe combo, đổi thành deint-only trên fixture `interlaced720-60fps.mp4` (slot xen kẽ [B,D,…], kiểm tra D1 MAD + hook tap, D2 tỉ lệ FPS). TMPDIR/cfg riêng `/tmp/round85-m1/60fps`. Probe thăm dò, không gate. |
| `docs/PHASE9_ROUND85_M1_DEINT_COMBO_60FPS_LIMITS.md` | **Mới**: file này. |
| `apps/web/scripts/probe-84l3-combo-fps.mjs`, `apps/web/scripts/deint-fps-verdict-83k3.mjs`, `apps/web/src/preview.tsx`, `apps/web/src/lib/playheadPacing.ts` và mọi file production khác | **KHÔNG ĐỔI**. |

## 3. Số đo thật

Tất cả các lần đo dưới đây chạy headed, cửa sổ 2560×1440, canvas
backing 1991×815, scaleY 1,132, clip 1 = fixture (30fps cho combo,
60fps cho deint-only), 11 slot × ~3s xen kẽ. Tải ghi là loadavg
1-phút (đầu → cuối phần FPS). Lượt này có 8–10 luồng đợt 85 chạy
song song nên tải dao động rất mạnh trong phiên (1-phút 0,78–32,67).

### 3.1 FPS combo — 2 lần hoàn thành / 5 lần thử (M1)

| Lần | Thời gian (UTC) | Tải 1-phút (đầu→cuối) | Baseline mean | 5 tỉ lệ drift-corrected | Combo mean | Kết quả |
|---|---|---|---|---|---|---|
| run1 | 23:54–23:57 | 25,7 → 2,1 | 3,11 fps | 2,11 / 0,12 / 0,00 / 1,22 / 1,33 | **0,96×** | "ĐẠT" tham khảo, nhưng 2 slot đóng băng |
| run2 | 23:57–23:59 | 2,1 → 0,8 | 11,44 fps | 0,12 / 0,48 / 0,06 / 0,74 / 0,05 | **0,29×** | CHƯA ĐẠT |
| run3 | 23:59–00:02 | 0,8 → 20,6 | — | — | **lỗi harness** | slot 7: Space lần 2 không pause được |
| run4 | 00:15–00:17 | 0,8 → 15,6 | — | — | **lỗi harness** | slot 3: Space lần 2 không pause được |
| pilot | 23:44–23:45 | 0,8 → 4,7 | — | — | **lỗi harness** | slot 3: Space lần 2 không pause được (trước khi sửa probe) |

Gộp combo (L3 0,69× + M1 0,96× / 0,29×): **n=3, median 0,690×,
mean 0,647, SD 0,337, CI 95% [-0,191; 1,484], PASS 1/3.** Không có
luật verdict nào đứng được với n=3 và SD này — số combo hiện tại
chỉ nói "chưa đo được chắc", không nói "combo chậm hơn deint-only".

**Slot draw-fps từng lần hoàn thành (B = baseline, C = combo, fps):**

| Lần | B0 | C1 | B2 | C3 | B4 | C5 | B6 | C7 | B8 | C9 | B10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| run1 | 2,18 | 4,41 | 2,00 | 0,22 | 1,66 | 0,00 | 2,98 | 4,55 | 4,50 | 6,55 | 5,33 |
| run2 | 14,23 | 1,52 | 11,69 | 5,19 | 9,97 | 0,54 | 7,51 | 9,41 | 18,08 | 0,66 | 7,14 |

- **Run1: 2 slot combo đóng băng gần như hoàn toàn** (slot 3:
  0,22 fps, gapP50 4516,6ms; slot 5: 0,00 fps — cả cửa sổ 3s không
  vẽ được lần nào; trace chỉ có 1 mẫu, roundtrip CDP mất 4,6s /
  6,9s). Slot đóng băng cho tỉ lệ 0,12 / 0,00; slot 1 cho 2,11×
  (combo 4,41 fps > baseline kề 2,18/2,00 vì baseline cũng sụp).
  Mean 0,96× là trung bình của 2 thái cực, không phải ước lượng ổn.
- **Run2: baseline 11,44 fps (chế độ gần-yên nhất đợt này) nhưng
  combo chỉ 3,46 fps → 0,29×.** 3/5 slot combo dưới 1 fps (1,52 /
  0,54 / 0,66). Đây là lần combo tệ nhất từ trước tới nay (L3:
  0,69×). Cùng code, cùng fixture — khác chế độ tải/sóng sibling.
- **C1 cả 2 lần: MAD 25,5939 (86,27% đổi), hook tap=true** — combo
  áp thật, giống hệt L3 tới 4 chữ số. C3 0 lỗi trang cả 2 lần.

### 3.2 Cơ chế dị thường playhead combo — ĐÃ TÌM RA (bằng chứng trace)

Playhead slot combo M1 (tất cả 10 slot hoàn thành): **1,55 / 0,44 /
0,29 / 1,55 / 1,56 / 1,25 / 1,53 / 1,03 / 1,23 / 1,39** — vẫn còn
1,3–1,6× (câu hỏi §3.5 L3: CÒN). Baseline kề: 0,84–1,10× (luôn
~1,0×). Trace lấy mẫu mỗi ~250ms cho thấy **nhảy rời rạc, không
phải chạy nhanh đều**:

- **Nhảy đầu cửa sổ (run1, slot 1/7/9): a.ph ≈ 2,00 → mẫu trace
  đầu tiên ph = 4,00 sau 0,10–0,21s page-time — nhảy đúng +2,00 /
  +2,00 / +2,01s.** Slot 3/5 (đóng băng): nhảy +2,02 / +2,00 nhưng
  sau 4,58s / 6,89s (roundtrip CDP bị stall). Run2 slot 9: nhảy
  +2,00 sau 2,53s.
- **Nhảy giữa cửa sổ (run2):** slot 1: ph 3,90 → 5,67 (+1,77s)
  trong 0,39s; slot 3: 3,67 → 5,37 (+1,70s) trong 0,28s; slot 7:
  3,57 → 4,67 (+1,10s) trong 0,29s; slot 9: 2,03 → 4,23 (+2,20s)
  trong 0,49s. Giữa các lần nhảy, playhead chạy ~1,0–1,1× bình
  thường. `phMaxJump` lớn nhất run2 = 2,2s.
- **Giải thích khớp số:** `preview.tsx` tính `dt =
  clampPreviewDt((now - last)/1000)` với trần `PREVIEW_DT_CAP_S =
  2` (`lib/playheadPacing.ts`), rồi `forwardStep` bước bù toàn bộ
  dt trong 1 tick. Khi pipeline combo làm main thread stall 1,5s+
  (khung nặng: LUT/shader/denoise/stabilize + CPU bị sibling
  chiếm), tick rAF tiếp theo thấy gap ≥1,5s và bước playhead
  +1,1–2,2s trong MỘT tick — playhead "dịch chuyển tức thời".
  Nhảy đúng +2,00 là trường hợp gap ≥2s chạm trần clamp.
  Số 4,00 ở mẫu đầu run1 KHÔNG phải biên clip (out=4s) — nó là
  a.ph ≈ 2,0 (mẫu `a` bị trễ ~2s thực do roundtrip CDP dưới tải)
  cộng đúng 1 tick clamp +2,0s.
- **Vì sao baseline không nhảy:** khung baseline rẻ, main thread
  không stall ≥1,5s nên không có tick dt lớn; playhead baseline
  0,84–1,10× ở mọi slot.
- **Đối chứng 60fps deint-only (§3.3):** nhảy đầu cửa sổ chỉ
  0,00–0,79s (stall ngắn hơn vì deint-only rẻ hơn combo), playhead
  0,85–1,17×, không slot nào vượt 1,3×. Dị thường là đặc trưng của
  combo, không phải của deint.
- **Hệ quả đo:** trong slot combo, playhead chạy qua các frame
  khác với slot baseline kề (nhảy 2s/lần, có thể qua biên clip 1
  sang clip 2 — trace run1 slot 1 đi tới ph 7,27 trong khi clip 1
  chỉ tới 4s). Tỉ lệ FPS vẫn là số lần vẽ / giây wall-clock, nhưng
  hai config không còn đo cùng nội dung frame — caveat về tính so
  sánh được, không phải lỗi fatal.
- **Hệ quả sản phẩm (ghi cho parent/user, KHÔNG sửa ở luồng này):**
  phát lại với hiệu ứng nặng dưới tải sẽ nhảy cóc ~2s thay vì chạy
  mượt — cùng họ lỗi với bug snap playhead đợt 28/29 L2, nhưng lần
  này là do clamp dt 2s (đợt 53 J5 đặt ra để sửa lỗi ngược: playhead
  tụt sau khi FPS thấp). Sửa cần cân cả hai đầu (trần catch-up thấp
  hơn, hoặc lấy đồng hồ element làm chủ khi hiệu ứng nặng) — việc
  của luồng riêng, có quyết định của parent.

### 3.3 Fixture 60fps headed — 5 lần hoàn thành / 6 lần thử (M1)

Fixture `interlaced720-60fps.mp4` (testsrc2 1280×720, 60fps, 5s,
h264; đã sinh từ đợt 84, binary không vào batch). Deint-only vs
baseline, slot xen kẽ [B,D,…].

| Lần | Thời gian (UTC) | Tải 1-phút | Baseline mean | 5 tỉ lệ drift-corrected | Deint mean | Kết quả |
|---|---|---|---|---|---|---|
| run1 | 23:47–23:50 | 5,2 → 1,2 | 3,01 fps | 1,46 / 0,35 / 1,25 / 1,18 / 0,77 | **1,00×** | PASS (a), nhưng slot 0 baseline 0 fps làm tỉ lệ slot 1 phồng 1,46 |
| run2 | 00:02–00:04 | 20,6 → 6,9 | 2,13 fps | 1,22 / 1,66 / 0,18 / 0,10 / 1,25 | **0,88×** | PASS (a) |
| run3 | 00:04–00:06 | 6,9 → 3,6 | 3,67 fps | 0,88 / 1,08 / 0,81 / 0,85 / 1,10 | **0,94×** | PASS (a) — lần sạch nhất (không slot 0 fps, không tỉ lệ <0,8) |
| run4 | 00:06–00:10 | 3,6 → 30,9 | — | (slot 0–6: deint 2,95/0,94 vs baseline ~1–3,4) | **lỗi harness** | CDP.send timeout 60s lúc tải vọt |
| run4-retry | 00:13–00:15 | 5,6 → 0,8 | 2,91 fps | 0,29 / 0,55 / 0,21 / 0,84 / 1,23 | **0,62×** | FAIL (a) |
| run5 | 00:10–00:12 | 32,7 → 10,8 | 3,31 fps | 0,35 / 1,24 / 0,10 / 0,62 / 1,36 | **0,73×** | FAIL (a), sát ngưỡng |

Gộp 60fps: **n=5, [1,00, 0,88, 0,94, 0,62, 0,73] → median 0,880×,
mean 0,834, SD 0,156, CI 95% [0,640; 1,028], PASS 3/5.** Luật (a):
3/5. Luật (b) median-5 + ≥4/5: median 0,88 ≥ 0,75 nhưng chỉ 3/5 →
**CHƯA ĐẠT**. Pearson(mean, baseline fps) = +0,055 (n=5, yếu — cả
5 lần đều baseline 2–4 fps nên không tách được chế độ).

- **D1 cả 5 lần: MAD deint-vs-baseline 0,4167 (6,93% pixel đổi),
  hook tap=true** — deint áp thật trên fixture 60fps, pixel hoàn
  toàn xác định (giống hệt nhau 5/5 lần). MAD nhỏ hơn nhiều so với
  combo (25,59) vì deint-only chỉ trộn field, không đổi màu/LUT.
  Lưu ý: "interlaced" của fixture này là combing nướng sẵn trong
  nội dung testsrc2 (ffprobe field_order=progressive cả hai fixture,
  như L3 đã ghi) — R combing riêng chưa đo; MAD ở đây chỉ chứng
  minh tap áp thật, không phải đo chất lượng khử răng cưa.
- **Gap rAF:** gapP50 trung vị baseline 225–292ms, deint 300–450ms
  (mọi lần) — deint tốn thêm ~1 khung rAF so với baseline ngay cả
  ở 60fps, cùng mẫu với L3 §3.2 (16,7 → 33,4ms ở chế độ yên).
- **Playhead deint-only 60fps (25 slot): 0,85–1,17×, không slot
  nào vượt 1,3×** — đối chứng sạch cho §3.2.
- **Run1 lưu ý:** slot 0 baseline draw 0 fps (slot đầu, page chưa
  ổn định sau seek) làm tỉ lệ slot 1 = 1,46 phồng; trung vị 5 tỉ lệ
  run1 là 1,18 (mean 1,00). Đừng trích 1,00× như số chắc.
- **Run4 (lỗi):** 7 slot đầu đã đo xong trước khi CDP timeout
  (deint 2,95 / 0,94 fps vs baseline kề ~1–3,4 fps, playhead
  0,95–1,19×) — phù hợp với các lần hoàn thành, không phải outlier.

### 3.4 Bảng tổng hợp verdict G1 — gom cho parent/user quyết

| Cửa sổ | Luật (a) 1 lần | Luật (b) median-5 + ≥4/5 | CI 95% mean | Ghi chú |
|---|---|---|---|---|
| I5 5 lần (đợt 81, 30fps) | 5/5 PASS | median 0,810, 5/5 → PASS | [0,753; 0,955] | — |
| J3 5 lần (đợt 82, 30fps) | 3/5 PASS | median 0,750, 3/5 → CHƯA ĐẠT | [0,624; 1,116] | — |
| K3 5 lần (đợt 83, 30fps) | 4/5 PASS | median 0,850, 4/5 → PASS ỔN ĐỊNH | [0,711; 1,037] | — |
| L3 5 lần (đợt 84, 30fps) | 3/5 PASS | median 0,750, 3/5 → CHƯA ĐẠT | [0,585; 0,959] | verdict phụ thuộc chế độ tải |
| **Pool 20 (I5+J3+K3+L3)** | **15/20 PASS** | **median 0,805, 15/20 (75%) → CHƯA ĐẠT** | **[0,774; 0,914], cận dưới +0,024** | **không đổi ở đợt này (không chạy thêm E1)** |
| **M1 60fps 5 lần (đợt 85)** | **3/5 PASS** | **median 0,880, 3/5 → CHƯA ĐẠT** | **[0,640; 1,028], cận dưới −0,110** | fixture khác — KHÔNG gộp vào pool 20 |
| **Combo gộp (L3+M1, n=3)** | **1/3 PASS** | **median 0,690 — không đủ n / SD 0,337** | **[−0,191; 1,484]** | chỉ ghi số, không verdict |

Đề xuất verdict cho parent (M1 chỉ đề xuất, không tự đóng):
(a) **Giữ G1 MỞ** — cả pool 30fps lẫn cửa sổ 60fps đều chưa đạt
luật (b) theo tỉ lệ PASS (75% và 60%), dù median đều vượt ngưỡng;
(b) nếu parent muốn đóng theo CI thì chỉ pool 30fps đủ điều kiện CI
(cận dưới +0,024), còn 60fps thì không (cận dưới −0,110) — hai
tiêu chí lệch nhau, cần parent chọn tiêu chí;
(c) câu hỏi chế độ yên (L3 §7.2) vẫn chưa có số: mọi lần M1 đều
baseline <12 fps (chế độ tải); cần một đợt median-5 đo trong cửa
sổ yên (baseline ≥10 fps cả 5 lần) trước khi kết luận về trần
0,65–0,70.

## 4. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Headed combo hoàn thành (M1 run1/run2) | 4/4 cases cả 2 lần (C0/C1/C2/C3) |
| Headed 60fps hoàn thành (M1 run1/2/3/4-retry/5) | 4/4 cases cả 5 lần (D0/D1/D2/D3) |
| Headed H9 (mọi lần chạy hoàn thành) | **0 lỗi trang** |
| Pixel C1 combo (2 lần) / D1 60fps (5 lần) | giống hệt nhau tới 4 chữ số trong mỗi nhóm |
| Pool gộp tính lại (`analyze-pool85m1.py`) | khớp số L3 đã công bố (pool 20: median 0,805, CI [0,774; 0,914]) |
| `node --check probe-85m1-combo-fps.mjs` / `probe-85m1-60fps-fps.mjs` | **OK** |
| `tsc --noEmit` | **không chạy** — không chạm file TS nào (chỉ thêm 2 script .mjs + docs) |
| Lỗi harness trong phiên | combo pause-fail ×3, CDP timeout ×1 (xem §6) |
| `preview.tsx` / `playheadPacing.ts` md5 | **không đổi** (không sửa production) |

## 5. Giới hạn — đọc trước khi trích số

1. **G1 CHƯA ĐÓNG — M1 không tự đóng.** Pool 30fps: CI đạt, tỉ lệ
   PASS không. Cửa sổ 60fps: median đạt, tỉ lệ PASS và CI đều
   không. Đừng trích chỉ một tiêu chí.
2. **Combo n=3, SD 0,337 — không có verdict combo.** Mean 0,647×
   là trung bình của 0,29 và 0,96 (cộng 0,69 L3); đừng trích "combo
   0,65×" như tốc độ combo.
3. **Mọi lần M1 đều đo ở chế độ tải** (baseline 2,1–11,4 fps;
   loadavg 1-phút lên tới 32,7). Không có lần nào ở chế độ yên
   thật (baseline ≥10 fps ổn định cả 5 lần) — kết luận về trần
   0,65–0,70 ở chế độ yên vẫn chưa có số mới.
4. **Slot đóng băng (draw 0 fps) làm mean tỉ lệ vô nghĩa theo
   từng lần** (run1 combo: 0,00 và 2,11 trong cùng một lần). Khi
   trích, luôn kèm trung vị tỉ lệ và số slot đóng băng.
5. **Playhead teleport làm slot combo đo khác nội dung với slot
   baseline kề** (nhảy qua biên clip). Tỉ lệ FPS vẫn là lần vẽ /
   giây, nhưng tính so sánh từng cặp slot bị giảm.
6. **Run1 60fps bị phồng bởi slot 0 baseline 0 fps** (tỉ lệ slot 1
   = 1,46; trung vị 5 tỉ lệ là 1,18, mean 1,00). Đừng trích 1,00×
   như lần đo sạch.
7. **MAD 0,4167 trên fixture 60fps chỉ chứng minh tap áp thật**,
   không phải đo chất lượng khử răng cưa (chưa đo R combing).
8. **Số đo chỉ đúng trên VM này (CPU-only, 4 vCPU, Chrome
   `--disable-gpu`, Xvfb, 8–10 luồng sibling chạy song song).**
   Không suy ra máy khác; tải sibling là biến số lớn nhất của đợt
   này (load 1-phút 0,78–32,67).

## 6. Đánh giá harness FPS (nợ L3 §7.5 + lỗi mới đợt này)

- **Lỗi pause bằng Space (3 lần, chỉ ở slot combo):** pilot slot 3,
  run3 slot 7, run4 slot 3 — "bấm Space lần 2 mà playing vẫn true"
  dưới tải 1-phút 13–20. Deint-only 60fps: 0/6 lần thử gặp lỗi này.
  Cơ chế chưa xác định chắc (keydown bị xử lý sau lần đọc state, hoặc
  focus bị chiếm dưới tải); bản sửa "chỉ toggle khi còn playing" của
  M1 không diệt được lỗi. Đề xuất: **đổi pause sang gọi trực tiếp
  store `setState({playing:false})` qua CDP evaluate** (xác định,
  không qua input/focus) — việc của luồng harness sau, không sửa ở
  đây để khỏi đổi hành vi đo giữa chừng.
- **CDP.send timeout 60s (1 lần, 60fps run4 slot 7):** main thread
  starved >60s khi load 1-phút vọt 1,5 → 13,4 giữa chừng (sibling
  ramp-up). Đây là giới hạn của harness dưới tải cực đoan, không
  phải lỗi sản phẩm. Retry sau khi tải hạ thì xong (run4-retry exit 0).
- **Slot đóng băng + roundtrip CDP chậm (nhiều lần):** trace 1 mẫu
  duy nhất với t=4,58s / 6,89s (combo run1 slot 3/5); slot kéo dài
  15–26s thực dù cửa sổ đo chỉ ~3s page-time. Vòng trace giới hạn
  theo thời gian của M1 đã ngăn slot kéo dài vô hạn (lỗi pilot), nhưng
  không ngăn được đóng băng nội dung đo. Ghi kèm số slot đóng băng
  trong mọi verdict sau này.
- **Lỗi runner (của chính M1, đã sửa và ghi lại):** bản `run-all.sh`
  đầu tiên truyền sai thứ tự tham số nên lần "combo run1" thực chất
  chạy probe 60fps — dữ liệu đó hợp lệ nên được giữ lại thành
  `60fps/run1` (ghi rõ nguồn gốc), runner đã sửa và chạy lại đúng.
  Không mất dữ liệu nào; lần combo pilot lỗi được giữ ở
  `failed-pilot-combo-run1/`.
- **Chưa làm (nợ L3 §7.5 vẫn mở):** bọc lỗi trước-try + chống
  false-positive EADDRINUSE cho E1/verdict script. Không làm slot
  6s / warmup (bằng chứng L3 §6 vẫn đứng).

## 7. Nợ mở cho đợt sau

1. **G1 đóng hay chưa — QUYẾT ĐỊNH CỦA PARENT/USER** (xem §3.4,
   phương án (a)/(b)/(c)). M1 chỉ đưa số.
2. **Chế độ yên cần verdict riêng (L3 §7.2, vẫn mở):** cần một đợt
   median-5 mà cả 5 lần baseline ≥10fps (30fps và/hoặc 60fps) để
   biết trần 0,65–0,70 có phải hằng số không. Đợt này không đo được
   lần yên nào vì 8–10 luồng sibling chạy song song suốt phiên.
3. **Playhead teleport (mới, §3.2):** lỗi sản phẩm thật dưới tải khi
   bật hiệu ứng nặng — cần luồng riêng quyết hướng sửa (trần
   catch-up thấp hơn / đồng hồ element làm chủ / tách nhịp phát
   khỏi nhịp vẽ), có đo A/B trước–sau. KHÔNG sửa lặng lẽ trong
   luồng đo.
4. **Harness:** pause bằng store trực tiếp thay cho Space (§6);
   ghi số slot đóng băng kèm mọi verdict; bọc lỗi trước-try cho
   E1/verdict script (L3 §7.5).
5. **Combo:** cần thêm lần đo hoàn thành (hiện chỉ 2/5 lần thử M1
   xong) — nên đo khi tải thấp, hoặc sau khi sửa pause (§6), để
   có n≥5 rồi mới verdict combo.
6. **R combing fixture 60fps:** MAD chỉ chứng minh tap áp thật;
   chất lượng khử răng cưa trên nội dung 60fps vẫn chưa đo.
7. TTS / gate / vidstab / kernel / G1-G2 / WebKit / GPU-Safari:
   nợ của các luồng khác — không thuộc M1.

## 8. Cách chạy lại

```bash
# Combo (mỗi lần ~2-4 phút; đổi outdir mỗi lần):
M1_COMBO_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round85-m1/combo/runN \
  M1_COMBO_DEV_PORT=5600 M1_COMBO_DEBUG_PORT=9700 \
  node apps/web/scripts/probe-85m1-combo-fps.mjs
# 60fps deint-only (mỗi lần ~2-4 phút):
M1_60FPS_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round85-m1/60fps/runN \
  M1_60FPS_DEV_PORT=5610 M1_60FPS_DEBUG_PORT=9710 \
  node apps/web/scripts/probe-85m1-60fps-fps.mjs
# Gộp số (đọc report JSON đã có, không cần headed):
python3 ~/workspace/goals/capcut-clone-video-editor/hidden_files/round85-m1/analyze-pool85m1.py
# Sinh fixture 60fps (đã có sẵn, chỉ chạy lại khi mất file):
bash apps/web/scripts/gen-84l3-60fps-fixture.sh
```
