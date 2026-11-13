# Đợt 79 G1 — FPS deint-only: intermediate đọc từ held-frame canvas thay vì video — ĐẠT (3/3 lần đo trên metric ngưỡng)

Ngày: 10/11/2026 (lượt cron 09:35 +07; đo headed 02:45–03:07 UTC,
tức 09:45–10:07 giờ VN). Máy đo: VM này (CPU-only, Chromium 158 qua
Xvfb + CDP). Nợ: docs/PHASE9_ROUND78_F1_DEINT_FPS_LIMITS.md §6.1 —
FPS deint-only mọi đường 2 lần vẽ đều ~0,55–0,86×, G5 vẫn mở; ngưỡng
0,75× giữ nguyên, KHÔNG nới.

## 1. Kết luận ngắn

- **G5 ĐÓNG — với mức tin cậy "đo được nhanh hơn bền vững" trên metric
  ngưỡng.** Hướng mới (intermediate đọc từ canvas held-frame đã vẽ
  cùng tick thay vì đọc lại video — giảm số lần đọc video mỗi tick
  deint-only từ 2 → 1) cho tỉ lệ draw-fps **1,51× / 0,83× / 1,03×
  trong 3 lần chạy headed độc lập, cả 3 đều ≥ 0,75×** (gộp 15 tỉ lệ:
  mean 1,12, median 1,01). Code cũ đo cùng metric: 0,59× / 0,58× /
  0,55× (F1, 3 lần — cả 3 đều < 0,75×). Cải thiện rõ ràng, cùng chiều
  cả 3 lần, và có cơ chế đo được (§3.3): lần vẽ video→intermediate
  đã biến mất khỏi phân rã drawImage; lần vẽ canvas→intermediate chỉ
  0–1,22 ms/call; tổng drawImage ms/tick deint (287) nay THẤP HƠN
  baseline (445,5) — F1 đo ngược lại (420 vs 235,5).
- **Pixel không lệch (trong sai số đo).** Probe tab trắng: MAD giữa
  đường mới và đường cũ = 0,0162 (interlaced) / 0,0133 (clean), max
  1/255, R y hệt (0,43 = 0,43; 0,45 = 0,45). Headed 2 lần chạy: G2 R
  0,74 → 0,51 y hệt code cũ, MAD 0,6114 so với 0,6087 cũ (+0,0027);
  G7a MAD 0,6985 so với 0,6944 (+0,0041); G7b MAD 0,0119 so với
  0,0036 (vẫn < 0,05 với biên lớn); G8 MAD 1,5817 so với 1,4826
  (+0,099 — xem §5.4). Mọi số pixel giống hệt nhau giữa 2 lần chạy
  mới (G2/G7a/G7b/G8 giống tới 4 chữ số) — thay đổi pixel do đường
  mới là xác định, nhỏ, và không đổi R.
- **Thay đổi đã GIỮ trong production** (`apps/web/src/preview.tsx`,
  ~20 dòng tại call-site deint + comment; xem §2). Không code giả/
  mock. Không push/tag/binary.

## 2. Thay đổi code (trạng thái cuối — GIỮ)

| File | Đổi gì |
|---|---|
| `apps/web/src/preview.tsx` | Tại call-site `deintIntermediateSource` (dòng ~1797): khi `drawSrc` còn là element video thô (`drawSrc === srcEl` và `srcEl instanceof HTMLVideoElement`), lấy input cho intermediate từ `heldFrameCache.get(heldFrameCacheKey63R6(clip)).canvas` — canvas mà `storeHeldFrame` đã vẽ từ đúng video element đó, cùng frame, cùng tick — thay vì đọc lại video. Không có held canvas (store thất bại / frame đầu) → rơi về video như cũ. Chỉ áp cho video thô: đã qua chroma/LUT/effects (`drawSrc !== srcEl`) thì giữ nguyên (không được bỏ hiệu ứng); nhánh hold (srcEl đã là canvas giữ) và VideoFrame/WebCodecs giữ hành vi cũ. Không đổi `deintIntermediateSource`, hằng divisor (= 2), plan, ngưỡng 0.9, hay đường offscreen. |
| `apps/web/scripts/probe-79g1-deint-source.mjs` | **Mới**: probe tab trắng kiểm chứng cơ chế trước khi đụng production — ms/draw từng phép vẽ nguyên tử khi video ĐANG PHÁT (frame mới mỗi lần vẽ) + so pixel MAD/R giữa đường mới và đường cũ khi PAUSE ở 1.0s. |
| `apps/web/scripts/probe-79g1-tick-time.mjs` | **Mới**: copy probe-78f1-tick-time.mjs, đổi env `G1_TT_*`, key phân rã drawImage thêm loại nguồn (`video->` / `canvas->` / …) để thấy lần vẽ video→intermediate có biến mất không. |
| `docs/PHASE9_ROUND79_G1_DEINT_FPS_LIMITS.md` | **Mới**: file này. |

