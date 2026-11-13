# Đợt 81 I5 — FPS deint-only: theo dõi hồi quy (G1) — KHÔNG HỒI QUY, NHIỄU ĐO LỚN

Ngày: 10/11/2026 (lượt cron 18:35 +07; đo headed 11:37–12:01 UTC, tức
18:37–19:01 giờ VN). Máy đo: VM này (CPU-only, Chromium 158 qua Xvfb +
CDP; VM vừa reboot lúc ~11:22 UTC, up 16 phút khi bắt đầu). Nợ: đợt 80
§4.7 / docs/PHASE9_ROUND80_H6_G8_ROOTCAUSE_LIMITS.md §5.2 — G5 1,28×
PASS rồi 0,71× FAIL trên cùng cây, code cũ revert 1,20× PASS lúc VM
lặng; một lần chạy đơn lẻ lật được cả 2 chiều.

## 1. Kết luận ngắn

- **G1 CÒN PASS — không có hồi quy thật, không cần A/B revert, không
  sửa production.** 5 lần chạy E1 liên tiếp trên cùng cây (cùng
  `preview.tsx`, md5 `783b5a12c8bfc27e14d6a1f4cdfc4a8a` trước/sau 5 lần
  như nhau): G5 **0,93× / 0,75× / 0,80× / 0,81× / 0,94× — 5/5 ≥
  ngưỡng 0,75×**, headed 10/10 cả 5 lần, G8 MAD 1,5817 y hệt cả 5 lần.
- **Nhưng verdict "G1 đóng" mỏng hơn tưởng: ngưỡng 0,75× nằm trong
  dải nhiễu.** Gộp 25 tỉ lệ: mean 0,846, median 0,84, SD 0,271, rải
  0,29–1,47; chỉ 17/25 tỉ lệ đơn lẻ ≥ 0,75. Khoảng tin cậy 95% của
  mean gộp là [0,74; 0,95] — cận dưới chạm ngưỡng. Một lần chạy đơn
  lẻ vẫn có thể FAIL (lịch sử: H6 run 3 0,71×); verdict theo 1 lần
  chạy là tung đồng xu có lệch. Gộp 10 lần đo code mới từ trước tới
  nay: mean 0,959, 9/10 ≥ 0,75 (chỉ H6 run 3 FAIL); code cũ 4 lần:
  mean 0,730, 1/4 ≥ 0,75. Tách biệt mới–cũ còn đứng nhưng ở mức biên
  (Fisher một phía p≈0,041 trên bảng pass/fail; t-test trên mean
  từng lần p≈0,22 — không mạnh). Đừng trích "nhanh hơn ~15%" hay
  "0,85×" như tốc độ thật.
- **Metric phụ gap-mean LẦN ĐẦU PASS sau G1: 0,98×** (tick-time, xem
  §3.2) — sau lần FAIL 0,71× của G1. Chưa khép hẳn (1 PASS / 1 FAIL
  sau G1), nhưng mâu thuẫn draw-vs-gap đã bớt: lần này cả hai metric
  cùng PASS trong cùng một lần đo.
- **Cơ chế G1 còn nguyên vẹn:** tick-time phân rã drawImage cho thấy
  `canvas->1280x360` 0,03–0,10 ms/call ở cả 5 slot deint, KHÔNG còn
  entry `video->1280x360` nào — lần vẽ video→intermediate vẫn biến
  mất hoàn toàn.
- **loadavg 1-phút KHÔNG dự báo được tỉ lệ.** Bằng chứng trực tiếp:
  lần 3 slot 5 deint chỉ 1,02 fps (tỉ lệ 0,34) lúc load 0,55 (VM
  lặng nhất đợt); lần 1 baseline 16,35 fps lúc load 6–11; lần 5
  baseline 1,64 fps trong khi load bắt đầu 0,44. Baseline tuyệt đối
  rải 1,64–16,35 fps (10×) trên cùng cây, cùng ngày. Có yếu tố khác
  ngoài loadavg — xem giả thuyết §5.3.

## 2. Thay đổi code (trạng thái cuối — KHÔNG ĐỔI production)

| File | Đổi gì |
|---|---|
| `docs/PHASE9_ROUND81_I5_DEINT_FPS_REGRESSION_LIMITS.md` | **Mới**: file này. |
| `apps/web/src/preview.tsx` | **KHÔNG ĐỔI** (md5 trước/sau 5 lần chạy như nhau; code G1 tại dòng ~1831 còn nguyên). |
| Harness / script | **KHÔNG ĐỔI** — dùng nguyên `clicktest-77e1-deint-fps.mjs` (E1) và `probe-79g1-tick-time.mjs` (G1 tick-time). Không sửa harness. |

