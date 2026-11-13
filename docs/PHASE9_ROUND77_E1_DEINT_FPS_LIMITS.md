# Đợt 77 E1 — FPS deint-only: inline không đạt, divisor 4 không nhanh hơn, QUAY VỀ half-res: LIMITS trung thực

Ngày đo: 2026-11-10 giờ VN (log ghi giờ UTC 2026-11-09 ~20:52–21:54; các
mốc giờ trong file này theo log UTC trừ khi ghi rõ). Máy đo: VM này (CPU-only,
Chromium 158 qua Xvfb + CDP, FFmpeg 8.1.2). Nợ: docs/PHASE9_ROUND76_D4_DEINT_FPS_LIMITS.md
§6.1 — FPS deint-only half-res 0.72–0.73×, FAIL ngưỡng 0.75×.

## 1. Kết luận ngắn

- **Nhiệm vụ E1 KHÔNG đạt mục tiêu FPS — và luồng này KHÔNG giấu điều đó
  bằng cách giữ một thay đổi chưa chứng minh được.** Bốn ứng viên đường
  nhanh đã đo thật, cả bốn đều không đạt:
  1. **Inline-shift 1 lần vẽ — LOẠI (xác nhận lại D4):** probe R 0.85 →
     0.88 ở s=1.13 (không giảm), chỉ có tác dụng ở s≈1.0 (R 1.05 → 0.66).
  2. **tap2 (2 lần vẽ từ video, lệch +1 hàng nguồn, alpha 0.5) — LOẠI:**
     R 0.58 ở s=1.13 nhưng FAIL tiêu chí 1:1 (R 0.67 > 0.55) và thông
     lượng 1.66–2.4× vẽ thường.
  3. **ctx.filter blur(1px) 1 lần vẽ — LOẠI:** R 0.52–0.53 mọi tỉ lệ
     nhưng thông lượng 2.3–61× và vgrad chỉ 20–41% (mềm quá).
  4. **Intermediate thu hẹp dọc 4× (dw×dh/4) — THỬ RỒI QUAY VỀ:**
     chất lượng ĐẠT (headed R 0.74 → 0.50, probe 0.54 ở s=1.0 ≤ 0.55 ✓)
     nhưng **FPS không chứng minh được nhanh hơn half-res**: G5 lần 1
     0.83× PASS, lần 2 0.64× FAIL — gộp 10 tỉ lệ mean **0.735**, không
     tách được khỏi half-res (D4: 0.72–0.73; baseline cùng ngày: 0.78;
     lần xác minh quay về: 0.79). Đổi lại còn **mềm hơn** (vgrad 38% so
     với 59% ở s=1.13) và **G7b FAIL hệ thống cả 2 lần** (mask MAD
     0.6396 so với 0.0036 của half-res — intermediate dh/4 phải upscale
     2× trong mask unit 640×360 trong khi dh/2 khớp đúng 1:1).
- **Quyết định cuối: QUAY VỀ divisor 2 (half-res D4).** Cây cuối của đợt
  này cho hành vi y hệt D4 (lần xác minh quay về: **10/10**, G2/G7a/G7b/
  G8 giống D4 tới 4 chữ số thập phân). Những gì E1 để lại là: probe
  loại 3 ứng viên bằng số đo, harness E1 (thử lại cổng khi bị chiếm +
  11 slot FPS), hằng `ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR` (=
  2) thay cho số 2 viết cứng, test E1 khóa trạng thái cuối, và kết luận
  về giới hạn đo FPS (xem §3.5) — nợ G5 vẫn MỞ.
- Ngưỡng 0.75× giữ nguyên, KHÔNG nới. Không có code giả/mock nào.