Không đụng `enhancePreview.ts`, spec/render/store/i18n (dict không
đổi), không đụng workflow. Không binary vào batch. `apps/web/dist/`
(build 4,1 MB) KHÔNG stage.

## 3. Số đo thật

### 3.1 Probe tab trắng — cơ chế + pixel (trước khi đụng production)

`probe-79g1-deint-source.mjs`, 02:45–02:47 UTC, load 2,3–7,0.
Video ĐANG PHÁT cho thông lượng (mỗi lần vẽ thấy frame mới, n=40/
mode, xen kẽ 5 vòng × 8 lần); PAUSE ở 1.0s cho pixel.

**Thông lượng (ms/draw, median / mean):**

| Mode | interlaced | clean |
|---|---|---|
| v2inter (đường cũ: video→1280×360) | 45,15 / 108,98 | 15,20 / 53,84 |
| v2held (chi phí chung đã trả: video→1280×720) | 0,30 / 42,40 | 0,30 / 8,45 |
| held2inter (đường mới: canvas→1280×360) | 0 / 0,44 | 0 / 0,00 |
| v2interNoWRF (video→inter, không willReadFrequently) | 83,65 / 116,10 | 65,90 / 81,10 |
| held2interNoWRF | 0 / 0,01 | 0 / 1,85 |
| inter2final (1280×360→1280×720) | 0 / 73,52 | 0 / 55,55 |
| v2final (video→1280×720, main draw baseline) | 10,55 / 109,89 | 5,05 / 67,64 |

- Chi phí tăng thêm của deint (median): đường cũ 34,6 ms (interlaced)
  / 10,15 ms (clean); đường mới −10,55 ms / −5,05 ms (âm vì lần vẽ
  chính từ canvas rẻ hơn từ video — số âm này là artefact của median,
  chỉ đọc định tính: đường mới không đắt hơn đường cũ).
- **Cảnh báo về số median 0ms:** canvas 2D của Chromium hoãn raster
  (deferred) nên drawImage canvas→canvas thường trả về gần như tức
  thì; chi phí thật hiện ra lúc flush (max 917–1307 ms trong các
  lần gọi). Median 0 không có nghĩa "miễn phí tuyệt đối" — chỉ có
  nghĩa rẻ hơn nhiều so với lần vẽ từ video trong cùng điều kiện đo.
  Mean cũng nhiễu nặng (max tới 1306,8 ms do tải). Probe chỉ là sàng
  lọc cơ chế; verdict là số headed §3.2–3.3.
- **willReadFrequently KHÔNG giúp:** v2interNoWRF median 83,65/65,90
  ms — CHẬM HƠN v2inter có WRF (45,15/15,20 ms) ở cả 2 video. Hướng
  bỏ WRF khỏi intermediate đã loại bằng số đo, không thử tiếp.
  (Pixel C vs A MAD = 0 chính xác — WRF không đổi pixel nào.)

**Pixel (pause 1.0s, final 1280×720):**

