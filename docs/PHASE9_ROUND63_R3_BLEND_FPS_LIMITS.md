# PHASE 9 ĐỢT 63 — R3: FPS blend + thang blend preview enhance (piecewise)

**Trạng thái: ĐÃ LÀM + ĐÃ ĐO (code đổi) — KHÔNG push.**
Đóng nợ đợt 62 R3 §1 (FPS blend chưa kết luận được do baseline drift
39–49 fps) và §2.2 (blend overstate s=0.3 +9.9; nhiễu nặng flat40
-84.7% vs hqdn3d -26.7%; step-edge 4px ở a≥0.8). Mọi số dưới đây là
số đo thật trên VM này (4 vCPU, ~8GB RAM, CPU-only, headless Chromium
qua Xvfb + CDP — Chrome 158, chromium-1254, sau sự cố cache xem §5),
không ước lượng. Fixture video chỉ giữ script gen (không binary trong
batch); media đo nằm ở scratch `/home/hatch/workspace/.scratch-r61r3-1cOf/media/`
(đợt 61, dùng lại), probe JSON ở
`~/workspace/goals/capcut-clone-video-editor/hidden_files/round63-r3/blend-r63-probe.json`,
log FPS/Q1/probe ở cùng thư mục.

## 0. Thay đổi code trong đợt này

| File | Đổi gì |
|---|---|
| `apps/web/src/lib/enhancePreview.ts` | `denoiseBlendAlpha(strength)` đổi từ `a = strength` tuyến tính sang **piecewise-linear** qua 4 knot khớp hqdn3d: (0.3→0.195), (0.5→0.486), (0.8→0.806), (1→0.981). Bán kính blur vẫn cố định 3.0px. Clamp/NaN giữ nguyên (âm→0, >1→0.981, NaN→0). Không đổi `denoiseBlurPx`, `enhancePreviewPlan`, `preview.tsx` (chỉ comment). |
| `apps/web/src/components/enhance/enhancePreview63R3.test.ts` | **Mới**: 8 test khóa piecewise (knot, nội suy, đơn điệu, không vùng chết, clamp, plan/hook, ngưỡng edge). |
| `apps/web/src/components/enhance/enhancePreview62R3.test.ts` | Kỳ vọng alpha theo ánh xạ mới (0.195/0.486/0.806/0.981); comment lịch sử cập nhật. |
| `apps/web/src/components/enhance/enhancePreview61R3.test.ts` | Kỳ vọng alpha + số hiệu chuẩn theo ánh xạ mới. |
| `apps/web/src/components/enhance/enhancePreview60Q1.test.ts` | Kỳ vọng alpha theo ánh xạ mới (0.486/0.806). |
| `apps/web/scripts/probe-blend-r63.mjs` | **Mới**: probe 8 biến thể đường cong (xem §2) + hqdn3d đối chứng + lặp lại. |
| `apps/web/scripts/clicktest-61r3-fps-cal.mjs` | Hook kỳ vọng denoise/combo → alpha 0.486; `BLEND_CAL_FN`/`STEP_EDGE_FN` đo theo **strength** (map sang alpha piecewise trong trang — đúng cơ chế đã ship); verdict B theo strength; tìm Chrome trong mọi `chromium-*` còn trong cache (xem §5); chờ socket Xvfb thật thay cho sleep 900ms. |
| `apps/web/scripts/clicktest-60q1-enhance-preview.mjs` | Hook kỳ vọng alpha 0.5 → 0.486 (5 chỗ). |
| `apps/web/scripts/clicktest-61r3-combo.mjs` | Hook C6 kỳ vọng alpha 0.5 → 0.486. |
| `apps/web/src/preview.tsx` | **KHÔNG đổi** (đã hoàn lại comment: file chung đang được luồng R6 sửa song song nên batch này không đưa `preview.tsx` vào — tránh lẫn code dở của luồng khác; hành vi blend nằm hết trong `lib/enhancePreview.ts`, preview.tsx chỉ đọc plan). |

Không đụng `i18n/vi.json` / `en.json` (không thêm key mới), không đụng
spec/render. `preview.tsx` đã hoàn lại về trạng thái trước đợt này
(xem bảng §0): file chung đang được luồng R6 sửa song song nên batch
này không đưa nó vào — parent gộp bình thường, không có xung đột do
đợt này gây ra.