## 2. Thay đổi code (trạng thái cuối — sau khi quay về)

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | Hằng mới `ENHANCE_PREVIEW_DEINT_INTERMEDIATE_DIVISOR = 2` (divisor phải chẵn — xem comment đầu file); comment đầu file thêm đoạn E1 (lịch sử đầy đủ: 3 ứng viên bị loại + divisor 4 đã thử và quay về + lý do); 2 comment (doc `needsOffscreen`, comment trong `enhancePreviewPlan`) đổi "half-res (dw×dh/2)" → "intermediate thu hẹp dọc". Plan shape KHÔNG đổi (vẫn 10 key), không đổi ngưỡng 0.9 / offset 0.5px. |
| `apps/web/src/preview.tsx` | `deintHalfResSource` → `deintIntermediateSource` (đọc divisor từ hằng, thay vì `h / 2` viết cứng); `deintHalfCanvas` → `deintIntermediateCanvas`; call-site `halfSrc` → `interSrc`; comment đầu `enhancePreviewSource` + comment call-site + comment hàm cập nhật theo E1 (divisor 4 đã thử và quay về + lý do G7b). Hành vi runtime cuối = D4 (divisor 2). |
| `apps/web/src/components/enhance/enhancePreview77E1.test.ts` | **Mới**: 11 test khóa trạng thái cuối — divisor = 2, divisor chẵn ≥ 2, tín hiệu intermediate (tap true + needsOffscreen false cho deint đơn lẻ, kể cả biên 0.9 / denoise 0 / stabilize bị chặn), offscreen khi kèm denoise/stabilize, không tap dưới ngưỡng/toggle tắt, hook debug phân biệt intermediate/offscreen. |
| `apps/web/scripts/probe-77e1-deint-fast.mjs` | **Mới**: probe tab trắng 9 mode (noop/shift/halfHigh/halfLow/halfMed/tap2/blur1/qtrH/qtr) — R + vgrad + hgrad + MAD vs noop ở s ∈ {1.0, 1.13}, thông lượng 60 lần vẽ × 2 lần lặp ở s ∈ {1.0, 1.13}; tách 2 lần evaluate (R rồi throughput) + timeout CDP 180s để chịu được tải VM cao (lần chạy đầu timeout 60s vì loadavg ~12). |
| `apps/web/scripts/clicktest-77e1-deint-fps.mjs` | **Mới** (copy harness D4 + sửa): header E1, env `E1_*`, cổng dev 5580–5589 / debug 9680–9689, scratch `round77-e1`, **thử lại vite tối đa 3 lần** khi cổng bị luồng khác chiếm (lần chạy baseline đầu: vite E9 chiếm 5580 → EADDRINUSE nhưng fetch(DEV_URL) vẫn "lên" vì trúng server luồng khác, media probe 200 thay vì 206), **11 slot FPS (5 tỉ lệ)** thay vì 7 slot (3 tỉ lệ) — baseline chỉ ~2 fps nên mỗi slot 3s chỉ ~6 lần vẽ (lượng tử hoá ±17%). |
| `docs/PHASE9_ROUND77_E1_DEINT_FPS_LIMITS.md` | **Mới**: file này. |

Không đụng spec/render/store/i18n (dict không đổi, không thêm key).
Không đụng `ci-security.yml`/workflow. Không binary vào batch.

## 3. Số đo thật

### 3.1 Probe E1 — 9 mode trên tab trắng (`probe-77e1-deint-fast.mjs`)

Fixture: `interlaced720.mp4` (testsrc2 60fps + `tinterlace`, idet TFF=150
Prog=0), `clean720.mp4` (progressive). Mốc 1.0s. R = metric combing C/S
(như D1 đợt 61 R3); vgrad/hgrad = gradient dọc/ngang trung bình (giữ %
so với noop); MAD = mean abs diff vs noop.

**Interlaced (R thấp = khử combing tốt):**

| s | noop | shift (inline) | halfHigh | halfLow | halfMed | tap2 | blur1 | qtrH | qtr |
|---|---|---|---|---|---|---|---|---|---|
| 1.0 R | 1.05 | 0.66 | **0.43** | 0.43 | 0.43 | 0.67 | 0.52 | 0.54 | 0.45 |
| 1.13 R | 0.85 | 0.88 | 0.66 | 0.66 | 0.66 | **0.58** | 0.53 | 0.58 | 0.65 |
| 1.0 vgrad giữ | — | 47% | 24% | 24% | 24% | 47% | 20% | 24% | 20% |
| 1.13 vgrad giữ | — | 104% | 59% | 59% | 59% | 53% | 30% | 38% | 52% |
| 1.13 hgrad giữ | — | 100% | 91% | 91% | 91% | 91% | 52% | 91% | 54% |
| 1.13 MAD vs noop | — | 1.215 | 0.962 | 0.962 | 0.962 | 0.993 | 1.859 | 1.698 | 1.703 |