| | R | vgrad | MAD vs A (đường cũ) |
|---|---|---|---|
| A đường cũ (video→inter) | 0,43 / 0,45 | 0,372 / 0,347 | — |
| B đường mới (held→inter) | 0,43 / 0,45 | 0,373 / 0,347 | **0,0162 / 0,0133 (max 1)** |
| C noWRF | 0,43 / 0,45 | 0,372 / 0,347 | 0 / 0 (max 0) |
| D video trực tiếp (noop) | 1,05 / 0,73 | — | 1,1191 / 0,7026 |

(interlaced / clean.) B vs A: R y hệt, vgrad giống tới 3 chữ số,
MAD ~0,016 = lệch 1/255 trên một phần nhỏ pixel — do đường resample
(YUV→RGB rồi scale RGB, thay vì convert+scale một bước). Không đáng
kể so với hiệu ứng deint (MAD B-vs-A deint ~0,61 trong app).

### 3.2 Headed E1 — code mới, 2 lần chạy (10/10 cả 2 lần)

Cửa sổ 2560×1440, canvas backing 1991×815, scaleY 1,132, clip 1 =
interlaced720.mp4, 11 slot FPS (5 tỉ lệ).

**Lần 1** (02:52–02:57 UTC, load 23,7 → 1,8):

| Case | Kết quả (code cũ F1 trong ngoặc) |
|---|---|
| G1 baseline | R 0,74, gap 0,14, tap=false — PASS |
| G2 deint BẬT | R **0,74 → 0,51**, MAD 0,6114 (cũ 0,6087) — PASS |
| G3 tắt lại | MAD vs A = 0 — PASS |
| G4 progressive + deint | R 0,51 — PASS |
| G5 FPS | 2,9 / 0,8 / 1,2 / 2,3 / 0,37 → **1,51×** (baseline 0,98 fps) — PASS |
| G7a SR | R 0,68 → 0,51, MAD 0,6985 (cũ 0,6944) — PASS |
| G7b mask | R 0,5 → 0,5, MAD **0,0119** (cũ 0,0036) — PASS (< 0,05) |
| G8 BBB thật | R 0,55 → 0,52, MAD 1,5817 (cũ 1,4826) — PASS |
| H9 | 0 lỗi trang — PASS |

**Lần 2** (03:02–03:07 UTC, load 6,9 → 20,8): **10/10**, mọi số
pixel GIỐNG HỆT lần 1 tới 4 chữ số (G2 MAD 0,6114; G7a 0,6985; G7b
0,0119; G8 1,5817). G5: 1,01 / 0,63 / 0,77 / 1,08 / 1,66 →
**1,03×** (baseline 1,21 fps) — PASS.

### 3.3 Probe tick-time — code mới, 1 lần chạy (7/8)

`probe-79g1-tick-time.mjs`, 02:57–03:01 UTC, load 10,3 → 37,8
(sibling nặng lên giữa chừng). G0–G4 PASS với số pixel y hệt E1
lần 1 (G2 R 0,74 → 0,51, MAD 0,6114). H9 PASS.

| Slot | baseline draw | deint draw | Tỉ lệ draw | gapMean base (ms) | gapMean deint (ms) | Tỉ lệ gap |
|---|---|---|---|---|---|---|
| 0/1 | 0,63 | 0,42 | 0,30* | 341,6 | 1300,0 | 0,28 |
| 2/3 | 2,14 | 0† | 0† | 383,3 | 941,6 | 0,59 |
| 4/5 | 1,04 | 0,65 | 0,78 | 725,0 | 936,6 | 0,69 |
| 6/7 | 0,63 | 0,60 | 1,46‡ | 572,9 | 914,3 | 0,78 |
| 8/9/10 | 0,19 / 1,04 | 1,00 | 1,63 | 850,0 / 688,1 | 627,1 | 1,23 |
| **Mean** | **0,95 fps** | — | **0,83× PASS** | — | — | **0,71× FAIL** |

\* Tỉ lệ drift-corrected của harness (không phải chia trực tiếp).
† Slot 3 deint = 0 fps: phát tự dừng trước khi hết slot (playhead
chạm cuối clip sau start-poll — lỗi harness đã biết từ F1 §6.3).
‡ Tỉ lệ 1,46 của cặp 6/7 bị nhiễu vì slot 6 baseline chỉ 0,63 fps.