Không đụng `enhancePreview.ts`, spec/render/store/i18n (dict không
đổi), không đụng workflow. Không binary vào batch. `apps/web/dist/`
KHÔNG build lại (không đổi code — tsc đủ).

## 3. Số đo thật

### 3.1 E1 headed × 5 lần — G5 (draw-fps, drift-corrected, ngưỡng 0,75×)

Cửa sổ 2560×1440, canvas backing 1991×815, scaleY 1,132, clip 1 =
interlaced720.mp4, 11 slot (6 baseline + 5 deint, 3s/slot). Tải ghi
là loadavg 1-phút (đầu → cuối phần FPS).

| Lần | Thời gian (UTC) | Tải 1-phút | Baseline mean | 5 tỉ lệ drift-corrected | G5 mean | Verdict |
|---|---|---|---|---|---|---|
| 1 | 11:37–11:39 | 2,4 → 10,3 | 16,35 fps | 0,96 / 0,74 / 1,24 / 0,98 / 0,73 | **0,93×** | PASS, 10/10 |
| 2 | 11:39–11:42 | 9,7 → 4,0 | 3,16 fps | 0,29 / 0,69 / 0,70 / 1,12 / 0,96 | **0,75×** | PASS (sát ngưỡng), 10/10 |
| 3 | 11:44–11:46 | 0,9 → 16,0 | 2,62 fps | 0,88 / 0,80 / 0,34 / 0,92 / 1,06 | **0,80×** | PASS, 10/10 |
| 4 | 11:48–11:51 | 18,0 → 3,1 | 1,77 fps | 0,75 / 0,56 / 1,09 / 0,76 / 0,90 | **0,81×** | PASS, 10/10 |
| 5 | 11:52–11:56 | 0,4 → 26,6 | 1,64 fps | 1,47 / 1,15 / 0,84 / 0,45 / 0,78 | **0,94×** | PASS, 10/10 |

**Slot draw-fps từng lần (B = baseline, D = deint, fps):**

| Lần | B0 | D1 | B2 | D3 | B4 | D5 | B6 | D7 | B8 | D9 | B10 |
|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | 8,93 | 5,44 | 2,42 | 2,43 | 4,19 | 16,74 | 22,82 | 25,91 | 29,91 | 21,91 | 29,85 |
| 2 | 2,65 | 0,96 | 3,94 | 2,89 | 4,49 | 2,75 | 3,35 | 2,42 | 0,97 | 2,17 | 3,55 |
| 3 | 3,11 | 2,19 | 1,88 | 2,65 | 4,73 | 1,02 | 1,25 | 2,31 | 3,76 | 2,50 | 0,96 |
| 4 | 0,96 | 0,91 | 1,46 | 0,95 | 1,94 | 2,26 | 2,19 | 1,98 | 3,05 | 1,83 | 1,00 |
| 5 | 1,29 | 2,29 | 1,83 | 1,87 | 1,43 | 1,77 | 2,80 | 0,91 | 1,21 | 0,97 | 1,29 |

- **Gộp 25 tỉ lệ:** mean 0,846, median 0,84, SD 0,271, min 0,29,
  max 1,47; 17/25 ≥ 0,75. Mean từng lần 0,75–0,94 (SD 0,083) —
  verdict lần-chạy ổn định hơn nhiều so với tỉ lệ đơn lẻ.
- **Gộp lịch sử code mới (10 lần):** 1,51 / 0,83 / 1,03 (G1) +
  1,28 / 0,71 (H6) + 0,93 / 0,75 / 0,80 / 0,81 / 0,94 (I5) →
  mean 0,959, 9/10 ≥ 0,75. **Code cũ (4 lần):** 0,59 / 0,58 / 0,55
  (F1) + 1,20 (H6 revert lúc VM lặng) → mean 0,730, 1/4 ≥ 0,75.
  Fisher một phía trên bảng pass/fail [[9,1],[1,3]]: p≈0,041;
  hai phía ~0,08; Welch t-test trên mean từng lần: t≈1,32,
  p≈0,22. Tách biệt còn đứng ở mức biên, KHÔNG mạnh — một lần đo
  cũ 1,20× PASS và một lần đo mới 0,71× FAIL cho thấy hai phân
  phối chồng lấn nhau.