**Clean (R thấp ở đây = mềm thêm, không phải tốt hơn; vgrad/hgrad giữ
càng cao càng tốt):**

| s | noop | shift | half* | tap2 | blur1 | qtrH | qtr |
|---|---|---|---|---|---|---|---|
| 1.0 R | 0.73 | 0.63 | 0.45 | 0.63 | 0.53 | 0.54 | 0.48 |
| 1.13 R | 0.68 | 0.72 | 0.63 | 0.58 | 0.52 | 0.56 | 0.62 |
| 1.13 vgrad giữ | — | 107% | **73%** | 70% | 41% | 50% | 63% |
| 1.13 hgrad giữ | — | 100% | **91%** | 90% | 52% | 91% | 54% |

- **halfHigh = halfLow = halfMed pixel-Y-HỆT nhau** (R/vgrad/hgrad/MAD
  giống tới 3 chữ số thập phân ở mọi tỉ lệ, cả 2 video): ở downscale
  đúng 2×, bilinear point-sample đã lấy đúng giữa 2 hàng nguồn (trọng
  số 0.5/0.5) nên setting `imageSmoothingQuality` không đổi pixel nào.
  Giữ `"high"` như D4 (không có bằng chứng đổi setting thì nhanh hơn —
  xem thông lượng dưới).
- **shift (inline) xác nhận lại D4 probe-b:** chỉ có tác dụng ở s≈1.0
  (1.05 → 0.66); ở s=1.13 R 0.85 → 0.88 (không giảm, còn tăng nhẹ).
- **tap2:** R tốt ở 1.13 (0.58, ngang qtrH) nhưng FAIL tiêu chí 1:1
  (0.67 > 0.55) — ở 1:1 tap2 chỉ bằng shift (0.66–0.67), kém xa half
  (0.43). vgrad 53–70% (mềm hơn half một chút ở 1.13).
- **blur1:** R tốt nhất (0.52–0.53 mọi tỉ lệ) nhưng vgrad chỉ 20–41%,
  hgrad 52% — mềm cả hai chiều, không phải deinterlace mà là mờ toàn
  cục; và thông lượng tệ nhất (xem dưới).
- **qtrH:** R 0.54 ở 1.0 (≤ 0.55 ✓, kém half 0.43 nhưng đạt chuẩn) và
  0.58 ở 1.13 (tốt hơn half 0.66); hgrad giữ 91% như half; vgrad chỉ
  38% ở 1.13 (half 59%) — mềm dọc rõ rệt.
- **qtr (dw/2×dh/2):** R 0.45/0.65 nhưng hgrad chỉ 54% (mềm ngang nặng)
  — LOẠI, không cần đo headed.

**Thông lượng (ms/draw, 60 lần vẽ cùng frame × 2 lần lặp) — CHỈ LÀ SÀNG
LỌC, không phải verdict FPS (D4 §3.3: frame-lặp nói quá tốc độ trong
app thật; chỉ số headed mới đọc được):**

| s=1.13 | noop | halfHigh | halfLow | halfMed | tap2 | blur1 | qtrH | qtr |
|---|---|---|---|---|---|---|---|---|
| interlaced | 30.61 | 21.48 (0.70×) | 21.97 (0.72×) | 14.21 (0.46×) | 50.84 (1.66×) | 214.13 (7×) | 12.45 (0.41×) | 16.71 (0.55×) |
| clean | 37.41 | 29.13 (0.78×) | 24.42 (0.65×) | 20.98 (0.56×) | 89.81 (2.4×) | 85.07 (2.27×) | 5.83 (0.16×) | 4.17 (0.11×) |

- Nhiễu rất lớn: chính `noop` đã dao động 0.95 ms (interlaced s=1.0)
  → 4.97 ms (clean s=1.0) → 30.61/37.41 ms (s=1.13) theo tải VM lúc
  đo (loadavg 1.2–14). Chỉ đọc được định tính: blur1 luôn tệ nhất
  (2.3–61×); tap2 luôn chậm hơn vẽ thường (1.66–2.4× ở s=1.13);
  halfHigh/halfLow/halfMed không phân biệt được nhau một cách đáng tin
  (pixel đã y hệt nhau — mọi chênh thông lượng giữa chúng đều có thể
  là nhiễu); qtrH/qtr thường nhanh nhất trong màn hình này (ít pixel
  lần 1 nhất) — nhưng headed (§3.4) không tái hiện được lợi thế đó.