- **T1 gap-mean FAIL 0,71×** trong khi draw-fps PASS 0,83× — hai
  metric lại mâu thuẫn như F1 (Run E: draw 0,58× FAIL nhưng gap
  0,86× PASS — lần này ngược chiều). Gap-mean chịu nhiễu tải trực
  tiếp (slot 1 deint gap P50 1583 ms lúc load 29–31; các slot deint
  sau đều bị cảnh báo tự dừng). Không dùng 1 lần đo gap-mean này
  để bác 3 lần draw-fps PASS (xem §5.1).
- **Phân rã drawImage — cơ chế đã xác nhận trong app thật:**
  - Deint slots: `canvas->1280x360` 3/2/1/5 calls, **0–1,22
    ms/call** (tổng ≤ 6,1 ms/slot); **KHÔNG CÒN entry
    `video->1280x360` nào** — lần vẽ video→intermediate đã biến
    mất hoàn toàn.
  - Baseline slots: `video->1280x720` (held store) 37–99 ms/call;
    `video->1991x815` (main) 122–244 ms/call.
  - Deint slots vẫn có `video->1991x815` 219–256 ms/call (1–3
    calls) và `video->640x360` 35–92 ms/call — đây là các clip
    khác trong project mẫu (chỉ clip 1 có deint) + đường khác,
    xuất hiện ở CẢ 2 loại slot nên là chi phí chung, không phải
    của deint.
  - Tổng drawImage ms/tick: **baseline 445,5 (slot 197–869) vs
    deint 287,0 theo cách tính của harness (slot 233–501; harness
    tính slot 3 lỗi là 0 — trung bình 4 slot có số là 358,8)** — deint
    nay rẻ hơn baseline về tổng thời gian drawImage; F1 đo ngược
    lại (235,5 vs 420). Chênh này lớn hơn nhiễu slot (n=5–6 slot
    mỗi bên) nhưng phương sai slot vẫn lớn — chỉ đọc là bằng chứng
    cơ chế, không dùng để tính FPS dự báo.

### 3.4 Tổng hợp G5 — code mới vs code cũ (metric draw-fps)

| Đường | Lần đo | Tỉ lệ drift-corrected | Mean | Baseline fps |
|---|---|---|---|---|
| Half-res, code cũ (F1) | Run E1 rerun | 0,81/0,49/0,74/0,50/0,41 | 0,59 | 9,81 |
| Half-res, code cũ (F1) | Run E tick-time | 0,62/1,16/0,39/0,57/0,15 | 0,58 | 1,05 |
| Half-res, code cũ (F1) | Run F tick-time | 1,01/0,45/0,25/0,50/0,54 | 0,55 | 0,85 |
| **Held-source, code mới (G1)** | **E1 lần 1** | **2,9/0,8/1,2/2,3/0,37** | **1,51** | **0,98** |
| **Held-source, code mới (G1)** | **tick-time** | **0,3/0/0,78/1,46/1,63** | **0,83** | **0,95** |
| **Held-source, code mới (G1)** | **E1 lần 2** | **1,01/0,63/0,77/1,08/1,66** | **1,03** | **1,21** |
| **Gộp code mới** | **3 lần** | **15 tỉ lệ** | **1,12** | **—** |

Cũ: 15 tỉ lệ, mean 0,57, cả 3 lần < 0,75×. Mới: 15 tỉ lệ, mean
1,12, median 1,01, cả 3 lần ≥ 0,75×. Chênh giữa 2 đường (~0,55)
lớn hơn độ lệch chuẩn trong từng lần đo mới (SD 0,35–0,94 — vẫn
lớn, xem §5.1) nhưng đổi chiều nhất quán cả 3 lần và khớp cơ chế
(§3.3). Đừng trích "nhanh hơn 12%" như con số chính xác — con số
đáng tin là "3/3 lần ≥ ngưỡng, trong khi code cũ 0/3".