## 1. (1) FPS preview blend — ĐO LẠI 3 LẦN, KẾT LUẬN ĐƯỢC (TRONG GIỚI HẠN TẢI)

**Phương pháp:** như đợt 61/62 (9 slot xen kẽ `[B,D,B,S,B,I,B,C,B]`,
mẫu 3.0s/slot, tỉ lệ drift-corrected so với 2 baseline kề; warmup 6s).
Ngưỡng A FPS 0.75x **giữ nguyên, không nới** — cả 3 lần đều FAIL theo
thiết kế (xem dưới). Chạy 1 = code tuyến tính cũ (đợt 62), chạy 2–3 =
code piecewise mới; chi phí raster của 2 bản là như nhau (cùng 2 lần
`drawImage`, alpha chỉ đổi giá trị) nên 3 lần so sánh được với nhau về
FPS — xem ghi chú cuối §1.3.

### 1.1 Số liệu 3 lần chạy

| | Lần 1 (02:40, code cũ) | Lần 2 (03:09, code mới) | Lần 3 (03:18, code mới) |
|---|---|---|---|
| loadavg 1-phút trong lúc đo | 2.3 → 3.7 | 0.7 → 9.1 (tăng dần) | 10.5 → 23.9 (bùng nổ) |
| baseline 5 slot (fps) | 56.2 / 55.0 / 55.9 / 37.6 / 57.4 | 10.0 / 8.8 / 20.5 / 10.6 / 2.2 | 4.2 / 6.9 / 6.8 / 4.8 / 2.4 |
| baseline mean / drift | 52.4 / **19.7** | 10.4 / **18.3** | 5.0 / 4.4 (nhưng mức tuyệt đối sụp) |
| denoise (tỉ lệ vs baseline kề) | 26.6 fps → **0.48x** | 4.9 fps → **0.52x** | 0.54 fps → **0.10x** ⚠️ |
| stabilize | 49.7 fps → 0.90x | 9.1 fps → 0.62x | 4.8 fps → 0.71x |
| deinterlace (no-op, đối chứng) | 58.3 fps → **1.25x** | 15.1 fps → 0.97x | 1.7 fps → **0.29x** |
| combo (tỉ lệ vs baseline kề) | 22.0 fps → **0.46x** | 3.6 fps → **0.56x** | 1.8 fps → **0.49x** |
| playhead combo | 1.032x | 0.959x | 1.127x |
| A-hook (9 slot) | PASS | PASS | PASS |
| A FPS (ngưỡng 0.75x) | **FAIL** | **FAIL** | **FAIL** |
| A2 micro-bench | PASS (+0.011ms) | — (harness chết sau A) | — (harness chết sau A) |
| B / D / H9 | 7/8 (B PASS, xem §1.4) | **harness lỗi** (CDP timeout 60s sau A) | **harness lỗi** (CDP timeout 60s sau A) |

⚠️ **Lần 3 denoise 0.10x là rác đo, không phải chi phí thật:** slot đó
chỉ vẽ được n=6 frame trong 3s (gapP50 1316ms — trình duyệt bị đói CPU
hoàn toàn ở load 15.9), và đối chứng no-op deinterlace cùng lần đo
được 0.29x (một no-op không thể tốn 71% tốc độ vẽ) — tỉ lệ lần 3 chỉ
dùng được cho combo (0.49x, n=12) với độ tin cậy thấp. Lần 2 cũng
nhiễu nặng (stabilize — chỉ zoom, rẻ — đo được 0.62x; baseline sụp
20.5→2.2 fps trong cùng 1 lần chạy khi load tăng 0.7→9.1).

### 1.2 Kết luận FPS (trung thực)

- **Denoise blend: ~0.48–0.52x baseline** (2 lần chạy dùng được: 0.48x,
  0.52x; lần 3 bỏ vì rác đo). **Combo: 0.46x / 0.56x / 0.49x → trung
  vị ~0.49x.** Playhead vẫn tiến đúng ~1.0x ở mọi slot (timeline không
  lag — rAF bị giãn nhưng playhead bù bằng `lostMs`, không phải do
  enhance làm chậm phát).