- Probe lần đầu timeout CDP 60s (loadavg ~12 lúc mở đầu, vòng 77 nhiều
  luồng song song): đã tách evaluate R/throughput + nâng timeout 180s
  và bỏ s=1.5 (đã có số D4 probe-c).

### 3.2 Headed BASELINE — half-res, cây chưa đổi (harness E1, 7 slot)

21:00–21:05, cửa sổ 2560×1440, canvas backing 1991×815, tỉ lệ thật
1.132, clip 1 = interlaced720.mp4, playhead 1.0s, pause (G1–G4/G7/G8);
G5 phát xen kẽ 7 slot × 3s. **10/10 PASS** — số pixel y hệt D4:

| Case | Kết quả |
|---|---|
| G1 baseline | R 0.74 − 0.60 = gap 0.14, tap=false — PASS |
| G2 deint BẬT | R **0.74 → 0.51**, MAD 0.6087, tap=true offscreen=false — PASS |
| G3 tắt lại | MAD vs A = 0 — PASS |
| G4 progressive + deint | R 0.51 — PASS |
| G5 FPS | 0.58 / 0.61 / 1.15 → **0.78×** (baseline mean 2.27 fps) — PASS (nhiễu, xem §3.5) |
| G7a SR | R 0.68 → 0.51, MAD 0.6944 — PASS |
| G7b mask | R 0.5 → 0.5, MAD 0.0036 — PASS |
| G8 BBB thật | R 0.55 → 0.52, MAD 1.4826 — PASS |
| H9 | 0 lỗi trang — PASS |

Lưu ý: G5 baseline lần này PASS 0.78× trong khi D4 đo 0.72–0.73× —
không phải half-res đã nhanh lên, mà là nhiễu tải (load 13.5→20.4
trong lúc chạy G5, baseline chỉ 2.27 fps so với 7.74–24.23 fps của
D4; 3 tỉ lệ rải 0.58–1.15). Xem §3.5.

### 3.3 Headed ỨNG VIÊN — divisor 4 (harness E1, 11 slot, 2 lần)

**Lần 1** (21:26–21:29): **9/10** (chỉ G7b FAIL).

| Case | Kết quả |
|---|---|
| G2 deint BẬT | R **0.74 → 0.50**, MAD 1.4546 (half-res: 0.51 / 0.6087) — PASS |
| G5 FPS | 1.15 / 0.89 / 0.62 / 1.08 / 0.4 → **0.83×** (baseline 2.43 fps) — PASS |
| G7a SR | R 0.68 → 0.49, MAD 1.7288 (half-res: 0.51 / 0.6944) — PASS |
| G7b mask | R 0.5 → 0.49 (\|ΔR\| 0.01 ✓) nhưng **MAD 0.6396** (kỳ vọng < 0.05) — **FAIL** |
| G8 BBB thật | R 0.55 → 0.51, MAD 3.5782 (half-res: 0.52 / 1.4826) — PASS |
| G1/G3/G4/H9 | PASS (G1 gap 0.14, G3 MAD 0, G4 R 0.5) |

**Lần 2** (21:32–21:36): **9/10** (chỉ G7b FAIL) — số pixel Y HỆT lần 1:

| Case | Kết quả |
|---|---|
| G2 deint BẬT | R 0.74 → 0.50, MAD 1.4546 — PASS (y hệt lần 1) |
| G5 FPS | 0.54 / 0.36 / 0.49 / 1.01 / 0.81 → **0.64×** (baseline 1.55 fps) — **FAIL** |
| G7a SR | R 0.68 → 0.49, MAD 1.7288 — PASS (y hệt lần 1) |
| G7b mask | R 0.5 → 0.49, **MAD 0.6396** — **FAIL** (y hệt lần 1 — hệ thống, không phải nhiễu) |
| G8 BBB thật | R 0.55 → 0.51, MAD 3.5782 — PASS (y hệt lần 1) |