- **Pixel ổn định tuyệt đối cả 5 lần:** G1 R 0,74 (gap 0,14), G2 R
  0,74 → 0,51 MAD 0,6114, G3 MAD 0, G4 R 0,51, G7a R 0,68 → 0,51
  MAD 0,6985, G7b MAD 0,0119, **G8 R 0,55 → 0,52 MAD 1,5817**,
  H9 0 lỗi trang. Mọi số pixel giống hệt nhau tới 4 chữ số giữa
  5 lần chạy — không có gì dịch chuyển về pixel; chỉ FPS nhiễu.

### 3.2 Tick-time × 1 lần — gap-mean + phân rã drawImage (nợ G1 §6.1)

`probe-79g1-tick-time.mjs`, 11:57–12:01 UTC, tải 1-phút 22,3 → 0,5
(sibling đợt 81 kết thúc dần giữa chừng). 8/8 pass.

| Slot | Loại | draw fps | gapMean rAF (ms) | drawImage ms/tick |
|---|---|---|---|---|
| 0 | baseline | 1,22 | 290,0 | 196,3 |
| 1 | deint | 1,70 | 294,8 | 108,3 |
| 2 | baseline | 2,12 | 391,7 | 198,9 |
| 3 | deint | 4,40 | 198,6 | 74,6 |
| 4 | baseline | 1,88 | 436,3 | 192,7 |
| 5 | deint | 0,78 | 716,6 | 234,9 |
| 6 | baseline* | 0,87 | 230,9 | 164,2 |
| 7 | deint | 1,07 | 577,1 | 204,9 |
| 8 | baseline | 2,29 | 341,7 | 156,2 |
| 9 | deint | 0,85 | 522,2 | 309,2 |
| 10 | baseline | 2,01 | 378,2 | 192,4 |

\* Slot 6 baseline dính cảnh báo harness đã biết (phát tự dừng
trước khi hết slot, playhead chạm cuối — F1 §6.3): gap 230,9 ms
thấp bất thường, làm méo tỉ lệ gap của slot 5 (0,47).

- **G5 draw-fps: 1,02 / 2,20 / 0,57 / 0,68 / 0,40 → 0,97× PASS**,
  baseline mean 1,73 fps.
- **T1 gap-mean: 1,16 / 2,08 / 0,47 / 0,50 / 0,69 → 0,98× PASS**
  — lần đầu gap-mean PASS sau G1 (G1: 0,71× FAIL). Từng tỉ lệ gap
  vẫn rải 0,47–2,08 (SD lớn như draw-fps); đừng trích 0,98× như
  số chính xác.
- **drawImage ms/tick: baseline 183,5 vs deint 186,4 — bằng nhau.**
  G1 đo deint rẻ hơn (287 vs 445,5); lần này bằng nhau trong
  nhiễu. Không dùng chênh này để kết luận hướng nào nhanh hơn.
- **Phân rã drawImage slot deint:** `canvas->1280x360` 3–10 calls,
  **0,03–0,10 ms/call** (tổng ≤ 0,4 ms/slot); **0 entry
  `video->1280x360`** ở cả 5 slot — cơ chế G1 còn nguyên. Chi phí
  deint còn lại nằm ở `video->1280x720` (held store, 22–150
  ms/call) và `video->1991x815` (main, 60–174 ms/call) — chi phí
  chung, có ở cả 2 loại slot.

### 3.3 Lần 1 ramp 2,4 → 30 fps: hiện tượng lạ, KHÔNG tái hiện

- Lần 1 là lần duy nhất có ramp trong-run: slot 0–4 ở 2,4–8,9 fps,
  slot 5–10 vọt lên 16,7–29,9 fps. Các lần 2–5 phẳng ở 1–4 fps
  suốt 11 slot. Ramp không tái hiện trong 4 lần sau.
- Draw fps lần 1 chạm trần ~30 (slot 8/10: 29,91 / 29,85) — khớp
  tần số khung của fixture interlaced720 (chưa xác minh trực tiếp
  bằng ffprobe; chỉ ghi nhận draw không vượt 29,91 trong 11 slot).
  Ở vùng trần này deint vẫn thấp hơn baseline (slot 7: 25,91;
  slot 9: 21,91 vs trần ~29,9) — tức deint tốn ~15–25% ngay cả
  lúc máy nhanh nhất; tỉ lệ slot 9 chỉ 0,73 (< 0,75) dù lần đó
  PASS chung.