## 4. Kiểm chứng (cây cuối — đã giữ hướng mới)

| Kiểm chứng | Kết quả |
|---|---|
| `tsc --noEmit` (apps/web) | **0 lỗi** |
| `vite build` | **pass** (1m10s; cảnh báo chunk >500kB có từ trước) |
| Unit `enhancePreview77E1.test.ts` vi | **11/11** |
| Unit `enhancePreview76D4.test.ts` vi | **10/10** |
| Unit `enhancePreview75C8.test.ts` vi | **14/14** |
| Headed E1 lần 1 (code mới) | **10/10** (G5 1,51×) |
| Headed E1 lần 2 (code mới) | **10/10** (G5 1,03×; pixel giống hệt lần 1) |
| Headed tick-time (code mới) | **7/8** (chỉ T1 gap FAIL 0,71×; G5 draw-fps 0,83× PASS) |
| Probe tab trắng G1 (cơ chế + pixel) | xong (§3.1; held2inter ~0ms median, MAD B-vs-A 0,016) |
| Headed H9 (mọi lần chạy) | **0 lỗi trang** |

## 5. Giới hạn — đọc trước khi trích số

1. **"Đạt" ở đây nghĩa là: 3/3 lần đo headed trên metric ngưỡng
   (draw-fps) đều ≥ 0,75×, trong khi code cũ 0/3.** Đừng trích
   "1,12×" hay "nhanh hơn 12%" như tốc độ thật — từng tỉ lệ rải
   0–2,9 (SD 0,40–0,94), baseline tuyệt đối chỉ ~1 fps, tải VM
   dao động 0,7–37,8 trong đợt (sibling đợt 79 chạy song song).
   FPS tuyệt đối các lần chạy không so được với nhau hay với D4.
2. **Gap-mean (metric phụ) KHÔNG xác nhận: 0,71× trong 1 lần đo
   duy nhất.** Hai metric mâu thuẫn nhau cả ở code cũ (F1 Run E:
   draw 0,58× FAIL / gap 0,86× PASS) lẫn code mới (draw 0,83×
   PASS / gap 0,71× FAIL). Ngưỡng 0,75× được định nghĩa theo
   draw-fps từ đầu (F1 §1), nên verdict theo draw-fps; nhưng
   gap-mean 0,71× là lý do KHÔNG được phóng đại kết quả thành
   "deint nay nhanh hơn baseline" — chỉ được nói "không còn chậm
   hơn ngưỡng đo được". Cần đo lại gap-mean lúc VM yên tĩnh để
   khép metric phụ này (nợ §6.1).
3. **Slot 3 tick-time (deint 0 fps) là lỗi harness đã biết** (phát
   tự dừng vì start-poll làm playhead trôi tới cuối clip 5s —
   F1 §6.3): tỉ lệ 0 đó kéo mean draw-fps của lần tick-time xuống;
   không phải deint đứng hình. Harness cần sửa theo F1 §6.3 (trừ
   thời gian poll khỏi slot hoặc seek lại 0 sau playing=true).
4. **G8 MAD +0,099 so với F1 (1,4826 → 1,5817) là thay đổi lớn
   nhất trong các số pixel.** Nó là MAD giữa deint-BẬT và deint-
   TẮT trong cùng lần chạy (độ lớn hiệu ứng deint trên BBB), không
   phải sai lệch giữa 2 đường — và R không đổi (0,55 → 0,52 cả
   cũ lẫn mới). Probe cùng-frame cho MAD giữa 2 đường chỉ 0,016,
   nên phần lớn +0,099 có thể là frame BBB bắt được khác pha giữa
   các đợt (harness seek/sleep giống nhau nhưng tải khác nhau) —
   nhưng chưa tách được 2 nguyên nhân. Nếu lần đo sau G8 MAD lại
   dịch thêm cùng chiều thì phải xem lại; hiện tại R và mọi ngưỡng
   G8 đều PASS nên giữ.