- **G7b — cơ chế đã rõ (không phải nhiễu):** mask unit 640×360
  downscale dọc 2× từ letterbox (theo D4 — dh 720) nên với half-res
  (dh/2 = 360) phép vẽ unit là 1:1 → MAD 0.0036; với divisor 4 (dh/4
  = 180) unit phải upscale dọc 2× (180 → 360) → ảnh mask mềm đi, MAD
  0.6396.
  R không đổi (0.5 → 0.49) vì răng cưa đã bị unit trung bình hết —
  đây là thay đổi resample, không phải hồi quy combing — nhưng tiêu
  chí G7b ("đường mask không đổi pixel") viết cho half-res, và 0.64
  lớn gấp ~180× ngưỡng 0.05 nên ghi FAIL trung thực, không nới tiêu
  chí. Đã cân nhắc vá riêng cho mask (divisor 2 khi clip có mask) rồi
  BỎ — vì divisor 4 cũng không chứng minh được lợi FPS (§3.5), vá
  mask chỉ để giữ một thay đổi không có lợi ích đo được.
- **G5 lần 1 vs lần 2 (0.83× vs 0.64×):** cùng code, cùng harness,
  khác nhau hoàn toàn do tải: lần 1 load tăng vọt giữa chừng (1.13 →
  15.16, slot 9 deint chỉ 1.09 fps trong lúc load spike 11.3→12.7);
  lần 2 load giảm đều (2.27 → 0.63) nhưng các slot deint đầu vẫn chỉ
  0.58–0.79 fps. Cả hai lần baseline tuyệt đối đều rất thấp (2.43 /
  1.55 fps) — mỗi slot 3s chỉ ~2–8 lần vẽ.

### 3.4 Headed XÁC MINH QUAY VỀ — divisor 2 (harness E1, 11 slot)

21:45–21:48, sau khi quay hằng về 2: **10/10 PASS**, mọi số pixel
khớp D4 tới 4 chữ số thập phân:

| Case | Kết quả |
|---|---|
| G2 deint BẬT | R 0.74 → **0.51**, MAD 0.6087 — PASS |
| G5 FPS | 1.11 / 0.83 / 0.72 / 0.59 / 0.71 → **0.79×** (baseline 2.63 fps) — PASS |
| G7a SR | R 0.68 → 0.51, MAD 0.6944 — PASS |
| G7b mask | R 0.5 → 0.5, MAD **0.0036** — PASS (đã về lại như D4) |
| G8 BBB thật | R 0.55 → 0.52, MAD 1.4826 — PASS |
| G1/G3/G4/H9 | PASS |

### 3.5 Tổng hợp G5 — mọi số đo FPS deint-only (giữ ngưỡng 0.75×)

| Đường | Lần đo | Tỉ lệ drift-corrected | Mean | Baseline fps |
|---|---|---|---|---|
| C8 offscreen (D4 ghi lại) | đợt 75 | 0.72/0.60/1.08/0.59/0.46/0.51/0.53/0.91 (3 lần × ~3) | 0.65–0.71 | 0.6–33 |
| Half-res (D4) | 09/11 lần 2 | 0.84/0.69/0.66 | 0.73 | 24.23 |
| Half-res (D4) | 09/11 lần 3 | 0.79/0.64/0.73 | 0.72 | 7.74 |
| Half-res (E1 baseline) | 09/11 21:00 (UTC) | 0.58/0.61/1.15 | 0.78 | 2.27 |
| **qtrH divisor 4 (E1)** | lần 1 | 1.15/0.89/0.62/1.08/0.4 | **0.83** | 2.43 |
| **qtrH divisor 4 (E1)** | lần 2 | 0.54/0.36/0.49/1.01/0.81 | **0.64** | 1.55 |
| Half-res (E1 xác minh quay về) | 21:45 | 1.11/0.83/0.72/0.59/0.71 | 0.79 | 2.63 |

- Gộp: half-res 14 tỉ lệ (D4 6 + E1 8) mean **0.77**; qtrH 10 tỉ lệ
  mean **0.735**. Chênh 0.035 — nhỏ hơn nhiều so với độ lệch chuẩn
  của từng tỉ lệ (~0.25; rải 0.36–1.15). **Không tách được hai đường.**