- **Blend ĐẮT HƠN blur thuần đợt 61 (0.60x denoise / 0.62x combo,
  đo lúc VM yên, drift 1.7 fps):** hợp lý về mặt cơ chế — blend vẽ
  **2 lần** `drawImage` (gốc + bản mờ) trong khi blur thuần chỉ vẽ 1
  lần có filter; lần vẽ gốc thêm là chi phí thật trên đường raster
  SwiftShader. Chênh lệch 0.48–0.52x vs 0.60x nằm trong cùng thứ tự
  với nhiễu tải của đối chứng no-op (lần 1: 1.25x, tức ±25%), nên
  không khẳng định được chính xác "blend đắt hơn blur thuần bao nhiêu
  %" — chỉ khẳng định được **blend không rẻ hơn blur thuần, và cả hai
  đều tụt ~50% FPS preview trên VM CPU-only này**.
- **Ngưỡng 0.75x vẫn FAIL ở cả 3 lần — giữ nguyên, không nới.**
  Đây là giới hạn thật của preview enhance trên VM CPU-only, không
  phải lỗi đo: ngay cả lần 1 (yên nhất, load 2.3–3.7, baseline
  52 fps) combo cũng chỉ 0.46x.
- **Micro-bench A2 vẫn đánh giá thấp chi phí thật** (nợ đợt 61 §6.6,
  còn nguyên): lần 1 đo blend a=0.5 thêm +0.011ms/frame ở 488×275
  (0.015ms vs plain 0.004ms) trong khi headed đo tụt ~50% FPS —
  micro-bench canvas tách rời không phản ánh chi phí raster thật
  (xem LIMITS đợt 62 §1). A2 chỉ để tham khảo, không dùng làm bằng
  chứng chi phí.

### 1.3 Vì sao không đo được "lúc VM yên" thật sự

Cả 3 lần chạy đều bị các luồng R63 khác chạy song song phá yên: lần 2
load tăng 0.7→9.1 giữa chừng (vite build + ffmpeg render của luồng
khác), lần 3 load bùng 10.5→23.9 (ffmpeg render R2/R8 + 2 tiến trình
`node -e while(true){Math.sqrt}` đốt CPU từ 03:13 + tsc desktop).
Không có cửa sổ nào trong ca làm việc này mà VM thật sự yên (load
1-phút < 1.0 kéo dài đủ 4 phút cho 1 lần fps-cal). Số trên là tốt
nhất đo được trong điều kiện đó; tỉ lệ drift-corrected + đối chứng
no-op là cách duy nhất tách được tín hiệu khỏi nhiễu tải, và chúng
đồng thuận ở combo ~0.5x qua cả 3 lần chạy dù mức tuyệt đối khác nhau
10 lần (52 fps → 5 fps baseline) — đó là bằng chứng mạnh nhất rằng
tỉ lệ ~0.5x là chi phí thật của cơ chế, không phải nhiễu.

### 1.4 Phần B lần 1 (code tuyến tính cũ) — tái tạo đúng số đợt 62

BLEND 720p flat15: s=0.3 → -28.7% (hqdn3d -19%, sai 9.7), s=0.5 →
-47.0% (sai 0), s=0.8 → -72.6% (sai 1.4), s=1.0 → -83.7% (sai 0.7);
step-edge 0px ở s≤0.5, 4px ở s≥0.8; 488×275: -29.5/-47.9/-74.4/-87%.
B PASS (maxErr 9.7 ≤ 10). Lần 2–3 harness chết sau phần A (CDP
`Runtime.evaluate` timeout 60s ở tab trắng, load 10–24) nên **không
có B-headed cho đường cong piecewise mới** — đường cong mới được kiểm
chứng bằng probe-blend-r63 (cùng phương pháp, cùng metric, cùng
fixture, lặp lại cho cùng số — xem §2) + unit test khóa ánh xạ (§4).
Đây là giới hạn kiểm chứng của đợt này, ghi rõ — không mạo nhận B
headed đã chạy.

## 2. (2) Đường cong blend mới: piecewise — KHỚP hqdn3d (sai tối đa 1.3)

**Phương pháp:** probe-blend-r63 (Chrome 158, tab trắng): composite
đúng cơ chế `preview.tsx` ((1-a)·gốc + a·blur(3.0px)), đo giảm std RGB
mean vùng trung tâm + step-edge 25–75% ở 4 mức strength thật, trên 4
dataset (flat15/flat40 × 720p/preview 488×275) + hqdn3d cùng metric +
lặp lại. V0 linear tái tạo **y hệt** số đợt 62 (-28.9/-48.4/-73.6/-83.7)
dù đổi Chrome 1248 → 158 — chứng tỏ số đo không phụ thuộc phiên bản
trình duyệt, và mọi biến thể so sánh được với nhau.