5. **Số median 0ms của drawImage canvas→canvas trong probe tab
   trắng là artefact deferral** (xem §3.1) — đừng trích "lần vẽ
   intermediate nay 0ms". Số headed đáng tin hơn:
   canvas→1280×360 0–1,22 ms/call trong app thật (§3.3).
6. **Thay đổi chỉ áp cho clip video thô, deint đơn lẻ.** Clip có
   chroma/LUT/effects + deint vẫn đọc video cho intermediate như
   cũ (cố tình — không được bỏ hiệu ứng để đổi lấy FPS); clip
   deint + denoise/stabilize vẫn qua offscreen enhanceCanvas như
   cũ. FPS của các combo đó chưa đo — không claim.
7. **Chưa đo:** máy thật có GPU; Safari/WebKit thật; footage xen
   kẽ gốc từ camera (nợ cũ từ D4); tap + motion-blur-blend lúc
   đang phát (nợ cũ từ D4); gap-mean lúc VM yên tĩnh (§6.1).
8. **File chung `preview.tsx` đang được nhiều luồng đợt 79 sửa
   song song:** batch này stage toàn bộ file ở trạng thái sau khi
   sửa G1 — parent gộp cần đối chiếu tsc lại sau khi gộp (mẫu cũ
   từ E1 §5.9).

## 6. Nợ mở cho đợt sau

1. **G5: khép metric phụ gap-mean.** Đo lại tick-time lúc VM yên
   tĩnh (không có 8–10 luồng sibling) hoặc với fixture dài hơn
   (BBB 10s) để slot 8–10s, giảm lượng tử hoá + tránh tự dừng
   (F1 §6.3). Nếu gap-mean vẫn < 0,75× trong khi draw-fps ≥
   0,75× thì phải quyết metric nào là chuẩn (quyết định của
   user/parent, không tự đổi ngưỡng hay tự đổi metric).
2. Harness FPS: sửa lỗi start-poll làm playhead trôi (F1 §6.3 —
   trừ thời gian poll khỏi slot hoặc seek lại 0 sau playing=true)
   để không còn slot 0 fps giả.
3. Tách nguyên nhân G8 MAD +0,099 (§5.4): so snapshot cùng-frame
   giữa 2 đường trên BBB (như probe §3.1 nhưng trong app) nếu
   G8 còn dịch.
4. FPS cho combo deint + chroma/LUT/effects (đường intermediate
   vẫn đọc video) — nếu combo cũng chậm thì hướng held-source có
   thể mở rộng sang các đường đó (cần giữ hiệu ứng: đọc từ canvas
   ĐÃ QUA hiệu ứng, không phải held canvas thô).
5. TTS 39 / gate / NEEDS_WRITABLE / kernel BC / G1-G2 / keyframe
   worker / GPU-Safari / u2netp: nợ của các luồng khác trong đợt
   79 — không thuộc G1, không làm ở đây.

## 7. Cách chạy lại

```bash
# Probe tab trắng G1 (cơ chế + pixel, ~2 phút):
G1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round79-g1/probe \
  G1_DEV_PORT=5591 G1_DEBUG_PORT=9691 G1_DISPLAY=:191 \
  node apps/web/scripts/probe-79g1-deint-source.mjs
# Headed E1 trên cây hiện tại (11 slot × 3s, ~5 phút):
E1_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round79-g1/headed \
  E1_DEV_PORT=5592 E1_DEBUG_PORT=9692 E1_DISPLAY=:192 \
  node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Probe tick-time G1 (11 slot × 4,5s + gap rAF + drawImage theo nguồn, ~5 phút):
G1_TT_SCRATCH=$HOME/workspace/goals/capcut-clone-video-editor/hidden_files/round79-g1/ticktime \
  G1_TT_DEV_PORT=5593 G1_TT_DEBUG_PORT=9693 G1_TT_DISPLAY=:193 \
  node apps/web/scripts/probe-79g1-tick-time.mjs
# Unit test (vi):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview77E1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round79-g1/enhancePreview77E1.test.cjs \
  && node /tmp/round79-g1/enhancePreview77E1.test.cjs
```