- Vì sao mô hình pixel (lần 1 chỉ 1/2 pixel → FPS ~0.85×) không
  thành hiện thực headed: tick preview ở ~2 fps (~400–650 ms/tick)
  bị chi phối bởi chi phí cố định — decode h264 720p60 bằng phần mềm
  (mỗi tick video vẫn decode ~30 frame nền), React/store, và tải từ
  các luồng vòng 77 khác (bgremove/ffmpeg/Chrome + 3 tiến trình `yes`
  chiếm ~13% CPU mỗi cái trong lúc đo). Lần vẽ intermediate chỉ là
  phần nhỏ của tick (probe: ~20 ms/lần vẽ so với tick ~500 ms) nên thu
  nhỏ nó không nhúc nhích được FPS tổng. D4 đo được chênh offscreen
  vs half-res (0.65–0.71 vs 0.72–0.73) ở baseline 7–24 fps, tải ~4–5
  — điều kiện hôm nay (baseline 1.5–2.6 fps, tải 5–20) không còn đủ
  phân giải để tách chênh ~0.05–0.1.

### 3.6 Hồi quy headed (cây cuối — đã quay về divisor 2)

- Q1 (`clicktest-60q1-enhance-preview.mjs`): **7/7** — B5 deinterlace
  ở letterbox (tỉ lệ thật 0.76 < 0.9): hook `notApproximated=
  [deinterlace]`, pixel E→F mean abs diff **0**.
- Combo 61R3 (`clicktest-61r3-combo.mjs`): **8/9, 2 lần giống nhau** —
  chỉ C3 motion blur FAIL (xem §4.2).

## 4. Kiểm chứng (cây cuối — đã quay về divisor 2)

| Kiểm chứng | Kết quả |
|---|---|
| Unit mới `enhancePreview77E1.test.ts` vi + en | **11/11 + 11/11** |
| D4 `enhancePreview76D4.test.ts` vi + en | **10/10 + 10/10** |
| C8 `enhancePreview75C8.test.ts` vi + en | **14/14 + 14/14** |
| Q1 `enhancePreview60Q1.test.ts` vi + en | **16/16 + 16/16** |
| 61R3 `enhancePreview61R3.test.ts` vi + en | **7/7 + 7/7** |
| 62R3 `enhancePreview62R3.test.ts` vi + en | **10/10 + 10/10** |
| 63R3 `enhancePreview63R3.test.ts` vi + en | **8/8 + 8/8** |
| P8 `enhancePresets59P8.test.ts` vi + en | **21/21 + 21/21** |
| R2 `enhanceSpeedBlock61R2.test.ts` vi + en | **9/9 + 9/9** |
| `previewEngine.test.ts` | **14/14** |
| css60 / css61 | **59/59 / 60/60** |
| `tsc --noEmit` (apps/web) | **0 lỗi** (lần chạy đầu bắt 3 lỗi trong file test của luồng E7 đang sửa dở — không phải file E1; chạy lại sau E7 sửa xong thì 0 lỗi) |
| `vite build` | **pass** (50.72s; cảnh báo chunk >500kB có từ trước) |
| `r6-i18n-check.cjs` | **PASS** (không thêm key) |
| Headed baseline half-res (7 slot) | **10/10** (G5 0.78×) |
| Headed ứng viên divisor 4 (11 slot, 2 lần) | **9/10 + 9/10** (chỉ G7b FAIL; G5 0.83× rồi 0.64×) |
| Headed xác minh quay về (11 slot) | **10/10** (G5 0.79×; số pixel y hệt D4) |
| Headed Q1 / Combo 61R3 (hồi quy) | **7/7 / 8/9 ×2** (xem §4.2) |
| Probe E1 (9 mode, 2 video) | xong (xem §3.1) |

### 4.2 Combo C3 — FAIL 2 lần, KHÔNG phải hồi quy do E1

Combo 61R3 chạy 2 lần trên cây cuối đều 8/9, chỉ C3 motion blur FAIL.
Cả 2 lần đều FAIL **chỉ ở nhánh transient** (c3transOk), nhánh tồn dư
ĐẠT (residual meanAbs = **0** cả 2 lần, sàn 0):

| | transient lúc phát | sàn căn chỉnh | Điều kiện (> 2× sàn) |
|---|---|---|---|
| Lần 1 | 1.5515 | 3.1203 | 1.55 < 6.24 ✗ |
| Lần 2 | 4.2717 | 4.1373 | 4.27 < 8.27 ✗ |