### 2.1 Kết quả — flat15 720p (mục tiêu hqdn3d: -19 / -47 / -74 / -83%)

| Biến thể | s=0.3 | s=0.5 | s=0.8 | s=1.0 | Sai tối đa | Edge s=0.8 / 1.0 |
|---|---|---|---|---|---|---|
| **V0 linear a=s (cũ)** | -28.9 (+9.9) | -48.4 (+1.4) | -73.6 (-0.4) | -83.7 (+0.7) | **9.9** | 4px / 4px |
| V1 pow a=s^1.25 | -21.5 (+2.5) | -39.9 (-7.1) | -69.9 (-4.1) | -83.7 (+0.7) | 7.1 | 2px / 4px |
| V2 pow a=s^1.5 | -16.3 (-2.7) | -33.6 (-13.4) | -66.5 (-7.5) | -83.7 (+0.7) | 13.4 | 2px / 4px |
| **V3 piecewise (CHỌN)** | **-18.5 (-0.5)** | **-45.7 (-1.3)** | **-73.8 (-0.2)** | **-82.9 (-0.1)** | **1.3** | 4px / 4px |
| V5 taper B=3-1.0a | -28.1 (+9.1) | -46.9 (+0.1) | -68.3 (-5.7) | -77.1 (-5.9) | 9.1 | 2px / 4px |
| V6 taper B=3-1.5a | -28.1 (+9.1) | -45.7 (-1.3) | -59.8 (-14.2) | -67.6 (-15.4) | 15.4 | 2px / 2px |
| V7 dual 0.5·B1.5+0.5·B3 | -24.8 (+5.8) | -39.8 (-7.2) | -56.9 (-17.1) | -67.1 (-15.9) | 17.1 | 2px / 2px |

**V3 piecewise thắng toàn diện trên flat15:** sai tối đa 1.3 (cũ 9.9),
lặp lại cho cùng số đến 0.1% (-18.5/-45.7/-73.8/-82.9 ở cả 2 lần chạy).
Ở khổ preview 488×275: V3 cho -18.4/-45.8/-76.2/-85.3 (sai 0.6/1.2/
2.2/2.3 — V0 ở khổ này sai tới 10.5/3.4/2.1/4.0). **Không phải overfit
theo 1 fixture:** cùng 1 đường cong khớp cả 720p lẫn preview (2 khổ,
2 lần lặp). Đường cong đơn điệu tăng thật, a>0 luôn đổi pixel (hết
vùng chết), a(1)=0.981 < 1 (không blur toàn phần — đúng vì hqdn3d
s=1.0 cũng chỉ -83%).

**Vì sao không dùng lũy thừa:** a cần để khớp đúng 4 mốc là
0.195/0.486/0.806/0.981 — không theo luật lũy thừa gọn nào (p fit ra
1.36/1.04/0.97 ở 3 mốc, đợt 62 đã ghi); p=1.25 sửa được đầu thấp
nhưng làm tụt đầu giữa (-7.1 ở s=0.5). Piecewise-linear qua 4 mốc là
lựa chọn duy nhất trong các biến thể thử mà khớp cả 4 mốc.

### 2.2 Trên nhiễu nặng flat40 — VẪN overstate (không biến thể nào cứu được)

hqdn3d flat40: s=0.5 → -5.0%, s=1.0 → -26.7% (chỉ có PNG hq40 ở 2
mức này). Mọi biến thể không gian cho gần như Y HỆT flat15:

| Biến thể | flat40 s=0.5 | flat40 s=1.0 |
|---|---|---|
| V0 linear | -47.9% (hqdn3d -5.0%) | -84.7% (hqdn3d -26.7%) |
| **V3 piecewise (đã ship)** | **-46.3%** | **-84.4%** |
| V1 pow1.25 | -40.1% | -84.7% |