- Giả thuyết ramp (chưa xác minh, ghi để đợt sau kiểm): (a) lần 1
  là lần headed đầu tiên sau khi VM reboot (~16 phút trước) —
  warmup decoder/V8/page-cache; (b) sibling đợt 81 khởi động/kết
  thúc không đều trong cửa sổ đo; (c) cell CPU bị cap ở host mà
  loadavg trong VM không thấy (runtime ghi cell_shared_cpus=1,5
  cho agent cell — chưa xác minh có áp cho VM này không). Không
  có bằng chứng nào phân biệt được 3 giả thuyết từ dữ liệu lần
  này — không kết luận nguyên nhân ramp.

## 4. Kiểm chứng (cây cuối — y hệt đầu luồng, chỉ thêm file này)

| Kiểm chứng | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web) | **0 lỗi** (chạy ~5 phút lúc tải cao) |
| Unit `enhancePreview77E1.test.ts` vi | **11/11** |
| Unit `enhancePreview76D4.test.ts` vi | **10/10** |
| Unit `enhancePreview75C8.test.ts` vi | **14/14** |
| Headed E1 lần 1–5 (code mới, cùng cây) | **10/10 × 5** (G5 0,93 / 0,75 / 0,80 / 0,81 / 0,94) |
| Headed tick-time (code mới) | **8/8** (G5 0,97×, T1 gap 0,98×) |
| Cơ chế G1 (phân rã drawImage) | còn nguyên (§3.2) |
| `preview.tsx` md5 trước/sau | `783b5a12…` không đổi |
| Headed H9 (mọi lần chạy) | **0 lỗi trang** |

## 5. Giới hạn — đọc trước khi trích số

1. **"G1 còn PASS" nghĩa là: 5/5 lần chạy đợt này và 9/10 lần đo
   code mới từ trước tới nay ≥ 0,75×.** Đừng trích "deint nhanh
   hơn baseline 15%" hay "0,85×" — CI 95% của mean gộp là
   [0,74; 0,95], cận dưới chạm ngưỡng; một lần chạy đơn lẻ vẫn
   có thể FAIL (xác suất ~1/10 theo lịch sử). Verdict đúng là
   "không còn chậm hơn ngưỡng đo được, trong sai số đo".
2. **Baseline tuyệt đối không so được giữa các lần:** 1,64–16,35
   fps (10×) trên cùng cây, cùng ngày, cùng harness. FPS tuyệt
   đối của E1 không phải số tốc độ của sản phẩm — chỉ tỉ lệ
   drift-corrected trong cùng lần chạy mới có nghĩa, và ngay cả
   tỉ lệ đó cũng có SD 0,27.
3. **loadavg không giải thích được biến động.** Lần 3 slot 5
   (tỉ lệ 0,34, deint 1,02 fps) xảy ra lúc load 1-phút 0,55 —
   lặng nhất đợt. Lần 1 baseline 16,35 fps lúc load 6–11. Đừng
   dùng loadavg để "hiệu chỉnh" hay bác một lần đo; cũng đừng
   kết luận "lần FAIL là do tải cao" khi chưa có tương quan.
   Nhiễu còn lại có thể đến từ: lượng tử hoá đếm (3s × ~1 fps
   ≈ 3 lần vẽ/slot — ±1 lần vẽ là ±33%), warmup/ramp (§3.3),
   contention ngoài VM (giả thuyết §3.3c, chưa xác minh).
4. **Gap-mean khép MỘT NỬA, chưa đóng hẳn:** sau G1 có 2 lần đo
   tick-time — 0,71× FAIL (G1) và 0,98× PASS (I5). Hai metric
   (draw-fps, gap-mean) lần này cùng PASS, nhưng từng tỉ lệ gap
   vẫn rải 0,47–2,08. Nợ G1 §6.1 còn mở cho tới khi gap-mean PASS
   ổn định qua nhiều lần đo yên tĩnh.
5. **Slot 6 tick-time dính lỗi harness đã biết** (tự dừng, F1
   §6.3) — tỉ lệ gap slot 5 (0,47) bị méo vì slot kề 6 có gap
   thấp bất thường. Harness vẫn chưa sửa theo F1 §6.3 (trừ thời
   gian poll / seek lại 0 sau playing=true).
6. **Trần ~30 fps ở lần 1:** khi baseline chạm trần tần số khung
   của fixture, tỉ lệ bị nén về 1 và mất khả năng phân biệt —
   slot 9 deint 21,91 vs trần 29,9 cho tỉ lệ 0,73 dù máy đang
   nhanh. Fixture 60 fps hoặc slot dài hơn sẽ cho tỉ lệ sạch hơn
   ở vùng nhanh (xem §6.2).