- Sàn căn chỉnh (3.12 / 4.14) là hiệu giữa snapshot LÚC ĐANG PHÁT và
  snapshot settled cùng playhead khi blur TẮT — tức độ lệch căn chỉnh
  snapshot/playhead dưới tải, không phải tín hiệu motion blur. Ở ~2
  fps, snapshot lúc phát bắt được frame vẽ cuối có thể lệch ~0.5s so
  với playhead ghi nhận nên sàn rất cao; tín hiệu transient (1.55 /
  4.27) cùng bậc với sàn nên phương pháp không tách được — đây là giới
  hạn tải của phương pháp C3, không phải lỗi motion blur (tồn dư = 0).
- **Không liên quan code E1:** C6 hook full combo PASS cả 2 lần —
  applied `[denoise]`, `notApproximated` chứa `deinterlace`,
  `deinterlaceTap=false` (tỉ lệ letterbox < 0.9) — đường intermediate
  của E1 không hề chạy với clip combo này. D4 đo combo 9/9 ở tải thấp
  hơn (baseline FPS cao hơn); hôm nay baseline chỉ ~2 fps nên C3
  không ổn định. Nợ: làm C3 bớt nhạy tải (xem §6.3).

## 5. Giới hạn — đọc trước khi trích số

1. **G5 vẫn FAIL theo nghĩa nợ chưa đóng — nhưng lần này không kết luận
   được "chậm hơn ngưỡng" một cách chắc chắn.** Half-res đo được 0.72,
   0.73 (D4, tải thấp), 0.78, 0.79 (E1, tải cao); qtrH đo được 0.83,
   0.64. Tất cả nằm trong cùng một dải nhiễu (0.64–0.83). Đừng trích
   "qtrH đạt 0.83×" (chỉ 1 trong 2 lần) cũng đừng trích "qtrH chỉ
   0.64×" (lần còn lại) — số gộp trung thực là mean 0.735 trên 10 tỉ
   lệ, không tách được khỏi half-res.
2. **FPS tuyệt đối hôm nay (1.5–2.6 fps) không so được với D4 (7–24
   fps):** tải VM hôm nay cao hơn nhiều (các luồng vòng 77 khác chạy
   bgremove/ffmpeg/Chrome + 3 tiến trình `yes`). Chỉ tỉ lệ
   drift-corrected mới đọc được, và ngay cả tỉ lệ cũng nhiễu mạnh
   (§3.5). Đừng trích FPS tuyệt đối.
3. **Divisor 4 đã thử và BỎ — đừng khôi phục chỉ vì "R tốt hơn".**
   R headed 0.50 (divisor 4) so với 0.51 (divisor 2) là chênh không
   đáng kể; probe R 0.58 vs 0.66 ở s=1.13 cũng không bù được vgrad
   38% vs 59% + G7b FAIL. Nếu sau này đo lại ở điều kiện yên tĩnh mà
   divisor 4 tách được FPS rõ ràng thì mới xem xét lại (cần cả G7b
   mask — vd. divisor 2 riêng cho clip có mask).
4. **Tap KHÔNG phải yadif** (giới hạn cũ từ C8/D4, còn nguyên): R sau
   intermediate (0.50–0.66) rơi vào băng progressive/yadif theo metric
   C/S, nhưng đó là metric combing, không phải so sánh pixel với yadif.
5. **Thông lượng probe không dự đoán được FPS headed** (giới hạn cũ từ
   D4 §3.3, E1 xác nhận lại): probe nói qtrH nhanh nhất (0.16–0.41×
   chi phí vẽ thường) nhưng headed không tách được — vì tick bị chi
   phối bởi decode + tải, không phải lần vẽ.
6. **Half-res/halfLow/halfMed pixel y hệt nhau nhưng đó chỉ đúng ở
   downscale ĐÚNG 2×:** kết luận "smoothing quality không đổi pixel"
   không áp dụng cho divisor khác (divisor 4 dùng cùng quality "high"
   nhưng pixel khác hẳn half-res — do hình học resample khác, không
   phải do quality).
7. **Chưa đo:** Safari/WebKit thật (nợ cũ từ D4); tap + motion-blur-
   blend LÚC ĐANG PHÁT (nợ cũ từ D4); FPS trên máy thật có GPU (mọi
   số FPS chỉ đúng trên SwiftShader CPU của VM này); footage xen kẽ
   gốc từ camera (nợ cũ từ D4).