Nguyên nhân: với xấp xỉ không gian tuyến tính, mức giảm std gần như
không phụ thuộc mức nhiễu gốc (V0 flat15 vs flat40 chênh nhau ≤1%
ở mọi mức) — trong khi hqdn3d có thành phần thời gian + thích nghi
theo mức nhiễu nên giảm tương đối ít hơn nhiều trên nhiễu nặng. Muốn
đúng hơn nữa cần xấp xỉ ước lượng mức nhiễu của frame rồi scale alpha
theo đó — việc riêng, chưa có thiết kế (xem §6.2).

### 2.3 Blend có ngưỡng theo độ lệch pixel — ĐÃ THỬ, LOẠI (số liệu)

Ý tưởng: w_c = a·max(0, 1-|blur-orig|/T) theo từng kênh — lệch lớn
(cạnh) → giữ gốc, lệch nhỏ (nhiễu) → blend mạnh. Kết quả ngược mong
đợi (flat15 720p):

| Biến thể | s=0.3 | s=0.5 | s=0.8 | s=1.0 | Edge |
|---|---|---|---|---|---|
| V4 T=12 | -1.2% | -1.4% | -2.4% | -3.1% | 0px mọi mức |
| V4 T=24 | -5.7% | -8.7% | -13.6% | -16.1% | 0px mọi mức |
| V4 T=40 | -12.6% | -20.1% | -31.1% | -37.4% | 0px mọi mức |
| V8 T=24 + piecewise | -3.6% | -8.7% | -13.7% | -16.0% | 0px mọi mức |

Edge giữ hoàn hảo (0px ở mọi mức, kể cả s=1.0) NHƯNG khử nhiễu sụp
hẳn: tối đa -16% ở s=1.0 so với mục tiêu -83%. Lý do: pixel mà blur
đổi mạnh nhất chính là pixel nhiễu cần khử — ngưỡng loại đúng những
pixel đó (w≈0 ở |d| lớn), chỉ blend những pixel vốn đã gần như không
đổi. Trên flat40, T=24 cho -0.4%/-1.1% (gần như tắt hẳn khử nhiễu —
"khớp" hqdn3d -5.0%/-26.7% theo hướng sai: tắt luôn cả trường hợp
thường). **Kết luận: ngưỡng theo |blur-orig| là sai biến điều khiển
cho bài toán này** (nó phân biệt cạnh/nhiễu bằng độ lớn lệch, nhưng
nhiễu trắng cũng có lệch lớn). Chưa kể chi phí sản phẩm: per-pixel JS
trên từng frame preview (probe 720p mất ~43s cho 4 dataset — ở
488×275 vẫn ~ms/frame) sẽ phá FPS vốn đã 0.5x; không có cách làm
tương đương bằng canvas-op 2D mà không thêm nhiều pass vẽ. **Dừng
hướng này, đã ghi rõ đã thử gì và vì sao dừng.**

### 2.4 Step-edge — VẪN 4px ở s≥0.8 (đã thử, chưa giải quyết được)

- V3 piecewise: edge 0px ở s≤0.5 (a≤0.486 < ngưỡng 0.6), 2px ở
  a=0.6–0.7, **4px ở s≥0.8** (a≥0.806) — bằng blur thuần ở s=1.0.
- V6 taper B=3-1.5a: edge 2px ở cả s=0.8 lẫn s=1.0, NHƯNG đường cong
  vỡ ở đầu cao (s=1.0 chỉ -67.6%, sai -15.4; s=0.8 sai -14.2) — đổi
  2px edge lấy 15 điểm sai số là không đáng.
- V5 taper B=3-1.0a: edge 2px ở s=0.8 nhưng vẫn 4px ở s=1.0, sai
  -5.9 ở s=1.0 — nửa vời cả hai phía.
- V7 dual-radius: edge 2px ở s≥0.8 nhưng sai -17.1/-15.9 ở đầu cao.
- V4 ngưỡng: edge 0px mọi mức nhưng giết khử nhiễu (xem §2.3).
- **Quyết định: giữ B=3.0 cố định + V3, chấp nhận edge 4px ở
  strength cao.** Preview ở strength cao vẫn mềm hơn render thật —
  nợ mở, xem §6.1. Hướng tương lai duy nhất còn lại là xấp xỉ
  edge-preserving thật (bilateral-like) — cần thiết kế riêng + đo
  FPS lại, không làm nửa vời trong đợt này.

## 3. Kiểm chứng