7. **Chưa đo:** A/B revert (không cần — không có FAIL ổn định);
   máy thật có GPU; Safari/WebKit thật; footage xen kẽ gốc từ
   camera; combo deint + chroma/LUT/effects (G1 §6.4 vẫn mở).

## 6. Đề xuất đo ổn định hơn (cho đợt sau — không tự đổi ngưỡng)

Ngưỡng 0,75× giữ nguyên (quyết định của user/parent, không tự
đổi). Nhưng cách đo cần đổi để verdict có nghĩa:

1. **Tối thiểu 5 lần chạy E1, verdict theo gộp — không verdict
   theo 1 lần.** Lấy median mean-từng-lần (đợt này: 0,81) hoặc
   mean gộp + CI 95%. Quy tắc đề xuất: "PASS ổn định" ⟺ ≥4/5
   lần ≥ 0,75× VÀ cận dưới CI 95% của mean gộp ≥ 0,75. Theo quy
   tắc này, đợt này: 5/5 lần PASS nhưng cận dưới CI là 0,74 —
   **chưa đạt "PASS ổn định" theo nghĩa chặt** (thiếu 0,01).
2. **Slot dài hơn: 3s → 6s (hoặc 10s).** Ở baseline ~1 fps, slot
   3s chỉ có ~3 lần vẽ — lượng tử hoá ±33% đã giải thích một
   phần lớn SD 0,27. Slot 6s giảm lượng tử hoá xuống ~±17%.
3. **Warmup: bỏ 2 slot đầu hoặc chạy 1 vòng warmup trước khi đo.**
   Lần 1 ramp (§3.3) cho thấy slot đầu bị nhiễm warmup; drift-
   correction bằng trung bình kề không khử được ramp lồi.
4. **Ghi thêm trạng thái máy mỗi lần chạy:** loadavg 1/5/15 phút,
   uptime VM (reboot gần đây?), số tiến trình sibling, và `nproc`
   — loadavg 1-phút một mình không đủ (§5.3).
5. **Sửa lỗi harness F1 §6.3** (slot tự dừng khi playhead chạm
   cuối clip 5s) trước khi đo gap-mean tiếp — slot 6 tick-time
   lần này lại dính.
6. **Fixture 60 fps cho vùng nhanh:** tránh trần 30 fps nén tỉ lệ
   khi máy nhanh (lần 1 slot 9: 0,73 dù máy nhanh nhất).

## 7. Nợ mở cho đợt sau

1. G5: verdict "PASS ổn định" theo quy tắc §6.1 chưa đạt (cận
   dưới CI 0,74 < 0,75) — cần thêm lần đo (hoặc slot dài hơn)
   để CI thu hẹp; không mở lại G1, không sửa production.
2. Gap-mean: 1 PASS / 1 FAIL sau G1 — cần thêm lần tick-time lúc
   VM yên tĩnh (nợ G1 §6.1, còn mở một nửa).
3. Harness FPS: sửa lỗi start-poll/tự dừng (F1 §6.3); xem xét
   slot 6s + warmup (§6.2–6.3).
4. Ramp lần 1 (§3.3): nguyên nhân chưa rõ — nếu tái hiện ở đợt
   sau thì điều tra (so sánh lần headed đầu sau reboot vs lần
   sau; kiểm tra cap CPU host nếu có quyền xem).
5. FPS combo deint + chroma/LUT/effects (G1 §6.4) vẫn chưa đo.
6. TTS 39 / gate / vidstab / kernel BC / G1-G2 / WebKit loop /
   GPU-Safari thật: nợ của các luồng khác — không thuộc I5.

## 8. Cách chạy lại

```bash
# Headed E1 trên cây hiện tại, 1 lần (~3-5 phút; đổi port/display/scratch mỗi lần):
E1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round81-i5/headed-runN \
  E1_DEV_PORT=558N E1_DEBUG_PORT=968N E1_DISPLAY=:18N \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Probe tick-time G1 (~5 phút):
G1_TT_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round81-i5/ticktime \
  G1_TT_DEV_PORT=5585 G1_TT_DEBUG_PORT=9685 G1_TT_DISPLAY=:185 \
  node apps/web/scripts/probe-79g1-tick-time.mjs
# Unit test (vi):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview77E1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round81-i5/enhancePreview77E1.test.cjs \
  && node /tmp/round81-i5/enhancePreview77E1.test.cjs
```