8. **Harness E1 chạy 11 slot FPS (5 tỉ lệ), khác D4 (7 slot, 3 tỉ
   lệ):** định nghĩa tỉ lệ drift-corrected không đổi, chỉ thêm mẫu —
   so sánh mean giữa các lần chạy vẫn hợp lệ, nhưng số lượng tỉ lệ
   khác nhau (3 vs 5) nên đừng so "3 tỉ lệ D4" với "5 tỉ lệ E1" mà
   không ghi rõ.
9. **File chung `preview.tsx` / `enhancePreview.ts` đang được nhiều
   luồng đợt 77 sửa song song:** batch này stage toàn bộ file ở trạng
   thái sau khi sửa E1 — parent gộp cần đối chiếu tsc lại sau khi gộp.
   (Trong lúc E1 làm việc, `tsc` một lần bắt 3 lỗi trong file test của
   luồng E7 đang sửa dở; E1 không đụng file đó và chạy lại sau thì 0
   lỗi. `preview.tsx`/`enhancePreview.ts` không bị sibling sửa trong
   lúc E1 làm — mtime giữ 09/11 18:26/18:27 cho tới khi E1 sửa.)

## 6. Nợ mở cho đợt sau

1. **G5: FPS deint-only vẫn chưa đóng — câu hỏi mở, nay có thêm dữ
   liệu.** Mọi đường 2 lần vẽ đều ~0.7–0.8× trong nhiễu đo hiện tại;
   đường 1 lần vẽ duy nhất đạt FPS (inline-shift 0.99×) lại không khử
   được combing ở upscale; tap2/blur1/qtrH đều đã loại bằng số đo.
   Hướng còn lại: (a) đo lại trên máy thật có GPU hoặc lúc VM yên
   tĩnh (SwiftShader + tải sibling có thể che mất chênh ~0.1);
   (b) đổi phương pháp đo FPS: đo thời gian tick vẽ trực tiếp (ms/
   tick, không lượng tử hoá theo số lần vẽ) thay vì đếm draw/3s —
   ở ~2 fps, đếm draw là điểm nghẽn thống kê chính; (c) xem xét nới
   ngưỡng 0.75× cho riêng deint-only (quyết định của user/parent,
   không tự nới); (d) giảm chi phí cố định của tick (decode) thay vì
   lần vẽ — ngoài phạm vi preview enhance.
2. C3 combo: phương pháp đo transient lúc phát quá nhạy tải (sàn căn
   chỉnh 3–4 ở ~2 fps) — cần làm C3 bớt nhạy tải (vd. khoá frame theo
   `requestVideoFrameCallback` thay vì so snapshot lệch pha) hoặc đo
   lại lúc VM yên tĩnh; residual = 0 cả 2 lần nên bản thân motion blur
   không có dấu hiệu hồi quy.
3. Đo lại vgrad trong app (không chỉ probe) cho half-res ở s=1.0 để
   quyết có nên giới hạn intermediate ở một dải tỉ lệ hay không (nợ cũ
   từ D4 §6.5 — vgrad probe 37% ở s=1.0 là mềm nhất).
4. Footage xen kẽ gốc từ camera (PAL/NTSC capture) và Safari/WebKit
   thật (nợ cũ từ D4 §6.3–6.4).

## 7. Cách chạy lại

```bash
# Probe E1 (9 mode R/vgrad/hgrad + thông lượng, ~2-3 phút, tải cao có thể timeout — đã tách evaluate):
node apps/web/scripts/probe-77e1-deint-fast.mjs
# Headed trong app (cửa sổ 2560x1440, ~5-6 phút, 11 slot FPS):
node apps/web/scripts/clicktest-77e1-deint-fps.mjs
# Hồi quy letterbox + combo:
node apps/web/scripts/clicktest-60q1-enhance-preview.mjs
node apps/web/scripts/clicktest-61r3-combo.mjs
# Unit test (vi + en):
./node_modules/.bin/esbuild apps/web/src/components/enhance/enhancePreview77E1.test.ts \
  --bundle --platform=node --format=cjs --outfile=/tmp/round77-e1/enhancePreview77E1.test.cjs \
  && node /tmp/round77-e1/enhancePreview77E1.test.cjs
VCUT_TEST_LANG=en node /tmp/round77-e1/enhancePreview77E1.test.cjs
```