| Kiểm chứng | Kết quả |
|---|---|
| Unit mới `enhancePreview63R3.test.ts` | **8/8** |
| Unit `enhancePreview62R3.test.ts` (kỳ vọng mới) | **10/10** |
| Unit hiệu chuẩn `enhancePreview61R3.test.ts` (kỳ vọng mới) | **7/7** |
| Q1 unit `enhancePreview60Q1.test.ts` vi | **16/16** |
| P8 unit `enhancePresets59P8.test.ts` vi | **21/21** |
| Speed-block R2 `enhanceSpeedBlock61R2.test.ts` vi | **9/9** |
| previewEngine (`previewEngine.test.ts`) | **14 pass** |
| `tsc --noEmit` (apps/web) | **ĐỎ 1 lỗi duy nhất, KHÔNG phải file đợt này**: `src/lib/decoderPlayback63R6.test.ts(130,51)` (luồng R63 khác đang sửa — xem §6.4). Không có lỗi nào ở file đợt này. |
| `vite build` (chỉ vite, không tsc) | **pass** (18s, cảnh báo chunk >500kB có từ trước) |
| Headed fps-cal lần 1 (code cũ) | A-hook PASS, A FPS FAIL theo thiết kế (0.46x), A2 PASS, **B PASS** (tái tạo số đợt 62), 7/8 |
| Headed fps-cal lần 2–3 (code mới) | A-hook PASS, A FPS FAIL theo thiết kế (0.56x / 0.49x); **harness lỗi sau A** (CDP timeout 60s, load 10–24) — B/D không chạy được (xem §1.4) |
| Headed Q1 (sau khi đổi cơ chế) | **7/7 pass** (§3.1 — hook alpha 0.486, pixel đổi thật, tắt toggle về đúng gốc) |
| Headed combo (C3/C6, sau khi đổi cơ chế) | **9/9 pass** (§3.2 — C6 hook alpha 0.486 + speed-block, C3 tồn dư sau pause 0) |
| Probe blend r63 (`probe-blend-r63.mjs`) | **EXIT 0** — 8 biến thể × 4 dataset + hqdn3d + lặp lại (xem §2) |

### 3.1 Headed Q1 (sau khi đổi cơ chế) — 7/7 pass

Harness Q1 chạy lại sau khi sửa hằng (log `q1-after.log`, EXIT 0):
B1 (denoise bật, alpha 0.486): pixel A→B mean abs diff **0.9843**,
41.1% channel đổi (đợt 62, alpha 0.5: 0.8125, 31.62% — khác frame mẫu
nên số tuyệt đối khác, cùng thứ tự độ lớn; hook alpha 0.486 chính
xác). B3: tắt toggle → pixel A→D mean **0** (trả đúng khung gốc). B4:
bật lại → hook blur 3.0 + alpha 0.486 + zoom 1.023. B5: deinterlace
0 pixel đổi (như thiết kế). H9: 0 lỗi trang.

### 3.2 Headed combo (sau khi đổi cơ chế) — 9/9 pass

Harness combo chạy lại sau khi sửa hằng (log `combo-after.log`,
EXIT 0): C6 hook full combo — blur 3.0 + alpha **0.486**, zoom 1
(stabilize bị chặn vì có speed ramp), applied [denoise],
notApproximated [deinterlace, stabilize], offscreen true. C3 motion
blur: tồn dư sau pause **0** (sàn 0 — fix đợt 62 còn nguyên, không bị
đường cong mới phá), transient lúc phát 3.6166 (gấp 3.7x sàn căn
chỉnh). C5 pixel-identical, C7 pipeline sống.

## 4. FPS — ghi chú bắt buộc (theo nhiệm vụ)

**Mọi số FPS trong file này chỉ đúng cho headless Chromium/SwiftShader
trên VM CPU-only này (4 vCPU, không GPU) — CHƯA ĐO trên máy có GPU
thật.** Trên máy có GPU thật, chi phí raster (blur 3px + lần vẽ gốc
thêm của blend) có thể rẻ hơn nhiều so với SwiftShader CPU, và tỉ lệ
~0.5x này có thể không còn đúng. Không suy ra kết luận nào về FPS
trên máy người dùng từ số đo này ngoài "cơ chế blend tốn thêm 1 lần
vẽ gốc so với blur thuần".

## 5. Sự cố hạ tầng trong đợt này (ảnh hưởng các luồng khác nữa)

1. **Chromium Playwright biến mất khỏi cache** giữa 2 lần chạy
   (02:44 08/11: `~/.cache/ms-playwright/chromium-1248` còn lúc
   fps-cal lần 1 chạy xong, mất lúc probe chạy — có lẽ luồng khác dọn
   cache hoặc cài lại). Đã xử lý: `npx playwright@1.55.0 install
   chromium` (tải Chromium 140, build 1187 — nhưng bản đó thiếu
   `chrome-linux64/chrome`); trong cache đồng thời xuất hiện
   `chromium-1254` (Chrome 158.0.8127.18 — có lẽ luồng khác cài) và
   đã dùng bản đó. Cả 2 script (probe + fps-cal) nay **tìm mọi bản
   `chromium-*` còn trong cache, ưu tiên bản mới nhất** thay vì khóa
   cứng 1248. `/opt/meta-chromium/chrome` (Muse Browser 155) **không
   dùng được standalone** (lỗi `Hatch WebGL domain policy is required
   for browser startup`) — đã thử và bỏ.
2. **Socket X mồ côi + TMPDIR không tồn tại** làm Xvfb/Chrome chết
   lặng (probe lỗi `không lấy được page target CDP` 2 lần): display
   cố định :178 bị socket cũ chặn; `TMPDIR=/tmp/round63-r3/tmp`
   chưa từng được tạo (VM reboot gần đây, /tmp bị dọn). Đã sửa: quét
   display trống + dọn socket mồ côi (như fps-cal), chờ socket X
   xuất hiện thật thay cho sleep 900ms, `mkdir -p` TMPDIR. Cả 2
   script đều đã vá.
3. **VM không yên trong cả ca làm việc** (xem §1.3): 8–10 luồng R63
   chạy song song (ffmpeg render, vite build, tsc, Chrome headed, 2
   tiến trình `node -e while(true)` đốt CPU từ 03:13). Mọi đo FPS
   headed đều phải đọc kèm loadavg từng slot.

## 6. Nợ mở (thêm trong đợt này)

1. **Step-edge vẫn 4px ở s≥0.8** (§2.4) — preview strength cao mềm
   hơn render thật. Các hướng đã thử đều không đạt (taper phá đường
   cong, ngưỡng giết khử nhiễu). Hướng tương lai: xấp xỉ
   edge-preserving thật (bilateral-like) + đo FPS lại — việc riêng.
2. **Blend vẫn overstate trên nhiễu nặng (flat40)** (§2.2): V3 cho
   -84.4% vs hqdn3d -26.7% ở s=1.0. Cần xấp xỉ ước lượng mức nhiễu
   của frame rồi scale alpha theo đó — việc riêng, chưa có thiết kế.
3. **FPS enhance trên máy có GPU thật chưa đo** — mọi số FPS chỉ
   đúng cho headless Chromium/SwiftShader trên VM CPU-only (nợ cũ từ
   đợt 61, còn nguyên; xem §4).
4. **`tsc --noEmit` toàn repo đang ĐỎ 1 lỗi do luồng R63 khác**
   (`decoderPlayback63R6.test.ts`, R6) — parent cần chạy lại tsc sau
   khi gộp các luồng. `vite build` (không tsc) pass.
5. **B-headed cho đường cong piecewise chưa chạy được** (§1.4):
   fps-cal lần 2–3 chết sau phần A do CDP timeout dưới tải 10–24;
   đường cong mới chỉ được kiểm chứng bằng probe (cùng phương pháp/
   metric/fixture, lặp lại) + unit test. Lượt sau có cửa sổ yên nên
   chạy lại fps-cal 1 lần để lấy B-headed cho đủ.
6. **Micro-benchmark canvas tách rời vẫn đánh giá thấp chi phí
   filter** (nợ đợt 61 §6.6, còn nguyên): A2 chỉ để tham khảo.
7. **D3 (combing preview ở full-res) chưa đo** — nợ cũ đợt 61 §6.4,
   còn nguyên (harness fps-cal D3 đo ở kích thước preview).
8. **Chromium trong cache không ổn định** (§5.1): bản 1248 biến mất
   giữa ca làm việc; các luồng sau nên dùng logic tìm `chromium-*`
   đã vá trong 2 script này thay vì khóa cứng đường dẫn.
